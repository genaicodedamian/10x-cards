# API Endpoint Implementation Plan: Create Flashcard Set

## 1. Przegląd punktu końcowego
Ten endpoint umożliwia uwierzytelnionym użytkownikom tworzenie nowego zestawu fiszek. Wymaga podania unikalnej nazwy zestawu w obrębie konta użytkownika i opcjonalnie akceptuje metadane związane z generowaniem AI, jeśli zestaw pochodzi z takiego procesu.

## 2. Szczegóły żądania
- Metoda HTTP: `POST`
- Struktura URL: `/api/flashcard-sets`
- Parametry: Brak parametrów ścieżki lub zapytania.
- Request Body:
  ```json
  {
    "name": "string (required, unique per user)",
    "source_text_hash": "string (optional, SHA-256 hash)",
    "source_text_length": "integer (optional, 1000-10000 if provided)",
    "generation_duration_ms": "integer (optional)"
  }
  ```

## 3. Wykorzystywane typy
- **Command Model (Request)**: `CreateFlashcardSetCommand` (from `src/types.ts`)
  ```typescript
  export type CreateFlashcardSetCommand = Pick<TablesInsert<'flashcard_sets'>, 'name'> &
    Partial<Pick<TablesInsert<'flashcard_sets'>, 'source_text_hash' | 'source_text_length' | 'generation_duration_ms'>>;
  ```
- **DTO (Response)**: `SingleFlashcardSetResponseDto` (aliased to `FlashcardSetDto`, from `src/types.ts`)
  ```typescript
  export type FlashcardSetDto = Tables<'flashcard_sets'>;
  ```

## 4. Szczegóły odpowiedzi
- **Success (201 Created)**:
  ```json
  {
    "id": "uuid",
    "user_id": "uuid",
    "name": "string",
    "accepted_unedited_count": 0, // Default value
    "total_flashcards_count": 0, // Default value
    "generation_duration_ms": "integer | null",
    "source_text_hash": "string | null",
    "source_text_length": "integer | null",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "last_studied_at": "timestamp | null" // Default null
  }
  ```
- **Error**:
  - `400 Bad Request`: Szczegółowy komunikat o błędzie walidacji.
  - `401 Unauthorized`: Brak odpowiedzi lub standardowy komunikat Astro.
  - `500 Internal Server Error`: Ogólny komunikat o błędzie serwera.

## 5. Przepływ danych
1. Żądanie `POST` dociera do endpointu Astro `/api/flashcard-sets` (`src/pages/api/flashcard-sets/index.ts`).
2. Middleware Astro weryfikuje token JWT użytkownika i udostępnia dane użytkownika w `context.locals.user`. Jeśli uwierzytelnienie się nie powiedzie, zwraca `401`.
3. Handler endpointu odczytuje body żądania.
4. Schemat Zod jest używany do walidacji ciała żądania względem typu `CreateFlashcardSetCommand`. W przypadku niepowodzenia walidacji zwraca `400` ze szczegółami błędu.
5. Handler wywołuje metodę `createSet` w `FlashcardSetService` (`src/lib/services/flashcardSetService.ts`), przekazując zweryfikowane dane i `userId` z `context.locals.user.id`.
6. `FlashcardSetService` używa klienta Supabase (`context.locals.supabase`) do wstawienia nowego rekordu do tabeli `flashcard_sets`. Dane obejmują `user_id`, `name` oraz opcjonalne pola `source_text_hash`, `source_text_length` i `generation_duration_ms`. Pola `accepted_unedited_count` i `total_flashcards_count` domyślnie przyjmują wartość 0.
7. Baza danych (PostgreSQL z RLS) sprawdza:
   - Czy `user_id` w danych pasuje do `auth.uid()` sesji (wymuszone przez RLS `WITH CHECK`).
   - Czy constraint `UNIQUE (user_id, name)` jest spełniony.
   - Czy constraint `CHECK (source_text_length IS NULL OR (source_text_length BETWEEN 1000 AND 10000))` jest spełniony.
8. Jeśli wstawienie do bazy danych się powiedzie, `FlashcardSetService` zwraca nowo utworzony obiekt `FlashcardSetDto` do handlera endpointu.
9. Handler endpointu wysyła odpowiedź `201 Created` z `FlashcardSetDto` w ciele.
10. Jeśli wstawienie do bazy danych nie powiedzie się z powodu naruszenia unikalności (`23505`), `FlashcardSetService` przechwytuje błąd i zwraca go do handlera, który odpowiada `400 Bad Request` z odpowiednim komunikatem. Inne błędy bazy danych skutkują `500 Internal Server Error`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Middleware Astro musi zapewnić, że tylko uwierzytelnieni użytkownicy mogą uzyskać dostęp do tego punktu końcowego. Nieautoryzowane żądania muszą być odrzucane z kodem statusu `401`.
- **Autoryzacja**: Polityki RLS w bazie danych PostgreSQL (`Allow users to insert their own flashcard sets`) zapewniają, że użytkownicy mogą tworzyć zestawy tylko dla siebie. `user_id` musi być jawnie pobierany z kontekstu uwierzytelnionej sesji (`context.locals.user.id`) i używany podczas wstawiania do bazy danych.
- **Walidacja danych wejściowych**: Użycie Zod do walidacji schematu przychodzącego ciała żądania jest obowiązkowe. Należy sprawdzić typy danych, wymagane pola (`name`) oraz ograniczenia (zakres `source_text_length`, jeśli podano). Zapobiega to wprowadzaniu nieprawidłowych danych i potencjalnym atakom.
- **Ochrona przed SQL Injection**: Użycie klienta Supabase z parametryzowanymi zapytaniami zapobiega atakom typu SQL injection.
- **Zapobieganie nadużyciom (Rate Limiting)**: Chociaż nie jest to określone w specyfikacji, należy rozważyć wdrożenie globalnego mechanizmu ograniczania szybkości (rate limiting) na poziomie API, aby zapobiec nadużyciom.

## 7. Obsługa błędów
- **Błąd walidacji (400)**:
  - Wyzwalany przez: Nieprawidłowe dane wejściowe niezgodne ze schematem Zod (brakujące `name`, nieprawidłowy typ danych, `source_text_length` poza zakresem 1000-10000). Naruszenie unikalności nazwy zestawu (`UNIQUE (user_id, name)` - błąd bazy danych `23505`).
  - Obsługa: Zwróć odpowiedź `400 Bad Request` z jasnym komunikatem wskazującym na błąd walidacji (np. "Name is required", "Source text length must be between 1000 and 10000", "A set with this name already exists").
- **Błąd uwierzytelniania (401)**:
  - Wyzwalany przez: Brakujący, nieprawidłowy lub wygasły token JWT.
  - Obsługa: Zwróć odpowiedź `401 Unauthorized`. Odpowiedzialność leży po stronie middleware Astro.
- **Błąd wewnętrzny serwera (500)**:
  - Wyzwalany przez: Błędy połączenia z bazą danych, nieoczekiwane wyjątki w logice serwisowej, inne błędy serwera.
  - Obsługa: Zarejestruj szczegóły błędu po stronie serwera. Zwróć ogólną odpowiedź `500 Internal Server Error`, aby nie ujawniać szczegółów implementacji.

## 8. Rozważania dotyczące wydajności
- **Zapytanie do bazy danych**: Operacja `INSERT` na tabeli `flashcard_sets` jest zazwyczaj szybka.
- **Indeksy**: Istniejący indeks `UNIQUE (user_id, name)` jest kluczowy dla szybkiego sprawdzania unikalności. Indeks na `user_id` (`idx_flashcard_sets_user_id`) również jest ważny dla RLS.
- **Walidacja**: Walidacja Zod jest wydajna i wykonywana w pamięci.
- **Wąskie gardła**: Brak przewidywanych znaczących wąskich gardeł wydajności dla tej konkretnej operacji tworzenia pojedynczego zestawu.

## 9. Etapy wdrożenia
1.  **Utworzenie pliku endpointu Astro**: Stwórz plik `src/pages/api/flashcard-sets/index.ts`.
2.  **Zdefiniowanie metody POST**: W pliku `index.ts` wyeksportuj funkcję asynchroniczną o nazwie `POST` przyjmującą `APIContext`.
3.  **Pobranie kontekstu użytkownika**: W funkcji `POST` uzyskaj dostęp do `context.locals.user` i `context.locals.supabase`. Sprawdź, czy użytkownik jest uwierzytelniony; jeśli nie, zwróć `401`.
4.  **Zdefiniowanie schematu Zod**: Stwórz schemat Zod odpowiadający `CreateFlashcardSetCommand`, włączając walidację `name` (wymagany string), `source_text_hash` (opcjonalny string), `source_text_length` (opcjonalny int, 1000-10000) i `generation_duration_ms` (opcjonalny int >= 0).
5.  **Walidacja ciała żądania**: Odczytaj ciało żądania (`await context.request.json()`) i zwaliduj je za pomocą `zodSchema.safeParse()`. W przypadku błędu zwróć `400` z `error.flatten()`.
6.  **Utworzenie/aktualizacja serwisu**:
    - Upewnij się, że istnieje plik `src/lib/services/flashcardSetService.ts`.
    - Zdefiniuj lub zaktualizuj klasę `FlashcardSetService`.
    - Dodaj metodę `async createSet(userId: string, data: CreateFlashcardSetCommand, supabase: SupabaseClient): Promise<{ data: FlashcardSetDto | null; error: PostgrestError | null }>` (dopasuj sygnaturę zwracaną do potrzeb, np. zwracając bezpośrednio DTO lub rzucając wyjątek).
7.  **Implementacja logiki serwisu**:
    - W metodzie `createSet` użyj przekazanego klienta `supabase`, aby wykonać `insert` do tabeli `flashcard_sets`.
    - Przekaż `user_id` oraz dane z `data` (`name`, `source_text_hash` itd.).
    - Zwróć wynik operacji `insert`, obsługując potencjalne błędy (szczególnie kod `23505` dla naruszenia unikalności).
8.  **Wywołanie serwisu z endpointu**: W handlerze `POST`, po pomyślnej walidacji, wywołaj `flashcardSetService.createSet(userId, validatedData, supabase)`.
9.  **Obsługa odpowiedzi serwisu**:
    - Sprawdź, czy wystąpił błąd w odpowiedzi z serwisu.
    - Jeśli błąd to naruszenie unikalności (`error?.code === '23505'`), zwróć `400` z odpowiednim komunikatem.
    - W przypadku innych błędów zwróć `500`.
    - Jeśli operacja się powiodła (`data` nie jest null), zwróć `201 Created` z `data` jako ciałem odpowiedzi.
10. **Testowanie**: Napisz testy jednostkowe dla logiki serwisu i testy integracyjne dla endpointu API, obejmujące scenariusze sukcesu i różne przypadki błędów (walidacja, uwierzytelnianie, unikalność, błędy serwera).
