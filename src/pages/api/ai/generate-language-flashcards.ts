import type { APIRoute } from "astro";
import { z } from "zod";
import type { AIGenerateLanguageFlashcardsCommand, AIGenerateLanguageFlashcardsResponseDto } from "../../../types";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import { generateLanguageFlashcardSuggestions } from "../../../lib/services/languageFlashcardGenerationService";

export const prerender = false;

// Helper function for SHA-256 hashing using Web Crypto API (compatible with Cloudflare Workers)
async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const POST: APIRoute = async ({ request, locals }) => {
  // Auth removed as per feedback - using DEFAULT_USER_ID
  const userId = DEFAULT_USER_ID;
  const { supabase } = locals; // Still need supabase from locals for potential DB operations like error logging

  // Get the OpenRouter API key from the runtime environment
  let openRouterApiKey: string | undefined;
  
  try {
    // In Cloudflare Pages, environment variables are accessed through locals.runtime.env
    openRouterApiKey = (locals as any).runtime?.env?.OPENROUTER_API_KEY;
  } catch (error) {
    console.error("Failed to access runtime environment:", error);
  }

  // Fallback to import.meta.env for local development
  if (!openRouterApiKey) {
    try {
      openRouterApiKey = import.meta.env.OPENROUTER_API_KEY;
    } catch (error) {
      console.error("Failed to access import.meta.env:", error);
    }
  }

  if (!openRouterApiKey) {
    console.error("OpenRouter API Key is not available in runtime environment or import.meta.env");
    return new Response(
      JSON.stringify({ message: "Internal Server Error: API configuration missing." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Walidacja żądania
  const LanguageFlashcardsCommandSchema = z.object({
    topic: z
      .string()
      .min(1, { message: "Topic is required." })
      .max(40, { message: "Topic must be at most 40 characters long." }),
    front_language: z.enum(["polish", "english", "german", "french"], {
      required_error: "Front language is required.",
      invalid_type_error: "Invalid front language selected."
    }),
    back_language: z.enum(["polish", "english", "german", "french"], {
      required_error: "Back language is required.", 
      invalid_type_error: "Invalid back language selected."
    })
  });

  let command: AIGenerateLanguageFlashcardsCommand;
  try {
    const body = await request.json();
    command = LanguageFlashcardsCommandSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ message: "Bad Request: Invalid input data.", errors: error.format() }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    return new Response(JSON.stringify({ message: "Bad Request: Could not parse JSON body." }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  try {
    const responseDto: AIGenerateLanguageFlashcardsResponseDto = await generateLanguageFlashcardSuggestions(
      command.topic,
      command.front_language,
      command.back_language,
      userId,
      openRouterApiKey
    );
    return new Response(JSON.stringify(responseDto), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("[API Route Error] Failed during language flashcard generation process:", error);

    let final_topic_hash = "unknown_hash_due_to_error_in_command";
    let final_topic_length = -1;

    if (command && command.topic) {
      try {
        final_topic_hash = await sha256(command.topic);
        final_topic_length = command.topic.length;
      } catch (hashError) {
        console.error("[API Route Error] Could not compute hash/length for error log:", hashError);
        // Defaults "unknown_hash_due_to_error_in_command" and -1 remain
      }
    }

    // Note: For language flashcards, we can't use source_text_length in error logs
    // because topic_length is 1-40 chars, but DB expects 1000-10000
    // We'll skip logging to generation_error_logs for now as the schema doesn't fit
    // This should be addressed in future iterations with a dedicated error log table

    console.error("[Language Flashcard Error] Error details:", {
      user_id: userId,
      model: "google/gemini-2.5-flash-lite-preview-06-17",
      topic_hash: final_topic_hash,
      topic_length: final_topic_length,
      error_code: "LANGUAGE_GENERATION_SERVICE_ERROR",
      error_message: error instanceof Error ? error.message : "An unknown error occurred in the service.",
    });

    return new Response(
      JSON.stringify({ message: "Internal Server Error: Failed to generate language flashcard suggestions." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

