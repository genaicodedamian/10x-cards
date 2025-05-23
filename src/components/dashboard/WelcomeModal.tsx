import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface WelcomeModalProps {
  userName: string;
  isOpenInitially: boolean;
  onClose: () => void; // Callback to inform parent that modal was closed by button click
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ userName, isOpenInitially, onClose }) => {
  const [isOpen, setIsOpen] = useState(isOpenInitially);

  useEffect(() => {
    setIsOpen(isOpenInitially);
  }, [isOpenInitially]);

  const handleClose = async () => {
    try {
      const response = await fetch('/api/user/markWelcomeSeen', {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to mark welcome modal as seen:', errorData.error || response.statusText);
        // Optionally, inform user about the error, but still close the modal
      }
    } catch (error) {
      console.error('Error calling markWelcomeSeen API:', error);
      // Optionally, inform user about the error, but still close the modal
    }
    setIsOpen(false);
    onClose(); // Call the parent's onClose callback
  };

  // Prevent closing by Escape key or overlay click if it's the initial mandatory view
  const onOpenChange = (open: boolean) => {
    if (!open && isOpenInitially) {
      // Don't allow closing by other means if it's the first time
      return;
    }
    setIsOpen(open);
    if (!open) {
        onClose(); // also call parent if closed by other means (e.g. escape)
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Witaj, {userName}! 👋</DialogTitle>
          <DialogDescription className="mt-2 text-base text-muted-foreground">
            Cieszymy się, że dołączyłeś do 10x-cards!
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 text-sm">
          <p>
            10x-cards to aplikacja, która pomoże Ci szybko tworzyć i efektywnie zarządzać fiszkami edukacyjnymi.
            Wykorzystujemy sztuczną inteligencję, aby na podstawie Twoich tekstów generować wartościowe sugestie pytań i odpowiedzi, co znacząco skraca czas potrzebny na ich przygotowanie.
          </p>
          <p>
            Nasze generowanie fiszek AI opiera się na zaawansowanym, darmowym modelu{' '}
            <strong className="text-primary">llama-3.1-70b-versatile</strong> (następca llama-3-70b). Model ten świetnie radzi sobie z różnorodnymi treściami, choć najlepsze rezultaty osiąga dla tekstów w języku angielskim.
          </p>
          <p>
            <strong>Ważne informacje:</strong>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>
                Ze względów budżetowych obowiązuje ograniczenie do{' '}
                <strong className="text-primary">200 generacji na godzinę</strong>.
              </li>
              <li>
                Jeśli napotkasz limit, prosimy o chwilę cierpliwości i spróbowanie ponownie później.
              </li>
            </ul>
          </p>
          <p>
            Zacznij tworzyć swoje fiszki już teraz i przekonaj się, jak prosta i efektywna może być nauka!
          </p>
        </div>
        <DialogFooter>
          <Button onClick={handleClose} className="w-full sm:w-auto">OK, rozumiem!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 