import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CreateManualView from './CreateManualView';
import { useCreateManualViewStore } from '@/lib/stores/createManualViewStore';
import { toast } from 'sonner';

// --- Mocks Setup ---

// Mock actions from the Zustand store
const mockActions = {
  openNewFlashcardModal: vi.fn(),
  closeFlashcardFormModal: vi.fn(),
  openSaveSetModal: vi.fn(),
  closeSaveSetModal: vi.fn(),
  addFlashcard: vi.fn(),
  updateFlashcard: vi.fn(),
  deleteFlashcard: vi.fn(),
  saveSetAndFlashcards: vi.fn(),
  clearError: vi.fn(),
  openConfirmDeleteDialog: vi.fn(),
  closeConfirmDeleteDialog: vi.fn(),
  closeSuccessModal: vi.fn(),
};

// Holds the current state of the mocked store
let currentMockStoreState;

// Function to reset and initialize the mock store state and actions
const resetMockStateAndActions = () => {
  Object.values(mockActions).forEach(mockFn => mockFn.mockClear());
  mockActions.saveSetAndFlashcards.mockResolvedValue({ success: true }); // Default successful async resolution

  currentMockStoreState = {
    tempFlashcards: [],
    isFlashcardFormModalOpen: false,
    isSaveSetModalOpen: false,
    isLoading: false,
    editingFlashcard: null,
    error: null,
    isConfirmDeleteDialogOpen: false,
    flashcardIdToDelete: null,
    isSuccessModalOpen: false,
    successModalMessage: '',
    ...mockActions, // Spread actions for direct selection by the component
  };
};

// Mock the Zustand store
vi.mock('@/lib/stores/createManualViewStore', () => ({
  useCreateManualViewStore: vi.fn(selector => selector(currentMockStoreState)),
}));

// Helper to update parts of the mock store state for specific tests
const setMockStoreState = (newStatePart) => {
  currentMockStoreState = { ...currentMockStoreState, ...newStatePart };
  (useCreateManualViewStore as vi.Mock).mockImplementation(selector => selector(currentMockStoreState));
};

// Mock UI components from Shadcn/ui and other libraries
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));
vi.mock('@/components/ui/sonner', () => ({
  Toaster: () => <div data-testid="toaster" />,
}));
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));
vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open, onOpenChange, ...props }) => open ? <div data-testid="alert-dialog" data-is-open={open} {...props}>{children}</div> : null,
  AlertDialogAction: ({ children, ...props }) => <button {...props}>{children}</button>,
  AlertDialogCancel: ({ children, ...props }) => <button {...props}>{children}</button>,
  AlertDialogContent: ({ children, ...props }) => <div {...props}>{children}</div>,
  AlertDialogDescription: ({ children, ...props }) => <p {...props}>{children}</p>,
  AlertDialogFooter: ({ children, ...props }) => <footer {...props}>{children}</footer>,
  AlertDialogHeader: ({ children, ...props }) => <header {...props}>{children}</header>,
  AlertDialogTitle: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
}));

// Mock custom child components
vi.mock('./FlashcardFormDialog', () => ({
  default: ({ isOpen, onClose, onSubmit, initialData, mode }) => isOpen ? (
    <div data-testid="flashcard-form-dialog">
      <button data-testid="flashcard-form-submit" onClick={() => onSubmit({ front: 'Test Front', back: 'Test Back' }, initialData?.id)}>Submit Form</button>
      <button data-testid="flashcard-form-close" onClick={onClose}>Close Form</button>
      <span data-testid="flashcard-form-mode">{mode}</span>
      {initialData && <span data-testid="flashcard-form-initial-id">{initialData.id}</span>}
    </div>
  ) : null,
}));
vi.mock('./TempFlashcardList', () => ({
  default: () => <div data-testid="temp-flashcard-list" />,
}));
vi.mock('./SaveSetDialog', () => ({
  default: ({ isOpen, onClose, onSave, isLoading }) => isOpen ? (
    <div data-testid="save-set-dialog">
      <button data-testid="save-set-submit" onClick={() => onSave('Test Set Name')}>Save Set</button>
      <button data-testid="save-set-close" onClick={onClose}>Close Save</button>
      {isLoading && <span data-testid="save-set-loading">Zapisywanie zestawu...</span>}
    </div>
  ) : null,
}));

// Mock window.location
let mockWindowLocationHref;

beforeEach(() => {
  resetMockStateAndActions();
  // Ensure the store mock uses the reset state for each test
  (useCreateManualViewStore as vi.Mock).mockImplementation(selector => selector(currentMockStoreState));

  // Reset and spy on window.location.href
  mockWindowLocationHref = '';
  Object.defineProperty(window, 'location', {
    value: {
      get href() { return mockWindowLocationHref; },
      set href(val) { mockWindowLocationHref = val; },
    },
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks(); // Good practice to restore mocks
});

describe('CreateManualView Component', () => {
  it('renders the main title and navigation button', () => {
    render(<CreateManualView />);
    expect(screen.getByText('Stwórz Fiszki Manualnie')).toBeInTheDocument();
    expect(screen.getByText('Wróć do Dashboardu')).toBeInTheDocument();
  });

  it('calls openNewFlashcardModal when "+ Stwórz nową fiszkę" button is clicked', () => {
    render(<CreateManualView />);
    fireEvent.click(screen.getByText('+ Stwórz nową fiszkę'));
    expect(mockActions.openNewFlashcardModal).toHaveBeenCalledTimes(1);
  });

  describe('Flashcard Creation and Management', () => {
    it('handleFlashcardSubmit calls addFlashcard for a new flashcard', () => {
      setMockStoreState({ isFlashcardFormModalOpen: true });
      render(<CreateManualView />);
      fireEvent.click(screen.getByTestId('flashcard-form-submit'));

      expect(mockActions.addFlashcard).toHaveBeenCalledWith({ front: 'Test Front', back: 'Test Back' });
      expect(toast.success).toHaveBeenCalledWith('Fiszka dodana pomyślnie!');
      expect(mockActions.closeFlashcardFormModal).toHaveBeenCalledTimes(1);
    });

    it('handleFlashcardSubmit calls updateFlashcard for an existing flashcard', () => {
      const editingId = 'flashcard-123';
      setMockStoreState({
        isFlashcardFormModalOpen: true,
        editingFlashcard: { id: editingId, front: 'Old Front', back: 'Old Back' },
      });
      render(<CreateManualView />);
      fireEvent.click(screen.getByTestId('flashcard-form-submit'));

      expect(mockActions.updateFlashcard).toHaveBeenCalledWith(editingId, { front: 'Test Front', back: 'Test Back' });
      expect(toast.success).toHaveBeenCalledWith('Fiszka zaktualizowana pomyślnie!');
      expect(mockActions.closeFlashcardFormModal).toHaveBeenCalledTimes(1);
    });

    it('confirmDeleteFlashcard calls deleteFlashcard and shows success toast if flashcardIdToDelete is set', () => {
      const flashcardId = 'id-to-delete';
      setMockStoreState({ isConfirmDeleteDialogOpen: true, flashcardIdToDelete: flashcardId });
      render(<CreateManualView />);
      
      // Assuming the confirm button in AlertDialog is "Tak, usuń fiszkę"
      fireEvent.click(screen.getByText('Tak, usuń fiszkę'));

      expect(mockActions.deleteFlashcard).toHaveBeenCalledWith(flashcardId);
      expect(toast.success).toHaveBeenCalledWith('Fiszka usunięta pomyślnie!');
    });
    
    it('confirmDeleteFlashcard does not call deleteFlashcard if flashcardIdToDelete is null', () => {
      setMockStoreState({ isConfirmDeleteDialogOpen: true, flashcardIdToDelete: null });
      render(<CreateManualView />);
      fireEvent.click(screen.getByText('Tak, usuń fiszkę')); // Assuming cancel is "Anuluj" and confirm is "Tak, usuń fiszkę"
      
      expect(mockActions.deleteFlashcard).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalledWith('Fiszka usunięta pomyślnie!');
    });
  });

  describe('Set Management', () => {
    it('calls openSaveSetModal when "Zapisz zestaw fiszek" is clicked and cards exist', () => {
      setMockStoreState({ tempFlashcards: [{ id: '1', front: 'f', back: 'b' }] });
      render(<CreateManualView />);
      fireEvent.click(screen.getByText('Zapisz zestaw fiszek'));
      expect(mockActions.openSaveSetModal).toHaveBeenCalledTimes(1);
    });

    it('"Zapisz zestaw fiszek" button is disabled if no flashcards', () => {
      setMockStoreState({ tempFlashcards: [] });
      render(<CreateManualView />);
      expect(screen.getByText('Zapisz zestaw fiszek')).toBeDisabled();
    });

    it('"Zapisz zestaw fiszek" button is disabled if isLoading is true', () => {
      setMockStoreState({ tempFlashcards: [{ id: '1', front: 'f', back: 'b' }], isLoading: true });
      render(<CreateManualView />);
      expect(screen.getByText('Zapisz zestaw fiszek')).toBeDisabled();
    });
    
    it('displays "Zapisywanie zestawu..." on save button when isLoading and save modal is open', () => {
      setMockStoreState({
        tempFlashcards: [{ id: '1', front: 'f', back: 'b' }],
        isLoading: true,
        isSaveSetModalOpen: true, // This is key for the text change
      });
      render(<CreateManualView />);
      expect(screen.getByRole('button', { name: 'Zapisywanie zestawu...' })).toBeInTheDocument();
    });

    it('handleSaveSet calls saveSetAndFlashcards', async () => {
      setMockStoreState({ isSaveSetModalOpen: true, tempFlashcards: [{id: '1', front: 'a', back: 'b'}] });
      mockActions.saveSetAndFlashcards.mockResolvedValueOnce({ success: true });
      render(<CreateManualView />);
      fireEvent.click(screen.getByTestId('save-set-submit'));

      await waitFor(() => {
        expect(mockActions.saveSetAndFlashcards).toHaveBeenCalledWith('Test Set Name');
      });
    });
  });

  describe('Navigation', () => {
    it('redirects to /dashboard when "Wróć do Dashboardu" is clicked', () => {
      render(<CreateManualView />);
      fireEvent.click(screen.getByText('Wróć do Dashboardu'));
      expect(window.location.href).toBe('/dashboard');
    });

    it('handleCloseSuccessModalAndRedirect calls closeSuccessModal and redirects', () => {
      setMockStoreState({ isSuccessModalOpen: true, successModalMessage: 'Set saved!' });
      render(<CreateManualView />);
      fireEvent.click(screen.getByText('OK')); // Assuming OK button in success dialog

      expect(mockActions.closeSuccessModal).toHaveBeenCalledTimes(1);
      expect(window.location.href).toBe('/dashboard');
    });
  });

  describe('Error Handling', () => {
    it('displays an error toast when store error state changes and clears it', async () => {
      const { rerender } = render(<CreateManualView />);
      const errorMessage = 'Failed to save set';

      setMockStoreState({ error: errorMessage });
      rerender(<CreateManualView />); // Rerender for useEffect to pick up change

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(errorMessage);
      });
      expect(mockActions.clearError).toHaveBeenCalledTimes(1);
    });

    it('does not display error toast if error is null initially', () => {
      setMockStoreState({ error: null });
      render(<CreateManualView />);
      expect(toast.error).not.toHaveBeenCalled();
    });
  });
  
  describe('Modal and Dialog Visibility', () => {
    it('renders FlashcardFormDialog when isFlashcardFormModalOpen is true', () => {
      setMockStoreState({ isFlashcardFormModalOpen: true });
      render(<CreateManualView />);
      expect(screen.getByTestId('flashcard-form-dialog')).toBeInTheDocument();
    });

    it('does not render FlashcardFormDialog when isFlashcardFormModalOpen is false', () => {
      setMockStoreState({ isFlashcardFormModalOpen: false });
      render(<CreateManualView />);
      expect(screen.queryByTestId('flashcard-form-dialog')).not.toBeInTheDocument();
    });
    
    it('renders SaveSetDialog when isSaveSetModalOpen is true', () => {
      setMockStoreState({ isSaveSetModalOpen: true });
      render(<CreateManualView />);
      expect(screen.getByTestId('save-set-dialog')).toBeInTheDocument();
    });

    it('renders ConfirmDelete Dialog when isConfirmDeleteDialogOpen is true', () => {
      setMockStoreState({ isConfirmDeleteDialogOpen: true });
      render(<CreateManualView />);
      expect(screen.getByTestId('alert-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('alert-dialog')).toHaveAttribute('data-is-open', 'true');
      expect(screen.getByText('Czy na pewno chcesz usunąć?')).toBeInTheDocument();
    });

    it('renders Success Dialog when isSuccessModalOpen is true with correct message', () => {
      const successMsg = "Operacja zakończona pomyślnie!";
      setMockStoreState({ isSuccessModalOpen: true, successModalMessage: successMsg });
      render(<CreateManualView />);
      expect(screen.getByTestId('alert-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('alert-dialog')).toHaveAttribute('data-is-open', 'true');
      expect(screen.getByText('Sukces!')).toBeInTheDocument();
      expect(screen.getByText(successMsg)).toBeInTheDocument();
    });
  });
}); 