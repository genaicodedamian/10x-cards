# Plan implementacji widoku Panel Użytkownika

## 1. Przegląd
Panel Użytkownika to prosty komponent nawigacyjny w Top Barze, który umożliwia zalogowanym użytkownikom zarządzanie swoim kontem. Jest zintegrowany z górnym paskiem nawigacyjnym i zapewnia dostęp do funkcji wylogowania oraz usunięcia konta.

## 2. Routing widoku
Panel Użytkownika nie posiada własnej ścieżki routingu, ponieważ jest komponentem nawigacyjnym zintegrowanym z Top Barem. Jest dostępny we wszystkich głównych widokach aplikacji:
- `/dashboard`
- `/generate-ai`
- `/create-manual`
- `/my-flashcards`
- `/study-session/:setId`

## 3. Struktura komponentów
```
TopBar.astro
└── UserMenu.astro
    ├── Button (trigger)
    └── Dialog (potwierdzenie usunięcia konta)
```

## 4. Szczegóły komponentów

### UserMenu.astro
- Opis komponentu: Prosty komponent menu użytkownika w Top Barze
- Główne elementy:
  - Przycisk z emailem użytkownika (trigger)
  - Proste menu rozwijane z opcjami
  - Dialog potwierdzenia usunięcia konta
- Style:
  - Zachowanie obecnego stylu TopBara
  - Menu: tło bg-background, border, shadow
  - Przyciski: hover:bg-accent
- Obsługiwane interakcje:
  - Kliknięcie w przycisk z emailem
  - Kliknięcie opcji wylogowania
  - Kliknięcie opcji usunięcia konta
  - Potwierdzenie/cancel w dialogu usunięcia konta
- Obsługiwana walidacja:
  - Sprawdzanie stanu autentykacji użytkownika
- Propsy:
  - `userEmail: string` - email zalogowanego użytkownika

## 5. Typy
Nie są wymagane nowe typy, ponieważ komponent wykorzystuje wbudowane typy Supabase dla operacji autentykacji.

## 6. Zarządzanie stanem
- Minimalny stan lokalny dla widoczności menu i dialogu
- Wykorzystanie Supabase client do zarządzania stanem autentykacji

## 7. Integracja API
Integracja z Supabase Auth:
- Wylogowanie: `supabase.auth.signOut()`
- Usunięcie konta: `supabase.auth.admin.deleteUser(userId)`

## 8. Interakcje użytkownika
1. Otwarcie menu:
   - Kliknięcie w przycisk z emailem
   - Wyświetlenie menu z opcjami
   - Zamknięcie przez kliknięcie poza menu

2. Wylogowanie:
   - Kliknięcie opcji "Wyloguj"
   - Wywołanie `supabase.auth.signOut()`
   - Przekierowanie na stronę główną (`/`)

3. Usunięcie konta:
   - Kliknięcie opcji "Usuń konto"
   - Wyświetlenie dialogu potwierdzenia
   - Po potwierdzeniu:
     - Wywołanie `supabase.auth.admin.deleteUser()`
     - Przekierowanie na stronę rejestracji (`/register`)

## 9. Warunki i walidacja
- Sprawdzanie stanu autentykacji przed wyświetleniem panelu
- Weryfikacja uprawnień użytkownika przed usunięciem konta

## 10. Obsługa błędów
1. Błędy sieciowe:
   - Wyświetlenie komunikatu o błędzie w formie toast
   - Komunikaty toast:
     - "Nie udało się połączyć z serwerem. Spróbuj ponownie."
     - "Operacja nie powiodła się. Spróbuj ponownie."

2. Błędy autentykacji:
   - Przekierowanie do strony logowania
   - Komunikaty toast:
     - "Sesja wygasła. Zaloguj się ponownie."
     - "Nie masz uprawnień do wykonania tej operacji."

3. Błędy usunięcia konta:
   - Wyświetlenie komunikatu o błędzie
   - Komunikaty toast:
     - "Nie udało się usunąć konta. Spróbuj ponownie."

4. Obsługa kodów błędów Supabase:
   - 401: "Sesja wygasła. Zaloguj się ponownie."
   - 403: "Nie masz uprawnień do wykonania tej operacji."
   - 404: "Nie znaleziono zasobu."
   - 429: "Zbyt wiele prób. Spróbuj ponownie za chwilę."
   - 500: "Wystąpił błąd serwera. Spróbuj ponownie później."

## 11. Kroki implementacji
1. Przygotowanie komponentu Astro:
   - Utworzenie komponentu UserMenu.astro
   - Implementacja podstawowej struktury menu
   - Dodanie przycisku z emailem użytkownika

2. Integracja z TopBarem:
   - Zamiana obecnego placeholdera na nowy komponent
   - Zachowanie obecnego stylu i układu
   - Testy responsywności

3. Implementacja logiki wylogowania:
   - Integracja z Supabase auth.signOut()
   - Obsługa przekierowania po wylogowaniu

4. Implementacja logiki usuwania konta:
   - Dodanie dialogu potwierdzenia
   - Integracja z Supabase auth.admin.deleteUser()
   - Obsługa przekierowania po usunięciu

5. Dodanie obsługi błędów:
   - Implementacja obsługi błędów sieciowych
   - Implementacja obsługi błędów autentykacji
   - Dodanie komunikatów toast

6. Testy i optymalizacja:
   - Testy dostępności
   - Testy responsywności
   - Testy integracyjne z TopBarem
