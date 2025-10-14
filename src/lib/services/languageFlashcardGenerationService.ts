import type { 
  AIGenerateLanguageFlashcardsResponseDto, 
  LanguageFlashcardSuggestionDto, 
  LanguageCode,
  ValidationStatus 
} from "../../types";
import { OpenRouterService } from "../openrouter/OpenRouterService";
import type { JsonSchema, Message } from "../openrouter/types";

// Helper for SHA-256 Hashing using Web Crypto API (compatible with Cloudflare Workers)
async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const LANGUAGE_FLASHCARD_SUGGESTION_SCHEMA: JsonSchema = {
  name: "language_flashcards",
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

// Language names mapping for AI prompts
const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  polish: "Polish",
  english: "English", 
  german: "German",
  french: "French"
};

/**
 * Generates language learning flashcard suggestions based on the topic and language pair using OpenRouterService.
 * Creates exactly 30 unique vocabulary words/phrases for the given topic.
 */
export async function generateLanguageFlashcardSuggestions(
  topic: string,
  frontLanguage: LanguageCode,
  backLanguage: LanguageCode,
  userId: string,
  apiKey: string
): Promise<AIGenerateLanguageFlashcardsResponseDto> {
  const startTime = Date.now();

  console.log(`Generating language AI suggestions for user: ${userId}, topic: "${topic}", ${frontLanguage} -> ${backLanguage}`);

  // Create OpenRouterService instance with the provided API key
  const openRouterService = new OpenRouterService({ apiKey });

  const topic_length = topic.length;
  const topic_hash = await sha256(topic);

  const frontLangName = LANGUAGE_NAMES[frontLanguage];
  const backLangName = LANGUAGE_NAMES[backLanguage];

  const messages: Message[] = [
    {
      role: "system",
      content:
        "You are an expert language teacher that generates vocabulary flashcards for language learning. " +
        "Generate exactly 30 unique vocabulary words or phrases related to the specified topic. " +
        "Each flashcard must have a 'front' (word/phrase in the source language) and a 'back' (translation in the target language). " +
        "Focus on commonly used, practical vocabulary related to the topic. " +
        "Ensure all words are unique and relevant to the topic. " +
        "Return the suggestions as a JSON object matching the provided schema. Do not include any markdown or other formatting in the JSON response.",
    },
    {
      role: "user",
      content: `Generate exactly 30 unique vocabulary words/phrases for the topic: "${topic}".
Return each word/phrase in ${frontLangName} and its ${backLangName} translation.
Focus on commonly used, practical vocabulary related to this topic.
Ensure all words are unique and relevant to the topic.`,
    },
  ];

  let suggestionsFromAI: { front: string; back: string }[] = [];
  let modelUsed = "N/A";
  let llmError = null;

  try {
    const response = await openRouterService.getChatCompletion({
      messages,
      model: "google/gemini-2.5-flash-lite-preview-06-17", // Or choose a preferred model
      response_format: { type: "json_schema", json_schema: LANGUAGE_FLASHCARD_SUGGESTION_SCHEMA },
      temperature: 0.3, // Lower temperature for more consistent vocabulary
      max_tokens: 2000, // Higher token limit for 30 flashcards
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
  }

  const processedSuggestions: LanguageFlashcardSuggestionDto[] = [];
  let truncated_count = 0;
  let rejected_count = 0;

  if (llmError) {
    // If there was a fundamental error with the LLM call, we might not have any suggestions.
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
        // Clean up the content (remove extra whitespace, etc.)
        front = front.trim();
        back = back.trim();

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
      topic_hash,
      topic_length,
      generation_duration_ms,
      model_used: modelUsed,
      front_language: frontLanguage,
      back_language: backLanguage,
      truncated_count,
      rejected_count,
      total_suggestions: processedSuggestions.length,
    },
  };
}

