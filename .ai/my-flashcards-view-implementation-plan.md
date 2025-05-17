# Plan implementacji widoku "Moje Fiszki"

## 1. Przegląd
Widok "Moje Fiszki" (`/my-flashcards`) ma na celu umożliwienie zalogowanym użytkownikom przeglądanie listy wszystkich swoich zestawów fiszek. Dla każdego zestawu wyświetlane są kluczowe informacje takie jak nazwa, liczba fiszek, status pochodzenia (czy został wygenerowany przez AI, edytowany, czy stworzony manualnie) oraz data ostatniej sesji nauki. Widok udostępnia również akcje, takie jak rozpoczęcie sesji nauki dla wybranego zestawu oraz (w przyszłości) możliwość usunięcia zestawu. Lista jest paginowana (15 zestawów na stronę) i domyślnie sortowana. Jeśli użytkownik nie posiada żadnych zestawów, wyświetlany jest odpowiedni komunikat.

## 2. Routing widoku
Widok powinien być dostępny pod ścieżką `/my-flashcards`. Dostęp do tej ścieżki wymaga autoryzacji użytkownika. Niezalogowani użytkownicy powinni być przekierowywani na stronę logowania.

## 3. Struktura komponentów
Poniżej przedstawiono hierarchię komponentów budujących widok:

```
MyFlashcardsPage.astro (strona Astro)
  └── FlashcardSetListWrapper.tsx (React, zarządza stanem pobierania danych i paginacją)
      ├── LoadingSpinner.tsx (React, wyświetlany podczas ładowania)
      ├── ErrorMessage.tsx (React, wyświetlany w przypadku błędu)
      ├── FlashcardSetList.tsx (React, wyświetla listę lub komunikat o braku zestawów)
      │   ├── FlashcardSetCard.tsx (React, wyświetla pojedynczy zestaw jako karta - powtarzany dla każdego zestawu)
      │   │   ├── Card (Shadcn/ui)
      │   │   │   ├── CardHeader (Shadcn/ui)
      │   │   │   │   ├── CardTitle (Shadcn/ui) - Nazwa zestawu
      │   │   │   │   └── CardDescription (Shadcn/ui) - Status pochodzenia
      │   │   │   ├── CardContent (Shadcn/ui)
      │   │   │   │   ├── p - Ilość fiszek
      │   │   │   │   └── p - Data ostatniej nauki
      │   │   │   ├── CardFooter (Shadcn/ui)
      │   │   │   │   ├── Button (Shadcn/ui) - "Rozpocznij naukę" (jako link <a>)
      │   │   │   │   └── Tooltip (Shadcn/ui)
      │   │   │   │       └── Button (Shadcn/ui, wariant ikony, wyłączony) - Ikona kosza 🗑️
      │   └── p (React, jeśli lista jest pusta) - "Nie masz jeszcze żadnych zestawów..."
      └── PaginationControls.tsx (React, wyświetlany jeśli totalPages > 1)
```

## 4. Szczegóły komponentów

### `MyFlashcardsPage.astro`
-   **Opis komponentu:** Główny plik strony Astro dla ścieżki `/my-flashcards`. Odpowiada za ogólną strukturę strony, w tym integrację komponentu React `FlashcardSetListWrapper.tsx`. Weryfikuje, czy użytkownik jest zalogowany (przekierowanie obsługiwane przez middleware Astro).
-   **Główne elementy:** Standardowy layout Astro, osadzenie komponentu React (`<FlashcardSetListWrapper client:load />`).
-   **Obsługiwane interakcje:** Brak bezpośrednich interakcji, renderuje komponent React.
-   **Obsługiwana walidacja:** Sprawdzenie istnienia sesji użytkownika (`Astro.locals.user`). Jeśli brak, middleware powinien przekierować do logowania.
-   **Typy:** `Astro.locals.user`.
-   **Propsy:** Brak.

### `FlashcardSetListWrapper.tsx`
-   **Opis komponentu:** Komponent React pełniący rolę kontenera. Odpowiada za pobranie listy zestawów fiszek użytkownika z API (z uwzględnieniem paginacji i sortowania), zarządzanie stanem ładowania, błędów, aktualnej strony oraz przekazanie danych do komponentów `FlashcardSetList.tsx` i `PaginationControls.tsx`.
-   **Główne elementy:** Wykorzystuje hook `useEffect` do pobrania danych przy zmianie `currentPage`. Warunkowo renderuje `LoadingSpinner`, `ErrorMessage`, `FlashcardSetList` oraz `PaginationControls`.
-   **Obsługiwane interakcje:** Zmiana bieżącej strony paginacji poprzez `PaginationControls`.
-   **Obsługiwana walidacja:** Brak.
-   **Typy:** `PaginatedFlashcardSetsDto`, `FlashcardSetViewModel`, `PaginationInfoDto`.
-   **Propsy:** Brak.
-   **Stan wewnętrzny:** `flashcardSets: FlashcardSetViewModel[] | null`, `paginationInfo: PaginationInfoDto | null`, `isLoading: boolean`, `error: string | null`, `currentPage: number`.

### `LoadingSpinner.tsx`
-   **Opis komponentu:** Prosty komponent React wyświetlający animację ładowania. Może wykorzystywać komponent `Loader2` z `lucide-react` i stylizację Tailwind do animacji.
-   **Główne elementy:** Ikona spinnera.
-   **Obsługiwane interakcje:** Brak.
-   **Obsługiwana walidacja:** Brak.
-   **Typy:** Brak.
-   **Propsy:** Brak.

### `ErrorMessage.tsx`
-   **Opis komponentu:** Komponent React wyświetlający komunikat o błędzie.
-   **Główne elementy:** Element tekstowy (`p` lub `div`) z komunikatem błędu.
-   **Obsługiwane interakcje:** Brak.
-   **Obsługiwana walidacja:** Brak.
-   **Typy:** Brak.
-   **Propsy:** `message: string`.

### `FlashcardSetList.tsx`
-   **Opis komponentu:** Komponent React odpowiedzialny za wyświetlanie listy zestawów fiszek lub komunikatu, gdy lista jest pusta.
-   **Główne elementy:**
    *   Jeśli `sets` jest pusty: paragraf (`p`) z tekstem "Nie masz jeszcze żadnych zestawów...".
    *   Jeśli `sets` zawiera elementy: responsywna siatka (np. `div` ze stylami Tailwind CSS Grid) renderująca komponenty `FlashcardSetCard` dla każdego zestawu.
-   **Obsługiwane interakcje:** Brak, wyświetla dane.
-   **Obsługiwana walidacja:** Brak.
-   **Typy:** `FlashcardSetViewModel`.
-   **Propsy:** `sets: FlashcardSetViewModel[]`.

### `FlashcardSetCard.tsx`
-   **Opis komponentu:** Komponent React wyświetlający pojedynczy zestaw fiszek w formie karty. Używa komponentów Shadcn/ui do struktury i stylizacji.
-   **Główne elementy:**
    *   `Card` (Shadcn/ui) jako główny kontener.
    *   `CardHeader` (Shadcn/ui) zawierający:
        *   `CardTitle` (Shadcn/ui) do wyświetlenia `set.name`.
        *   `CardDescription` (Shadcn/ui) do wyświetlenia `set.status`.
    *   `CardContent` (Shadcn/ui) zawierający:
        *   Paragraf (`p`) wyświetlający "Liczba fiszek: {`set.flashcardCount`}".
        *   Paragraf (`p`) wyświetlający {`set.lastStudiedDisplay`}.
    *   `CardFooter` (Shadcn/ui) zawierający:
        *   Komponent `a` (link HTML) stylizowany jako `Button` (Shadcn/ui) z tekstem "Rozpocznij naukę", `href={set.studyLink}`.
        *   `Tooltip` (Shadcn/ui) opakowujący:
            *   `Button` (Shadcn/ui) z wariantem `outline` lub `ghost`, wyłączony (`disabled`), zawierający ikonę kosza (🗑️, np. z `lucide-react`).
-   **Obsługiwane interakcje:**
    *   Kliknięcie linku "Rozpocznij naukę": Nawigacja do `set.studyLink` (standardowe zachowanie linku).
    *   Najazd na przycisk "Usuń zestaw": Wyświetlenie `Tooltip` z tekstem "Funkcja dostępna wkrótce".
-   **Obsługiwana walidacja:** Brak, wyświetla dane.
-   **Typy:** `FlashcardSetViewModel`.
-   **Propsy:** `set: FlashcardSetViewModel`.

### `PaginationControls.tsx`
-   **Opis komponentu:** Komponent React wyświetlający kontrolki paginacji (np. przyciski "Poprzednia", "Następna", numery stron). Wyświetlany, gdy `totalPages > 1`.
-   **Główne elementy:** Przyciski (Shadcn/ui `Button`) dla nawigacji stronami. Wyświetlanie aktualnej strony i całkowitej liczby stron.
-   **Obsługiwane interakcje:** Kliknięcie przycisku "Poprzednia", "Następna" lub numeru strony.
-   **Obsługiwana walidacja:** Przyciski "Poprzednia"/"Następna" powinny być wyłączone, gdy użytkownik jest odpowiednio na pierwszej/ostatniej stronie.
-   **Typy:** `PaginationInfoDto`.
-   **Propsy:** `paginationInfo: PaginationInfoDto`, `onPageChange: (page: number) => void`, `currentPage: number`.

## 5. Typy

### DTO (Data Transfer Objects - z API)
-   **`FlashcardSetDto`**: Zdefiniowany w `src/types.ts`. Kluczowe pola używane w tym widoku:
    *   `id: string` (uuid)
    *   `name: string`
    *   `total_flashcards_count: number`
    *   `accepted_unedited_count: number`
    *   `source_text_hash: string | null`
    *   `last_studied_at: string | null` (timestamp ISO)
    *   `created_at: string` (timestamp ISO)
-   **`PaginationInfoDto`**: Zdefiniowany w `src/types.ts`.
    *   `current_page: number`
    *   `total_pages: number`
    *   `total_items: number`
    *   `limit: number`
-   **`PaginatedFlashcardSetsDto`**: Zdefiniowany w `src/types.ts`.
    *   `data: FlashcardSetDto[]`
    *   `pagination: PaginationInfoDto`

### ViewModel (dla komponentów widoku)
-   **`FlashcardSetViewModel`**:
    ```typescript
    interface FlashcardSetViewModel {
      id: string;
      name: string;
      flashcardCount: number;
      status: 'AI Generated' | 'Manual';
      lastStudiedDisplay: string; // np. "Ostatnia nauka: 01.01.2024" lub "Nigdy nie uczono"
      studyLink: string; // np. /study-session/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    }
    ```
    -   `id`: Bezpośrednio z `FlashcardSetDto.id`.
    -   `name`: Bezpośrednio z `FlashcardSetDto.name`.
    -   `flashcardCount`: Bezpośrednio z `FlashcardSetDto.total_flashcards_count`.
    -   `status`: Pochodne na podstawie logiki:
        *   Jeśli `FlashcardSetDto.source_text_hash` jest `null`, status to `'Manual'`.
        *   Jeśli `FlashcardSetDto.source_text_hash` nie jest `null`, status to `'AI Generated'`.
    -   `lastStudiedDisplay`: Pochodne z `FlashcardSetDto.last_studied_at`:
        *   Jeśli `last_studied_at` jest `null`, tekst to "Nigdy nie uczono".
        *   W przeciwnym razie, sformatowana data (np. "DD.MM.RRRR") z prefiksem "Ostatnia nauka: ".
    -   `studyLink`: Skonstruowany jako `/study-session/${FlashcardSetDto.id}`.

## 6. Zarządzanie stanem
Stan komponentu `FlashcardSetListWrapper.tsx` będzie zarządzał danymi pobranymi z API oraz stanami ładowania i błędów.
-   `flashcardSets: FlashcardSetViewModel[] | null = null;`
-   `paginationInfo: PaginationInfoDto | null = null;`
-   `isLoading: boolean = true;`
-   `error: string | null = null;`
-   `currentPage: number = 1;`

Pobieranie danych nastąpi w hooku `useEffect` przy pierwszym renderowaniu komponentu oraz przy zmianie `currentPage`. Nie jest wymagany dedykowany globalny store (np. Zustand) ani custom hook dla tego widoku w wersji MVP.

Funkcja pomocnicza do mapowania `FlashcardSetDto` na `FlashcardSetViewModel` będzie potrzebna.
Funkcja pomocnicza do formatowania daty `last_studied_at` będzie potrzebna.

## 7. Integracja API
Komponent `FlashcardSetListWrapper.tsx` będzie komunikował się z backendem poprzez wywołanie `fetch` na endpoint `GET /api/flashcard-sets`.

-   **Żądanie:**
    *   Metoda: `GET`
    *   URL: `/api/flashcard-sets`
    *   Parametry zapytania (query parameters):
        *   `page={currentPage}` (zmienna ze stanu)
        *   `limit=15` (stała wartość)
        *   `sort_by=last_studied_at`
        *   `order=desc`
        (Backend powinien obsługiwać `NULLS LAST` dla `last_studied_at` przy sortowaniu `DESC`, aby zestawy "Nigdy nie uczono" były na końcu. Jeśli nie, API może potrzebować modyfikacji lub sortowanie drugorzędne po `created_at DESC` musiałoby być wykonane po stronie klienta, co komplikuje paginację serwerową.)
    *   Nagłówki: Standardowe, w tym `Cookie` z tokenem sesji Supabase (obsługiwane automatycznie przez przeglądarkę i middleware).

-   **Odpowiedź (sukces - 200 OK):**
    *   Typ: `PaginatedFlashcardSetsDto`
        ```json
        {
          "data": [
            {
              "id": "uuid",
              "user_id": "uuid",
              "name": "string",
              "accepted_unedited_count": "integer",
              "total_flashcards_count": "integer",
              "generation_duration_ms": "integer | null",
              "source_text_hash": "string | null",
              "source_text_length": "integer | null",
              "created_at": "timestamp",
              "updated_at": "timestamp",
              "last_studied_at": "timestamp | null"
            }
            // ... więcej FlashcardSetDto
          ],
          "pagination": {
            "current_page": "integer",
            "total_pages": "integer",
            "total_items": "integer",
            "limit": "integer"
          }
        }
        ```

-   **Odpowiedź (błąd):**
    *   `400 Bad Request`: Np. nieprawidłowe parametry zapytania.
    *   `401 Unauthorized`: Użytkownik niezalogowany (middleware powinien to przechwycić wcześniej).
    *   `500 Internal Server Error`: Błąd po stronie serwera.
    Treść odpowiedzi błędu to zazwyczaj: `{"message": "Komunikat błędu"}`. Komponent `ErrorMessage` wyświetli ogólny komunikat.

## 8. Interakcje użytkownika
-   **Wejście na stronę `/my-flashcards`:**
    *   System inicjuje pobieranie listy zestawów fiszek dla strony 1, sortując po `last_studied_at DESC`.
    *   Wyświetlany jest wskaźnik ładowania (`LoadingSpinner`).
    *   Po pomyślnym załadowaniu, wyświetlana jest lista zestawów (`FlashcardSetList` i `FlashcardSetCard`) oraz, jeśli `totalPages > 1`, kontrolki paginacji (`PaginationControls`).
    *   Jeśli brak zestawów, wyświetlany jest odpowiedni komunikat.
    *   W przypadku błędu, wyświetlany jest komunikat błędu (`ErrorMessage`).
-   **Kliknięcie przycisku "Rozpocznij naukę" na karcie zestawu:**
    *   Następuje nawigacja do ścieżki `/study-session/:setId` poprzez standardowy link `<a>`.
-   **Najazd kursorem na wyłączony przycisk "Usuń zestaw":**
    *   Wyświetlany jest komponent `Tooltip` z Shadcn/ui z tekstem "Funkcja dostępna wkrótce".
-   **Interakcja z `PaginationControls`:**
    *   Kliknięcie przycisku "Następna", "Poprzednia" lub numeru strony.
    *   Komponent `FlashcardSetListWrapper` aktualizuje stan `currentPage`.
    *   Uruchamiany jest `useEffect` w `FlashcardSetListWrapper` w celu pobrania danych dla nowej strony.
    *   Wyświetlany jest `LoadingSpinner` podczas pobierania nowej strony.

## 9. Warunki i walidacja
-   **Dostęp do widoku:**
    *   Warunek: Użytkownik musi być zalogowany.
    *   Walidacja: Sprawdzane przez middleware Astro.
-   **Pobieranie danych:**
    *   Warunek: Poprawne zapytanie do API `GET /api/flashcard-sets` z parametrami `page`, `limit=15`, `sort_by=last_studied_at`, `order=desc`.
    *   Walidacja: Parametry zapytania są walidowane po stronie backendu.
-   **Wyświetlanie danych:**
    *   Warunek: Dane z API (`FlashcardSetDto`) muszą być poprawnie zmapowane na `FlashcardSetViewModel`.
    *   Walidacja: Logika mapowania obsługuje wartości `null` i poprawnie formatuje dane.
-   **Paginacja:**
    *   Warunek: `PaginationControls` są wyświetlane tylko jeśli `paginationInfo.totalPages > 1`.
    *   Walidacja: Przyciski "Poprzednia"/"Następna" w `PaginationControls` są wyłączone, jeśli `currentPage` jest odpowiednio 1 lub `totalPages`.

## 10. Obsługa błędów
-   **Brak autoryzacji:** Obsługiwane przez middleware Astro.
-   **Błąd pobierania danych z API:**
    *   Komponent `FlashcardSetListWrapper.tsx` przechwytuje błąd.
    *   Stan `error` jest ustawiany, `isLoading` na `false`.
    *   Renderowany jest komponent `ErrorMessage` z komunikatem: "Nie udało się załadować Twoich zestawów fiszek. Spróbuj ponownie później."
-   **Brak zestawów fiszek:**
    *   API zwraca `data: []`. `FlashcardSetList.tsx` wyświetli: "Nie masz jeszcze żadnych zestawów...".
-   **Niekompletne lub nieprawidłowe dane w odpowiedzi API:**
    *   Logika mapowania na ViewModel powinna być odporna. Błędy logowane w konsoli.

## 11. Kroki implementacji
1.  **Aktualizacja pliku strony Astro (`src/pages/my-flashcards.astro`):**
    *   Zapewnienie przekierowania dla niezalogowanych użytkowników (głównie przez middleware).
    *   Osadzenie `<FlashcardSetListWrapper client:load />`.

2.  **Implementacja komponentu `FlashcardSetListWrapper.tsx`:**
    *   Zarządzanie stanem: `isLoading`, `error`, `flashcardSets`, `paginationInfo`, `currentPage`.
    *   Implementacja `useEffect` do pobierania danych z `/api/flashcard-sets` przy montowaniu i zmianie `currentPage`. Parametry: `page={currentPage}`, `limit=15`, `sort_by=last_studied_at`, `order=desc`.
    *   Implementacja funkcji mapującej `FlashcardSetDto[]` na `FlashcardSetViewModel[]`.
    *   Funkcja `handlePageChange` do aktualizacji `currentPage`.
    *   Warunkowe renderowanie `LoadingSpinner`, `ErrorMessage`, `FlashcardSetList` oraz `PaginationControls` (jeśli `paginationInfo && paginationInfo.totalPages > 1`).

3.  **Implementacja komponentu `FlashcardSetList.tsx`:** (bez zmian w stosunku do poprzedniego planu, poza przekazywanymi propsami)
    *   Przyjmuje props `sets: FlashcardSetViewModel[]`.
    *   Renderuje listę `FlashcardSetCard` lub komunikat o braku zestawów.

4.  **Implementacja komponentu `FlashcardSetCard.tsx`:**
    *   Przycisk "Rozpocznij naukę" zaimplementować jako `a` (link) stylizowany na `Button`, z `href` wskazującym na `set.studyLink`.
    *   Reszta bez zmian.

5.  **Implementacja komponentu `PaginationControls.tsx`:**
    *   Stwórz plik `src/components/my-flashcards/PaginationControls.tsx` (lub w `src/components/ui/`).
    *   Przyjmuje propsy `paginationInfo: PaginationInfoDto`, `onPageChange: (page: number) => void`, `currentPage: number`.
    *   Renderuje przyciski "Poprzednia", "Następna" (Shadcn/ui `Button`). Wyłączaj je odpowiednio, gdy `currentPage === 1` lub `currentPage === paginationInfo.totalPages`.
    *   Opcjonalnie: wyświetlanie numerów stron lub informacji "Strona X z Y".
    *   Wywołuje `onPageChange` z nowym numerem strony po kliknięciu.

6.  **Implementacja komponentów `LoadingSpinner.tsx` i `ErrorMessage.tsx`:** (bez zmian)

7. **Formatowanie daty:** (bez zmian - w `src/lib/utils/dateUtils.ts`)

8. **Stylizacja:** (bez zmian)

9. **Testowanie:**
    *   Dodatkowo przetestuj działanie paginacji: wyświetlanie kontrolek, przełączanie stron, ładowanie danych dla nowych stron, wyłączanie przycisków na skrajnych stronach.
    *   Sprawdź domyślne sortowanie (najpierw ostatnio uczone, potem najnowsze).

10. **Dostępność (ARIA):**
    *   Upewnij się, że kontrolki paginacji są dostępne i poprawnie opisane.

</rewritten_file> 