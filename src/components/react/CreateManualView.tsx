import React, { useEffect } from "react";
import { useCreateManualViewStore } from "@/lib/stores/createManualViewStore";
import { Button } from "@/components/ui/button";
import FlashcardFormDialog from "./FlashcardFormDialog";
import TempFlashcardList from "./TempFlashcardList";
import SaveSetDialog from "./SaveSetDialog";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // Import AlertDialog components

const CreateManualView: React.FC = () => {
  // Individual selectors for state and actions
  const tempFlashcards = useCreateManualViewStore((state) => state.tempFlashcards);
  const isFlashcardFormModalOpen = useCreateManualViewStore((state) => state.isFlashcardFormModalOpen);
  const isSaveSetModalOpen = useCreateManualViewStore((state) => state.isSaveSetModalOpen);
  const isLoading = useCreateManualViewStore((state) => state.isLoading);
  const editingFlashcard = useCreateManualViewStore((state) => state.editingFlashcard);
  const error = useCreateManualViewStore((state) => state.error);
  const isConfirmDeleteDialogOpen = useCreateManualViewStore((state) => state.isConfirmDeleteDialogOpen); // New state
  const flashcardIdToDelete = useCreateManualViewStore((state) => state.flashcardIdToDelete); // New state
  const isSuccessModalOpen = useCreateManualViewStore((state) => state.isSuccessModalOpen); // New state
  const successModalMessage = useCreateManualViewStore((state) => state.successModalMessage); // New state

  const openNewFlashcardModal = useCreateManualViewStore((state) => state.openNewFlashcardModal);
  const closeFlashcardFormModal = useCreateManualViewStore((state) => state.closeFlashcardFormModal);
  const openSaveSetModal = useCreateManualViewStore((state) => state.openSaveSetModal);
  const closeSaveSetModal = useCreateManualViewStore((state) => state.closeSaveSetModal);
  const addFlashcard = useCreateManualViewStore((state) => state.addFlashcard);
  const updateFlashcard = useCreateManualViewStore((state) => state.updateFlashcard);
  const deleteFlashcard = useCreateManualViewStore((state) => state.deleteFlashcard); // Get deleteFlashcard action
  const saveSetAndFlashcards = useCreateManualViewStore((state) => state.saveSetAndFlashcards);
  const clearError = useCreateManualViewStore((state) => state.clearError);
  const closeConfirmDeleteDialog = useCreateManualViewStore((state) => state.closeConfirmDeleteDialog); // New action
  const closeSuccessModal = useCreateManualViewStore((state) => state.closeSuccessModal); // New action

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleFlashcardSubmit = (data: { front: string; back: string }, id?: string) => {
    if (id) {
      updateFlashcard(id, data);
      toast.success("Fiszka zaktualizowana pomyślnie!");
    } else {
      addFlashcard(data);
      toast.success("Fiszka dodana pomyślnie!");
    }
    closeFlashcardFormModal();
  };

  const handleSaveSet = async (setName: string) => {
    await saveSetAndFlashcards(setName);
  };

  const confirmDeleteFlashcard = () => {
    if (flashcardIdToDelete) {
      deleteFlashcard(flashcardIdToDelete);
      toast.success("Fiszka usunięta pomyślnie!"); // Add success toast for delete
    }
    // The deleteFlashcard action in store already closes the dialog and clears flashcardIdToDelete
  };

  const handleCloseSuccessModalAndRedirect = () => {
    closeSuccessModal();
    window.location.href = "/dashboard";
  };

  return (
    <div className="space-y-6">
      <Toaster richColors />
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Stwórz Fiszki Manualnie</h1>
        <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
          Wróć do Dashboardu
        </Button>
      </div>

      <div className="flex space-x-4">
        <Button onClick={openNewFlashcardModal}>+ Stwórz nową fiszkę</Button>
        <Button onClick={openSaveSetModal} disabled={tempFlashcards.length === 0 || isLoading}>
          {isLoading && isSaveSetModalOpen ? "Zapisywanie zestawu..." : "Zapisz zestaw fiszek"}
        </Button>
      </div>

      <TempFlashcardList />

      <FlashcardFormDialog
        isOpen={isFlashcardFormModalOpen}
        onClose={closeFlashcardFormModal}
        onSubmit={handleFlashcardSubmit}
        initialData={editingFlashcard}
        mode={editingFlashcard ? "edit" : "create"}
      />

      <SaveSetDialog
        isOpen={isSaveSetModalOpen}
        onClose={closeSaveSetModal}
        onSave={handleSaveSet}
        isLoading={isLoading}
      />

      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={closeConfirmDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć?</AlertDialogTitle>
            <AlertDialogDescription>
              Tej operacji nie można cofnąć. Fiszka zostanie trwale usunięta z Twojej tymczasowej listy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeConfirmDeleteDialog}>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteFlashcard}>Tak, usuń fiszkę</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isSuccessModalOpen} onOpenChange={(open) => !open && handleCloseSuccessModalAndRedirect()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sukces!</AlertDialogTitle>
            <AlertDialogDescription>{successModalMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleCloseSuccessModalAndRedirect}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CreateManualView;
