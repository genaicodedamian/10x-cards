# API Endpoint Implementation Plan: DELETE /api/flashcards/{flashcardId}

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia uwierzytelnionemu użytkownikowi usunięcie określonej karty (flashcard) na podstawie jej unikalnego identyfikatora (`flashcardId`). Usunięcie karty pociąga za sobą również aktualizację zagregowanych liczników (`total_flashcards_count` oraz `accepted_unedited_count`, jeśli dotyczy) w nadrzędnym zestawie kart (`flashcard_sets`). Operacje te muszą być wykonane atomowo, aby zapewnić spójność danych.

## 2. Szczegóły żądania
-   **Metoda HTTP**: `DELETE`
-   **Struktura URL**: `/api/flashcards/{flashcardId}`
-   **Parametry ścieżki**:
    -   Wymagane:
        -   `flashcardId` (UUID): Unikalny identyfikator karty do usunięcia.
-   **Parametry zapytania (Query Parameters)**: Brak.
-   **Request Body**: Brak. Treść żądania powinna być pusta.
-   **Nagłówki (Headers)**:
    -   `Authorization: Bearer <SUPABASE_JWT>`: Wymagany do uwierzytelnienia użytkownika.

## 3. Wykorzystywane typy
Chociaż nie ma bezpośrednich typów DTO dla żądania/odpowiedzi tego endpointu, wewnętrznie będą wykorzystywane:
-   `params`: Obiekt zawierający `flashcardId` (np. walidowany przez Zod).
-   Typy z `src/db/database.types.ts` i `src/types.ts` (np. `FlashcardDto` do odczytu `source` i `set_id` przed usunięciem, `FlashcardSetDto` do aktualizacji liczników).

## 4. Szczegóły odpowiedzi
-   **Odpowiedź sukcesu**:
    -   Kod Statusu: `204 No Content`
    -   Treść Odpowiedzi: Pusta.
-   **Odpowiedzi błędów**:
    -   Kod Statusu: `400 Bad Request` (np. jeśli `flashcardId` nie jest poprawnym UUID).
        ```json
        {
          "error": "Validation failed",
          "details": [ /* Komunikaty błędów z Zod */ ]
        }
        ```
    -   Kod Statusu: `401 Unauthorized` (np. brakujący lub nieprawidłowy JWT).
        ```json
        {
          "message": "Unauthorized"
        }
        ```
    -   Kod Statusu: `404 Not Found` (np. karta nie istnieje lub nie należy do użytkownika).
        ```json
        {
          "message": "Flashcard not found"
        }
        ```
    -   Kod Statusu: `500 Internal Server Error` (np. nieoczekiwany błąd bazy danych).
        ```json
        {
          "message": "Internal server error"
        }
        ```

## 5. Przepływ danych
1.  Żądanie `DELETE` trafia do Astro API route (`src/pages/api/flashcards/[flashcardId].ts`).
2.  Middleware Astro (lub logika w handlerze) weryfikuje JWT użytkownika przy użyciu `context.locals.supabase` i pobiera dane użytkownika (`context.locals.user`). Jeśli użytkownik nie jest uwierzytelniony, zwracany jest błąd `401`.
3.  Handler API waliduje parametr ścieżki `flashcardId` (np. przy użyciu schematu Zod), aby upewnić się, że jest to prawidłowy UUID. W przypadku błędu walidacji zwracany jest błąd `400`.
4.  Handler API wywołuje metodę w serwisie `FlashcardService` (np. `flashcardService.deleteFlashcard(supabaseClient, userId, flashcardId)`).
5.  `FlashcardService` wywołuje funkcję PostgreSQL (RPC) `delete_flashcard_atomic(p_flashcard_id UUID, p_user_id UUID)`.
6.  Funkcja `delete_flashcard_atomic` w bazie danych:
    a.  Rozpoczyna transakcję.
    b.  Pobiera `set_id` i `source` karty o podanym `p_flashcard_id`, upewniając się, że należy ona do `p_user_id`. Jeśli karta nie zostanie znaleziona lub nie należy do użytkownika, funkcja może zwrócić status wskazujący na błąd "not found".
    c.  Usuwa kartę z tabeli `flashcards`.
    d.  Aktualizuje tabelę `flashcard_sets`:
        i.  Dekrementuje `total_flashcards_count` o 1 dla odpowiedniego `set_id`.
        ii. Jeśli pobrany `source` to `'ai_generated'`, dekrementuje również `accepted_unedited_count` o 1.
    e.  Zatwierdza transakcję.
    f.  Zwraca status powodzenia lub niepowodzenia do `FlashcardService`.
7.  `FlashcardService` przetwarza wynik z funkcji RPC:
    a.  Jeśli operacja w bazie danych zakończyła się sukcesem, serwis zwraca potwierdzenie do handlera API.
    b.  Jeśli funkcja RPC zwróciła błąd "not found", serwis informuje handler API, aby zwrócił `404`.
    c.  W przypadku innych błędów bazy danych, serwis informuje handler API, aby zwrócił `500`.
8.  Handler API, na podstawie odpowiedzi z serwisu:
    a.  W przypadku sukcesu, zwraca odpowiedź `204 No Content`.
    b.  W przypadku znanych błędów (np. "not found"), zwraca odpowiedni kod statusu (`404`).
    c.  W przypadku nieoczekiwanych błędów, zwraca `500 Internal Server Error`.

## 6. Względy bezpieczeństwa
-   **Uwierzytelnianie**: Wymagane. Realizowane przez Supabase Auth; JWT jest sprawdzany w każdej prośbie API. Dostęp do `context.locals.supabase` i `context.locals.user` w Astro.
-   **Autoryzacja**:
    -   Realizowana głównie przez PostgreSQL Row Level Security (RLS) skonfigurowane dla tabel `flashcards` i `flashcard_sets`, które zapewniają, że użytkownicy mogą modyfikować tylko własne dane (`WHERE user_id = auth.uid()`).
    -   Funkcja bazodanowa `delete_flashcard_atomic` również będzie operować w kontekście `user_id` przekazanego jako parametr, dodatkowo zabezpieczając operację.
-   **Walidacja danych wejściowych**: Parametr `flashcardId` musi być walidowany jako UUID przy użyciu Zod, aby zapobiec błędom i potencjalnym atakom (np. SQL injection, chociaż ORM/klient Supabase powinien temu zapobiegać).
-   **Atomowość operacji**: Kluczowa dla spójności danych. Użycie transakcji w funkcji PostgreSQL `delete_flashcard_atomic` zapewnia, że usunięcie karty i aktualizacja liczników w zestawie albo w pełni się powiodą, albo żadna zmiana nie zostanie zastosowana.

## 7. Obsługa błędów
-   **Błędy walidacji (400)**: Zod obsłuży walidację `flashcardId`. Odpowiedź powinna zawierać szczegóły błędu.
-   **Brak uwierzytelnienia (401)**: Standardowa obsługa przez Astro/Supabase.
-   **Zasób nie znaleziony (404)**: Jeśli karta o podanym ID nie istnieje lub nie należy do uwierzytelnionego użytkownika.
-   **Błędy serwera (500)**: W przypadku nieoczekiwanych problemów z bazą danych lub logiką serwera. Błędy te powinny być logowane po stronie serwera.
-   Należy zaimplementować spójne formaty odpowiedzi dla błędów.

## 8. Rozważania dotyczące wydajności
-   Operacja usunięcia pojedynczej karty i aktualizacji liczników powinna być szybka, zakładając odpowiednie indeksowanie tabel (`flashcards.id`, `flashcard_sets.id`, `flashcards.user_id`, `flashcard_sets.user_id`).
-   Indeksy na `flashcards(id)` (PRIMARY KEY) i `flashcards(user_id, set_id)` będą kluczowe.
-   Indeksy na `flashcard_sets(id)` (PRIMARY KEY) i `flashcard_sets(user_id)` będą kluczowe.
-   Wywołanie funkcji RPC jest generalnie wydajne, ponieważ minimalizuje liczbę zapytań sieciowych między aplikacją a bazą danych.

## 9. Kroki implementacji
1.  **Definicja schematu Zod**:
    -   W odpowiednim miejscu (np. w pliku handlera API lub współdzielonym pliku walidacji) zdefiniować schemat Zod do walidacji `flashcardId` jako UUID.
    ```typescript
    // src/pages/api/flashcards/[flashcardId].ts lub podobne
    import { z } from 'zod';
    const pathParamsSchema = z.object({
      flashcardId: z.string().uuid({ message: "Invalid flashcard ID format" }),
    });
    ```
2.  **Tworzenie funkcji bazodanowej PostgreSQL**:
    -   Stworzyć nowy plik migracji Supabase.
    -   Zdefiniować funkcję `public.delete_flashcard_atomic(p_flashcard_id UUID, p_user_id UUID)`:
        -   Funkcja powinna używać `SECURITY DEFINER` lub odpowiednich uprawnień, aby móc modyfikować liczniki. Należy zachować ostrożność i upewnić się, że operacje są nadal ograniczone do danych użytkownika. Alternatywnie, `SECURITY INVOKER` jeśli rola użytkownika ma odpowiednie uprawnienia (co jest typowe przy RLS). Domyślnie `SECURITY INVOKER` jest bezpieczniejsze.
        -   Logika:
            1.  Pobierz `f.set_id`, `f.source` z `flashcards f` WHERE `f.id = p_flashcard_id` AND `f.user_id = p_user_id`.
            2.  Jeśli nie znaleziono, rzuć wyjątek lub zwróć status `NOT_FOUND`.
            3.  Usuń z `flashcards` WHERE `id = p_flashcard_id`.
            4.  Zaktualizuj `flashcard_sets` SET `total_flashcards_count = total_flashcards_count - 1` WHERE `id = retrieved_set_id`.
            5.  Jeśli `retrieved_source = 'ai_generated'`, zaktualizuj `flashcard_sets` SET `accepted_unedited_count = accepted_unedited_count - 1` WHERE `id = retrieved_set_id`.
            6.  Zwróć status sukcesu.
    ```sql
    -- Plik migracji Supabase
    CREATE OR REPLACE FUNCTION public.delete_flashcard_atomic(
        p_flashcard_id UUID,
        p_auth_user_id UUID -- Renamed to avoid confusion with table columns
    )
    RETURNS JSONB -- Returns a status object e.g., {"status": "success"} or {"status": "not_found"}
    LANGUAGE plpgsql
    AS $$
    DECLARE
        v_set_id UUID;
        v_source TEXT;
        v_flashcard_user_id UUID;
        deleted_flashcard_count INT;
    BEGIN
        -- Ensure the flashcard exists and belongs to the user
        SELECT set_id, source, user_id INTO v_set_id, v_source, v_flashcard_user_id
        FROM public.flashcards
        WHERE id = p_flashcard_id;

        IF NOT FOUND THEN
            RETURN jsonb_build_object('status', 'not_found', 'message', 'Flashcard not found.');
        END IF;

        IF v_flashcard_user_id != p_auth_user_id THEN
            -- This check is redundant if RLS is correctly configured for SECURITY INVOKER
            -- but provides an explicit check within the function.
            RETURN jsonb_build_object('status', 'unauthorized', 'message', 'User not authorized to delete this flashcard.');
        END IF;

        -- Delete the flashcard
        DELETE FROM public.flashcards WHERE id = p_flashcard_id;
        GET DIAGNOSTICS deleted_flashcard_count = ROW_COUNT;

        IF deleted_flashcard_count = 0 THEN
             -- Should not happen if previous select was successful and RLS allows delete,
             -- but as a safeguard.
            RETURN jsonb_build_object('status', 'error', 'message', 'Flashcard deletion failed unexpectedly.');
        END IF;

        -- Update counts on the parent flashcard_set
        UPDATE public.flashcard_sets
        SET total_flashcards_count = total_flashcards_count - 1
        WHERE id = v_set_id;

        IF v_source = 'ai_generated' THEN
            UPDATE public.flashcard_sets
            SET accepted_unedited_count = accepted_unedited_count - 1
            WHERE id = v_set_id;
        END IF;

        RETURN jsonb_build_object('status', 'success');
    EXCEPTION
        WHEN OTHERS THEN
            -- Log the error (if possible within PL/pgSQL or rely on PostgreSQL logs)
            RETURN jsonb_build_object('status', 'error', 'message', 'An unexpected error occurred: ' || SQLERRM);
    END;
    $$;
    ```
3.  **Implementacja serwisu `FlashcardService`**:
    -   W `src/lib/services/flashcardService.ts` (lub nowym `flashcards.service.ts`):
    -   Dodać metodę `async deleteFlashcard(supabase: SupabaseClient, userId: string, flashcardId: string)`:
        -   Wywołuje RPC: `await supabase.rpc('delete_flashcard_atomic', { p_flashcard_id: flashcardId, p_auth_user_id: userId })`.
        -   Przetwarza odpowiedź z RPC (`data.status`) i zwraca odpowiedni wynik/błąd.
    ```typescript
    // src/lib/services/flashcards.service.ts
    import type { SupabaseClient } from '@supabase/supabase-js'; // Użyj SupabaseClient z src/db/supabase.client.ts

    export class FlashcardService {
      async deleteFlashcard(
        supabase: SupabaseClient, // Użyj typu SupabaseClient z src/db/supabase.client.ts
        userId: string,
        flashcardId: string
      ): Promise<{ success: true } | { success: false; errorType: 'NotFound' | 'Unauthorized' | 'ServiceError'; statusCode: 404 | 401 | 500; message?: string }> {
        const { data, error } = await supabase.rpc('delete_flashcard_atomic', {
          p_flashcard_id: flashcardId,
          p_auth_user_id: userId,
        });

        if (error) {
          console.error('Error calling delete_flashcard_atomic RPC:', error);
          return { success: false, errorType: 'ServiceError', statusCode: 500, message: error.message };
        }

        if (data && data.status === 'success') {
          return { success: true };
        } else if (data && data.status === 'not_found') {
          return { success: false, errorType: 'NotFound', statusCode: 404, message: data.message || 'Flashcard not found.' };
        } else if (data && data.status === 'unauthorized') {
          return { success: false, errorType: 'Unauthorized', statusCode: 401, message: data.message || 'Unauthorized.' };
        } else {
          console.error('Unexpected response from delete_flashcard_atomic RPC:', data);
          return { success: false, errorType: 'ServiceError', statusCode: 500, message: (data && data.message) || 'Failed to delete flashcard due to an unknown error.' };
        }
      }
    }
    export const flashcardService = new FlashcardService();
    ```
4.  **Implementacja handlera API w Astro**:
    -   Utwórz/edytuj plik `src/pages/api/flashcards/[flashcardId].ts`.
    -   Zaimplementuj funkcję `DELETE({ params, locals, response })`.
    -   Dodaj `export const prerender = false;`.
    -   Sprawdź, czy `locals.user` istnieje. Jeśli nie, zwróć `401`.
    -   Waliduj `params.flashcardId` przy użyciu Zod. W przypadku błędu, zwróć `400`.
    -   Pobierz `supabase` z `locals.supabase`.
    -   Wywołaj `flashcardService.deleteFlashcard()`.
    -   Na podstawie wyniku z serwisu, zwróć `204`, `404` lub `500`.
    ```typescript
    // src/pages/api/flashcards/[flashcardId].ts
    import type { APIRoute } from 'astro';
    import { z } from 'zod';
    import { flashcardService } // Załóżmy, że serwis jest eksportowany
        from '../../../../lib/services/flashcards.service'; // Dostosuj ścieżkę

    export const prerender = false;

    const pathParamsSchema = z.object({
      flashcardId: z.string().uuid({ message: "Invalid flashcard ID format." }),
    });

    export const DELETE: APIRoute = async ({ params, locals, redirect }) => {
      const { user } = locals;
      const supabase = locals.supabase; // Pobierz Supabase z locals

      if (!user) {
        return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
      }

      const parsedParams = pathParamsSchema.safeParse(params);
      if (!parsedParams.success) {
        return new Response(JSON.stringify({ error: "Validation failed", details: parsedParams.error.flatten().fieldErrors }), { status: 400 });
      }

      const { flashcardId } = parsedParams.data;

      const result = await flashcardService.deleteFlashcard(supabase, user.id, flashcardId);

      if (result.success) {
        return new Response(null, { status: 204 });
      } else {
        return new Response(JSON.stringify({ message: result.message || 'Error deleting flashcard' }), { status: result.statusCode });
      }
    };
    ```
5.  **Testowanie**:
    -   Napisać testy jednostkowe dla logiki w `FlashcardService` (można mockować wywołanie RPC).
    -   Napisać testy integracyjne dla endpointu API, obejmujące:
        -   Pomyślne usunięcie.
        -   Próbę usunięcia nieistniejącej karty (`404`).
        -   Próbę usunięcia karty innego użytkownika (`404` lub `401` w zależności od implementacji RPC).
        -   Próbę usunięcia z nieprawidłowym ID (`400`).
        -   Próbę usunięcia bez uwierzytelnienia (`401`).
        -   Weryfikację aktualizacji liczników w `flashcard_sets`.
6.  **Dokumentacja**: Zaktualizować dokumentację API (np. Swagger/OpenAPI), jeśli jest prowadzona. Plan ten może służyć jako podstawa.

Powyższe kroki zapewnią solidne wdrożenie punktu końcowego `DELETE /api/flashcards/{flashcardId}` zgodnie z wymaganiami i najlepszymi praktykami.
