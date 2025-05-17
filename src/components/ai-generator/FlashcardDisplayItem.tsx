import React from "react";
import type { FlashcardSuggestionItemVM } from "./AIFlashcardGenerator";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckIcon, PencilSquareIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

interface FlashcardDisplayItemProps {
  suggestion: FlashcardSuggestionItemVM;
  onAccept: (id: string) => void;
  onEdit: (id: string) => void;
  onReject: (id: string) => void;
  onUnaccept: (id: string) => void;
}

const FlashcardDisplayItem: React.FC<FlashcardDisplayItemProps> = ({
  suggestion,
  onAccept,
  onEdit,
  onReject,
  onUnaccept,
}) => {
  const { id, currentFront, currentBack, validation_status, validation_message, isAccepted } = suggestion;

  const cardClasses = cn(
    "flex flex-col justify-between h-full shadow-md hover:shadow-lg transition-shadow duration-200",
    {
      "border-green-500 border-2": isAccepted,
      "border-red-500 border-2 opacity-80": validation_status === "rejected" && !isAccepted,
      "border-yellow-500 border-2": validation_status === "truncated" && !isAccepted,
      "border-border": !isAccepted && validation_status !== "rejected" && validation_status !== "truncated",
    }
  );

  const displayItem = (
    <Card className={cardClasses}>
      <CardContent className="space-y-3 flex-grow px-4 pt-4 pb-2">
        <div>
          <p className="text-sm min-h-[3em] bg-muted p-2 rounded-md">{currentFront}</p>
        </div>
        <div>
          <p className="text-sm min-h-[4.5em] bg-muted p-2 rounded-md">{currentBack}</p>
        </div>
        {validation_status !== "valid" && validation_message && !isAccepted && (
          <p
            className={cn("text-xs mt-1", {
              "text-red-600": validation_status === "rejected",
              "text-yellow-600": validation_status === "truncated",
            })}
          >
            <strong>Status:</strong> {validation_message}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-end space-x-2 pt-2 pb-3 px-4 border-t mt-auto">
        {!isAccepted && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => onAccept(id)} aria-label="Zaakceptuj sugestię">
                  <CheckIcon className="h-5 w-5 text-green-600 hover:text-green-700" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Akceptuj</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {validation_status !== "rejected" && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => onEdit(id)} aria-label="Edytuj sugestię">
                  <PencilSquareIcon className="h-5 w-5 text-blue-600 hover:text-blue-700" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edytuj</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {isAccepted && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => onUnaccept(id)} aria-label="Cofnij akceptację sugestii">
                  <XMarkIcon className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cofnij akceptację</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {!isAccepted && validation_status !== "rejected" && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => onReject(id)} aria-label="Odrzuć sugestię">
                  <XMarkIcon className="h-5 w-5 text-red-600 hover:text-red-700" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Odrzuć</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardFooter>
    </Card>
  );

  if (validation_message && (validation_status === "truncated" || validation_status === "rejected") && !isAccepted) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild className="h-full w-full cursor-help">
            {displayItem}
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="max-w-xs bg-background border-border text-foreground p-2 rounded-md shadow-lg"
          >
            <p className="text-sm font-semibold mb-1">Problem z Walidacją:</p>
            <p className="text-xs">{validation_message}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return displayItem;
};

export default FlashcardDisplayItem;
