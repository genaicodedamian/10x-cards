# API Documentation: Flashcard Generation

## Endpoint: `POST /api/ai/generate-flashcards`

**Purpose**: Generates mock flashcard suggestions based on a provided text. This endpoint is intended for initial development and testing, simulating responses from an AI model.

### Request Details

-   **Method**: `POST`
-   **URL**: `/api/ai/generate-flashcards`
-   **Authentication**: Currently, this endpoint operates using a `DEFAULT_USER_ID` (`00000000-0000-0000-0000-000000000000`) defined in the backend. No JWT or user-specific authentication is required for this mock phase.
-   **Headers**:
    -   `Content-Type: application/json`
-   **Body**: The request body must be a JSON object conforming to the `AIGenerateFlashcardsCommand` type.
    
    ```json
    {
      "text": "string"
    }
    ```
    -   `text` (string, required): The source text for generating flashcards. Must be between 1000 and 10000 characters long.

### Success Response (200 OK)

If the request is valid and processing is successful, the server responds with a `200 OK` status code and a JSON body conforming to the `AIGenerateFlashcardsResponseDto` type.

-   **Body Example**:
    ```json
    {
      "suggestions": [
        {
          "front": "Mock_front1",
          "back": "Mock_back1",
          "validation_status": "valid",
          "validation_message": null
        },
        {
          "front": "Mock_front2",
          "back": "Mock_back2",
          "validation_status": "valid",
          "validation_message": null
        }
        // ... up to 3-5 suggestions
      ],
      "metadata": {
        "source_text_hash": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4", // Example MD5 hash
        "source_text_length": 1500,
        "generation_duration_ms": 120,
        "model_used": "mock-generator-v0.1-md5",
        "truncated_count": 0,
        "rejected_count": 0,
        "total_suggestions": 2 // Number of items in suggestions array
      }
    }
    ```

### Error Responses

-   **`400 Bad Request`**: Returned if the request body is invalid.
    -   **Reason**: Missing `text` field, `text` field is not a string, `text` length is outside the allowed range (1000-10000 characters), or the request body is not valid JSON.
    -   **Body Example** (Validation Error):
        ```json
        {
          "message": "Bad Request: Invalid input data.",
          "errors": {
            "text": [
              "Text must be at least 1000 characters long."
            ]
          }
        }
        ```
    -   **Body Example** (JSON Parsing Error):
        ```json
        {
          "message": "Bad Request: Could not parse JSON body."
        }
        ```

-   **`500 Internal Server Error`**: Returned if an unexpected error occurs on the server during the flashcard generation process.
    -   **Reason**: An issue within the `aiGenerationService` or other unhandled server-side exceptions.
    -   Error details are logged on the server (attempted to `generation_error_logs` table).
    -   **Body Example**:
        ```json
        {
          "message": "Internal Server Error: Failed to generate flashcard suggestions."
        }
        ```

### Types Used

Key data structures for this endpoint are defined in `src/types.ts`:

-   `AIGenerateFlashcardsCommand`: Defines the structure of the request body.
-   `AIGenerateFlashcardsResponseDto`: Defines the structure of the successful response body.
-   `FlashcardSuggestionDto`: Defines the structure for individual flashcard suggestions within the response.
-   `AIGenerationMetadataDto`: Defines the structure for metadata associated with the generation process.
-   `ValidationStatus`: Enum (`'valid'`, `'truncated'`, `'rejected'`) used in `FlashcardSuggestionDto`.

---
*This documentation reflects the mock implementation phase.* 