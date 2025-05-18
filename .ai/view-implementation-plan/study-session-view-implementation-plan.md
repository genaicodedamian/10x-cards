# Plan implementacji widoku Sesji Nauki

## 1. Przegląd
Widok Sesji Nauki (`/study-session/:setId`) umożliwia zalogowanym użytkownikom interaktywną naukę fiszek z wybranego zestawu. Użytkownik przegląda fiszki jedna po drugiej, oceniając swoją znajomość. Fiszki ocenione jako "Nie umiem" są powtarzane w tej samej sesji, aż do ich opanowania. Po zakończeniu sesji (wszystkie fiszki opanowane), data ostatniej nauki zestawu jest aktualizowana. Widok ten ma na celu efektywne przyswajanie materiału zgodnie z prostym algorytmem powtórek.

## 2. Routing widoku
Widok będzie dostępny pod dynamiczną ścieżką:
*   `/study-session/:setId`
    *   gdzie `:setId` to identyfikator (UUID) zestawu fiszek.

Strona powinna być renderowana po stronie serwera (SSR) lub statycznie generowana z możliwością dynamicznego pobierania danych po stronie klienta (CSR) w Astro, z komponentem React do obsługi interaktywności sesji.

## 3. Struktura komponentów
Hierarchia komponentów dla widoku sesji nauki będzie następująca:

```
StudySessionPage (Astro layout + React component wrapper)
  └── StudySessionLoader (React) // Obsługuje ładowanie danych, stany błędów
      └── StudySessionView (React) // Główny komponent sesji
          ├── StudyFlashcard (React) // Wyświetla aktualną fiszkę (przód/tył)
          │   └── Card (Shadcn/ui) // Element bazowy dla fiszki
          ├── FlashcardRatingButtons (React) // Przyciski "Umiem" / "Nie umiem"
          │   ├── Button (Shadcn/ui)
          │   └── Button (Shadcn/ui)
          └── StudyCompletionSummary (React) // Wyświetlany po zakończeniu sesji
              ├── Button (Shadcn/ui) // Powrót do listy zestawów
              └── Button (Shadcn/ui) // Powrót do dashboardu
```

## 4. Szczegóły komponentów

### `StudySessionPage` (Astro / React Wrapper)
*   **Opis komponentu:** Komponent na poziomie strony Astro (`src/pages/study-session/[setId].astro`). Odpowiedzialny za:
    *   Pobranie parametru `:setId` z URL.
    *   Renderowanie głównego komponentu React (`StudySessionLoader` lub bezpośrednio `StudySessionView`), przekazując `setId`.
    *   Może zawierać podstawowy layout strony (np. TopBar, jeśli jest globalny).
*   **Główne elementy HTML:** Struktura strony Astro, kontener dla aplikacji React.
*   **Obsługiwane interakcje:** Brak bezpośrednich interakcji użytkownika.
*   **Obsługiwana walidacja:** Astro obsługuje routing dynamiczny; `setId` będzie dostępne jako prop.
*   **Typy:** `setId: string`.
*   **Propsy (dla komponentu React wewnątrz Astro):** `setId: string`.

### `StudySessionLoader` (React)
*   **Opis komponentu:** Komponent odpowiedzialny za pobieranie danych fiszek dla danego `setId` oraz danych zestawu (jeśli potrzebne, np. nazwa). Zarządza stanami ładowania i błędów przed rozpoczęciem sesji.
*   **Główne elementy HTML:**
    *   Komunikat ładowania (np. `Spinner` z Shadcn/ui).
    *   Komunikat błędu (np. "Nie udało się załadować sesji. Spróbuj ponownie.").
    *   Po pomyślnym załadowaniu renderuje `StudySessionView`.
*   **Obsługiwane interakcje:** Brak bezpośrednich; reaguje na wyniki wywołania API.
*   **Obsługiwana walidacja:** Sprawdza, czy dane zostały poprawnie załadowane.
*   **Typy:** `FlashcardDto[]`, `FlashcardSetDto` (opcjonalnie).
*   **Propsy:** `setId: string`.

### `StudySessionView` (React)
*   **Opis komponentu:** Główny komponent interfejsu sesji nauki. Zarządza logiką sesji, kolejnością fiszek, stanem odkrycia fiszki, pulami "do nauczenia" i "do powtórzenia". Renderuje aktualną fiszkę, przyciski oceny lub podsumowanie ukończenia.
*   **Główne elementy HTML:** Warunkowo renderuje `StudyFlashcard` i `FlashcardRatingButtons`, lub `StudyCompletionSummary`. Może zawierać licznik fiszek lub progres.
*   **Obsługiwane interakcje:** Logika zmiany fiszek, obsługa ocen.
*   **Obsługiwana walidacja:** Brak bezpośredniej; operuje na przekazanych danych.
*   **Typy:** `FlashcardDto` (dla `currentFlashcard`).
*   **Propsy:** `flashcards: FlashcardDto[]`, `flashcardSet: FlashcardSetDto` (opcjonalnie, jeśli potrzebna nazwa zestawu etc.), `setId: string` (do aktualizacji `last_studied_at`).

### `StudyFlashcard` (React)
*   **Opis komponentu:** Wyświetla pojedynczą fiszkę. Odpowiada za animację "obracania" między przodem a tyłem fiszki.
*   **Główne elementy HTML:**
    *   Kontener (np. `div` lub `Card` z Shadcn/ui) z odpowiednimi stylami do animacji.
    *   Element wyświetlający `flashcard.front`.
    *   Element wyświetlający `flashcard.back`.
*   **Obsługiwane interakcje:**
    *   `onClick`: Powoduje obrócenie fiszki (zmiana stanu `isFlipped`).
*   **Obsługiwana walidacja:** Brak.
*   **Typy:** `FlashcardDto`.
*   **Propsy:**
    *   `flashcard: FlashcardDto` (aktualna fiszka do wyświetlenia).
    *   `isFlipped: boolean` (czy fiszka jest odkryta).
    *   `onFlip: () => void` (funkcja wywoływana, aby zainicjować obrócenie - komponent sam zarządza swoim stanem `isFlipped` lub przyjmuje go z góry). Wg opisu widoku, komponent sam zarządza `isFlipped` po kliknięciu.

### `FlashcardRatingButtons` (React)
*   **Opis komponentu:** Wyświetla przyciski "Umiem" i "Nie umiem", które pozwalają użytkownikowi ocenić znajomość fiszki. Widoczne tylko, gdy fiszka jest odkryta.
*   **Główne elementy HTML:**
    *   `Button` (Shadcn/ui) z ikoną "check" (✓) i tekstem "Umiem".
    *   `Button` (Shadcn/ui) z ikoną "x" (✗) i tekstem "Nie umiem".
*   **Obsługiwane interakcje:**
    *   `onClick` na "Umiem": Wywołuje `onRateKnown`.
    *   `onClick` na "Nie umiem": Wywołuje `onRateUnknown`.
*   **Obsługiwana walidacja:** Przyciski mogą być `disabled` jeśli `!isFlipped` lub trwa przetwarzanie oceny.
*   **Typy:** Brak specyficznych DTO.
*   **Propsy:**
    *   `onRateKnown: () => void`.
    *   `onRateUnknown: () => void`.
    *   `disabled: boolean` (opcjonalnie, jeśli stan odkrycia fiszki nie jest zarządzany globalnie).

### `StudyCompletionSummary` (React)
*   **Opis komponentu:** Wyświetlany po pomyślnym ukończeniu wszystkich fiszek w sesji. Zawiera gratulacje i opcje nawigacji.
*   **Główne elementy HTML:**
    *   Tekst: "Gratulacje! Ukończyłeś naukę tego zestawu."
    *   `Button` (Shadcn/ui): "Wróć do Listy Zestawów" (link do `/my-flashcards`).
    *   `Button` (Shadcn/ui): "Wróć do Dashboardu" (link do `/dashboard`).
*   **Obsługiwane interakcje:**
    *   `onClick` na przyciskach nawigacyjnych: Przekierowuje użytkownika.
*   **Obsługiwana walidacja:** Brak.
*   **Typy:** Brak specyficznych DTO.
*   **Propsy:** Brak (nawigacja realizowana przez Astro `<a>` lub `Astro.redirect` wywołane przez funkcję).

## 5. Typy
Głównie będziemy korzystać z istniejących typów DTO, ale wprowadzimy jeden nowy typ dla polecenia aktualizacji i ewentualnie ViewModel dla lepszej organizacji danych w komponencie.

*   **`FlashcardDto` (z `src/types.ts`):**
    *   `id: string`
    *   `set_id: string`
    *   `user_id: string`
    *   `front: string`
    *   `back: string`
    *   `source: string`
    *   `created_at: string`
    *   `updated_at: string`
    Używany do reprezentowania każdej fiszki w sesji.

*   **`FlashcardSetDto` (z `src/types.ts`):**
    *   Używany do pobrania informacji o zestawie (np. nazwa, jeśli chcemy ją wyświetlić) oraz do aktualizacji pola `last_studied_at`. Kluczowe pola: `id`, `name`, `last_studied_at`.

*   **`PaginatedFlashcardsDto` (z `src/types.ts`):**
    *   `data: FlashcardDto[]`
    *   `pagination: PaginationInfoDto`
    Struktura odpowiedzi z endpointu `GET /api/flashcard-sets/{setId}/flashcards`.

*   **`UpdateFlashcardSetLastStudiedCommand` (nowy lub rozszerzenie istniejącego):**
    Należy rozszerzyć istniejący `UpdateFlashcardSetCommand` w `src/types.ts`:
    ```typescript
    // W src/types.ts
    export type UpdateFlashcardSetCommand = Partial<
      Pick<TablesUpdate<"flashcard_sets">, "name" | "last_studied_at"> // Dodano last_studied_at
    >;
    ```
    Oraz powiązany schemat Zod `UpdateFlashcardSetBodySchema` w `src/lib/schemas/flashcardSetSchemas.ts`:
    ```typescript
    // W src/lib/schemas/flashcardSetSchemas.ts
    export const UpdateFlashcardSetBodySchema = z.object({
      name: z.string().min(1).max(100).optional(),
      last_studied_at: z.string().datetime({ offset: true }).optional(), // ISO 8601 format
    }).refine(data => data.name !== undefined || data.last_studied_at !== undefined, {
      message: "At least one field (name or last_studied_at) must be provided for update.",
    });
    ```

## 6. Zarządzanie stanem
Zarządzanie stanem sesji nauki będzie kluczowe i zostanie zaimplementowane w komponencie `StudySessionView` (lub wyciągnięte do customowego hooka `useStudySession`). Stan będzie obejmował:

*   **`allFlashcards: FlashcardDto[]`**: Lista wszystkich fiszek pobranych dla zestawu.
*   **`toLearnQueue: FlashcardDto[]`**: Kolejka fiszek do nauczenia w bieżącym cyklu.
*   **`toRepeatQueue: FlashcardDto[]`**: Kolejka fiszek, które zostały ocenione jako "Nie umiem" i wymagają powtórzenia w tej sesji.
*   **`currentFlashcard: FlashcardDto | null`**: Aktualnie wyświetlana fiszka.
*   **`isFlipped: boolean`**: Czy aktualna fiszka jest odwrócona (pokazuje tył).
*   **`isSessionCompleted: boolean`**: Flaga informująca, czy sesja została zakończona.
*   **`isLoading: boolean`**: Stan ładowania fiszek z API (zarządzany w `StudySessionLoader`).
*   **`error: string | null`**: Komunikat błędu (zarządzany w `StudySessionLoader`).
*   **`isSubmittingRating: boolean`**: Flaga zapobiegająca wielokrotnemu klikaniu przycisków oceny.

**Logika algorytmu powtórek:**
1.  Na początku `toLearnQueue` jest wypełniana wszystkimi fiszkami z `allFlashcards`. `toRepeatQueue` jest pusta.
2.  `currentFlashcard` jest pierwszą fiszką z `toLearnQueue`.
3.  Po ocenie:
    *   **"Umiem"**: Fiszka jest usuwana z `toLearnQueue`.
    *   **"Nie umiem"**: Fiszka jest usuwana z `toLearnQueue` i dodawana na koniec `toRepeatQueue`.
4.  Po usunięciu fiszki z `toLearnQueue`, następna fiszka z tej kolejki staje się `currentFlashcard`.
5.  Jeśli `toLearnQueue` staje się pusta:
    *   Jeśli `toRepeatQueue` również jest pusta, sesja jest zakończona (`isSessionCompleted = true`).
    *   Jeśli `toRepeatQueue` nie jest pusta, wszystkie fiszki z `toRepeatQueue` są przenoszone do `toLearnQueue`, `toRepeatQueue` jest czyszczona, a pierwsza fiszka z nowej `toLearnQueue` staje się `currentFlashcard`. Proces się powtarza.

**Custom Hook `useStudySession` (rekomendowany):**
Aby zachować czystość komponentu `StudySessionView`, cała powyższa logika, wraz z obsługą API do aktualizacji `last_studied_at`, powinna być enkapsulowana w hooku `src/components/hooks/useStudySession.ts`. Hook ten przyjmowałby `flashcards: FlashcardDto[]` i `setId: string` jako argumenty.

## 7. Integracja API

*   **Pobieranie fiszek:**
    *   **Endpoint:** `GET /api/flashcard-sets/{setId}/flashcards`
    *   **Wywołanie:** Przy montowaniu komponentu `StudySessionLoader`, używając `setId` z URL.
    *   **Parametry zapytania:** Dla sesji nauki zaleca się pobranie wszystkich fiszek od razu. Można ustawić `limit` na dużą wartość (np. 1000, zakładając, że zestawy nie będą większe) lub jeśli API pozwala, pominąć `limit`.
    *   **Typ żądania (Query Params):** `?limit=1000` (przykładowo)
    *   **Typ odpowiedzi (Sukces 200):** `PaginatedFlashcardsDto` (interesuje nas `data: FlashcardDto[]`).
    *   **Obsługa:**
        *   Sukces: Przekazanie `FlashcardDto[]` do `StudySessionView`.
        *   Błąd: Wyświetlenie komunikatu błędu.

*   **Aktualizacja daty ostatniej sesji nauki:**
    *   **Endpoint:** `PUT /api/flashcard-sets/{setId}`
    *   **Wywołanie:** Po pomyślnym zakończeniu sesji (`isSessionCompleted = true`).
    *   **Typ żądania (Body):** `UpdateFlashcardSetCommand` z polem `last_studied_at` ustawionym na aktualny czas UTC w formacie ISO 8601.
        ```json
        {
          "last_studied_at": "2023-10-27T10:30:00.000Z"
        }
        ```
    *   **Typ odpowiedzi (Sukces 200):** Zaktualizowany `FlashcardSetDto`.
    *   **Obsługa:**
        *   Sukces: Cicha obsługa (nie ma potrzeby informowania użytkownika).
        *   Błąd: Logowanie błędu w konsoli. Nie powinno to blokować interfejsu użytkownika, który już wyświetla ekran ukończenia.

## 8. Interakcje użytkownika

*   **Wejście na stronę:**
    *   Użytkownik jest przekierowywany na `/study-session/:setId`.
    *   Wyświetlany jest stan ładowania.
    *   Po załadowaniu danych, wyświetlany jest przód pierwszej fiszki.
*   **Kliknięcie na fiszkę (zakrytą):**
    *   Fiszka animuje obrót, odsłaniając tył.
    *   Przyciski oceny ("Umiem", "Nie umiem") stają się aktywne.
*   **Kliknięcie przycisku "Umiem":**
    *   Aktualna fiszka jest uznawana za nauczoną.
    *   Następuje przejście do kolejnej fiszki (zgodnie z logiką opisaną w "Zarządzanie stanem").
    *   Fiszka jest zakrywana (pokazuje przód).
    *   Przyciski oceny są dezaktywowane do momentu odkrycia nowej fiszki.
*   **Kliknięcie przycisku "Nie umiem":**
    *   Aktualna fiszka jest dodawana do puli do powtórzenia.
    *   Następuje przejście do kolejnej fiszki.
    *   Fiszka jest zakrywana.
    *   Przyciski oceny są dezaktywowane.
*   **Zakończenie sesji:**
    *   Gdy wszystkie fiszki zostaną oznaczone jako "Umiem", wyświetlany jest `StudyCompletionSummary`.
    *   Komunikat: "Gratulacje! Ukończyłeś naukę tego zestawu."
    *   Dostępne są przyciski: "Wróć do Listy Zestawów" i "Wróć do Dashboardu".
*   **Kliknięcie przycisku "Wróć do Listy Zestawów":**
    *   Przekierowanie na `/my-flashcards`.
*   **Kliknięcie przycisku "Wróć do Dashboardu":**
    *   Przekierowanie na `/dashboard`.
*   **Brak możliwości opuszczenia sesji:** W trakcie trwania sesji (przed `isSessionCompleted = true`) nie ma w interfejsie użytkownika opcji przerwania lub wyjścia z sesji.

## 9. Warunki i walidacja

*   **Routing:** `setId` w URL musi być poprawnym UUID (Astro router).
*   **Pobieranie danych:**
    *   `StudySessionLoader` sprawdza, czy `setId` jest prawidłowe i czy udało się pobrać dane.
    *   Jeśli zestaw nie istnieje lub nie należy do użytkownika, API zwróci 404, co `StudySessionLoader` obsłuży, wyświetlając błąd.
    *   Jeśli zestaw jest pusty (brak fiszek), `StudySessionView` powinien to obsłużyć, np. od razu pokazując `StudyCompletionSummary` z odpowiednim komunikatem.
*   **Przyciski oceny:**
    *   Aktywne tylko wtedy, gdy `isFlipped` jest `true`.
    *   Mogą być dezaktywowane na czas przetwarzania oceny (`isSubmittingRating = true`).
*   **Animacja:** Płynna, nie blokująca, dostępna.

## 10. Obsługa błędów

*   **Błąd ładowania fiszek (API `GET` zwraca błąd 4xx/5xx):**
    *   `StudySessionLoader` wyświetla komunikat błędu, np. "Wystąpił błąd podczas ładowania fiszek. Spróbuj ponownie później." oraz przycisk(i) umożliwiający powrót (np. do `/my-flashcards`).
*   **Zestaw nie znaleziony lub brak dostępu (API `GET` zwraca 404):**
    *   `StudySessionLoader` wyświetla komunikat, np. "Nie znaleziono zestawu fiszek lub nie masz do niego dostępu." oraz przycisk(i) powrotu.
*   **Pusty zestaw fiszek (API `GET` zwraca `data: []`):**
    *   `StudySessionView` powinien to wykryć. Może od razu ustawić `isSessionCompleted = true` i wyświetlić `StudyCompletionSummary` z komunikatem "Ten zestaw nie zawiera żadnych fiszek do nauki."
*   **Błąd aktualizacji `last_studied_at` (API `PUT` zwraca błąd):**
    *   Błąd jest logowany w konsoli deweloperskiej.
    *   Nie jest wyświetlany użytkownikowi, ponieważ sesja z jego perspektywy została już ukończona. Jest to działanie typu "best-effort".
*   **Utrata stanu sesji (np. odświeżenie strony):**
    *   Dla MVP stan sesji nie jest persystowany (np. w `localStorage`). Odświeżenie strony spowoduje rozpoczęcie sesji od nowa. Użytkownik jest informowany w PRD, że nie może opuścić sesji.

## 11. Kroki implementacji

1.  **Aktualizacja typów i schematów:**
    *   Zmodyfikuj `UpdateFlashcardSetCommand` w `src/types.ts`, dodając opcjonalne pole `last_studied_at?: string`.
    *   Zmodyfikuj `UpdateFlashcardSetBodySchema` w `src/lib/schemas/flashcardSetSchemas.ts`, dodając walidację dla `last_studied_at` (np. `z.string().datetime({ offset: true }).optional()`) i dostosuj `.refine`, aby przynajmniej jedno pole było wymagane do aktualizacji.
    *   Zmodyfikuj endpoint `PUT /api/flashcard-sets/[setId].ts` (`src/pages/api/flashcard-sets/[setId].ts`), aby obsługiwał aktualizację `last_studied_at` poprzez `flashcardSetService`.
    *   Zmodyfikuj `flashcardSetService.updateFlashcardSet` (`src/lib/services/flashcardSetService.ts`), aby przekazywał `last_studied_at` do zapytania Supabase.

2.  **Utworzenie struktury plików:**
    *   Strona Astro: `src/pages/study-session/[setId].astro`.
    *   Komponenty React:
        *   `src/components/study/StudySessionLoader.tsx`
        *   `src/components/study/StudySessionView.tsx`
        *   `src/components/study/StudyFlashcard.tsx`
        *   `src/components/study/FlashcardRatingButtons.tsx`
        *   `src/components/study/StudyCompletionSummary.tsx`
    *   Custom hook (opcjonalnie, ale zalecane): `src/components/hooks/useStudySession.ts`.

3.  **Implementacja `StudySessionPage` (`[setId].astro`):**
    *   Pobranie `setId` z `Astro.params`.
    *   Renderowanie komponentu `StudySessionLoader` (jako `<StudySessionLoader client:load setId={setId} />`).

4.  **Implementacja `StudySessionLoader.tsx`:**
    *   Stan: `isLoading`, `error`, `flashcardsData: FlashcardDto[] | null`, `flashcardSetData: FlashcardSetDto | null`.
    *   `useEffect` do pobrania danych (`GET /api/flashcard-sets/{setId}/flashcards` oraz ewentualnie `GET /api/flashcard-sets/{setId}` dla nazwy zestawu).
    *   Warunkowe renderowanie: loader, komunikat błędu, lub `StudySessionView` z przekazanymi danymi.

5.  **Implementacja `useStudySession.ts` (lub logiki w `StudySessionView.tsx`):**
    *   Implementacja całej logiki zarządzania stanem sesji (kolejki `toLearnQueue`, `toRepeatQueue`, `currentFlashcard`, `isFlipped`, `isSessionCompleted`).
    *   Funkcje do obsługi: `flipCard()`, `rateKnown()`, `rateUnknown()`.
    *   Funkcja do wywołania API `PUT /api/flashcard-sets/{setId}` po zakończeniu sesji.

6.  **Implementacja `StudySessionView.tsx`:**
    *   Użycie hooka `useStudySession` (lub implementacja logiki stanu bezpośrednio).
    *   Warunkowe renderowanie `StudyFlashcard` i `FlashcardRatingButtons` (gdy `!isSessionCompleted`) lub `StudyCompletionSummary` (gdy `isSessionCompleted`).

7.  **Implementacja `StudyFlashcard.tsx`:**
    *   Przyjęcie propsów `flashcard`, `isFlipped`, `onFlip`.
    *   Wyświetlanie przodu/tyłu fiszki.
    *   Implementacja animacji obracania (CSS lub Framer Motion).
    *   Obsługa `onClick` do wywołania `onFlip`.

8.  **Implementacja `FlashcardRatingButtons.tsx`:**
    *   Przyjęcie propsów `onRateKnown`, `onRateUnknown`, `disabled`.
    *   Renderowanie przycisków z ikonami i tekstem.
    *   Podpięcie funkcji `onClick`.

9.  **Implementacja `StudyCompletionSummary.tsx`:**
    *   Wyświetlanie komunikatu gratulacyjnego.
    *   Renderowanie przycisków nawigacyjnych (linki Astro).

10. **Styling:**
    *   Użycie Tailwind CSS i komponentów Shadcn/ui do ostylowania wszystkich elementów zgodnie z UI planem.

11. **Testowanie:**
    *   Manualne testowanie wszystkich scenariuszy interakcji, przypadków brzegowych (pusty zestaw, błędy API).
    *   Sprawdzenie responsywności i dostępności.

12. **Refaktoryzacja i czyszczenie kodu:**
    *   Upewnienie się, że kod jest czysty, dobrze skomentowany (tam gdzie to potrzebne) i zgodny z wytycznymi projektu.

Pamiętać o `export const prerender = false;` w plikach API Astro oraz o stosowaniu się do wytycznych z `react.md`, `backend.mdc`, `astro.mdc`.
Używać `supabaseClient` z `context.locals.supabase` w endpointach API, a nie bezpośredniego importu (zgodnie z regułą `backend.md`).
Jeśli na froncie potrzebny jest klient Supabase (np. do subskrypcji, choć tu nie jest to wymagane), użyć `createBrowserClient` z `@supabase/ssr` (zgodnie z `src/lib/supabaseClient.ts`).
W tym przypadku jednak cała komunikacja z Supabase odbywa się przez backendowe API Astro.
