# Architektura UI dla 10x-cards

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) dla aplikacji 10x-cards MVP została zaprojektowana z myślą o prostocie, intuicyjności i efektywności. Dla niezalogowanych użytkowników, pierwszym punktem kontaktu jest **Ekran Startowy (Landing Page)**, który wita użytkownika i oferuje proste opcje logowania lub rejestracji. Po zalogowaniu, centralnym punktem aplikacji jest **Dashboard**, który zapewnia łatwy dostęp do trzech kluczowych funkcjonalności: generowania fiszek za pomocą sztucznej inteligencji, manualnego tworzenia fiszek oraz przeglądania i zarządzania własnymi zestawami fiszek.

Nawigacja opiera się na stałym górnym pasku (Top Bar) zrealizowanym przy użyciu komponentu `NavigationMenu` z biblioteki Shadcn/ui, który zawiera link do Dashboardu oraz menu użytkownika z opcjami dostępu do panelu użytkownika (wylogowanie, usunięcie konta).

Aplikacja będzie składać się z kilku głównych widoków:
*   Ekrany uwierzytelniania (Logowanie, Rejestracja).
*   Dashboard jako główny ekran nawigacyjny.
*   Dwa dedykowane ekrany do tworzenia fiszek: jeden dla generacji AI, drugi dla tworzenia manualnego.
*   Widok zarządzania zestawami fiszek ("Moje zestawy fiszek").
*   Widok sesji nauki.

Interfejs będzie responsywny, wykorzystując Tailwind CSS i predefiniowane komponenty z Shadcn/ui, z dbałością o standardy dostępności (WCAG AA). Zarządzanie stanem po stronie klienta będzie realizowane za pomocą biblioteki Zustand, w uproszczonej formie dla potrzeb MVP. Interakcje z backendem będą odbywać się poprzez zdefiniowane API, a dane będą zapisywane tylko po jawnej akcji użytkownika.

## 2. Lista widoków

### 0. Ekran Startowy (Landing Page)
*   **Nazwa widoku**: Ekran Startowy (Landing Page)
*   **Ścieżka widoku**: `/` (root)
*   **Główny cel**: Przywitanie niezalogowanego użytkownika i skierowanie go do logowania lub rejestracji.
*   **Kluczowe informacje do wyświetlenia**: Nazwa aplikacji, przyciski akcji.
*   **Kluczowe komponenty widoku**:
    *   Duży, centralnie umieszczony tekst z nazwą aplikacji (np. "10x-cards").
    *   `Button` (Shadcn/ui): "Zaloguj się" (prowadzący do `/login`).
    *   `Button` (Shadcn/ui): "Zarejestruj się" (prowadzący do `/register`).
*   **UX, dostępność i względy bezpieczeństwa**:
    *   UX: Minimalistyczny, jasny cel, łatwa nawigacja do kluczowych akcji dla nowych/powracających użytkowników.
    *   Dostępność: Wysoki kontrast, czytelna czcionka, przyciski dostępne z klawiatury i odpowiednio opisane.
    *   Bezpieczeństwo: Strona statyczna, brak obsługi danych wrażliwych.

### 1. Widok Logowania
*   **Nazwa widoku**: Logowanie
*   **Ścieżka widoku**: `/login`
*   **Główny cel**: Umożliwienie zalogowania się zarejestrowanego użytkownika.
*   **Kluczowe informacje do wyświetlenia**: Formularz logowania.
*   **Kluczowe komponenty widoku**:
    *   `Card` (Shadcn/ui): Opakowanie formularza.
    *   `Label` (Shadcn/ui): Etykiety pól.
    *   `Input` (Shadcn/ui): Pola na adres e-mail i hasło.
    *   `Button` (Shadcn/ui): Przycisk "Zaloguj się".
    *   Link tekstowy: "Nie masz konta? Zarejestruj się".
    *   Komunikaty o błędach walidacji lub logowania.
*   **UX, dostępność i względy bezpieczeństwa**:
    *   UX: Prosty i klarowny formularz. Walidacja po stronie klienta dla formatu e-mail i wymaganych pól.
    *   Dostępność: Poprawne etykietowanie pól (`aria-labelledby`), obsługa focusu klawiatury.
    *   Bezpieczeństwo: Hasło przesyłane bezpiecznie (HTTPS).

### 2. Widok Rejestracji
*   **Nazwa widoku**: Rejestracja
*   **Ścieżka widoku**: `/register`
*   **Główny cel**: Umożliwienie nowym użytkownikom założenia konta.
*   **Kluczowe informacje do wyświetlenia**: Formularz rejestracji.
*   **Kluczowe komponenty widoku**:
    *   `Card` (Shadcn/ui): Opakowanie formularza.
    *   `Label` (Shadcn/ui): Etykiety pól.
    *   `Input` (Shadcn/ui): Pola na adres e-mail, hasło, potwierdzenie hasła.
    *   `Button` (Shadcn/ui): Przycisk "Zarejestruj się".
    *   Link tekstowy: "Masz już konto? Zaloguj się".
    *   Komunikaty o błędach walidacji.
*   **UX, dostępność i względy bezpieczeństwa**:
    *   UX: Prosty formularz. Walidacja po stronie klienta (format e-mail, siła hasła - opcjonalnie w MVP, zgodność haseł).
    *   Dostępność: Poprawne etykietowanie pól, obsługa focusu.
    *   Bezpieczeństwo: Hasło przesyłane bezpiecznie.

### 3. Dashboard
*   **Nazwa widoku**: Dashboard (Panel Główny)
*   **Ścieżka widoku**: `/dashboard`
*   **Główny cel**: Centralny punkt nawigacyjny aplikacji po zalogowaniu.
*   **Kluczowe informacje do wyświetlenia**: Główne opcje nawigacyjne.
*   **Kluczowe komponenty widoku**:
    *   Trzy duże, klikalne elementy (np. `Button` lub `Card` z Shadcn/ui) prowadzące do:
        *   "Generuj fiszki z AI" (`/generate-ai`)
        *   "Stwórz fiszki manualnie" (`/create-manual`)
        *   "Moje zestawy fiszek" (`/my-flashcards`)
    *   `Sonner` (Shadcn/ui) lub podobny komponent do wyświetlania powiadomień "toast" (np. po pomyślnym utworzeniu zestawu).
*   **UX, dostępność i względy bezpieczeństwa**:
    *   UX: Prosty, przejrzysty układ z wyraźnymi opcjami.
    *   Dostępność: Elementy nawigacyjne dostępne z klawiatury i poprawnie opisane dla czytników ekranu.
    *   Bezpieczeństwo: Dostępny tylko dla zalogowanych użytkowników.

### 4. Widok Generowania Fiszki AI
*   **Nazwa widoku**: Generuj Fiszki AI
*   **Ścieżka widoku**: `/generate-ai`
*   **Główny cel**: Umożliwienie użytkownikowi wygenerowania propozycji fiszek na podstawie dostarczonego tekstu i zapisania ich jako nowy zestaw.
*   **Kluczowe informacje do wyświetlenia**: Pole do wprowadzenia tekstu, wygenerowane sugestie fiszek.
*   **Kluczowe komponenty widoku**:
    *   Nagłówek H1: "Generate Flashcards".
    *   `Textarea` (Shadcn/ui): Pole na tekst źródłowy (min. 1000, max. 10000 znaków).
    *   `Label` lub `span` (Shadcn/ui): Wyświetlanie licznika znaków (`aktualne/maksymalne`) i komunikatów walidacji długości tekstu.
    *   `Button` (Shadcn/ui): "Generate Flashcards" (dezaktywowany, jeśli tekst nie spełnia kryteriów długości).
    *   Siatka (CSS Grid/Flexbox): Wyświetlanie wygenerowanych sugestii fiszek (do 3 kolumn).
    *   Komponent `FlashcardDisplay` (reużywalny, oparty na `Card` z Shadcn/ui) dla każdej sugestii, wyświetlający:
        *   Przód fiszki.
        *   Tył fiszki.
        *   Trzy przyciski-ikony (`Button` z Shadcn/ui):
            *   "Akceptuj" (ikona ✓): Wizualnie oznacza fiszkę do zapisu.
            *   "Edytuj" (ikona ✎): Otwiera modal edycji.
            *   "Odrzuć" (ikona ✗): Usuwa sugestię z listy.
        *   Wizualne rozróżnienie dla fiszek z `validation_status: 'truncated'` lub `'rejected'` (np. inne tło).
        *   `Tooltip` (Shadcn/ui): Wyświetlanie `validation_message` po najechaniu na fiszkę z problemem.
    *   `Button` (Shadcn/ui): "Save accepted" (aktywny, gdy są zaakceptowane fiszki).
    *   `Button` (Shadcn/ui): "Save all" (aktywny, gdy są jakiekolwiek sugestie).
    *   `Dialog` (Shadcn/ui): Modal do edycji pojedynczej fiszki (pola `Input` na przód i tył, przycisk "Zapisz zmiany").
    *   `Dialog` (Shadcn/ui): Modal do nadania nazwy nowemu zestawowi (pole `Input` na nazwę - max 100 znaków, wymagane; przycisk "Zapisz zestaw").
*   **UX, dostępność i względy bezpieczeństwa**:
    *   UX: Klarowny proces od wklejenia tekstu do zapisu zestawu. Natychmiastowa informacja zwrotna (walidacja, licznik znaków). Możliwość łatwej edycji i selekcji sugestii.
    *   Dostępność: Wszystkie interaktywne elementy dostępne z klawiatury. Ikony-przyciski z `aria-label`. Modale poprawnie zarządzające focusem.
    *   Bezpieczeństwo: Treść tekstu przesyłana do API.

### 5. Widok Manualnego Tworzenia Fiszki
*   **Nazwa widoku**: Stwórz Fiszki Manualnie
*   **Ścieżka widoku**: `/create-manual`
*   **Główny cel**: Umożliwienie użytkownikowi ręcznego tworzenia fiszek i zapisania ich jako nowy zestaw.
*   **Kluczowe informacje do wyświetlenia**: Formularz dodawania fiszki, lista tymczasowo dodanych fiszek.
*   **Kluczowe komponenty widoku**:
    *   `Button` (Shadcn/ui): "+ Stwórz nową fiszkę".
    *   `Dialog` (Shadcn/ui): Modal do tworzenia/edycji pojedynczej fiszki:
        *   `Input` (Shadcn/ui): Pole na "Przód".
        *   `Input` (Shadcn/ui): Pole na "Tył".
        *   `Button` (Shadcn/ui): "Zapisz fiszkę" (w modalu, dodaje do tymczasowej listy) lub "Zapisz zmiany".
    *   Siatka (CSS Grid/Flexbox): Wyświetlanie tymczasowo dodanych fiszek.
    *   Komponent `FlashcardDisplay` (reużywalny) dla każdej dodanej fiszki, wyświetlający:
        *   Przód fiszki.
        *   Tył fiszki.
        *   Dwa przyciski-ikony (`Button` z Shadcn/ui):
            *   "Edytuj" (ikona ✎): Otwiera modal edycji z danymi fiszki.
            *   "Usuń" (ikona ✗): Usuwa fiszkę z tymczasowej listy.
    *   `Button` (Shadcn/ui): "Zapisz zestaw fiszek" (pod listą, aktywny, gdy są dodane fiszki).
    *   `Dialog` (Shadcn/ui): Modal do nadania nazwy nowemu zestawowi (jak w `/generate-ai`).
*   **UX, dostępność i względy bezpieczeństwa**:
    *   UX: Prosty proces dodawania wielu fiszek przed finalnym zapisem zestawu. Możliwość edycji i usuwania przed zapisem.
    *   Dostępność: Wszystkie interaktywne elementy dostępne z klawiatury. Ikony-przyciski z `aria-label`. Modale poprawnie zarządzające focusem.
    *   Bezpieczeństwo: Dane przechowywane tymczasowo w stanie klienta przed wysłaniem do API.

### 6. Widok Moje Zestawy Fiszki
*   **Nazwa widoku**: Moje Zestawy Fiszki
*   **Ścieżka widoku**: `/my-flashcards`
*   **Główny cel**: Wyświetlenie listy wszystkich zestawów fiszek użytkownika, umożliwienie rozpoczęcia nauki lub usunięcia zestawu.
*   **Kluczowe informacje do wyświetlenia**: Lista zestawów z podstawowymi informacjami i akcjami.
*   **Kluczowe komponenty widoku**:
    *   Lista lub siatka zestawów (np. każda pozycja jako `Card` z Shadcn/ui).
    *   Dla każdego zestawu:
        *   `CardTitle` (Shadcn/ui): Nazwa zestawu.
        *   `CardDescription` lub tekst: Liczba fiszek w zestawie, data utworzenia/modyfikacji.
        *   `Button` (Shadcn/ui): "Rozpocznij naukę".
        *   `Button` (Shadcn/ui, wariant ikony): "Usuń zestaw" (ikona 🗑️).
    *   `AlertDialog` (Shadcn/ui): Modal potwierdzający usunięcie zestawu.
    *   Komunikat: "Nie masz jeszcze żadnych zestawów..." jeśli lista jest pusta.
*   **UX, dostępność i względy bezpieczeństwa**:
    *   UX: Przejrzysta lista z łatwym dostępem do akcji. Potwierdzenie krytycznej akcji (usuwanie).
    *   Dostępność: Elementy listy i przyciski dostępne z klawiatury, poprawnie opisane.
    *   Bezpieczeństwo: Wyświetla tylko zestawy zalogowanego użytkownika (RLS w bazie).

### 7. Widok Sesji Nauki
*   **Nazwa widoku**: Sesja Nauki
*   **Ścieżka widoku**: `/study-session/:setId` (gdzie `:setId` to ID zestawu)
*   **Główny cel**: Przeprowadzenie użytkownika przez sesję nauki dla wybranego zestawu fiszek, zgodnie z prostym algorytmem powtórek.
*   **Kluczowe informacje do wyświetlenia**: Aktualna fiszka (przód/tył), przyciski oceny.
*   **Kluczowe komponenty widoku**:
    *   Duży, centralny element (np. `Card` z Shadcn/ui) do wyświetlania aktualnej fiszki:
        *   Dynamiczne wyświetlanie przodu fiszki.
        *   Po kliknięciu (lub innej interakcji) – odkrywanie tyłu fiszki.
    *   Dwa `Button` (Shadcn/ui) pod fiszką (po odkryciu tyłu):
        *   Zielony przycisk: "Umiem" / "Poprawnie".
        *   Czerwony przycisk: "Nie umiem" / "Powtórz".
    *   Logika stanu fiszek w sesji (zarządzana w stanie komponentu React/Zustand):
        *   Początkowo wszystkie fiszki z zestawu są w puli "do nauczenia".
        *   Kliknięcie zielonego przycisku ("Umiem"): Fiszka jest uznawana za nauczoną w tej sesji i nie będzie więcej pokazywana.
        *   Kliknięcie czerwonego przycisku ("Nie umiem"): Fiszka jest dodawana do tymczasowej puli "do powtórzenia" w ramach bieżącej sesji.
        *   Po przejściu wszystkich fiszek z początkowej puli "do nauczenia", jeśli pula "do powtórzenia" nie jest pusta, fiszki z puli "do powtórzenia" stają się nową pulą "do nauczenia", a pula "do powtórzenia" jest czyszczona. Proces się powtarza.
        *   Sesja kończy się, gdy wszystkie fiszki z pierwotnego zestawu zostaną oznaczone zielonym przyciskiem (tj. nie ma już kart w puli "do nauczenia" ani "do powtórzenia").
    *   Po zakończeniu sesji:
        *   Prosty tekstowy komunikat: "Gratulacje! Ukończyłeś naukę tego zestawu."
        *   `Button` (Shadcn/ui): "Wróć do Dashboardu".
*   **UX, dostępność i względy bezpieczeństwa**:
    *   UX: Skupienie na jednej fiszce naraz. Jasne przyciski akcji. Płynne przejścia między fiszkami. Brak możliwości przerwania sesji (zgodnie z decyzją MVP).
    *   Dostępność: Czytelna czcionka. Przyciski dostępne z klawiatury i odpowiednio opisane. Interakcja odkrywania fiszki dostępna również z klawiatury.
    *   Bezpieczeństwo: Dostęp do fiszek tylko z wybranego zestawu należącego do użytkownika.

### 8. Panel Użytkownika
*   **Nazwa widoku**: Panel Użytkownika (może być częścią Top Baru jako DropdownMenu)
*   **Ścieżka widoku**: Brak bezpośredniej ścieżki, element nawigacji.
*   **Główny cel**: Umożliwienie użytkownikowi wylogowania się i usunięcia konta.
*   **Kluczowe informacje do wyświetlenia**: Opcje akcji.
*   **Kluczowe komponenty widoku**:
    *   `DropdownMenu` (Shadcn/ui) lub podobny, jeśli zintegrowany z Top Barem.
    *   `DropdownMenuItem` lub `Button` (Shadcn/ui): "Wyloguj".
    *   `DropdownMenuItem` lub `Button` (Shadcn/ui): "Usuń konto".
    *   `AlertDialog` (Shadcn/ui): Modal potwierdzający usunięcie konta.
*   **UX, dostępność i względy bezpieczeństwa**:
    *   UX: Łatwy dostęp do kluczowych akcji związanych z kontem. Potwierdzenie usunięcia konta.
    *   Dostępność: Menu i przyciski dostępne z klawiatury.
    *   Bezpieczeństwo: Krytyczna operacja usunięcia konta zabezpieczona potwierdzeniem.

## 3. Mapa podróży użytkownika

0.  **Pierwsze wejście do aplikacji (niezalogowany użytkownik)**:
    *   Użytkownik trafia na `/` (Ekran Startowy).
    *   Na Ekranie Startowym widzi nazwę aplikacji oraz przyciski "Zaloguj się" i "Zarejestruj się".
    *   Klika "Zaloguj się" -> Przejście na `/login`.
    *   LUB Klika "Zarejestruj się" -> Przejście na `/register`.

1.  **Rejestracja i pierwsze logowanie**:
    *   Użytkownik trafia na `/login` lub `/register` (np. z Ekranu Startowego).
    *   `/register`: Wypełnia formularz -> Klik "Zarejestruj się" -> Sukces -> Przekierowanie na `/dashboard`.
    *   `/login`: Wypełnia formularz -> Klik "Zaloguj się" -> Sukces -> Przekierowanie na `/dashboard`.

2.  **Tworzenie zestawu fiszek za pomocą AI**:
    *   Użytkownik na `/dashboard` -> Klik "Generuj fiszki z AI" -> Przejście na `/generate-ai`.
    *   Na `/generate-ai`: Wpisuje tekst w `Textarea` -> Klik "Generate Flashcards".
    *   Aplikacja wyświetla listę sugestii fiszek (komponenty `FlashcardDisplay`).
    *   Użytkownik przegląda, używa ikon "Akceptuj", "Edytuj" (otwiera modal, zapisuje zmiany w modalu), "Odrzuć" na poszczególnych fiszkach.
    *   Klika "Save accepted" lub "Save all".
    *   Otwiera się `Dialog` do wpisania nazwy zestawu -> Wpisuje nazwę -> Klik "Zapisz zestaw".
    *   Aplikacja wysyła dane do API (`POST /api/flashcard-sets` a następnie `POST /api/flashcard-sets/{setId}/flashcards/batch-create`).
    *   Sukces -> Przekierowanie na `/dashboard` + wyświetlenie `Sonner` (toast) "Zestaw '[Nazwa]' został utworzony".

3.  **Manualne tworzenie zestawu fiszek**:
    *   Użytkownik na `/dashboard` -> Klik "Stwórz fiszki manualnie" -> Przejście na `/create-manual`.
    *   Na `/create-manual`: Klik "+ Stwórz nową fiszkę".
    *   Otwiera się `Dialog` do wpisania przodu i tyłu -> Wpisuje dane -> Klik "Zapisz fiszkę".
    *   Fiszka pojawia się na tymczasowej liście na ekranie (jako `FlashcardDisplay` z ikonami "Edytuj", "Usuń").
    *   Użytkownik może dodać więcej fiszek lub edytować/usuwać istniejące na liście.
    *   Klika "Zapisz zestaw fiszek".
    *   Otwiera się `Dialog` do wpisania nazwy zestawu -> Wpisuje nazwę -> Klik "Zapisz zestaw".
    *   Aplikacja wysyła dane do API (jak wyżej, potencjalnie wiele wywołań `POST /api/flashcard-sets/{setId}/flashcards` lub jedno `batch-create`).
    *   Sukces -> Przekierowanie na `/dashboard` + wyświetlenie `Sonner` (toast).

4.  **Przeglądanie zestawów i rozpoczęcie nauki**:
    *   Użytkownik na `/dashboard` -> Klik "Moje zestawy fiszek" -> Przejście na `/my-flashcards`.
    *   Na `/my-flashcards`: Przegląda listę swoich zestawów.
    *   Znajduje interesujący zestaw -> Klik "Rozpocznij naukę" przy wybranym zestawie.
    *   Przejście na `/study-session/:setId`.

5.  **Sesja nauki**:
    *   Na `/study-session/:setId`: Wyświetla się przód pierwszej fiszki.
    *   Użytkownik klika na fiszkę, aby zobaczyć tył.
    *   Klika "Umiem" (zielony) lub "Nie umiem" (czerwony).
    *   Proces powtarza się dla wszystkich fiszek, z powtórkami "czerwonych" kart.
    *   Po oznaczeniu wszystkich fiszek jako "zielone" -> Wyświetla się komunikat "Gratulacje! Ukończyłeś naukę tego zestawu." oraz przycisk "Wróć do Dashboardu".
    *   Klik "Wróć do Dashboardu" -> Przejście na `/dashboard`.

6.  **Usuwanie zestawu fiszek**:
    *   Użytkownik na `/my-flashcards`.
    *   Znajduje zestaw do usunięcia -> Klik ikonę "Usuń zestaw".
    *   Otwiera się `AlertDialog` z potwierdzeniem -> Klik "Usuń".
    *   Aplikacja wysyła żądanie do API (`DELETE /api/flashcard-sets/{setId}`).
    *   Sukces -> Lista zestawów jest odświeżana (zestaw znika).

7.  **Wylogowanie / Usuwanie konta**:
    *   Użytkownik klika na swoje menu w Top Barze.
    *   Wybiera "Wyloguj" -> Przekierowanie na `/login`.
    *   LUB Wybiera "Usuń konto" -> Otwiera się `AlertDialog` z potwierdzeniem -> Klik "Usuń konto".
    *   Aplikacja wysyła żądanie do API (`DELETE /api/users/me`).
    *   Sukces -> Przekierowanie na `/register` lub `/login`.

## 4. Układ i struktura nawigacji

*   **Główny układ strony**: Wszystkie widoki będą renderowane w ramach głównego layoutu aplikacji (Astro layout). Ten layout będzie zawierał stały **Top Bar (Górny Pasek Nawigacyjny)**.
*   **Top Bar**:
    *   Zaimplementowany przy użyciu `NavigationMenu` z Shadcn/ui (lub prostszych elementów, jeśli `NavigationMenu` okaże się zbyt rozbudowany dla potrzeb MVP).
    *   **Dla użytkowników niezalogowanych** (np. na stronach `/`, `/login`, `/register`):
        *   Top Bar będzie minimalistyczny, wyświetlając głównie logo/nazwę aplikacji. Jeśli użytkownik jest na `/`, logo może nie być linkiem. Na `/login` i `/register` logo może linkować do `/` (Ekranu Startowego).
        *   Linki umożliwiające przełączanie między formularzem logowania a rejestracją będą znajdować się w głównej treści tych stron (np. "Nie masz konta? Zarejestruj się."), a nie w Top Barze.
    *   **Dla użytkowników zalogowanych**:
        *   Po lewej stronie: Logo/Nazwa aplikacji, które jest linkiem do `/dashboard`.
        *   Po prawej stronie: Menu użytkownika (np. ikona awatara) zrealizowane jako `DropdownMenu` (Shadcn/ui), zawierające bezpośrednie opcje:
            *   "Wyloguj"
            *   "Usuń konto"
*   **Nawigacja podstawowa**:
    *   Po zalogowaniu, użytkownik ląduje na `/dashboard`.
    *   Dashboard zawiera trzy główne przyciski/linki do kluczowych sekcji: `/generate-ai`, `/create-manual`, `/my-flashcards`.
    *   Z każdej z tych sekcji (oraz z `/study-session`) użytkownik może wrócić do `/dashboard` poprzez kliknięcie logo/nazwy aplikacji w Top Barze.
    *   Po zakończeniu sesji nauki, dedykowany przycisk "Wróć do Dashboardu" również prowadzi do `/dashboard`.
*   **Ścieżki (Routing)**:
    *   `/` - Ekran Startowy (Landing Page)
    *   `/login` - Logowanie
    *   `/register` - Rejestracja
    *   `/dashboard` - Panel główny
    *   `/generate-ai` - Generowanie fiszek AI
    *   `/create-manual` - Manualne tworzenie fiszek
    *   `/my-flashcards` - Lista zestawów fiszek
    *   `/study-session/:setId` - Sesja nauki dla konkretnego zestawu

## 5. Kluczowe komponenty

Poniżej lista kluczowych, potencjalnie reużywalnych komponentów, w większości opartych na Shadcn/ui:

1.  **`FlashcardDisplay` (Własny komponent React oparty na `Card` z Shadcn/ui)**:
    *   Opis: Wyświetla pojedynczą fiszkę z przodem, tyłem oraz konfigurowalnym zestawem przycisków-ikon akcji (Akceptuj, Edytuj, Odrzuć/Usuń).
    *   Używany w: `/generate-ai` (dla sugestii), `/create-manual` (dla tymczasowo dodanych fiszek).
2.  **`SetListItem` (Własny komponent React oparty na `Card` z Shadcn/ui)**:
    *   Opis: Wyświetla element listy zestawów na ekranie `/my-flashcards`, zawierający nazwę zestawu, liczbę kart, daty oraz przyciski akcji ("Rozpocznij naukę", "Usuń zestaw").
    *   Używany w: `/my-flashcards`.
3.  **`StudyFlashcard` (Własny komponent React oparty na `Card` z Shadcn/ui)**:
    *   Opis: Wyświetla aktualną fiszkę w sesji nauki, obsługuje logikę odkrywania tyłu i wyświetlania przycisków oceny.
    *   Używany w: `/study-session/:setId`.
4.  **`ActionModal` (Własny komponent React oparty na `Dialog` z Shadcn/ui)**:
    *   Opis: Generyczny modal używany do różnych akcji, np. edycji fiszki, nadawania nazwy zestawowi. Zawartość modala (pola formularza) będzie konfigurowalna.
    *   Używany w: `/generate-ai`, `/create-manual`.
5.  **`ConfirmationDialog` (Własny komponent React oparty na `AlertDialog` z Shadcn/ui)**:
    *   Opis: Modal do potwierdzania krytycznych akcji, takich jak usuwanie zestawu czy usuwanie konta.
    *   Używany w: `/my-flashcards`, Panel Użytkownika.
6.  **Komponenty formularzy Shadcn/ui**:
    *   `Input`, `Textarea`, `Label`, `Button`: Podstawowe elementy do budowy wszystkich formularzy w aplikacji.
7.  **Komponenty nawigacyjne Shadcn/ui**:
    *   `NavigationMenu`, `DropdownMenu`: Do budowy Top Baru i menu użytkownika.
8.  **Komponenty powiadomień Shadcn/ui**:
    *   `Sonner` (Toast): Do wyświetlania krótkich powiadomień o sukcesie operacji (np. utworzenie zestawu).
    *   `Tooltip`: Do wyświetlania dodatkowych informacji (np. `validation_message` przy sugestiach AI).

Wszystkie komponenty będą tworzone z uwzględnieniem responsywności (Tailwind CSS) i dostępności (ARIA).
