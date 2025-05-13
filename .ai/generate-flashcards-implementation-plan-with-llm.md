# API Endpoint Implementation Plan: POST /api/ai/generate-flashcards (z integracją LLM)

**Uwaga**: Wstępna, mockowa implementacja tego punktu końcowego została już zrealizowana. Poniższy plan koncentruje się na rozszerzeniu istniejącej logiki o rzeczywistą integrację z modelem LLM w celu generowania fiszek.

## 1. Przegląd punktu końcowego
Ten punkt końcowy generuje sugestie fiszek na podstawie dostarczonego tekstu, wykorzystując do tego model LLM (Large Language Model) poprzez usługę OpenRouter. Punkt końcowy wymaga uwierzytelnienia użytkownika. Wygenerowane sugestie, po walidacji, są zwracane bezpośrednio do klienta i nie są na tym etapie trwale zapisywane w bazie danych jako fiszki użytkownika (są to jedynie propozycje).

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
Zgodnie z `src/types.ts` (bez zmian w stosunku do wersji mockowej):
-   **Command Model (Żądanie)**:
    -   `AIGenerateFlashcardsCommand`: `{ text: string; }`
-   **DTOs (Odpowiedź)**:
    -   `FlashcardSuggestionDto`: `{ front: string; back: string; validation_status: ValidationStatus; validation_message?: string; }`
    -   `ValidationStatus`: `'valid' | 'truncated' | 'rejected'`
    -   `AIGenerationMetadataDto`: `{ source_text_hash: string; source_text_length: number; generation_duration_ms: number; model_used: string; truncated_count: number; rejected_count: number; total_suggestions: number; }`
    -   `AIGenerateFlashcardsResponseDto`: `{ suggestions: FlashcardSuggestionDto[]; metadata: AIGenerationMetadataDto; }`

## 4. Szczegóły odpowiedzi
-   **Odpowiedź sukcesu (200 OK)**: Struktura identyczna jak w wersji mockowej, ale `suggestions` będą pochodzić z LLM, a `metadata` będą odzwierciedlać rzeczywisty proces generowania.
    ```json
    {
      "suggestions": [
        // ... sugestie z LLM
      ],
      "metadata": {
        // ... rzeczywiste metadane
      }
    }
    ```
-   **Odpowiedzi błędów**:
    -   `400 Bad Request`: Nieprawidłowe dane wejściowe (np. brak `text`, nieprawidłowa długość).
    -   `401 Unauthorized`: Problem z uwierzytelnieniem.
    -   `429 Too Many Requests`: Przekroczono limit żądań (OpenRouter API rate limits lub zdefiniowane przez aplikację).
    -   `500 Internal Server Error`: Wewnętrzny błąd serwera (np. błąd komunikacji z OpenRouter niebędący 429/503, błąd parsowania odpowiedzi LLM, błąd logowania).
    -   `503 Service Unavailable`: Usługa OpenRouter lub wybrany model LLM tymczasowo niedostępna.

## 5. Przepływ danych
1.  Klient wysyła żądanie `POST` na `/api/ai/generate-flashcards` (bez zmian).
2.  Uwierzytelnianie i walidacja JWT (bez zmian).
3.  Parsowanie i walidacja ciała żądania (Zod schema dla `text`, bez zmian).
4.  Wywoływana jest funkcja serwisowa w `src/lib/services/aiGenerationService.ts` (istniejący serwis zostanie zmodyfikowany).
5.  Serwis `aiGenerationService`:
    a.  Oblicza `source_text_hash` (SHA-256) oraz `source_text_length` (bez zmian).
    b.  Rejestruje czas rozpoczęcia generowania.
    c.  **Nowość: Przygotowanie i wysłanie żądania do OpenRouter API**:
        i.  Pobranie klucza API OpenRouter i nazwy modelu z konfiguracji (zmienne środowiskowe).
        ii. Konstrukcja promptu dla LLM. Przykład:
            ```
            Na podstawie poniższego tekstu wygeneruj od 10 do 30 fiszek edukacyjnych. Każda fiszka powinna składać się z pytania (front) i odpowiedzi (back).
            Format odpowiedzi JSON: [{{"front": "<pytanie>", "back": "<odpowiedź>"}}, ...]
            
            Tekst:
            --- 
            {user_provided_text}
            --- 
            ```
        iii. Wysłanie żądania do OpenRouter API (np. używając `fetch` lub dedykowanego klienta HTTP) z wybranym modelem (preferowany `gpt-4o-mini`) i promptem.
    d.  **Nowość: Obsługa odpowiedzi z OpenRouter API**:
        i.  Sprawdzenie statusu odpowiedzi HTTP. W przypadku błędów (4xx, 5xx) odpowiednie mapowanie na błędy aplikacji (429, 500, 503) i potencjalne logowanie do `generation_error_logs`.
        ii. Sparsowanie odpowiedzi JSON od LLM, oczekując tablicy obiektów `{front: string, back: string}`.
        iii. Jeśli parsowanie zawiedzie lub struktura jest nieoczekiwana, logowanie błędu do `generation_error_logs` i zwrócenie `500 Internal Server Error`.
    e.  **Walidacja i formatowanie sugestii (zmodyfikowana logika)**:
        i.  Iteracja przez każdą sugestię (`{front, back}`) otrzymaną od LLM.
        ii. Walidacja długości: `front` (max 200 znaków), `back` (max 500 znaków).
        iii. Ustawienie `validation_status` (`'valid'`, `'truncated'`, `'rejected')` i `validation_message`.
            - `valid`: Jeśli `front` i `back` mieszczą się w limitach.
            - `truncated`: Jeśli treść została skrócona, aby zmieścić się w limitach (należy zaimplementować logikę skracania, starając się zachować sens, np. do najbliższego pełnego zdania przed limitem).
            - `rejected`: Jeśli sugestia jest pusta, niekompletna, lub skracanie znacząco naruszyłoby jej sens.
        iv. Zbieranie przetworzonych `FlashcardSuggestionDto`.
    f.  Rejestruje czas zakończenia generowania i oblicza `generation_duration_ms`.
    g.  Przygotowuje obiekt `AIGenerationMetadataDto`:
        -   `source_text_hash`, `source_text_length`.
        -   `generation_duration_ms` (rzeczywisty czas).
        -   `model_used` (np. "openrouter/gpt-4o-mini" lub odczytane z konfiguracji).
        -   `truncated_count`, `rejected_count`, `total_suggestions` (na podstawie wyników walidacji sugestii z LLM).
    h.  Zwraca obiekt zgodny z `AIGenerateFlashcardsResponseDto`.
6.  Jeśli podczas komunikacji z LLM, parsowania jego odpowiedzi lub walidacji sugestii wystąpi nieoczekiwany błąd (nieobsłużony specyficznie jako 429/503):
    a.  Błąd jest przechwytywany.
    b.  Szczegóły błędu (`user_id`, użyty `model`, `source_text_hash`, `source_text_length`, kod błędu (np. z OpenRouter lub wewnętrzny), wiadomość) są logowane do tabeli `generation_error_logs`.
    c.  Zwracany jest błąd `500 Internal Server Error`.
7.  Jeśli wszystko przebiegnie pomyślnie, logika trasy API zwraca odpowiedź `200 OK` (bez zmian).

## 6. Względy bezpieczeństwa
-   Uwierzytelnianie, Autoryzacja, Walidacja danych wejściowych (bez zmian).
-   **Nowość: Zarządzanie kluczami API**: Klucz API OpenRouter musi być przechowywany bezpiecznie, np. jako zmienna środowiskowa (`OPENROUTER_API_KEY`) i nie może być eksponowany po stronie klienta ani w kodzie źródłowym repozytorium.
-   **Nowość: Bezpieczeństwo Promptów (Prompt Injection)**: Chociaż tekst użytkownika jest głównym wsadem, należy być świadomym ryzyka manipulacji promptem, jeśli inne dynamiczne dane byłyby do niego wstrzykiwane. W obecnym scenariuszu ryzyko jest mniejsze, ale warto o tym pamiętać przy ewentualnych rozszerzeniach.
-   **Ochrona przed nadużyciami (Rate Limiting)**: Należy zaimplementować lub respektować rate limiting OpenRouter. Dodatkowo, można rozważyć wprowadzenie limitów po stronie aplikacji na liczbę żądań generowania na użytkownika w danym okresie czasu, aby kontrolować koszty i zapobiegać nadużyciom.
-   Logowanie błędów (bez zmian w zasadach, ale obejmuje teraz błędy LLM).

## 7. Rozważania dotyczące wydajności
-   **Czas odpowiedzi LLM**: To będzie główne wąskie gardło. Czas generowania przez LLM może być zmienny. Należy:
    -   Ustawić rozsądne timeouty dla żądań HTTP do OpenRouter.
    -   Poinformować użytkownika (np. loaderem w UI), że proces generowania może chwilę potrwać.
-   **Parsowanie i walidacja**: Te operacje powinny być stosunkowo szybkie w porównaniu do czasu odpowiedzi LLM.
-   **Liczba generowanych fiszek**: Generowanie większej liczby fiszek (np. bliżej 30) może wydłużyć czas odpowiedzi LLM.

## 8. Etapy wdrożenia (modyfikacja istniejącego endpointu)
1.  **Konfiguracja Środowiska**:
    -   Dodać zmienne środowiskowe: `OPENROUTER_API_KEY` i opcjonalnie `OPENROUTER_MODEL_NAME` (domyślnie `gpt-4o-mini`).
    -   Upewnić się, że są one dostępne w środowisku wykonawczym Astro server-side.
2.  **Modyfikacja `AIGenerationService` (`src/lib/services/aiGenerationService.ts`)**:
    -   Zaktualizować funkcję (np. `generateFlashcardSuggestions`) aby przyjmowała `text` i `userId` (potrzebne do logowania błędów).
    -   Zaimplementować logikę przygotowania promptu (zgodnie z punktem 5.c.ii).
    -   Dodać logikę wysyłania żądania do OpenRouter API (`fetch` lub klient HTTP):
        -   Prawidłowe ustawienie nagłówków (np. `Authorization: Bearer ${OPENROUTER_API_KEY}`, `Content-Type: application/json`).
        -   Przekazanie promptu i parametrów modelu w ciele żądania.
    -   Zaimplementować obsługę odpowiedzi z OpenRouter:
        -   Sprawdzanie statusu HTTP, obsługa błędów (429, 503, inne 4xx/5xx).
        -   Parsowanie odpowiedzi JSON.
    -   Zaimplementować logikę walidacji i przetwarzania sugestii otrzymanych od LLM (długość, skracanie, statusy `valid`/`truncated`/`rejected`).
    -   Zaktualizować tworzenie `AIGenerationMetadataDto` na podstawie rzeczywistych danych z procesu LLM.
3.  **Aktualizacja Handlera API (`src/pages/api/ai/generate-flashcards.ts`)**:
    -   Zmodyfikować wywołanie serwisu, przekazując `userId` (np. z `context.locals.session.user.id`).
    -   Rozbudować blok `try...catch` wokół wywołania serwisu, aby prawidłowo obsługiwać błędy specyficzne dla LLM (np. `OpenRouterError`, `LLMResponseParseError`) i logować je do `generation_error_logs` z odpowiednimi szczegółami (model, kod błędu z API, etc.).
        -   Przykład danych do logu błędu LLM: `user_id`, `model` (np. `gpt-4o-mini`), `source_text_hash`, `source_text_length`, `error_code` (np. status HTTP z OpenRouter lub kod błędu z ciała odpowiedzi), `error_message`.
4.  **Implementacja Logiki Skracania (Truncation)**:
    -   W `AIGenerationService`, stworzyć pomocniczą funkcję do inteligentnego skracania tekstu `front` i `back`, jeśli przekraczają limity, starając się nie ucinać w połowie słowa/zdania.
5.  **Testowanie**:
    -   **Testy jednostkowe dla `AIGenerationService`**: Mockować wywołania `fetch` do OpenRouter, testować logikę parsowania odpowiedzi, walidacji sugestii, skracania, obsługi różnych odpowiedzi LLM (sukces, błędy, niepoprawny format JSON).
    -   **Testy integracyjne dla punktu końcowego**: Testować z rzeczywistym (lub mockowanym na poziomie HTTP) API OpenRouter (jeśli to możliwe i bezpieczne w środowisku testowym, np. z oddzielnym kluczem testowym i limitami). Scenariusze: sukces, błędy walidacji `text`, błędy uwierzytelniania, błędy OpenRouter (429, 503, 500), niepoprawna odpowiedź LLM.
6.  **Dokumentacja**: Zaktualizować wszelką wewnętrzną dokumentację, aby odzwierciedlała nową logikę opartą na LLM. Plan ten stanowi podstawę.
7.  **Stopniowe Wdrażanie (Opcjonalnie)**: Rozważyć flagę funkcji (feature flag) do przełączania między logiką mockową a rzeczywistą integracją LLM, co ułatwi testowanie i ewentualny szybki powrót w przypadku problemów na produkcji.
