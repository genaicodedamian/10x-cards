import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface LanguageTopicInputProps {
  topic: string;
  onTopicChange: (topic: string) => void;
  charCount: number;
  error: string | null;
  minLength: number;
  maxLength: number;
}

const LanguageTopicInput: React.FC<LanguageTopicInputProps> = ({
  topic,
  onTopicChange,
  charCount,
  error,
  minLength,
  maxLength,
}) => {
  const isInvalid = error !== null && topic.length > 0;
  const isOverLimit = charCount > maxLength;

  return (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="topic-input">Tematyka</Label>
      <Input
        id="topic-input"
        type="text"
        placeholder="Np. Podróżowanie, Gotowanie, Biznes..."
        value={topic}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onTopicChange(e.target.value)}
        className={isInvalid ? "border-red-500 focus-visible:ring-red-500" : ""}
        aria-describedby="topic-validation"
        maxLength={maxLength + 10} // Allow a bit over limit to show error
      />
      <div className="flex justify-between text-sm" id="topic-validation">
        {isOverLimit ? (
          <p className="text-red-500">
            Liczba znaków: {charCount} / {maxLength}
          </p>
        ) : (
          <p className={isInvalid ? "text-red-500" : "text-muted-foreground"}>
            {error ? error : `Liczba znaków: ${charCount} / ${maxLength}`}
          </p>
        )}
        {!isInvalid && !isOverLimit && topic.length > 0 && charCount >= minLength && charCount <= maxLength && (
          <p className="text-green-600">Wygląda dobrze!</p>
        )}
      </div>
    </div>
  );
};

export default LanguageTopicInput;

