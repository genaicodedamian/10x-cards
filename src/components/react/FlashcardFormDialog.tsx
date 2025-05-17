import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

const flashcardSchema = z.object({
  front: z.string().min(1, "Przód fiszki jest wymagany.").max(200, "Przód fiszki może mieć maksymalnie 200 znaków."),
  back: z.string().min(1, "Tył fiszki jest wymagany.").max(500, "Tył fiszki może mieć maksymalnie 500 znaków."),
});

type FlashcardFormData = z.infer<typeof flashcardSchema>;

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
    formState: { errors, isValid, isSubmitting },
  } = useForm<FlashcardFormData>({
    resolver: zodResolver(flashcardSchema),
    mode: "onBlur", // Validate on blur for better UX
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
    } else {
      // Optionally, you can also reset when the dialog is explicitly closed
      // This might be useful if the dialog state is not fully unmounted/remounted by Shadcn/ui Dialog
      // reset({ front: '', back: '' });
    }
  }, [isOpen, mode, initialData, reset]);

  if (!isOpen) {
    return null;
  }

  const onValidSubmit = (data: FlashcardFormData) => {
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
      <DialogContent className="sm:max-w-[425px]">
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
                  className={errors.front ? "border-red-500" : ""}
                />
                {errors.front && <p className="text-xs text-red-500 mt-1">{errors.front.message}</p>}
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
                  className={`${errors.back ? "border-red-500" : ""} resize-none`}
                  style={{ maxHeight: "200px", overflowY: "auto" }}
                />
                {errors.back && <p className="text-xs text-red-500 mt-1">{errors.back.message}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!isValid || isSubmitting} className="mr-2">
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
