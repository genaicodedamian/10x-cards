import React from 'react';
import type { FlashcardDto } from '@/types';
import { useStudySession } from '@/hooks/useStudySession';
import StudyFlashcard from './StudyFlashcard';
import FlashcardRatingButtons from './FlashcardRatingButtons';
import StudyCompletionSummary from './StudyCompletionSummary';
// Placeholder for a potential Spinner or loading indicator for card transitions
// import { Spinner } from '@/components/ui/spinner';

interface StudySessionViewProps {
  flashcards: FlashcardDto[];
  // flashcardSet?: FlashcardSetDto; // Optional as per plan, not directly used by useStudySession hook
  setId: string;
}

const StudySessionView: React.FC<StudySessionViewProps> = ({ flashcards, setId }) => {
  const {
    currentFlashcard,
    isFlipped,
    isSessionCompleted,
    isSubmittingRating,
    flipCard,
    rateKnown,
    rateUnknown,
    totalFlashcardsInSet, // New value from hook
    cardsRemainingToLearn, // New value from hook
  } = useStudySession({ initialFlashcards: flashcards, setId });

  // Handle empty initial flashcards case (covered by useStudySession, but good for clarity)
  // This specific condition might be handled inside useStudySession by setting isSessionCompleted to true initially.
  // Or if initialFlashcards itself is empty, StudySessionLoader might show a message even before this component.
  // However, if the hook initializes and then determines session is completed (e.g. after shuffling an empty array),
  // isSessionCompleted will be true.

  if (isSessionCompleted) {
    // If initialFlashcards was empty, the hook sets isSessionCompleted=true.
    // We can show a specific message if flashcards.length was initially 0.
    if (flashcards.length === 0) {
      return (
        <div className="w-full max-w-xl p-6 text-center bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Brak fiszek w tym zestawie</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Ten zestaw nie zawiera żadnych fiszek do nauki.</p>
          <StudyCompletionSummary />
        </div>
      );
    }
    return <StudyCompletionSummary />;
  }

  if (!currentFlashcard) {
    // This should ideally not happen if not completed and flashcards are present,
    // but as a safeguard or if loading a card (though isSubmittingRating handles that)
    // return <Spinner />; // Or some other loading/empty state placeholder
    return <p className="text-lg text-gray-500 dark:text-gray-400">Ładowanie karty lub sesja zakończona...</p>;
  }

  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-6 p-4">
      {totalFlashcardsInSet > 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Pozostało do nauki: {cardsRemainingToLearn} / {totalFlashcardsInSet}
        </p>
      )}
      <StudyFlashcard
        flashcard={currentFlashcard}
        isFlipped={isFlipped}
        onFlip={flipCard}
      />
      {isFlipped && !isSubmittingRating && (
        <FlashcardRatingButtons
          onRateKnown={rateKnown}
          onRateUnknown={rateUnknown}
          disabled={isSubmittingRating} 
        />
      )}
      {isSubmittingRating && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Przetwarzanie...</p>} {/* Optional: show a processing message */}
    </div>
  );
};

export default StudySessionView; 