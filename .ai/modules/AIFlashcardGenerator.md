# Kluczowe Funkcjonalności Komponentu `AIFlashcardGenerator.tsx`

1.  **Wprowadzanie i Walidacja Tekstu Źródłowego:**
    *   Umożliwia użytkownikom wprowadzanie tekstu (o długości od 1000 do 10000 znaków), który posłuży jako materiał źródłowy do generowania fiszek.
    *   Dostarcza komunikaty walidacyjne oraz licznik znaków w czasie rzeczywistym.

2.  **Generowanie Fiszek z Użyciem AI:**
    *   Po wprowadzeniu poprawnego tekstu, użytkownik może kliknąć przycisk "Generuj Fiszki".
    *   Akcja ta wywołuje żądanie API do `/api/ai/generate-flashcards`, przesyłając tekst źródłowy.
    *   Wyświetla stany ładowania oraz powiadomienia (tzw. "toasty") informujące o sukcesie lub błędzie generowania.
    *   Wygenerowane sugestie są przekształcane na model widoku (`FlashcardSuggestionItemVM`), który zawiera `id`, status `isAccepted` (czy zaakceptowano) oraz śledzi bieżącą i oryginalną treść awersu i rewersu fiszki.
    *   Wyświetla metadane dotyczące procesu generowania przez AI (użyty model, czas trwania, skrót (hash) tekstu źródłowego itp.).

3.  **Zarządzanie Sugestiami:**
    *   Wyświetla wygenerowane sugestie fiszek w formie siatki.
    *   Użytkownicy mogą:
        *   **Akceptować:** Oznaczyć sugestię jako zaakceptowaną.
        *   **Cofnąć akceptację:** Przywrócić zaakceptowaną sugestię do jej oryginalnego stanu i oznaczyć jako niezaakceptowaną.
        *   **Edytować:** Otwiera okno dialogowe (`EditFlashcardDialog`) do modyfikacji treści awersu i rewersu sugestii. Zapisanie edytowanej fiszki automatycznie oznacza ją jako zaakceptowaną.
        *   **Odrzucić:** Otwiera okno dialogowe z potwierdzeniem (`ConfirmRejectDialog`). Po potwierdzeniu, sugestia jest usuwana z listy.

4.  **Zapisywanie Zestawów Fiszek:**
    *   Oferuje dwie opcje zapisywania:
        *   **Zapisz Zaakceptowane:** Zapisuje tylko te fiszki, które zostały oznaczone jako `isAccepted`.
        *   **Zapisz Wszystkie:** Zapisuje wszystkie bieżące sugestie, niezależnie od ich statusu `isAccepted`.
    *   Obie opcje otwierają okno dialogowe `SaveSetDialog`, w którym użytkownik może nadać nazwę nowemu zestawowi fiszek.
    *   Proces zapisywania składa się z dwóch głównych kroków:
        1.  **Tworzenie Zestawu Fiszek:** Wysyła żądanie `POST` do `/api/flashcard-sets` w celu utworzenia nowego zestawu, potencjalnie dołączając metadane dotyczące generowania AI.
        2.  **Wsadowe Tworzenie Fiszek:** Jeśli zestaw zostanie pomyślnie utworzony i są fiszki do zapisania, wysyła żądanie `POST` do `/api/flashcard-sets/{setId}/flashcards/batch-create` w celu dodania wybranych fiszek do nowo utworzonego zestawu.
    *   Pole `source` (źródło) każdej fiszki jest ustawiane na `"ai_generated"` (wygenerowana przez AI) lub `"ai_generated_modified"` (wygenerowana przez AI i zmodyfikowana), w zależności od tego, czy była edytowana.
    *   Obsługuje błędy API podczas tworzenia zestawu lub wsadowego tworzenia fiszek, informując użytkownika za pomocą powiadomień i komunikatu o błędzie w oknie dialogowym zapisu.
    *   W przypadku pomyślnego zapisania, czyści wprowadzony tekst, sugestie oraz metadane generowania.
    *   Zawiera komentarz "TODO" wskazujący na potrzebę przekierowania do `/dashboard` po pomyślnym zapisaniu.

5.  **Interfejs Użytkownika (UI) i Doświadczenie Użytkownika (UX):**
    *   Używa biblioteki `sonner` do wyświetlania powiadomień (toastów).
    *   Zawiera przycisk "Wróć" (`ArrowLeftIcon`) umożliwiający nawigację do `/dashboard`.
    *   Wyświetla komunikaty warunkowe w zależności od stanu aplikacji (np. "Kliknij 'Generuj Fiszki', aby zobaczyć propozycje", "Nie znaleziono propozycji...").
    *   Zarządza różnymi stanami ładowania i widoczności okien dialogowych (np. `isLoadingSuggestions`, `isSavingSet`, `isEditDialogOpen`, `isSaveSetDialogOpen`).

6.  **Zarządzanie Stanem:**
    *   Szeroko wykorzystuje hooki `React.useState` i `React.useEffect` do zarządzania stanem komponentu (tekst źródłowy, sugestie, stany ładowania, widoczność okien dialogowych itp.).
    *   Używa hooka `React.useCallback` do memoizacji funkcji obsługi zdarzeń w celu optymalizacji wydajności.

7.  **Obsługa Błędów:**
    *   Przechwytuje błędy z wywołań API i wyświetla przyjazne dla użytkownika komunikaty.
    *   Rozróżnia błędy sieciowe od błędów zwróconych w treści odpowiedzi API.
    *   Podczas zapisywania, najpierw próbuje utworzyć zestaw, a następnie dodać fiszki. Jeśli tworzenie fiszek nie powiedzie się, tworzenie zestawu jest nadal uznawane za częściowy sukces, a użytkownik jest o tym informowany.

8.  **Typy Danych:**
    *   Wykorzystuje TypeScript i importuje różne obiekty transferu danych (DTO) oraz typy poleceń (command types) z `@/types` do interakcji z backendowym API.
    *   Definiuje lokalny model widoku `FlashcardSuggestionItemVM`, rozszerzając `FlashcardSuggestionDto`.

Komponent ten dostarcza kompleksowy interfejs, który umożliwia użytkownikom generowanie fiszek z tekstu za pomocą usługi AI, przeglądanie i edytowanie tych sugestii, a następnie zapisywanie ich w nowych zestawach fiszek. Obsługuje różne stany, interakcje użytkownika oraz potencjalne scenariusze błędów.
