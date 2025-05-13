# API Endpoint Implementation Plan: POST /api/ai/generate-flashcards

## 1. Przegląd punktu końcowego
Ten punkt końcowy generuje sugestie fiszek na podstawie dostarczonego tekstu. W początkowej fazie implementacji, zamiast komunikować się z rzeczywistym modelem LLM, system będzie generował mockowe (symulowane) sugestie fiszek. Punkt końcowy wymaga uwierzytelnienia użytkownika. Wygenerowane sugestie nie są trwale zapisywane w bazie danych na tym etapie; są zwracane bezpośrednio do klienta.

## 2. Szczegóły żądania
-   **Metoda HTTP**: `POST`
-   **Struktura URL**: `/api/ai/generate-flashcards`
-   **Uwierzytelnienie**: Wymagane (za pomocą tokenu JWT Supabase)
-   **Request Body**: Typ `application/json`
    ```json
    {
      "text": "string (wymagane, długość od 1000 do 10000 znaków)"
    }
    ```
-   **Parametry**:
    -   Wymagane: `text` (w ciele żądania)
    -   Opcjonalne: Brak

## 3. Wykorzystywane typy
Zgodnie z `src/types.ts`:
-   **Command Model (Żądanie)**:
    -   `AIGenerateFlashcardsCommand`: Definiuje strukturę ciała żądania.
        ```typescript
        export type AIGenerateFlashcardsCommand = {
          text: string;
        };
        ```
-   **DTOs (Odpowiedź)**:
    -   `FlashcardSuggestionDto`: Reprezentuje pojedynczą sugestię fiszki.
        ```typescript
        export type FlashcardSuggestionDto = {
          front: string; // Max 200 chars
          back: string;  // Max 500 chars
          validation_status: ValidationStatus;
          validation_message?: string;
        };
        ```
    -   `ValidationStatus`: Enum dla statusu walidacji sugestii (`'valid'`, `'truncated'`, `'rejected'`).
    -   `AIGenerationMetadataDto`: Zawiera metadane dotyczące procesu generowania.
        ```typescript
        export type AIGenerationMetadataDto = {
          source_text_hash: string;
          source_text_length: number;
          generation_duration_ms: number;
          model_used: string;
          truncated_count: number;
          rejected_count: number;
          total_suggestions: number;
        };
        ```
    -   `AIGenerateFlashcardsResponseDto`: Kompletna struktura odpowiedzi sukcesu.
        ```typescript
        export type AIGenerateFlashcardsResponseDto = {
          suggestions: FlashcardSuggestionDto[];
          metadata: AIGenerationMetadataDto;
        };
        ```

## 4. Szczegóły odpowiedzi
-   **Odpowiedź sukcesu (200 OK)**:
    ```json
    {
      "suggestions": [
        {
          "front": "string (max 200 znaków)",
          "back": "string (max 500 znaków)",
          "validation_status": "string (enum: 'valid', 'truncated', 'rejected')",
          "validation_message": "string (opcjonalnie, wyjaśnia przyczynę obcięcia/odrzucenia)"
        }
        // ... więcej sugestii
      ],
      "metadata": {
        "source_text_hash": "string (SHA-256 tekstu wejściowego)",
        "source_text_length": "integer",
        "generation_duration_ms": "integer",
        "model_used": "string",
        "truncated_count": "integer",
        "rejected_count": "integer",
        "total_suggestions": "integer"
      }
    }
    ```
-   **Odpowiedzi błędów**:
    -   `400 Bad Request`: Nieprawidłowe dane wejściowe (np. brak `text`, nieprawidłowa długość).
    -   `401 Unauthorized`: Problem z uwierzytelnieniem.
    -   `429 Too Many Requests`: Przekroczono limit żądań (przyszłościowe, przy integracji z LLM).
    -   `500 Internal Server Error`: Wewnętrzny błąd serwera podczas przetwarzania (np. błąd generowania mocków, błąd logowania).
    -   `503 Service Unavailable`: Usługa LLM tymczasowo niedostępna (przyszłościowe).

## 5. Przepływ danych
1.  Klient wysyła żądanie `POST` na `/api/ai/generate-flashcards` z tokenem JWT w nagłówku `Authorization` i `text` w ciele żądania.
2.  Middleware Astro lub logika trasy weryfikuje token JWT przy użyciu `context.locals.supabase` i pobiera `user_id`. Jeśli uwierzytelnienie nie powiedzie się, zwraca `401 Unauthorized`.
3.  Logika trasy API (`src/pages/api/ai/generate-flashcards.ts`) parsuje ciało żądania.
4.  Dane wejściowe są walidowane przy użyciu schematu Zod:
    -   Sprawdzenie obecności pola `text`.
    -   Sprawdzenie typu `text` (musi być stringiem).
    -   Sprawdzenie długości `text` (1000-10000 znaków).
    -   Jeśli walidacja nie powiedzie się, zwracany jest błąd `400 Bad Request`.
5.  Wywoływana jest funkcja serwisowa w `src/lib/services/aiGenerationService.ts`.
6.  Serwis `aiGenerationService`:
    a.  Oblicza `source_text_hash` (SHA-256) oraz `source_text_length` na podstawie wejściowego `text`.
    b.  Rejestruje czas rozpoczęcia generowania.
    c.  Generuje predefiniowaną liczbę (np. 3-5) mockowych sugestii fiszek (`FlashcardSuggestionDto[]`).
        -   `front` i `back` będą prostymi, predefiniowanymi ciągami znaków (np. "Mock Front 1 dla tekstu...", "Mock Back 1...").
        -   `validation_status` zostanie ustawiony na `'valid'`.
        -   `validation_message` będzie `null` lub pusty.
    d.  Rejestruje czas zakończenia generowania i oblicza `generation_duration_ms`.
    e.  Przygotowuje obiekt `AIGenerationMetadataDto` z mockowymi danymi:
        -   `source_text_hash`, `source_text_length`.
        -   `generation_duration_ms`.
        -   `model_used` (np. "mock-generator-v1").
        -   `truncated_count = 0`, `rejected_count = 0`.
        -   `total_suggestions` (liczba wygenerowanych mockowych sugestii).
    f.  Zwraca obiekt zgodny z `AIGenerateFlashcardsResponseDto`.
7.  Jeśli podczas działania serwisu (np. obliczania hasha, generowania mocków) wystąpi nieoczekiwany błąd:
    a.  Błąd jest przechwytywany.
    b.  Szczegóły błędu (`user_id`, `model`="mock-generator-v1", `source_text_hash`, `source_text_length`, kod błędu, wiadomość) są logowane do tabeli `generation_error_logs` przy użyciu `context.locals.supabase` (np. przez `rpc` lub klienta z rolą serwisową).
    c.  Zwracany jest błąd `500 Internal Server Error`.
8.  Jeśli wszystko przebiegnie pomyślnie, logika trasy API zwraca odpowiedź `200 OK` z danymi (`AIGenerateFlashcardsResponseDto`) z serwisu.

## 6. Względy bezpieczeństwa
-   **Uwierzytelnianie**: Każde żądanie musi być uwierzytelnione za pomocą tokenu JWT Supabase. Dostęp do punktu końcowego bez ważnego tokenu będzie blokowany (401).
-   **Autoryzacja**: Dostęp do tego punktu końcowego jest ogólnie przyznawany uwierzytelnionym użytkownikom. Dalsze szczegółowe zasady autoryzacji nie są obecnie określone dla samej generacji sugestii.
-   **Walidacja danych wejściowych**:
    -   Ścisła walidacja pola `text` (wymagane, typ, długość) przy użyciu Zod zapobiega podstawowym atakom (np. DoS przez duże ładunki, błędy parsowania).
-   **Ochrona przed nadużyciami (Rate Limiting)**: Chociaż nie jest to krytyczne dla obecnej implementacji mockowej, w przyszłości, przy integracji z LLM, należy zaimplementować mechanizmy ograniczania liczby żądań na użytkownika, aby zapobiec nadużyciom i kontrolować koszty. Odpowiedzią na przekroczenie limitu będzie `429 Too Many Requests`.
-   **Logowanie błędów**:
    -   Wrażliwe informacje o błędach nie powinny być bezpośrednio zwracane klientowi.
    -   Błędy po stronie serwera powinny być logowane w `generation_error_logs` z odpowiednimi danymi (`user_id`, szczegóły błędu), co ułatwi diagnozę i zapewni, że `user_id` jest poprawnie powiązany z logiem, zgodnie z polityką RLS na tabeli `generation_error_logs`.
-   **Bezpieczeństwo zależności**: Używane biblioteki (np. do haszowania SHA-256) powinny być aktualne i pochodzić z zaufanych źródeł.

## 7. Rozważania dotyczące wydajności
-   **Mock Generation**: Generowanie mockowych danych jest operacją bardzo szybką i nie powinno stanowić wąskiego gardła.
-   **Obliczanie Hasha**: SHA-256 jest wydajnym algorytmem. Dla tekstów o długości 1000-10000 znaków obliczenie hasha będzie szybkie.
-   **Przyszła integracja LLM**: To będzie główny czynnik wpływający na wydajność. Czas odpowiedzi będzie zależał od zewnętrznego serwisu LLM. Należy zaimplementować odpowiednie timeouty i, być może, rozważyć operacje asynchroniczne, jeśli generowanie będzie czasochłonne.
-   **Połączenia z bazą danych**: W obecnej implementacji mockowej, jedyne połączenie z bazą danych może wystąpić podczas logowania błędu do `generation_error_logs`. Należy zapewnić efektywne zarządzanie połączeniami.

## 8. Etapy wdrożenia
1.  **Konfiguracja trasy API**:
    -   Utworzyć plik `src/pages/api/ai/generate-flashcards.ts`.
    -   Dodać `export const prerender = false;`
    -   Zaimplementować podstawową strukturę handlera `POST`.
2.  **Uwierzytelnianie**:
    -   W handlerze API uzyskać dostęp do `context.locals.supabase`.
    -   Sprawdzić, czy `context.locals.session.user` istnieje. Jeśli nie, zwrócić `401 Unauthorized`. Zapisać `user_id`.
3.  **Walidacja żądania**:
    -   Zdefiniować schemat Zod dla `AIGenerateFlashcardsCommand` (pole `text` z ograniczeniami długości 1000-10000).
    -   Sparować i zwalidować ciało żądania. W przypadku błędu walidacji zwrócić `400 Bad Request` z odpowiednim komunikatem.
4.  **Utworzenie serwisu `AIGenerationService`**:
    -   Utworzyć plik `src/lib/services/aiGenerationService.ts`.
    -   Zdefiniować w nim funkcję, np. `generateMockFlashcardSuggestions(text: string): Promise<AIGenerateFlashcardsResponseDto>`.
5.  **Implementacja logiki mockowania w serwisie**:
    -   W `aiGenerationService.ts`:
        -   Zaimplementować obliczanie `source_text_hash` (np. przy użyciu `crypto.subtle` Web API lub biblioteki Node.js `crypto` jeśli dostępne w środowisku Astro server-side).
        -   Obliczyć `source_text_length`.
        -   Zaimplementować logikę generowania 3-5 mockowych obiektów `FlashcardSuggestionDto` (np. `front: \`Mock Front \${i+1} for text starting with: \${text.substring(0,20)}...\``, `back: \`Mock Back \${i+1}\``, `validation_status: 'valid'`).
        -   Symulować `generation_duration_ms` (np. mała stała wartość lub losowa).
        -   Ustawić `model_used` na "mock-generator-v1".
        -   Obliczyć `total_suggestions`, `truncated_count = 0`, `rejected_count = 0`.
        -   Złożyć i zwrócić obiekt `AIGenerateFlashcardsResponseDto`.
6.  **Integracja serwisu z trasą API**:
    -   W trasie API, po pomyślnej walidacji, wywołać funkcję z `aiGenerationService` przekazując jej `text`.
7.  **Obsługa błędów i logowanie**:
    -   W trasie API, opakować wywołanie serwisu w blok `try...catch`.
    -   W bloku `catch`, jeśli wystąpił błąd podczas generowania (po walidacji, np. błąd haszowania, błąd w logice mocków):
        -   Przygotować dane do logu: `user_id`, `model_used` ("mock-generator-v1"), `source_text_hash` (jeśli dostępny, inaczej null/placeholder), `source_text_length` (jeśli dostępny), `error_code` (np. "INTERNAL_MOCK_ERROR"), `error_message` (z obiektu błędu).
        -   Wykonać insert do tabeli `generation_error_logs` używając `context.locals.supabase.from('generation_error_logs').insert(...)` lub dedykowanej funkcji RPC. Należy upewnić się, że operacja jest wykonywana z odpowiednimi uprawnieniami, aby zapisać log.
        -   Zwrócić `500 Internal Server Error`.
8.  **Zwracanie odpowiedzi**:
    -   Jeśli serwis zwróci dane pomyślnie, zwrócić `200 OK` z `AIGenerateFlashcardsResponseDto` jako ciałem odpowiedzi.
9.  **Testowanie**:
    -   Napisać testy jednostkowe dla serwisu `aiGenerationService` (mockowanie haszowania, sprawdzanie struktury odpowiedzi).
    -   Napisać testy integracyjne dla punktu końcowego API (różne scenariusze: sukces, błędy walidacji, błąd serwera).
10. **Dokumentacja**: Upewnić się, że zmiany są odzwierciedlone w dokumentacji API (np. Swagger/OpenAPI, jeśli używane). Plan ten służy jako wstępna dokumentacja projektowa.

Powyższy plan zakłada, że typy DTO (`AIGenerateFlashcardsCommand`, `AIGenerateFlashcardsResponseDto`, `FlashcardSuggestionDto`, `AIGenerationMetadataDto`, `ValidationStatus`) są już zdefiniowane w `src/types.ts` zgodnie ze specyfikacją. 