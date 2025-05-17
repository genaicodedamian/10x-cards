import React from 'react';
import type { PaginationInfoDto } from '@/types'; // Zaktualizuj ścieżkę, jeśli jest inna
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
  paginationInfo: PaginationInfoDto;
  onPageChange: (page: number) => void;
  currentPage: number;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({ paginationInfo, onPageChange, currentPage }) => {
  if (paginationInfo.total_pages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < paginationInfo.total_pages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex justify-center items-center space-x-4 mt-8">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrevious}
        disabled={currentPage === 1}
        aria-label="Poprzednia strona"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      
      <span className="text-sm font-medium">
        Strona {currentPage} z {paginationInfo.total_pages}
      </span>
      
      <Button
        variant="outline"
        size="icon"
        onClick={handleNext}
        disabled={currentPage === paginationInfo.total_pages}
        aria-label="Następna strona"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default PaginationControls; 