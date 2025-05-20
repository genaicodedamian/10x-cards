## Komponent StudySessionView.tsx

Komponent `StudySessionView.tsx` jest odpowiedzialny za wyświetlanie interfejsu sesji nauki fiszek. Zarządza stanem aktualnie wyświetlanej fiszki, jej odwróceniem, a także procesem oceny znajomości fiszki przez użytkownika.

### Główne funkcjonalności:

1.  **Wyświetlanie aktualnej fiszki**: Pokazuje przód lub tył fiszki w zależności od stanu `isFlipped`.
2.  **Obsługa odwracania fiszki**: Umożliwia użytkownikowi odwrócenie fiszki poprzez wywołanie funkcji `flipCard`.
3.  **Ocena znajomości fiszki**: Po odwróceniu fiszki, wyświetla przyciski pozwalające użytkownikowi ocenić, czy zna odpowiedź (`rateKnown`) czy nie (`rateUnknown`).
4.  **Śledzenie postępu**: Wyświetla informację o liczbie pozostałych do nauczenia fiszek w stosunku do całkowitej liczby fiszek w zestawie.
5.  **Obsługa końca sesji**: Gdy wszystkie fiszki zostaną przejrzane, wyświetla podsumowanie sesji (`StudyCompletionSummary`).
6.  **Obsługa pustego zestawu**: Jeśli zestaw fiszek jest pusty, wyświetla odpowiedni komunikat.
7.  **Wskaźnik ładowania/przetwarzania**: Pokazuje informację o przetwarzaniu podczas wysyłania oceny fiszki.

### Zależności i struktura komponentów:

Komponent ten korzysta z hooka `useStudySession` do zarządzania logiką sesji nauki. Wykorzystuje również inne komponenty do wyświetlania poszczególnych części interfejsu.

```ascii
StudySessionView.tsx
│
├── useStudySession (Hook)  // Zarządza logiką sesji nauki (aktualna fiszka, stan odwrócenia, postęp, itp.)
│
├── StudyFlashcard.tsx      // Komponent wyświetlający pojedynczą fiszkę (przód/tył)
│   └── FlashcardDto (Typ)  // Struktura danych fiszki
│
├── FlashcardRatingButtons.tsx // Komponent z przyciskami "Wiem" / "Nie wiem"
│
└── StudyCompletionSummary.tsx // Komponent wyświetlający podsumowanie po zakończeniu sesji
```

### Przepływ danych i interakcji:

1.  `StudySessionView` otrzymuje listę fiszek (`flashcards`) i identyfikator zestawu (`setId`) jako props.
2.  Inicjalizuje hook `useStudySession` przekazując mu początkowe fiszki i ID zestawu.
3.  Hook `useStudySession` zarządza stanem:
    *   `currentFlashcard`: Aktualnie wyświetlana fiszka.
    *   `isFlipped`: Boolean wskazujący, czy fiszka jest odwrócona.
    *   `isSessionCompleted`: Boolean wskazujący, czy sesja została zakończona.
    *   `isSubmittingRating`: Boolean wskazujący, czy ocena jest przetwarzana.
    *   `totalFlashcardsInSet`: Całkowita liczba fiszek w zestawie.
    *   `cardsRemainingToLearn`: Liczba fiszek pozostałych do nauczenia.
4.  Na podstawie tych stanów `StudySessionView` renderuje odpowiednie komponenty:
    *   Jeśli sesja jest zakończona (`isSessionCompleted`), renderuje `StudyCompletionSummary`. Specjalny komunikat jest wyświetlany, jeśli początkowa lista fiszek była pusta.
    *   Jeśli nie ma `currentFlashcard` (a sesja nie jest zakończona), wyświetla komunikat ładowania.
    *   W przeciwnym razie, wyświetla licznik postępu, `StudyFlashcard` z aktualną fiszką.
    *   Jeśli fiszka jest odwrócona (`isFlipped`) i ocena nie jest przetwarzana (`!isSubmittingRating`), wyświetla `FlashcardRatingButtons`.
    *   Jeśli ocena jest przetwarzana (`isSubmittingRating`), wyświetla komunikat "Przetwarzanie...".
5.  Interakcje użytkownika:
    *   Kliknięcie na `StudyFlashcard` wywołuje `flipCard` z hooka `useStudySession`.
    *   Kliknięcie przycisków w `FlashcardRatingButtons` wywołuje `rateKnown` lub `rateUnknown` z hooka `useStudySession`.
