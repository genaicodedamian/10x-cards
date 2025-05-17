# Specyfikacja Techniczna Modułu Autentykacji - 10x-cards

## 1. Wprowadzenie

Niniejszy dokument opisuje architekturę i implementację modułu rejestracji, logowania, wylogowywania oraz odzyskiwania hasła dla aplikacji 10x-cards. Rozwiązanie bazuje na wymaganiach zdefiniowanych w PRD (US-000, US-001, US-002, US-009, US-010), stosie technologicznym (Astro, React, Supabase Auth, Tailwind CSS, Shadcn/ui) oraz istniejącym planie UI.

## 2. Architektura Interfejsu Użytkownika (Frontend)

### 2.1. Ogólne Zasady

- **Layouty Astro**: Wprowadzone zostaną dwa główne layouty:
    - `PublicLayout.astro`: Dla stron dostępnych dla niezalogowanych użytkowników (np. Ekran Startowy, Logowanie, Rejestracja, Odzyskiwanie Hasła). Będzie zawierał minimalistyczny Top Bar (logo/nazwa aplikacji).
    - `ProtectedLayout.astro`: Dla stron wymagających autentykacji (np. Dashboard, Generowanie Fiszki AI). Będzie zawierał Top Bar z menu użytkownika (Wyloguj, Usuń konto) oraz linkiem do Dashboardu.
- **Komponenty React (Shadcn/ui)**: Wszystkie formularze interaktywne (logowanie, rejestracja, odzyskiwanie hasła, resetowanie hasła) zostaną zaimplementowane jako komponenty React, aby zapewnić dynamiczną walidację po stronie klienta i płynne interakcje.
- **Strony Astro**: Będą pełnić rolę "kontenerów" dla komponentów React, obsługiwać logikę ładowania danych (jeśli konieczne przed interakcją użytkownika) oraz routing. Będą również odpowiedzialne za inicjalizację Supabase klienta po stronie klienta.
- **Zarządzanie Stanem Autentykacji**: Stan zalogowania użytkownika będzie zarządzany globalnie, prawdopodobnie z wykorzystaniem Astro `locals` oraz dedykowanego store'a po stronie klienta (np. Zustand lub prosty React Context), który będzie synchronizowany ze stanem sesji Supabase.
- **Powiadomienia Toast**: Komponent `Sonner` (Shadcn/ui) będzie używany do wyświetlania komunikatów o sukcesie (np. "Zalogowano pomyślnie!", "Rejestracja zakończona pomyślnie!") lub błędach globalnych.

### 2.2. Strony i Komponenty

#### 2.2.1. Ekran Startowy (`/`) - US-000
- **Layout**: `PublicLayout.astro`
- **Strona**: `src/pages/index.astro`
    - Wyświetla nazwę aplikacji.
    - Zawiera dwa przyciski (`Button` Shadcn/ui) nawigujące do `/login` i `/register`.
    - Logika: Jeśli użytkownik jest już zalogowany (sprawdzenie sesji Supabase), powinien zostać przekierowany na `/dashboard`. To przekierowanie może być zrealizowane w middleware Astro lub na początku skryptu strony Astro.

#### 2.2.2. Logowanie (`/login`) - US-002
- **Layout**: `PublicLayout.astro`
- **Strona**: `src/pages/login.astro`
    - Renderuje komponent React `LoginForm.tsx`.
- **Komponent React**: `src/components/auth/LoginForm.tsx`
    - **Pola**:
        - Adres e-mail (`Input` Shadcn/ui)
        - Hasło (`Input` Shadcn/ui, typ `password`)
    - **Przyciski**:
        - "Zaloguj się" (`Button` Shadcn/ui)
    - **Linki**:
        - "Nie masz konta? Zarejestruj się" (do `/register`)
        - "Zapomniałeś hasła?" (do `/forgot-password`)
    - **Logika**:
        - Walidacja po stronie klienta (wymagane pola, format e-mail).
        - Po submisji wywołuje funkcję Supabase Auth `signInWithPassword()`.
        - W przypadku sukcesu: przekierowanie na `/dashboard` (obsługiwane przez Astro po udanej odpowiedzi z Supabase lub przez callback Supabase) i wyświetlenie toast "Zalogowano pomyślnie!".
        - W przypadku błędu: wyświetlenie komunikatu błędu "Nieprawidłowy adres e-mail lub hasło." pod formularzem lub jako toast.

#### 2.2.3. Rejestracja (`/register`) - US-001
- **Layout**: `PublicLayout.astro`
- **Strona**: `src/pages/register.astro`
    - Renderuje komponent React `RegisterForm.tsx`.
- **Komponent React**: `src/components/auth/RegisterForm.tsx`
    - **Pola**:
        - Adres e-mail (`Input` Shadcn/ui)
        - Hasło (`Input` Shadcn/ui, typ `password`)
        - Potwierdzenie hasła (`Input` Shadcn/ui, typ `password`)
    - **Przyciski**:
        - "Zarejestruj się" (`Button` Shadcn/ui)
    - **Linki**:
        - "Masz już konto? Zaloguj się" (do `/login`)
    - **Logika**:
        - Walidacja po stronie klienta (wymagane pola, format e-mail, hasło min. 7 znaków, zgodność haseł).
        - Po submisji wywołuje funkcję Supabase Auth `signUp()`.
        - W przypadku sukcesu: użytkownik jest automatycznie logowany, przekierowywany na `/dashboard`, i wyświetlany jest toast "Rejestracja zakończona pomyślnie!".
        - W przypadku błędu (np. e-mail już istnieje, błędy walidacji po stronie serwera): wyświetlenie stosownych komunikatów przy polach lub jako toast (np. "Użytkownik o podanym adresie e-mail już istnieje.").

#### 2.2.4. Żądanie Resetowania Hasła (`/forgot-password`) - US-010
- **Layout**: `PublicLayout.astro`
- **Strona**: `src/pages/forgot-password.astro`
    - Renderuje komponent React `ForgotPasswordForm.tsx`.
- **Komponent React**: `src/components/auth/ForgotPasswordForm.tsx`
    - **Pola**:
        - Adres e-mail (`Input` Shadcn/ui)
    - **Przyciski**:
        - "Wyślij link do resetowania hasła" (`Button` Shadcn/ui)
    - **Linki**:
        - "Wróć do logowania" (do `/login`)
    - **Logika**:
        - Walidacja po stronie klienta (wymagane pole, format e-mail).
        - Po submisji wywołuje funkcję Supabase Auth `resetPasswordForEmail()`.
        - Niezależnie od tego, czy e-mail istnieje w bazie, wyświetlany jest ogólny komunikat (np. "Jeśli konto o podanym adresie e-mail istnieje, wysłaliśmy na nie instrukcję resetowania hasła.").

#### 2.2.5. Resetowanie Hasła (`/reset-password`) - US-010
- **Layout**: `PublicLayout.astro`
- **Strona**: `src/pages/api/auth/callback.astro` (lub dedykowana strona `/reset-password.astro` jeśli Supabase tego wymaga/umożliwia konfigurację linku)
    - Supabase domyślnie wysyła link z tokenem, który po kliknięciu może prowadzić do strony, która obsłuży `onAuthStateChange` event `PASSWORD_RECOVERY`.
    - Jeśli jest to strona, to będzie renderować komponent `ResetPasswordForm.tsx`. Token zazwyczaj jest częścią URL.
- **Strona**: `src/pages/reset-password.astro` (alternatywnie, jeśli nie callback)
    - Ta strona będzie dostępna pod ścieżką, na którą kieruje link z maila (np. `/reset-password?token=xxx`).
    - Parsuje token z URL.
    - Renderuje komponent React `ResetPasswordForm.tsx`, przekazując token.
- **Komponent React**: `src/components/auth/ResetPasswordForm.tsx`
    - **Pola**:
        - Nowe hasło (`Input` Shadcn/ui, typ `password`)
        - Potwierdzenie nowego hasła (`Input` Shadcn/ui, typ `password`)
    - **Przyciski**:
        - "Ustaw nowe hasło" (`Button` Shadcn/ui)
    - **Logika**:
        - Komponent jest aktywowany, gdy użytkownik kliknie link w mailu. Event `onAuthStateChange` Supabase (typ `PASSWORD_RECOVERY`) jest kluczowy. Sesja użytkownika może być tymczasowo ustawiona przez Supabase.
        - Alternatywnie, jeśli token jest w URL, komponent używa go do wywołania `updateUser()` Supabase.
        - Walidacja po stronie klienta (wymagane pola, hasło min. 7 znaków, zgodność haseł).
        - Po submisji wywołuje Supabase Auth `updateUser()` z nowym hasłem.
        - W przypadku sukcesu: wyświetlenie komunikatu "Hasło zostało pomyślnie zmienione. Możesz się teraz zalogować." z linkiem do `/login`.
        - W przypadku błędu (np. token nieprawidłowy/wygasł, hasło za krótkie): wyświetlenie stosownych komunikatów.

#### 2.2.6. Dashboard (`/dashboard`) - US-002a
- **Layout**: `ProtectedLayout.astro`
- **Strona**: `src/pages/dashboard.astro`
    - Dostępna tylko dla zalogowanych użytkowników. Ochrona realizowana przez middleware Astro.
    - Wyświetla główne opcje nawigacyjne zgodnie z UI Plan.

#### 2.2.7. Top Bar i Menu Użytkownika (element `ProtectedLayout.astro`)
- **Komponent React**: `src/components/layout/UserMenu.tsx` (część `ProtectedLayout.astro`)
    - Zintegrowany z `DropdownMenu` Shadcn/ui.
    - **Opcje**:
        - "Wyloguj": Wywołuje Supabase Auth `signOut()`. Po sukcesie przekierowanie na `/` (Ekran Startowy).
        - "Usuń konto": Otwiera `AlertDialog` (Shadcn/ui) z potwierdzeniem. Po potwierdzeniu, wywołuje odpowiedni endpoint API (`DELETE /api/user/delete-account`) do usunięcia danych użytkownika z Supabase (i powiązanych danych, np. fiszek). Po sukcesie przekierowanie na `/register` lub `/`.

### 2.3. Walidacja i Komunikaty Błędów

- **Walidacja po stronie klienta**: Realizowana w komponentach React przy użyciu bibliotek typu `zod` i `react-hook-form` lub wbudowanych mechanizmów. Komunikaty wyświetlane bezpośrednio przy polach formularza.
    - Przykłady: "Pole wymagane", "Nieprawidłowy format adresu e-mail", "Hasło musi mieć co najmniej 7 znaków", "Hasła nie są zgodne".
- **Walidacja i błędy po stronie serwera (Supabase)**: Błędy zwracane przez Supabase Auth API będą przechwytywane w komponentach React i wyświetlane użytkownikowi.
    - Przykłady: "Użytkownik o podanym adresie e-mail już istnieje.", "Nieprawidłowy adres e-mail lub hasło.", "Link do resetowania hasła wygasł lub jest nieprawidłowy."
- **Komunikaty Toast**: Dla globalnych potwierdzeń (np. "Zalogowano pomyślnie", "Rejestracja zakończona") i niektórych błędów.

### 2.4. Scenariusze Użytkownika (Kluczowe Przepływy)

1.  **Nowy użytkownik -> Rejestracja**:
    - `/` -> `/register` -> Wypełnienie formularza -> Sukces (automatyczne logowanie) -> `/dashboard` (z toastem).
2.  **Istniejący użytkownik -> Logowanie**:
    - `/` -> `/login` -> Wypełnienie formularza -> Sukces -> `/dashboard` (z toastem).
3.  **Użytkownik zapomniał hasła**:
    - `/login` -> "Zapomniałeś hasła?" -> `/forgot-password` -> Wpisanie e-mail -> Wysłanie linku (toast).
    - Użytkownik odbiera e-mail -> Klika link -> `/reset-password` (lub strona obsługująca callback Supabase) -> Wpisanie nowego hasła -> Sukces (toast) -> Możliwość przejścia do `/login`.
4.  **Zalogowany użytkownik -> Wylogowanie**:
    - Dowolna strona chroniona -> Menu użytkownika -> "Wyloguj" -> `/`.
5.  **Dostęp do strony chronionej przez niezalogowanego użytkownika**:
    - Próba wejścia na `/dashboard` -> Przekierowanie na `/login`.

## 3. Logika Backendowa (z wykorzystaniem Supabase)

Supabase Auth będzie głównym motorem napędowym logiki backendowej dla autentykacji. Astro będzie pełniło rolę integratora.

### 3.1. Endpointy API (Astro)

Większość operacji autentykacyjnych będzie realizowana bezpośrednio przez klienta Supabase w przeglądarce. Jednak mogą być potrzebne pewne endpointy API po stronie Astro:

- **`POST /api/auth/session`**: (Opcjonalnie) Endpoint do sprawdzania i odświeżania sesji po stronie serwera, jeśli konieczne dla SSR lub ochrony API. Supabase SDK obsługuje to w dużej mierze automatycznie.
- **`DELETE /api/user/delete-account`**:
    - **Cel**: Bezpieczne usunięcie konta użytkownika i wszystkich powiązanych danych.
    - **Logika**:
        1. Weryfikacja sesji użytkownika (middleware).
        2. Wywołanie funkcji administracyjnej Supabase do usunięcia użytkownika (np. `supabase.auth.admin.deleteUser(userId)`). To wymaga uprawnień serwisowych.
        3. Usunięcie powiązanych danych z innych tabel (np. fiszki, zestawy) za pomocą RLS lub bezpośrednich zapytań SQL (z uprawnieniami serwisowymi).
    - **Odpowiedź**: Sukces lub błąd.
- **Astro Endpoints dla OAuth (jeśli będą dodawane np. Google, GitHub login)**: Supabase obsługuje to w dużej mierze, ale konfiguracja callback URL będzie wskazywać na endpoint Astro, który finalizuje sesję.

### 3.2. Modele Danych

- **Użytkownik (Supabase `auth.users` table)**: Zarządzane przez Supabase. Zawiera `id`, `email`, `encrypted_password`, `created_at`, `updated_at`, `email_confirmed_at` etc.
- **Sesja (Supabase `auth.sessions` table)**: Zarządzane przez Supabase. Przechowuje informacje o aktywnych sesjach.
- Dodatkowe dane użytkownika (np. preferencje, jeśli nie w `user_metadata`) mogą być przechowywane w publicznej tabeli `profiles` powiązanej z `auth.users.id` przez `FOREIGN KEY`.

### 3.3. Walidacja Danych Wejściowych

- **Supabase Auth**: Posiada wbudowane mechanizmy walidacji dla swoich endpointów (np. format e-mail, siła hasła - choć minimalna długość jest konfigurowalna).
- **Endpointy API Astro**: Dla `DELETE /api/user/delete-account` główną "walidacją" jest potwierdzenie autentyczności użytkownika przez sesję.

### 3.4. Obsługa Wyjątków

- Błędy z Supabase Auth API będą przechwytywane na frontendzie (w komponentach React) i odpowiednio komunikowane użytkownikowi.
- Błędy w endpointach API Astro (np. `DELETE /api/user/delete-account`) powinny zwracać odpowiednie statusy HTTP (np. 401, 403, 500) i komunikaty JSON, które frontend może obsłużyć.

### 3.5. Renderowanie Stron Server-Side (SSR) i Middleware

- **`astro.config.mjs`**: `output: "server"` i `adapter: node({ mode: "standalone" })` oraz `experimental: { session: true }` są już skonfigurowane, co umożliwia obsługę sesji i dynamiczne renderowanie.
- **Middleware Astro (`src/middleware/index.ts`)**:
    - **Cel**: Ochrona ścieżek, zarządzanie sesją użytkownika.
    - **Logika**:
        1. Dla każdego żądania, inicjalizuje klienta Supabase po stronie serwera.
        2. Sprawdza obecność i ważność tokenu sesji (np. z ciasteczka). Supabase SDK (server-side) pomaga w tym.
        3. Pobiera dane użytkownika (`supabase.auth.getUser()`).
        4. Jeśli użytkownik jest na ścieżce chronionej (np. `/dashboard/*`, `/generate-ai`, `/create-manual`, `/my-flashcards`, `/study-session/*`) i nie jest zalogowany, przekierowuje na `/login`.
        5. Jeśli użytkownik jest zalogowany i próbuje uzyskać dostęp do `/login` lub `/register`, przekierowuje na `/dashboard`.
        6. Przekazuje informacje o użytkowniku (lub `null`) do `Astro.locals.user`, dzięki czemu są dostępne w stronach `.astro`.
    - Przykład `src/middleware/index.ts`:
      ```typescript
      import { createSupabaseServerClient } from '../db/supabase'; // Jak zdefiniowano w sekcji 4.1
      import { defineMiddleware } from 'astro:middleware';

      const protectedRoutes = ['/dashboard', '/generate-ai', '/create-manual', '/my-flashcards', '/study-session'];
      // Rozważ, czy /forgot-password i /reset-password również powinny przekierowywać, jeśli użytkownik jest zalogowany.
      // PRD sugeruje, że są dla użytkowników, którzy nie mogą się zalogować. Dla spójności z /login i /register:
      const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

      export const onRequest = defineMiddleware(async ({ locals, request, cookies, redirect }, next) => {
        const supabase = createSupabaseServerClient(cookies); // Tworzenie klienta Supabase per żądanie

        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            locals.user = user;
        } else {
            locals.user = null;
        }

        const currentPath = new URL(request.url).pathname;

        if (protectedRoutes.some(route => currentPath.startsWith(route))) {
          if (!user) {
            return redirect('/login');
          }
        }

        if (authRoutes.some(route => currentPath.startsWith(route))) {
          if (user) {
            return redirect('/dashboard');
          }
        }

        return next();
      });
      ```

- **Strony `.astro`**: Mogą używać `Astro.locals.user` do warunkowego renderowania treści lub podejmowania decyzji.

## 4. System Autentykacji (Supabase Auth + Astro)

### 4.1. Konfiguracja Supabase

- **Klient Supabase**:
    - **Frontend**: Instancja klienta Supabase (`createClient`) będzie utworzona i dostępna globalnie w części klienckiej aplikacji (np. w głównym pliku layoutu lub dedykowanym module `src/lib/supabaseClient.ts`).
      ```typescript
      // src/lib/supabaseClient.ts
      import { createBrowserClient } from '@supabase/ssr';

      export const supabase = createBrowserClient(
        import.meta.env.PUBLIC_SUPABASE_URL!,
        import.meta.env.PUBLIC_SUPABASE_ANON_KEY!
      );
      ```
    - **Backend/Server-side (w middleware, endpointach API Astro)**: Instancja klienta Supabase będzie tworzona z użyciem kluczy środowiskowych (w tym `SERVICE_ROLE_KEY` dla operacji administracyjnych, jeśli potrzebne). Należy używać `@supabase/ssr` do poprawnej obsługi sesji w SSR.
      ```typescript
      // src/db/supabase.ts (przykład dla serwera, może wymagać dostosowania z @supabase/ssr)
      import { createServerClient, type CookieOptions } from '@supabase/ssr'
      import { type AstroCookies } from 'astro';

      // This is a simplified example. Actual implementation might differ based on Supabase SSR helpers for Astro
      export const createSupabaseServerClient = (cookies: AstroCookies) => {
          return createServerClient(
              import.meta.env.PUBLIC_SUPABASE_URL!,
              import.meta.env.PUBLIC_SUPABASE_ANON_KEY!,
              {
                  cookies: {
                      get(key: string) {
                          return cookies.get(key)?.value;
                      },
                      set(key: string, value: string, options: CookieOptions) {
                          cookies.set(key, value, options);
                      },
                      remove(key: string, options: CookieOptions) {
                          cookies.delete(key, options);
                      },
                  },
              }
          );
      }
      // A global server client for service roles might look different:
      // import { createClient } from '@supabase/supabase-js';
      // export const supabaseAdmin = createClient(import.meta.env.PUBLIC_SUPABASE_URL!, import.meta.env.SUPABASE_SERVICE_ROLE_KEY!);
      ```
- **Zmienne Środowiskowe**: `PUBLIC_SUPABASE_URL` i `PUBLIC_SUPABASE_ANON_KEY` muszą być dostępne w środowisku Astro (dla frontendu prefix `PUBLIC_`). `SUPABASE_SERVICE_ROLE_KEY` dla operacji admina.
- **Ustawienia Autentykacji w Supabase Dashboard**:
    - Włączyć dostawcę E-mail.
    - Skonfigurować szablony e-maili (Potwierdzenie rejestracji - jeśli włączone, Resetowanie hasła).
    - **Site URL**: Ustawić na główny URL aplikacji (np. `http://localhost:3000` dla dewelopmentu).
    - **Redirect URLs**: Dodać URL-e używane w przepływach OAuth lub inne potrzebne (np. `http://localhost:3000/api/auth/callback` lub specyficzne strony docelowe). Dla resetu hasła, Supabase zazwyczaj obsługuje to, ale link w mailu powinien prowadzić do odpowiedniej strony w aplikacji (`/reset-password`).
    - Rozważyć wyłączenie "Confirm email" dla MVP, aby uprościć rejestrację (US-001 nie wspomina o potwierdzeniu email).

### 4.2. Procesy Autentykacyjne

- **Rejestracja**:
    1. Komponent `RegisterForm.tsx` zbiera dane.
    2. Wywołuje `supabase.auth.signUp({ email, password })`.
    3. Supabase tworzy użytkownika, (opcjonalnie wysyła e-mail potwierdzający), tworzy sesję i zwraca dane sesji.
    4. Frontend przekierowuje na `/dashboard`.
- **Logowanie**:
    1. Komponent `LoginForm.tsx` zbiera dane.
    2. Wywołuje `supabase.auth.signInWithPassword({ email, password })`.
    3. Supabase weryfikuje dane, tworzy sesję, zwraca dane sesji.
    4. Frontend przekierowuje na `/dashboard`.
- **Wylogowywanie**:
    1. Komponent `UserMenu.tsx` (lub inna akcja wylogowania).
    2. Wywołuje `supabase.auth.signOut()`.
    3. Supabase usuwa sesję (czyści ciasteczka).
    4. Frontend przekierowuje na `/`.
- **Odzyskiwanie Hasła (Żądanie)**:
    1. Komponent `ForgotPasswordForm.tsx` zbiera e-mail.
    2. Wywołuje `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'YOUR_APP_URL/reset-password' })`. `redirectTo` jest kluczowe, aby link w mailu prowadził do właściwej strony w aplikacji Astro.
    3. Supabase wysyła e-mail z linkiem.
- **Odzyskiwanie Hasła (Ustawianie Nowego)**:
    1. Użytkownik klika link w e-mailu, trafia na `YOUR_APP_URL/reset-password#access_token=TOKEN&...` (lub podobny format, w zależności od konfiguracji Supabase i `redirectTo`).
    2. Strona `/reset-password.astro` (lub komponent React na niej) przechwytuje token.
    3. Często Supabase SDK obsługuje to przez `onAuthStateChange` event typu `PASSWORD_RECOVERY`. Gdy ten event wystąpi, użytkownik jest w specjalnym stanie sesji, który pozwala na zmianę hasła.
    4. Komponent `ResetPasswordForm.tsx` zbiera nowe hasło.
    5. Wywołuje `supabase.auth.updateUser({ password: newPassword })`.
    6. Supabase aktualizuje hasło.
- **Zarządzanie Sesją**:
    - Supabase SDK automatycznie zarządza sesjami używając ciasteczek HTTPOnly.
    - `@supabase/ssr` pomaga w synchronizacji sesji między serwerem a klientem w środowiskach SSR jak Astro.
    - Middleware Astro będzie odczytywać sesję przy każdym żądaniu na serwerze.
    - Po stronie klienta, `supabase.auth.onAuthStateChange((event, session) => { ... })` może być użyty do reagowania na zmiany stanu autentykacji (np. aktualizacja UI, przekierowania).

### 4.3. Bezpieczeństwo i Autoryzacja (US-009)

- **Row Level Security (RLS) w Supabase**: Kluczowe dla zapewnienia, że użytkownicy mają dostęp tylko do swoich danych.
    - Dla tabel przechowujących dane użytkownika (np. `flashcards`, `flashcard_sets`) należy zdefiniować polityki RLS.
    - Przykład polityki RLS dla tabeli `flashcard_sets` (zakładając, że ma kolumnę `user_id`):
      ```sql
      -- Umożliwia SELECT tylko właścicielowi
      CREATE POLICY "Enable read access for own sets"
      ON flashcard_sets FOR SELECT
      USING (auth.uid() = user_id);

      -- Umożliwia INSERT tylko dla własnego user_id
      CREATE POLICY "Enable insert for own sets"
      ON flashcard_sets FOR INSERT
      WITH CHECK (auth.uid() = user_id);

      -- Umożliwia UPDATE tylko właścicielowi
      CREATE POLICY "Enable update for own sets"
      ON flashcard_sets FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);

      -- Umożliwia DELETE tylko właścicielowi
      CREATE POLICY "Enable delete for own sets"
      ON flashcard_sets FOR DELETE
      USING (auth.uid() = user_id);
      ```
    - Podobne polityki dla tabeli `flashcards` (jeśli jest bezpośrednio powiązana z `user_id` lub pośrednio przez `flashcard_set_id`, gdzie zestaw ma `user_id`).
- **Ciasteczka**: Supabase domyślnie używa bezpiecznych ciasteczek (HttpOnly, Secure w produkcji).
- **CSRF**: Astro i Supabase mają wbudowane mechanizmy lub najlepsze praktyki minimalizujące ryzyko CSRF. Należy upewnić się, że formularze POST używają standardowych zabezpieczeń.

## 5. Kluczowe Wnioski i Następne Kroki

- Architektura opiera się na ścisłej integracji Astro (SSR, routing, middleware) z React (komponenty UI, logika kliencka) i Supabase (backend autentykacji, baza danych).
- Shadcn/ui dostarczy gotowych komponentów, przyspieszając rozwój UI.
- Middleware Astro jest kluczowe dla ochrony ścieżek i zarządzania sesją po stronie serwera.
- Polityki RLS w Supabase są fundamentalne dla bezpieczeństwa danych użytkownika.
- Należy dokładnie skonfigurować Supabase Auth (URL-e, szablony e-maili, opcjonalnie dostawcy OAuth).
- Staranna implementacja obsługi błędów i komunikatów dla użytkownika jest ważna dla dobrego UX.

**Następne Kroki Implementacyjne**:
1.  Konfiguracja projektu Supabase (tabele, RLS, ustawienia Auth).
2.  Implementacja layoutów `PublicLayout.astro` i `ProtectedLayout.astro`.
3.  Stworzenie `src/middleware/index.ts` z logiką ochrony ścieżek.
4.  Implementacja komponentów React dla formularzy autentykacji (`LoginForm`, `RegisterForm`, `ForgotPasswordForm`, `ResetPasswordForm`).
5.  Integracja komponentów React ze stronami Astro (`/login.astro`, `/register.astro` itd.).
6.  Implementacja `UserMenu.tsx` z funkcjami wylogowania i usuwania konta (w tym endpoint API `DELETE /api/user/delete-account`).
7.  Dokładne testowanie wszystkich przepływów autentykacji.
