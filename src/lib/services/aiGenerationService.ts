import type { AIGenerateFlashcardsResponseDto, FlashcardSuggestionDto } from '../../types';
// Removed nanoid as it's not used for now
import crypto from 'crypto'; // Using Node.js crypto for MD5

// Helper for MD5 Hashing using Node.js crypto
function md5(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex');
}

/**
 * Generates mock flashcard suggestions based on the input text.
 * This service simulates the behavior of an AI model for generating flashcards.
 *
 * @param text The source text to generate flashcards from.
 * @param userId The ID of the user requesting the generation (currently DEFAULT_USER_ID).
 * @returns A promise that resolves to an AIGenerateFlashcardsResponseDto object.
 */
export async function generateMockFlashcardSuggestions(
  text: string,
  userId: string // Will be DEFAULT_USER_ID as per current plan
): Promise<AIGenerateFlashcardsResponseDto> {
  const startTime = Date.now();

  console.log(`Generating mock suggestions for user: ${userId} and text starting with: ${text.substring(0,30)}...`);

  const source_text_length = text.length;
  const source_text_hash = md5(text); // Changed to MD5

  // Simulate generation delay
  // Using a fixed delay for more predictable testing of mock flow
  await new Promise(resolve => setTimeout(resolve, 100));

  const mockSuggestions: FlashcardSuggestionDto[] = [];
  const numberOfSuggestions = Math.floor(Math.random() * 3) + 3; // Generate 3 to 5 suggestions

  for (let i = 0; i < numberOfSuggestions; i++) {
    mockSuggestions.push({
      front: `Mock_front${i + 1}`,
      back: `Mock_back${i + 1}`,
      validation_status: 'valid',
      // validation_message is optional, so not included for 'valid' status
    });
  }

  const generation_duration_ms = Date.now() - startTime;

  return {
    suggestions: mockSuggestions,
    metadata: {
      source_text_hash,
      source_text_length,
      generation_duration_ms,
      model_used: 'mock-generator-v0.1-md5', // Updated model name
      truncated_count: 0,
      rejected_count: 0,
      total_suggestions: mockSuggestions.length,
    },
  };
} 