# Dokument wymagań produktu (PRD) – 10x-cards

## 1. Przegląd produktu
Projekt 10x-cards ma na celu umożliwienie użytkownikom szybkiego tworzenia i zarządzania zestawami fiszek edukacyjnych. Aplikacja wykorzystuje modele LLM (poprzez API) do generowania sugestii fiszek na podstawie dostarczonego tekstu.

## 2. Problem użytkownika
Manualne tworzenie wysokiej jakości fiszek wymaga dużych nakładów czasu i wysiłku, co zniechęca do korzystania z efektywnej metody nauki, jaką jest spaced repetition. Celem rozwiązania jest skrócenie czasu potrzebnego na tworzenie odpowiednich pytań i odpowiedzi oraz uproszczenie procesu zarządzania materiałem do nauki.

## 3. Wymagania funkcjonalne
1. Automatyczne generowanie fiszek:
   - Użytkownik wkleja dowolny tekst (np. fragment podręcznika).
   - Aplikacja wysyła tekst do modelu LLM za pośrednictwem API.
   - Model LLM proponuje zestaw fiszek (pytania i odpowiedzi).
   - Fiszki są przedstawiane użytkownikowi w formie listy z możliwością akceptacji, edycji lub odrzucenia.

2. Ręczne tworzenie i zarządzanie fiszkami:
   - Formularz do ręcznego tworzenia fiszek (przód i tył fiszki).
   - Opcje edycji i usuwania istniejących fiszek.
   - Ręczne tworzenie i wyświetlanie w ramach widoku listy "Moje fiszki"

3. Podstawowy system uwierzytelniania i kont użytkowników:
   - Rejestracja i logowanie.
   - Możliwość usunięcia konta i powiązanych fiszek na życzenie.

4. Integracja z algorytmem powtórek:
   - Zapewnienie mechanizmu przypisywania fiszek do harmonogramu powtórek (korzystanie z gotowego algorytmu).
   - Brak dodatkowych metadanych i zaawansowanych funkcji powiadomień w MVP.

5. Przechowywanie i skalowalność:
   - Dane o fiszkach i użytkownikach przechowywane w sposób zapewniający skalowalność i bezpieczeństwo.

6. Statystyki generowania fiszek:
   - Zbieranie informacji o tym, ile fiszek zostało wygenerowanych przez AI i ile z nich ostatecznie zaakceptowano.

7. Wymagania prawne i ograniczenia:
   - Dane osobowe użytkowników i fiszek przechowywane zgodnie z RODO.
   - Prawo do wglądu i usunięcia danych (konto wraz z fiszkami) na wniosek użytkownika.

## 4. Granice produktu
1. Poza zakresem MVP:
   - Zaawansowany, własny algorytm powtórek (korzystamy z gotowego rozwiązania, biblioteki open-source).
   - Mechanizmy gamifikacji.
   - Aplikacje mobilne (obecnie tylko wersja web).
   - Import wielu formatów dokumentów (PDF, DOCX itp.).
   - Publicznie dostępne API.
   - Współdzielenie fiszek między użytkownikami.
   - Rozbudowany system powiadomień.
   - Zaawansowane wyszukiwanie fiszek po słowach kluczowych.
   - Zaawansowana regeneracja pojedynczych fiszek z wykorzystaniem AI (poza ich standardową edycją manualną)(ale to będzie dopiero w dalszym wdrozeniu aplikacji, nie zajmujemy sie tym w obecnym scope projektu)

## 5. Historyjki użytkowników

ID: US-000
Tytuł: Ekran Startowy dla niezalogowanego użytkownika
Opis: Jako niezalogowany użytkownik odwiedzający aplikację po raz pierwszy (lub po wylogowaniu) chcę zobaczyć prosty ekran startowy z nazwą aplikacji i jasnymi opcjami przejścia do logowania lub rejestracji.
Kryteria akceptacji:
- Główna strona aplikacji (`/`) dla niezalogowanych użytkowników to Ekran Startowy.
- Na Ekranie Startowym widoczna jest nazwa aplikacji (np. "10x-cards") w czytelny sposób.
- Na Ekranie Startowym znajdują się dwa wyraźne przyciski: "Zaloguj się" (prowadzący do `/login`) oraz "Zarejestruj się" (prowadzący do `/register`).
- Ekran jest minimalistyczny i skupia się na tych dwóch akcjach.

ID: US-001
Tytuł: Rejestracja konta
Opis: Jako nowy użytkownik chcę się zarejestrować, aby mieć dostęp do własnych fiszek i móc korzystać z generowania fiszek przez AI.
Kryteria akceptacji:
- Formularz rejestracyjny na stronie `/register` zawiera pola na adres e-mail, hasło i potwierdzenie hasła.
- Po poprawnym wypełnieniu formularza i weryfikacji danych konto jest aktywowane.
- Użytkownik otrzymuje potwierdzenie pomyślnej rejestracji (np. komunikat toast na następnym ekranie) i zostaje automatycznie zalogowany oraz przekierowany na `/dashboard`.

ID: US-002
Tytuł: Logowanie do aplikacji
Opis: Jako zarejestrowany użytkownik chcę móc się zalogować, aby mieć dostęp do moich fiszek i historii generowania.
Kryteria akceptacji:
- Formularz logowania na stronie `/login` zawiera pola na adres e-mail i hasło.
- Po podaniu prawidłowych danych logowania użytkownik zostaje przekierowany na `/dashboard`.
- Błędne dane logowania wyświetlają komunikat o nieprawidłowych danych na stronie logowania.
- Dane dotyczące logowania przechowywane są w bezpieczny sposób.

ID: US-002a
Tytuł: Dostęp do Głównego Panelu Nawigacyjnego (Dashboard)
Opis: Jako zalogowany użytkownik, po pomyślnym zalogowaniu lub rejestracji, chcę zostać przekierowany na główny panel nawigacyjny (Dashboard), który umożliwi mi łatwy dostęp do kluczowych funkcji aplikacji.
Kryteria akceptacji:
- Po zalogowaniu lub rejestracji użytkownik jest automatycznie przekierowywany na ekran Dashboard (`/dashboard`).
- Ekran Dashboard jest głównym punktem startowym dla zalogowanego użytkownika.
- Na Dashboardzie znajdują się co najmniej trzy wyraźne opcje nawigacyjne (np. przyciski lub klikalne karty):
    - "Generuj fiszki z AI" (prowadzący do ekranu `/generate-ai`).
    - "Stwórz fiszki manualnie" (prowadzący do ekranu `/create-manual`).
    - "Moje zestawy fiszek" (prowadzący do ekranu `/my-flashcards`).
- Dashboard jest przejrzysty i umożliwia szybkie rozpoczęcie pracy z aplikacją.

ID: US-003
Tytuł: Generowanie fiszek przy użyciu AI
Opis: Jako zalogowany użytkownik chcę przejść z Dashboardu do ekranu generowania fiszek AI, wkleić kawałek tekstu i za pomocą przycisku wygenerować propozycje fiszek, aby zaoszczędzić czas na ręcznym tworzeniu pytań i odpowiedzi.
Kryteria akceptacji:
- Na ekranie `/generate-ai` znajduje się pole tekstowe, w którym użytkownik może wkleić swój tekst (wymagana długość 1000-10000 znaków, z walidacją i licznikiem).
- Po kliknięciu przycisku "Generate Flashcards" aplikacja komunikuje się z API modelu LLM.
- Wyświetlana jest lista wygenerowanych propozycji fiszek (przód i tył) z opcjami ich akceptacji, edycji (w modalu) lub odrzucenia.
- Użytkownik może zapisać zaakceptowane lub wszystkie fiszki jako *nowy zestaw*, nadając mu nazwę w osobnym modalu.
- W przypadku problemów z API lub braku odpowiedzi modelu użytkownik zobaczy stosowny komunikat o błędzie.

ID: US-004
Tytuł: Przegląd i zatwierdzanie propozycji fiszek (w procesie generowania AI)
Opis: Jako zalogowany użytkownik na ekranie generowania AI chcę móc przeglądać wygenerowane fiszki i decydować, które z nich chcę dodać do mojego nowego zestawu, aby zachować tylko przydatne pytania i odpowiedzi.
Kryteria akceptacji:
- Lista wygenerowanych fiszek jest wyświetlana na ekranie `/generate-ai`.
- Przy każdej fiszce znajdują się ikony pozwalające na jej zatwierdzenie (zaakceptowanie), edycję (w modalu) lub odrzucenie (usunięcie z listy propozycji).
- Po wybraniu fiszek i kliknięciu przycisku zapisu (np. "Save accepted" lub "Save all"), użytkownik jest proszony o nadanie nazwy nowemu zestawowi w modalu, a następnie fiszki są zapisywane w bazie danych jako nowy zestaw.

ID: US-005
Tytuł: Edycja fiszek przed zapisaniem zestawu
Opis: Jako zalogowany użytkownik chcę edytować proponowane przez AI fiszki (na ekranie `/generate-ai`) lub ręcznie dodawane fiszki (na ekranie `/create-manual`) *przed* ich finalnym zapisaniem jako nowy zestaw, aby poprawić ewentualne błędy lub dostosować treść.
Kryteria akceptacji:
- Na ekranie `/generate-ai`, przy każdej sugerowanej fiszce istnieje opcja "Edytuj", która otwiera modal umożliwiający zmianę przodu i tyłu fiszki.
- Na ekranie `/create-manual`, po dodaniu fiszki do tymczasowej listy, istnieje opcja "Edytuj", która otwiera modal umożliwiający zmianę przodu i tyłu tej fiszki.
- Zmiany są odzwierciedlane w propozycji/tymczasowej liście i uwzględniane przy zapisywaniu nowego zestawu.
- (Uwaga: Edycja fiszek w już istniejących, zapisanych zestawach nie jest objęta zakresem MVP UI).

ID: US-006
Tytuł: Odrzucanie/Usuwanie fiszek przed zapisaniem zestawu
Opis: Jako zalogowany użytkownik chcę odrzucać niechciane sugestie AI (na ekranie `/generate-ai`) lub usuwać błędnie dodane fiszki (na ekranie `/create-manual`) *przed* ich finalnym zapisaniem jako nowy zestaw.
Kryteria akceptacji:
- Na ekranie `/generate-ai`, przy każdej sugerowanej fiszce istnieje opcja "Odrzuć", która usuwa ją z listy propozycji.
- Na ekranie `/create-manual`, przy każdej fiszce na tymczasowej liście istnieje opcja "Usuń", która usuwa ją z tej listy.
- Te fiszki nie są uwzględniane przy zapisywaniu nowego zestawu.
- (Uwaga: Usuwanie pojedynczych fiszek z już istniejących, zapisanych zestawów nie jest objęte zakresem MVP UI. Możliwe jest usuwanie całych zestawów).

ID: US-007
Tytuł: Ręczne tworzenie nowego zestawu fiszek
Opis: Jako zalogowany użytkownik chcę przejść z Dashboardu do dedykowanego ekranu ręcznego tworzenia fiszek, aby móc dodawać własne fiszki (określając przód i tył) i zapisać je jako nowy zestaw.
Kryteria akceptacji:
- Z Dashboardu dostępny jest ekran `/create-manual`.
- Na ekranie `/create-manual` znajduje się przycisk "+ Stwórz nową fiszkę", który otwiera modal/formularz z polami "Przód" i "Tył".
- Po zapisaniu danych w modalu/formularzu, nowa fiszka pojawia się na tymczasowej liście na tym ekranie, z opcjami edycji i usunięcia.
- Użytkownik może dodać wiele fiszek do tymczasowej listy.
- Po przygotowaniu fiszek, użytkownik klika przycisk "Zapisz zestaw fiszek", wprowadza nazwę dla nowego zestawu w modalu, a fiszki są zapisywane w bazie danych.

ID: US-008
Tytuł: Sesja nauki z algorytmem powtórek
Opis: Jako zalogowany użytkownik chcę móc wybrać jeden z moich zapisanych zestawów fiszek i rozpocząć sesję nauki opartą na prostym algorytmie powtórek, aby efektywnie przyswajać materiał.
Kryteria akceptacji:
- Z ekranu `/my-flashcards` (Moje zestawy fiszek) mogę wybrać zestaw i kliknąć "Rozpocznij naukę", co przenosi mnie na ekran `/study-session/:setId`.
- Na ekranie sesji nauki wyświetlany jest przód fiszki. Po kliknięciu użytkownik widzi tył oraz przyciski "Umiem" (zielony) i "Nie umiem" (czerwony).
- Fiszki oznaczone jako "Nie umiem" są powtarzane w tej samej sesji, aż wszystkie zostaną oznaczone jako "Umiem".
- Po zakończeniu sesji (wszystkie fiszki "Umiem"), wyświetlany jest komunikat o ukończeniu i przycisk powrotu do Dashboardu.
- Użytkownik nie może opuścić sesji nauki przed jej ukończeniem.

ID: US-009
Tytuł: Bezpieczny dostęp i autoryzacja
Opis: Jako zalogowany użytkownik chcę mieć pewność, że moje zestawy fiszek i fiszki nie są dostępne dla innych użytkowników, aby zachować prywatność i bezpieczeństwo danych.
Kryteria akceptacji:
- Tylko zalogowany użytkownik może wyświetlać, tworzyć i usuwać swoje zestawy fiszek oraz przeprowadzać na nich sesje nauki.
- Mechanizmy autoryzacji (np. RLS w bazie danych) zapewniają, że użytkownik ma dostęp wyłącznie do swoich danych.

## 6. Metryki sukcesu
1. Efektywność generowania fiszek:
   - 75% wygenerowanych przez AI fiszek jest akceptowanych przez użytkownika.
   - Użytkownicy tworzą co najmniej 75% fiszek z wykorzystaniem AI (w stosunku do wszystkich nowo dodanych fiszek).
3. Zaangażowanie:
   - Monitorowanie liczby wygenerowanych fiszek i porównanie z liczbą zatwierdzonych do analizy jakości i użyteczności.
