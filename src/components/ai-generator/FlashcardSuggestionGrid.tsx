import React from "react";
import type { FlashcardSuggestionItemVM } from "./AIFlashcardGenerator";
import FlashcardDisplayItem from "./FlashcardDisplayItem"; // Import actual component

interface FlashcardSuggestionGridProps {
  suggestions: FlashcardSuggestionItemVM[];
  onAccept: (id: string) => void;
  onEdit: (id: string) => void;
  onReject: (id: string) => void;
  onUnaccept: (id: string) => void;
}

const FlashcardSuggestionGrid: React.FC<FlashcardSuggestionGridProps> = ({
  suggestions,
  onAccept,
  onEdit,
  onReject,
  onUnaccept,
}) => {
  // if (suggestions.length === 0) { // This check is now handled in AIFlashcardGenerator
  //   return <p>No suggestions to display.</p>;
  // }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4 md:p-6">
      {suggestions.map((suggestion) => (
        <FlashcardDisplayItem // Use actual component
          key={suggestion.id}
          suggestion={suggestion}
          onAccept={onAccept}
          onEdit={onEdit}
          onReject={onReject}
          onUnaccept={onUnaccept}
        />
      ))}
    </div>
  );
};

export default FlashcardSuggestionGrid;
