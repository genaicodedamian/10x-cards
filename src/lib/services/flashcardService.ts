import type { SupabaseClient } from "../../db/supabase.client"; // CORRECTED IMPORT
import type {
  BatchCreateFlashcardsCommand,
  BatchCreateFlashcardsResponseDto,
  FlashcardDto,
  CreateFlashcardCommand,
  BatchCreateErrorDto,
  PaginatedFlashcardsDto,
  UpdateFlashcardCommand,
  TablesInsert,
} from "../../types";
// import type { TablesInsert } from "../../db/database.types"; // Removed unused import
import { z } from "zod";
import { supabaseClient as supabase } from "../../db/supabase.client"; // Use supabaseClient
// import { DEFAULT_USER_ID } from "../../db/supabase.client"; // Removed unused import
// import { FlashcardSetNotFoundError, FlashcardValidationError, DatabaseError } from '@/lib/errors'; // Removed as errors.ts doesn't exist
import type { Json } from "../../db/database.types"; // Ensure Json type is available or imported if not globally defined by Supabase types
import { mockRegenerateFlashcardContent, type MockRegenerateResult, MockLLMError } from "./aiMockService"; // Added MockLLMError

// Custom error for when a flashcard is not found or not accessible by the user
export class FlashcardNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FlashcardNotFoundError";
  }
}

// Custom error for when attempting to regenerate a flashcard that is not AI-generated
export class FlashcardNotAIGeneratedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FlashcardNotAIGeneratedError";
  }
}

// Custom error for general failures during the regeneration process (e.g., LLM failure, DB update failure)
export class FlashcardRegenerationFailedError extends Error {
  constructor(
    message: string,
    public underlyingError?: unknown
  ) {
    super(message);
    this.name = "FlashcardRegenerationFailedError";
  }
}

export class FlashcardSetNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FlashcardSetNotFoundError";
  }
}

export class FlashcardBatchCreationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FlashcardBatchCreationError";
  }
}

// Placeholder for potential custom error types
// class FlashcardSetNotFoundError extends Error {
//   constructor(message: string) {
//     super(message);
//     this.name = 'FlashcardSetNotFoundError';
//   }
// }

// Expected payload for the RPC function for each flashcard
interface RpcFlashcardInput extends CreateFlashcardCommand {
  set_id: string;
  user_id: string;
}

// Define the expected structure of the payload for the RPC function
interface RpcPayload {
  p_requesting_user_id: string;
  p_target_set_id: string;
  p_flashcards_data: Json; // Changed from RpcFlashcardInput[] to Json to match expected RPC arg type
}

// Define the expected structure of the successful response from the RPC function
// This should align with BatchCreateFlashcardsResponseDto but is good to define for clarity of RPC contract
interface RpcResponse {
  created_flashcards: FlashcardDto[];
  errors?: BatchCreateErrorDto[];
}

// Copied from the API route for now, consider centralizing if used in more places
const _queryParamsSchemaForService = z.object({
  // Prefixed with _
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().min(1).max(100).optional().default(10),
  sort_by: z.enum(["created_at", "updated_at", "front", "back", "source"]).optional().default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
  filter_source: z.enum(["manual", "ai_generated", "ai_generated_modified"] as const).optional(),
});

export type ValidatedFlashcardListParams = z.infer<typeof _queryParamsSchemaForService>; // Updated to use _

// Helper type for the deleteFlashcard return value, based on the plan
export type DeleteFlashcardResult =
  | { success: true }
  | {
      success: false;
      errorType: "NotFound" | "Unauthorized" | "ServiceError";
      statusCode: 404 | 401 | 500;
      message?: string;
    };

// Define a specific interface for the delete_flashcard_atomic RPC response
interface DeleteFlashcardAtomicRpcResult {
  status: "success" | "not_found" | "unauthorized" | "error";
  message?: string;
}

export const flashcardService = {
  /**
   * Creates multiple flashcards within a specified flashcard set in a single transaction.
   *
   * @param setId The ID of the flashcard set to add flashcards to.
   * @param userId The ID of the user performing the action.
   * @param command The command object containing the flashcards to create.
   * @param supabase The Supabase client instance for database operations.
   * @returns A promise that resolves to an object containing lists of created flashcards and any errors.
   */
  async batchCreateFlashcards(
    setId: string,
    userId: string,
    command: BatchCreateFlashcardsCommand,
    supabase: SupabaseClient
  ): Promise<BatchCreateFlashcardsResponseDto> {
    // console.log("flashcardService.batchCreateFlashcards called with:", { setId, userId, command }); // Removed console

    // 1. Verify flashcard_set existence and ownership by userId.
    const { data: set, error: setError } = await supabase
      .from("flashcard_sets")
      .select("id")
      .eq("id", setId)
      .eq("user_id", userId)
      .maybeSingle();

    if (setError) {
      // console.error(`Error fetching flashcard set ${setId} for user ${userId}:`, setError); // Removed console
      throw new FlashcardBatchCreationError(`Database error while verifying flashcard set: ${setError.message}`);
    }

    if (!set) {
      throw new FlashcardSetNotFoundError(
        `Flashcard set with ID ${setId} not found or user ${userId} does not have access.`
      );
    }

    // Step 2: Prepare data for RPC call
    const flashcardsForRpc: RpcFlashcardInput[] = command.flashcards.map((flashcardCmd) => ({
      ...flashcardCmd,
      set_id: setId,
      user_id: userId,
    }));

    const rpcPayload: RpcPayload = {
      p_requesting_user_id: userId,
      p_target_set_id: setId,
      p_flashcards_data: flashcardsForRpc as unknown as Json, // Cast to Json via unknown
    };

    // 3. Call RPC and process response
    const RPC_FUNCTION_NAME = "upsert_flashcards_batch_and_update_set_stats";

    try {
      // Call RPC without explicit generic, then cast result.
      const { data: rpcResult, error: rpcError } = await supabase.rpc(RPC_FUNCTION_NAME, rpcPayload);

      if (rpcError) {
        // console.error(`RPC call ${RPC_FUNCTION_NAME} failed:`, rpcError); // Removed console
        throw new FlashcardBatchCreationError(
          `RPC error during batch flashcard creation: ${rpcError.message || "Unknown RPC error"}`
        );
      }

      if (!rpcResult) {
        // console.error(`RPC call ${RPC_FUNCTION_NAME} returned null data unexpectedly.`); // Removed console
        throw new FlashcardBatchCreationError("RPC call returned no data.");
      }

      // Cast rpcResult to RpcResponse
      const typedRpcResult = rpcResult as unknown as RpcResponse;

      return {
        created_flashcards: typedRpcResult.created_flashcards || [],
        errors: typedRpcResult.errors?.length ? typedRpcResult.errors : undefined,
      };
    } catch (error) {
      if (error instanceof FlashcardBatchCreationError || error instanceof FlashcardSetNotFoundError) {
        throw error;
      }
      // console.error(`Unexpected error during batchCreateFlashcards service call:`, error); // Removed console
      throw new FlashcardBatchCreationError(
        `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },

  // Helper function (example, to be implemented properly if used)
  // async checkSetExistsAndBelongsToUser(setId: string, userId: string, supabase: SupabaseClient): Promise<boolean> {
  //   const { data: set, error } = await supabase
  //     .from('flashcard_sets')
  //     .select('id')
  //     .eq('id', setId)
  //     .eq('user_id', userId)
  //     .maybeSingle();
  //   if (error) {
  //     console.error('Error checking set existence:', error);
  //     return false;
  //   }
  //   return !!set;
  // }

  /**
   * Retrieves a single flashcard by its ID and user ID.
   * @param supabase - The Supabase client instance.
   * @param flashcardId - The UUID of the flashcard to retrieve.
   * @param userId - The UUID of the user who owns the flashcard.
   * @returns A Promise that resolves to the FlashcardDto if found, or null otherwise.
   * @throws Will throw an error if the database query fails for reasons other than not finding the flashcard.
   */
  async getFlashcardById(supabase: SupabaseClient, flashcardId: string, userId: string): Promise<FlashcardDto | null> {
    // console.log(`FlashcardService: Fetching flashcard with id: ${flashcardId} for user: ${userId}`); // Removed console
    const { data, error } = await supabase
      .from("flashcards")
      .select("*")
      .eq("id", flashcardId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // console.log(`FlashcardService: Flashcard not found (id: ${flashcardId}, userId: ${userId})`); // Removed console
        return null;
      }
      // console.error(`FlashcardService: Error fetching flashcard (id: ${flashcardId}, userId: ${userId}):`, error); // Removed console
      // Throw a generic Error as DatabaseError is not available
      throw new Error("Failed to fetch flashcard due to a database error.");
    }

    // if (data) { // Removed console associated with this
    // console.log(`FlashcardService: Flashcard found (id: ${flashcardId}, userId: ${userId})`, data);
    // }
    return data as FlashcardDto | null;
  },

  /**
   * Updates an existing flashcard by its ID for a specific user.
   * Calls the RPC function 'update_flashcard_and_manage_counts'.
   *
   * @param supabase The Supabase client instance.
   * @param flashcardId The UUID of the flashcard to update.
   * @param userId The UUID of the user who owns the flashcard.
   * @param data The update payload (front, back, source - all optional).
   * @returns The updated FlashcardDto if successful, null if not found or on certain errors.
   * @throws Error if the RPC call fails with an unexpected error.
   */
  async updateFlashcard(
    supabase: SupabaseClient,
    flashcardId: string,
    userId: string,
    data: UpdateFlashcardCommand
  ): Promise<FlashcardDto | null> {
    const rpcParams = {
      p_flashcard_id: flashcardId,
      p_user_id: userId,
      p_front: data.front,
      p_back: data.back,
      p_source: data.source,
    };

    const { data: updatedFlashcardData, error } = await supabase.rpc("update_flashcard_and_manage_counts", rpcParams);

    if (error) {
      // Log the error for server-side visibility
      // console.error("Error calling update_flashcard_and_manage_counts RPC:", error); // Removed console

      // Specific error codes handled by the RPC function itself (e.g., P0002 for not found, 23505 for unique violation)
      // might be raised as exceptions by the RPC, resulting in an error object here.
      // The RPC function's EXCEPTION block for P0002 does a RETURN, which might mean error is null and data is empty.
      // For unique violation (23505), it RAISES, so error object will be populated.

      // For now, let's re-throw to be handled by the API route, or return null for common issues like "not found" if error.code suggests it.
      // The plan expects the API route to map these.
      // If error.code is 'P0002' (custom from function, though it's set to RETURN in func) or if implies "not found"
      // we could return null here, but safer to let handler inspect the error.
      // For now, if any RPC error, throw it to be handled by the route.
      // A more sophisticated error handling can be built here or in the route.
      throw error;
    }

    // The RPC `RETURNS SETOF flashcards`. If successful, `updatedFlashcardData` should be an array.
    // If the flashcard was updated, it should contain one element.
    // If the P0002 exception block in SQL led to `RETURN;`, `updatedFlashcardData` might be an empty array or null.
    if (updatedFlashcardData && Array.isArray(updatedFlashcardData) && updatedFlashcardData.length > 0) {
      return updatedFlashcardData[0] as FlashcardDto;
    }

    // This case could mean the flashcard was not found (RPC's P0002 handled by RETURN),
    // or an unexpected RPC response structure.
    return null;
  },

  /**
   * Deletes a flashcard by its ID for a given user, calling a PostgreSQL RPC function.
   * The RPC function is responsible for atomic deletion and updating counts in flashcard_sets.
   *
   * @param supabase - The Supabase client instance.
   * @param userId - The ID of the user performing the deletion.
   * @param flashcardId - The ID of the flashcard to delete.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  async deleteFlashcard(supabase: SupabaseClient, userId: string, flashcardId: string): Promise<DeleteFlashcardResult> {
    const { data, error } = await supabase.rpc("delete_flashcard_atomic", {
      p_flashcard_id: flashcardId,
      p_auth_user_id: userId,
    });

    if (error) {
      return {
        success: false,
        errorType: "ServiceError",
        statusCode: 500,
        message: error.message,
      };
    }

    const typedData = data as unknown as DeleteFlashcardAtomicRpcResult; // Cast via unknown

    if (typedData && typedData.status === "success") {
      return { success: true };
    } else if (typedData && typedData.status === "not_found") {
      return {
        success: false,
        errorType: "NotFound",
        statusCode: 404,
        message: typedData.message || "Flashcard not found.",
      };
    } else if (typedData && typedData.status === "unauthorized") {
      return {
        success: false,
        errorType: "Unauthorized",
        statusCode: 401,
        message: typedData.message || "User not authorized to delete this flashcard.",
      };
    } else {
      return {
        success: false,
        errorType: "ServiceError",
        statusCode: 500,
        message: (typedData && typedData.message) || "Failed to delete flashcard due to an unknown server error.",
      };
    }
  },

  // New method for listing flashcards in a set
  async getFlashcardsInSet(
    userId: string,
    setId: string,
    params: ValidatedFlashcardListParams
  ): Promise<PaginatedFlashcardsDto | null> {
    // console.log("FlashcardService.getFlashcardsInSet called with:", { userId, setId, params }); // Removed console

    // 1. Verify set ownership (setId belongs to userId)
    const { data: set, error: setError } = await supabase
      .from("flashcard_sets")
      .select("id")
      .eq("id", setId)
      .eq("user_id", userId)
      .maybeSingle();

    if (setError) {
      // console.error(`Database error while verifying flashcard set ${setId} for user ${userId}:`, setError); // Removed console
      // Consider throwing a more generic database error or logging more details
      throw new Error(`Database error while verifying flashcard set: ${setError.message}`);
    }

    if (!set) {
      throw new FlashcardSetNotFoundError(
        `Flashcard set with ID ${setId} not found or user ${userId} does not have access.`
      );
    }

    // 2. Fetch flashcards with pagination, sorting, filtering & 3. Fetch total count
    const { page, limit, sort_by, order, filter_source } = params;
    const rangeFrom = (page - 1) * limit;
    const rangeTo = page * limit - 1;

    let query = supabase.from("flashcards").select("*", { count: "exact" }).eq("set_id", setId).eq("user_id", userId);

    if (filter_source) {
      query = query.eq("source", filter_source);
    }

    query = query.order(sort_by, { ascending: order === "asc" }).range(rangeFrom, rangeTo);

    const { data: flashcards, error: flashcardsError, count } = await query;

    if (flashcardsError) {
      // console.error(`Database error while fetching flashcards for set ${setId}:`, flashcardsError); // Removed console
      throw new Error(`Database error while fetching flashcards: ${flashcardsError.message}`);
    }

    // 4. Construct and return PaginatedFlashcardsDto
    const totalItems = count || 0;
    const totalPages = Math.ceil(totalItems / limit);

    const paginationInfo = {
      current_page: page,
      total_pages: totalPages,
      total_items: totalItems,
      limit: limit,
    };

    // console.log("Returning PaginatedFlashcardsDto", { data: flashcards || [], pagination: paginationInfo }); // Removed console

    return {
      data: flashcards || [], // Ensure data is always an array
      pagination: paginationInfo,
    };
  },

  /**
   * Regenerates the content of an AI-generated flashcard.
   *
   * @param supabaseInstance The Supabase client instance.
   * @param userId The ID of the user performing the action.
   * @param flashcardId The ID of the flashcard to regenerate.
   * @returns A promise that resolves to the updated FlashcardDto.
   * @throws {FlashcardNotFoundError} If the flashcard is not found or doesn't belong to the user.
   * @throws {FlashcardNotAIGeneratedError} If the flashcard's source is not 'ai_generated'.
   * @throws {FlashcardRegenerationFailedError} If the regeneration process fails (e.g., LLM error, DB update error).
   */
  async regenerateAIFlashcard(
    supabaseInstance: SupabaseClient,
    userId: string,
    flashcardId: string
  ): Promise<FlashcardDto> {
    // 1. Fetch the flashcard
    const { data: flashcard, error: fetchError } = await supabaseInstance
      .from("flashcards")
      .select("id, front, back, source, set_id, user_id, created_at, updated_at") // Explicitly list needed fields
      .eq("id", flashcardId)
      .eq("user_id", userId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        // PostgREST error code for "single()" returning 0 rows
        throw new FlashcardNotFoundError(
          `Flashcard with ID ${flashcardId} not found or not accessible by user ${userId}.`
        );
      }
      // For other database errors during fetch
      throw new FlashcardRegenerationFailedError(
        `Database error while fetching flashcard ${flashcardId}: ${fetchError.message}`,
        fetchError
      );
    }

    if (!flashcard) {
      // Should be caught by PGRST116, but as a safeguard
      throw new FlashcardNotFoundError(
        `Flashcard with ID ${flashcardId} not found or not accessible by user ${userId}.`
      );
    }

    // 2. Validate that the flashcard is AI-generated
    if (flashcard.source !== "ai_generated") {
      throw new FlashcardNotAIGeneratedError(
        `Flashcard with ID ${flashcardId} has source '${flashcard.source}' and cannot be AI-regenerated.`
      );
    }

    // 3. Call the Mock LLM service
    let regeneratedContent: MockRegenerateResult;
    try {
      // To test error paths, you would pass options here, e.g.:
      // regeneratedContent = await mockRegenerateFlashcardContent(flashcard.front, flashcard.back, { simulateError: 'rateLimit' });
      regeneratedContent = await mockRegenerateFlashcardContent(
        flashcard.front,
        flashcard.back
        //, { simulateError: 'rateLimit' } // Example of how to trigger for testing
      );
    } catch (llmError) {
      if (llmError instanceof MockLLMError) {
        // Log to generation_error_logs
        let sourceTextHashForLog = "REGEN_CONTEXT_NA"; // Default placeholder
        let sourceTextLengthForLog = 1000; // Default placeholder

        // Attempt to get actual values from flashcard_set
        const { data: setDetails, error: setError } = await supabaseInstance
          .from("flashcard_sets")
          .select("source_text_hash, source_text_length")
          .eq("id", flashcard.set_id) // flashcard.set_id should be available from the initial fetch
          .single();

        if (setError) {
          console.warn(
            `Could not fetch flashcard_set details for logging LLM error for flashcard ${flashcardId}: ${setError.message}. Using placeholders.`
          );
        } else if (setDetails) {
          if (setDetails.source_text_hash && setDetails.source_text_hash.length > 0) {
            // Basic check
            sourceTextHashForLog = setDetails.source_text_hash;
          }
          if (
            setDetails.source_text_length &&
            setDetails.source_text_length >= 1000 &&
            setDetails.source_text_length <= 10000
          ) {
            // As per DB constraint
            sourceTextLengthForLog = setDetails.source_text_length;
          }
        }

        const logEntry: TablesInsert<"generation_error_logs"> = {
          user_id: userId,
          model: llmError.modelUsed, // from MockLLMError
          error_code: llmError.errorCode, // from MockLLMError
          error_message: llmError.message,
          source_text_hash: sourceTextHashForLog,
          source_text_length: sourceTextLengthForLog,
        };

        try {
          const { error: logInsertError } = await supabaseInstance.from("generation_error_logs").insert(logEntry);
          if (logInsertError) {
            console.error(
              `Failed to insert LLM error log for flashcard ${flashcardId}: ${logInsertError.message}`,
              logEntry
            );
            // Throw original LLM error, but wrap it to indicate logging also failed
            throw new FlashcardRegenerationFailedError(
              `Mock LLM service failed and logging the error also failed: ${llmError.message} (Log Error: ${logInsertError.message})`,
              llmError
            );
          }
        } catch (dbLogErr) {
          console.error(
            `Unexpected error during LLM error log insertion for flashcard ${flashcardId}: ${dbLogErr instanceof Error ? dbLogErr.message : String(dbLogErr)}`,
            logEntry
          );
          // Throw original LLM error, but wrap it to indicate logging also failed
          throw new FlashcardRegenerationFailedError(
            `Mock LLM service failed and logging the error also unexpectedly failed: ${llmError.message}`,
            llmError
          );
        }

        // Re-throw a specific error that the API route can map to a status code
        throw new FlashcardRegenerationFailedError(
          llmError.message, // Original message from MockLLMError
          llmError // Pass the original MockLLMError as underlyingError for context
        );
      }
      // For other non-MockLLMError types from the LLM call (less likely with current mock)
      throw new FlashcardRegenerationFailedError(
        `Mock LLM service failed to regenerate content for flashcard ${flashcardId}.`,
        llmError
      );
    }

    const { newFront: rawNewFront, newBack: rawNewBack, modelUsed } = regeneratedContent;

    // 4. Validate and truncate content length
    let finalNewFront = rawNewFront;
    const MAX_FRONT_LENGTH = 200;
    if (rawNewFront.length > MAX_FRONT_LENGTH) {
      finalNewFront = rawNewFront.substring(0, MAX_FRONT_LENGTH - 3) + "...";
      // TODO: Potentially log this truncation or inform the user if necessary in a real scenario
      console.warn(
        `Truncated regenerated front content for flashcard ${flashcardId} as it exceeded ${MAX_FRONT_LENGTH} chars.`
      );
    }

    let finalNewBack = rawNewBack;
    const MAX_BACK_LENGTH = 500;
    if (rawNewBack.length > MAX_BACK_LENGTH) {
      finalNewBack = rawNewBack.substring(0, MAX_BACK_LENGTH - 3) + "...";
      // TODO: Potentially log this truncation or inform the user if necessary in a real scenario
      console.warn(
        `Truncated regenerated back content for flashcard ${flashcardId} as it exceeded ${MAX_BACK_LENGTH} chars.`
      );
    }

    // 5. Update the flashcard in the database
    const { data: updatedFlashcard, error: updateError } = await supabaseInstance
      .from("flashcards")
      .update({
        front: finalNewFront,
        back: finalNewBack,
        // source remains 'ai_generated', updated_at is handled by DB trigger
      })
      .eq("id", flashcardId)
      .eq("user_id", userId) // Ensure we only update if it still belongs to the user
      .select()
      .single();

    if (updateError) {
      // Log the error for server-side visibility
      console.error(
        `Database error while updating flashcard ${flashcardId} after regeneration: ${updateError.message}`,
        { finalNewFront, finalNewBack }
      );
      throw new FlashcardRegenerationFailedError(
        `Failed to update flashcard ${flashcardId} in the database after regeneration: ${updateError.message}`,
        updateError
      );
    }

    if (!updatedFlashcard) {
      // This case should ideally not happen if the initial fetch succeeded and RLS is correct,
      // but it's a safeguard.
      console.error(
        `Flashcard ${flashcardId} was not found during the update step after regeneration, though it was fetched initially.`
      );
      throw new FlashcardRegenerationFailedError(
        `Failed to retrieve flashcard ${flashcardId} after update, indicating a possible data consistency issue.`
      );
    }

    return updatedFlashcard as FlashcardDto;
  },
};
