import React, { useState, useEffect, useId } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SaveSetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (setName: string) => void;
  isSaving: boolean;
  errorSaving: string | null;
}

const MAX_SET_NAME_LENGTH = 100;

const SaveSetDialog: React.FC<SaveSetDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  isSaving,
  errorSaving,
}) => {
  const [setName, setSetName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const nameInputId = useId();

  useEffect(() => {
    if (isOpen) {
      setSetName('');
      setValidationError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (errorSaving) {
      setValidationError(errorSaving);
    }
  }, [errorSaving]);

  const validateName = (name: string): boolean => {
    if (!name.trim()) {
      setValidationError('Set name is required.');
      return false;
    }
    if (name.length > MAX_SET_NAME_LENGTH) {
      setValidationError(`Set name cannot exceed ${MAX_SET_NAME_LENGTH} characters.`);
      return false;
    }
    if (!errorSaving) {
        setValidationError(null);
    }
    return true;
  };

  const handleSave = () => {
    if (validateName(setName)) {
      onSave(setName);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setSetName(newName);
    if (validationError && !errorSaving) {
        validateName(newName);
    } else if (errorSaving && validationError) {
        setValidationError(null);
    }
  };
  
  const handleDialogStateChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogStateChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save New Flashcard Set</DialogTitle>
          <DialogDescription>
            Enter a name for your new set of flashcards. This will help you find it later.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor={nameInputId} className="text-right">
              Set Name
            </Label>
            <Input
              id={nameInputId}
              value={setName}
              onChange={handleNameChange}
              placeholder="e.g., Chapter 5 Vocabulary"
              className="col-span-3"
              disabled={isSaving}
              aria-describedby={validationError ? 'error-message-save-set' : undefined}
            />
          </div>
          {validationError && (
            <p id="error-message-save-set" className="col-span-4 text-sm text-red-600 text-center px-1">
              {validationError}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving || !setName.trim() || setName.length > MAX_SET_NAME_LENGTH } >
            {isSaving ? 'Saving...' : 'Save Set'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveSetDialog; 