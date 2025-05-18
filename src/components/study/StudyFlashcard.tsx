import React from 'react';
import type { FlashcardDto } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import './StudyFlashcard.css'; // Import a new CSS file for styles

interface StudyFlashcardProps {
  flashcard: FlashcardDto;
  isFlipped: boolean;
  onFlip: () => void;
}

const StudyFlashcard: React.FC<StudyFlashcardProps> = ({ flashcard, isFlipped, onFlip }) => {
  const cardContentStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    padding: '1rem',
    minHeight: '200px',
    width: '100%', // Ensure content takes full width of the card face
  };

  return (
    <div className="flip-card-outer w-full max-w-lg perspective" onClick={onFlip}>
      <Card className={`flip-card-inner ${isFlipped ? 'is-flipped' : ''} rounded-xl shadow-2xl bg-gray-800 text-gray-200 w-full min-h-[240px]`}>
        {/* Front Side */}
        <div className="flip-card-front">
          {/* CardHeader effectively removed by ensuring no CardHeader component is rendered here */}
          <CardContent style={cardContentStyle}>
            <p className="text-xl font-medium text-gray-100">{flashcard.front}</p>
          </CardContent>
        </div>

        {/* Back Side */}
        <div className="flip-card-back">
          {/* CardHeader effectively removed by ensuring no CardHeader component is rendered here */}
          <CardContent style={cardContentStyle}>
            <p className="text-lg text-gray-200">{flashcard.back}</p>
          </CardContent>
        </div>
      </Card>
    </div>
  );
};

export default StudyFlashcard; 