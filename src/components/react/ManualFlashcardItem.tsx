import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { TemporaryFlashcard } from "@/types"; // Updated import path
import { useCreateManualViewStore } from "@/lib/stores/createManualViewStore";

interface ManualFlashcardItemProps {
  flashcard: TemporaryFlashcard;
}

const ManualFlashcardItem: React.FC<ManualFlashcardItemProps> = ({ flashcard }) => {
  const openEditFlashcardModal = useCreateManualViewStore((state) => state.openEditFlashcardModal);
  const openConfirmDeleteDialog = useCreateManualViewStore((state) => state.openConfirmDeleteDialog);

  const handleEdit = () => {
    openEditFlashcardModal(flashcard.id);
  };

  const handleDelete = () => {
    openConfirmDeleteDialog(flashcard.id);
  };

  return (
    <Card className="flex flex-col justify-between h-full shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg break-words">Przód:</CardTitle>
        <p className="text-sm text-muted-foreground min-h-[3em] bg-muted p-2 rounded-md break-words">
          {flashcard.front}
        </p>
      </CardHeader>
      <CardContent className="py-2">
        <h3 className="text-md font-semibold break-words">Tył:</h3>
        <p className="text-sm text-muted-foreground min-h-[4.5em] bg-muted p-2 rounded-md break-words">
          {flashcard.back}
        </p>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2 pt-2 pb-3 px-4 border-t mt-auto">
        <Button variant="ghost" size="icon" onClick={handleEdit} aria-label="Edytuj fiszkę">
          <Pencil className="h-5 w-5 text-blue-600 hover:text-blue-700" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleDelete} aria-label="Usuń fiszkę">
          <Trash2 className="h-5 w-5 text-red-600 hover:text-red-700" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ManualFlashcardItem;
