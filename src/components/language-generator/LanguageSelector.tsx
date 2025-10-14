import React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LanguageCode } from "@/types";

interface LanguageOption {
  code: LanguageCode;
  label: string;
}

interface LanguageSelectorProps {
  label: string;
  selectedLanguage: LanguageCode | null;
  onLanguageChange: (language: LanguageCode) => void;
  languages: LanguageOption[];
  placeholder: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  label,
  selectedLanguage,
  onLanguageChange,
  languages,
  placeholder,
}) => {
  return (
    <div className="grid w-full gap-1.5">
      <Label>{label}</Label>
      <Select
        value={selectedLanguage || ""}
        onValueChange={(value) => onLanguageChange(value as LanguageCode)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {languages.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              {language.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSelector;

