import type { Database, Tables } from "@/db/database.types";
// Use SupabaseClient from the local wrapper
import type { SupabaseClient } from "@/db/supabase.client";
// Keep PostgrestError if it's used and not re-exported by the local SupabaseClient module
import type { PostgrestError } from "@supabase/supabase-js";
import type { CreateFlashcardSetCommand, FlashcardSetDto, PaginationInfoDto } from "../../types"; // Adjusted path

/**
 * Service class for managing Flashcard Sets.
 */
export class FlashcardSetService {
  /**
   * Creates a new flashcard set for a given user.
   *
   * @param userId The ID of the user creating the set.
   * @param command The command object containing data for the new flashcard set.
   * @param supabase The Supabase client instance to use for database operations.
   * @returns A promise that resolves to an object containing either the created FlashcardSetDto or a PostgrestError.
   */
  async createSet(
    userId: string,
    command: CreateFlashcardSetCommand,
    supabase: SupabaseClient
  ): Promise<{ data: FlashcardSetDto | null; error: PostgrestError | null }> {
    console.log("FlashcardSetService.createSet called with:", { userId, command });

    const { name, source_text_hash, source_text_length, generation_duration_ms } = command;

    // Prepare the data for insertion, explicitly including user_id.
    // Default values for accepted_unedited_count and total_flashcards_count
    // are handled by the database schema if not specified here.
    const insertData = {
      user_id: userId,
      name,
      source_text_hash: source_text_hash || null, // Ensure null if undefined/empty
      source_text_length: source_text_length || null,
      generation_duration_ms: generation_duration_ms || null,
      // last_studied_at will be null by default in DB
      // created_at, updated_at will be set by DB
    };

    const { data, error } = await supabase.from("flashcard_sets").insert(insertData).select().single(); // .single() is used to get the inserted row back and ensures it's just one

    if (error) {
      console.error("Error creating flashcard set in service:", error);
      return { data: null, error };
    }

    return { data: data as FlashcardSetDto, error: null }; // Cast to FlashcardSetDto on success
  }

  async getFlashcardSets(
    supabase: SupabaseClient,
    userId: string,
    params: { page: number; limit: number; sortBy: string; order: "asc" | "desc" }
  ): Promise<{ data: FlashcardSetDto[]; pagination: PaginationInfoDto; error?: PostgrestError | null }> {
    const offset = (params.page - 1) * params.limit;

    try {
      const { data, error, count } = await supabase
        .from("flashcard_sets")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .order(params.sortBy, { ascending: params.order === "asc" })
        .range(offset, offset + params.limit - 1);

      if (error) {
        console.error("Error fetching flashcard sets:", error);
        return { data: [], pagination: this.getEmptyPagination(params.page, params.limit), error };
      }

      const total_items = count ?? 0;
      const total_pages = Math.ceil(total_items / params.limit);

      const pagination: PaginationInfoDto = {
        current_page: params.page,
        total_pages: total_pages > 0 ? total_pages : 1, // Ensure total_pages is at least 1
        total_items,
        limit: params.limit,
      };

      return { data: data || [], pagination, error: null };
    } catch (e) {
      console.error("Unexpected error in getFlashcardSets:", e);
      const unknownError = e as Error;
      return {
        data: [],
        pagination: this.getEmptyPagination(params.page, params.limit),
        error: {
          message: unknownError.message || "An unexpected error occurred",
          details: "",
          hint: "",
          code: "500",
        } as PostgrestError,
      };
    }
  }

  private getEmptyPagination(page: number, limit: number): PaginationInfoDto {
    return {
      current_page: page,
      total_pages: 1,
      total_items: 0,
      limit: limit,
    };
  }

  /**
   * Updates an existing flashcard set for a given user.
   *
   * @param supabase The Supabase client instance.
   * @param setId The ID of the flashcard set to update.
   * @param userId The ID of the user who owns the set.
   * @param data An object containing the new name for the set.
   * @returns A promise that resolves to the updated FlashcardSetDto or null if not found.
   * @throws Error with a specific message ('DUPLICATE_SET_NAME', 'DB_UPDATE_FAILED') on database errors.
   */
  async updateFlashcardSet(
    supabase: SupabaseClient,
    setId: string,
    userId: string,
    data: { name?: string; last_studied_at?: string }
  ): Promise<FlashcardSetDto | null> {
    console.log("FlashcardSetService.updateFlashcardSet called with:", { setId, userId, ...data });

    const updatePayload: Partial<Tables<"flashcard_sets">> = {};
    if (data.name !== undefined) {
      updatePayload.name = data.name;
    }
    if (data.last_studied_at !== undefined) {
      updatePayload.last_studied_at = data.last_studied_at;
    }

    // Ensure there's something to update
    if (Object.keys(updatePayload).length === 0) {
      console.warn("updateFlashcardSet called with no fields to update.");
      // Optionally, fetch and return the existing set or handle as an error/noop
      // For now, let's assume the validation at the schema level prevents this
      // or we can fetch the current record.
      // Fetching current record to ensure consistency if nothing is updated:
      const { data: currentSet, error: fetchError } = await supabase
        .from("flashcard_sets")
        .select("*")
        .eq("id", setId)
        .eq("user_id", userId)
        .single();
      if (fetchError) {
        console.error("Error fetching current set when update payload was empty:", fetchError);
        throw new Error("DB_FETCH_FAILED_ON_EMPTY_UPDATE");
      }
      return currentSet as FlashcardSetDto | null;
    }
    
    // updated_at is managed by DB trigger or can be set manually if needed:
    // updatePayload.updated_at = new Date().toISOString();

    const { data: updatedSet, error } = await supabase
      .from("flashcard_sets")
      .update(updatePayload)
      .eq("id", setId)
      .eq("user_id", userId) // Crucial for authorization at the query level
      .select() // To return the updated record
      .single(); // Expect a single record or error/null

    if (error) {
      if (error.code === "23505" && data.name !== undefined) { // Check for unique violation only if name is being updated
        // PostgreSQL error code for unique violation
        console.warn("Supabase error updating flashcard set - unique constraint violation:", {
          setId,
          userId,
          name: data.name,
          error,
        });
        throw new Error("DUPLICATE_SET_NAME"); // Specific error for handler to map to 400
      }
      console.error("Supabase error updating flashcard set:", { setId, userId, ...data, error });
      // Throw a generic error or a specific one that the handler can map to 500
      throw new Error("DB_UPDATE_FAILED");
    }

    if (!updatedSet) {
      // If .single() doesn't return data and there's no error, it means the row wasn't found (e.g., setId or userId didn't match)
      console.log("Flashcard set not found for update or user does not own it:", { setId, userId });
      return null; // Handler will map this to 404
    }

    return updatedSet as FlashcardSetDto; // Cast to DTO
  }
}

/**
 * Pre-initialized instance of the FlashcardSetService.
 */
export const flashcardSetService = new FlashcardSetService();
