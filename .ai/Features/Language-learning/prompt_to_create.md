Twoim zadaniem jest wdrożenie funkcjonalności "Generuj fiszki do nauki języka" w oparciu o szczegółowy plan implementacji. Twoim celem jest stworzenie solidnej implementacji Full-Stack (Backend + Frontend), która zawiera odpowiednią walidację, obsługę błędów, komponenty UI oraz podąża za wszystkimi logicznymi krokami opisanymi w planie.

Najpierw dokładnie przejrzyj dostarczony plan wdrożenia:

<implementation_plan>
@feature_implementation_plan.md
</implementation_plan>

Zapoznaj się z kontekstem aplikacji i istniejącymi zasobami:

<application_context>
@prd.md
@api-plan.md 
@ui-plan.md
@db-plan.md
</application_context>

<types>
@types.ts
@database.types.ts
</types>

<existing_similar_functionality>
@AIFlashcardGenerator.md
@ai-generate-flashcards-api.md
</existing_similar_functionality>

<implementation_rules>
@astro.mdc
@backend.mdc  
@react.mdc
@ui-shadcn-helper.mdc
</implementation_rules>

<implementation_approach>
Realizuj maksymalnie 3 kroki planu implementacji naraz, podsumuj krótko co zrobiłeś i opisz plan na 3 kolejne działania - zatrzymaj w tym momencie pracę i czekaj na mój feedback. Rozpocznij od kroków Backend (1-4), następnie przejdź do Frontend (5-8), a na końcu Full-Stack Integration (9-12).
</implementation_approach>

Teraz wykonaj następujące kroki, aby zaimplementować funkcjonalność "Generuj fiszki do nauki języka":

1. **Przeanalizuj plan wdrożenia**:
   - Określ wszystkie nowe typy i DTOs potrzebne w `src/types.ts`
   - Zidentyfikuj strukturę nowego API endpoint `/api/ai/generate-language-flashcards`
   - Przejrzyj wymagania Frontend: nowy widok, komponenty UI, zarządzanie stanem
   - Zwróć uwagę na różnice między tą funkcjonalnością a istniejącą `AIFlashcardGenerator`
   - Zanotuj wszystkie wymagania dotyczące walidacji, bezpieczeństwa i obsługi błędów

2. **Rozpocznij implementację Backend**:
   - Zdefiniuj nowe typy i interfejsy w `src/types.ts` zgodnie z sekcją 2 planu
   - Implementuj `languageFlashcardGenerationService` w `src/lib/services/`
   - Stwórz API endpoint w `src/pages/api/ai/generate-language-flashcards.ts`
   - Włącz odpowiednią walidację Zod dla wszystkich parametrów wejściowych
   - Implementuj obsługę błędów i logowanie do `generation_error_logs`
   - Skonfiguruj rate limiting i authentication middleware

3. **Implementuj Frontend**:
   - Stwórz nową stronę Astro `src/pages/generate-language-flashcards.astro`
   - Implementuj główny komponent React `LanguageFlashcardGenerator.tsx`
   - Stwórz komponenty formularza: `LanguageTopicInput.tsx`, `LanguageSelector.tsx`  
   - Reużyj istniejące komponenty: `FlashcardSuggestionGrid`, `EditFlashcardDialog`, `SaveSetDialog`
   - Implementuj zarządzanie stanem z React hooks
   - Dodaj walidację po stronie klienta i obsługę błędów z toast notifications

4. **Walidacja i obsługa błędów Full-Stack**:
   - **Backend**: Implementuj kompleksową walidację dla topic (1-40 znaków), dozwolonych języków
   - **Frontend**: Dodaj real-time walidację formularza, error states, loading indicators
   - Używaj odpowiednich kodów statusu HTTP (200, 400, 401, 429, 500, 503)
   - Implementuj graceful error handling dla API failures, network errors
   - Dodaj user-friendly error messages w UI z toast notifications
   - Skonfiguruj error logging i monitoring

5. **Integracja i nawigacja**:
   - Dodaj link do nowej funkcjonalności w Dashboard
   - Skonfiguruj routing w Astro dla nowej strony
   - Implementuj complete user journey: Dashboard → Language Generator → Suggestions Review → Save Set → Dashboard
   - Testuj przepływ danych End-to-End
   - Upewnij się, że reused komponenty działają poprawnie z nową funkcjonalnością

6. **Optymalizacja i testy**:
   - Implementuj performance optimizations (React.memo, useCallback, debouncing)
   - Dodaj loading states i UX improvements
   - Napisz unit testy dla service layer
   - Stwórz integration testy dla API endpoint  
   - Testuj różne scenariusze błędów i edge cases
   - Zweryfikuj accessibility i responsiveness

**Kluczowe wymagania implementacji**:

- **Rate Limiting**: Maksymalnie 10 generowań na godzinę na użytkownika
- **Języki**: Tylko ["polish", "english", "german", "french"] są dozwolone
- **AI Prompt**: Generuj dokładnie 30 unikalnych słów/zwrotów dla podanej tematyki
- **Validation**: Topic 1-40 znaków, wymagane wybory języków
- **Security**: JWT authentication, input sanitization, CSRF protection
- **UX**: Intuicyjny formularz, clear loading states, helpful error messages
- **Reuse**: Maksymalne wykorzystanie istniejących komponentów z AIFlashcardGenerator

**Różnice od istniejącej funkcjonalności**:
- Input: Krótka tematyka (max 40 znaków) + wybór języków zamiast długiego tekstu
- AI Logic: Generowanie słownictwa językowego zamiast analizy tekstu  
- Output: Słowa w dwóch językach (to samo słowo w różnych językach) zamiast pytanie-odpowiedź
- Validation: Inna struktura danych wejściowych i validation rules

Po zakończeniu każdego etapu upewnij się, że kod zawiera wszystkie niezbędne importy, definicje typów, właściwą obsługę błędów i jest zgodny z istniejącą architekturą aplikacji.

Jeśli musisz przyjąć jakieś założenia lub masz pytania dotyczące implementacji, przedstaw je przed pisaniem kodu.

Pamiętaj, aby przestrzegać najlepszych praktyk Full-Stack development, stosować się do wytycznych Astro + React, wykorzystywać Shadcn/ui komponenty i upewnić się, że kod jest czysty, czytelny i dobrze zorganizowany.
