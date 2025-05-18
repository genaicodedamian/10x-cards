import React, { useState, useEffect, useRef } from 'react';
import type { FlashcardDto, PaginatedFlashcardsDto } from '@/types'; // Assuming types are in @/types
import StudySessionView from './StudySessionView';
import { LoadingSpinner } from '@/components/ui/loading-spinner'; // Import the new spinner
// Assuming you have a Spinner component, e.g., from shadcn/ui
// import { Spinner } from '@/components/ui/spinner'; 

interface StudySessionLoaderProps {
  setId: string;
}

const StudySessionLoader: React.FC<StudySessionLoaderProps> = ({ setId }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [flashcardsData, setFlashcardsData] = useState<FlashcardDto[] | null>(null);
  // const [flashcardSetData, setFlashcardSetData] = useState<FlashcardSetDto | null>(null); // Optional: for set details

  // Ref to ensure cleanup effect runs only on unmount or setId change
  const fetchControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel any ongoing fetch when component unmounts or setId changes
    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
    }
    fetchControllerRef.current = new AbortController();
    const signal = fetchControllerRef.current.signal;

    const fetchFlashcardsAndEnsureMinDuration = async () => {
      setIsLoading(true);
      setError(null);
      setFlashcardsData(null); // Reset data on new load

      const minDisplayTimePromise = new Promise(resolve => setTimeout(resolve, 1000));

      const fetchDataPromise = (async () => {
        try {
          const response = await fetch(`/api/flashcard-sets/${setId}/flashcards?limit=1000`, { signal });
          if (signal.aborted) return; // Don't process if aborted

          if (!response.ok) {
            let errorMsg = `Błąd HTTP: ${response.status}`;
            try {
              const errorData = await response.json();
              // Prefer backend message if available and it's a string
              errorMsg = (typeof errorData.message === 'string' && errorData.message) ? errorData.message : errorMsg;
            } catch (e) {
              // Ignore if response is not JSON or errorData.message is not helpful
            }
            // Explicitly check for validation-like errors from common structures
            if (response.status === 400 && errorMsg.toLowerCase().includes('validation')) {
                throw new Error('Błąd walidacji. Sprawdź poprawność danych.');
            } else if (response.status === 404) {
                throw new Error('Nie znaleziono zestawu fiszek lub nie masz do niego dostępu.');
            }
            throw new Error(errorMsg);
          }
          const result = (await response.json()) as PaginatedFlashcardsDto;
          if (signal.aborted) return;
          setFlashcardsData(result.data);
        } catch (err: any) {
          if (signal.aborted) return; // Don't set error if aborted
          console.error("Nie udało się załadować fiszek:", err);
          // Use the error message directly if it's one of our specific ones, otherwise generic
          if (err.message === 'Nie znaleziono zestawu fiszek lub nie masz do niego dostępu.' || err.message === 'Błąd walidacji. Sprawdź poprawność danych.') {
            setError(err.message);
          } else {
            setError('Wystąpił nieoczekiwany błąd podczas pobierania fiszek.');
          }
        }
      })();

      try {
        await Promise.all([fetchDataPromise, minDisplayTimePromise]);
      } catch (e) {
        // This catch is primarily for Promise.all itself, actual errors handled in fetchDataPromise
        if (!signal.aborted) {
            console.error("Błąd podczas operacji ładowania (Promise.all):", e);
        }
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    if (setId) {
      fetchFlashcardsAndEnsureMinDuration();
    }
    
    return () => {
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort();
      }
    };
  }, [setId]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <LoadingSpinner size={48} className="text-primary mb-4" /> {/* Use LoadingSpinner */}
        <p className="text-lg text-gray-600 dark:text-gray-400">Ładowanie sesji nauki...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center">
        <p className="text-red-500 text-xl mb-4">Błąd ładowania sesji nauki: {error}</p>
        <a href="/my-flashcards" className="text-blue-500 hover:text-blue-700">
          Wróć do Moich Fiszkozbiorów
        </a>
      </div>
    );
  }

  if (!flashcardsData) {
    // This should ideally not be reached if error handling is robust
    return (
        <div className="flex flex-col justify-center items-center h-screen text-center">
            <p className="text-orange-500 text-xl mb-4">Brak danych fiszek. Skontaktuj się z administratorem.</p>
            <a href="/my-flashcards" className="text-blue-500 hover:text-blue-700">
              Wróć do Moich Fiszkozbiorów
            </a>
        </div>
    );
  }

  // StudySessionView will handle the case of an empty flashcardsData array (e.g. empty set)
  return <StudySessionView flashcards={flashcardsData} setId={setId} />;
};

export default StudySessionLoader; 