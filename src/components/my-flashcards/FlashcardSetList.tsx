import React from 'react';
import type { FlashcardSetViewModel } from '@/types';
import FlashcardSetCard from './FlashcardSetCard'; // Ten komponent zostanie zaimplementowany później

interface FlashcardSetListProps {
  sets: FlashcardSetViewModel[];
}

const FlashcardSetList: React.FC<FlashcardSetListProps> = ({ sets }) => {
  if (sets.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-gray-500">Nie masz jeszcze żadnych zestawów fiszek...</p>
        {/* TODO: Dodać przycisk/link do tworzenia nowego zestawu */}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sets.map((set) => (
        <FlashcardSetCard key={set.id} set={set} />
      ))}
    </div>
  );
};

export default FlashcardSetList; 