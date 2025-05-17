import React from 'react';
import type { FlashcardSetViewModel } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Trash2 } from 'lucide-react';

interface FlashcardSetCardProps {
  set: FlashcardSetViewModel;
}

const FlashcardSetCard: React.FC<FlashcardSetCardProps> = ({ set }) => {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>{set.name}</CardTitle>
        <CardDescription>{set.status}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground">
          Liczba fiszek: {set.flashcardCount}
        </p>
        <p className="text-sm text-muted-foreground">
          {set.lastStudiedDisplay}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <Button asChild variant="default" size="sm">
          <a href={set.studyLink}>Rozpocznij naukę</a>
        </Button>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button variant="outline" size="icon" disabled tabIndex={-1} style={{ pointerEvents: 'none' }}>
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Usuń zestaw</span>
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Funkcja dostępna wkrótce</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
};

export default FlashcardSetCard; 