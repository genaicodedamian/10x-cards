<conversation_summary>
<decisions>
1.  **UI Stacking/Navigation**:
    *   A central **Dashboard** screen will be the main entry point after login. It will feature three primary navigation buttons: "Generuj fiszki z AI", "Stwórz fiszki manualnie", and "Moje zestawy fiszek".
    *   All functional screens (Generate AI, Create Manual, My Flashcards, Study Session) will provide a way to return to the Dashboard.
    *   A top navigation bar (using Shadcn/ui Navigation Menu) will provide a persistent link to the Dashboard, User Panel (for logout/delete account), and wylogowanie.
2.  **Screen 1: Generate AI Flashcards (`/generate-ai`)**:
    *   H1: "Generate Flashcards".
    *   Large text input area for source text (1000-10000 characters). Live character count (`current/max`) will be displayed. Validation will prevent generation if character count is outside limits, showing an appropriate message.
    *   Button: "Generate Flashcards".
    *   After successful generation:
        *   A 3-column grid will display suggested flashcards. Each card shows "Przód" and "Tył".
        *   Each card has three icon-buttons:
            *   "Akceptuj" (tick): Marks the card for saving.
            *   "Edytuj" (pencil): Opens a modal to edit "Przód" and "Tył". Edited cards are automatically marked "akceptowane".
            *   "Odrzuć" (cross): Removes the suggestion.
        *   Buttons below suggestions: "Save accepted" and "Save all". These are active only if there are relevant cards.
        *   Clicking "Save accepted" or "Save all" opens a modal prompting the user to enter a name for the new flashcard set (max 100 characters, required field with simple validation).
    *   AI-generated flashcards always create a *new* set.
    *   Styling for `validation_status: 'truncated'` or `'rejected'` cards: Slightly different background, not pre-selected as "accepted". A tooltip on hover can show `validation_message`.
    *   No specific loader for AI generation in MVP; successful generation directly displays results. (Though a simple spinner was recommended if feasible).
    *   Error handling: Simple error messages. For LLM service failures (500/503), a popup recommending a retry. For rate limits (429), an error message.
3.  **Screen 2: Create Manual Flashcards (`/create-manual`)**:
    *   Button: "+ Stwórz nową fiszkę".
    *   Clicking this button opens a modal/form to input "Przód" and "Tył".
    *   After saving in the modal, the flashcard is added to a temporary list (stored in local component state) displayed on this screen in a grid.
    *   Each card in the temporary list shows "Przód", "Tył", and icon-buttons:
        *   "Edytuj" (pencil): Re-opens the modal/form with card data to allow editing.
        *   "Usuń" (cross): Removes the card from the temporary list.
    *   Button below the list: "Zapisz zestaw fiszek". This opens a modal for the user to enter a name for the new set (max 100 characters, required).
4.  **Screen 3: My Flashcards (`/my-flashcards`)**:
    *   Displays a list of the user's flashcard sets.
    *   Each list item shows: Set Name, number of flashcards in the set, and date of creation/modification.
    *   Each list item has two actions:
        *   Button: "Rozpocznij naukę" (navigates to Study Session screen for that set).
        *   Icon-button: "Usuń zestaw" (opens a confirmation modal before deleting via API).
    *   No editing of set names from this screen in MVP.
5.  **Screen 4: Study Session (`/study-session/{setId}`)**:
    *   Presents one flashcard at a time from the selected set.
    *   Initially, only the "Przód" of the flashcard is visible.
    *   Clicking on the flashcard reveals its "Tył".
    *   Below the revealed "Tył", two buttons appear:
        *   Green button ("Umiem" / "Poprawnie"): Indicates the user answered correctly.
        *   Red button ("Nie umiem" / "Niepoprawnie" / "Powtórz"): Indicates the user answered incorrectly.
    *   Logic:
        *   If Green is clicked, the card is considered learned for this session and won't be shown again in this session.
        *   If Red is clicked, the card will be shown again later in the current session after all other cards in the current round have been presented.
    *   The session continues, presenting the next card from the current round.
    *   Once all cards in the initial round are presented, a new round begins with only the cards marked Red.
    *   The session ends when all flashcards in the set have been marked Green in a round.
    *   Upon completion, a simple message "Gratulacje! Ukończyłeś naukę tego zestawu." is displayed, along with a button "Wróć do Dashboardu".
    *   There is no way to exit the study session prematurely; the user must complete it. Session progress is lost if the user navigates away (e.g., by refreshing or using browser back).
6.  **Screen 5: User Panel (accessible from top bar)**:
    *   Provides options for: "Wyloguj" and "Usuń konto" (with confirmation).
7.  **Screen 6: Authentication Screens (Login/Register)**:
    *   Standard forms for email/password. Managed by Supabase Auth.
8.  **Flashcard Component**:
    *   A reusable React component for displaying a single flashcard (Przód, Tył, action icons). Icons will be configurable based on context (AI suggestion, manually added card).
    *   "Przód" and "Tył" are the only editable content fields for a flashcard.
9.  **API Interaction & State Management**:
    *   Zustand for client-side state management, kept simple for MVP.
    *   Data (flashcards, sets) is saved to the backend only upon explicit user action (e.g., "Save all", "Save accepted", "Zapisz zestaw fiszek"). No in-progress saving.
    *   AI suggestions are held in client state until saved. Manually created flashcards (before set creation) are held in local component state.
    *   Source for flashcards:
        *   `manual`: For manually created cards.
        *   `ai_generated`: For AI suggestions accepted without edits.
        *   `ai_generated_modified`: For AI suggestions accepted after user edits.
    *   A "toast" notification will appear on the Dashboard after a new set is successfully created.
10. **Technical Aspects**:
    *   Responsiveness: Achieved using Shadcn/ui and Tailwind CSS.
    *   Accessibility: Target WCAG AA.
    *   Styling: Default Tailwind styles, components from Shadcn/ui.
    *   JWT Authentication: Managed by Supabase client SDK. UI handles redirects for logged-in/out states.
11. **Out of Scope for MVP**:
    *   Adding AI-generated flashcards to an existing set.
    *   Automated set naming (e.g., "Set {i+1}").
    *   Advanced AI-powered regeneration of individual flashcards (API endpoint `POST /api/flashcards/{flashcardId}/regenerate` is for future use).
    *   Complex loaders/animations for data operations (beyond simple spinners if easily added).
    *   Client-side caching strategies (localStorage/IndexedDB).
    *   "Cancel" or "Clear" buttons on generation/creation screens (user can refresh).
    *   Editing flashcard set names after creation.
    *   Saving/persisting study session progress if interrupted.
    *   Advanced error recovery beyond simple messages and retry prompts.
</decisions>
<matched_recommendations>
1.  **Dashboard Implementation:** Create a central dashboard for main navigation paths (Generate AI, Create Manual, My Sets). Docelowe ekrany powinny umożliwiać powrót do dashboardu.
2.  **Dedicated Creation Screens:** Implement two separate screens: `/generate-ai` for AI-assisted flashcard generation and `/create-manual` for manual creation, simplifying UI logic.
3.  **Modal for Set Naming:** Use a modal to prompt the user for a set name when saving flashcards from both AI generation and manual creation flows.
4.  **Manual Creation Flow:** Use a button like "+ Stwórz nową fiszkę" on `/create-manual`. Clicking it opens a modal/form for front/back input. Saved flashcards are added to a temporary list on the screen (local component state) in "preview" mode with edit/delete icons. A "Zapisz zestaw fiszek" button below this list triggers the naming modal.
5.  **AI Suggestion Card UI:** Display front, back, and icons for "Akceptuj" (visual mark), "Edytuj" (opens modal, auto-accepts), and "Odrzuć".
6.  **Navigation Post-Set Save:** Redirect user to the Dashboard after successfully saving a new flashcard set. Display a toast notification on the Dashboard confirming creation.
7.  **"My Flashcards" Screen UI:** List sets with name, card count, and creation/modification dates. Each set should have "Rozpocznij naukę" button and a "Usuń zestaw" icon (with confirmation modal).
8.  **Study Session Flow:** Implement the detailed turn-based logic for presenting cards, revealing answers, and using "Umiem" (Green) / "Nie umiem" (Red) buttons to manage session progress, repeating red-marked cards until all are green. End with a completion message and a button to return to Dashboard. Session state is not persisted if interrupted.
9.  **Reusable Flashcard Component:** Develop a common React component for displaying flashcards, configurable for different contexts (AI suggestions, manual list).
10. **Top Navigation Bar:** Use Shadcn/ui Navigation Menu for a top bar with a persistent link to Dashboard, User Panel, and Logout.
11. **Error Handling for `validation_status` (AI):** Visually differentiate 'truncated' or 'rejected' AI suggestions (e.g., different background) and optionally use tooltips for `validation_message`.
12. **Input Validation (AI Text Length):** Implement client-side validation for the AI generation text input (1000-10000 characters) with a live character counter and error messages.
13. **State Management with Zustand:** Utilize Zustand for managing relevant client-side state, keeping it simple for MVP.
14. **Authentication via Supabase:** Rely on Supabase client SDK for JWT management and session handling.
</matched_recommendations>
<ui_architecture_planning_summary>
    **a. Główne wymagania dotyczące architektury UI**
    Architektura UI dla MVP będzie skupiona wokół centralnego **Dashboardu**, który służy jako główny węzeł nawigacyjny po zalogowaniu. Z Dashboardu użytkownik będzie miał dostęp do trzech głównych sekcji: generowania fiszek za pomocą AI, manualnego tworzenia fiszek oraz przeglądania swoich zestawów fiszek. Nawigacja będzie realizowana również poprzez stały górny pasek (Top Bar) stworzony przy użyciu Shadcn/ui, zawierający link do Dashboardu, panelu użytkownika (wylogowanie, usuwanie konta) oraz opcję wylogowania. Kluczowe jest uproszczenie przepływów i zapewnienie jasnej informacji zwrotnej dla użytkownika.

    **b. Kluczowe widoki, ekrany i przepływy użytkownika**
    *   **`/dashboard` (Dashboard):** Ekran startowy po logowaniu. Zawiera trzy przyciski nawigacyjne:
        *   "Generuj fiszki z AI" -> `/generate-ai`
        *   "Stwórz fiszki manualnie" -> `/create-manual`
        *   "Moje zestawy fiszek" -> `/my-flashcards`
    *   **`/generate-ai` (Generowanie fiszek AI):**
        1.  Użytkownik wkleja tekst (1000-10000 znaków, walidacja z licznikiem).
        2.  Klika "Generate Flashcards".
        3.  Wyświetlane są sugerowane fiszki w siatce (przód, tył, ikony: Akceptuj, Edytuj, Odrzuć). Edycja przez modal.
        4.  Użytkownik klika "Save accepted" lub "Save all".
        5.  Pojawia się modal do wprowadzenia nazwy nowego zestawu.
        6.  Po zapisie -> przekierowanie na `/dashboard` z komunikatem toast.
    *   **`/create-manual` (Manualne tworzenie fiszek):**
        1.  Użytkownik klika "+ Stwórz nową fiszkę".
        2.  Otwiera się modal/formularz do wpisania przodu i tyłu.
        3.  Po zapisie fiszki, pojawia się ona na tymczasowej liście na ekranie (w trybie podglądu, z ikonami Edytuj/Usuń).
        4.  Użytkownik może dodać więcej fiszek.
        5.  Użytkownik klika "Zapisz zestaw fiszek".
        6.  Pojawia się modal do wprowadzenia nazwy nowego zestawu.
        7.  Po zapisie -> przekierowanie na `/dashboard` z komunikatem toast.
    *   **`/my-flashcards` (Moje zestawy fiszek):**
        1.  Wyświetla listę zestawów (nazwa, liczba kart, daty).
        2.  Przy każdym zestawie: przycisk "Rozpocznij naukę" (-> `/study-session/{setId}`) i ikona "Usuń zestaw" (z modalem potwierdzającym).
    *   **`/study-session/{setId}` (Sesja Nauki):**
        1.  Wyświetla przód pierwszej fiszki.
        2.  Kliknięcie na fiszkę odkrywa tył i przyciski "Umiem" (zielony) / "Nie umiem" (czerwony).
        3.  Logika powtórek: czerwone karty są prezentowane ponownie w tej samej sesji, aż wszystkie zostaną oznaczone jako zielone.
        4.  Po ukończeniu wszystkich fiszek: komunikat "Gratulacje..." i przycisk "Wróć do Dashboardu".
        5.  Brak możliwości wcześniejszego opuszczenia sesji; postęp nie jest zapisywany w przypadku przerwania.
    *   **Ekrany autentykacji (Login/Register):** Standardowe formularze.
    *   **Panel Użytkownika:** Dostępny z Top Baru, opcje wylogowania i usunięcia konta.

    **c. Strategia integracji z API i zarządzania stanem**
    *   **API:** Wykorzystanie zdefiniowanych endpointów w `@api-plan.md` (z wyłączeniem regeneracji AI pojedynczej fiszki dla MVP). Kluczowe operacje: tworzenie zestawów, tworzenie fiszek (w tym wsadowe dla AI), pobieranie zestawów, pobieranie fiszek z zestawu, usuwanie zestawów, usuwanie użytkownika.
    *   **Zarządzanie stanem:** Zustand zostanie użyty do globalnego stanu klienta (np. status autentykacji, być może dane użytkownika). Stan tymczasowy dla tworzonych fiszek (sugestie AI przed zapisem, ręcznie dodawane fiszki przed utworzeniem zestawu) będzie zarządzany w stanie lokalnym komponentów React lub dedykowanych, prostych store'ach Zustand.
    *   **Synchronizacja danych:** Dane są wysyłane do API tylko w momencie jawnej akcji zapisu przez użytkownika. Po pomyślnym zapisie, UI jest resetowane lub użytkownik jest przekierowywany, a ewentualne listy (np. zestawów) powinny być odświeżane przy następnym wejściu na odpowiedni ekran (lub poprzez toast i przekierowanie na Dashboard).
    *   **Obsługa błędów API:** Proste komunikaty o błędach dla użytkownika. Dla błędów 500/503 z LLM, rekomendacja ponowienia próby.

    **d. Kwestie dotyczące responsywności, dostępności i bezpieczeństwa**
    *   **Responsywność:** Aplikacja będzie responsywna, zbudowana z użyciem Tailwind CSS i komponentów Shadcn/ui.
    *   **Dostępność:** Celem jest osiągnięcie standardu WCAG AA, wykorzystując wbudowane funkcje dostępności komponentów Shadcn/ui i stosując dobre praktyki.
    *   **Bezpieczeństwo:** Uwierzytelnianie i autoryzacja będą zarządzane przez Supabase Auth (JWT). UI będzie obsługiwać stany zalogowany/niezalogowany i chronić odpowiednie trasy. Wszystkie operacje na danych będą autoryzowane na podstawie JWT użytkownika, a RLS po stronie bazy danych zapewni izolację danych.

    **e. Wszelkie nierozwiązane kwestie lub obszary wymagające dalszego wyjaśnienia**
    *   Na ten moment, wszystkie kluczowe aspekty dla MVP wydają się być omówione i zdecydowane. Dalsze, bardziej szczegółowe pytania mogą pojawić się na etapie implementacji poszczególnych komponentów i widoków.
</ui_architecture_planning_summary>
<unresolved_issues>
[Brak jawnie nierozwiązanych kwestii na tym etapie planowania ogólnej architektury UI dla MVP. Wszystkie postawione pytania zostały zaadresowane przez użytkownika.]
</unresolved_issues>
</conversation_summary>
