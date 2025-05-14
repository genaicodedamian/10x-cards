# API Endpoint Implementation Plan: PUT /api/flashcards/{flashcardId}


## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia uwierzytelnionemu użytkownikowi aktualizację istniejącej karty (flashcard) identyfikowanej przez `flashcardId`. Użytkownik może modyfikować zawartość `front` (awers), `back` (rewers) oraz `source` (źródło) karty. System automatycznie zarządza logiką zmiany statusu karty (np. z 'ai_generated' na 'ai_generated_modified' po edycji) oraz aktualizuje powiązane liczniki w zestawie kart (`flashcard_sets`).

## 2. Szczegóły żądania
-   **Metoda HTTP**: `PUT`
-   **Struktura URL**: `/api/flashcards/{flashcardId}`
-   **Parametry**:
    -   **Path Parameters**:
        -   `flashcardId` (UUID, wymagany): Identyfikator karty do aktualizacji.
    -   **Request Body** (JSON, `application/json`):
        -   `front` (string, opcjonalny, max 200 znaków): Nowa treść awersu karty.
        -   `back` (string, opcjonalny, max 500 znaków): Nowa treść rewersu karty.
        -   `source` (string, opcjonalny, enum: `'manual'`, `'ai_generated'`, `'ai_generated_modified'`): Nowe źródło pochodzenia karty.
-   **Uwierzytelnianie**: Wymagane (Bearer Token JWT).

## 3. Wykorzystywane typy
-   **Command Model (Request Body)**: `UpdateFlashcardCommand` (zdefiniowany w `src/types.ts`)
    ```typescript
    export type UpdateFlashcardCommand = Partial<Pick<TablesUpdate<'flashcards'>, 'front' | 'back'>> & {
      source?: FlashcardSource; // FlashcardSource to 'manual' | 'ai_generated' | 'ai_generated_modified'
    };
    ```
-   **DTO (Response Body)**: `SingleFlashcardResponseDto` (alias dla `FlashcardDto` z `src/types.ts`)
    ```typescript
    export type FlashcardDto = Tables<'flashcards'>;
    export type SingleFlashcardResponseDto = FlashcardDto;
    ```
-   **Zod Schema** (do walidacji `UpdateFlashcardCommand` w Astro):
    ```typescript
    import { z } from 'zod';

    export const UpdateFlashcardCommandSchema = z.object({
      front: z.string().max(200).optional(),
      back: z.string().max(500).optional(),
      source: z.enum(['manual', 'ai_generated', 'ai_generated_modified']).optional(),
    }).strict(); // .strict() aby nie dopuszczać dodatkowych pól
    ```

## 4. Szczegóły odpowiedzi
-   **Sukces (`200 OK`)**:
    ```json
    // Payload: SingleFlashcardResponseDto (FlashcardDto)
    {
      "id": "uuid",
      "set_id": "uuid",
      "user_id": "uuid",
      "front": "string",
      "back": "string",
      "source": "string", // 'manual' | 'ai_generated' | 'ai_generated_modified'
      "created_at": "timestamp",
      "updated_at": "timestamp" // Zaktualizowany przez trigger bazodanowy
    }
    ```
-   **Błędy**:
    -   `400 Bad Request`: Nieprawidłowe dane wejściowe (np. za długi `front`/`back`, nieprawidłowa wartość `source`, zduplikowana kombinacja `front`/`back` w zestawie).
        ```json
        { "error": "Validation failed", "details": "[opis błędu Zod lub komunikat z bazy danych]" }
        // lub
        { "error": "Duplicate front/back combination in the set" }
        ```
    -   `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
        ```json
        { "error": "Unauthorized" }
        ```
    -   `404 Not Found`: Karta o podanym `flashcardId` nie istnieje lub nie należy do użytkownika.
        ```json
        { "error": "Flashcard not found" }
        ```
    -   `500 Internal Server Error`: Wewnętrzny błąd serwera.
        ```json
        { "error": "Internal Server Error" }
        ```

## 5. Przepływ danych
1.  Klient wysyła żądanie `PUT` na `/api/flashcards/{flashcardId}` z tokenem JWT w nagłówku `Authorization` oraz opcjonalnymi polami `front`, `back`, `source` w ciele JSON.
2.  Middleware Astro weryfikuje JWT. Jeśli jest nieprawidłowy, zwraca `401 Unauthorized`.
3.  Handler API w Astro (`src/pages/api/flashcards/[flashcardId].ts`):
    a.  Pobiera `flashcardId` z parametrów ścieżki i waliduje jego format (UUID).
    b.  Pobiera `userId` z `context.locals.supabase` (po weryfikacji JWT).
    c.  Waliduje ciało żądania przy użyciu schemy Zod (`UpdateFlashcardCommandSchema`). W przypadku błędu zwraca `400 Bad Request`.
    d.  Wywołuje funkcję PostgreSQL `update_flashcard_and_manage_counts` poprzez `context.locals.supabase.rpc('update_flashcard_and_manage_counts', { p_flashcard_id: flashcardId, p_user_id: userId, p_front: validatedData.front, ... })`.
4.  Funkcja PostgreSQL `update_flashcard_and_manage_counts`:
    a.  Rozpoczyna transakcję.
    b.  Pobiera oryginalną kartę, weryfikując `flashcardId` i `userId`. Jeśli nie znaleziono lub brak uprawnień, rzuca wyjątek (mapowany na `404 Not Found`).
    c.  Ustala finalne wartości `front`, `back` (używając nowych wartości lub oryginalnych, jeśli nowe nie zostały podane).
    d.  Ustala finalną wartość `source` zgodnie z logiką:
        i.  Jeśli oryginalny `source` to `'ai_generated'` i `front` lub `back` uległy zmianie, a klient nie podał `source` jako `'manual'`, finalny `source` staje się `'ai_generated_modified'`. W przeciwnym razie używany jest `source` podany przez klienta lub oryginalny.
    e.  Jeśli `front` lub `back` uległy zmianie, sprawdza unikalność nowej kombinacji `(set_id, front, back)` (z wyłączeniem aktualizowanej karty). Jeśli duplikat, rzuca wyjątek (mapowany na `400 Bad Request`).
    f.  Aktualizuje kartę w tabeli `flashcards` nowymi wartościami `front`, `back`, `source`. Trigger bazodanowy automatycznie aktualizuje `updated_at`.
    g.  Jeśli `source` uległ zmianie (porównując oryginalny `source` z finalnym `source`):
        i.  Jeśli stary `source` to `'ai_generated'`, a nowy nie jest, dekrementuje `accepted_unedited_count` w tabeli `flashcard_sets` dla nadrzędnego zestawu.
        ii. Jeśli stary `source` nie był `'ai_generated'`, a nowy jest, inkrementuje `accepted_unedited_count`.
    h.  Zatwierdza transakcję.
    i.  Zwraca zaktualizowane dane karty.
5.  Handler API w Astro:
    a.  Jeśli wywołanie RPC zakończyło się błędem:
        i.  Mapuje kod błędu PostgreSQL (np. dla braku zasobu, duplikatu) na odpowiedni status HTTP (`404`, `400`) i komunikat.
        ii. Dla innych błędów RPC zwraca `500 Internal Server Error`.
    b.  Jeśli wywołanie RPC powiodło się, zwraca `200 OK` z danymi zaktualizowanej karty (`SingleFlashcardResponseDto`).

## 6. Względy bezpieczeństwa
-   **Uwierzytelnianie**: Zapewnione przez Supabase Auth (JWT). Każde żądanie musi zawierać ważny token.
-   **Autoryzacja**:
    -   Polityki RLS (Row Level Security) na tabelach `flashcards` i `flashcard_sets` zapewniają, że użytkownicy mogą modyfikować tylko własne zasoby.
    -   Funkcja PostgreSQL dodatkowo weryfikuje `user_id` przed wykonaniem operacji.
-   **Walidacja danych wejściowych**:
    -   Zod schema w Astro handlerze waliduje typy, formaty i ograniczenia (np. długość stringów, wartości enum) dla danych wejściowych.
    -   Funkcja PostgreSQL zapewnia dodatkową walidację logiki biznesowej (np. unikalność).
-   **Ochrona przed Mass Assignment**: Endpoint przyjmuje tylko zdefiniowane pola (`front`, `back`, `source`) dzięki użyciu `UpdateFlashcardCommand` i Zod schema `.strict()`.
-   **Integralność danych**: Logika aktualizacji karty oraz liczników w `flashcard_sets` jest zamknięta w transakcyjnej funkcji PostgreSQL, co zapobiega niespójności danych.

## 7. Rozważania dotyczące wydajności
-   Operacje na bazie danych są indeksowane (PK na `flashcards.id`, FK na `flashcards.set_id`, potencjalny indeks na `(set_id, front, back)`).
-   Liczba zapytań do bazy danych jest zminimalizowana dzięki użyciu funkcji PostgreSQL, która wykonuje wszystkie operacje w jednej rundzie komunikacji z bazą danych (poza początkowym wywołaniem RPC).
-   Logika zmiany liczników w `flashcard_sets` jest warunkowa i wykonywana tylko, gdy `source` faktycznie się zmienia.
-   Walidacja unikalności `front`/`back` jest wykonywana tylko wtedy, gdy te pola są modyfikowane.

## 8. Etapy wdrożenia
1.  **Definicja/Aktualizacja Typów**:
    *   Upewnić się, że `UpdateFlashcardCommand` i `FlashcardDto` (oraz `SingleFlashcardResponseDto`) w `src/types.ts` są zgodne z wymaganiami.
    *   Stworzyć Zod schema `UpdateFlashcardCommandSchema` w odpowiednim pliku (np. `src/lib/schemas/flashcard.schemas.ts`).
2.  **Implementacja Funkcji PostgreSQL**:
    *   Stworzyć (lub zaktualizować, jeśli istnieje podobna) funkcję `update_flashcard_and_manage_counts(p_flashcard_id UUID, p_user_id UUID, p_front TEXT, p_back TEXT, p_source TEXT)` w bazie danych Supabase.
    *   Funkcja powinna zawierać logikę opisaną w sekcji "Przepływ danych pkt 4".
    *   Dokładnie przetestować funkcję bezpośrednio w SQL.
3.  **Implementacja API Route Handlera w Astro**:
    *   Stworzyć plik `src/pages/api/flashcards/[flashcardId].ts`.
    *   Zaimplementować handler dla metody `PUT`.
    *   Dodać logikę uwierzytelniania (pobranie `userId` z `context.locals.supabase`).
    *   Zaimplementować walidację `flashcardId` (parametr ścieżki).
    *   Zaimplementować walidację ciała żądania za pomocą Zod schema.
    *   Wywołać funkcję RPC `update_flashcard_and_manage_counts`.
    *   Obsłużyć pomyślne odpowiedzi i błędy z RPC, mapując je na odpowiednie kody statusu HTTP i formaty odpowiedzi.
    *   Pamiętać o `export const prerender = false;`.
4.  **Testowanie**:
    *   Napisać testy jednostkowe dla logiki walidacji (Zod schema).
    *   Napisać testy integracyjne dla endpointu API, obejmujące:
        *   Pomyślną aktualizację z różnymi kombinacjami pól.
        *   Przypadki zmiany `source` i weryfikację aktualizacji `accepted_unedited_count`.
        *   Automatyczną zmianę `source` na `ai_generated_modified`.
        *   Błędy walidacji (długość, enum).
        *   Błąd duplikatu `front`/`back`.
        *   Próby aktualizacji nieistniejącej karty (`404 Not Found`).
        *   Próby aktualizacji karty innego użytkownika (`404 Not Found` z powodu RLS/sprawdzenia `userId`).
        *   Żądania bez uwierzytelnienia (`401 Unauthorized`).
5.  **Dokumentacja**:
    *   Zaktualizować dokumentację API (np. Swagger/OpenAPI, jeśli jest używana), aby odzwierciedlała szczegóły implementacji tego endpointu.
    *   Upewnić się, że komentarze w kodzie są jasne i zwięzłe.
