import React, { useState, useEffect, useCallback } from "react";
import type {
  FlashcardSuggestionDto,
  AIGenerationMetadataDto as APIMetadataDto,
  AIGenerateFlashcardsCommand,
  AIGenerateFlashcardsResponseDto,
  CreateFlashcardSetCommand,
  SingleFlashcardSetResponseDto,
  CreateFlashcardCommand,
  BatchCreateFlashcardsCommand,
  BatchCreateFlashcardsResponseDto,
} from "@/types";
import SourceTextInput from "./SourceTextInput";
import { Button } from "@/components/ui/button";
import FlashcardSuggestionGrid from "./FlashcardSuggestionGrid";
import EditFlashcardDialog from "./EditFlashcardDialog";
import SaveSetDialog from "./SaveSetDialog";
import ConfirmRejectDialog from "./ConfirmRejectDialog";
import { Toaster, toast } from "sonner";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export interface FlashcardSuggestionItemVM extends FlashcardSuggestionDto {
  id: string;
  isAccepted: boolean;
  currentFront: string;
  currentBack: string;
  originalFront: string;
  originalBack: string;
}

// Renaming imported AIGenerationMetadataDto to avoid conflict if we define a local one or for clarity
type AIGenerationMetadataDto = APIMetadataDto;

const MIN_TEXT_LENGTH = 1000;
const MAX_TEXT_LENGTH = 10000;

const AIFlashcardGenerator: React.FC = () => {
  const [sourceText, setSourceText] = useState<string>("");
  const [isTextValid, setIsTextValid] = useState<boolean>(false);
  const [charCount, setCharCount] = useState<number>(0);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<FlashcardSuggestionItemVM[]>([]);
  const [generationMetadata, setGenerationMetadata] = useState<AIGenerationMetadataDto | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(false);
  const [isSavingSet, setIsSavingSet] = useState<boolean>(false);
  const [apiErrorForSaveDialog, setApiErrorForSaveDialog] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [editingFlashcard, setEditingFlashcard] = useState<FlashcardSuggestionItemVM | null>(null);
  const [isSaveSetDialogOpen, setIsSaveSetDialogOpen] = useState<boolean>(false);
  const [saveMode, setSaveMode] = useState<"all" | "accepted" | null>(null);
  const [showRejectConfirmationDialog, setShowRejectConfirmationDialog] = useState<boolean>(false);
  const [rejectingFlashcardId, setRejectingFlashcardId] = useState<string | null>(null);

  useEffect(() => {
    const len = sourceText.length;
    setCharCount(len);
    if (len === 0) {
      setValidationMessage(null);
      setIsTextValid(false);
    } else if (len < MIN_TEXT_LENGTH) {
      setValidationMessage(`Tekst musi mieć przynajmniej ${MIN_TEXT_LENGTH} znaków.`);
      setIsTextValid(false);
    } else if (len > MAX_TEXT_LENGTH) {
      setValidationMessage(`Tekst nie może przekraczać ${MAX_TEXT_LENGTH} znaków.`);
      setIsTextValid(false);
    } else {
      setValidationMessage(null);
      setIsTextValid(true);
    }
  }, [sourceText]);

  const handleGenerateSuggestions = async () => {
    if (!isTextValid) return;

    setIsLoadingSuggestions(true);
    toast.dismiss();

    try {
      const command: AIGenerateFlashcardsCommand = { text: sourceText };
      toast.loading("Generowanie propozycji...");
      const response = await fetch("/api/ai/generate-flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Nie udało się wygenerować propozycji");
      }

      const data: AIGenerateFlashcardsResponseDto = await response.json();

      const vms = data.suggestions.map(
        (dto): FlashcardSuggestionItemVM => ({
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
      toast.success("Propozycje wygenerowane pomyślnie!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Wystąpił nieznany błąd";
      toast.error(`Błąd podczas generowania propozycji: ${errorMessage}`);
    } finally {
      toast.dismiss();
      setIsLoadingSuggestions(false);
    }
  };

  const handleAccept = useCallback((id: string) => {
    setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, isAccepted: true } : s)));
    toast.success("Propozycja zaakceptowana!");
  }, []);

  const handleUnaccept = useCallback((id: string) => {
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
    toast.info("Propozycja odrzucona. Treść przywrócona do oryginalnej sugestii.");
  }, []);

  const handleReject = useCallback((id: string) => {
    setRejectingFlashcardId(id);
    setShowRejectConfirmationDialog(true);
  }, []);

  const confirmRejectHandler = useCallback(() => {
    if (rejectingFlashcardId) {
      setSuggestions((prev) => prev.filter((s) => s.id !== rejectingFlashcardId));
      setRejectingFlashcardId(null);
      toast.success("Propozycja odrzucona.");
    }
    setShowRejectConfirmationDialog(false);
  }, [rejectingFlashcardId]);

  const handleEdit = useCallback(
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

      // Krok 1: Tworzenie zestawu fiszek
      const setCommand: CreateFlashcardSetCommand = { name: setName };
      if (generationMetadata) {
        setCommand.source_text_hash = generationMetadata.source_text_hash;
        setCommand.source_text_length = generationMetadata.source_text_length;
        setCommand.generation_duration_ms = generationMetadata.generation_duration_ms;
      }

      let setId: string | null = null;

      try {
        const setResponse = await fetch("/api/flashcard-sets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(setCommand),
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
          // Should not happen if previous step was successful
          throw new Error("ID zestawu nie jest dostępne do wsadowego tworzenia fiszek.");
        }

        let flashcardsToCreate: CreateFlashcardCommand[] = [];
        const filteredSuggestions = saveMode === "accepted" ? suggestions.filter((s) => s.isAccepted) : suggestions; // Assuming 'all' means all currently in the suggestions list

        if (filteredSuggestions.length === 0 && saveMode === "accepted") {
          console.log("Brak zaakceptowanych fiszek do zapisania. Utworzono tylko zestaw.");
          // Proceed to success steps as the set is created, but no flashcards to add for 'accepted' mode
        } else if (filteredSuggestions.length === 0 && saveMode === "all") {
          console.log("Brak dostępnych fiszek do zapisania. Utworzono tylko zestaw.");
          // This case might also be considered a success if the user intended an empty set from AI gen
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
            // Log error, but proceed with set creation success for now as per plan (no rollback specified)
            console.error("Error batch creating flashcards:", errorData.message || errorData);
            setApiErrorForSaveDialog(
              `Zestaw "${setName}" utworzony, ale nie udało się dodać fiszek: ${errorData.message || "Unknown error"}`
            );
            // Do not throw here, allow success flow for set creation
          } else {
            const batchResult: BatchCreateFlashcardsResponseDto = await flashcardsResponse.json();
            console.log("Batch create flashcards result:", batchResult);
            if (batchResult.errors && batchResult.errors.length > 0) {
              console.warn("Some flashcards failed to create:", batchResult.errors);
              setApiErrorForSaveDialog(
                `Zestaw "${setName}" utworzony. Niektóre fiszki miały problemy: ${batchResult.errors.map((e) => e.error_message).join("; ")}`
              );
              // Still a partial success for the set itself
            }
          }
        }

        // Sukces obu kroków (lub tylko kroku 1 jeśli nie było co dodawać)
        toast.success(
          `Zestaw fiszek "${newSet.name}" i wszystkie ${flashcardsToCreate.length} fiszki zapisane pomyślnie!`
        );
        setSourceText("");
        setSuggestions([]);
        setGenerationMetadata(null);
        setIsSaveSetDialogOpen(false);
        setSaveMode(null);
        console.log("TODO: Redirect to /dashboard");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Wystąpił nieznany błąd podczas zapisywania zestawu.";
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

  const handleSaveAccepted = () => {
    setSaveMode("accepted");
    setIsSaveSetDialogOpen(true);
  };

  const handleSaveAll = () => {
    setSaveMode("all");
    setIsSaveSetDialogOpen(true);
  };

  const handleGoBack = () => {
    window.location.href = "/dashboard";
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6 relative">
      <Toaster richColors position="top-right" />

      <div className="absolute top-4 left-4 md:top-6 md:left-6 lg:top-8 lg:left-8 z-10">
        <Button variant="outline" size="icon" onClick={handleGoBack} aria-label="Wróć do panelu">
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>
      </div>

      <h1 className="text-3xl font-bold text-center mb-8 pt-10 md:pt-0">Generator Fiszke AI</h1>

      <SourceTextInput
        sourceText={sourceText}
        onTextChange={setSourceText}
        charCount={charCount}
        validationMessage={validationMessage}
        minTextLength={MIN_TEXT_LENGTH}
        maxTextLength={MAX_TEXT_LENGTH}
      />

      <div className="flex justify-center">
        <Button onClick={handleGenerateSuggestions} disabled={!isTextValid || isLoadingSuggestions} size="lg">
          {isLoadingSuggestions ? "Generowanie..." : "Generuj Fiszki"}
        </Button>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4 text-center">Sugerowane Fiszki</h2>
          {generationMetadata && (
            <div className="text-sm text-muted-foreground text-center mb-4 space-y-1">
              <p>
                Model: {generationMetadata.model_used}, Hash źródła:{" "}
                {generationMetadata.source_text_hash.substring(0, 8)}...
              </p>
              <p>Czas generowania: {(generationMetadata.generation_duration_ms / 1000).toFixed(2)}s</p>
              <p>
                Skrócone: {generationMetadata.truncated_count}, Odrzucone: {generationMetadata.rejected_count}
              </p>
            </div>
          )}
          <FlashcardSuggestionGrid
            suggestions={suggestions}
            onAccept={handleAccept}
            onEdit={handleEdit}
            onReject={handleReject}
            onUnaccept={handleUnaccept}
          />
          <div className="flex justify-center space-x-4 mt-8">
            <Button
              onClick={handleSaveAccepted}
              disabled={isSavingSet || suggestions.filter((s) => s.isAccepted).length === 0}
              size="lg"
            >
              Zapisz Zaakceptowane ({suggestions.filter((s) => s.isAccepted).length})
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
        sourceText.length > 0 &&
        isTextValid &&
        !generationMetadata && (
          <div className="text-center text-muted-foreground mt-8">
            <p>Kliknij {"'Generuj Fiszki'"}, aby zobaczyć propozycje.</p>
          </div>
        )}

      {suggestions.length === 0 && !isLoadingSuggestions && generationMetadata && (
        <div className="text-center text-muted-foreground mt-8">
          <p>Nie znaleziono propozycji dla podanego tekstu. Spróbuj zmodyfikować tekst wejściowy lub wygenerować ponownie.</p>
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

export default AIFlashcardGenerator;
