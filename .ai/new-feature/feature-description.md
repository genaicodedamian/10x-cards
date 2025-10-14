Opis Funkcjonalności: "Generuj fiszki do nauki języka"
1. Cel Funkcjonalności

Umożliwienie użytkownikom automatycznego generowania zestawów fiszek do nauki języków obcych. System, wykorzystując AI, tworzy 30 unikalnych słów lub zwrotów na podstawie podanej przez użytkownika tematyki oraz wybranych języków dla awersu i rewersu.

2. Dostęp i Nawigacja

Nowa pozycja o nazwie "Generuj fiszki do nauki języka" zostanie dodana w głównym menu na ekranie dashboard.astro.
Kliknięcie w ten element przeniesie użytkownika do dedykowanego widoku generowania fiszek.
3. Widok i Interfejs Użytkownika

Widok będzie zawierał formularz z trzema polami:

Tematyka fiszek: Pole tekstowe, w które użytkownik wpisuje temat (maksymalnie 40 znaków).
Język awersu: Lista rozwijana (dropdown) z opcjami: [polski, angielski, niemiecki, francuski].
Język rewersu: Taka sama lista rozwijana jak dla awersu.
4. Logika Działania

Użytkownik wypełnia formularz i inicjuje proces generowania.
System generuje zestaw 30 unikalnych słów lub zwrotów powiązanych z podaną tematyką.
Każda fiszka zawiera to samo słowo/zwrot w dwóch wybranych językach – jednym na awersie, drugim na rewersie.
Dozwolone jest wybranie tego samego języka dla awersu i rewersu; w takim przypadku na obu stronach fiszki znajdzie się to samo słowo.
5. Proces Generowania i Obsługa Stanów

Podczas generowania fiszek na ekranie wyświetlany jest wskaźnik ładowania z biblioteki shadcn/ui.
W przypadku niepowodzenia generowania (np. błąd API), system wyświetli użytkownikowi przyjazny komunikat o błędzie.
6. Weryfikacja i Zapisywanie Fiszak

Po pomyślnym wygenerowaniu fiszek, użytkownik zostanie przekierowany do widoku weryfikacji.
Na tym etapie użytkownik ma możliwość przejrzenia, edycji lub usunięcia poszczególnych fiszek przed ich ostatecznym zapisaniem.
Nazwa zestawu fiszek jest generowana automatycznie na podstawie tematyki podanej przez użytkownika.
7. Założenia i Ograniczenia

Liczba generowanych fiszek jest stała i wynosi 30.
Lista dostępnych języków jest na ten moment ograniczona do czterech opcji: polski, angielski, niemiecki, francuski.
System dba o to, by wszystkie wygenerowane słowa w ramach jednego zestawu były unikalne.