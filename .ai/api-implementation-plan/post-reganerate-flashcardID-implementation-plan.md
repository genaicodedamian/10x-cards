# API Endpoint Implementation Plan: POST /api/flashcards/{flashcardId}/regenerate

## 0. Uwagi Implementacyjne (Faza Początkowa)
*   **Identyfikator Użytkownika**: Na potrzeby bieżącej, początkowej fazy implementacji, operacje związane z użytkownikiem (np. weryfikacja własności fiszki) będą wykorzystywać stałą `DEFAULT_USER_ID` zdefiniowaną w `src/db/supabase.client.ts`. Docelowo, po pełnej integracji modułu autentykacji, identyfikator użytkownika będzie pobierany z `context.locals.user.id`.
*   **Klient Supabase**: Klient Supabase (`SupabaseClient`) będzie importowany z lokalnego modułu `src/db/supabase.client.ts` (zamiast bezpośrednio z `@supabase/supabase-js`), gdzie jest on odpowiednio skonfigurowany dla projektu. Docelowo, w handlerach API, instancja klienta Supabase będzie pobierana z `context.locals.supabase`.
*   **Generacja LLM (Mock -> Real)**: Logika regeneracji fiszki przez LLM zostanie zaimplementowana dwuetapowo:
    1.  **Faza 1 (Mock)**: Wdrożenie mocka usługi LLM, który będzie symulował proces generowania nowych treści dla fiszki oraz możliwe błędy. Pozwoli to na zbudowanie i przetestowanie całego przepływu danych i obsługi błędów endpointa.
    2.  **Faza 2 (Real)**: Zastąpienie mocka rzeczywistą integracją z API OpenRouter w celu generowania treści przez LLM.

## 1. Przegląd punktu końcowego
Punkt końcowy `POST /api/flashcards/{flashcardId}/regenerate` umożliwia uwierzytelnionemu użytkownikowi ponowne wygenerowanie treści (`front` i `back`) dla istniejącej fiszki, która pierwotnie została utworzona przez AI (tj. jej pole `source` ma wartość `'ai_generated'`). Proces ten wykorzystuje zewnętrzną usługę LLM (w fazie początkowej symulowaną przez mock). Po pomyślnym wygenerowaniu, fiszka jest aktualizowana w bazie danych, a jej pole `source` pozostaje `'ai_generated'`.

## 2. Szczegóły żądania
-   **Metoda HTTP**: `POST`
-   **Struktura URL**: `/api/flashcards/{flashcardId}`
-   **Prerender**: `false` (zgodnie z zasadami Astro dla dynamicznych API routes)
-   **Parametry ścieżki**:
    -   `flashcardId` (string, UUID): **Wymagane**. Unikalny identyfikator fiszki do ponownego wygenerowania.
-   **Parametry zapytania**: Brak.
-   **Request Body**: Brak. Żądanie powinno mieć pustą treść lub pusty obiekt JSON (`{}`) z nagłówkiem `Content-Type: application/json`.
    -   Typ komendy: `RegenerateFlashcardCommand` (z `src/types.ts`, jest to `{}`).

## 3. Wykorzystywane typy
-   **Command Model (Request Body)**:
    -   `RegenerateFlashcardCommand` (from `src/types.ts`): `export type RegenerateFlashcardCommand = {};`
-   **DTO (Success Response Body)**:
    -   `SingleFlashcardResponseDto` (alias for `FlashcardDto`, which is `Tables<'flashcards'>`) (from `src/types.ts`).
-   **Walidacja Zod (Request Path & Body)**:
    -   `FlashcardIdSchema`: `z.string().uuid({ message: "Invalid flashcard ID format. Must be a valid UUID." })` (dla `flashcardId`).
    -   `RegenerateFlashcardCommandSchema`: `z.object({}).strict()` (dla pustego ciała żądania, jeśli `Content-Type: application/json`).
-   **Typy z bazy danych**:
    -   `Tables<'flashcards'>` (dla odczytu i aktualizacji fiszki).
    -   `TablesInsert<'generation_error_logs'>` (dla logowania błędów LLM).
-   **Klient Supabase**:
    -   `SupabaseClient` (typ importowany z `src/db/supabase.client.ts`).

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)
-   **Content-Type**: `application/json`
-   **Body**: Zaktualizowany obiekt fiszki (`SingleFlashcardResponseDto`).
    ```json
    {
      "id": "uuid",
      "set_id": "uuid",
      "user_id": "uuid",
      "front": "string", // Nowo wygenerowana treść
      "back": "string",  // Nowo wygenerowana treść
      "source": "ai_generated", // Pozostaje bez zmian
      "created_at": "timestamp",
      "updated_at": "timestamp" // Zaktualizowany przez trigger bazodanowy
    }
    ```

### Błędy
-   **400 Bad Request**:
    -   Nieprawidłowy format `flashcardId` (np. nie jest UUID).
        ```json
        { "message": "Validation failed.", "errors": { "flashcardId": "Invalid flashcard ID format. Must be a valid UUID." } }
        ```
    -   Fiszka, której dotyczy żądanie, nie ma `source` równego `'ai_generated'`.
        ```json
        { "error": "Flashcard is not AI-generated and cannot be regenerated." }
        ```
-   **401 Unauthorized**:
    -   Użytkownik nie jest uwierzytelniony (brak/nieprawidłowy JWT) - dotyczy docelowej implementacji. W fazie z `DEFAULT_USER_ID` ten błąd nie będzie aktywnie zwracany.
        ```json
        { "error": "Unauthorized" }
        ```
-   **404 Not Found**:
    -   Fiszka o podanym `flashcardId` nie istnieje lub nie należy do uwierzytelnionego użytkownika (lub `DEFAULT_USER_ID`).
        ```json
        { "error": "Flashcard not found." }
        ```
-   **429 Too Many Requests**:
    -   Przekroczono limit zapytań do usługi LLM (dotyczy zarówno mocka z zaimplementowanym rate limitingiem, jak i rzeczywistej usługi).
        ```json
        { "error": "Too many requests to the AI service. Please try again later." }
        ```
-   **500 Internal Server Error**:
    -   Błąd po stronie usługi LLM (inny niż rate limit lub niedostępność) - symulowany przez mock lub rzeczywisty.
    -   Błąd bazy danych podczas operacji na fiszce.
    -   Inny nieoczekiwany błąd serwera.
        ```json
        { "error": "Internal Server Error. Failed to regenerate flashcard." }
        ```
-   **503 Service Unavailable**:
    -   Usługa LLM jest tymczasowo niedostępna - symulowany przez mock lub rzeczywisty.
        ```json
        { "error": "AI service is temporarily unavailable. Please try again later." }
        ```

## 5. Przepływ danych
1.  Klient wysyła żądanie `POST` na `/api/flashcards/{flashcardId}/regenerate` (docelowo z tokenem JWT w nagłówku `Authorization`).
2.  Docelowo: Middleware Astro (`src/middleware/index.ts`) weryfikuje JWT. Jeśli jest nieprawidłowy, zwraca `401`. Jeśli jest prawidłowy, wypełnia `context.locals.user` i `context.locals.supabase`. W fazie początkowej, `userId` to `DEFAULT_USER_ID`, a `supabase` to globalny klient.
3.  Handler API route (`src/pages/api/flashcards/[flashcardId]/regenerate.ts`):
    a.  Pobiera `flashcardId` z `params`. Używa `DEFAULT_USER_ID` jako `userId` (w fazie początkowej).
    b.  Waliduje `flashcardId` (musi być UUID) używając Zod. Jeśli błąd, zwraca `400`.
    c.  Wywołuje metodę serwisową, np. `flashcardService.regenerateAIFlashcard(supabase, userId, flashcardId)`. `supabase` to klient z `src/db/supabase.client.ts`.
4.  Metoda w `flashcardService.ts`:
    a.  Pobiera fiszkę z bazy danych używając `supabase.from('flashcards').select().eq('id', flashcardId).eq('user_id', userId).single()`.
    b.  Jeśli fiszka nie istnieje lub nie należy do użytkownika (`userId`), serwis zwraca błąd prowadzący do `404 Not Found`.
    c.  Sprawdza, czy `flashcard.source === 'ai_generated'`. Jeśli nie, serwis zwraca błąd prowadzący do `400 Bad Request`.
    d.  Pobiera dane z tabeli `flashcard_sets` (`set_id` jest w fiszce) w celu uzyskania `source_text_hash` i `source_text_length` (jeśli istnieją) na potrzeby logowania błędów LLM.
    e.  Przygotowuje kontekst dla LLM (np. istniejące `front` i `back` fiszki).
    f.  **Wywołuje usługę LLM**:
        *   **Faza 1 (Mock)**: Wywołanie mocka serwisu LLM (np. z `src/lib/services/aiMockService.ts`). Mock symuluje generację nowych treści (`front`, `back`), np. przez dodanie prefiksu "Mock Regenerated: ".
        *   **Faza 2 (Real)**: Wywołanie rzeczywistej usługi LLM (np. Openrouter API) z przygotowanym kontekstem.
    g.  Obsługuje odpowiedź LLM (mocka lub rzeczywistej usługi):
        i.  **Błąd LLM**:
            -   Przygotowuje dane do logu: `user_id`, `model_used` (np. "mock-regenerator-v1" lub rzeczywista nazwa modelu), `error_code`, `error_message`. Dla `source_text_hash` i `source_text_length`, jeśli nie są dostępne z `flashcard_set` lub nie spełniają ograniczeń tabeli `generation_error_logs` (NOT NULL, długość 1000-10000), używa zdefiniowanych wartości zastępczych (np. hash "REGEN_CONTEXT_NA", długość 1000) i odnotowuje to jako obejście.
            -   Zapisuje błąd do tabeli `generation_error_logs` poprzez `supabase.from('generation_error_logs').insert(...)`.
            -   Zwraca odpowiedni błąd (429, 500, 503) do handlera API.
        ii. **Sukces LLM**:
            -   Waliduje długość nowo wygenerowanych `front` (max 200 znaków) i `back` (max 500 znaków). W razie potrzeby przycina, starając się zachować sens.
            -   Aktualizuje fiszkę w bazie danych: `supabase.from('flashcards').update({ front: newFront, back: newBack }).eq('id', flashcardId)`. Pole `source` pozostaje `'ai_generated'`. `updated_at` zostanie automatycznie zaktualizowane przez trigger bazodanowy.
            -   Zwraca zaktualizowaną fiszkę.
5.  Handler API route:
    a.  Jeśli serwis zwrócił zaktualizowaną fiszkę, wysyła odpowiedź `200 OK` z fiszką w ciele.
    b.  Jeśli serwis zwrócił błąd, wysyła odpowiedź z odpowiednim kodem statusu i komunikatem błędu.

## 6. Względy bezpieczeństwa
-   **Uwierzytelnianie**: Docelowo wymagane (JWT). W fazie początkowej, użycie `DEFAULT_USER_ID` oznacza brak rzeczywistego uwierzytelnienia dla tego przepływu, co jest akceptowalne tylko dla środowiska deweloperskiego.
-   **Autoryzacja**:
    -   Polityki RLS (Row Level Security) w PostgreSQL na tabeli `flashcards` zapewniają, że użytkownik (lub `DEFAULT_USER_ID`) może modyfikować tylko własne fiszki.
    -   Logika serwisowa dodatkowo weryfikuje `user_id` przy pobieraniu i aktualizacji fiszki.
-   **Walidacja danych wejściowych**:
    -   `flashcardId` musi być poprawnym UUID (walidacja Zod).
    -   Treść żądania musi być pusta.
-   **Ochrona przed IDOR**: Docelowo zapewniona przez RLS i sprawdzanie `user_id`. W fazie z `DEFAULT_USER_ID`, ryzyko IDOR jest nieistotne, ale kod powinien być pisany z myślą o docelowym mechanizmie.
-   **Rate Limiting**: Należy zaimplementować mechanizm ograniczania liczby żądań dla tego punktu końcowego (per użytkownik/IP), aby zapobiec nadużyciom usługi LLM. API powinno zwracać `429 Too Many Requests` po przekroczeniu limitu. Dotyczy to zarówno mocka (do testów), jak i rzeczywistej integracji.
-   **Bezpieczeństwo LLM**: Kontekst przekazywany do LLM (istniejące `front`/`back`) powinien być traktowany jako potencjalnie niebezpieczny.

## 7. Obsługa błędów
-   Błędy walidacji (nieprawidłowy `flashcardId`, nieodpowiedni `source` fiszki) skutkują odpowiedzią `400 Bad Request`.
-   Docelowo: Brak uwierzytelnienia skutkuje `401 Unauthorized`.
-   Nieznalezienie fiszki lub brak uprawnień skutkuje `404 Not Found`.
-   Błędy komunikacji z usługą LLM (symulowane lub rzeczywiste) są mapowane na odpowiednie kody HTTP (`429`, `500`, `503`) i logowane do `generation_error_logs`.
-   Nieoczekiwane błędy serwera skutkują `500 Internal Server Error`.
-   **Logowanie błędów LLM**: Szczegółowe informacje o błędach z LLM są zapisywane w tabeli `generation_error_logs`.

## 8. Rozważania dotyczące wydajności
-   Zapytania do bazy danych powinny być optymalne.
-   Głównym czynnikiem wpływającym na wydajność będzie czas odpowiedzi usługi LLM (rzeczywistej lub symulowanej przez mock).
-   Należy rozważyć timeouty dla zapytań do LLM.
-   Rate limiting jest kluczowy.

## 9. Etapy wdrożenia
1.  **Aktualizacja definicji typów (jeśli konieczne)**:
    *   Sprawdzić, czy istniejące `RegenerateFlashcardCommand` i `SingleFlashcardResponseDto` w `src/types.ts` są wystarczające.
    *   Upewnić się, że `SupabaseClient` jest poprawnie wyeksportowany i używany z `src/db/supabase.client.ts`.
2.  **Utworzenie schematów Zod**:
    *   W `src/lib/schemas/flashcardSchemas.ts` (lub odpowiednim miejscu) dodać/zweryfikować schemat walidacji dla `flashcardId` (UUID) oraz schemat dla pustego ciała żądania.
3.  **Faza 1: Implementacja z Mockiem LLM**:
    a.  **Implementacja mocka usługi LLM** (np. w `src/lib/services/aiMockService.ts` lub w ramach `flashcardService.ts`):
        *   Mock powinien przyjmować kontekst fiszki (np. `front`, `back`).
        *   Symulować generację nowych treści (`front`, `back`), np. przez dodanie prefiksu "Mock Regenerated: ".
        *   Umożliwiać symulację różnych scenariuszy odpowiedzi, w tym błędów (429, 500, 503) i opóźnień.
        *   Zwracać dane w formacie oczekiwanym przez `flashcardService`.
    b.  **Implementacja logiki serwisowej w `src/lib/services/flashcardService.ts` (metoda `regenerateAIFlashcard`)**:
        *   Pobieranie fiszki i jej zestawu nadrzędnego (dla `source_text_hash/length` do logów).
        *   Walidacja (istnienie, własność przez `DEFAULT_USER_ID`, `source === 'ai_generated'`).
        *   **Integracja z mockiem usługi LLM**.
        *   Logika obsługi odpowiedzi i błędów z mocka LLM, w tym logowanie (symulowanych) błędów do `generation_error_logs` (z uwzględnieniem strategii dla `source_text_hash` i `source_text_length`).
        *   Walidacja i ewentualne przycinanie treści zwróconej przez mock LLM.
        *   Aktualizacja fiszki w bazie danych.
    c.  **Implementacja handlera API Route w `src/pages/api/flashcards/[flashcardId]/regenerate.ts`**:
        *   Użycie `DEFAULT_USER_ID` i klienta Supabase z `src/db/supabase.client.ts`.
        *   Walidacja `flashcardId`.
        *   Wywołanie `flashcardService.regenerateAIFlashcard`.
        *   Zwracanie odpowiedzi HTTP.
4.  **Testy (Faza 1)**:
    *   Testy jednostkowe dla logiki serwisowej z użyciem mocka LLM.
    *   Testy integracyjne/e2e dla punktu końcowego API, pokrywające scenariusze z mockiem LLM.
5.  **Faza 2: Implementacja z Rzeczywistym LLM (OpenRouter API)**:
    a.  **Konfiguracja OpenRouter API**:
        *   Bezpieczne przechowywanie kluczy API (np. zmienne środowiskowe `import.meta.env`).
        *   Wybór i konfiguracja modelu LLM w OpenRouter.
    b.  **Refaktoryzacja `flashcardService.ts`**:
        *   Zastąpienie wywołania mocka LLM rzeczywistą integracją z OpenRouter API.
        *   Dostosowanie obsługi błędów i logowania do `generation_error_logs` zgodnie z rzeczywistymi odpowiedziami OpenRouter.
    c.  **Aktualizacja testów (Faza 2)**:
        *   Dostosowanie istniejących testów. Rozważenie testów kontraktowych z OpenRouter API (jeśli to możliwe i zasadne).
6.  **Implementacja Rate Limiting**:
    *   Wdrożenie mechanizmu rate limiting dla punktu końcowego.
7.  **Dokumentacja**:
    *   Uzupełnienie wewnętrznej dokumentacji API.
    *   Komentarze w kodzie.
