import { create } from "zustand";
import type { TemporaryFlashcard, FlashcardSetDto, CreateFlashcardCommand, FlashcardSource, BatchCreateFlashcardsCommand, BatchCreateFlashcardsResponseDto } from "@/types";
import { immer } from "zustand/middleware/immer";

// Based on implementation plan: src/types.ts & ViewModel TemporaryFlashcard

interface CreateManualViewState {
  tempFlashcards: TemporaryFlashcard[];
  isFlashcardFormModalOpen: boolean;
  editingFlashcard: TemporaryFlashcard | null;
  isSaveSetModalOpen: boolean;
  isLoading: boolean;
  error: string | null;
  isConfirmDeleteDialogOpen: boolean;
  flashcardIdToDelete: string | null;
  isSuccessModalOpen: boolean;
  successModalMessage: string | null;
  // Actions
  openNewFlashcardModal: () => void;
  openEditFlashcardModal: (flashcardId: string) => void;
  closeFlashcardFormModal: () => void;
  addFlashcard: (data: { front: string; back: string }) => void;
  updateFlashcard: (flashcardId: string, data: { front: string; back: string }) => void;
  deleteFlashcard: (flashcardId: string) => void;
  openSaveSetModal: () => void;
  closeSaveSetModal: () => void;
  clearError: () => void;
  saveSetAndFlashcards: (setName: string) => Promise<void>;
  openConfirmDeleteDialog: (flashcardId: string) => void;
  closeConfirmDeleteDialog: () => void;
  closeSuccessModal: () => void;
}

export const useCreateManualViewStore = create<CreateManualViewState>()(
  immer((set, get) => ({
    tempFlashcards: [],
    isFlashcardFormModalOpen: false,
    editingFlashcard: null,
    isSaveSetModalOpen: false,
    isLoading: false,
    error: null,
    isConfirmDeleteDialogOpen: false,
    flashcardIdToDelete: null,
    isSuccessModalOpen: false,
    successModalMessage: null,

    openNewFlashcardModal: () =>
      set((state) => {
        state.isFlashcardFormModalOpen = true;
        state.editingFlashcard = null;
      }),
    openEditFlashcardModal: (flashcardId) => {
      const flashcardToEdit = get().tempFlashcards.find((fc) => fc.id === flashcardId);
      if (flashcardToEdit) {
        set({ isFlashcardFormModalOpen: true, editingFlashcard: flashcardToEdit });
      }
    },
    closeFlashcardFormModal: () => set({ isFlashcardFormModalOpen: false, editingFlashcard: null }),
    addFlashcard: (data) => {
      console.log("addFlashcard called with data:", data);
      const newFlashcard: TemporaryFlashcard = {
        id: crypto.randomUUID(),
        front: data.front,
        back: data.back,
      };
      console.log("Created new flashcard:", newFlashcard);
      set((state) => ({ tempFlashcards: [...state.tempFlashcards, newFlashcard] }));
    },
    updateFlashcard: (flashcardId, data) => {
      set((state) => ({
        tempFlashcards: state.tempFlashcards.map((fc) => (fc.id === flashcardId ? { ...fc, ...data } : fc)),
        editingFlashcard: null,
        isFlashcardFormModalOpen: false,
      }));
    },
    deleteFlashcard: (flashcardId) => {
      set((state) => ({ 
        tempFlashcards: state.tempFlashcards.filter((fc) => fc.id !== flashcardId),
        isConfirmDeleteDialogOpen: false,
        flashcardIdToDelete: null,
      }));
    },
    openSaveSetModal: () => set({ isSaveSetModalOpen: true }),
    closeSaveSetModal: () =>
      set((state) => {
        state.isSaveSetModalOpen = false;
      }),
    clearError: () => set({ error: null }),
    saveSetAndFlashcards: async (setName: string) => {
      set({ isLoading: true, error: null });
      try {
        // 1. Create the flashcard set
        const setResponse = await fetch("/api/flashcard-sets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: setName }),
        });

        if (!setResponse.ok) {
          const errorData = await setResponse.json().catch(() => ({
            message: "Nie udało się utworzyć zestawu. Nieprawidłowa odpowiedź JSON z serwera.",
          }));
          let errorMessage = `Błąd ${setResponse.status}: ${setResponse.statusText}`;
          if (errorData && errorData.message) {
            errorMessage = errorData.message;
            if (setResponse.status === 400 && errorData.errors) {
              const fieldErrors = Object.values(errorData.errors).flat().join(", ");
              errorMessage = `Walidacja nie powiodła się: ${fieldErrors}`;
            } else if (setResponse.status === 400 && errorData.message.includes("A set with this name already exists")) {
              errorMessage = "Zestaw o tej nazwie już istnieje.";
            }
          }
          throw new Error(errorMessage);
        }

        const newSet: FlashcardSetDto = await setResponse.json();
        const setId = newSet.id;

        // 2. Prepare flashcards for batch creation
        const tempFlashcards = get().tempFlashcards;
        if (tempFlashcards.length === 0) {
          set({ isLoading: false, error: "Nie można zapisać pustego zestawu. Dodaj najpierw fiszki." });
          return;
        }

        const flashcardsToCreate: CreateFlashcardCommand[] = tempFlashcards.map((fc) => ({
          front: fc.front,
          back: fc.back,
          source: "manual" as FlashcardSource,
        }));

        const batchCommand: BatchCreateFlashcardsCommand = {
          flashcards: flashcardsToCreate,
        };

        // 3. Batch create flashcards
        const batchResponse = await fetch(`/api/flashcard-sets/${setId}/flashcards/batch-create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batchCommand),
        });

        if (!batchResponse.ok) {
          const errorData = await batchResponse.json().catch(() => ({
            message: "Nie udało się zapisać fiszek. Nieprawidłowa odpowiedź JSON z serwera.",
          }));
          let errorMessage = `Zestaw '${setName}' (ID: ${setId}) utworzony, ale nie udało się zapisać fiszek: ${batchResponse.statusText}`;
          if (errorData && errorData.message) {
            errorMessage = `Zestaw '${setName}' utworzony, ale wystąpił błąd podczas zapisywania fiszek: ${errorData.message}`;
          }
          set({ error: errorMessage, isLoading: false, isSaveSetModalOpen: true });
          return;
        }

        const batchResult: BatchCreateFlashcardsResponseDto = await batchResponse.json();

        if (batchResult.errors && batchResult.errors.length > 0) {
          const numFailed = batchResult.errors.length;
          const numTotal = tempFlashcards.length;
          const numSucceeded = batchResult.created_flashcards.length;
          const errorMessage = `Zestaw '${setName}' utworzony. Zapisano ${numSucceeded}/${numTotal} fiszek. ${numFailed} nie powiodło się. Szczegóły: ${batchResult.errors.map(e => e.error_message).join(', ')}`;
          set({
            error: errorMessage, 
            isLoading: false,
            isSaveSetModalOpen: false, 
            tempFlashcards: [], 
            isSuccessModalOpen: true,
            successModalMessage: errorMessage,
          });
          return;
        }

        set({
          tempFlashcards: [],
          isSaveSetModalOpen: false,
          isLoading: false,
          isSuccessModalOpen: true,
          successModalMessage: `Sukces! Zestaw '${setName}' i wszystkie fiszki zostały zapisane.`,
        });
      } catch (e: any) {
        set({ error: e.message || "Wystąpił nieoczekiwany błąd.", isLoading: false });
      }
    },
    openConfirmDeleteDialog: (flashcardId: string) => {
      set((state) => {
        state.isConfirmDeleteDialogOpen = true;
        state.flashcardIdToDelete = flashcardId;
      });
    },
    closeConfirmDeleteDialog: () => {
      set((state) => {
        state.isConfirmDeleteDialogOpen = false;
        state.flashcardIdToDelete = null;
      });
    },
    closeSuccessModal: () => {
      set((state) => {
        state.isSuccessModalOpen = false;
        state.successModalMessage = null;
      });
    },
  }))
);
