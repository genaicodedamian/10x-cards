# API Endpoint Implementation Plan: POST /api/flashcard-sets/{setId}/flashcards/batch-create

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia uwierzytelnionym użytkownikom tworzenie wielu fiszek w ramach określonego zestawu fiszek (`flashcard_set`) za pomocą jednego żądania. Operacja ma charakter transakcyjny w odniesieniu do tworzenia fiszek i aktualizacji liczników w nadrzędnym zestawie fiszek. Zwraca listę pomyślnie utworzonych fiszek oraz listę błędów dla fiszek, których nie udało się utworzyć.

## 2. Szczegóły żądania

-   **Metoda HTTP**: `POST`
-   **Struktura URL**: `/api/flashcard-sets/{setId}/flashcards/batch-create`
    -   `{setId}`: (Wymagany, UUID) Identyfikator zestawu fiszek, do którego mają zostać dodane nowe fiszki.
-   **Typ zawartości żądania**: `application/json`
-   **Request Body**: Obiekt JSON zgodny z modelem `BatchCreateFlashcardsCommand`.
    ```json
    {
      "flashcards": [ // Wymagane, tablica niepusta
        {
          "front": "string (wymagane, max 200 znaków)",
          "back": "string (wymagane, max 500 znaków)",
          "source": "string (wymagane, 'manual' | 'ai_generated' | 'ai_generated_modified')"
        }
        // ... więcej obiektów fiszek
      ]
    }
    ```
-   **Prerender**: `false` (dynamiczny punkt końcowy)

## 3. Wykorzystywane typy

Poniższe typy z `src/types.ts` będą używane:

-   **Modele poleceń (Request)**:
    -   `CreateFlashcardCommand`: Definiuje strukturę pojedynczej fiszki w tablicy `flashcards`.
    -   `BatchCreateFlashcardsCommand`: Definiuje strukturę całego ciała żądania.
-   **DTOs (Response)**:
    -   `FlashcardDto`: Reprezentuje pojedynczą, pomyślnie utworzoną fiszkę.
    -   `BatchCreateErrorDto`: (`{ input_flashcard: CreateFlashcardCommand; error_message: string; }`) Służy do raportowania błędów dla poszczególnych fiszek, których nie udało się utworzyć.
    -   `BatchCreateFlashcardsResponseDto`: Definiuje strukturę odpowiedzi w przypadku pomyślnego przetworzenia (`{ created_flashcards: FlashcardDto[]; errors?: BatchCreateErrorDto[]; }`).

## 4. Szczegóły odpowiedzi

### Sukces (201 Created)

-   **Kod statusu**: `201 Created`
-   **Typ zawartości odpowiedzi**: `application/json`
-   **Ciało odpowiedzi**: Obiekt JSON zgodny z `BatchCreateFlashcardsResponseDto`.
    ```json
    {
      "created_flashcards": [
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
        // ... więcej utworzonych fiszek
      ],
      "errors": [ // Opcjonalne, obecne jeśli wystąpiły błędy dla niektórych fiszek
        {
          "input_flashcard": { /* oryginalne dane wejściowe fiszki */ },
          "error_message": "string (opis błędu)"
        }
      ]
    }
    ```

### Błędy

-   **`400 Bad Request`**:
    -   Nieprawidłowy format `setId` (np. nie jest UUID).
    -   Nieprawidłowy format JSON w ciele żądania.
    -   Błąd walidacji Zod dla ciała żądania (np. brakująca tablica `flashcards`, pusta tablica, nieprawidłowe typy danych, przekroczone limity długości `front`/`back`, nieprawidłowa wartość `source`).
-   **`401 Unauthorized`**: Użytkownik nie jest uwierzytelniony (obsługiwane przez middleware).
-   **`404 Not Found`**: Zestaw fiszek (`flashcard_set`) o podanym `setId` nie istnieje lub nie należy do uwierzytelnionego użytkownika.
-   **`500 Internal Server Error`**: Wystąpił nieoczekiwany błąd po stronie serwera (np. błąd bazy danych podczas transakcji, brak klienta Supabase w `context.locals`).

## 5. Przepływ danych

1.  Klient wysyła żądanie `POST` na adres `/api/flashcard-sets/{setId}/flashcards/batch-create` z tokenem JWT (w cookies) i ciałem żądania zawierającym tablicę fiszek.
2.  Middleware Astro (`src/middleware/index.ts`):
    -   Weryfikuje token JWT.
    -   Jeśli token jest ważny, pobiera dane użytkownika i instancję klienta Supabase, umieszczając je w `context.locals.user` i `context.locals.supabase`.
    -   Jeśli token jest nieważny lub go brakuje, zwraca `401 Unauthorized`.
3.  Handler API Astro (`src/pages/api/flashcard-sets/[setId]/flashcards/batch-create.ts`):
    -   Pobiera `setId` z parametrów ścieżki i waliduje jego format (UUID).
    -   Pobiera `user` i `supabase` z `context.locals`. Jeśli brakuje, zwraca `500 Internal Server Error`.
    -   Waliduje ciało żądania za pomocą schematu Zod (np. `BatchCreateFlashcardsSchema` z `src/lib/schemas/flashcardSchemas.ts`). W przypadku błędu walidacji zwraca `400 Bad Request` ze szczegółami błędów.
    -   Wywołuje metodę serwisową (np. `flashcardService.batchCreateFlashcards(setId, userId, batchCreateCommand)`).
4.  Serwis `FlashcardService` (`src/lib/services/flashcardService.ts`):
    -   Sprawdza, czy zestaw fiszek o podanym `setId` istnieje i należy do `userId`. Jeśli nie, zwraca błąd prowadzący do `404 Not Found`.
    -   Inicjuje transakcję bazodanową.
    -   Iteruje po każdej fiszce z `batchCreateCommand.flashcards`:
        -   Przygotowuje dane fiszki do wstawienia (mapuje `userId`, `setId`).
        -   Próbuje wstawić fiszkę do tabeli `flashcards`.
        -   W przypadku naruszenia unikalności `(set_id, front, back)` (błąd bazy danych `23505` lub odpowiednik), łapie błąd, dodaje fiszkę i komunikat błędu do listy `errors` w odpowiedzi. Nie przerywa transakcji dla innych fiszek.
        -   Inne błędy wstawiania mogą spowodować przerwanie transakcji i zwrócenie `500 Internal Server Error`.
    -   Jeśli co najmniej jedna fiszka została pomyślnie wstawiona:
        -   Oblicza liczbę pomyślnie wstawionych fiszek (`successfulInsertsCount`).
        -   Oblicza liczbę pomyślnie wstawionych fiszek z `source = 'ai_generated'` (`aiGeneratedUneditedCount`).
        -   Aktualizuje liczniki `total_flashcards_count` (inkrementacja o `successfulInsertsCount`) oraz `accepted_unedited_count` (inkrementacja o `aiGeneratedUneditedCount`) w tabeli `flashcard_sets` dla danego `setId`. Ta operacja musi być częścią tej samej transakcji.
    -   Zatwierdza transakcję. Jeśli aktualizacja liczników lub zatwierdzenie nie powiedzie się, cała transakcja jest wycofywana.
    -   Zwraca obiekt `BatchCreateFlashcardsResponseDto` zawierający listę pomyślnie utworzonych fiszek (`FlashcardDto[]`) i listę błędów (`BatchCreateErrorDto[]`).
5.  Handler API Astro:
    -   Na podstawie wyniku z serwisu, wysyła odpowiedź `201 Created` z ciałem `BatchCreateFlashcardsResponseDto`.
    -   W przypadku błędów z serwisu, mapuje je na odpowiednie kody statusu HTTP (np. 404, 500).

## 6. Względy bezpieczeństwa

-   **Uwierzytelnianie**: Middleware musi rygorystycznie egzekwować obecność i ważność tokena JWT Supabase.
-   **Autoryzacja**: Serwis musi weryfikować, czy `setId` należy do uwierzytelnionego użytkownika. Polityki RLS w Supabase zapewnią dodatkową warstwę ochrony na poziomie bazy danych.
-   **Walidacja danych wejściowych**:
    -   Użycie Zod do walidacji formatu `setId`, struktury ciała żądania, typów danych, wymaganych pól oraz limitów długości dla `front` (max 200) i `back` (max 500).
    -   Walidacja wartości enum dla pola `source`.
    -   Rozważenie limitu maksymalnej liczby fiszek w jednym żądaniu batch (np. 50-100), aby zapobiec potencjalnym atakom DoS. Ten limit powinien być zdefiniowany i walidowany.
-   **Ochrona przed Mass Assignment**: Pola `user_id` i `set_id` dla nowo tworzonych fiszek muszą być pobierane z kontekstu uwierzytelniania i parametru ścieżki, a nie bezpośrednio z danych wejściowych użytkownika w tablicy `flashcards`.
-   **Integralność transakcji**: Krytyczne jest, aby operacje wstawiania fiszek i aktualizacji liczników w tabeli `flashcard_sets` były atomowe. Niepowodzenie aktualizacji liczników powinno skutkować wycofaniem wstawionych fiszek.

## 7. Obsługa błędów

-   Błędy walidacji Zod są zwracane jako `400 Bad Request` z obiektem `errors` zawierającym szczegóły.
-   Brak uwierzytelnienia skutkuje `401 Unauthorized` (przez middleware).
-   Nieznaleziony zestaw fiszek lub brak uprawnień do niego skutkuje `404 Not Found`.
-   Błędy naruszenia unikalności dla poszczególnych fiszek `(set_id, front, back)` są raportowane w tablicy `errors` odpowiedzi `201 Created`, nie przerywając przetwarzania całego batcha, o ile pozostałe operacje w transakcji się powiodą.
-   Inne błędy serwera (np. błędy połączenia z bazą danych, nieoczekiwane wyjątki w logice serwisu) skutkują `500 Internal Server Error`. Zaleca się logowanie tych błędów po stronie serwera.

## 8. Rozważania dotyczące wydajności

-   Przetwarzanie bardzo dużych batchy fiszek może obciążać serwer i bazę danych. Wprowadzenie limitu na liczbę fiszek w batchu jest zalecane.
-   Operacje bazodanowe (wiele wstawień i aktualizacja) powinny być wykonane w ramach jednej transakcji, aby zminimalizować narzut.
-   Jeśli możliwe, użycie funkcji RPC Supabase do enkapsulacji logiki wstawiania batchowego i aktualizacji liczników może być bardziej wydajne i zapewniać lepszą atomowość.
-   Indeksy na `flashcards.set_id`, `flashcards.user_id` oraz unikalny indeks na `(set_id, front, back)` są kluczowe dla wydajności zapytań i operacji wstawiania.

## 9. Etapy wdrożenia

1.  **Definicja schematów Zod**:
    -   Utworzenie/aktualizacja schematu Zod (np. `BatchCreateFlashcardsSchema`) w `src/lib/schemas/flashcardSchemas.ts` do walidacji ciała żądania `BatchCreateFlashcardsCommand`, w tym walidacji poszczególnych fiszek w tablicy (długości, wymagane pola, enum `source`).
    -   Dodanie walidacji dla parametru ścieżki `setId` (musi być UUID).
2.  **Aktualizacja/Utworzenie Serwisu (`FlashcardService`)**:
    -   W `src/lib/services/flashcardService.ts` (lub nowym dedykowanym serwisie) zaimplementować metodę np. `batchCreateFlashcards(setId: string, userId: string, command: BatchCreateFlashcardsCommand): Promise<BatchCreateFlashcardsResponseDto>`.
    -   Implementacja logiki weryfikacji istnienia i własności `flashcard_set`.
    -   Implementacja logiki transakcyjnej dla wstawiania fiszek i aktualizacji liczników w `flashcard_sets`. To powinno obejmować:
        -   Iterację po fiszkach z polecenia.
        -   Próby wstawienia każdej fiszki.
        -   Obsługę błędów naruszenia unikalności (`(set_id, front, back)`) dla pojedynczych fiszek i dodawanie ich do listy `errors`.
        -   Obliczenie liczby pomyślnie wstawionych fiszek i tych z `source = 'ai_generated'`.
        -   Atomiczną aktualizację `total_flashcards_count` i `accepted_unedited_count` w tabeli `flashcard_sets`.
        -   Rozważenie użycia `supabase.rpc()` jeśli złożoność transakcji tego wymaga dla zapewnienia atomowości.
3.  **Implementacja Handlera API Astro**:
    -   Utworzenie pliku `src/pages/api/flashcard-sets/[setId]/flashcards/batch-create.ts`.
    -   Pobranie `user` i `supabase` z `context.locals` (dostarczonych przez middleware).
    -   Implementacja walidacji `setId` i ciała żądania przy użyciu Zod.
    -   Wywołanie odpowiedniej metody z `FlashcardService`.
    -   Formatowanie i zwracanie odpowiedzi (`201 Created` z `BatchCreateFlashcardsResponseDto` lub odpowiedni kod błędu).
4.  **Middleware (Weryfikacja)**:
    -   Upewnienie się, że istniejące middleware (`src/middleware/index.ts`) poprawnie obsługuje uwierzytelnianie dla tej ścieżki i dostarcza `context.locals.user` oraz `context.locals.supabase`.
5.  **Baza danych (Weryfikacja)**:
    -   Upewnienie się, że unikalny indeks `idx_flashcards_set_front_back_unique` na `(set_id, front, back)` w tabeli `flashcards` istnieje i jest aktywny, zgodnie z rekomendacją w `.ai/db-plan.md`.
6.  **Testowanie**:
    -   Napisanie testów jednostkowych dla logiki serwisu, w tym obsługi transakcji i przypadków błędów.
    -   Napisanie testów integracyjnych dla punktu końcowego, obejmujących różne scenariusze powodzenia i niepowodzenia (np. prawidłowe dane, błędy walidacji, nieistniejący `setId`, naruszenie unikalności, błędy autoryzacji).
7.  **Dokumentacja**:
    -   Aktualizacja lub utworzenie dokumentacji API dla tego punktu końcowego (np. w formacie OpenAPI lub Markdown). 