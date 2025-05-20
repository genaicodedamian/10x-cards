## Komponent CreateManualView.tsx

Komponent `CreateManualView` jest komponentem Reacta napisanym w TypeScript, odpowiedzialnym za interfejs użytkownika do ręcznego tworzenia zestawów fiszek.

### Kluczowe Funkcjonalności:

1.  **Zarządzanie Stanem:**
    *   Wykorzystuje `useCreateManualViewStore` (prawdopodobnie hook Zustand) do zarządzania stanem komponentu. Stan obejmuje:
        *   `tempFlashcards`: Tablica tymczasowo przechowywanych fiszek przed zapisaniem.
        *   `isFlashcardFormModalOpen`: Flaga określająca, czy modal do tworzenia/edycji fiszki jest otwarty.
        *   `isSaveSetModalOpen`: Flaga określająca, czy modal do zapisywania zestawu jest otwarty.
        *   `isLoading`: Flaga wskazująca, czy trwa operacja zapisu.
        *   `editingFlashcard`: Obiekt fiszki aktualnie edytowanej (lub `null`).
        *   `error`: Komunikat o błędzie (jeśli wystąpił).
        *   `isConfirmDeleteDialogOpen`: Flaga określająca, czy dialog potwierdzenia usunięcia fiszki jest otwarty.
        *   `flashcardIdToDelete`: ID fiszki przeznaczonej do usunięcia.
        *   `isSuccessModalOpen`: Flaga określająca, czy modal potwierdzający sukces operacji jest otwarty.
        *   `successModalMessage`: Komunikat wyświetlany w modalu sukcesu.
    *   Udostępnia akcje do modyfikacji stanu, takie jak otwieranie/zamykanie modali, dodawanie, aktualizowanie, usuwanie fiszek, zapisywanie zestawu, czyszczenie błędów.

2.  **Interakcje Użytkownika:**
    *   **Tworzenie Nowej Fiszki:** Przycisk "+ Stwórz nową fiszkę" otwiera `FlashcardFormDialog`.
    *   **Zapisywanie Zestawu:** Przycisk "Zapisz zestaw fiszek" otwiera `SaveSetDialog`. Jest nieaktywny, jeśli nie ma żadnych tymczasowych fiszek lub trwa operacja zapisu.
    *   **Nawigacja:** Przycisk "Wróć do Dashboardu" przekierowuje użytkownika na stronę `/dashboard`.
    *   **Wyświetlanie Fiszki:** Komponent `TempFlashcardList` jest odpowiedzialny za wyświetlanie listy tymczasowych fiszek (prawdopodobnie umożliwia ich edycję i usuwanie).

3.  **Obsługa Modali i Dialogów:**
    *   `FlashcardFormDialog`: Używany do tworzenia nowej fiszki lub edycji istniejącej. Po przesłaniu formularza, odpowiednia akcja (`addFlashcard` lub `updateFlashcard`) jest wywoływana, a modal jest zamykany. Wyświetla toast o sukcesie.
    *   `SaveSetDialog`: Używany do wprowadzenia nazwy zestawu i jego zapisania. Wywołuje akcję `saveSetAndFlashcards`.
    *   `AlertDialog` (dla potwierdzenia usunięcia): Wyświetla dialog z prośbą o potwierdzenie przed usunięciem fiszki. Po potwierdzeniu wywołuje akcję `deleteFlashcard` i wyświetla toast o sukcesie.
    *   `AlertDialog` (dla komunikatu o sukcesie): Wyświetla modal z komunikatem o pomyślnym zakończeniu operacji (np. zapisaniu zestawu). Po kliknięciu "OK" przekierowuje na `/dashboard`.

4.  **Obsługa Błędów:**
    *   Wykorzystuje `useEffect` do obserwowania stanu `error`. Jeśli błąd wystąpi, wyświetla go za pomocą `toast.error()` (z biblioteki `sonner`) i następnie czyści błąd za pomocą `clearError()`.

5.  **Obsługa Sukcesu:**
    *   Po pomyślnym dodaniu/aktualizacji/usunięciu fiszki wyświetla odpowiedni komunikat sukcesu za pomocą `toast.success()`.
    *   Po pomyślnym zapisaniu zestawu, wyświetlany jest modal sukcesu, a następnie użytkownik jest przekierowywany.

### Struktura Komponentu (Główne Elementy JSX):

*   Główny `div` z klasą `space-y-6`.
*   `<Toaster richColors />`: Do wyświetlania powiadomień toast.
*   Sekcja nagłówka z tytułem "Stwórz Fiszki Manualnie" i przyciskiem "Wróć do Dashboardu".
*   Sekcja z przyciskami "+ Stwórz nową fiszkę" i "Zapisz zestaw fiszek".
*   Komponent `<TempFlashcardList />` do wyświetlania listy fiszek.
*   Komponent `<FlashcardFormDialog />` (warunkowo renderowany).
*   Komponent `<SaveSetDialog />` (warunkowo renderowany).
*   Dwa komponenty `<AlertDialog />`:
    *   Jeden do potwierdzania usunięcia fiszki.
    *   Drugi do wyświetlania komunikatu o sukcesie operacji i przekierowania.

### Zależności:

*   `react`
*   `@/lib/stores/createManualViewStore`: Magazyn stanu (prawdopodobnie Zustand).
*   `@/components/ui/button`: Komponent przycisku z Shadcn/ui.
*   `./FlashcardFormDialog`: Komponent modala formularza fiszki.
*   `./TempFlashcardList`: Komponent listy tymczasowych fiszek.
*   `./SaveSetDialog`: Komponent modala zapisywania zestawu.
*   `@/components/ui/sonner` i `sonner`: Do wyświetlania powiadomień toast.
*   `@/components/ui/alert-dialog`: Komponenty dialogu alertu z Shadcn/ui.

Komponent ten realizuje kompletną logikę interfejsu do tworzenia fiszek, włączając w to zarządzanie stanem, interakcje z użytkownikiem poprzez modale i dialogi, oraz informowanie o wynikach operacji (sukces, błąd).

### Struktura Komponentów i Zależności (ASCII):

```ascii
CreateManualView.tsx
|-- useCreateManualViewStore (Zustand Store @/lib/stores/createManualViewStore)
|-- Button (@/components/ui/button)
|-- Toaster (@/components/ui/sonner)
|-- toast (sonner library)
|-- AlertDialog, AlertDialogAction, etc. (@/components/ui/alert-dialog)
|
|-- TempFlashcardList.tsx (./TempFlashcardList)
|   |-- (Potencjalnie inne komponenty UI lub hooki)
|
|-- FlashcardFormDialog.tsx (./FlashcardFormDialog)
|   |-- Button (@/components/ui/button)
|   |-- Dialog, DialogContent, etc. (@/components/ui/dialog) 
|   |-- Input (@/components/ui/input)
|   |-- Label (@/components/ui/label)
|   |-- Textarea (@/components/ui/textarea) 
|   |-- (Prawdopodobnie inne hooki np. react-hook-form)
|
|-- SaveSetDialog.tsx (./SaveSetDialog)
    |-- Button (@/components/ui/button)
    |-- Dialog, DialogContent, etc. (@/components/ui/dialog)
    |-- Input (@/components/ui/input)
    |-- Label (@/components/ui/label)
```

**Uwaga:** Powyższa struktura ASCII jest uproszczeniem i zakłada pewne typowe zależności dla komponentów dialogowych i formularzy bazując na bibliotece Shadcn/ui oraz ogólnych praktykach. Dokładne wewnętrzne zależności `TempFlashcardList`, `FlashcardFormDialog` i `SaveSetDialog` wymagałyby inspekcji ich kodu źródłowego.
