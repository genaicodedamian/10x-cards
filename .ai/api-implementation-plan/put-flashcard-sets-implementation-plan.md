# Plan Implementacji Punktu Końcowego API: PUT /api/flashcard-sets/{setId}

## 1. Przegląd punktu końcowego
Ten punkt końcowy API umożliwia uwierzytelnionym użytkownikom aktualizację istniejącego zestawu fiszek (np. zmianę jego nazwy). Identyfikacja zestawu fiszek odbywa się za pomocą parametru ścieżki `setId`.

## 2. Szczegóły żądania
-   **Metoda HTTP**: `PUT`
-   **Struktura URL**: `/api/flashcard-sets/{setId}`
-   **Parametry Ścieżki**:
    -   `setId` (UUID, wymagany): Identyfikator zestawu fiszek do zaktualizowania.
-   **Request Body (JSON)**:
    ```json
    {
      "name": "string (wymagany, unikalny dla użytkownika)"
    }
    ```
    -   `name`: Nowa nazwa dla zestawu fiszek. Musi być unikalna dla danego użytkownika (z wyłączeniem aktualnie aktualizowanego zestawu).

## 3. Wykorzystywane typy

### Modele Komend (Request)
-   **`UpdateFlashcardSetParamsSchema`** (dla walidacji parametrów ścieżki):
    ```typescript
    // src/lib/schemas/flashcardSetSchemas.ts
    import { z } from 'zod';

    export const UpdateFlashcardSetParamsSchema = z.object({
      setId: z.string().uuid({ message: "Nieprawidłowy format UUID dla setId." })
    });
    ```
-   **`UpdateFlashcardSetBodySchema`** (dla walidacji ciała żądania):
    ```typescript
    // src/lib/schemas/flashcardSetSchemas.ts
    import { z } from 'zod';

    export const UpdateFlashcardSetBodySchema = z.object({
      name: z.string().min(1, { message: "Nazwa jest wymagana i nie może być pusta." }).max(255, { message: "Nazwa nie może przekraczać 255 znaków." })
      // Uwaga: unikalność nazwy na poziomie użytkownika jest egzekwowana przez bazę danych
      // i obsługiwana w logice serwisowej.
    });
    ```
    (Nazwa tego typu może być `UpdateFlashcardSetCommand` lub `UpdateFlashcardSetDto` w zależności od konwencji w `src/types.ts` lub `src/lib/schemas/flashcardSetSchemas.ts`)

### DTO (Response)
-   **`FlashcardSetDto`** (zgodnie z `src/types.ts` oraz `api-plan.md`):
    ```typescript
    // src/types.ts (fragment)
    export interface FlashcardSetDto {
      id: string; // uuid
      user_id: string; // uuid
      name: string;
      accepted_unedited_count: number;
      total_flashcards_count: number;
      generation_duration_ms: number | null;
      source_text_hash: string | null;
      source_text_length: number | null;
      created_at: string; // ISO 8601 timestamp
      updated_at: string; // ISO 8601 timestamp
      last_studied_at: string | null; // ISO 8601 timestamp
    }
    ```

## 4. Szczegóły odpowiedzi
### Sukces (200 OK)
Zwraca zaktualizowany obiekt zestawu fiszek (`FlashcardSetDto`).
```json
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
```

### Błędy
-   **`400 Bad Request`**: Jeśli walidacja danych wejściowych zawiedzie (np. brakująca `name`, nieprawidłowy format `setId`, zduplikowana nazwa zestawu dla użytkownika).
    ```json
    {
      "message": "Nieprawidłowe żądanie", // lub "Błąd walidacji"
      "errors": { // Opcjonalnie, jeśli walidacja Zod
        "setId": ["Nieprawidłowy format UUID dla setId."], // Przykład
        "name": ["Nazwa jest wymagana i nie może być pusta."] // Przykład
      }
    }
    ```
    lub w przypadku konfliktu nazwy:
    ```json
    {
      "message": "Zestaw o tej nazwie już istnieje dla tego użytkownika."
    }
    ```
-   **`401 Unauthorized`**: Jeśli użytkownik nie jest uwierzytelniony (po usunięciu `DEFAULT_USER_ID` i wdrożeniu pełnej autentykacji).
    ```json
    {
      "message": "Brak autoryzacji."
    }
    ```
-   **`404 Not Found`**: Jeśli zestaw fiszek o podanym `setId` nie istnieje lub nie należy do uwierzytelnionego użytkownika.
    ```json
    {
      "message": "Nie znaleziono zestawu fiszek."
    }
    ```
-   **`500 Internal Server Error`**: W przypadku nieoczekiwanych błędów serwera.
    ```json
    {
      "message": "Wewnętrzny błąd serwera."
    }
    ```

## 5. Przepływ danych
1.  Klient wysyła żądanie `PUT` na `/api/flashcard-sets/{setId}` z nową nazwą w ciele żądania.
2.  Middleware Astro (`src/middleware/index.ts`):
    *   Podejmuje próbę weryfikacji JWT (Supabase) z ciasteczek.
    *   Ustawia `context.locals.supabase` (klient Supabase).
    *   Ustawia `context.locals.user` (obiekt użytkownika Supabase) lub, tymczasowo, `context.locals.userId` na `DEFAULT_USER_ID` z `src/db/supabase.client.ts`.
3.  Handler API (np. `src/pages/api/flashcard-sets/[setId].ts`):
    a.  Pobiera `setId` z parametrów ścieżki i `name` z ciała żądania.
    b.  Waliduje `setId` używając `UpdateFlashcardSetParamsSchema`. Jeśli błąd, zwraca `400`.
    c.  Waliduje `name` z ciała żądania używając `UpdateFlashcardSetBodySchema`. Jeśli błąd, zwraca `400`.
    d.  Pobiera `userId` z `context.locals.user.id` (lub tymczasowo `DEFAULT_USER_ID`).
    e.  Sprawdza, czy `context.locals.supabase` jest dostępne. Jeśli nie, zwraca `500`.
    f.  Wywołuje metodę serwisową, np. `flashcardSetService.updateFlashcardSet(supabaseClient, setId, userId, { name })`.
4.  `FlashcardSetService` (`src/lib/services/flashcardSetService.ts`):
    a.  Metoda `updateFlashcardSet` przyjmuje klienta Supabase, `setId`, `userId` oraz dane do aktualizacji.
    b.  Wykonuje zapytanie do bazy danych Supabase, aby zaktualizować tabelę `flashcard_sets`, ustawiając nową `name` dla rekordu o danym `id` i `user_id`.
        ```sql
        -- Przykład logiki SQL (Supabase JS SDK to abstrakcja)
        UPDATE flashcard_sets
        SET name = $newName, updated_at = NOW() -- updated_at jest też aktualizowane przez trigger DB
        WHERE id = $setId AND user_id = $userId
        RETURNING *;
        ```
    c.  Polityki RLS w bazie danych PostgreSQL zapewniają, że użytkownik może modyfikować tylko własne zestawy.
    d.  Baza danych (PostgreSQL) automatycznie aktualizuje pole `updated_at` dzięki triggerowi `update_updated_at_column` (zdefiniowanemu w `db-plan.md`).
    e.  Obsługuje potencjalne błędy z bazy danych:
        *   Jeśli zapytanie nie zaktualizuje żadnego wiersza (np. zestaw nie istnieje lub nie należy do użytkownika), serwis zwraca `null` lub rzuca specyficzny błąd, który handler mapuje na `404`.
        *   Jeśli wystąpi błąd unikalności nazwy (`UNIQUE (user_id, name)` - kod błędu PostgreSQL `23505`), serwis rzuca błąd, który handler mapuje na `400`).
        *   Inne błędy bazy danych są propagowane i mapowane na `500`.
    f.  Jeśli aktualizacja powiedzie się, zwraca zaktualizowany obiekt `FlashcardSetDto`.
5.  Handler API:
    a.  Jeśli serwis zwróci zaktualizowany zestaw, handler zwraca `200 OK` z obiektem `FlashcardSetDto`.
    b.  Obsługuje błędy zwrócone przez serwis i mapuje je na odpowiednie kody statusu HTTP (`400`, `404`, `500`).

## 6. Względy bezpieczeństwa
-   **Uwierzytelnianie**:
    -   Obecnie: Wykorzystanie `DEFAULT_USER_ID` z `src/db/supabase.client.ts` jeśli `context.locals.user` nie jest dostępny.
    -   Docelowo: Wymagane uwierzytelnianie oparte na JWT (Supabase) obsługiwane przez middleware. Żądania bez ważnego tokenu powinny być odrzucane z kodem `401`.
-   **Autoryzacja**:
    -   Egzekwowana głównie przez polityki RLS (Row Level Security) w PostgreSQL, które zapewniają, że użytkownicy mogą modyfikować tylko własne zestawy fiszek (`USING (auth.uid() = user_id)`).
    -   Logika serwisowa dodatkowo powinna weryfikować `user_id` przy operacjach na danych.
-   **Walidacja danych wejściowych**:
    -   `setId`: Musi być walidowany jako poprawny UUID, aby zapobiec błędom zapytań lub potencjalnym atakom.
    -   `name`: Musi być walidowane (wymagane, niepuste, maksymalna długość), aby zapobiec błędom i zapewnić spójność danych. Unikalność nazwy na poziomie użytkownika jest kluczowa i egzekwowana przez bazę danych.
    -   Należy używać Zod do walidacji (zgodnie z `astro.mdc`).
-   **Ochrona przed CSRF**: Astro domyślnie może oferować pewne zabezpieczenia, ale dla API bezstanowych opartych na tokenach (JWT w nagłówku/ciasteczku HttpOnly SameSite) ryzyko CSRF jest mniejsze niż w przypadku tradycyjnych aplikacji sesyjnych. Należy upewnić się, że tokeny są obsługiwane bezpiecznie.
-   **Rate Limiting**: Rozważyć implementację mechanizmów ograniczania liczby żądań, aby chronić przed atakami typu DoS/brute-force (choć dla operacji PUT może to być mniej krytyczne niż dla logowania czy generowania AI).

## 7. Obsługa błędów
-   **Błędy walidacji (Zod)**: Zwracane jako `400 Bad Request` z komunikatami o błędach dla poszczególnych pól.
-   **Brak zasobu (`setId` nie znaleziony lub nie należy do użytkownika)**: Zwracane jako `404 Not Found`. Logika serwisu powinna odróżniać "nie znaleziono" od "brak uprawnień" i spójnie zwracać 404 zgodnie ze specyfikacją.
-   **Konflikt nazwy (unikalność `user_id, name`)**: Błąd bazy danych (PostgreSQL kod `23505`) powinien być przechwycony w serwisie i zmapowany na `400 Bad Request` z odpowiednim komunikatem.
-   **Brak autoryzacji**: Zwracane jako `401 Unauthorized` (gdy pełna autentykacja JWT będzie aktywna).
-   **Błędy Supabase/Bazy Danych**:
    -   Jeśli klient Supabase (`context.locals.supabase`) nie jest dostępny, zwrócić `500 Internal Server Error`.
    -   Inne nieoczekiwane błędy podczas interakcji z bazą danych powinny być logowane po stronie serwera i zwracane jako `500 Internal Server Error`.
-   **Logowanie błędów**: Krytyczne błędy serwera (np. problemy z połączeniem DB, nieoczekiwane wyjątki w kodzie) powinny być logowane. Endpoint ten nie dotyczy bezpośrednio generowania AI, więc tabela `generation_error_logs` nie jest tutaj używana.

## 8. Rozważania dotyczące wydajności
-   Operacja `UPDATE` na pojedynczym wierszu w bazie danych, indeksowanym przez klucz główny (`id`) i `user_id`, powinna być wydajna.
-   Indeks `UNIQUE (user_id, name)` na tabeli `flashcard_sets` jest kluczowy dla szybkiego sprawdzania unikalności nazwy.
-   Walidacja Zod jest wykonywana w pamięci i nie powinna stanowić wąskiego gardła.
-   Upewnić się, że połączenia z bazą danych są zarządzane efektywnie (Supabase SDK powinno to obsługiwać).

## 9. Etapy wdrożenia
1.  **Definicja Schematów Zod**:
    *   Utworzyć/zaktualizować `src/lib/schemas/flashcardSetSchemas.ts`.
    *   Dodać `UpdateFlashcardSetParamsSchema` dla `setId`.
    *   Dodać `UpdateFlashcardSetBodySchema` dla `name` w ciele żądania.
2.  **Aktualizacja/Stworzenie Serwisu `FlashcardSetService`**:
    *   W `src/lib/services/flashcardSetService.ts` dodać lub zmodyfikować metodę `updateFlashcardSet`.
    *   Metoda powinna przyjmować `supabaseClient: SupabaseClient` (typ z `src/db/supabase.client.ts`), `setId: string`, `userId: string`, oraz `data: { name: string }`.
    *   Implementacja logiki aktualizacji w bazie danych przy użyciu Supabase client:
        ```typescript
        // Przykład w serwisie
        async updateFlashcardSet(
          supabaseClient: SupabaseClient, 
          setId: string, 
          userId: string, 
          data: { name: string }
        ): Promise<FlashcardSetDto | null> {
          const { data: updatedSet, error } = await supabaseClient
            .from('flashcard_sets')
            .update({ name: data.name /* updated_at jest zarządzane przez DB */ })
            .eq('id', setId)
            .eq('user_id', userId) // Kluczowe dla autoryzacji na poziomie zapytania
            .select() // Aby zwrócić zaktualizowany rekord
            .single(); // Oczekujemy jednego rekordu lub błędu/null

          if (error) {
            if (error.code === '23505') { // Kod błędu PostgreSQL dla naruszenia unikalności
              throw new Error('DUPLICATE_SET_NAME'); // Specjalny błąd do obsługi jako 400
            }
            console.error('Supabase error updating flashcard set:', error);
            // Rzucić generyczny błąd lub specyficzny, który handler zmapuje na 500
            throw new Error('DB_UPDATE_FAILED'); 
          }
          
          if (!updatedSet) { // Jeśli .single() nie zwróci danych i nie ma błędu (np. wiersz nie pasuje)
            return null; // Handler zmapuje na 404
          }

          return updatedSet as FlashcardSetDto; // Rzutowanie na DTO
        }
        ```
3.  **Implementacja Handlera API**:
    *   Utworzyć plik `src/pages/api/flashcard-sets/[setId].ts`.
    *   Dodać `export const prerender = false;`.
    *   Implementować funkcję `PUT` (lub `default` z obsługą metody `PUT`).
    *   Pobranie `userId` (z `context.locals.user.id` lub `DEFAULT_USER_ID`).
    *   Pobranie `supabaseClient` z `context.locals.supabase`. Sprawdzenie, czy jest dostępny.
    *   Walidacja `setId` z `Astro.params` używając `UpdateFlashcardSetParamsSchema.safeParse()`.
    *   Pobranie i walidacja ciała żądania (`Astro.request.json()`) używając `UpdateFlashcardSetBodySchema.safeParse()`.
    *   Wywołanie metody `flashcardSetService.updateFlashcardSet()`.
    *   Obsługa odpowiedzi z serwisu i zwracanie odpowiednich kodów statusu HTTP oraz JSON.
        *   Jeśli sukces: `200 OK` z `FlashcardSetDto`.
        *   Jeśli serwis zwróci `null` (nie znaleziono): `404 Not Found`.
        *   Jeśli serwis rzuci `DUPLICATE_SET_NAME`: `400 Bad Request` z komunikatem.
        *   Inne błędy serwisu: `500 Internal Server Error`.
4.  **Testowanie**:
    *   Testy jednostkowe dla logiki walidacji Zod.
    *   Testy jednostkowe/integracyjne dla `FlashcardSetService` (możliwe z użyciem mocków Supabase).
    *   Testy E2E dla punktu końcowego API, obejmujące:
        *   Pomyślną aktualizację.
        *   Próbę aktualizacji nieistniejącego zestawu (`404`).
        *   Próbę aktualizacji zestawu nienależącego do użytkownika (powinno dać `404` dzięki RLS i logice serwisu).
        *   Błędy walidacji (nieprawidłowe `setId`, brak `name`, za długa `name`).
        *   Konflikt nazwy (próba ustawienia nazwy, która już istnieje dla tego użytkownika).
        *   (Docelowo) Brak autoryzacji (`401`).
5.  **Dokumentacja**:
    *   Zaktualizować `api-plan.md`, jeśli ten plan wnosi zmiany lub uszczegółowienia.
    *   Upewnić się, że ten plik (`.ai/docs/put-flashcard-sets-implementation-plan.md`) jest kompletny i aktualny.
    *   Dodać/zaktualizować dokumentację OpenAPI/Swagger, jeśli projekt korzysta z takiego narzędzia.

Ten plan powinien zapewnić kompleksowe wytyczne dla zespołu programistów do wdrożenia punktu końcowego `PUT /api/flashcard-sets/{setId}`.
