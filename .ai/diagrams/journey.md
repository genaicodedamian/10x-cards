

```mermaid
stateDiagram-v2
    direction LR
    [*] --> Niezalogowany

    state Niezalogowany {
        [*] --> EkranStartowy
        EkranStartowy: "/" - Nazwa aplikacji, opcje Logowania/Rejestracji
        note right of EkranStartowy
            US-000: Ekran Startowy
            Użytkownik widzi opcje:
            - Zaloguj się
            - Zarejestruj się
        end note

        EkranStartowy --> StronaLogowania: Klik "Zaloguj się"
        EkranStartowy --> StronaRejestracji: Klik "Zarejestruj się"

        state StronaLogowania {
            [*] --> FormularzLogowania
            FormularzLogowania: "/login" - Pola e-mail, hasło
            note right of FormularzLogowania
                US-002: Logowanie
                - Pola na e-mail i hasło.
                - Link "Zapomniałeś hasła?".
                - Link "Nie masz konta? Zarejestruj się".
            end note
            FormularzLogowania --> WeryfikacjaKredensjali <<choice>> : Wpisano dane, klik "Zaloguj się"
            WeryfikacjaKredensjali --> Zalogowany_Dashboard : Dane poprawne
            WeryfikacjaKredensjali --> FormularzLogowania : Dane niepoprawne (komunikat błędu)
            FormularzLogowania --> StronaZapomnialemHasla : Klik "Zapomniałeś hasła?"
            FormularzLogowania --> StronaRejestracji : Klik "Nie masz konta? Zarejestruj się"
        }

        state StronaRejestracji {
            [*] --> FormularzRejestracji
            FormularzRejestracji: "/register" - Pola e-mail, hasło, powtórz hasło
            note right of FormularzRejestracji
                US-001: Rejestracja
                - Pola na e-mail, hasło, potwierdzenie.
                - Wymagania dot. hasła (min. 7 znaków).
                - Link "Masz już konto? Zaloguj się".
            end note
            FormularzRejestracji --> WalidacjaDanychRejestracji <<choice>> : Wpisano dane, klik "Zarejestruj się"
            WalidacjaDanychRejestracji --> Zalogowany_Dashboard : Sukces (konto utworzone, auto-login)
            WalidacjaDanychRejestracji --> FormularzRejestracji : Błąd walidacji (np. email zajęty, hasło za krótkie, komunikat błędu)
            FormularzRejestracji --> StronaLogowania : Klik "Masz już konto? Zaloguj się"
        }

        state StronaZapomnialemHasla {
            [*] --> FormularzEmailDoResetu
            FormularzEmailDoResetu: "/forgot-password" - Pole e-mail
            note right of FormularzEmailDoResetu
                US-010: Resetowanie hasła (Faza 1)
                - Formularz do wprowadzenia adresu e-mail.
                - Link "Wróć do logowania".
            end note
            FormularzEmailDoResetu --> KomunikatOWyslaniuInstrukcji : Klik "Wyślij link" (email wysłany)
            KomunikatOWyslaniuInstrukcji: Komunikat "Jeśli konto istnieje, wysłano instrukcję"
            KomunikatOWyslaniuInstrukcji --> StronaLogowania : Użytkownik wraca lub czeka na email
            FormularzEmailDoResetu --> StronaLogowania : Klik "Wróć do logowania"
            KomunikatOWyslaniuInstrukcji --> OczekiwanieNaEmailResetujacy
        }
        OczekiwanieNaEmailResetujacy --> StronaResetowaniaHasla : Użytkownik klika link w emailu

        state StronaResetowaniaHasla {
            [*] --> FormularzNowegoHasla
            state "\"/reset-password/:token\" - Pola nowe hasło, powtórz nowe hasło" as FormularzNowegoHasla
            note right of FormularzNowegoHasla
                US-010: Resetowanie hasła (Faza 2)
                - Wprowadzenie nowego hasła i potwierdzenia.
                - Walidacja hasła (min. 7 znaków).
            end note
            FormularzNowegoHasla --> WalidacjaTokenaIHasla <<choice>> : Klik "Ustaw nowe hasło"
            WalidacjaTokenaIHasla --> KomunikatOPoprawnejZmianieHasla : Sukces (hasło zmienione)
            WalidacjaTokenaIHasla --> FormularzNowegoHasla : Błąd (token, hasła niezgodne, za krótkie, komunikat błędu)
            KomunikatOPoprawnejZmianieHasla: Komunikat "Hasło zmienione, możesz się zalogować"
            KomunikatOPoprawnejZmianieHasla --> StronaLogowania
        }
    }

    state Zalogowany_Dashboard {
        note left of Zalogowany_Dashboard
            US-002a: Dostęp do Dashboardu
            Użytkownik jest na "/dashboard".
            Komunikat toast o pomyślnym logowaniu/rejestracji.
            Opcje nawigacyjne:
            - Generuj fiszki z AI
            - Stwórz fiszki manualnie
            - Moje zestawy fiszek
        end note
        Zalogowany_Dashboard --> DzialaniaWAplikacji : Nawigacja do funkcji
        DzialaniaWAplikacji : Stan reprezentujący korzystanie z funkcji aplikacji
        DzialaniaWAplikacji --> Zalogowany_Dashboard : Powrót do Dashboard
        Zalogowany_Dashboard --> MenuUzytkownika_Akcje
    }

    state MenuUzytkownika_Akcje {
         --> Wylogowanie : Klik "Wyloguj" w menu użytkownika
         --> DialogPotwierdzeniaUsunieciaKonta : Klik "Usuń konto" w menu użytkownika
    }
    Wylogowanie --> EkranStartowy : Użytkownik wylogowany
    DialogPotwierdzeniaUsunieciaKonta: Potwierdzenie usunięcia konta
    DialogPotwierdzeniaUsunieciaKonta --> EkranStartowy : Klik "Usuń" (konto usunięte)
    DialogPotwierdzeniaUsunieciaKonta --> Zalogowany_Dashboard : Klik "Anuluj"


    EkranStartowy --> [*]
    Zalogowany_Dashboard --> [*]
```