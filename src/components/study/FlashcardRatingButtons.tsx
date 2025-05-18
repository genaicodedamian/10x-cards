import React from 'react';
import { Button } from '@/components/ui/button'; // Shadcn/ui Button
import { CheckIcon, XIcon } from 'lucide-react'; // Lucide icons

interface FlashcardRatingButtonsProps {
  onRateKnown: () => void;
  onRateUnknown: () => void;
  disabled?: boolean;
}

const FlashcardRatingButtons: React.FC<FlashcardRatingButtonsProps> = ({ onRateKnown, onRateUnknown, disabled }) => {
  return (
    <div className="flex space-x-4">
      <Button 
        variant="destructive"
        onClick={onRateUnknown} 
        disabled={disabled}
        className="px-6 py-3 text-lg"
      >
        <XIcon className="mr-2 h-5 w-5" /> Nie umiem
      </Button>
      <Button 
        variant="default"
        onClick={onRateKnown} 
        disabled={disabled}
        className="px-6 py-3 text-lg"
      >
        <CheckIcon className="mr-2 h-5 w-5" /> Umiem
      </Button>
    </div>
  );
};

export default FlashcardRatingButtons; 