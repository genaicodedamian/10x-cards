// src/lib/openrouter/OpenRouterService.ts
import type { ChatCompletionRequest, ChatCompletionResponse, OpenRouterServiceConfig } from "./types";
import {
  OpenRouterApiError,
  OpenRouterAuthError,
  OpenRouterInvalidRequestError,
  OpenRouterRateLimitError,
  OpenRouterTimeoutError,
} from "./types";

// Helper do opóźnienia
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel?: string;
  private readonly httpReferer?: string;
  private readonly siteName?: string;
  private readonly maxRetries: number;
  private readonly requestTimeoutMs: number;

  constructor(config?: Partial<OpenRouterServiceConfig>) {
    // Handle both local development (import.meta.env) and Cloudflare Workers (process.env)
    let apiKeyFromEnv: string | undefined;
    
    try {
      // Try import.meta.env first (local development)
      apiKeyFromEnv = import.meta.env.OPENROUTER_API_KEY;
    } catch {
      // Fallback to process.env (Cloudflare Workers)
      apiKeyFromEnv = process.env.OPENROUTER_API_KEY;
    }
    
    // If still undefined, try process.env as backup
    if (!apiKeyFromEnv) {
      apiKeyFromEnv = process.env.OPENROUTER_API_KEY;
    }
    
    this.apiKey = config?.apiKey || apiKeyFromEnv || ""; // Initialize with empty string if undefined
    if (!this.apiKey) {
      console.error(
        "OpenRouter API Key is not configured. Please set OPENROUTER_API_KEY environment variable."
      );
      // Log the value retrieved to help debug
      console.error(`Final apiKeyFromEnv value: '${apiKeyFromEnv}'`);
      throw new Error("OpenRouter API Key is missing.");
    }

    this.baseUrl = config?.baseUrl || "https://openrouter.ai/api/v1";
    this.defaultModel = config?.defaultModel;
    this.httpReferer = config?.httpReferer || process.env.YOUR_SITE_URL;
    this.siteName = config?.siteName || process.env.YOUR_SITE_NAME;
    this.maxRetries = config?.defaultMaxRetries ?? 3;
    this.requestTimeoutMs = config?.defaultTimeoutMs ?? 30000; // 30 sekund
  }

  private _buildRequestPayload(request: ChatCompletionRequest): Record<string, unknown> {
    const rawPayload: Record<string, unknown> = {
      messages: request.messages,
      temperature: request.temperature,
      max_tokens: request.max_tokens,
      top_p: request.top_p,
      response_format: request.response_format,
      provider: request.provider,
      stream: request.stream ?? false,
    };

    if (request.models && request.models.length > 0) {
      rawPayload.models = request.models;
    } else {
      rawPayload.model = request.model || this.defaultModel;
    }

    if (!rawPayload.model && (!rawPayload.models || (rawPayload.models as string[]).length === 0)) {
      throw new OpenRouterInvalidRequestError("Model name or models list must be provided.");
    }

    // Usuń niezdefiniowane klucze, budując nowy obiekt
    const finalPayload: Record<string, unknown> = {};
    for (const key in rawPayload) {
      if (Object.prototype.hasOwnProperty.call(rawPayload, key) && rawPayload[key] !== undefined) {
        finalPayload[key] = rawPayload[key];
      }
    }
    return finalPayload;
  }

  private async _fetchWithRetry(url: string, options: RequestInit, attempt = 1): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429 && attempt <= this.maxRetries) {
          const retryAfterHeader = response.headers.get("Retry-After");
          let retryAfterSeconds = parseInt(retryAfterHeader || "5", 10);
          if (isNaN(retryAfterSeconds) || retryAfterSeconds <= 0) {
            retryAfterSeconds = Math.pow(2, attempt);
          }
          console.warn(
            `OpenRouterService: Rate limit exceeded. Retrying after ${retryAfterSeconds}s (attempt ${attempt}/${this.maxRetries})...`
          );
          await delay(retryAfterSeconds * 1000);
          return this._fetchWithRetry(url, options, attempt + 1);
        }
        if (response.status >= 500 && response.status <= 599 && attempt <= this.maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.warn(
            `OpenRouterService: Server error (${response.status}). Retrying in ${waitTime / 1000}s (attempt ${attempt}/${this.maxRetries})...`
          );
          await delay(waitTime);
          return this._fetchWithRetry(url, options, attempt + 1);
        }
        return response;
      }
      return response;
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      const errorName = error instanceof Error ? error.name : "UnknownError";
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";

      if (errorName === "AbortError") {
        if (attempt <= this.maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.warn(
            `OpenRouterService: Request timed out. Retrying in ${waitTime / 1000}s (attempt ${attempt}/${this.maxRetries})...`
          );
          await delay(waitTime);
          return this._fetchWithRetry(url, options, attempt + 1);
        }
        throw new OpenRouterTimeoutError(`Request timed out after ${this.maxRetries} attempts.`);
      }
      if (attempt <= this.maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.warn(
          `OpenRouterService: Network error (${errorMessage}). Retrying in ${waitTime / 1000}s (attempt ${attempt}/${this.maxRetries})...`
        );
        await delay(waitTime);
        return this._fetchWithRetry(url, options, attempt + 1);
      }
      throw error;
    }
  }

  private async _parseError(response: Response): Promise<OpenRouterApiError> {
    let errorDetails: unknown;
    try {
      errorDetails = await response.json();
    } catch {
      errorDetails = { message: response.statusText || "Failed to parse error response" };
    }

    const detailsObj = errorDetails as Record<string, unknown>; // Type assertion for access
    const message =
      (detailsObj?.error as { message: string })?.message ||
      (detailsObj?.message as string) ||
      `API request failed with status ${response.status}`;

    if (response.status === 401) {
      return new OpenRouterAuthError(message, errorDetails);
    }
    if (response.status === 400) {
      return new OpenRouterInvalidRequestError(message, errorDetails);
    }
    if (response.status === 429) {
      const retryAfterHeader = response.headers.get("Retry-After");
      const retryAfterSeconds = parseInt(retryAfterHeader || "0", 10);
      return new OpenRouterRateLimitError(message, retryAfterSeconds > 0 ? retryAfterSeconds : undefined, errorDetails);
    }
    return new OpenRouterApiError(message, response.status, errorDetails);
  }

  public async getChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const payload = this._buildRequestPayload(request);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };

    if (this.httpReferer) {
      headers["HTTP-Referer"] = this.httpReferer;
    }
    if (this.siteName) {
      headers["X-Title"] = this.siteName;
    }

    const response = await this._fetchWithRetry(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw await this._parseError(response);
    }

    try {
      const data = await response.json();
      return data as ChatCompletionResponse;
    } catch (error: unknown) {
      console.error("OpenRouterService: Failed to parse JSON response.", error);
      throw new OpenRouterApiError("Failed to parse JSON response from OpenRouter.", response.status, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
