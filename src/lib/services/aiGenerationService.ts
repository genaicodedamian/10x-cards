import type { AIGenerateFlashcardsResponseDto, FlashcardSuggestionDto, ValidationStatus } from "../../types";
import crypto from "crypto"; // Using Node.js crypto for MD5
import { OpenRouterService } from "../openrouter/OpenRouterService";
import type { JsonSchema, Message } from "../openrouter/types";

// Helper for MD5 Hashing using Node.js crypto
function md5(text: string): string {
  return crypto.createHash("md5").update(text).digest("hex");
}

const openRouterService = new OpenRouterService();

const FLASHCARD_SUGGESTION_SCHEMA: JsonSchema = {
  name: "flashcards",
  strict: true,
  schema: {
    type: "object",
    properties: {
      flashcards: {
        type: "array",
        items: {
          type: "object",
          properties: {
            front: { type: "string" },
            back: { type: "string" },
          },
          required: ["front", "back"],
          additionalProperties: false,
        },
      },
    },
    required: ["flashcards"],
    additionalProperties: false,
  },
};

/**
 * Generates flashcard suggestions based on the input text using OpenRouterService.
 *
 * @param text The source text to generate flashcards from.
 * @param userId The ID of the user requesting the generation.
 * @returns A promise that resolves to an AIGenerateFlashcardsResponseDto object.
 */
export async function generateFlashcardSuggestions(
  text: string,
  userId: string
): Promise<AIGenerateFlashcardsResponseDto> {
  const startTime = Date.now();

  console.log(`Generating AI suggestions for user: ${userId} and text starting with: ${text.substring(0, 30)}...`);

  const source_text_length = text.length;
  const source_text_hash = md5(text);

  const messages: Message[] = [
    {
      role: "system",
      content:
        "You are an expert AI assistant that generates concise and accurate flashcards from provided text. " +
        "Generate the flashcards in the same language as the provided text. " +
        "Generate between 10 and 30 flashcard suggestions. " +
        "Each flashcard must have a 'front' (question/term, max 200 chars) and a 'back' (answer/definition, max 500 chars). " +
        "Focus on key concepts, definitions, and important facts. " +
        "Return the suggestions as a JSON object matching the provided schema. Do not include any markdown or other formatting in the JSON response.",
    },
    {
      role: "user",
      content: `Please generate flashcard suggestions from the following text:

${text}`,
    },
  ];

  let suggestionsFromAI: { front: string; back: string }[] = [];
  let modelUsed = "N/A";
  let llmError = null;

  try {
    const response = await openRouterService.getChatCompletion({
      messages,
      model: "openai/gpt-4o-mini", // Or choose a preferred model
      response_format: { type: "json_schema", json_schema: FLASHCARD_SUGGESTION_SCHEMA },
      temperature: 0.5, // Adjust for creativity vs. precision
      max_tokens: 1500, // Adjust based on expected output size
    });

    modelUsed = response.model;
    if (response.choices && response.choices.length > 0 && response.choices[0].message.content) {
      const parsedContent = JSON.parse(response.choices[0].message.content);
      if (parsedContent.flashcards && Array.isArray(parsedContent.flashcards)) {
        suggestionsFromAI = parsedContent.flashcards;
      } else {
        console.error("AI response 'flashcards' field is missing or not an array:", parsedContent);
        llmError = "AI response format error: 'flashcards' field is missing or not an array.";
      }
    } else {
      console.error("AI response did not contain expected content:", response);
      llmError = "AI response did not contain expected content.";
    }
  } catch (error) {
    console.error("Error calling OpenRouterService:", error);
    llmError = error instanceof Error ? error.message : "Unknown error during AI generation.";
    // In case of an error, return an empty suggestion list and log the error.
    // The API plan indicates logging to 'generation_error_logs' table,
    // which should be handled by the calling API endpoint. This service focuses on generation.
  }

  const processedSuggestions: FlashcardSuggestionDto[] = [];
  let truncated_count = 0;
  let rejected_count = 0;

  if (llmError) {
    // If there was a fundamental error with the LLM call, we might not have any suggestions.
    // The metadata will reflect this.
  } else {
    suggestionsFromAI.forEach((rawSuggestion) => {
      let front = rawSuggestion.front;
      let back = rawSuggestion.back;
      let validation_status: ValidationStatus = "valid";
      let validation_message: string | undefined = undefined;

      if (!front || !back) {
        validation_status = "rejected";
        validation_message = "Missing front or back content.";
        rejected_count++;
      } else {
        if (front.length > 200) {
          front = front.substring(0, 200);
          validation_status = "truncated";
          validation_message = (validation_message ? validation_message + " " : "") + "Front content truncated.";
          truncated_count++;
        }
        if (back.length > 500) {
          back = back.substring(0, 500);
          // If already truncated, append message, otherwise set status
          if (validation_status !== "truncated") {
            validation_status = "truncated";
            truncated_count++;
          }
          validation_message = (validation_message ? validation_message + " " : "") + "Back content truncated.";
        }
      }

      if (validation_status === "rejected") {
        processedSuggestions.push({
          front: front || "Rejected", // Provide placeholder if empty
          back: back || "Rejected", // Provide placeholder if empty
          validation_status,
          validation_message,
        });
      } else {
        processedSuggestions.push({
          front,
          back,
          validation_status,
          validation_message: validation_message || undefined, // Ensure it's undefined if no message
        });
      }
    });
  }

  const generation_duration_ms = Date.now() - startTime;

  return {
    suggestions: processedSuggestions,
    metadata: {
      source_text_hash,
      source_text_length,
      generation_duration_ms,
      model_used: modelUsed,
      truncated_count,
      rejected_count,
      total_suggestions: processedSuggestions.length,
      ...(llmError && { error_message: llmError }), // Optionally include error message in metadata
    },
  };
}
