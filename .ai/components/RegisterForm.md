# Komponent RegisterForm.tsx

## Przeznaczenie

Komponent `RegisterForm.tsx` odpowiada za obsługę procesu rejestracji nowego użytkownika w aplikacji. Umożliwia wprowadzenie adresu e-mail, hasła oraz potwierdzenie hasła, a następnie komunikuje się z usługą Supabase w celu utworzenia nowego konta.

## Logika Działania

### Stan Komponentu

Komponent zarządza następującymi stanami:
-   `email`: Przechowuje wprowadzony przez użytkownika adres e-mail.
-   `password`: Przechowuje wprowadzone przez użytkownika hasło.
-   `confirmPassword`: Przechowuje wprowadzone przez użytkownika potwierdzenie hasła.
-   `error`: Przechowuje komunikat błędu walidacji formularza lub błędu zwróconego przez Supabase podczas rejestracji.
-   `isLoading`: Flaga informująca, czy proces rejestracji jest w toku.
-   `showSuccessModal`: Flaga kontrolująca widoczność modala informującego o pomyślnej rejestracji.

### Walidacja Formularza (`validateForm`)

Przed próbą rejestracji, funkcja `validateForm` wykonuje następujące sprawdzenia:
1.  Czy wszystkie pola (e-mail, hasło, potwierdzenie hasła) są wypełnione. Jeśli nie, ustawia `error`.
2.  Czy adres e-mail ma poprawny format (sprawdzany za pomocą wyrażenia regularnego `/\S+@\S+\.\S+/`). Jeśli nie, ustawia `error`.
3.  Czy hasło ma co najmniej 7 znaków. Jeśli nie, ustawia `error`.
4.  Czy hasło i potwierdzenie hasła są identyczne. Jeśli nie, ustawia `error`.
Jeśli walidacja przejdzie pomyślnie, `error` jest resetowany do `null`.

### Obsługa Modala Sukcesu (`handleModalOkClick`)

Ta funkcja jest wywoływana po kliknięciu przycisku "OK" w modalu potwierdzającym rejestrację:
1.  Ustawia `showSuccessModal` na `false`, aby ukryć modal.
2.  Przekierowuje użytkownika na stronę logowania (`/login`).

### Proces Rejestracji (Obsługa `handleSubmit`)

1.  Zapobiega domyślnej akcji formularza.
2.  Wywołuje `validateForm`. Jeśli walidacja nie powiedzie się, przerywa dalsze działanie.
3.  Ustawia `isLoading` na `true`.
4.  Sprawdza, czy klient Supabase (`supabase`) został poprawnie zainicjowany. Jeśli nie, ustawia `error` i przerywa.
5.  Wywołuje metodę `supabase.auth.signUp` z podanym adresem e-mail i hasłem.
6.  Obsługuje odpowiedź z Supabase:
    *   **Błąd Rejestracji (`signUpError`)**: 
        *   Jeśli błąd zawiera informację o tym, że użytkownik już istnieje ("User already registered" lub "already registered"), ustawia odpowiedni komunikat `error`.
        *   W przeciwnym razie, ustawia `error` na komunikat błędu zwrócony przez Supabase lub ogólny komunikat.
        *   Ustawia `isLoading` na `false`.
    *   **Sukces Rejestracji (brak `signUpError` i istnieje `data.user`)**: Ustawia `showSuccessModal` na `true`.
    *   **Sukces, ale brak danych użytkownika**: Ustawia `error` informujący o pomyślnej rejestracji, ale problemie z weryfikacją, sugerując ręczne logowanie.
7.  Niezależnie od wyniku, ustawia `isLoading` na `false` po zakończeniu operacji asynchronicznej.

### Interfejs Użytkownika

-   Komponent jest wycentrowany na stronie i zajmuje maksymalnie `max-w-3xl`.
-   Wykorzystuje komponenty `Card` (`CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`) do strukturyzacji formularza.
-   Pola formularza (`Input` dla e-maila, hasła, potwierdzenia hasła) oraz ich etykiety (`Label`) pochodzą z `@/components/ui/input` i `@/components/ui/label`.
-   Przycisk "Zarejestruj się" (`Button`) jest używany do wysłania formularza. Jego stan (w tym tekst "Rejestrowanie...") zmienia się w zależności od flagi `isLoading`.
-   Komunikaty błędów (`error`) są wyświetlane w kolorze czerwonym.
-   Stopka (`CardFooter`) zawiera link do strony logowania (`/login`).
-   Modal (`AlertDialog` z `@/components/ui/alert-dialog`) wyświetlany jest po pomyślnej rejestracji, informując użytkownika o sukcesie i umożliwiając przejście do strony logowania.

## Zależności

-   `react`
-   `@/components/ui/button`
-   `@/components/ui/card`
-   `@/components/ui/alert-dialog`
-   `@/components/ui/input`
-   `@/components/ui/label`
-   `@/lib/supabaseClient` (dla obiektu `supabase`)
