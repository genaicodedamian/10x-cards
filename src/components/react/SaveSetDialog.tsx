import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const saveSetSchema = z.object({
  setName: z.string().min(1, "Nazwa zestawu jest wymagana.").max(100, "Nazwa zestawu może mieć maksymalnie 100 znaków."),
});

type SaveSetFormData = z.infer<typeof saveSetSchema>;

interface SaveSetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (setName: string) => void;
  isLoading: boolean;
}

const SaveSetDialog: React.FC<SaveSetDialogProps> = ({ isOpen, onClose, onSave, isLoading }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<SaveSetFormData>({
    resolver: zodResolver(saveSetSchema),
    mode: 'onBlur',
    defaultValues: { // Ensure defaultValues are set
      setName: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      reset({ setName: '' }); // Reset form when dialog opens
    }
  }, [isOpen, reset]);

  if (!isOpen) {
    return null;
  }

  const handleFormSubmit = (data: SaveSetFormData) => {
    onSave(data.setName);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(openState) => !openState && onClose()}>
      <DialogContent className="sm:max-w-[425px]" data-testid="save-set-dialog">
        <DialogHeader>
          <DialogTitle>Zapisz zestaw fiszek</DialogTitle>
          <DialogDescription>
            Nadaj nazwę swojemu nowemu zestawowi fiszek.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="setName-input" className="text-right">
                Nazwa zestawu
              </Label>
              <div className="col-span-3">
                <Input 
                  id="setName-input" 
                  {...register("setName")}
                  placeholder="Np. Słówka z rozdziału 5"
                  className={errors.setName ? "border-red-500" : ""}
                  data-testid="set-name-input"
                />
                {errors.setName && <p className="text-xs text-red-500 mt-1">{errors.setName.message}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => { reset({ setName: '' }); onClose(); }}>
                Anuluj
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!isValid || isLoading} data-testid="confirm-save-set-button">
              {isLoading ? 'Zapisywanie...' : 'Zapisz zestaw'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SaveSetDialog; 