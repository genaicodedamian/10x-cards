import React, { useState, useEffect, useCallback } from 'react';
import type { FlashcardSetDto, PaginationInfoDto, PaginatedFlashcardSetsDto, FlashcardSetViewModel } from '@/types';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import FlashcardSetList from './FlashcardSetList';
import PaginationControls from './PaginationControls';
import { formatDate } from '@/lib/utils/dateUtils';

// Zakładamy, że ta funkcja istnieje i jest poprawnie zaimplementowana
// import { formatDate } from '@/lib/utils/dateUtils'; 
// Na potrzeby tego przykładu, zdefiniuję prostą funkcję formatującą datę
/*
const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (error) {
    console.error("Error formatting date:", error);
    return 'Invalid date';
  }
};
*/

const mapDtoToViewModel = (dto: FlashcardSetDto): FlashcardSetViewModel => {
  let translatedStatus: string;
  switch (dto.source_text_hash === null ? 'Manual' : 'AI Generated') {
    case 'AI Generated':
      translatedStatus = 'Wygenerowany przez AI';
      break;
    case 'Manual':
      translatedStatus = 'Stworzony manualnie';
      break;
    default:
      translatedStatus = 'N/A'; // Fallback, shouldn't happen with current logic
  }

  const lastStudiedDisplay = dto.last_studied_at
    ? `Ostatnia nauka: ${formatDate(dto.last_studied_at)}`
    : 'Nie było jeszcze sesji nauki';

  return {
    id: dto.id,
    name: dto.name,
    flashcardCount: dto.total_flashcards_count,
    status: translatedStatus as FlashcardSetViewModel['status'], // Cast as status type is still 'AI Generated' | 'Manual'
                                                              // but we are displaying translated string.
                                                              // Consider changing ViewModel status type if translation is always done here.
    lastStudiedDisplay,
    studyLink: `/study-session/${dto.id}`,
  };
};

const FlashcardSetListWrapper: React.FC = () => {
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSetViewModel[] | null>(null);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfoDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const fetchFlashcardSets = useCallback(async (page: number) => {
    console.log(`[FlashcardSetListWrapper] Fetching flashcard sets for page: ${page}`);
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/flashcard-sets?page=${page}&limit=15&sort_by=last_studied_at&order=desc`);
      console.log('[FlashcardSetListWrapper] API Response Status:', response.status);
      
      if (!response.ok) {
        let errorData = { message: `Błąd HTTP: ${response.status}` };
        try {
          errorData = await response.json();
          console.error('[FlashcardSetListWrapper] API Error Data:', errorData);
        } catch (e) {
          console.error('[FlashcardSetListWrapper] Failed to parse error JSON:', e);
        }
        throw new Error(errorData.message || `Błąd HTTP: ${response.status}`);
      }
      
      const data: PaginatedFlashcardSetsDto = await response.json();
      console.log('[FlashcardSetListWrapper] API Raw Data:', data);

      const viewModel = data.data.map(mapDtoToViewModel);
      console.log('[FlashcardSetListWrapper] Mapped ViewModel:', viewModel);
      setFlashcardSets(viewModel);

      console.log('[FlashcardSetListWrapper] Pagination Info:', data.pagination);
      setPaginationInfo(data.pagination);

    } catch (err) {
      console.error("[FlashcardSetListWrapper] Failed to fetch flashcard sets:", err);
      setError(err instanceof Error ? err.message : 'Nie udało się załadować Twoich zestawów fiszek. Spróbuj ponownie później.');
      setFlashcardSets(null); 
      setPaginationInfo(null);
    } finally {
      setIsLoading(false);
      console.log('[FlashcardSetListWrapper] Fetching complete, isLoading set to false.');
    }
  }, []);

  useEffect(() => {
    fetchFlashcardSets(currentPage);
  }, [currentPage, fetchFlashcardSets]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    console.log('[FlashcardSetListWrapper] Rendering LoadingSpinner');
    return <LoadingSpinner />;
  }

  if (error) {
    console.log('[FlashcardSetListWrapper] Rendering ErrorMessage with:', error);
    return <ErrorMessage message={error} />;
  }

  if (!flashcardSets) {
    console.log('[FlashcardSetListWrapper] Rendering ErrorMessage because flashcardSets is null (and no error state)');
    return <ErrorMessage message="Nie udało się załadować danych. Spróbuj odświeżyć stronę." />;
  }
  
  console.log('[FlashcardSetListWrapper] Rendering FlashcardSetList with sets:', flashcardSets.length);
  return (
    <div>
      <FlashcardSetList sets={flashcardSets} />
      {paginationInfo && paginationInfo.total_pages > 1 && (
        <PaginationControls
          paginationInfo={paginationInfo}
          onPageChange={handlePageChange}
          currentPage={currentPage}
        />
      )}
    </div>
  );
};

export default FlashcardSetListWrapper; 