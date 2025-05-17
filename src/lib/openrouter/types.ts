// src/lib/openrouter/types.ts

export interface OpenRouterServiceConfig {
  apiKey?: string; // Optional here as it's read from env if not provided
  baseUrl?: string;
  defaultModel?: string;
  httpReferer?: string;
  siteName?: string;
  defaultMaxRetries?: number;
  defaultTimeoutMs?: number;
}

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface JsonSchemaProperty {
  type: string;
  description?: string;
  enum?: string[];
  items?: JsonSchemaProperty | { type: string }; // For arrays
  properties?: Record<string, JsonSchemaProperty>; // For nested objects
  required?: string[]; // For nested objects
  [key: string]: unknown; // Allow other schema properties
}

export interface JsonSchema {
  name: string;
  strict?: boolean;
  schema: {
    type: "object";
    properties: Record<string, JsonSchemaProperty>;
    required?: string[];
    [key: string]: unknown; // Allow other schema properties
  };
}

export interface ResponseFormat {
  type: "json_schema";
  json_schema: JsonSchema;
}

// Minimalna definicja dla uproszczenia
export interface ProviderOptions {
  order?: string[];
  allow_fallbacks?: boolean;
  // ... inne opcje zgodnie z dokumentacją OpenRouter
}

export interface ChatCompletionRequest {
  messages: Message[];
  model?: string;
  models?: string[];
  response_format?: ResponseFormat;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean; // Strumieniowanie nie jest w pełni zaimplementowane w tym planie
  provider?: ProviderOptions;
  // Inne dozwolone parametry OpenRouter API
  [key: string]: unknown;
}

export interface ResponseMessage {
  role: "assistant";
  content: string;
}

export interface Choice {
  message: ResponseMessage;
  // ... inne pola jak finish_reason
}

export interface UsageStats {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletionResponse {
  id: string;
  choices: Choice[];
  created: number;
  model: string;
  object: string;
  usage?: UsageStats;
  // ... inne pola
}

// Typy błędów
export class OpenRouterApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "OpenRouterApiError";
    Object.setPrototypeOf(this, OpenRouterApiError.prototype);
  }
}
export class OpenRouterAuthError extends OpenRouterApiError {
  constructor(message = "Authentication failed. Check your API key.", details?: unknown) {
    super(message, 401, details);
    this.name = "OpenRouterAuthError";
    Object.setPrototypeOf(this, OpenRouterAuthError.prototype);
  }
}
export class OpenRouterRateLimitError extends OpenRouterApiError {
  constructor(
    message = "Rate limit exceeded.",
    public retryAfter?: number,
    details?: unknown
  ) {
    super(message, 429, details);
    this.name = "OpenRouterRateLimitError";
    Object.setPrototypeOf(this, OpenRouterRateLimitError.prototype);
  }
}
export class OpenRouterTimeoutError extends OpenRouterApiError {
  constructor(message = "Request timed out.") {
    super(message, 408); // 408 Request Timeout
    this.name = "OpenRouterTimeoutError";
    Object.setPrototypeOf(this, OpenRouterTimeoutError.prototype);
  }
}
export class OpenRouterInvalidRequestError extends OpenRouterApiError {
  constructor(message = "Invalid request.", details?: unknown) {
    super(message, 400, details);
    this.name = "OpenRouterInvalidRequestError";
    Object.setPrototypeOf(this, OpenRouterInvalidRequestError.prototype);
  }
}
