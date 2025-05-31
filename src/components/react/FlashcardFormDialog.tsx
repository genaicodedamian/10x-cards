import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TemporaryFlashcard } from "@/types";

type FlashcardFormData = {
  front: string;
  back: string;
};

interface FlashcardFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FlashcardFormData, id?: string) => void;
  initialData: TemporaryFlashcard | null;
  mode: "create" | "edit";
}

const FlashcardFormDialog: React.FC<FlashcardFormDialogProps> = ({ isOpen, onClose, onSubmit, initialData, mode }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FlashcardFormData>({
    defaultValues: {
      front: "",
      back: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        reset({ front: initialData.front, back: initialData.back });
      } else {
        reset({ front: "", back: "" }); // Reset for 'create' mode
      }
    }
  }, [isOpen, mode, initialData, reset]);

  if (!isOpen) {
    return null;
  }

  const onValidSubmit = (data: FlashcardFormData) => {
    console.log("onValidSubmit called with data:", data); // Debug log
    onSubmit(data, initialData?.id);
  };

  const dialogTitle = mode === "edit" ? "Edytuj fiszkę" : "Stwórz nową fiszkę";
  const buttonText = mode === "edit" ? "Zapisz zmiany" : "Zapisz fiszkę";

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(openState) => {
        if (!openState) {
          onClose();
          // Consider resetting form here if isOpen in useEffect isn't sufficient
          // reset({ front: '', back: '' });
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]" data-testid="flashcard-form-dialog">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>Wypełnij przód i tył fiszki. Kliknij zapisz, gdy skończysz.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onValidSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="front-input" className="text-right">
                Przód
              </Label>
              <div className="col-span-3">
                <Input
                  id="front-input"
                  {...register("front")}
                  placeholder="Pytanie lub termin"
                  data-testid="flashcard-front-input"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="back-input" className="text-right">
                Tył
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="back-input"
                  {...register("back")}
                  placeholder="Odpowiedź lub definicja"
                  className="resize-none"
                  style={{ maxHeight: "200px", overflowY: "auto" }}
                  data-testid="flashcard-back-input"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="mr-2" data-testid="save-flashcard-button">
              {isSubmitting ? "Zapisywanie..." : buttonText}
            </Button>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  onClose();
                }}
              >
                Anuluj
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FlashcardFormDialog;
