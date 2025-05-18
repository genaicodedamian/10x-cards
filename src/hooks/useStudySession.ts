import { useState, useEffect, useCallback } from 'react';
import type { FlashcardDto, UpdateFlashcardSetCommand } from '@/types';
// Supabase client might be needed here for API calls if not handled by parent

interface UseStudySessionProps {
  initialFlashcards: FlashcardDto[];
  setId: string;
}

export interface StudySessionState {
  // allFlashcards: FlashcardDto[]; // No longer explicitly returned, length is totalFlashcardsInSet
  currentFlashcard: FlashcardDto | null;
  isFlipped: boolean;
  isSessionCompleted: boolean;
  isSubmittingRating: boolean;
  flipCard: () => void;
  rateKnown: () => void;
  rateUnknown: () => void;
  totalFlashcardsInSet: number;
  cardsRemainingToLearn: number;
  // toLearnQueue and toRepeatQueue are not directly needed by view for counter
}

export function useStudySession({
  initialFlashcards,
  setId,
}: UseStudySessionProps): StudySessionState {
  // const [allFlashcards, setAllFlashcards] = useState<FlashcardDto[]>(initialFlashcards);
  // initialFlashcards is the source of truth for the total count and initial shuffle
  const [toLearnQueue, setToLearnQueue] = useState<FlashcardDto[]>([]);
  const [toRepeatQueue, setToRepeatQueue] = useState<FlashcardDto[]>([]);
  const [currentFlashcard, setCurrentFlashcard] = useState<FlashcardDto | null>(null);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isSessionCompleted, setIsSessionCompleted] = useState<boolean>(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState<boolean>(false);

  const totalFlashcardsInSet = initialFlashcards.length;
  const cardsRemainingToLearn = toLearnQueue.length + toRepeatQueue.length;

  console.log(
    '[useStudySession] Render/State Update:',
    {
      toLearnL: toLearnQueue.length,
      toRepeatL: toRepeatQueue.length,
      remaining: cardsRemainingToLearn,
      total: totalFlashcardsInSet,
      currentF: currentFlashcard?.id,
      isCompleted: isSessionCompleted,
      isSubmitting: isSubmittingRating,
    }
  );

  // Initialize or reset state when initialFlashcards change
  useEffect(() => {
    console.log('[useStudySession] Initializing queues with initialFlashcards count:', initialFlashcards.length);
    // setAllFlashcards(initialFlashcards); // Not needed to set as state if only used for initial setup
    if (initialFlashcards.length === 0) {
      setIsSessionCompleted(true);
      setCurrentFlashcard(null);
      setToLearnQueue([]);
      setToRepeatQueue([]);
      console.log('[useStudySession] Initialization: No flashcards, session completed.');
    } else {
      const shuffledFlashcards = [...initialFlashcards].sort(() => Math.random() - 0.5);
      setToLearnQueue(shuffledFlashcards);
      setCurrentFlashcard(shuffledFlashcards[0]);
      setToRepeatQueue([]);
      setIsSessionCompleted(false);
      setIsFlipped(false);
      console.log(
        '[useStudySession] Initialization: Shuffled and set. toLearnL:',
        shuffledFlashcards.length,
        'first card:',
        shuffledFlashcards[0]?.id
      );
    }
  }, [initialFlashcards]);

  const flipCard = useCallback(() => {
    if (!currentFlashcard || isSubmittingRating) return;
    setIsFlipped(prev => !prev);
  }, [currentFlashcard, isSubmittingRating]);

  const proceedToNextCard = useCallback((cardRatedUnknown?: FlashcardDto) => {
    console.log('[useStudySession] proceedToNextCard called. cardRatedUnknown:', cardRatedUnknown?.id);
    setIsFlipped(false);
    setIsSubmittingRating(true);

    setTimeout(() => {
      setToLearnQueue(prevLearnQ => {
        setToRepeatQueue(prevRepeatQ => {
          console.log('[useStudySession] proceedToNextCard - setTimeout STARTS. PrevLearnL:', prevLearnQ.length, 'PrevRepeatL:', prevRepeatQ.length);
          
          let nextLearnQueue = [...prevLearnQ];
          let currentRepeatQueue = [...prevRepeatQ];

          if (cardRatedUnknown) {
            currentRepeatQueue.push(cardRatedUnknown);
            console.log('[useStudySession] proceedToNextCard - Added card to currentRepeatQueue. New currentRepeatL:', currentRepeatQueue.length);
          }

          const shiftedCard = nextLearnQueue.shift();
          console.log('[useStudySession] proceedToNextCard - shifted card:', shiftedCard?.id, 'nextLearnQueue L after shift:', nextLearnQueue.length);

          if (nextLearnQueue.length > 0) {
            setCurrentFlashcard(nextLearnQueue[0]);
            console.log('[useStudySession] proceedToNextCard - next card from learnQ:', nextLearnQueue[0]?.id, 'Setting nextLearnQueue, currentRepeatQueue');
            return currentRepeatQueue; 
          } else {
            console.log('[useStudySession] proceedToNextCard - learnQ empty. Checking currentRepeatQueue. Length:', currentRepeatQueue.length);
            if (currentRepeatQueue.length > 0) {
              // const shuffledRepeatQueue = [...currentRepeatQueue].sort(() => Math.random() - 0.5); // Removed shuffling here
              // setCurrentFlashcard(shuffledRepeatQueue[0]); 
              // console.log('[useStudySession] proceedToNextCard - repeatQ to learnQ (NO SHUFFLE). First card from new learnQ:', shuffledRepeatQueue[0]?.id);
              // The new learn queue will be currentRepeatQueue itself, handled by setToLearnQueue below.
              // We just need to set the current flashcard from it.
              setCurrentFlashcard(currentRepeatQueue[0]);
              console.log('[useStudySession] proceedToNextCard - repeatQ to learnQ (NO SHUFFLE). First card from new learnQ:', currentRepeatQueue[0]?.id);
              return []; // Clear repeat queue
            } else {
              setIsSessionCompleted(true);
              setCurrentFlashcard(null);
              console.log('[useStudySession] proceedToNextCard - Both queues empty. Session COMPLETED.');
              return []; 
            }
          }
        }); 
        
        let finalLearnQueue: FlashcardDto[];
        let tempLearnQForLogic = [...prevLearnQ];
        tempLearnQForLogic.shift(); 

        if (tempLearnQForLogic.length > 0) {
            finalLearnQueue = tempLearnQForLogic;
        } else {
            let effectiveRepeatQueue = cardRatedUnknown ? [...toRepeatQueue, cardRatedUnknown] : [...toRepeatQueue];
            // If prevLearnQ had 1 item (so it's now empty) and repeat queue has items, repeat queue becomes learn queue
            if (prevLearnQ.length === 1 && effectiveRepeatQueue.length > 0) { 
                // finalLearnQueue = [...effectiveRepeatQueue].sort(() => Math.random() - 0.5); // Also remove shuffle here
                finalLearnQueue = [...effectiveRepeatQueue]; // NO SHUFFLE
            } else {
                finalLearnQueue = []; 
            }
        }
        return finalLearnQueue; 
      }); 

      setIsSubmittingRating(false);
      console.log('[useStudySession] proceedToNextCard - setTimeout ENDS. isSubmittingRating set to false.');
    }, 200);

  }, [toRepeatQueue]); 

  const rateKnown = useCallback(() => {
    if (!currentFlashcard || isSubmittingRating) return;
    console.log('[useStudySession] rateKnown called for card:', currentFlashcard.id);
    proceedToNextCard(); // Pass no card, as it's known
  }, [currentFlashcard, isSubmittingRating, proceedToNextCard]);

  const rateUnknown = useCallback(() => {
    if (!currentFlashcard || isSubmittingRating) return;
    console.log('[useStudySession] rateUnknown called for card:', currentFlashcard.id);
    proceedToNextCard(currentFlashcard); // Pass the current flashcard to be added to repeat queue
  }, [currentFlashcard, isSubmittingRating, proceedToNextCard]);

  // Effect to update last_studied_at when session is completed
  useEffect(() => {
    if (isSessionCompleted && setId && totalFlashcardsInSet > 0) { // Use totalFlashcardsInSet here
      console.log(`[useStudySession] Session completed for set ${setId}. Attempting to update last_studied_at.`);
      const updateLastStudied = async () => {
        console.log(`[useStudySession] Calling API to update last_studied_at for set ${setId}.`);
        try {
          const payload: UpdateFlashcardSetCommand = {
            last_studied_at: new Date().toISOString(),
          };
          const response = await fetch(`/api/flashcard-sets/${setId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({})); // Gracefully handle non-JSON response
            console.error(
              `[useStudySession] Failed to update last_studied_at for set ${setId}: ${response.status}`,
              errorData.message || response.statusText
            );
            // Error is logged, but UI is not blocked as per plan
          } else {
            console.log(`[useStudySession] Successfully updated last_studied_at for set ${setId}`);
          }
        } catch (error) {
          console.error(`[useStudySession] Error calling API to update last_studied_at for set ${setId}:`, error);
        }
      };
      updateLastStudied();
    }
  }, [isSessionCompleted, setId, totalFlashcardsInSet]); // Use totalFlashcardsInSet here

  return {
    // allFlashcards, // Not returning directly
    // toLearnQueue, // Not returning directly
    // toRepeatQueue, // Not returning directly
    currentFlashcard,
    isFlipped,
    isSessionCompleted,
    isSubmittingRating,
    flipCard,
    rateKnown,
    rateUnknown,
    totalFlashcardsInSet,
    cardsRemainingToLearn,
  };
} 