import type { APIRoute } from "astro";
import { z } from "zod";
import type { AIGenerateFlashcardsCommand, AIGenerateFlashcardsResponseDto } from "../../../types";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import { generateFlashcardSuggestions } from "../../../lib/services/aiGenerationService";

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

  // 3. Walidacja żądania
  const AiGenerateFlashcardsCommandSchema = z.object({
    text: z
      .string()
      .min(1000, { message: "Text must be at least 1000 characters long." })
      .max(10000, { message: "Text must be at most 10000 characters long." }),
  });

  let command: AIGenerateFlashcardsCommand;
  try {
    const body = await request.json();
    command = AiGenerateFlashcardsCommandSchema.parse(body);
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
    const responseDto: AIGenerateFlashcardsResponseDto = await generateFlashcardSuggestions(command.text, userId, openRouterApiKey);
    return new Response(JSON.stringify(responseDto), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    // Changed :any to :unknown for better type safety
    console.error("[API Route Error] Failed during flashcard generation process:", error);

    let final_source_text_hash = "unknown_hash_due_to_error_in_command";
    let final_source_text_length = -1;

    if (command && command.text) {
      try {
        final_source_text_hash = await sha256(command.text);
        final_source_text_length = command.text.length;
      } catch (hashError) {
        console.error("[API Route Error] Could not compute hash/length for error log:", hashError);
        // Defaults "unknown_hash_due_to_error_in_command" and -1 remain
      }
    }

    const errorLog = {
      user_id: userId,
      model: "mock-generator-v0.1-sha256", // Renamed from model_used
      source_text_hash: final_source_text_hash, // Ensured string
      source_text_length: final_source_text_length, // Ensured number
      error_code: "MOCK_GENERATION_SERVICE_ERROR",
      error_message: String(error instanceof Error ? error.message : "An unknown error occurred in the service."), // Ensured string and check if error is an Error instance
      // error_details removed as it's not in the database schema
    };

    try {
      const { error: logInsertError } = await supabase.from("generation_error_logs").insert([errorLog]);

      if (logInsertError) {
        console.error("[API Route Error] Failed to insert error log into database:", logInsertError);
      }
    } catch (dbError) {
      console.error("[API Route Error] Critical error during database error logging:", dbError);
    }

    return new Response(
      JSON.stringify({ message: "Internal Server Error: Failed to generate flashcard suggestions." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
