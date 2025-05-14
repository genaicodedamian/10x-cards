# API Endpoint Implementation Plan: GET /api/flashcard-sets/{setId}/flashcards

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia uwierzytelnionym użytkownikom pobieranie listy fiszek należących do określonego zestawu (`setId`). Obsługuje paginację, sortowanie wyników oraz filtrowanie fiszek według ich źródła pochodzenia (np. ręczne, wygenerowane przez AI).

## 2. Szczegóły żądania
-   **Metoda HTTP**: `GET`
-   **Struktura URL**: `/api/flashcard-sets/{setId}/flashcards`
-   **Parametry**:
    -   **Parametry Ścieżki**:
        -   `setId` (UUID, string): **Wymagany**. Identyfikator zestawu fiszek.
    -   **Parametry Zapytania (Opcjonalne)**:
        -   `page` (integer, domyślnie: 1): Numer strony dla paginacji.
        -   `limit` (integer, domyślnie: 10, maks: 100): Liczba fiszek na stronie.
        -   `sort_by` (string, domyślnie: `created_at`): Pole, według którego sortowane są wyniki. Dozwolone wartości: `created_at`, `updated_at`, `front`, `back`, `source`.
        -   `order` (string, domyślnie: `asc`): Kierunek sortowania. Dozwolone wartości: `asc`, `desc`.
        -   `filter_source` (string): Filtruje fiszki według źródła. Dozwolone wartości: `manual`, `ai_generated`, `ai_generated_modified`.
-   **Request Body**: Brak (dla żądania GET).

## 3. Wykorzystywane typy
-   **DTOs (Data Transfer Objects)** z `src/types.ts`:
    -   `FlashcardDto`: Reprezentuje pojedynczą fiszkę.
        ```typescript
        export type FlashcardDto = Tables<'flashcards'>;
        ```
    -   `PaginationInfoDto`: Zawiera informacje o paginacji.
        ```typescript
        export type PaginationInfoDto = {
          current_page: number;
          total_pages: number;
          total_items: number;
          limit: number;
        };
        ```
    -   `PaginatedFlashcardsDto`: Główny DTO odpowiedzi, zawierający listę fiszek i informacje o paginacji.
        ```typescript
        export type PaginatedFlashcardsDto = {
          data: FlashcardDto[];
          pagination: PaginationInfoDto;
        };
        ```
-   **Modele Command**: Nie dotyczy (żądanie GET nie ma ciała).

## 4. Szczegóły odpowiedzi
-   **Sukces (`200 OK`)**:
    ```json
    {
      "data": [
        {
          "id": "uuid",
          "set_id": "uuid",
          "user_id": "uuid",
          "front": "string",
          "back": "string",
          "source": "string ('manual' | 'ai_generated' | 'ai_generated_modified')",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
        // ... więcej fiszek
      ],
      "pagination": {
        "current_page": 1,
        "total_pages": 5,
        "total_items": 48,
        "limit": 10
      }
    }
    ```
-   **Błędy**:
    -   `400 Bad Request`: Nieprawidłowe parametry żądania (np. błąd walidacji `setId`, `page`, `limit`, `sort_by`, `order`, `filter_source`).
    -   `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
    -   `404 Not Found`: Zestaw fiszek o podanym `setId` nie istnieje lub nie należy do uwierzytelnionego użytkownika.
    -   `500 Internal Server Error`: Wewnętrzny błąd serwera.

## 5. Przepływ danych
1.  Żądanie `GET` trafia do Astro API route (`src/pages/api/flashcard-sets/[setId]/flashcards.ts`).
2.  Middleware Astro weryfikuje token JWT użytkownika. Jeśli jest nieprawidłowy, zwraca `401 Unauthorized`. Dostęp do `context.locals.supabase` i `context.locals.user` jest zapewniony.
3.  Handler API route pobiera `setId` z parametrów ścieżki oraz parametry zapytania (`page`, `limit`, `sort_by`, `order`, `filter_source`).
4.  Parametry są walidowane przy użyciu schemy Zod. W przypadku błędu walidacji zwracany jest `400 Bad Request`.
    ```typescript
    // Przykład schemy Zod
    const queryParamsSchema = z.object({
      page: z.coerce.number().int().positive().optional().default(1),
      limit: z.coerce.number().int().positive().min(1).max(100).optional().default(10), // Ograniczenie max dla wydajności
      sort_by: z.enum(['created_at', 'updated_at', 'front', 'back', 'source']).optional().default('created_at'),
      order: z.enum(['asc', 'desc']).optional().default('asc'),
      filter_source: z.enum(['manual', 'ai_generated', 'ai_generated_modified'] as const).optional() // Użycie 'as const' dla ścisłego typowania
    });
    const pathParamsSchema = z.object({
      setId: z.string().uuid({ message: "Invalid Set ID format" })
    });
    ```
5.  Wywoływana jest metoda serwisu, np. `flashcardService.getFlashcardsInSet(userId, setId, validatedQueryParams)`.
    -   `userId` jest pobierany z `context.locals.user.id`.
6.  **Logika Serwisu (`FlashcardService` w `src/lib/services/flashcardService.ts`)**:
    a.  **Weryfikacja przynależności zestawu**: Serwis najpierw sprawdza, czy zestaw fiszek (`flashcard_sets`) o podanym `setId` istnieje i należy do `userId`. Można to zrobić osobnym zapytaniem do tabeli `flashcard_sets`. Jeśli nie, serwis rzuca błąd, który handler API przekształca na `404 Not Found`.
        ```typescript
        // W serwisie, przed głównym zapytaniem o fiszki
        const { data: set, error: setError } = await supabase
          .from('flashcard_sets')
          .select('id')
          .eq('id', setId)
          .eq('user_id', userId) // RLS również to zapewnia, ale jawne sprawdzenie jest dobre
          .single();

        if (setError || !set) {
          // Rzuć błąd NotFoundError (custom error type) lub zwróć null/undefined
          // Handler API złapie to i zwróci 404
          throw new NotFoundError(`Flashcard set with ID ${setId} not found or access denied.`);
        }
        ```
    b.  **Pobieranie fiszek**: Serwis konstruuje zapytanie do Supabase (tabela `flashcards`) używając klienta Supabase (`context.locals.supabase` przekazanego do serwisu lub użycie globalnego klienta serwerowego jeśli to preferowane):
        -   Filtrowanie: `eq('set_id', setId)` i `eq('user_id', userId)` (RLS również to robi, ale jest to dobra praktyka).
        -   Filtrowanie (opcjonalne): Jeśli `filter_source` jest podany, dodaj `.eq('source', filter_source)`.
        -   Sortowanie: `.order(sort_by, { ascending: order === 'asc' })`.
        -   Paginacja: `.range((page - 1) * limit, page * limit - 1)`.
    c.  **Pobieranie całkowitej liczby fiszek**: Aby obliczyć `total_pages` i `total_items` dla paginacji, serwis wykonuje drugie zapytanie `count` z tymi samymi filtrami (bez paginacji i sortowania).
        ```typescript
        // Zapytanie o dane
        let query = supabase
          .from('flashcards')
          .select('*', { count: 'exact' }) // 'exact' dla precyzyjnej liczby
          .eq('set_id', setId)
          .eq('user_id', userId); // Ważne dla bezpieczeństwa i RLS

        if (filter_source) {
          query = query.eq('source', filter_source);
        }

        query = query
          .order(sort_by, { ascending: order === 'asc' })
          .range((page - 1) * limit, page * limit - 1);

        const { data: flashcards, error, count } = await query;

        if (error) {
          // Rzuć błąd, który zostanie obsłużony jako 500
          throw new InternalServerError('Failed to fetch flashcards.');
        }
        ```
    d.  Obliczanie metadanych paginacji:
        -   `total_items = count` (z zapytania z `{ count: 'exact' }`)
        -   `total_pages = Math.ceil(total_items / limit)`
        -   `current_page = page`
    e.  Serwis zwraca obiekt zgodny z `PaginatedFlashcardsDto`.
7.  Handler API route odbiera dane z serwisu.
8.  Jeśli wszystko przebiegło pomyślnie, zwraca odpowiedź `200 OK` z `PaginatedFlashcardsDto`.
9.  W przypadku błędów rzuconych przez serwis (np. `NotFoundError`, `InternalServerError`), handler API łapie je i zwraca odpowiedni kod statusu HTTP (`404` lub `500`).

## 6. Względy bezpieczeństwa
-   **Uwierzytelnianie**: Wszystkie żądania muszą być uwierzytelnione przy użyciu tokenów JWT Supabase. Middleware Astro (`src/middleware/index.ts`) powinno to obsługiwać, sprawdzając nagłówek `Authorization: Bearer <token>` i weryfikując token.
-   **Autoryzacja**:
    -   **RLS (Row Level Security)**: Polityki RLS w PostgreSQL na tabelach `flashcards` i `flashcard_sets` muszą zapewniać, że użytkownicy mogą odczytywać tylko własne dane (`USING (auth.uid() = user_id)`).
    -   **Jawna weryfikacja**: W logice serwisu, oprócz polegania na RLS, należy jawnie filtrować zapytania po `user_id` i weryfikować przynależność zasobu `flashcard_set` do użytkownika. Zapewnia to dodatkową warstwę bezpieczeństwa (defense in depth).
-   **Walidacja danych wejściowych**:
    -   Użycie Zod do walidacji wszystkich parametrów ścieżki i zapytania (`setId`, `page`, `limit`, `sort_by`, `order`, `filter_source`) w celu ochrony przed atakami typu injection, nieprawidłowymi wartościami i błędami przetwarzania.
    -   Szczególnie `setId` musi być walidowany jako UUID.
-   **Ochrona przed DoS**: Parametr `limit` powinien mieć rozsądną maksymalną wartość (np. 100), aby zapobiec żądaniom o zbyt duże ilości danych, które mogłyby obciążyć serwer lub bazę danych.
-   **Ujawnianie informacji**: Należy upewnić się, że odpowiedzi błędów nie ujawniają wrażliwych informacji systemowych. Zwracać ogólne komunikaty błędów dla `500 Internal Server Error`.

## 7. Rozważania dotyczące wydajności
-   **Indeksy bazy danych**:
    -   Upewnij się, że istnieją odpowiednie indeksy w tabeli `flashcards` na kolumnach:
        -   `set_id` (kluczowy dla tego zapytania)
        -   `user_id` (kluczowy dla RLS i filtrowania)
        -   `(set_id, user_id)` (złożony indeks może być korzystny)
        -   `source` (jeśli filtrowanie po `filter_source` jest częste)
        -   `created_at`, `updated_at` (jeśli sortowanie po tych polach jest częste)
    -   Indeks na `flashcard_sets(id, user_id)` dla szybkiej weryfikacji przynależności zestawu.
-   **Paginacja**: Kluczowa dla wydajności przy dużych zestawach danych. Zapytanie o całkowitą liczbę elementów (`count`) powinno być zoptymalizowane. Supabase z PostgREST dobrze sobie z tym radzi.
-   **Rozmiar odpowiedzi**: Ograniczenie `limit` zapobiega zbyt dużym odpowiedziom.
-   **Optymalizacja zapytań**: Używaj `select()` do wybierania tylko niezbędnych kolumn, jeśli nie wszystkie są potrzebne (chociaż dla `FlashcardDto` prawdopodobnie wszystkie są potrzebne).

## 8. Etapy wdrożenia
1.  **Definicja typów (jeśli jeszcze nie istnieją w `src/types.ts`)**:
    -   Potwierdź istnienie i poprawność `FlashcardDto`, `PaginationInfoDto`, `PaginatedFlashcardsDto`.
    -   Zdefiniuj typ dla zwalidowanych parametrów zapytania, np. `ValidatedFlashcardListParams`.
2.  **Schemat walidacji Zod**:
    -   Stwórz schemat Zod w pliku API route (`src/pages/api/flashcard-sets/[setId]/flashcards.ts`) do walidacji parametrów ścieżki (`setId`) i parametrów zapytania (`page`, `limit`, `sort_by`, `order`, `filter_source`).
3.  **Implementacja serwisu (`FlashcardService` w `src/lib/services/flashcardService.ts`)**:
    -   Stwórz lub zaktualizuj `FlashcardService`.
    -   Dodaj metodę, np. `async getFlashcardsInSet(userId: string, setId: string, params: ValidatedFlashcardListParams): Promise<PaginatedFlashcardsDto | null>`.
    -   Zaimplementuj logikę weryfikacji istnienia i przynależności `flashcard_set` do `userId`. Rzuć odpowiedni błąd (np. `NotFoundError`) jeśli nie znaleziono lub brak dostępu.
    -   Zaimplementuj logikę pobierania fiszek z bazy danych Supabase, uwzględniając filtrowanie, sortowanie i paginację.
    -   Zaimplementuj logikę pobierania całkowitej liczby pasujących fiszek dla metadanych paginacji.
    -   Obsłuż potencjalne błędy z Supabase i rzuć `InternalServerError` w razie potrzeby.
    -   Zwróć `PaginatedFlashcardsDto` lub `null`/ odpowiedni błąd.
4.  **Implementacja API Route (Astro)**:
    -   Stwórz plik `src/pages/api/flashcard-sets/[setId]/flashcards.ts`.
    -   Dodaj handler dla metody `GET`.
    -   Pobierz `context.locals.supabase` i `context.locals.user`. Sprawdź, czy użytkownik jest dostępny (middleware powinien to zapewnić).
    -   Pobierz `setId` z `Astro.params` i parametry zapytania z `Astro.url.searchParams`.
    -   Zwaliduj parametry przy użyciu przygotowanego schematu Zod. W przypadku błędu zwróć `Response` z kodem `400` i szczegółami błędu.
    -   Wywołaj odpowiednią metodę z `FlashcardService`, przekazując `userId`, `setId` i zwalidowane parametry.
    -   Obsłuż odpowiedź z serwisu:
        -   Jeśli sukces, zwróć `Response.json()` z `PaginatedFlashcardsDto` i kodem `200`.
        -   Obsłuż specyficzne błędy rzucone przez serwis (np. `NotFoundError` -> `404`).
        -   W przypadku ogólnych błędów, zaloguj je i zwróć `Response` z kodem `500`.
    -   Ustaw `export const prerender = false;` na początku pliku.
5.  **Konfiguracja Middleware (jeśli konieczne)**:
    -   Upewnij się, że middleware w `src/middleware/index.ts` poprawnie obsługuje uwierzytelnianie dla ścieżek `/api/*` i udostępnia `context.locals.supabase` oraz `context.locals.user`.
6.  **Testowanie**:
    -   Napisz testy jednostkowe dla logiki serwisu (walidacja, konstruowanie zapytań, obliczanie paginacji).
    -   Napisz testy integracyjne/E2E dla endpointu API, pokrywając:
        -   Przypadki sukcesu z różnymi kombinacjami parametrów (paginacja, sortowanie, filtrowanie).
        -   Przypadki błędów (nieautoryzowany dostęp, nieprawidłowe `setId`, nieprawidłowe parametry zapytania, zestaw nie istnieje lub nie należy do użytkownika).
        -   Sprawdzenie poprawności działania RLS.
7.  **Dokumentacja**:
    -   Zaktualizuj dokumentację API (np. Swagger/OpenAPI, jeśli jest używana, lub wewnętrzną dokumentację) o szczegóły zaimplementowanego endpointu. Ten plik jest częścią tej dokumentacji.
8.  **Przegląd kodu**:
    -   Przeprowadź przegląd kodu, zwracając uwagę na bezpieczeństwo, wydajność, czytelność i zgodność z wytycznymi projektu.
