# API Endpoint Implementation Plan: GET /api/flashcards/{flashcardId}

## 1. Przegląd punktu końcowego
Ten punkt końcowy służy do pobierania pojedynczej fiszki na podstawie jej unikalnego identyfikatora (`flashcardId`). Punkt końcowy wymaga uwierzytelnienia użytkownika i zwraca dane fiszki, jeśli użytkownik jest jej właścicielem.

## 2. Szczegóły żądania
-   **Metoda HTTP**: `GET`
-   **Struktura URL**: `/api/flashcards/{flashcardId}`
-   **Parametry**:
    -   **Parametry ścieżki (Path Parameters)**:
        -   `flashcardId` (string, UUID): Wymagany. Unikalny identyfikator fiszki.
    -   **Parametry zapytania (Query Parameters)**: Brak
-   **Request Body**: Brak (dla metody GET)

## 3. Wykorzystywane typy
-   **DTO odpowiedzi (Response DTO)**:
    -   `FlashcardDto` (zdefiniowany w `src/types.ts` jako `Tables<'flashcards'>`): Używany do reprezentowania danych fiszki w odpowiedzi.
      ```typescript
      export type FlashcardDto = {
        id: string; // uuid
        set_id: string; // uuid
        user_id: string; // uuid
        front: string;
        back: string;
        source: string; // 'manual' | 'ai_generated' | 'ai_generated_modified'
        created_at: string; // timestamp
        updated_at: string; // timestamp
      };
      ```
-   **Modele poleceń (Command Models)**: Nie dotyczy (dla metody GET).
-   **Modele walidacji (Validation Models - Zod)**:
    -   Schemat Zod do walidacji `flashcardId` (np. `z.string().uuid()`).

## 4. Szczegóły odpowiedzi
-   **Odpowiedź sukcesu (200 OK)**:
    ```json
    {
      "id": "uuid",
      "set_id": "uuid",
      "user_id": "uuid",
      "front": "string",
      "back": "string",
      "source": "string", // np. 'manual', 'ai_generated'
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
    ```
    Typ odpowiedzi: `SingleFlashcardResponseDto` (który jest aliasem na `FlashcardDto`).

-   **Odpowiedzi błędów**:
    -   `400 Bad Request`: Jeśli `flashcardId` nie jest poprawnym UUID.
        ```json
        {
          "error": "Invalid flashcard ID format"
        }
        ```
    -   `401 Unauthorized`: Jeśli użytkownik nie jest uwierzytelniony (brak/niepoprawny token JWT).
        ```json
        {
          "error": "Unauthorized"
        }
        ```
    -   `404 Not Found`: Jeśli fiszka o podanym `flashcardId` nie istnieje lub nie należy do uwierzytelnionego użytkownika.
        ```json
        {
          "error": "Flashcard not found"
        }
        ```
    -   `500 Internal Server Error`: W przypadku nieoczekiwanego błędu serwera.
        ```json
        {
          "error": "Internal Server Error"
        }
        ```

## 5. Przepływ danych
1.  Klient wysyła żądanie `GET` na `/api/flashcards/{flashcardId}` z tokenem JWT w nagłówku `Authorization`.
2.  Middleware Astro weryfikuje token JWT. Jeśli jest niepoprawny, zwraca `401 Unauthorized`. Jeśli poprawny, dane użytkownika (w tym `userId`) są dostępne w `context.locals.user`.
3.  Handler API route w `src/pages/api/flashcards/[flashcardId].ts` jest wywoływany.
4.  `flashcardId` z parametrów ścieżki jest walidowany (musi być poprawnym UUID). Jeśli nie, zwraca `400 Bad Request`.
5.  Handler wywołuje metodę serwisową (np. `flashcardService.getFlashcardById(supabase, flashcardId, userId)`), przekazując klienta Supabase z `context.locals.supabase`, `flashcardId` oraz `userId` uwierzytelnionego użytkownika.
6.  Metoda serwisowa wykonuje zapytanie do bazy danych Supabase (tabela `flashcards`):
    ```sql
    SELECT * FROM flashcards WHERE id = {flashcardId} AND user_id = {userId} LIMIT 1;
    ```
    (Polityki RLS na tabeli `flashcards` również zapewniają, że użytkownik może odpytywać tylko swoje fiszki: `auth.uid() = user_id`).
7.  Jeśli zapytanie nie zwróci żadnych wyników (fiszka nie istnieje lub nie należy do użytkownika), serwis zwraca `null` (lub rzuca specyficzny błąd). Handler API mapuje to na odpowiedź `404 Not Found`.
8.  Jeśli fiszka zostanie znaleziona, serwis zwraca obiekt `FlashcardDto`.
9.  Handler API serializuje obiekt `FlashcardDto` do JSON i wysyła go w odpowiedzi z kodem statusu `200 OK`.
10. W przypadku błędów bazy danych lub innych nieoczekiwanych problemów po stronie serwera, zwracany jest kod statusu `500 Internal Server Error`.

## 6. Względy bezpieczeństwa
-   **Uwierzytelnianie**: Wymagane. Realizowane przez middleware Astro, które weryfikuje token JWT (Supabase Auth). Klient Supabase (`context.locals.supabase`) powinien być używany w kontekście uwierzytelnionego użytkownika.
-   **Autoryzacja**:
    -   Realizowana przez polityki Row Level Security (RLS) w PostgreSQL dla tabeli `flashcards`. Polityka zapewnia, że użytkownicy mogą odczytywać (`SELECT`) tylko własne fiszki (`USING (auth.uid() = user_id)`).
    -   Dodatkowo, zapytanie w serwisie powinno zawierać warunek `user_id = {authenticated_user_id}` jako dodatkowe zabezpieczenie i dla jasności logiki.
-   **Walidacja danych wejściowych**:
    -   `flashcardId` musi być walidowany jako poprawny UUID, aby zapobiec błędom zapytań i potencjalnym problemom bezpieczeństwa (choć przy UUID ryzyko SQL injection jest minimalne, walidacja formatu jest kluczowa). Użyj Zod do walidacji.
-   **Ochrona przed IDOR (Insecure Direct Object Reference)**: Zapewniona przez RLS i sprawdzanie `user_id` w zapytaniu.

## 7. Rozważania dotyczące wydajności
-   Zapytanie do bazy danych jest proste i operuje na kluczu głównym (`id`) oraz indeksowanym polu (`user_id` - zgodnie z `db-plan.md` `idx_flashcards_user_id` powinien istnieć), co powinno zapewnić wysoką wydajność.
-   Odpowiedź zawiera tylko dane jednej fiszki, więc jej rozmiar jest mały.
-   Nie przewiduje się wąskich gardeł wydajnościowych dla tego konkretnego punktu końcowego przy typowym obciążeniu.

## 8. Etapy wdrożenia
1.  **Konfiguracja środowiska**:
    -   Upewnij się, że projekt Astro jest poprawnie skonfigurowany z Supabase.
    -   Potwierdź, że typy Supabase (`database.types.ts`) są aktualne.

2.  **Utworzenie pliku API route**:
    -   Utwórz plik `src/pages/api/flashcards/[flashcardId].ts`.
    -   Dodaj `export const prerender = false;` na początku pliku.

3.  **Implementacja obsługi żądania GET**:
    -   W pliku `[flashcardId].ts` zaimplementuj funkcję `GET({ params, locals }: APIContext)`.
    -   Pobierz `flashcardId` z `params`.
    -   Pobierz klienta Supabase (`const supabase = locals.supabase;`) i dane użytkownika (`const user = locals.user;`) z `locals`.

4.  **Walidacja `flashcardId`**:
    -   Zdefiniuj schemat Zod dla `flashcardId` (np. `const FlashcardIdSchema = z.string().uuid();`).
    -   Sparsuj i zwaliduj `flashcardId`. W przypadku błędu walidacji, zwróć odpowiedź `400 Bad Request` z odpowiednim komunikatem.

5.  **Sprawdzenie uwierzytelnienia**:
    -   Sprawdź, czy `locals.user` istnieje. Jeśli nie, middleware Astro powinno już obsłużyć ten przypadek, ale dodatkowe sprawdzenie w handlerze może być zasadne przed próbą dostępu do `user.id`. Jeśli użytkownik nie jest uwierzytelniony (np. `locals.user` jest `null`), zwróć `401 Unauthorized`.

6.  **Utworzenie/Aktualizacja serwisu `FlashcardService`**:
    -   Utwórz plik `src/lib/services/FlashcardService.ts` (jeśli jeszcze nie istnieje).
    -   Dodaj metodę, np.:
        ```typescript
        // src/lib/services/FlashcardService.ts
        import type { SupabaseClient } from '@supabase/supabase-js'; // lub SupabaseClient z src/db/supabase.client.ts
        import type { FlashcardDto } from '@/types'; // Upewnij się, że ścieżka jest poprawna

        export class FlashcardService {
          public async getFlashcardById(
            supabase: SupabaseClient,
            flashcardId: string,
            userId: string
          ): Promise<FlashcardDto | null> {
            const { data, error } = await supabase
              .from('flashcards')
              .select('*')
              .eq('id', flashcardId)
              .eq('user_id', userId) // RLS także to zapewnia, ale explicit jest dobre
              .single();

            if (error && error.code !== 'PGRST116') { // PGRST116: 'Searched for a single row, but 0 rows were found'
              console.error('Error fetching flashcard:', error);
              throw new Error('Failed to fetch flashcard'); // Ogólny błąd, który handler API zamieni na 500
            }
            return data as FlashcardDto | null;
          }
        }
        export const flashcardService = new FlashcardService();
        ```
    -   Należy użyć typu `SupabaseClient` z `src/db/supabase.client.ts` zgodnie z regułą `backend.mdc`.

7.  **Wywołanie serwisu z API route**:
    -   W `[flashcardId].ts`, wywołaj `flashcardService.getFlashcardById(...)`.
    -   Obsłuż wynik:
        -   Jeśli `null`, zwróć `404 Not Found`.
        -   Jeśli obiekt fiszki, zwróć `200 OK` z danymi fiszki.
        -   Obsłuż potencjalne błędy rzucone przez serwis (np. błędy bazy danych) i zwróć `500 Internal Server Error`.

8.  **Obsługa błędów**:
    -   Zaimplementuj zwracanie odpowiednich kodów statusu i komunikatów błędów JSON zgodnie z sekcją "Szczegóły odpowiedzi".

9.  **Testowanie**:
    -   Napisz testy jednostkowe dla logiki serwisu (jeśli to możliwe, mockując klienta Supabase).
    -   Napisz testy integracyjne/E2E dla punktu końcowego API, obejmujące:
        -   Pomyślne pobranie fiszki.
        -   Próbę pobrania nieistniejącej fiszki (oczekiwany 404).
        -   Próbę pobrania fiszki należącej do innego użytkownika (oczekiwany 404 z powodu RLS/sprawdzenia `user_id`).
        -   Żądanie bez uwierzytelnienia (oczekiwany 401).
        -   Żądanie z niepoprawnym formatem `flashcardId` (oczekiwany 400).

10. **Dokumentacja**:
    -   Upewnij się, że punkt końcowy jest udokumentowany (np. w Swagger/OpenAPI, jeśli projekt tego używa, lub w wewnętrznej dokumentacji). Ten plan jest częścią tej dokumentacji.

## Przykład implementacji handlera API (fragment)
```typescript
// src/pages/api/flashcards/[flashcardId].ts
import { flashcardService } from '@/lib/services/FlashcardService'; // Dostosuj ścieżkę
import type { APIContext } from 'astro';
import { z } from 'zod';

export const prerender = false;

const FlashcardIdSchema = z.string().uuid({ message: "Invalid flashcard ID format" });

export async function GET({ params, locals }: APIContext) {
  const supabase = locals.supabase;
  const user = locals.user;

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const flashcardIdValidation = FlashcardIdSchema.safeParse(params.flashcardId);

  if (!flashcardIdValidation.success) {
    return new Response(JSON.stringify({ error: flashcardIdValidation.error.issues[0].message }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const flashcardId = flashcardIdValidation.data;

  try {
    const flashcard = await flashcardService.getFlashcardById(supabase, flashcardId, user.id);

    if (!flashcard) {
      return new Response(JSON.stringify({ error: 'Flashcard not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(flashcard), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('API Error fetching flashcard:', error);
    // Log error to a more sophisticated logging system if available
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

```

Ten plan powinien dostarczyć zespołowi programistów kompleksowych wskazówek dotyczących implementacji punktu końcowego. 