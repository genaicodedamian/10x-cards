```mermaid
sequenceDiagram
    autonumber

    participant Przeglądarka as P
    participant MiddlewareAstro as MA
    participant API_Astro as API
    participant Supabase_Auth as SA
    participant Supabase_DB as DB

    rect rgb(240, 248, 255)
        Note over P, SA: Rejestracja Użytkownika (US-001)
        P->>SA: supabase.auth.signUp({email, hasło})
        activate SA
        SA-->>P: Sukces: user, session (tokeny) / Błąd
        deactivate SA
        activate P
        P->>P: Zapisz tokeny (localStorage)
        P->>P: Przekierowanie na /dashboard
        deactivate P
    end

    rect rgb(240, 248, 255)
        Note over P, SA: Logowanie Użytkownika (US-002)
        P->>SA: supabase.auth.signInWithPassword({email, hasło})
        activate SA
        SA-->>P: Sukces: user, session (tokeny) / Błąd
        deactivate SA
        activate P
        P->>P: Zapisz tokeny (localStorage)
        P->>P: Przekierowanie na /dashboard
        deactivate P
    end

    rect rgb(230, 240, 255)
        Note over P, DB: Dostęp do Chronionej Strony Astro (np. /dashboard)
        P->>MA: GET /dashboard (z access_token)
        activate MA
        MA->>SA: Weryfikuj token (np. supabase.auth.getUser(token))
        activate SA
        alt Token ważny
            SA-->>MA: Sukces: user (zawiera user_id)
            deactivate SA
            MA->>DB: Pobierz dane strony (używając user_id dla RLS)
            activate DB
            DB-->>MA: Dane strony
            deactivate DB
            MA-->>P: Renderuj stronę /dashboard
            deactivate MA
        else Token nieważny/wygasł
            SA-->>MA: Błąd: Token nieważny
            deactivate SA
            MA-->>P: Odpowiedź 401 Unauthorized
            deactivate MA
            Note over P, SA: Supabase JS SDK automatycznie odświeża token
            activate P
            P->>SA: supabase.auth.refreshSession()
            activate SA
            alt Odświeżenie pomyślne
                SA-->>P: Nowy access_token, nowy refresh_token
                deactivate SA
                P->>P: Zapisz nowe tokeny
                P->>MA: Ponów GET /dashboard (z nowym access_token)
                deactivate P
                MA->>SA: Weryfikuj nowy token
                activate MA
                activate SA
                SA-->>MA: Sukces: user
                deactivate SA
                MA->>DB: Pobierz dane (RLS)
                activate DB
                DB-->>MA: Dane
                deactivate DB
                MA-->>P: Renderuj stronę
                deactivate MA
            else Odświeżenie niepomyślne
                SA-->>P: Błąd odświeżania
                deactivate SA
                P->>P: Usuń tokeny, Przekieruj na /login
                deactivate P
            end
        end
    end

    rect rgb(255, 245, 230)
        Note over P, SA: Reset Hasła - Żądanie (US-010 Faza 1)
        P->>SA: supabase.auth.resetPasswordForEmail(email, {redirectTo})
        activate SA
        Note right of SA: SA wysyła e-mail z linkiem do resetu
        SA-->>P: Potwierdzenie wysłania / Błąd
        deactivate SA
        activate P
        P->>P: Wyświetl komunikat dla użytkownika
        deactivate P
    end

    rect rgb(255, 245, 230)
        Note over P, SA: Reset Hasła - Ustawienie Nowego (US-010 Faza 2)
        P->>P: Użytkownik klika link, strona /reset-password ładuje token
        P->>SA: supabase.auth.updateUser({password: noweHasło})
        activate SA
        SA-->>P: Sukces / Błąd
        deactivate SA
        activate P
        P->>P: Wyświetl komunikat, Przekieruj na /login
        deactivate P
    end

    rect rgb(220, 220, 250)
        Note over P, API: Usunięcie Konta Użytkownika (`DELETE /api/users/me`)
        P->>API: DELETE /api/users/me (z access_token)
        activate API
        API->>SA: Weryfikuj token, pobierz user_id
        activate SA
        SA-->>API: Sukces: user_id / Błąd 401
        deactivate SA
        API->>DB: Usuń dane użytkownika (flashcard_sets, flashcards - CASCADE)
        activate DB
        DB-->>API: Potwierdzenie usunięcia danych z DB
        deactivate DB
        API->>SA: supabase.auth.admin.deleteUser(user_id)
        activate SA
        SA-->>API: Potwierdzenie usunięcia użytkownika z Auth
        deactivate SA
        API-->>P: Odpowiedź 204 No Content
        deactivate API
        activate P
        P->>P: (Automatyczne wylogowanie przez Supabase SDK lub ręczne)
        P->>P: Przekierowanie na /
        deactivate P
    end

    rect rgb(230, 230, 250)
        Note over P, SA: Wylogowanie Użytkownika
        P->>SA: supabase.auth.signOut()
        activate SA
        SA-->>P: Sukces
        deactivate SA
        activate P
        P->>P: Usuń tokeny (localStorage)
        P->>P: Przekierowanie na / (Ekran Startowy)
        deactivate P
    end
```