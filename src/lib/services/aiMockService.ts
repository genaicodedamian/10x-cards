// import type { FlashcardDto } from "../../types";

/**
 * Represents the successful output of the mock LLM regeneration process.
 */
export interface MockRegenerateResult {
  newFront: string;
  newBack: string;
  modelUsed: string;
}

/**
 * Represents an error specifically from the Mock LLM service.
 */
export class MockLLMError extends Error {
  public readonly statusCode: 429 | 500 | 503;
  public readonly errorCode: string;
  public readonly modelUsed: string; // Model that was attempted

  constructor(
    message: string,
    statusCode: 429 | 500 | 503,
    errorCode: string,
    modelUsed = "mock-regenerator-v1-error"
  ) {
    super(message);
    this.name = "MockLLMError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.modelUsed = modelUsed;
  }
}

export type MockErrorType = "rateLimit" | "serverError" | "unavailable";

/**
 * Simulates regenerating flashcard content using a mock LLM service.
 *
 * @param currentFront The current front content of the flashcard.
 * @param currentBack The current back content of the flashcard.
 * @param options Optional parameters to control mock behavior, e.g., error simulation.
 * @returns A promise that resolves to an object containing the new front, new back, and model used.
 * @throws {MockLLMError} If error simulation is triggered.
 */
export async function mockRegenerateFlashcardContent(
  currentFront: string,
  currentBack: string,
  options?: { simulateError?: MockErrorType }
): Promise<MockRegenerateResult> {
  // Simulate a short network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  const modelUsed = "mock-regenerator-v1";

  if (options?.simulateError) {
    if (options.simulateError === "rateLimit") {
      throw new MockLLMError(
        "Too many requests to the AI service. Please try again later.",
        429,
        "MOCK_RATE_LIMIT_EXCEEDED",
        modelUsed
      );
    }
    if (options.simulateError === "serverError") {
      throw new MockLLMError(
        "Internal Server Error. Failed to regenerate flashcard from mock LLM.",
        500,
        "MOCK_LLM_SERVER_ERROR",
        modelUsed
      );
    }
    if (options.simulateError === "unavailable") {
      throw new MockLLMError(
        "AI service is temporarily unavailable. Please try again later.",
        503,
        "MOCK_SERVICE_UNAVAILABLE",
        modelUsed
      );
    }
  }

  const newFront = `Mock Regenerated: ${currentFront}`;
  const newBack = `Mock Regenerated: ${currentBack}`;

  return {
    newFront,
    newBack,
    modelUsed,
  };
}

// Example of how error simulation could be structured later:
// export class MockLLMError extends Error {
//   constructor(message: string, public statusCode: 429 | 500 | 503) {
//     super(message);
//     this.name = 'MockLLMError';
//   }
// }
