import React, { useState, useEffect, useId } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FlashcardSuggestionItemVM } from "./AIFlashcardGenerator";

interface EditFlashcardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  flashcard: FlashcardSuggestionItemVM | null;
  onSave: (updatedData: { id: string; front: string; back: string }) => void;
}

const EditFlashcardDialog: React.FC<EditFlashcardDialogProps> = ({ isOpen, onClose, flashcard, onSave }) => {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [error, setError] = useState<string | null>(null);

  const frontInputId = useId();
  const backInputId = useId();

  useEffect(() => {
    if (flashcard) {
      setFront(flashcard.currentFront);
      setBack(flashcard.currentBack);
      setError(null);
    } else {
      setFront("");
      setBack("");
      setError(null);
    }
  }, [flashcard]);

  const handleSave = () => {
    if (!front.trim() || !back.trim()) {
      setError("Pola awers i rewers są wymagane.");
      return;
    }
    if (flashcard) {
      onSave({ id: flashcard.id, front, back });
      onClose();
    }
    setError(null);
  };

  const handleDialogStateChange = (open: boolean) => {
    if (!open) {
      onClose();
      setError(null);
    }
  };

  if (!flashcard) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogStateChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edytuj Sugestię Fiszki</DialogTitle>
          <DialogDescription>
            Wprowadź zmiany na awersie i rewersie fiszki. Kliknij zapisz, gdy skończysz.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor={frontInputId} className="text-right">
              Awers
            </Label>
            <Input
              id={frontInputId}
              value={front}
              onChange={(e) => setFront(e.target.value)}
              className="col-span-3"
              aria-describedby={error ? "error-message" : undefined}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor={backInputId} className="text-right">
              Rewers
            </Label>
            <Input
              id={backInputId}
              value={back}
              onChange={(e) => setBack(e.target.value)}
              className="col-span-3"
              aria-describedby={error ? "error-message" : undefined}
            />
          </div>
          {error && (
            <p id="error-message" className="col-span-4 text-sm text-red-600 text-center">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button onClick={handleSave}>Zapisz Zmiany</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditFlashcardDialog;
