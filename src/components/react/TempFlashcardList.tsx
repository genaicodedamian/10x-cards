import React from "react";
import { useCreateManualViewStore } from "@/lib/stores/createManualViewStore";
import ManualFlashcardItem from "./ManualFlashcardItem";
import type { TemporaryFlashcard } from "@/types"; // Updated import path

const TempFlashcardList: React.FC = () => {
  const tempFlashcards = useCreateManualViewStore((state) => state.tempFlashcards);
  const openEditFlashcardModal = useCreateManualViewStore((state) => state.openEditFlashcardModal);
  const deleteFlashcard = useCreateManualViewStore((state) => state.deleteFlashcard);

  if (tempFlashcards.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Brak fiszek. Dodaj pierwszą fiszkę!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4 md:p-0">
      {tempFlashcards.map((flashcard: TemporaryFlashcard) => (
        <ManualFlashcardItem
          key={flashcard.id}
          flashcard={flashcard}
          onEdit={openEditFlashcardModal}
          onDelete={deleteFlashcard}
        />
      ))}
    </div>
  );
};

export default TempFlashcardList;
