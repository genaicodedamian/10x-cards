import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SourceTextInputProps {
  sourceText: string;
  onTextChange: (text: string) => void;
  minTextLength: number;
  maxTextLength: number;
  charCount: number;
  validationMessage: string | null;
}

const SourceTextInput: React.FC<SourceTextInputProps> = ({
  sourceText,
  onTextChange,
  minTextLength,
  maxTextLength,
  charCount,
  validationMessage,
}) => {
  const isInvalid = validationMessage !== null && sourceText.length > 0;

  return (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="source-text">Tekst Źródłowy</Label>
      <Textarea
        id="source-text"
        placeholder={`Wklej tutaj swój tekst (od ${minTextLength} do ${maxTextLength} znaków)...`}
        value={sourceText}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onTextChange(e.target.value)}
        className={`min-h-[150px] max-h-[300px] resize-y ${isInvalid ? "border-red-500 focus-visible:ring-red-500" : ""}`}
        aria-describedby="source-text-validation"
      />
      <div className="flex justify-between text-sm" id="source-text-validation">
        <p className={isInvalid ? "text-red-500" : "text-muted-foreground"}>
          {validationMessage ? validationMessage : `Liczba znaków: ${charCount} / ${maxTextLength}`}
        </p>
        {!isInvalid && sourceText.length > 0 && charCount >= minTextLength && (
          <p className="text-green-600">Wygląda dobrze!</p>
        )}
      </div>
    </div>
  );
};

export default SourceTextInput;
