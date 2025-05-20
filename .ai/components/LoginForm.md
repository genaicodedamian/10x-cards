# Komponent LoginForm.tsx

## Przeznaczenie

Komponent `LoginForm.tsx` jest odpowiedzialny za wyświetlanie i obsługę formularza logowania użytkownika w aplikacji. Umożliwia użytkownikom wprowadzenie adresu e-mail i hasła w celu uzyskania dostępu do chronionych części serwisu.

## Logika Działania

### Stan Komponentu

Komponent zarządza następującymi stanami:
-   `email`: Przechowuje wprowadzony przez użytkownika adres e-mail.
-   `password`: Przechowuje wprowadzone przez użytkownika hasło.
-   `loginError`: Przechowuje komunikat błędu logowania zwrócony przez API lub błąd połączenia.
-   `validationError`: Przechowuje komunikat błędu walidacji formularza.
-   `isLoading`: Flaga informująca, czy proces logowania jest w toku (np. w celu zablokowania przycisku i wyświetlenia wskaźnika ładowania).

### Walidacja Formularza

Przed wysłaniem danych na serwer, metoda `validateForm` sprawdza:
1.  Czy pola e-mail i hasło nie są puste. Jeśli tak, ustawia `validationError`.
2.  Czy adres e-mail ma poprawny format (sprawdzany za pomocą wyrażenia regularnego `/\S+@\S+\.\S+/`). Jeśli nie, ustawia `validationError`.
Jeśli walidacja przejdzie pomyślnie, `validationError` jest czyszczony.

### Proces Logowania (Obsługa `handleSubmit`)

1.  Zapobiega domyślnej akcji formularza (przeładowaniu strony).
2.  Resetuje `loginError`.
3.  Wywołuje `validateForm`. Jeśli walidacja nie powiedzie się, przerywa dalsze działanie.
4.  Ustawia `isLoading` na `true`.
5.  Wysyła żądanie POST na endpoint `/api/auth/login` z adresem e-mail i hasłem w ciele żądania (w formacie JSON).
6.  Obsługuje odpowiedź serwera:
    *   **Niepowodzenie (response.ok === false)**: Parsuje odpowiedź JSON w poszukiwaniu pola `error`. Ustawia `loginError` na wartość tego pola lub na domyślny komunikat "Wystąpił nieoczekiwany błąd.". Ustawia `isLoading` na `false`.
    *   **Sukces (response.ok === true)**: Loguje sukces do konsoli, wyświetla komunikat "Zalogowano pomyślnie!" używając biblioteki `toast` (zgodnie z US-002) i przekierowuje użytkownika na stronę `/dashboard` (zgodnie z US-002).
7.  Obsługuje błędy sieciowe (w bloku `catch`): Loguje błąd do konsoli i ustawia `loginError` na "Nie można połączyć się z serwerem. Spróbuj ponownie później.".
8.  Niezależnie od wyniku, ustawia `isLoading` na `false` po zakończeniu operacji asynchronicznej.

### Interfejs Użytkownika

-   Komponent jest wycentrowany na stronie i zajmuje maksymalnie `max-w-3xl`.
-   Wykorzystuje komponenty `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` z `@/components/ui/card` do strukturyzacji formularza.
-   Pola formularza (`Input` dla e-maila i hasła) oraz ich etykiety (`Label`) pochodzą z `@/components/ui/input` i `@/components/ui/label`.
-   Przycisk "Zaloguj się" (`Button` z `@/components/ui/button`) jest używany do wysłania formularza. Jego stan (w tym tekst "Logowanie...") zmienia się w zależności od flagi `isLoading`.
-   Komunikaty błędów (`loginError` lub `validationError`) są wyświetlane w kolorze czerwonym.
-   Stopka (`CardFooter`) zawiera linki do strony rejestracji (`/register`) oraz do strony odzyskiwania hasła (`/forgot-password`).

## Zależności

-   `react`
-   `@/components/ui/button`
-   `@/components/ui/card`
-   `@/components/ui/input`
-   `@/components/ui/label`
-   `sonner` (dla `toast`)
-   API endpoint: `/api/auth/login`


## ASCII Structure
LoginForm.tsx
|
|--- React (useState, FormEvent)
|
|--- @/components/ui/button (Button)
|
|--- @/components/ui/card (Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle)
|
|--- @/components/ui/input (Input)
|
|--- @/components/ui/label (Label)
|
|--- sonner (toast)
|
|--- API Endpoint: /api/auth/login
|
|--- (User Interaction) -> handleSubmit
|   |--- validateForm()
|   |--- fetch("/api/auth/login")
|   |--- toast.success()
|   |--- window.location.href = "/dashboard"
|
|--- (Render)
    |--- Card
        |--- CardHeader
        |   |--- CardTitle ("Logowanie")
        |   |--- CardDescription
        |--- CardContent
        |   |--- form (onSubmit: handleSubmit)
        |       |--- Label (for "email")
        |       |--- Input (email, type="email")
        |       |--- Label (for "password")
        |       |--- Input (password, type="password")
        |       |--- (Error Message Display: loginError || validationError)
        |       |--- Button (type="submit", text: "Zaloguj się" / "Logowanie...")
        |--- CardFooter
            |--- Link to "/register" (RegisterForm.tsx)
            |--- Link to "/forgot-password"

RegisterForm.tsx (linked from LoginForm.tsx)
|
|--- React (useState, FormEvent)
|
|--- @/components/ui/button (Button)
|
|--- @/components/ui/card (Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle)
|
|--- @/components/ui/alert-dialog (AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle)
|
|--- @/components/ui/input (Input)
|
|--- @/components/ui/label (Label)
|
|--- @/lib/supabaseClient (supabase)
|
|--- (User Interaction) -> handleSubmit
|   |--- validateForm()
|   |--- supabase.auth.signUp()
|   |--- setShowSuccessModal(true)
|
|--- (User Interaction) -> handleModalOkClick (from AlertDialog)
|   |--- setShowSuccessModal(false)
|   |--- window.location.href = "/login"
|
|--- (Render)
    |--- Card
    |   |--- CardHeader
    |   |   |--- CardTitle ("Rejestracja")
    |   |   |--- CardDescription
    |   |--- CardContent
    |   |   |--- form (onSubmit: handleSubmit)
    |   |       |--- Label (for "email")
    |   |       |--- Input (email, type="email")
    |   |       |--- Label (for "password")
    |   |       |--- Input (password, type="password")
    |   |       |--- Label (for "confirmPassword")
    |   |       |--- Input (confirmPassword, type="password")
    |   |       |--- (Error Message Display: error)
    |   |       |--- Button (type="submit", text: "Zarejestruj się" / "Rejestrowanie...")
    |   |--- CardFooter
    |       |--- Link to "/login" (LoginForm.tsx)
    |
    |--- AlertDialog (if showSuccessModal is true)
        |--- AlertDialogContent
            |--- AlertDialogHeader
            |   |--- AlertDialogTitle ("Rejestracja Zakończona Pomyślnie!")
            |   |--- AlertDialogDescription
            |--- AlertDialogFooter
                |--- AlertDialogAction (onClick: handleModalOkClick, text: "OK")