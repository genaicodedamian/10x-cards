# Plan implementacji widoku "Stwórz Fiszki Manualnie"

## 1. Przegląd
Widok "Stwórz Fiszki Manualnie" (`/create-manual`) umożliwia zalogowanym użytkownikom ręczne tworzenie pojedynczych fiszek (przód i tył), gromadzenie ich na tymczasowej liście, edytowanie i usuwanie ich przed finalnym zapisem. Po przygotowaniu kolekcji fiszek, użytkownik może zapisać je jako nowy, nazwany zestaw fiszek, który następnie będzie dostępny w sekcji "Moje zestawy fiszek".

## 2. Routing widoku
Widok będzie dostępny pod ścieżką `/create-manual`. Dostęp do tej ścieżki powinien być chroniony i wymagać zalogowanego użytkownika. Niezalogowani użytkownicy próbujący uzyskać dostęp powinni być przekierowywani do strony logowania.

## 3. Struktura komponentów
```
/src/pages/create-manual.astro (Strona Astro)
└── /src/components/react/CreateManualView.tsx (Główny komponent React)
    ├── Button (Shadcn/ui) - "Wróć do Dashboardu"
    ├── Button (Shadcn/ui) - "+ Stwórz nową fiszkę"
    ├── FlashcardFormDialog.tsx (Modal React do tworzenia/edycji fiszki)
    │   └── Dialog (Shadcn/ui)
    │       └── DialogContent
    │           ├── DialogHeader
    │           ├── FormGroup (dla "Przód")
    │           │   ├── Label (Shadcn/ui)
    │           │   └── Input (Shadcn/ui)
    │           ├── FormGroup (dla "Tył")
    │           │   ├── Label (Shadcn/ui)
    │           │   └── Textarea (Shadcn/ui) // Lepsze dla potencjalnie dłuższej treści na tyle fiszki
    │           └── DialogFooter
    │               └── Button (Shadcn/ui) - "Zapisz fiszkę" / "Zapisz zmiany"
    ├── TempFlashcardList.tsx (Komponent React wyświetlający listę tymczasowych fiszek)
    │   └── FlashcardDisplay.tsx (Reużywalny komponent React, powtarzany dla każdej tymczasowej fiszki)
    │       └── Card (Shadcn/ui)
    │           ├── CardHeader (Przód fiszki)
    │           ├── CardContent (Tył fiszki)
    │           └── CardFooter (Przyciski akcji)
    │               ├── Button (Shadcn/ui) - Ikona "Edytuj" (np. PencilIcon)
    │               └── Button (Shadcn/ui) - Ikona "Usuń" (np. TrashIcon)
    ├── Button (Shadcn/ui) - "Zapisz zestaw fiszek" (nieaktywny, jeśli lista jest pusta)
    └── SaveSetDialog.tsx (Modal React do nadawania nazwy zestawowi)
        └── Dialog (Shadcn/ui)
            └── DialogContent
                ├── DialogHeader
                ├── FormGroup (dla "Nazwa zestawu")
                │   ├── Label (Shadcn/ui)
                │   └── Input (Shadcn/ui)
                └── DialogFooter
                    └── Button (Shadcn/ui) - "Zapisz zestaw"
```

## 4. Szczegóły komponentów

### `/src/pages/create-manual.astro`
-   **Opis komponentu**: Strona Astro hostująca główny komponent React. Odpowiada za routing, podstawowy layout strony (w tym TopBar z nawigacją użytkownika) oraz ochronę strony (przekierowanie niezalogowanych użytkowników).
-   **Główne elementy**:
    -   Komponent `Layout` aplikacji.
    -   Komponent kliencki `<CreateManualView client:load />`.
    -   Logika weryfikacji sesji użytkownika (np. z `Astro.locals.user`).
-   **Obsługiwane interakcje**: Brak bezpośrednich, delegowane do komponentu React.
-   **Obsługiwana walidacja**: Brak, poza sprawdzeniem sesji.
-   **Typy**: Dane sesji użytkownika (`Astro.locals.user`).
-   **Propsy**: Brak.

### `/src/components/react/CreateManualView.tsx`
-   **Opis komponentu**: Główny komponent React zarządzający logiką tworzenia fiszek manualnie. Odpowiada za stan tymczasowych fiszek, obsługę modali oraz komunikację z API.
-   **Główne elementy**:
    -   `Button` (Shadcn/ui) z tekstem "Wróć do Dashboardu".
    -   `Button` (Shadcn/ui) z tekstem "+ Stwórz nową fiszkę".
    -   Komponent `FlashcardFormDialog`.
    -   Komponent `TempFlashcardList`.
    -   `Button` (Shadcn/ui) z tekstem "Zapisz zestaw fiszek".
    -   Komponent `SaveSetDialog`.
    -   Elementy do wyświetlania komunikatów o ładowaniu lub błędach (np. `Spinner`, `Alert`).
-   **Obsługiwane interakcje**:
    -   Kliknięcie "Wróć do Dashboardu": przekierowuje użytkownika na `/dashboard` (np. używając `window.location.href = '/dashboard'` lub dedykowanej funkcji nawigacji Astro, jeśli dostępna w React).
    -   Kliknięcie "+ Stwórz nową fiszkę": otwiera `FlashcardFormDialog` w trybie tworzenia.
    -   Przesłanie formularza w `FlashcardFormDialog` (nowa fiszka): dodaje fiszkę do stanu tymczasowego.
    -   Przesłanie formularza w `FlashcardFormDialog` (edycja fiszki): aktualizuje fiszkę w stanie tymczasowym.
    -   Kliknięcie "Edytuj" na fiszce w `TempFlashcardList`: otwiera `FlashcardFormDialog` w trybie edycji z danymi tej fiszki.
    -   Kliknięcie "Usuń" na fiszce w `TempFlashcardList`: usuwa fiszkę ze stanu tymczasowego.
    -   Kliknięcie "Zapisz zestaw fiszek": otwiera `SaveSetDialog` (jeśli są fiszki na liście).
    -   Przesłanie formularza w `SaveSetDialog`: inicjuje proces zapisu zestawu i fiszek do API.
-   **Obsługiwana walidacja**:
    -   Przycisk "Zapisz zestaw fiszek" jest nieaktywny, jeśli lista tymczasowych fiszek jest pusta.
-   **Typy**: `TemporaryFlashcard` (ViewModel), `CreateFlashcardSetCommand`, `BatchCreateFlashcardsCommand`, `FlashcardSetDto`, `BatchCreateFlashcardsResponseDto`.
-   **Propsy**: Brak.

### `/src/components/react/FlashcardFormDialog.tsx`
-   **Opis komponentu**: Modal (oparty na Shadcn/ui `Dialog`) zawierający formularz do dodawania nowej lub edytowania istniejącej tymczasowej fiszki.
-   **Główne elementy**:
    -   `Dialog`, `DialogTrigger` (jeśli używany zewnętrznie, tu kontrolowany przez stan rodzica), `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`.
    -   Formularz (`<form>`) z polami:
        -   `Label` i `Input` (Shadcn/ui) dla "Przód".
        -   `Label` i `Textarea` (Shadcn/ui) dla "Tył".
    -   `Button` (Shadcn/ui) "Zapisz fiszkę" / "Zapisz zmiany" (submit).
    -   `Button` (Shadcn/ui, wariant `outline`) "Anuluj" lub `DialogClose`.
-   **Obsługiwane interakcje**:
    -   Wprowadzanie tekstu w polach "Przód" i "Tył".
    -   Kliknięcie przycisku zapisu: waliduje dane i wywołuje `onSubmit` z danymi fiszki.
    -   Kliknięcie przycisku anulowania lub zamknięcia modala: wywołuje `onClose`.
-   **Obsługiwana walidacja**:
    -   Pole "Przód": Wymagane. Maksymalna długość: 200 znaków.
    -   Pole "Tył": Wymagane. Maksymalna długość: 500 znaków.
    -   Wiadomości o błędach walidacji wyświetlane przy polach. Przycisk zapisu nieaktywny, jeśli walidacja nie przechodzi.
-   **Typy**: `TemporaryFlashcard` (dla `initialData`).
-   **Propsy**:
    -   `isOpen: boolean`
    -   `onClose: () => void`
    -   `onSubmit: (data: { front: string; back: string }) => void`
    -   `initialData?: Omit<TemporaryFlashcard, 'id'> | null` (dane do edycji)
    -   `mode: 'create' | 'edit'`

### `/src/components/react/TempFlashcardList.tsx`
-   **Opis komponentu**: Wyświetla siatkę tymczasowo dodanych fiszek.
-   **Główne elementy**:
    -   Kontener (np. `div` stylizowany CSS Grid lub Flexbox).
    -   Mapowanie po liście `flashcards` i renderowanie komponentu `FlashcardDisplay` dla każdej fiszki.
    -   Komunikat "Brak fiszek. Dodaj pierwszą fiszkę!" jeśli lista jest pusta.
-   **Obsługiwane interakcje**: Delegowane do `FlashcardDisplay` (edycja, usuwanie).
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: `TemporaryFlashcard`.
-   **Propsy**:
    -   `flashcards: TemporaryFlashcard[]`
    -   `onEdit: (flashcardId: string) => void`
    -   `onDelete: (flashcardId: string) => void`

### `/src/components/FlashcardDisplay.tsx` (Reużywalny)
-   **Opis komponentu**: Wyświetla pojedynczą fiszkę (przód, tył) wraz z przyciskami akcji. Używany tutaj do wyświetlania tymczasowych fiszek.
-   **Główne elementy**:
    -   `Card` (Shadcn/ui) jako główny kontener.
    -   `CardHeader` lub `div` do wyświetlenia `flashcard.front`.
    -   `CardContent` lub `div` do wyświetlenia `flashcard.back`.
    -   `CardFooter` lub `div` z przyciskami:
        -   `Button` (Shadcn/ui, wariant `ghost` lub `icon`) z ikoną "Edytuj" (np. `Pencil` z `lucide-react`).
        -   `Button` (Shadcn/ui, wariant `ghost` lub `icon`, destructive) z ikoną "Usuń" (np. `Trash2` z `lucide-react`).
-   **Obsługiwane interakcje**:
    -   Kliknięcie przycisku "Edytuj": wywołuje `onEditClick`.
    -   Kliknięcie przycisku "Usuń": wywołuje `onDeleteClick`.
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: `TemporaryFlashcard` (lub bardziej generyczny typ fiszki, jeśli komponent ma być szerzej reużywalny).
-   **Propsy**:
    -   `flashcard: TemporaryFlashcard` (lub podobny interfejs fiszki)
    -   `onEditClick: () => void`
    -   `onDeleteClick: () => void`

### `/src/components/react/SaveSetDialog.tsx`
-   **Opis komponentu**: Modal (oparty na Shadcn/ui `Dialog`) zawierający formularz do wprowadzenia nazwy nowego zestawu fiszek.
-   **Główne elementy**:
    -   `Dialog`, `DialogTrigger` (jeśli używany zewnętrznie), `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`, `DialogClose`.
    -   Formularz (`<form>`) z polem:
        -   `Label` i `Input` (Shadcn/ui) dla "Nazwa zestawu".
    -   `Button` (Shadcn/ui) "Zapisz zestaw".
    -   `Button` (Shadcn/ui, wariant `outline`) "Anuluj" lub `DialogClose`.
-   **Obsługiwane interakcje**:
    -   Wprowadzanie tekstu w polu "Nazwa zestawu".
    -   Kliknięcie przycisku "Zapisz zestaw": waliduje dane i wywołuje `onSave` z nazwą zestawu.
    -   Kliknięcie przycisku anulowania lub zamknięcia modala: wywołuje `onClose`.
-   **Obsługiwana walidacja**:
    -   Pole "Nazwa zestawu": Wymagane. Maksymalna długość: 100 znaków (zgodnie z opisem dla `/generate-ai`, dla spójności).
    -   Wiadomości o błędach walidacji wyświetlane przy polu. Przycisk zapisu nieaktywny, jeśli walidacja nie przechodzi.
-   **Typy**: Brak specyficznych, poza propsami.
-   **Propsy**:
    -   `isOpen: boolean`
    -   `onClose: () => void`
    -   `onSave: (setName: string) => void`
    -   `isLoading: boolean` (do wyświetlania stanu ładowania na przycisku zapisu)

## 5. Typy

### ViewModel
-   **`TemporaryFlashcard`**: Interfejs używany do reprezentowania fiszki w stanie tymczasowym po stronie klienta, zanim zostanie zapisana na backendzie.
    ```typescript
    interface TemporaryFlashcard {
      id: string; // Generowany po stronie klienta (np. crypto.randomUUID()) dla celów identyfikacji w liście
      front: string;
      back: string;
    }
    ```

### DTO (Data Transfer Objects) - używane z `src/types.ts`
-   **`CreateFlashcardSetCommand`**: Używany do wysłania żądania utworzenia nowego zestawu fiszek.
    ```typescript
    // Z src/types.ts
    // type CreateFlashcardSetCommand = Pick<TablesInsert<'flashcard_sets'>, 'name'> &
    //   Partial<Pick<TablesInsert<'flashcard_sets'>, 'source_text_hash' | 'source_text_length' | 'generation_duration_ms'>>;
    // Dla tego widoku użyjemy tylko 'name':
    // { name: string; }
    ```
-   **`FlashcardSetDto`**: Odpowiedź z serwera po utworzeniu zestawu.
    ```typescript
    // Z src/types.ts
    // type FlashcardSetDto = Tables<'flashcard_sets'>;
    ```
-   **`CreateFlashcardCommand`**: Używany jako element tablicy w `BatchCreateFlashcardsCommand`.
    ```typescript
    // Z src/types.ts
    // type CreateFlashcardCommand = Pick<TablesInsert<'flashcards'>, 'front' | 'back'> & {
    //   source: FlashcardSource; // Dla tego widoku 'manual'
    // };
    ```
-   **`BatchCreateFlashcardsCommand`**: Używany do wysłania żądania utworzenia wielu fiszek naraz.
    ```typescript
    // Z src/types.ts
    // type BatchCreateFlashcardsCommand = {
    //   flashcards: CreateFlashcardCommand[];
    // };
    ```
-   **`BatchCreateFlashcardsResponseDto`**: Odpowiedź z serwera po próbie utworzenia wsadowego fiszek.
    ```typescript
    // Z src/types.ts
    // type BatchCreateFlashcardsResponseDto = {
    //   created_flashcards: FlashcardDto[];
    //   errors?: BatchCreateErrorDto[];
    // };
    ```
-   **`FlashcardDto`**: Reprezentacja fiszki z backendu.
    ```typescript
    // Z src/types.ts
    // type FlashcardDto = Tables<'flashcards'>;
    ```

## 6. Zarządzanie stanem
Zarządzanie stanem będzie realizowane przy użyciu biblioteki Zustand. Utworzony zostanie dedykowany store dla tego widoku, np. `createManualViewStore`.

**`createManualViewStore`**:
-   **Stan (State)**:
    -   `tempFlashcards: TemporaryFlashcard[]`: Lista tymczasowo dodanych fiszek.
    -   `isFlashcardFormModalOpen: boolean`: Flaga widoczności modala dodawania/edycji fiszki.
    -   `editingFlashcard: TemporaryFlashcard | null`: Aktualnie edytowana fiszka (lub `null` jeśli tworzona jest nowa).
    -   `isSaveSetModalOpen: boolean`: Flaga widoczności modala zapisu zestawu.
    -   `isLoading: boolean`: Flaga informująca o trwającym procesie zapisu do API.
    -   `error: string | null`: Komunikat błędu z API.
-   **Akcje (Actions)**:
    -   `openNewFlashcardModal()`: Ustawia `isFlashcardFormModalOpen = true`, `editingFlashcard = null`.
    -   `openEditFlashcardModal(flashcardId: string)`: Znajduje fiszkę w `tempFlashcards`, ustawia `editingFlashcard` i `isFlashcardFormModalOpen = true`.
    -   `closeFlashcardFormModal()`: Ustawia `isFlashcardFormModalOpen = false`, `editingFlashcard = null`.
    -   `addFlashcard(data: { front: string; back: string })`: Tworzy nowy obiekt `TemporaryFlashcard` (z `id = crypto.randomUUID()`), dodaje go do `tempFlashcards`.
    -   `updateFlashcard(flashcardId: string, data: { front: string; back: string })`: Aktualizuje dane fiszki o podanym `flashcardId` w `tempFlashcards`.
    -   `deleteFlashcard(flashcardId: string)`: Usuwa fiszkę o podanym `flashcardId` z `tempFlashcards`.
    -   `openSaveSetModal()`: Ustawia `isSaveSetModalOpen = true`.
    -   `closeSaveSetModal()`: Ustawia `isSaveSetModalOpen = false`.
    -   `clearError()`: Ustawia `error = null`.
    -   `saveSetAndFlashcards(setName: string, userId: string, supabaseClient: SupabaseClient)`: Asynchroniczna akcja:
        1.  Ustawia `isLoading = true`, `error = null`.
        2.  Wywołuje API `POST /api/flashcard-sets` (przez dedykowaną funkcję serwisową, np. `flashcardSetService.createSet()`) z `{ name: setName }` i `userId`.
        3.  Jeśli sukces (otrzymano `FlashcardSetDto` z `setId`):
            a.  Przygotowuje `CreateFlashcardCommand[]` z `tempFlashcards` (ustawiając `source: 'manual'`).
            b.  Wywołuje API `POST /api/flashcard-sets/{setId}/flashcards/batch-create` (przez `flashcardService.batchCreateFlashcards()`).
            c.  Jeśli sukces:
                i.  Resetuje stan: `tempFlashcards = []`, `isSaveSetModalOpen = false`.
                ii. Wyświetla toast o sukcesie (np. "Zestaw '[Nazwa]' został utworzony!").
                iii. Przekierowuje użytkownika na `/dashboard`.
            d.  Jeśli błąd przy batch create:
                i.  Ustawia `error` z komunikatem (np. "Zestaw został utworzony, ale wystąpił błąd podczas zapisywania fiszek.").
                ii. Możliwe, że zestaw istnieje, ale jest pusty.
        4.  Jeśli błąd przy tworzeniu zestawu:
            a.  Ustawia `error` z komunikatem błędu.
        5.  Na koniec (w `finally`): Ustawia `isLoading = false`.

## 7. Integracja API
Integracja będzie obejmować dwa główne wywołania API po stronie klienta (inicjowane z akcji w store Zustand):

1.  **Tworzenie nowego zestawu fiszek**:
    -   Endpoint: `POST /api/flashcard-sets`
    -   Metoda HTTP: `POST`
    -   Ciało żądania (`CreateFlashcardSetCommand`):
        ```json
        {
          "name": "Nazwa Nowego Zestawu"
        }
        ```
    -   Odpowiedź sukcesu (201 Created) (`FlashcardSetDto`):
        ```json
        {
          "id": "uuid-setu",
          "user_id": "uuid-uzytkownika",
          "name": "Nazwa Nowego Zestawu",
          // ... inne pola FlashcardSetDto
        }
        ```
    -   Obsługa błędów: 400 (np. błąd walidacji, duplikat nazwy), 401 (brak autoryzacji), 500.

2.  **Wsadowe tworzenie fiszek w nowo utworzonym zestawie**:
    -   Endpoint: `POST /api/flashcard-sets/{setId}/flashcards/batch-create` (gdzie `{setId}` to ID z odpowiedzi poprzedniego żądania)
    -   Metoda HTTP: `POST`
    -   Ciało żądania (`BatchCreateFlashcardsCommand`):
        ```json
        {
          "flashcards": [
            { "front": "Pytanie 1", "back": "Odpowiedź 1", "source": "manual" },
            { "front": "Pytanie 2", "back": "Odpowiedź 2", "source": "manual" }
            // ... więcej fiszek
          ]
        }
        ```
    -   Odpowiedź sukcesu (201 Created) (`BatchCreateFlashcardsResponseDto`):
        ```json
        {
          "created_flashcards": [ /* ... lista obiektów FlashcardDto ... */ ],
          "errors": [ /* ... opcjonalna lista błędów dla poszczególnych fiszek ... */ ]
        }
        ```
    -   Obsługa błędów: 400 (błąd walidacji), 401, 404 (set nie znaleziony), 500.

Do komunikacji z API będą używane funkcje `fetch` lub dedykowany klient HTTP (jeśli istnieje w projekcie), opakowane w funkcje serwisowe (np. `flashcardSetService.createSet`, `flashcardService.batchCreateFlashcards`).

## 8. Interakcje użytkownika
-   **Powrót do Dashboardu**:
    1.  Użytkownik klika przycisk "Wróć do Dashboardu".
    2.  Następuje przekierowanie na stronę `/dashboard`.
-   **Dodawanie nowej fiszki**:
    1.  Użytkownik klika przycisk "+ Stwórz nową fiszkę".
    2.  Otwiera się modal `FlashcardFormDialog`.
    3.  Użytkownik wypełnia pola "Przód" i "Tył".
    4.  Klika "Zapisz fiszkę".
    5.  Modal zamyka się, nowa fiszka pojawia się na liście `TempFlashcardList`.
-   **Edycja tymczasowej fiszki**:
    1.  Użytkownik klika ikonę "Edytuj" na istniejącej fiszce w `TempFlashcardList`.
    2.  Otwiera się modal `FlashcardFormDialog` z załadowanymi danymi tej fiszki.
    3.  Użytkownik modyfikuje pola "Przód" i/lub "Tył".
    4.  Klika "Zapisz zmiany".
    5.  Modal zamyka się, fiszka na liście `TempFlashcardList` jest zaktualizowana.
-   **Usuwanie tymczasowej fiszki**:
    1.  Użytkownik klika ikonę "Usuń" na istniejącej fiszce w `TempFlashcardList`.
    2.  Fiszka jest usuwana z listy `TempFlashcardList` (można dodać `AlertDialog` z potwierdzeniem, ale nie jest to wprost opisane w wymaganiach MVP dla usuwania *tymczasowych* fiszek).
-   **Zapisywanie zestawu fiszek**:
    1.  Użytkownik, mając co najmniej jedną fiszkę na liście `TempFlashcardList`, klika przycisk "Zapisz zestaw fiszek".
    2.  Otwiera się modal `SaveSetDialog`.
    3.  Użytkownik wprowadza nazwę zestawu.
    4.  Klika "Zapisz zestaw".
    5.  Wyświetlany jest stan ładowania.
    6.  Po pomyślnym zapisie:
        -   Toast informuje o sukcesie.
        -   Użytkownik jest przekierowywany na `/dashboard`.
        -   Lista tymczasowych fiszek i stan formularza są czyszczone.
    7.  W przypadku błędu: Wyświetlany jest toast z błędem. Użytkownik pozostaje w widoku `/create-manual`.

## 9. Warunki i walidacja
-   **`FlashcardFormDialog`**:
    -   Pole "Przód": Wymagane. Max 200 znaków.
        -   Stan interfejsu: Jeśli puste lub przekracza limit, wyświetlany jest komunikat błędu pod polem, przycisk "Zapisz fiszkę"/"Zapisz zmiany" jest nieaktywny.
    -   Pole "Tył": Wymagane. Max 500 znaków.
        -   Stan interfejsu: Jeśli puste lub przekracza limit, wyświetlany jest komunikat błędu pod polem, przycisk "Zapisz fiszkę"/"Zapisz zmiany" jest nieaktywny.
-   **`SaveSetDialog`**:
    -   Pole "Nazwa zestawu": Wymagane. Max 100 znaków.
        -   Stan interfejsu: Jeśli puste lub przekracza limit, wyświetlany jest komunikat błędu pod polem, przycisk "Zapisz zestaw" jest nieaktywny.
-   **`CreateManualView`**:
    -   Przycisk "Zapisz zestaw fiszek": Jest aktywny tylko wtedy, gdy `tempFlashcards.length > 0`.
        -   Stan interfejsu: Jeśli lista jest pusta, przycisk jest wyszarzony/nieaktywny.

Walidacja po stronie klienta będzie realizowana przy użyciu biblioteki takiej jak `zod` (jeśli używana w formularzach React, np. z `react-hook-form`) lub manualnie przez sprawdzanie warunków przed wywołaniem akcji `onSubmit`.

## 10. Obsługa błędów
-   **Błędy walidacji formularzy**:
    -   Wyświetlanie komunikatów o błędach bezpośrednio przy polach formularza.
    -   Dezaktywacja przycisków zapisu, jeśli formularz jest niepoprawny.
-   **Błędy API podczas tworzenia zestawu (`POST /api/flashcard-sets`)**:
    -   Wyświetlenie komunikatu błędu (np. za pomocą Shadcn/ui `Sonner` (toast) lub `Alert`).
    -   Błędy typu 400 (np. "Nazwa zestawu już istnieje") powinny być wyświetlane użytkownikowi.
    -   Błędy 500 powinny skutkować ogólnym komunikatem "Wystąpił błąd serwera. Spróbuj ponownie później."
    -   Stan `isLoading` w store Zustand zostanie ustawiony na `false`.
-   **Błędy API podczas wsadowego tworzenia fiszek (`POST /api/flashcard-sets/{setId}/flashcards/batch-create`)**:
    -   Jeśli całe żądanie batch-create zawiedzie (np. błąd 500), zestaw został już utworzony. Należy poinformować użytkownika: "Zestaw '[Nazwa]' został utworzony, ale wystąpił błąd podczas dodawania fiszek. Możesz spróbować dodać je później edytując zestaw."
    -   Jeśli odpowiedź zawiera `errors` w `BatchCreateFlashcardsResponseDto` (niektóre fiszki nie zostały utworzone), można zalogować te błędy i poinformować użytkownika ogólnie, że "Niektóre fiszki mogły nie zostać zapisane."
    -   Stan `isLoading` w store Zustand zostanie ustawiony na `false`.
-   **Brak połączenia sieciowego**:
    -   Standardowa obsługa błędów fetch/axios, informująca użytkownika o problemie z siecią.

Komponent `CreateManualView` powinien subskrybować pole `error` ze store'u Zustand i wyświetlać odpowiednie komunikaty (np. w komponencie `Toast` lub `Alert` na górze strony).

## 11. Kroki implementacji
1.  **Utworzenie struktury plików**:
    -   Utwórz plik strony Astro: `/src/pages/create-manual.astro`.
    -   Utwórz komponent React: `/src/components/react/CreateManualView.tsx`.
    -   Utwórz komponenty pomocnicze React: `/src/components/react/FlashcardFormDialog.tsx`, `/src/components/react/TempFlashcardList.tsx`, `/src/components/react/SaveSetDialog.tsx`. (Zakładamy, że `/src/components/FlashcardDisplay.tsx` już istnieje lub zostanie dostosowany).
2.  **Implementacja strony Astro (`create-manual.astro`)**:
    -   Dodaj podstawowy layout i ochronę ścieżki (przekierowanie dla niezalogowanych).
    -   Osadź komponent `<CreateManualView client:load />`.
3.  **Implementacja Store'u Zustand (`createManualViewStore.ts`)**:
    -   Zdefiniuj stan (state) i akcje (actions) zgodnie z sekcją "Zarządzanie stanem". Na razie bez logiki API.
4.  **Implementacja komponentu `CreateManualView.tsx`**:
    -   Podłącz store Zustand.
    -   Dodaj przycisk "Wróć do Dashboardu" i zaimplementuj nawigację do `/dashboard` po jego kliknięciu (np. przez `<a>` tag lub `window.location.href`).
    -   Dodaj przyciski "+ Stwórz nową fiszkę" i "Zapisz zestaw fiszek".
    -   Zintegruj (na razie bez pełnej logiki) komponenty `FlashcardFormDialog`, `TempFlashcardList`, `SaveSetDialog`.
    -   Powiąż akcje store'u z interakcjami użytkownika (otwieranie/zamykanie modali, aktywacja przycisku zapisu zestawu).
5.  **Implementacja komponentu `FlashcardFormDialog.tsx`**:
    -   Zbuduj formularz z polami "Przód", "Tył" używając komponentów Shadcn/ui.
    -   Dodaj logikę walidacji pól (wymagane, max długość).
    -   Implementuj przekazywanie danych przez prop `onSubmit` i zamykanie modala przez `onClose`.
    -   Obsłuż tryby 'create' i 'edit' (wypełnianie `initialData`).
6.  **Implementacja komponentu `FlashcardDisplay.tsx` (lub jego adaptacja)**:
    -   Upewnij się, że przyjmuje `TemporaryFlashcard` i wywołuje callbacki `onEditClick` i `onDeleteClick`.
    -   Dodaj ikony dla przycisków (np. z `lucide-react`).
7.  **Implementacja komponentu `TempFlashcardList.tsx`**:
    -   Renderuj listę `TemporaryFlashcard` używając `FlashcardDisplay`.
    -   Przekaż callbacki `onEdit` i `onDelete` do `FlashcardDisplay`.
8.  **Implementacja komponentu `SaveSetDialog.tsx`**:
    -   Zbuduj formularz z polem "Nazwa zestawu".
    -   Dodaj logikę walidacji pola (wymagane, max długość).
    -   Implementuj przekazywanie danych przez prop `onSave` i zamykanie modala przez `onClose`.
9.  **Integracja API w Store Zustand**:
    -   Zaimplementuj logikę w akcji `saveSetAndFlashcards` do wywoływania `POST /api/flashcard-sets` i `POST /api/flashcard-sets/{setId}/flashcards/batch-create`.
    -   Wykorzystaj (lub stwórz jeśli nie istnieją) funkcje serwisowe `flashcardSetService.createSet()` i `flashcardService.batchCreateFlashcards()`.
    -   Obsłuż stany `isLoading` i `error`.
    -   Dodaj obsługę sukcesu (czyszczenie stanu, toast, przekierowanie).
10. **Styling i UX**:
    -   Dopracuj wygląd komponentów używając Tailwind CSS.
    -   Upewnij się, że wszystkie interaktywne elementy są dostępne z klawiatury i mają odpowiednie etykiety ARIA.
    -   Przetestuj responsywność widoku.
11. **Obsługa błędów i powiadomienia**:
    -   Zintegruj wyświetlanie błędów API i sukcesów za pomocą komponentu `Sonner` (toast) z Shadcn/ui.
12. **Testowanie**:
    -   Przetestuj cały przepływ dodawania, edycji, usuwania fiszek oraz zapisywania zestawu.
    -   Sprawdź obsługę błędów walidacji i błędów API.
    -   Sprawdź przekierowania i stan aplikacji po różnych akcjach.