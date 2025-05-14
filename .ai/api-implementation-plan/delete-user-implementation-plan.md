# API Endpoint Implementation Plan: DELETE /api/users/me

## 1. Przegląd punktu końcowego
Punkt końcowy `DELETE /api/users/me` umożliwia zalogowanemu użytkownikowi trwałe usunięcie swojego konta oraz wszystkich powiązanych z nim danych, w tym zestawów fiszek i pojedynczych fiszek. Jest to zgodne z wymogami RODO dotyczącymi prawa do usunięcia danych.

## 2. Szczegóły żądania
-   **Metoda HTTP**: `DELETE`
-   **Struktura URL**: `/api/users/me`
-   **Parametry**:
    -   Wymagane: Brak parametrów w URL. Uwierzytelnianie jest obsługiwane przez token JWT w nagłówku `Authorization`.
    -   Opcjonalne: Brak.
-   **Request Body**: Brak (Payload jest pusty).

## 3. Wykorzystywane typy
Żadne konkretne DTO (Data Transfer Objects) ani Command Modele zdefiniowane w `src/types.ts` nie są wymagane dla tego punktu końcowego, ponieważ żądanie nie zawiera ciała, a pomyślna odpowiedź to `204 No Content`.

## 4. Szczegóły odpowiedzi
-   **Odpowiedź sukcesu**:
    -   Kod statusu: `204 No Content`
    -   Ciało odpowiedzi: Puste.
-   **Odpowiedzi błędów**:
    -   Kod statusu: `401 Unauthorized` - Jeśli użytkownik nie jest uwierzytelniony.
    -   Kod statusu: `500 Internal Server Error` - Jeśli wystąpi błąd po stronie serwera podczas procesu usuwania.

## 5. Przepływ danych
1.  Żądanie `DELETE` dociera do endpointu `/api/users/me`.
2.  Astro middleware weryfikuje token JWT użytkownika z nagłówka `Authorization`. Jeśli token jest nieprawidłowy lub go brakuje, zwracany jest błąd `401 Unauthorized`. Dostęp do `context.locals.supabase` i `context.locals.session` jest zapewniony.
3.  Handler API (funkcja `DELETE` w pliku `src/pages/api/users/me.ts`) pobiera ID uwierzytelnionego użytkownika z `context.locals.session.user.id`.
4.  Handler wywołuje metodę w `UserService` (np. `deleteUserAccount(userId)`), przekazując ID użytkownika.
5.  `UserService`:
    a.  Inicjalizuje klienta administracyjnego Supabase przy użyciu `SERVICE_ROLE_KEY` (przechowywanego bezpiecznie jako zmienna środowiskowa).
    b.  Wywołuje `supabase.auth.admin.deleteUser(userId)` w celu usunięcia użytkownika z tabeli `auth.users`.
    c.  Baza danych automatycznie obsługuje usuwanie powiązanych danych:
        i.  Wszystkie rekordy w `flashcard_sets` powiązane z `user_id` są usuwane dzięki `ON DELETE CASCADE`.
        ii. Wszystkie rekordy w `flashcards` powiązane z `user_id` (lub pośrednio przez `set_id`, które jest kaskadowo usuwane) są usuwane dzięki `ON DELETE CASCADE`.
        iii. Wszelkie wpisy w `generation_error_logs` powiązane z `user_id` mają pole `user_id` ustawione na `NULL` dzięki `ON DELETE SET NULL`.
6.  Jeśli operacja w `UserService` zakończy się pomyślnie, handler API zwraca odpowiedź `204 No Content`.
7.  Jeśli operacja w `UserService` napotka błąd (np. problem z klientem administracyjnym Supabase, nieoczekiwany błąd bazy danych), zgłaszany jest błąd. Handler API przechwytuje ten błąd i zwraca `500 Internal Server Error`.

## 6. Względy bezpieczeństwa
-   **Uwierzytelnianie**: Obowiązkowe. Endpoint musi być chroniony przez middleware Astro, które weryfikuje token JWT. Dostęp do `context.locals.supabase` i `context.locals.session` jest kluczowy.
-   **Autoryzacja**: Użytkownik może usunąć tylko własne konto. Jest to niejawnie zapewnione przez pobranie `user_id` z sesji uwierzytelnionego użytkownika.
-   **Uprawnienia administracyjne Supabase**: Operacja `supabase.auth.admin.deleteUser()` wymaga uprawnień administracyjnych. Klient Supabase używany do tej operacji musi być inicjalizowany z kluczem `SERVICE_ROLE_KEY`. Ten klucz musi być traktowany jako sekret i przechowywany bezpiecznie (np. w zmiennych środowiskowych serwera), niedostępny dla frontendu.
-   **Walidacja danych wejściowych**: Nie jest wymagana walidacja ciała żądania, ponieważ jest ono puste.
-   **Ochrona przed CSRF**: Chociaż Astro ma wbudowane pewne zabezpieczenia, należy upewnić się, że są one aktywne. Jednak dla żądań DELETE bez ciała i opartych na tokenach Bearer, ryzyko CSRF jest mniejsze.
-   **Zależność od kaskad**: Integralność danych jest silnie zależna od poprawnie zdefiniowanych reguł `ON DELETE CASCADE` i `ON DELETE SET NULL` w schemacie bazy danych. Te reguły zostały zdefiniowane w `@db-plan.md`.

## 7. Obsługa błędów
-   **`401 Unauthorized`**:
    -   Przyczyna: Brak tokenu JWT, token nieprawidłowy lub wygasły.
    -   Obsługa: Zwracane przez middleware Astro przed dotarciem do logiki endpointu.
-   **`500 Internal Server Error`**:
    -   Przyczyny:
        -   Błąd podczas inicjalizacji klienta administracyjnego Supabase (np. brak `SERVICE_ROLE_KEY`).
        -   Błąd zwrócony przez `supabase.auth.admin.deleteUser()`.
        -   Nieoczekiwany błąd bazy danych podczas operacji kaskadowych (mało prawdopodobne przy poprawnym schemacie).
    -   Obsługa: Handler API powinien zawierać blok `try...catch`. W przypadku błędu, należy zalogować szczegóły błędu po stronie serwera (bez ujawniania wrażliwych danych klientowi) i zwrócić generyczną odpowiedź `500`. Należy unikać wysyłania szczegółowych komunikatów o błędach Supabase do klienta.

## 8. Rozważania dotyczące wydajności
-   Operacja usuwania użytkownika i kaskadowego usuwania danych może być czasochłonna, jeśli użytkownik ma dużą liczbę zestawów fiszek i fiszek.
-   Jest to operacja destrukcyjna i nieodwracalna, więc wydajność jest drugorzędna wobec poprawności i bezpieczeństwa.
-   Nie przewiduje się częstego wywoływania tego endpointu przez pojedynczego użytkownika.
-   Operacje kaskadowe w PostgreSQL są generalnie wydajne, ale ich wpływ należy monitorować w środowisku produkcyjnym przy dużym obciążeniu.

## 9. Etapy wdrożenia
1.  **Konfiguracja środowiska**:
    *   Upewnij się, że zmienna środowiskowa `SUPABASE_SERVICE_ROLE_KEY` jest dostępna w środowisku serwerowym Astro.
2.  **Utworzenie `UserService`**:
    *   Utwórz nowy plik `src/lib/services/user.service.ts`.
    *   Zaimplementuj w nim funkcję `deleteUserAccount(userId: string): Promise<void>`:
        *   Funkcja powinna tworzyć instancję klienta Supabase przy użyciu `SUPABASE_URL` i `SUPABASE_SERVICE_ROLE_KEY`. (Należy pamiętać o bezpiecznym zarządzaniu tym klientem, aby nie był on dostępny globalnie w sposób niezabezpieczony).
        *   Wywołaj `supabase.auth.admin.deleteUser(userId, true)`. Drugi parametr `shouldHardDelete` powinien być `true` dla trwałego usunięcia.
        *   Dodaj obsługę błędów dla wywołania Supabase.
3.  **Implementacja endpointu API Astro**:
    *   Utwórz plik `src/pages/api/users/me.ts`.
    *   Zaimplementuj funkcję `DELETE` (handler metody HTTP).
    *   Użyj `export const prerender = false;` zgodnie z wytycznymi dla API routes.
    *   W handlerze:
        *   Sprawdź, czy `context.locals.session` i `context.locals.session.user` istnieją. Jeśli nie (co nie powinno się zdarzyć, jeśli middleware działa poprawnie), zwróć `401`.
        *   Pobierz `userId` z `context.locals.session.user.id`.
        *   Wywołaj `userService.deleteUserAccount(userId)`.
        *   W bloku `try...catch`:
            *   W przypadku sukcesu, zwróć `new Response(null, { status: 204 })`.
            *   W przypadku błędu, zaloguj błąd po stronie serwera i zwróć `new Response('Internal Server Error', { status: 500 })`.
4.  **Testowanie**:
    *   Napisz testy integracyjne weryfikujące:
        *   Pomyślne usunięcie użytkownika i powiązanych danych (sprawdź, czy dane zniknęły z `flashcard_sets`, `flashcards` i czy `user_id` jest `NULL` w `generation_error_logs`).
        *   Odpowiedź `204 No Content` przy sukcesie.
        *   Odpowiedź `401 Unauthorized` dla nieuwierzytelnionych żądań.
        *   Symuluj błąd Supabase admin API (jeśli to możliwe w środowisku testowym) i sprawdź, czy zwracany jest `500 Internal Server Error`.
5.  **Dokumentacja**:
    *   Zaktualizuj dokumentację API (np. Swagger/OpenAPI, jeśli jest używana), aby odzwierciedlić ten endpoint. Ten plan może służyć jako podstawa.
6.  **Przegląd kodu**:
    *   Przeprowadź przegląd kodu, zwracając szczególną uwagę na aspekty bezpieczeństwa (obsługa `SERVICE_ROLE_KEY`) i poprawność logiki usuwania.
