# Plan implementacji widoku Dashboard

## 1. Przegląd
Widok Dashboard pełni rolę centralnego panelu nawigacyjnego dla zalogowanych użytkowników aplikacji 10x-cards. Po pomyślnym zalogowaniu lub rejestracji, użytkownik jest kierowany na ten ekran, skąd ma szybki dostęp do kluczowych funkcji: generowania fiszek za pomocą AI, manualnego tworzenia fiszek oraz przeglądania swoich zestawów fiszek. Widok ma być prosty, intuicyjny i zapewniać łatwy start pracy z aplikacją. Będzie również miejscem wyświetlania globalnych powiadomień (toast) informujących o wynikach akcji wykonanych w innych częściach aplikacji (np. pomyślne utworzenie zestawu fiszek).

## 2. Routing widoku
Widok Dashboard będzie dostępny pod następującą ścieżką:
- `/dashboard`

Dostęp do tej ścieżki będzie chroniony i możliwy tylko dla zalogowanych użytkowników. Niezalogowani użytkownicy próbujący uzyskać dostęp do `/dashboard` zostaną przekierowani na stronę logowania (`/login`).

## 3. Struktura komponentów
Widok Dashboard będzie zaimplementowany jako strona Astro (`src/pages/dashboard.astro`). Główne elementy interfejsu użytkownika, takie jak klikalne karty nawigacyjne, będą prawdopodobnie zaimplementowane jako komponenty React (zgodnie ze stosem technologicznym i użyciem Shadcn/ui). Komponent `Toaster` do obsługi powiadomień "toast" zostanie zintegrowany w głównym layoucie aplikacji.

```
MainLayout.astro (lub AppLayout.astro / AuthenticatedLayout.astro)
  └── Toaster (komponent Sonner z Shadcn/ui, np. <Toaster client:load />)
  └── DashboardPage (`src/pages/dashboard.astro`)
      ├── Nagłówek (np. "Panel Główny" lub "Witaj!")
      └── Sekcja Nawigacyjna (np. kontener flex lub grid)
          ├── NavigationItem (React component)
          │   (props: title="Generuj fiszki z AI", href="/generate-ai", description="...", icon="...")
          ├── NavigationItem (React component)
          │   (props: title="Stwórz fiszki manualnie", href="/create-manual", description="...", icon="...")
          ├── NavigationItem (React component)
          │   (props: title="Moje zestawy fiszek", href="/my-flashcards", description="...", icon="...")
```

## 4. Szczegóły komponentów

### `DashboardPage` (Astro Page)
- **Ścieżka pliku**: `src/pages/dashboard.astro`
- **Opis komponentu**: Główna strona Astro dla ścieżki `/dashboard`. Odpowiada za wyświetlenie układu strony, w tym sekcji nawigacyjnej. Strona ta musi weryfikować, czy użytkownik jest zalogowany; w przeciwnym razie przekierowuje do `/login`. Wykorzystuje globalny layout, który powinien zawierać komponent `Toaster`.
- **Główne elementy**:
    - Import i użycie głównego layoutu aplikacji (np. `<Layout title="Dashboard">`).
    - Kontener (np. `div` stylowany za pomocą Tailwind CSS) dla elementów nawigacyjnych.
    - Wywołanie komponentów `NavigationItem` z odpowiednimi propsami.
    - Opcjonalny nagłówek strony (np. `<h1>Panel Główny</h1>`).
- **Obsługiwane interakcje**:
    - Strona sama w sobie nie obsługuje bezpośrednich interakcji poza nawigacją realizowaną przez komponenty `NavigationItem`.
- **Obsługiwana walidacja**:
    - **Uwierzytelnienie użytkownika**: Sprawdzenie, czy użytkownik jest zalogowany (np. poprzez `Astro.locals.user` dostarczane przez middleware). Jeśli użytkownik nie jest zalogowany, następuje przekierowanie do `/login`.
- **Typy**: Brak specyficznych typów DTO/ViewModel dla samej struktury strony. Operuje na danych sesji użytkownika.
- **Propsy**: Jako strona Astro, nie przyjmuje propsów w tradycyjnym sensie komponentów React.

### `NavigationItem` (React Component)
- **Sugerowana ścieżka pliku**: `src/components/dashboard/NavigationItem.tsx`
- **Opis komponentu**: Reużywalny komponent React służący do wyświetlania pojedynczej opcji nawigacyjnej na Dashboardzie. Powinien być duży, klikalny i jasno komunikować swoją funkcję. Może być zaimplementowany przy użyciu komponentu `Card` lub dużego `Button` z biblioteki Shadcn/ui, opakowującego link (`<a>` tag) lub obsługującego nawigację programatyczną.
- **Główne elementy**:
    - Główny element opakowujący, np. `Card` lub `Button` z Shadcn/ui.
    - Tytuł opcji nawigacyjnej (np. `CardTitle` lub tekst wewnątrz `Button`).
    - Opcjonalnie: krótki opis (np. `CardDescription`) i ikona.
    - Element `<a>` do nawigacji lub obsługa kliknięcia przekierowująca programatycznie.
- **Obsługiwane interakcje**:
    - `onClick`: Użytkownik klika element, co powoduje nawigację do ścieżki zdefiniowanej w propsie `href`.
- **Obsługiwana walidacja**: Brak wewnętrznej walidacji; poprawność `href` jest odpowiedzialnością implementującego.
- **Typy**:
    - `NavigationItemProps` (ViewModel)
- **Propsy**:
    ```typescript
    export interface NavigationItemProps {
      title: string;
      href: string;
      description?: string;
      icon?: React.ReactNode; // Na razie mogę użyć prostego stringa lub pominąć implementację ikony
      className?: string;
    }
    ```

### Integracja `Toaster` (Shadcn/ui - Sonner)
- **Opis komponentu**: Nie jest to komponent tworzony od zera, lecz integracja gotowego komponentu `Toaster` z biblioteki `sonner` (część ekosystemu Shadcn/ui). Służy do wyświetlania powiadomień typu "toast".
- **Implementacja**: Komponent `<Toaster />` powinien być umieszczony w głównym pliku layoutu aplikacji (np. `src/layouts/Layout.astro` lub dedykowanym layoucie dla zalogowanych użytkowników), aby był dostępny globalnie.
  ```astro
  // W pliku layoutu, np. src/layouts/Layout.astro
  import { Toaster } from 'sonner';
  // ...
  <Toaster client:load richColors position="top-right" />
  // ...
  ```
- **Użycie**: Powiadomienia są wywoływane programatycznie z dowolnego miejsca w kodzie JavaScript/TypeScript (po stronie klienta) za pomocą funkcji z `sonner`, np. `toast.success('Wiadomość')`. Dashboard będzie wyświetlał toasty wygenerowane przez inne akcje (np. po utworzeniu zestawu fiszek i przekierowaniu).

## 5. Typy
Głównym nowym typem (ViewModel) wymaganym dla tego widoku jest interfejs propsów dla komponentu `NavigationItem`:

```typescript
// Proponowana lokalizacja: src/components/dashboard/NavigationItem.tsx
// lub w globalnym pliku typów jeśli będzie reużywany szerzej w podobnej formie

/**
 * Propsy dla komponentu NavigationItem.
 */
export interface NavigationItemProps {
  /** Tytuł wyświetlany na karcie/przycisku nawigacyjnym. */
  title: string;
  /** Ścieżka docelowa, do której prowadzi nawigacja. */
  href: string;
  /** Opcjonalny krótki opis wyjaśniający funkcję. */
  description?: string;
  /** Opcjonalna ikona do wyświetlenia obok tytułu lub w tle. */
  icon?: React.ReactNode; // Na razie mogę użyć prostego stringa lub pominąć implementację ikony
  /** Opcjonalne dodatkowe klasy CSS dla stylizacji. */
  className?: string;
}
```
Nie przewiduje się potrzeby tworzenia innych złożonych typów DTO czy ViewModeli specyficznie dla statycznej struktury Dashboardu. Typy z `src/types.ts` nie są bezpośrednio konsumowane do renderowania tego widoku, ale mogą być istotne dla akcji, które *prowadzą* do wyświetlenia toastów na Dashboardzie (np. nazwa zestawu w komunikacie).

## 6. Zarządzanie stanem
- **DashboardPage (`src/pages/dashboard.astro`)**:
    - Strona ta będzie głównie bezstanowa po stronie klienta.
    - Kluczowym aspektem jest weryfikacja stanu uwierzytelnienia użytkownika, co odbywa się po stronie serwera przy użyciu danych z `Astro.locals` (dostarczanych przez middleware Supabase).
- **`NavigationItem` (React Component)**:
    - Komponent ten będzie prawdopodobnie bezstanowy, pełniąc rolę czysto prezentacyjną i nawigacyjną.
- **Powiadomienia Toast (`Sonner`)**:
    - Stan samych powiadomień (czy są widoczne, ich treść itp.) jest zarządzany wewnętrznie przez bibliotekę `sonner`.
    - Wyzwalanie toastów będzie następować w odpowiedzi na zdarzenia w innych częściach aplikacji (np. po pomyślnym zapisie danych przez API na stronach `/generate-ai` czy `/create-manual`, przed przekierowaniem na `/dashboard`). Mechanizm ten nie wymaga dedykowanego zarządzania stanem w samym Dashboardzie, lecz poprawnej konfiguracji `Toaster` w layoucie i wywoływania funkcji `toast()` w odpowiednich miejscach.
- **Niestandardowe hooki**: Nie przewiduje się potrzeby tworzenia niestandardowych hooków React specjalnie dla logiki samego widoku Dashboard.

## 7. Integracja API
Widok Dashboard sam w sobie nie inicjuje bezpośrednich wywołań API w celu pobrania danych do swojego wyświetlenia. Jego główna interakcja z backendem ma charakter pośredni:
1.  **Uwierzytelnianie**: Dostęp do strony `/dashboard` jest kontrolowany przez middleware, które komunikuje się z Supabase w celu weryfikacji sesji użytkownika. To nie jest wywołanie API inicjowane przez komponent Dashboard, lecz warunek dostępu do strony.
2.  **Wyświetlanie powiadomień (Toast)**: Toast'y (np. "Zestaw '[Nazwa]' został utworzony") są efektem pomyślnych operacji API (np. `POST /api/flashcard-sets`) wykonanych w innych widokach. Po takiej operacji, odpowiednia strona (np. `/generate-ai`) wywoła funkcję `toast()` i przekieruje na `/dashboard`. Dashboard jedynie wyświetla te powiadomienia dzięki globalnie dostępnemu `Toaster`.

Nie ma typów żądań ani odpowiedzi API bezpośrednio przetwarzanych przez logikę renderowania Dashboardu.

## 8. Interakcje użytkownika
- **Wejście na stronę `/dashboard`**:
    - Użytkownik widzi główny panel z opcjami nawigacyjnymi.
    - Jeśli dostęp jest nieautoryzowany, użytkownik jest przekierowywany do `/login`.
- **Kliknięcie opcji nawigacyjnej (np. "Generuj fiszki z AI")**:
    - Użytkownik jest przekierowywany na odpowiednią podstronę (np. `/generate-ai`). Nawigacja odbywa się za pomocą standardowych linków HTML (`<a>`) lub programatycznie przez Astro/React router.
- **Otrzymanie powiadomienia Toast**:
    - Jeśli użytkownik został przekierowany na Dashboard po akcji, która wygenerowała powiadomienie (np. utworzenie zestawu), zobaczy odpowiedni komunikat Toast na ekranie.

## 9. Warunki i walidacja
- **Warunek główny**: Użytkownik musi być zalogowany, aby uzyskać dostęp do `/dashboard`.
    - **Weryfikacja**: Realizowana przez middleware Astro, które sprawdza sesję użytkownika (np. `Astro.locals.user`). W przypadku braku sesji, następuje przekierowanie do `/login`. Dodatkowe sprawdzenie może (ale nie musi) być obecne w samym pliku `dashboard.astro`.
    - **Wpływ na interfejs**: Jeśli warunek nie jest spełniony, użytkownik nie widzi Dashboardu, lecz stronę logowania.
- **Poprawność linków nawigacyjnych**:
    - **Weryfikacja**: Zapewniona przez dewelopera podczas implementacji komponentów `NavigationItem` (poprawne wartości `href`).
    - **Wpływ na interfejs**: Niepoprawny link prowadziłby do błędu 404 lub nieprawidłowej strony.
- **Dostępność komponentu `Toaster`**:
    - **Warunek**: Komponent `Toaster` musi być poprawnie zintegrowany i załadowany w layoucie aplikacji.
    - **Wpływ na interfejs**: Jeśli `Toaster` nie działa, powiadomienia nie będą wyświetlane.

## 10. Obsługa błędów
- **Nieautoryzowany dostęp**:
    - **Obsługa**: Middleware automatycznie przekierowuje na stronę logowania (`/login`). Strona `/dashboard.astro` może zawierać dodatkową logikę przekierowania jako zabezpieczenie.
- **Nieprawidłowe ścieżki nawigacji (błąd dewelopera)**:
    - **Obsługa**: Aplikacja powinna posiadać globalną obsługę błędów 404, która wyświetli odpowiednią stronę. Wymaga to dokładnego testowania linków.
- **Problemy z wyświetlaniem powiadomień Toast**:
    - **Obsługa**: Weryfikacja poprawnej instalacji i konfiguracji komponentu `Toaster` (z biblioteki `sonner`) zgodnie z dokumentacją Shadcn/ui i `sonner`. Sprawdzenie konsoli przeglądarki pod kątem błędów JavaScript związanych z `Toaster`.
- **Ogólne błędy renderowania strony/komponentów**:
    - **Obsługa**: Astro oferuje mechanizmy obsługi błędów (Error Boundaries w przypadku komponentów React, jeśli są używane jako wyspy z `client:` dyrektywą). Standardowe debugowanie i testowanie.

## 11. Kroki implementacji
1.  **Konfiguracja Middleware (jeśli jeszcze nie istnieje lub wymaga modyfikacji)**:
    *   Upewnij się, że plik `src/middleware/index.ts` (lub odpowiednik) poprawnie chroni ścieżkę `/dashboard`, sprawdzając sesję użytkownika Supabase.
    *   W przypadku braku uwierzytelnienia, middleware powinno przekierowywać na `/login`.
    *   Upewnij się, że `Astro.locals.user` (lub podobne) jest poprawnie ustawiane dla zalogowanych użytkowników.
2.  **Utworzenie strony `DashboardPage`**:
    *   Stwórz plik `src/pages/dashboard.astro`.
    *   Zaimplementuj logikę sprawdzania uwierzytelnienia na początku skryptu strony (jako dodatkowe zabezpieczenie lub do pobrania danych użytkownika, jeśli potrzebne do personalizacji).
    *   Dodaj podstawową strukturę HTML i zaimportuj główny layout aplikacji.
3.  **Integracja `Toaster` (jeśli nie zrobiono globalnie)**:
    *   Dodaj komponent `<Toaster client:load />` (z `sonner`) do głównego layoutu aplikacji (np. `src/layouts/Layout.astro`), jeśli jeszcze go tam nie ma. Skonfiguruj jego pozycję i styl (np. `richColors`).
4.  **Stworzenie komponentu `NavigationItem`**:
    *   Stwórz plik `src/components/dashboard/NavigationItem.tsx`.
    *   Zaimplementuj komponent zgodnie z opisem w sekcji "Szczegóły komponentów", używając komponentów Shadcn/ui (np. `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `Button`) i Tailwind CSS do stylizacji.
    *   Zdefiniuj interfejs `NavigationItemProps`.
    *   Komponent powinien przyjmować `title`, `href` i opcjonalnie `description` oraz `icon`.
    *   Obsłuż nawigację po kliknięciu (np. przez tag `<a>` lub programatycznie).
5.  **Implementacja sekcji nawigacyjnej w `DashboardPage`**:
    *   W `src/pages/dashboard.astro`, zaimportuj i użyj komponentu `NavigationItem` trzykrotnie, przekazując odpowiednie propsy (`title`, `href`, `description`, `icon`) dla każdej z trzech głównych opcji nawigacyjnych:
        *   "Generuj fiszki z AI" (`/generate-ai`)
        *   "Stwórz fiszki manualnie" (`/create-manual`)
        *   "Moje zestawy fiszek" (`/my-flashcards`)
    *   Użyj Tailwind CSS (np. Flexbox lub Grid) do rozmieszczenia `NavigationItem` w przejrzysty sposób.
6.  **Stylizacja**:
    *   Dostosuj wygląd Dashboardu i komponentów `NavigationItem` za pomocą Tailwind CSS, aby były zgodne z resztą aplikacji i wytycznymi UX (duże, czytelne, klikalne elementy).
    *   Upewnij się, że widok jest responsywny.
7.  **Testowanie**:
    *   **Uwierzytelnianie**: Sprawdź, czy niezalogowany użytkownik jest przekierowywany do `/login`. Sprawdź, czy zalogowany użytkownik ma dostęp.
    *   **Nawigacja**: Sprawdź, czy wszystkie linki nawigacyjne działają poprawnie i prowadzą do właściwych stron.
    *   **Powiadomienia Toast**: Przetestuj wyświetlanie powiadomień poprzez symulację akcji, która je wywołuje (np. tymczasowo dodaj przycisk na innej stronie, który po kliknięciu wywołuje `toast()` i przekierowuje na Dashboard).
    *   **Responsywność**: Przetestuj wygląd na różnych rozmiarach ekranu.
    *   **Dostępność**: Przetestuj nawigację za pomocą klawiatury i sprawdź poprawność opisów dla czytników ekranu (Shadcn/ui powinno to w dużej mierze zapewniać).
8.  **Weryfikacja z User Story (US-002a)**:
    *   Upewnij się, że wszystkie kryteria akceptacji z US-002a są spełnione.
