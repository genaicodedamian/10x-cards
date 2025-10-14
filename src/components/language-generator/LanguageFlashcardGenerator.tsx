import React, { useState, useEffect, useCallback, useMemo } from "react";
import type {
  LanguageFlashcardSuggestionDto,
  LanguageAIGenerationMetadataDto,
  AIGenerateLanguageFlashcardsCommand,
  AIGenerateLanguageFlashcardsResponseDto,
  CreateFlashcardSetCommand,
  SingleFlashcardSetResponseDto,
  CreateFlashcardCommand,
  BatchCreateFlashcardsCommand,
  BatchCreateFlashcardsResponseDto,
  LanguageCode,
} from "@/types";
import LanguageTopicInput from "./LanguageTopicInput";
import LanguageSelector from "./LanguageSelector";
import { Button } from "@/components/ui/button";
import FlashcardSuggestionGrid from "@/components/ai-generator/FlashcardSuggestionGrid";
import EditFlashcardDialog from "@/components/ai-generator/EditFlashcardDialog";
import SaveSetDialog from "@/components/ai-generator/SaveSetDialog";
import ConfirmRejectDialog from "@/components/ai-generator/ConfirmRejectDialog";
import { Toaster, toast } from "sonner";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export interface LanguageFlashcardSuggestionItemVM extends LanguageFlashcardSuggestionDto {
  id: string;
  isAccepted: boolean;
  currentFront: string;
  currentBack: string;
  originalFront: string;
  originalBack: string;
}

const MIN_TOPIC_LENGTH = 1;
const MAX_TOPIC_LENGTH = 40;

const AVAILABLE_LANGUAGES = [
  { code: "polish" as LanguageCode, label: "Polski" },
  { code: "english" as LanguageCode, label: "Angielski" },
  { code: "german" as LanguageCode, label: "Niemiecki" },
  { code: "french" as LanguageCode, label: "Francuski" },
];

const LanguageFlashcardGenerator: React.FC = () => {
  // Form state
  const [topic, setTopic] = useState<string>("");
  const [frontLanguage, setFrontLanguage] = useState<LanguageCode | null>(null);
  const [backLanguage, setBackLanguage] = useState<LanguageCode | null>(null);

  // Validation state
  const [isTopicValid, setIsTopicValid] = useState<boolean>(false);
  const [charCount, setCharCount] = useState<number>(0);
  const [topicError, setTopicError] = useState<string | null>(null);
  const [languageError, setLanguageError] = useState<string | null>(null);

  // Generation state
  const [suggestions, setSuggestions] = useState<LanguageFlashcardSuggestionItemVM[]>([]);
  const [generationMetadata, setGenerationMetadata] = useState<LanguageAIGenerationMetadataDto | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // UI state
  const [isSavingSet, setIsSavingSet] = useState<boolean>(false);
  const [apiErrorForSaveDialog, setApiErrorForSaveDialog] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [editingFlashcard, setEditingFlashcard] = useState<LanguageFlashcardSuggestionItemVM | null>(null);
  const [isSaveSetDialogOpen, setIsSaveSetDialogOpen] = useState<boolean>(false);
  const [saveMode, setSaveMode] = useState<"all" | "accepted" | null>(null);
  const [showRejectConfirmationDialog, setShowRejectConfirmationDialog] = useState<boolean>(false);
  const [rejectingFlashcardId, setRejectingFlashcardId] = useState<string | null>(null);

  // DEBOUNCED VALIDATION - topic
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      const len = topic.length;
      setCharCount(len);
      if (len === 0) {
        setTopicError(null);
        setIsTopicValid(false);
      } else if (len < MIN_TOPIC_LENGTH) {
        setTopicError("Tematyka jest wymagana");
        setIsTopicValid(false);
      } else if (len > MAX_TOPIC_LENGTH) {
        setTopicError(`Tematyka może mieć maksymalnie ${MAX_TOPIC_LENGTH} znaków`);
        setIsTopicValid(false);
      } else {
        setTopicError(null);
        setIsTopicValid(true);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimeout);
  }, [topic]);

  // Language validation
  useEffect(() => {
    if (frontLanguage && backLanguage && frontLanguage === backLanguage) {
      setLanguageError("Język awersu i rewersu muszą być różne");
    } else {
      setLanguageError(null);
    }
  }, [frontLanguage, backLanguage]);

  // PERFORMANCE OPTIMIZATIONS
  const isFormValid = useMemo(
    () => isTopicValid && frontLanguage && backLanguage && !languageError,
    [isTopicValid, frontLanguage, backLanguage, languageError]
  );

  const acceptedCount = useMemo(() => suggestions.filter((s) => s.isAccepted).length, [suggestions]);

  const handleGenerateSuggestions = useCallback(async () => {
    if (!isFormValid) return;

    setIsLoadingSuggestions(true);
    setGenerationError(null);
    toast.dismiss();

    try {
      const command: AIGenerateLanguageFlashcardsCommand = {
        topic,
        front_language: frontLanguage!,
        back_language: backLanguage!,
      };
      toast.loading("Generowanie słownictwa...");
      const response = await fetch("/api/ai/generate-language-flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Nie udało się wygenerować słownictwa");
      }

      const data: AIGenerateLanguageFlashcardsResponseDto = await response.json();

      const vms = data.suggestions.map(
        (dto): LanguageFlashcardSuggestionItemVM => ({
          ...dto,
          id: crypto.randomUUID(),
          isAccepted: false,
          currentFront: dto.front,
          currentBack: dto.back,
          originalFront: dto.front,
          originalBack: dto.back,
        })
      );
      setSuggestions(vms);
      setGenerationMetadata(data.metadata);
      toast.success(`Wygenerowano ${data.suggestions.length} słów!`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Wystąpił nieznany błąd";
      setGenerationError(errorMessage);
      toast.error(`Błąd: ${errorMessage}`);
    } finally {
      toast.dismiss();
      setIsLoadingSuggestions(false);
    }
  }, [isFormValid, topic, frontLanguage, backLanguage]);

  const handleAcceptSuggestion = useCallback((id: string) => {
    setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, isAccepted: true } : s)));
    toast.success("Słowo zaakceptowane!");
  }, []);

  const handleUnacceptSuggestion = useCallback((id: string) => {
    setSuggestions((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              isAccepted: false,
              currentFront: s.originalFront,
              currentBack: s.originalBack,
            }
          : s
      )
    );
    toast.info("Słowo odrzucone. Przywrócono oryginalną treść.");
  }, []);

  const handleRejectSuggestion = useCallback((id: string) => {
    setRejectingFlashcardId(id);
    setShowRejectConfirmationDialog(true);
  }, []);

  const confirmRejectHandler = useCallback(() => {
    if (rejectingFlashcardId) {
      setSuggestions((prev) => prev.filter((s) => s.id !== rejectingFlashcardId));
      setRejectingFlashcardId(null);
      toast.success("Słowo usunięte.");
    }
    setShowRejectConfirmationDialog(false);
  }, [rejectingFlashcardId]);

  const handleEditSuggestion = useCallback(
    (id: string) => {
      const flashcardToEdit = suggestions.find((s) => s.id === id);
      if (flashcardToEdit) {
        setEditingFlashcard(flashcardToEdit);
        setIsEditDialogOpen(true);
      }
    },
    [suggestions]
  );

  const handleSaveEditedFlashcard = useCallback((updatedData: { id: string; front: string; back: string }) => {
    setSuggestions((prev) =>
      prev.map((s) =>
        s.id === updatedData.id
          ? {
              ...s,
              currentFront: updatedData.front,
              currentBack: updatedData.back,
              isAccepted: true,
            }
          : s
      )
    );
    setIsEditDialogOpen(false);
    setEditingFlashcard(null);
    toast.success("Fiszka zaktualizowana i zaakceptowana!");
  }, []);

  const handleSaveSet = useCallback(
    async (setName: string) => {
      setIsSavingSet(true);
      setApiErrorForSaveDialog(null);
      toast.dismiss();
      toast.loading("Zapisywanie zestawu fiszek...");

      // KRYTYCZNE: Payload bez source_text_length!
      const createSetCommand: CreateFlashcardSetCommand = {
        name: setName,
        ...(generationMetadata && {
          source_text_hash: generationMetadata.topic_hash,
          generation_duration_ms: generationMetadata.generation_duration_ms,
          // KRYTYCZNE: NIE dodawać source_text_length!
          // source_text_length: generationMetadata.topic_length, // <- BŁĄD powoduje 400!
        }),
      };

      let setId: string | null = null;

      try {
        const setResponse = await fetch("/api/flashcard-sets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(createSetCommand),
        });

        if (!setResponse.ok) {
          const errorData = await setResponse.json();
          let specificMessage = "Nie udało się utworzyć zestawu fiszek.";
          if (errorData && errorData.message) {
            specificMessage = errorData.message;
            if (errorData.errors && typeof errorData.errors === "object") {
              const fieldErrors = Object.values(errorData.errors).flat().join(", ");
              if (fieldErrors) specificMessage += `: ${fieldErrors}`;
            }
          }
          throw new Error(specificMessage);
        }
        const newSet: SingleFlashcardSetResponseDto = await setResponse.json();
        setId = newSet.id;
        console.log("New set created with ID:", setId);

        // Krok 2: Dodawanie fiszek do zestawu (Batch Create)
        if (!setId) {
          throw new Error("ID zestawu nie jest dostępne do wsadowego tworzenia fiszek.");
        }

        let flashcardsToCreate: CreateFlashcardCommand[] = [];
        const filteredSuggestions = saveMode === "accepted" ? suggestions.filter((s) => s.isAccepted) : suggestions;

        if (filteredSuggestions.length === 0 && saveMode === "accepted") {
          console.log("Brak zaakceptowanych fiszek do zapisania. Utworzono tylko zestaw.");
        } else if (filteredSuggestions.length === 0 && saveMode === "all") {
          console.log("Brak dostępnych fiszek do zapisania. Utworzono tylko zestaw.");
        } else {
          flashcardsToCreate = filteredSuggestions.map((vm) => ({
            front: vm.currentFront,
            back: vm.currentBack,
            source:
              vm.currentFront !== vm.originalFront || vm.currentBack !== vm.originalBack
                ? "ai_generated_modified"
                : "ai_generated",
          }));

          const batchCommand: BatchCreateFlashcardsCommand = { flashcards: flashcardsToCreate };

          const flashcardsResponse = await fetch(`/api/flashcard-sets/${setId}/flashcards/batch-create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(batchCommand),
          });

          if (!flashcardsResponse.ok) {
            const errorData = await flashcardsResponse.json();
            console.error("Error batch creating flashcards:", errorData.message || errorData);
            setApiErrorForSaveDialog(
              `Zestaw "${setName}" utworzony, ale nie udało się dodać fiszek: ${errorData.message || "Unknown error"}`
            );
          } else {
            const batchResult: BatchCreateFlashcardsResponseDto = await flashcardsResponse.json();
            console.log("Batch create flashcards result:", batchResult);
            if (batchResult.errors && batchResult.errors.length > 0) {
              console.warn("Some flashcards failed to create:", batchResult.errors);
              setApiErrorForSaveDialog(
                `Zestaw "${setName}" utworzony. Niektóre fiszki miały problemy: ${batchResult.errors.map((e) => e.error_message).join("; ")}`
              );
            }
          }
        }

        // Sukces
        toast.success(
          `Zestaw fiszek "${newSet.name}" i ${flashcardsToCreate.length} fiszek zapisane pomyślnie!`
        );
        setTopic("");
        setFrontLanguage(null);
        setBackLanguage(null);
        setSuggestions([]);
        setGenerationMetadata(null);
        setIsSaveSetDialogOpen(false);
        setSaveMode(null);
        console.log("TODO: Redirect to /dashboard");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Wystąpił nieznany błąd podczas zapisywania zestawu.";
        setApiErrorForSaveDialog(errorMessage);
        toast.error(errorMessage);
        console.error("Error saving set process:", error);
      } finally {
        toast.dismiss();
        setIsSavingSet(false);
      }
    },
    [suggestions, saveMode, generationMetadata]
  );

  const handleSaveAccepted = useCallback(() => {
    setSaveMode("accepted");
    setIsSaveSetDialogOpen(true);
  }, []);

  const handleSaveAll = useCallback(() => {
    setSaveMode("all");
    setIsSaveSetDialogOpen(true);
  }, []);

  const handleGoBack = useCallback(() => {
    window.location.href = "/dashboard";
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6 relative">
      <Toaster richColors position="top-right" />

      <div className="absolute top-4 left-4 md:top-6 md:left-6 lg:top-8 lg:left-8 z-10">
        <Button variant="outline" size="icon" onClick={handleGoBack} aria-label="Wróć do panelu">
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>
      </div>

      <h1 className="text-3xl font-bold text-center mb-8 pt-10 md:pt-0">Generuj Fiszki do Nauki Języka</h1>

      <div className="space-y-4 max-w-2xl mx-auto">
        <LanguageTopicInput
          topic={topic}
          onTopicChange={setTopic}
          charCount={charCount}
          error={topicError}
          minLength={MIN_TOPIC_LENGTH}
          maxLength={MAX_TOPIC_LENGTH}
        />

        <div className="grid md:grid-cols-2 gap-4">
          <LanguageSelector
            label="Język awersu (pytanie)"
            selectedLanguage={frontLanguage}
            onLanguageChange={setFrontLanguage}
            languages={AVAILABLE_LANGUAGES}
            placeholder="Wybierz język..."
          />
          <LanguageSelector
            label="Język rewersu (odpowiedź)"
            selectedLanguage={backLanguage}
            onLanguageChange={setBackLanguage}
            languages={AVAILABLE_LANGUAGES}
            placeholder="Wybierz język..."
          />
        </div>

        {languageError && <p className="text-sm text-red-500 text-center">{languageError}</p>}
      </div>

      <div className="flex justify-center">
        <Button onClick={handleGenerateSuggestions} disabled={!isFormValid || isLoadingSuggestions} size="lg">
          {isLoadingSuggestions ? "Generowanie..." : "Generuj Fiszki Językowe"}
        </Button>
      </div>

      {generationError && (
        <div className="text-center text-red-500 mt-4">
          <p>{generationError}</p>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4 text-center">Wygenerowane Słownictwo</h2>
          {generationMetadata && (
            <div className="text-sm text-muted-foreground text-center mb-4 space-y-1">
              <p>
                Model: {generationMetadata.model_used}, Hash tematu:{" "}
                {generationMetadata.topic_hash.substring(0, 8)}...
              </p>
              <p>Czas generowania: {(generationMetadata.generation_duration_ms / 1000).toFixed(2)}s</p>
              <p>
                Języki: {generationMetadata.front_language} → {generationMetadata.back_language}
              </p>
              <p>
                Skrócone: {generationMetadata.truncated_count}, Odrzucone: {generationMetadata.rejected_count}
              </p>
            </div>
          )}
          <FlashcardSuggestionGrid
            suggestions={suggestions}
            onAccept={handleAcceptSuggestion}
            onEdit={handleEditSuggestion}
            onReject={handleRejectSuggestion}
            onUnaccept={handleUnacceptSuggestion}
          />
          <div className="flex justify-center space-x-4 mt-8">
            <Button onClick={handleSaveAccepted} disabled={isSavingSet || acceptedCount === 0} size="lg">
              Zapisz Zaakceptowane ({acceptedCount})
            </Button>
            <Button
              onClick={handleSaveAll}
              disabled={isSavingSet || suggestions.length === 0}
              size="lg"
              variant="outline"
            >
              Zapisz Wszystkie ({suggestions.length})
            </Button>
          </div>
        </div>
      )}

      {suggestions.length === 0 &&
        !isLoadingSuggestions &&
        topic.length > 0 &&
        isFormValid &&
        !generationMetadata && (
          <div className="text-center text-muted-foreground mt-8">
            <p>Kliknij {"'Generuj Fiszki Językowe'"}, aby zobaczyć słownictwo.</p>
          </div>
        )}

      {suggestions.length === 0 && !isLoadingSuggestions && generationMetadata && (
        <div className="text-center text-muted-foreground mt-8">
          <p>Nie znaleziono słownictwa dla podanej tematyki. Spróbuj zmodyfikować temat lub wygenerować ponownie.</p>
        </div>
      )}

      {editingFlashcard && (
        <EditFlashcardDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          flashcard={editingFlashcard}
          onSave={handleSaveEditedFlashcard}
        />
      )}

      <SaveSetDialog
        isOpen={isSaveSetDialogOpen}
        onClose={() => setIsSaveSetDialogOpen(false)}
        onSave={handleSaveSet}
        isSaving={isSavingSet}
        errorSaving={apiErrorForSaveDialog}
      />

      <ConfirmRejectDialog
        isOpen={showRejectConfirmationDialog}
        onClose={() => setShowRejectConfirmationDialog(false)}
        onConfirm={confirmRejectHandler}
      />
    </div>
  );
};

export default LanguageFlashcardGenerator;

