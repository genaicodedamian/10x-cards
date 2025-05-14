# Plan Implementacji Punktu Końcowego API: GET /api/flashcard-sets

## 1. Przegląd Punktu Końcowego
Celem tego punktu końcowego jest umożliwienie uwierzytelnionym użytkownikom pobierania listy ich zestawów fiszek. Punkt końcowy obsługuje paginację oraz sortowanie wyników. Odpowiedź zawiera listę zestawów fiszek oraz metadane dotyczące paginacji.

## 2. Szczegóły Żądania
-   **Metoda HTTP**: `GET`
-   **Struktura URL**: `/api/flashcard-sets`
-   **Parametry Zapytania (Query Parameters)**:
    -   `page`: `integer` (opcjonalny, domyślnie: 1) - Numer strony dla paginacji.
    -   `limit`: `integer` (opcjonalny, domyślnie: 10, maksymalnie: 100) - Liczba elementów na stronie.
    -   `sort_by`: `string` (opcjonalny, domyślnie: `created_at`) - Pole, według którego sortowane są wyniki. Dozwolone wartości: `name`, `created_at`, `updated_at`, `last_studied_at`.
    -   `order`: `string` (opcjonalny, domyślnie: `desc`) - Kierunek sortowania. Dozwolone wartości: `asc`, `desc`.
-   **Request Body**: Brak

## 3. Wykorzystywane Typy
Do implementacji tego punktu końcowego wykorzystane zostaną następujące typy zdefiniowane w `src/types.ts`:
-   `FlashcardSetDto`: Reprezentuje pojedynczy zestaw fiszek w odpowiedzi.
    ```typescript
    export type FlashcardSetDto = Tables<'flashcard_sets'>;
    ```
-   `PaginationInfoDto`: Reprezentuje informacje o paginacji w odpowiedzi.
    ```typescript
    export type PaginationInfoDto = {
      current_page: number;
      total_pages: number;
      total_items: number;
      limit: number;
    };
    ```
-   `PaginatedFlashcardSetsDto`: Reprezentuje całościową strukturę odpowiedzi dla listy zestawów fiszek z paginacją.
    ```typescript
    export type PaginatedFlashcardSetsDto = {
      data: FlashcardSetDto[];
      pagination: PaginationInfoDto;
    };
    ```
Do walidacji parametrów zapytania zostanie użyty schemat Zod:
```typescript
import { z } from 'zod';

const GetFlashcardSetsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10).transform(val => Math.min(val, 100)), // Max limit 100
  sort_by: z.enum(['name', 'created_at', 'updated_at', 'last_studied_at']).optional().default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});
```

## 4. Szczegóły Odpowiedzi
-   **Odpowiedź Sukcesu (200 OK)**:
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
        // ... inne zestawy fiszek
      ],
      "pagination": {
        "current_page": "integer",
        "total_pages": "integer",
        "total_items": "integer",
        "limit": "integer"
      }
    }
    ```
-   **Odpowiedzi Błędów**:
    -   `400 Bad Request`: Nieprawidłowe parametry zapytania.
    -   `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
    -   `500 Internal Server Error`: Wewnętrzny błąd serwera.

## 5. Przepływ Danych
1.  Żądanie `GET` trafia do endpointu Astro `/api/flashcard-sets`.
2.  Handler API w Astro (`src/pages/api/flashcard-sets/index.ts`):
    a.  Weryfikuje uwierzytelnienie użytkownika za pomocą `context.locals.user` (dostarczonego przez middleware Astro lub bezpośrednie sprawdzenie sesji Supabase). Jeśli użytkownik nie jest uwierzytelniony, zwraca `401 Unauthorized`.
    b.  Pobiera parametry zapytania (`page`, `limit`, `sort_by`, `order`) z `Astro.url.searchParams`.
    c.  Waliduje parametry zapytania przy użyciu zdefiniowanego schematu Zod (`GetFlashcardSetsQuerySchema`). W przypadku niepowodzenia walidacji, zwraca `400 Bad Request` z odpowiednim komunikatem błędu.
    d.  Wywołuje metodę serwisową (np. `FlashcardSetService.getFlashcardSets`) przekazując `context.locals.supabase` (klient Supabase), `context.locals.user.id` oraz zwalidowane parametry.
3.  Serwis `FlashcardSetService` (np. w `src/lib/services/flashcardSetService.ts`):
    a.  Oblicza `offset` na podstawie `page` i `limit`.
    b.  Konstruuje zapytanie do Supabase, aby pobrać zestawy fiszek (`flashcard_sets`) należące do danego `user_id`.
    c.  Zapytanie powinno zawierać `select('*', { count: 'exact' })` w celu uzyskania całkowitej liczby pasujących rekordów dla paginacji.
    d.  Stosuje sortowanie (`order`) i paginację (`range`) zgodnie z przekazanymi parametrami.
    e.  Polityki RLS (Row Level Security) w PostgreSQL zapewniają, że użytkownik może pobrać tylko własne zestawy fiszek. Zapytanie w serwisie dodatkowo filtruje po `user_id` dla jawności.
    f.  Wykonuje zapytanie do bazy danych.
    g.  Jeśli wystąpi błąd podczas komunikacji z bazą danych, zwraca błąd do handlera API.
    h.  Oblicza `total_pages` na podstawie `total_items` (całkowita liczba rekordów) i `limit`.
    i.  Zwraca listę zestawów fiszek (`FlashcardSetDto[]`) oraz obiekt `PaginationInfoDto`.
4.  Handler API w Astro:
    a.  Jeśli serwis zwróci błąd, loguje go i zwraca `500 Internal Server Error`.
    b.  Jeśli operacja się powiedzie, konstruuje obiekt `PaginatedFlashcardSetsDto` i zwraca go z kodem statusu `200 OK`.

## 6. Względy Bezpieczeństwa
-   **Uwierzytelnianie**: Wymagane. Dostęp do endpointu mają tylko zalogowani użytkownicy. Realizowane poprzez integrację Astro z Supabase Auth (np. przez middleware sprawdzające JWT).
-   **Autoryzacja**: Użytkownicy mogą pobierać tylko własne zestawy fiszek. Zapewnione przez polityki RLS w bazie danych PostgreSQL na tabeli `flashcard_sets` (`USING (auth.uid() = user_id)`) oraz dodatkową weryfikację `user_id` w zapytaniach serwisu.
-   **Walidacja Danych Wejściowych**: Parametry zapytania (`page`, `limit`, `sort_by`, `order`) są walidowane za pomocą Zod, aby zapobiec nieoczekiwanemu zachowaniu i potencjalnym atakom (np. SQL Injection, chociaż Supabase SDK parametryzuje zapytania).
    -   `limit` jest ograniczony do maksymalnie 100, aby zapobiec nadmiernemu obciążeniu serwera.
-   **Ochrona przed Wyciekiem Informacji**: Komunikaty błędów dla statusu `500` powinny być generyczne i nie ujawniać szczegółów implementacyjnych systemu.

## 7. Rozważania dotyczące Wydajności
-   **Paginacja**: Kluczowa dla wydajności przy dużej liczbie zestawów fiszek. Zapytania do bazy danych muszą efektywnie wykorzystywać `LIMIT` i `OFFSET` (lub `range` w Supabase).
-   **Indeksowanie Bazy Danych**:
    -   Należy upewnić się, że kolumna `user_id` w tabeli `flashcard_sets` jest zaindeksowana (`idx_flashcard_sets_user_id`).
    -   Kolumny używane do sortowania (`name`, `created_at`, `updated_at`, `last_studied_at`) również powinny być zaindeksowane, jeśli przewiduje się częste sortowanie po nich.
-   **Liczba Zapytań do Bazy Danych**: Zapytanie o dane i całkowitą liczbę elementów (`count: 'exact'`) powinno być realizowane w miarę możliwości w jednym zapytaniu do bazy danych, co Supabase wspiera.
-   **Rozmiar Odpowiedzi**: Ograniczenie `limit` pomaga kontrolować rozmiar odpowiedzi.

## 8. Etapy Wdrożenia
1.  **Definicja Schematu Walidacji Zod**:
    -   Stworzyć plik (np. `src/lib/schemas/flashcardSetSchemas.ts`) lub dodać do istniejącego, schemat `GetFlashcardSetsQuerySchema` dla parametrów zapytania (`page`, `limit`, `sort_by`, `order`) z odpowiednimi typami, wartościami domyślnymi i transformacjami (np. `Math.min` dla `limit`).
2.  **Implementacja Serwisu `FlashcardSetService`**:
    -   Stworzyć plik `src/lib/services/flashcardSetService.ts` (jeśli nie istnieje).
    -   Dodać metodę `async getFlashcardSets(supabase: SupabaseClient, userId: string, params: { page: number, limit: number, sortBy: string, order: 'asc' | 'desc' }): Promise<{ data: FlashcardSetDto[]; pagination: PaginationInfoDto; error?: PostgrestError | null }>`
    -   W metodzie zaimplementować logikę pobierania danych z tabeli `flashcard_sets` używając klienta Supabase:
        -   Filtrowanie po `user_id`.
        -   Użycie `select('*', { count: 'exact' })`.
        -   Zastosowanie `order(params.sortBy, { ascending: params.order === 'asc' })`.
        -   Zastosowanie `range((params.page - 1) * params.limit, params.page * params.limit - 1)`.
        -   Obsługa błędów z Supabase.
        -   Obliczenie `total_pages`, `current_page`, `total_items`.
        -   Zwrócenie danych i informacji o paginacji.
3.  **Implementacja Handlera API w Astro**:
    -   Stworzyć plik `src/pages/api/flashcard-sets/index.ts`.
    -   Dodać handler dla metody `GET`.
    -   Implementacja w handlerze:
        -   Pobranie `supabase` i `user` z `Astro.locals`.
        -   Sprawdzenie, czy `user` istnieje. Jeśli nie, zwrócić `Astro.json({ message: 'Unauthorized' }, { status: 401 })`.
        -   Pobranie parametrów zapytania z `Astro.url.searchParams`.
        -   Walidacja parametrów przy użyciu `GetFlashcardSetsQuerySchema.safeParse()`.
        -   W przypadku błędu walidacji, zwrócić `Astro.json({ message: 'Bad Request', errors: result.error.flatten().fieldErrors }, { status: 400 })`.
        -   Wywołanie metody `flashcardSetService.getFlashcardSets` z odpowiednimi argumentami.
        -   Obsługa odpowiedzi z serwisu:
            -   Jeśli błąd, zalogować błąd i zwrócić `Astro.json({ message: 'Internal Server Error' }, { status: 500 })`.
            -   Jeśli sukces, zwrócić `Astro.json({ data: result.data, pagination: result.pagination }, { status: 200 })`.
4.  **Konfiguracja Uwierzytelniania (Middleware Astro)**:
    -   Upewnić się, że istnieje middleware Astro, które weryfikuje sesję użytkownika Supabase i umieszcza `user` oraz `supabase` w `Astro.locals`. (Zgodnie z regułą "Use supabase from context.locals in Astro routes").
5.  **Testowanie**:
    -   Napisać testy jednostkowe dla serwisu (walidacja logiki biznesowej, interakcji z Supabase).
    -   Napisać testy integracyjne dla endpointu API, obejmujące:
        -   Przypadki poprawnego działania z różnymi parametrami (`page`, `limit`, `sort_by`, `order`).
        -   Przypadki braku uwierzytelnienia (401).
        -   Przypadki niepoprawnych parametrów zapytania (400).
        -   Sprawdzenie, czy użytkownik otrzymuje tylko swoje dane (test RLS).
        -   Testowanie paginacji (poprawność `total_items`, `total_pages`, `current_page`).
        -   Testowanie limitu maksymalnego dla `limit`.
6.  **Dokumentacja**:
    -   Zaktualizować dokumentację API (np. Swagger/OpenAPI), jeśli jest używana, aby odzwierciedlała zaimplementowany endpoint, w tym parametry, odpowiedzi i kody błędów.
    -   Upewnić się, że definicje typów w `src/types.ts` są aktualne i zgodne z implementacją.
7.  **Przegląd Kodu (Code Review)**:
    -   Przeprowadzić przegląd kodu w celu zapewnienia jakości, zgodności z wytycznymi i bezpieczeństwa.
