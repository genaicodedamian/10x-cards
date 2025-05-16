# Plan implementacji widoku "Generuj Fiszki AI"

## 1. Przegląd
Widok "Generuj Fiszki AI" umożliwia użytkownikom generowanie propozycji fiszek na podstawie dostarczonego tekstu źródłowego przy użyciu sztucznej inteligencji. Użytkownicy mogą przeglądać, akceptować, edytować lub odrzucać wygenerowane sugestie, a następnie zapisać wybrane fiszki jako nowy, nazwany zestaw. Widok ten ma na celu przyspieszenie procesu tworzenia materiałów do nauki.

## 2. Routing widoku
Widok będzie dostępny pod ścieżką `/generate-ai`. Dostęp do tego widoku powinien być ograniczony tylko dla zalogowanych użytkowników.

## 3. Struktura komponentów
```
GenerateAIPage.astro (Layout strony)
└── AIFlashcardGenerator.tsx (Główny komponent React)
    ├── SourceTextInput.tsx (Komponent pola tekstowego)
    │   ├── Textarea (Shadcn/ui)
    │   └── Label (Shadcn/ui) (licznik znaków, walidacja)
    ├── Button (Shadcn/ui) ("Generate Flashcards")
    ├── FlashcardSuggestionGrid.tsx (Siatka sugestii)
    │   └── FlashcardDisplayItem.tsx (Komponent pojedynczej sugestii fiszki, powtarzalny)
    │       ├── Card (Shadcn/ui)
    │       ├── Tooltip (Shadcn/ui) (dla `validation_message`)
    │       └── Button (Shadcn/ui) (ikony Akceptuj, Edytuj, Odrzuć)
    ├── Button (Shadcn/ui) ("Save accepted")
    ├── Button (Shadcn/ui) ("Save all")
    ├── EditFlashcardDialog.tsx (Modal edycji sugestii)
    │   ├── Dialog (Shadcn/ui)
    │   ├── Input (Shadcn/ui) (dla przodu fiszki)
    │   ├── Input (Shadcn/ui) (dla tyłu fiszki)
    │   └── Button (Shadcn/ui) ("Zapisz zmiany")
    └── SaveSetDialog.tsx (Modal zapisu zestawu)
        ├── Dialog (Shadcn/ui)
        ├── Input (Shadcn/ui) (dla nazwy zestawu)
        └── Button (Shadcn/ui) ("Zapisz zestaw")
```
Komponent `Sonner` (Shadcn/ui) będzie używany globalnie (prawdopodobnie w głównym layoucie Astro) do wyświetlania powiadomień "toast" po pomyślnym zapisaniu zestawu.

## 4. Szczegóły komponentów

### `GenerateAIPage.astro`
-   **Opis komponentu:** Główny plik Astro dla ścieżki `/generate-ai`. Odpowiada za renderowanie layoutu strony i osadzenie głównego komponentu React (`AIFlashcardGenerator`).
-   **Główne elementy:** Standardowa struktura layoutu Astro, import i renderowanie `<AIFlashcardGenerator client:load />`.
-   **Obsługiwane interakcje:** Brak bezpośrednich, deleguje do komponentu React.
-   **Obsługiwana walidacja:** Brak.
-   **Typy:** Brak specyficznych.
-   **Propsy:** Brak.

### `AIFlashcardGenerator.tsx` (Komponent React)
-   **Opis komponentu:** Główny komponent interaktywny widoku. Zarządza stanem całego procesu: tekstem źródłowym, ładowaniem i wyświetlaniem sugestii, interakcjami z sugestiami (akceptacja, edycja, odrzucenie), stanem dialogów oraz procesem zapisu nowego zestawu fiszek.
-   **Główne elementy:** `SourceTextInput`, `Button` ("Generate Flashcards"), `FlashcardSuggestionGrid`, `Button` ("Save accepted"), `Button` ("Save all"), `EditFlashcardDialog`, `SaveSetDialog`. Wyświetla komunikaty o błędach i stanie ładowania.
-   **Obsługiwane interakcje:**
    -   Zmiana tekstu źródłowego.
    -   Kliknięcie przycisku "Generate Flashcards".
    -   Akceptacja, edycja (otwarcie modala), odrzucenie sugestii.
    -   Otwarcie modala zapisu zestawu ("Save accepted", "Save all").
    -   Zapis edytowanej sugestii w modalu.
    -   Zapis nowego zestawu fiszek z modala.
-   **Obsługiwana walidacja:** Logika sterowania aktywnością przycisków na podstawie stanu (np. aktywny "Generate Flashcards" tylko gdy tekst spełnia kryteria, "Save accepted" tylko gdy są zaakceptowane fiszki).
-   **Typy:** `FlashcardSuggestionItemVM[]`, `AIGenerationMetadataDto | null`.
-   **Propsy:** Brak.

### `SourceTextInput.tsx` (Komponent React)
-   **Opis komponentu:** Odpowiada za pole do wprowadzania tekstu źródłowego, wyświetlanie licznika znaków oraz komunikatów walidacyjnych dotyczących długości tekstu.
-   **Główne elementy:** `Textarea` (Shadcn/ui), `Label` lub `span` (Shadcn/ui) dla licznika i komunikatów.
-   **Obsługiwane interakcje:** Wprowadzanie tekstu.
-   **Obsługiwana walidacja:** Wyświetla komunikaty na podstawie przekazanej informacji o walidacji (np. "Tekst musi mieć między 1000 a 10000 znaków."). Wizualne wskazanie błędu, jeśli tekst nie spełnia kryteriów.
-   **Typy:** `string` (dla wartości tekstu).
-   **Propsy:**
    -   `text: string`
    -   `onTextChange: (text: string) => void`
    -   `minLength: number`
    -   `maxLength: number`
    -   `charCount: number`
    -   `isValid: boolean`
    -   `validationMessage: string | null`

### `FlashcardSuggestionGrid.tsx` (Komponent React)
-   **Opis komponentu:** Renderuje siatkę (do 3 kolumn) komponentów `FlashcardDisplayItem` reprezentujących sugestie fiszek.
-   **Główne elementy:** Kontener (np. `div` stylizowany za pomocą CSS Grid lub Flexbox), mapowanie listy sugestii na komponenty `FlashcardDisplayItem`.
-   **Obsługiwane interakcje:** Delegowanie akcji (akceptuj, edytuj, odrzuć) z `FlashcardDisplayItem` do `AIFlashcardGenerator`.
-   **Obsługiwana walidacja:** Brak.
-   **Typy:** `FlashcardSuggestionItemVM[]`.
-   **Propsy:**
    -   `suggestions: FlashcardSuggestionItemVM[]`
    -   `onAccept: (id: string) => void`
    -   `onEdit: (id: string) => void`
    -   `onReject: (id: string) => void`

### `FlashcardDisplayItem.tsx` (Komponent React)
-   **Opis komponentu:** Wyświetla pojedynczą sugestię fiszki. Pokazuje przód, tył, przyciski akcji (ikony), wizualne wyróżnienie dla statusów `truncated` lub `rejected` oraz tooltip z `validation_message`.
-   **Główne elementy:** `Card` (Shadcn/ui) jako kontener. Elementy tekstowe dla przodu i tyłu. Trzy `Button` (Shadcn/ui) z ikonami (✓, ✎, ✗). `Tooltip` (Shadcn/ui) owijający kartę lub jej część.
-   **Obsługiwane interakcje:** Kliknięcie przycisków "Akceptuj", "Edytuj", "Odrzuć".
-   **Obsługiwana walidacja:** Wizualne wskazanie statusu (np. zmiana tła, obramowania) jeśli `validation_status` to `truncated` lub `rejected`.
-   **Typy:** `FlashcardSuggestionItemVM`.
-   **Propsy:**
    -   `suggestion: FlashcardSuggestionItemVM`
    -   `onAccept: (id: string) => void`
    -   `onEdit: (id: string) => void`
    -   `onReject: (id: string) => void`

### `EditFlashcardDialog.tsx` (Komponent React)
-   **Opis komponentu:** Modal (dialog) do edycji treści przodu i tyłu wybranej sugestii fiszki.
-   **Główne elementy:** `Dialog` (Shadcn/ui). `Label` i `Input` (Shadcn/ui) dla przodu. `Label` i `Input` (Shadcn/ui) dla tyłu. `Button` (Shadcn/ui) "Zapisz zmiany".
-   **Obsługiwane interakcje:** Wprowadzanie tekstu w polach, kliknięcie "Zapisz zmiany", zamknięcie modala.
-   **Obsługiwana walidacja:** Pola `Input` mogą mieć podstawową walidację (np. niepuste), chociaż główna walidacja długości itp. jest po stronie API przy finalnym zapisie.
-   **Typy:** Pola formularza: `string`.
-   **Propsy:**
    -   `isOpen: boolean`
    -   `onOpenChange: (isOpen: boolean) => void`
    -   `flashcardData: { id: string, currentFront: string, currentBack: string } | null` (dane edytowanej fiszki)
    -   `onSave: (updatedData: { id: string, front: string, back: string }) => void`

### `SaveSetDialog.tsx` (Komponent React)
-   **Opis komponentu:** Modal (dialog) do wprowadzenia nazwy nowego zestawu fiszek przed jego zapisaniem.
-   **Główne elementy:** `Dialog` (Shadcn/ui). `Label` i `Input` (Shadcn/ui) dla nazwy zestawu. `Button` (Shadcn/ui) "Zapisz zestaw". Komunikat walidacyjny dla nazwy.
-   **Obsługiwane interakcje:** Wprowadzanie nazwy zestawu, kliknięcie "Zapisz zestaw", zamknięcie modala.
-   **Obsługiwana walidacja:** Nazwa zestawu jest wymagana, maksymalnie 100 znaków.
-   **Typy:** Pole formularza: `string`.
-   **Propsy:**
    -   `isOpen: boolean`
    -   `onOpenChange: (isOpen: boolean) => void`
    -   `onSave: (setName: string) => void`
    -   `isLoading: boolean` (do deaktywacji przycisku podczas zapisu)

## 5. Typy

### Typy DTO (z `src/types.ts` - bez zmian, tylko referencja)
-   `AIGenerateFlashcardsCommand`: `{ text: string }`
-   `AIGenerateFlashcardsResponseDto`: `{ suggestions: FlashcardSuggestionDto[], metadata: AIGenerationMetadataDto }`
-   `FlashcardSuggestionDto`: `{ front: string, back: string, validation_status: ValidationStatus, validation_message?: string }`
-   `AIGenerationMetadataDto`: `{ source_text_hash: string, source_text_length: number, generation_duration_ms: number, model_used: string, truncated_count: number, rejected_count: number, total_suggestions: number }`
-   `ValidationStatus`: `'valid' | 'truncated' | 'rejected'`
-   `CreateFlashcardSetCommand`: `{ name: string, source_text_hash?: string, source_text_length?: number, generation_duration_ms?: number }`
-   `SingleFlashcardSetResponseDto`: `FlashcardSetDto` (z `database.types.ts`)
-   `CreateFlashcardCommand`: `{ front: string, back: string, source: FlashcardSource }`
-   `FlashcardSource`: `'manual' | 'ai_generated' | 'ai_generated_modified'`
-   `BatchCreateFlashcardsCommand`: `{ flashcards: CreateFlashcardCommand[] }`
-   `BatchCreateFlashcardsResponseDto`: `{ created_flashcards: FlashcardDto[], errors?: BatchCreateErrorDto[] }`

### Typy ViewModel (nowe, dla stanu komponentów React)
-   `FlashcardSuggestionItemVM`: Rozszerzenie `FlashcardSuggestionDto` o stan kliencki.
    ```typescript
    interface FlashcardSuggestionItemVM extends FlashcardSuggestionDto {
      id: string; // Unikalne ID po stronie klienta (np. crypto.randomUUID())
      isAccepted: boolean; // Czy użytkownik zaakceptował tę sugestię
      currentFront: string; // Aktualna treść przodu (może być edytowana)
      currentBack: string; // Aktualna treść tyłu (może być edytowana)
      originalFront: string; // Oryginalna treść przodu od AI
      originalBack: string; // Oryginalna treść tyłu od AI
    }
    ```

## 6. Zarządzanie stanem
Stan będzie zarządzany głównie w komponencie `AIFlashcardGenerator.tsx` przy użyciu haków `useState` i `useReducer` (jeśli logika stanie się bardziej złożona).

**Kluczowe zmienne stanu w `AIFlashcardGenerator.tsx`:**
-   `sourceText: string`: Tekst źródłowy z `Textarea`.
-   `isTextValid: boolean`: Czy tekst źródłowy spełnia kryteria długości.
-   `charCount: number`: Aktualna liczba znaków w `sourceText`.
-   `suggestions: FlashcardSuggestionItemVM[]`: Lista sugestii fiszek.
-   `generationMetadata: AIGenerationMetadataDto | null`: Metadane z odpowiedzi API generowania.
-   `isLoadingSuggestions: boolean`: Stan ładowania podczas generowania sugestii.
-   `errorGenerating: string | null`: Komunikat błędu podczas generowania.
-   `isSavingSet: boolean`: Stan ładowania podczas zapisywania zestawu.
-   `errorSavingSet: string | null`: Komunikat błędu podczas zapisywania.
-   `isEditDialogOpen: boolean`: Widoczność modala edycji fiszki.
-   `editingFlashcard: FlashcardSuggestionItemVM | null`: Sugestia aktualnie edytowana.
-   `isSaveSetDialogOpen: boolean`: Widoczność modala zapisu zestawu.
-   `saveMode: 'all' | 'accepted' | null`: Określa, czy zapisujemy wszystkie, czy tylko zaakceptowane sugestie.

**Niestandardowy Hook (opcjonalnie, jeśli `AIFlashcardGenerator` stanie się zbyt duży):**
Można rozważyć stworzenie hooka `useAIFlashcardGeneratorLogic` który hermetyzowałby większość logiki stanu i operacji, zwracając potrzebne wartości i funkcje do komponentu `AIFlashcardGenerator`.

## 7. Integracja API

1.  **Generowanie Sugestii Fiszki:**
    -   **Trigger:** Kliknięcie przycisku "Generate Flashcards".
    -   **Endpoint:** `POST /api/ai/generate-flashcards`
    -   **Typ Żądania:** `AIGenerateFlashcardsCommand` (`{ text: sourceText }`)
    -   **Typ Odpowiedzi (Sukces):** `AIGenerateFlashcardsResponseDto`
    -   **Obsługa:**
        -   Ustaw `isLoadingSuggestions = true`.
        -   Po otrzymaniu odpowiedzi:
            -   Przekształć `FlashcardSuggestionDto[]` na `FlashcardSuggestionItemVM[]`, inicjalizując `id`, `isAccepted = false`, `currentFront/Back` na wartości z `front/back`, `originalFront/Back` na wartości z `front/back`.
            -   Zapisz `metadata` w `generationMetadata`.
            -   `isLoadingSuggestions = false`, `errorGenerating = null`.
        -   W przypadku błędu: `errorGenerating = "komunikat"`, `isLoadingSuggestions = false`.

2.  **Zapisywanie Nowego Zestawu Fiszki:**
    -   **Trigger:** Kliknięcie "Zapisz zestaw" w `SaveSetDialog`.
    -   **Krok 1: Utworzenie Zestawu Fiszki:**
        -   **Endpoint:** `POST /api/flashcard-sets`
        -   **Typ Żądania:** `CreateFlashcardSetCommand`
            ```json
            {
              "name": "nazwa_z_dialogu",
              "source_text_hash": generationMetadata?.source_text_hash,
              "source_text_length": generationMetadata?.source_text_length,
              "generation_duration_ms": generationMetadata?.generation_duration_ms
            }
            ```
        -   **Typ Odpowiedzi (Sukces):** `SingleFlashcardSetResponseDto` (zawiera `id` nowego zestawu).
    -   **Krok 2: Dodanie Fiszek do Zestawu (Batch Create):**
        -   **Endpoint:** `POST /api/flashcard-sets/{setId}/flashcards/batch-create` (gdzie `{setId}` to ID z odpowiedzi Kroku 1).
        -   **Typ Żądania:** `BatchCreateFlashcardsCommand`
            -   Filtruj `suggestions` na podstawie `saveMode` (`all` lub `suggestion.isAccepted`).
            -   Dla każdej wybranej `FlashcardSuggestionItemVM`, utwórz obiekt `CreateFlashcardCommand`:
                ```typescript
                {
                  front: vm.currentFront,
                  back: vm.currentBack,
                  source: (vm.currentFront !== vm.originalFront || vm.currentBack !== vm.originalBack) ? 'ai_generated_modified' : 'ai_generated'
                }
                ```
        -   **Typ Odpowiedzi (Sukces):** `BatchCreateFlashcardsResponseDto`.
    -   **Obsługa:**
        -   Ustaw `isSavingSet = true`.
        -   Jeśli Krok 1 lub Krok 2 zawiedzie: `errorSavingSet = "komunikat"`, `isSavingSet = false`.
        -   Po sukcesie obu kroków:
            -   `isSavingSet = false`, `errorSavingSet = null`.
            -   Wyświetl toast "Zestaw '[Nazwa]' został utworzony".
            -   Wyczyść stan formularza (tekst, sugestie).
            -   Przekieruj na `/dashboard`.

## 8. Interakcje użytkownika
-   **Wpisywanie tekstu w `Textarea`**: Aktualizacja licznika znaków, walidacja długości tekstu w czasie rzeczywistym, aktywacja/deaktywacja przycisku "Generate Flashcards".
-   **Kliknięcie "Generate Flashcards"**: Wywołanie API, wyświetlenie stanu ładowania, następnie wyświetlenie sugestii lub błędu.
-   **Kliknięcie "Akceptuj" (✓) na sugestii**: Zaznaczenie sugestii jako zaakceptowanej (zmiana wizualna, aktualizacja `isAccepted` w `FlashcardSuggestionItemVM`), potencjalna aktywacja przycisku "Save accepted".
-   **Kliknięcie "Edytuj" (✎) na sugestii**: Otwarcie `EditFlashcardDialog` z danymi tej sugestii.
    -   **W `EditFlashcardDialog`**: Użytkownik modyfikuje przód/tył. Kliknięcie "Zapisz zmiany" aktualizuje sugestię w stanie `AIFlashcardGenerator` i zamyka dialog.
-   **Kliknięcie "Odrzuć" (✗) na sugestii**: Usunięcie sugestii z listy (lub oznaczenie jako nieaktywna).
-   **Kliknięcie "Save accepted"**: Otwarcie `SaveSetDialog`, ustawienie `saveMode = 'accepted'`.
-   **Kliknięcie "Save all"**: Otwarcie `SaveSetDialog`, ustawienie `saveMode = 'all'`.
    -   **W `SaveSetDialog`**: Wpisanie nazwy zestawu. Kliknięcie "Zapisz zestaw" wywołuje proces zapisu (API), wyświetla stan ładowania. Po sukcesie: toast i przekierowanie. W razie błędu: komunikat.
-   **Najechanie na sugestię z `validation_status: 'truncated'` lub `'rejected'`**: Wyświetlenie `Tooltip` z `validation_message`.

## 9. Warunki i walidacja
-   **Pole tekstowe (`Textarea`)**:
    -   Wymagana długość: 1000-10000 znaków.
    -   Komunikaty walidacyjne wyświetlane pod polem.
    -   Przycisk "Generate Flashcards" jest nieaktywny, jeśli tekst nie spełnia kryteriów.
-   **Przycisk "Generate Flashcards"**:
    -   Aktywny tylko, gdy `sourceText` ma poprawną długość.
-   **Przyciski "Save accepted" / "Save all"**:
    -   "Save accepted": Aktywny, gdy istnieje co najmniej jedna zaakceptowana sugestia (`suggestions.some(s => s.isAccepted)`).
    -   "Save all": Aktywny, gdy istnieje co najmniej jedna sugestia (`suggestions.length > 0`).
-   **Dialog edycji fiszki (`EditFlashcardDialog`)**:
    -   Pola `Input` na przód/tył mogą mieć walidację (np. niepuste). Długość znaków jest ostatecznie walidowana przez API.
-   **Dialog zapisu zestawu (`SaveSetDialog`)**:
    -   Pole `Input` na nazwę zestawu: Wymagane, max 100 znaków. Komunikat walidacyjny. Przycisk "Zapisz zestaw" nieaktywny, jeśli nazwa jest niepoprawna.

## 10. Obsługa błędów
-   **Błąd generowania sugestii (API `POST /api/ai/generate-flashcards`)**:
    -   Wyświetlenie komunikatu błędu w widocznym miejscu (np. pod przyciskiem "Generate Flashcards").
    -   Komunikat powinien być ogólny, np. "Wystąpił błąd podczas generowania fiszek. Spróbuj ponownie później." lub bardziej szczegółowy, jeśli API zwróci stosowny kod/wiadomość.
    -   Zresetowanie stanu ładowania.
-   **Błąd zapisu zestawu (API `POST /api/flashcard-sets` lub `POST /api/flashcard-sets/{setId}/flashcards/batch-create`)**:
    -   Wyświetlenie komunikatu błędu w `SaveSetDialog` lub jako globalny toast (jeśli dialog zostanie zamknięty).
    -   Przykładowe komunikaty: "Nie udało się zapisać zestawu.", "Nazwa zestawu jest już zajęta.", "Wystąpił błąd podczas zapisywania fiszek."
    -   Zresetowanie stanu ładowania (`isSavingSet = false`).
-   **Brak sugestii po wygenerowaniu**:
    -   Wyświetlenie informacji, np. "Nie znaleziono żadnych sugestii dla podanego tekstu."
-   **Błędy walidacji pól formularzy**:
    -   Komunikaty wyświetlane bezpośrednio przy polach (np. w `SourceTextInput`, `SaveSetDialog`).
-   **Błędy sieciowe**:
    -   Ogólny komunikat o problemie z połączeniem, sugerujący sprawdzenie dostępu do internetu.

## 11. Kroki implementacji
1.  **Utworzenie plików i struktury komponentów:**
    -   Stwórz plik `src/pages/generate-ai.astro`.
    -   Stwórz folder `src/components/ai-generator/` i w nim pliki dla komponentów React: `AIFlashcardGenerator.tsx`, `SourceTextInput.tsx`, `FlashcardSuggestionGrid.tsx`, `FlashcardDisplayItem.tsx`, `EditFlashcardDialog.tsx`, `SaveSetDialog.tsx`.
2.  **Implementacja `GenerateAIPage.astro`:**
    -   Podstawowy layout strony.
    -   Import i osadzenie `<AIFlashcardGenerator client:load />`.
3.  **Implementacja `AIFlashcardGenerator.tsx` (szkielet):**
    -   Zdefiniuj podstawowe stany (np. `sourceText`, `suggestions`, `isLoadingSuggestions`).
    -   Renderuj szkielety pozostałych komponentów podrzędnych.
4.  **Implementacja `SourceTextInput.tsx`:**
    -   Dodaj `Textarea` i `Label` z Shadcn/ui.
    -   Implementuj logikę licznika znaków i walidacji długości na podstawie propsów.
    -   Połącz ze stanem `sourceText` w `AIFlashcardGenerator`.
5.  **Logika generowania sugestii w `AIFlashcardGenerator.tsx`:**
    -   Implementuj funkcję obsługi kliknięcia "Generate Flashcards".
    -   Wywołaj `POST /api/ai/generate-flashcards` (użyj `fetch` lub dedykowanej funkcji serwisu API).
    -   Obsłuż odpowiedź sukcesu: zmapuj DTO na `FlashcardSuggestionItemVM[]`, zaktualizuj stan.
    -   Obsłuż błędy: zaktualizuj stan błędu.
    -   Zaimplementuj stan ładowania i jego wyświetlanie.
6.  **Implementacja `FlashcardSuggestionGrid.tsx` i `FlashcardDisplayItem.tsx`:**
    -   `FlashcardSuggestionGrid`: Renderuj listę `suggestions` używając `FlashcardDisplayItem`. Zastosuj stylowanie siatki (CSS Grid/Flexbox).
    -   `FlashcardDisplayItem`: Wyświetl dane fiszki (`currentFront`, `currentBack`). Dodaj przyciski-ikony Akceptuj/Edytuj/Odrzuć. Implementuj logikę wizualnego wyróżnienia dla `validation_status` i `Tooltip` dla `validation_message`.
7.  **Implementacja logiki akcji na sugestiach w `AIFlashcardGenerator.tsx`:**
    -   `handleAccept(id)`: Zmienia `isAccepted` dla danej sugestii.
    -   `handleReject(id)`: Usuwa sugestię z listy `suggestions`.
    -   `handleEdit(id)`: Otwiera `EditFlashcardDialog` i przekazuje dane wybranej sugestii.
8.  **Implementacja `EditFlashcardDialog.tsx`:**
    -   Formularz z polami `Input` dla przodu i tyłu.
    -   Po kliknięciu "Zapisz zmiany", wywołaj `onSave` z propsów, przekazując zaktualizowane dane.
    -   Połącz stan `isOpen` z `isEditDialogOpen` w `AIFlashcardGenerator`.
9.  **Implementacja logiki zapisu edytowanej sugestii w `AIFlashcardGenerator.tsx`:**
    -   Funkcja, która aktualizuje odpowiednią sugestię w stanie `suggestions` na podstawie danych z `EditFlashcardDialog`.
10. **Implementacja logiki przycisków "Save accepted" / "Save all" w `AIFlashcardGenerator.tsx`:**
    -   Dezaktywuj przyciski na podstawie stanu (`suggestions`, `isAccepted`).
    -   Po kliknięciu, otwórz `SaveSetDialog` i ustaw `saveMode`.
11. **Implementacja `SaveSetDialog.tsx`:**
    -   Formularz z polem `Input` dla nazwy zestawu i przyciskiem "Zapisz zestaw".
    -   Walidacja nazwy zestawu.
    -   Po kliknięciu "Zapisz zestaw", wywołaj `onSave` z propsów, przekazując nazwę.
    -   Połącz stan `isOpen` z `isSaveSetDialogOpen` w `AIFlashcardGenerator`.
12. **Implementacja logiki zapisu nowego zestawu w `AIFlashcardGenerator.tsx`:**
    -   Funkcja obsługi zapisu:
        -   Wywołaj `POST /api/flashcard-sets` z odpowiednimi danymi.
        -   Po sukcesie, wywołaj `POST /api/flashcard-sets/{setId}/flashcards/batch-create` z przefiltrowanymi i przekształconymi sugestiami.
        -   Obsłuż odpowiedzi sukcesu i błędu dla obu wywołań.
        -   Wyświetl toast, wyczyść stan, przekieruj.
13. **Styling i Dostępność:**
    -   Zastosuj Tailwind CSS zgodnie z potrzebami.
    -   Upewnij się, że wszystkie interaktywne elementy są dostępne z klawiatury.
    -   Dodaj odpowiednie atrybuty ARIA (`aria-label` dla przycisków-ikon, zarządzanie focusem w modalach).
14. **Testowanie:**
    -   Przetestuj wszystkie przepływy użytkownika, w tym przypadki brzegowe i obsługę błędów.
    -   Sprawdź responsywność widoku.
