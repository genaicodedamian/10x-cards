# Plan Wdrożenia Funkcjonalności: Generuj fiszki do nauki języka

## 1. Przegląd Funkcjonalności

Funkcjonalność "Generuj fiszki do nauki języka" umożliwia użytkownikom automatyczne generowanie zestawów 30 fiszek językowych przy użyciu sztucznej inteligencji. Użytkownik podaje tematykę (max 40 znaków) oraz wybiera języki dla awersu i rewersu fiszki z listy dostępnych opcji (polski, angielski, niemiecki, francuski). System generuje unikalne słowa/zwroty powiązane z tematyką, gdzie na każdej stronie fiszki znajduje się to samo słowo w wybranym języku.

Wartość biznesowa polega na uproszczeniu procesu tworzenia materiałów do nauki języków obcych oraz zwiększeniu efektywności nauki poprzez spersonalizowane zestawy słownictwa tematycznego.

## 2. Specyfikacja Backend (API Endpoint)

### Endpoint Configuration
- **Metoda HTTP**: POST
- **Struktura URL**: `/api/ai/generate-language-flashcards`
- **Authentication**: Required (JWT Bearer token)

### Wymagane DTOs i Command Modele

```typescript
// Command Model
export interface AIGenerateLanguageFlashcardsCommand {
  topic: string; // 1-40 characters
  front_language: LanguageCode;
  back_language: LanguageCode;
}

// Response DTOs
export interface AIGenerateLanguageFlashcardsResponseDto {
  suggestions: LanguageFlashcardSuggestionDto[];
  metadata: LanguageAIGenerationMetadataDto;
}

export interface LanguageFlashcardSuggestionDto {
  front: string; // Word/phrase in front_language
  back: string; // Same word/phrase in back_language
  validation_status: ValidationStatus;
  validation_message?: string;
}

export interface LanguageAIGenerationMetadataDto {
  topic_hash: string; // SHA-256 of topic
  topic_length: number;
  generation_duration_ms: number;
  model_used: string;
  front_language: LanguageCode;
  back_language: LanguageCode;
  truncated_count: number;
  rejected_count: number;
  total_suggestions: number;
}

export type LanguageCode = "polish" | "english" | "german" | "french";
```

### Szczegóły żądania
```json
{
  "topic": "Podróżowanie",
  "front_language": "english",
  "back_language": "polish"
}
```

### Szczegóły odpowiedzi
- **Status 200**: Successful generation
- **Status 400**: Invalid input (topic length, invalid languages)
- **Status 401**: Unauthorized
- **Status 429**: Rate limit exceeded
- **Status 500**: AI service failure
- **Status 503**: AI service unavailable

```json
{
  "suggestions": [
    {
      "front": "airplane",
      "back": "samolot",
      "validation_status": "valid",
      "validation_message": null
    }
  ],
  "metadata": {
    "topic_hash": "abc123...",
    "topic_length": 12,
    "generation_duration_ms": 2500,
    "model_used": "gpt-4o-mini",
    "front_language": "english",
    "back_language": "polish",
    "truncated_count": 0,
    "rejected_count": 0,
    "total_suggestions": 30
  }
}
```

## 3. Specyfikacja Frontend (Widok i Interakcja)

### Kluczowe Komponenty UI
- **LanguageFlashcardGenerator.tsx** - Główny komponent widoku
- **LanguageTopicInput.tsx** - Input dla tematyki z licznikiem znaków
- **LanguageSelector.tsx** - Dropdown dla wyboru języków
- **FlashcardSuggestionGrid.tsx** - Reużycie z istniejącej funkcjonalności
- **EditFlashcardDialog.tsx** - Reużycie z istniejącej funkcjonalności
- **SaveSetDialog.tsx** - Reużycie z istniejącej funkcjonalności

### Modele Widoku / Stan
```typescript
interface LanguageFlashcardGeneratorViewModel {
  // Form state
  topic: string;
  frontLanguage: LanguageCode | null;
  backLanguage: LanguageCode | null;
  
  // Generation state
  isLoadingSuggestions: boolean;
  suggestions: FlashcardSuggestionItemVM[];
  generationMetadata: LanguageAIGenerationMetadataDto | null;
  
  // UI state
  isSavingSet: boolean;
  isEditDialogOpen: boolean;
  isSaveSetDialogOpen: boolean;
  editingItem: FlashcardSuggestionItemVM | null;
  
  // Error state
  topicError: string | null;
  languageError: string | null;
  generationError: string | null;
}

const AVAILABLE_LANGUAGES = [
  { code: "polish", label: "Polski" },
  { code: "english", label: "Angielski" },
  { code: "german", label: "Niemiecki" },
  { code: "french", label: "Francuski" }
];
```

### Interakcja Użytkownika
1. Użytkownik wprowadza tematykę (1-40 znaków) z walidacją w czasie rzeczywistym
2. Wybiera język awersu z dropdown
3. Wybiera język rewersu z dropdown (może być taki sam jak awers)
4. Klika "Generuj fiszki językowe"
5. System wyświetla 30 wygenerowanych fiszek z opcjami accept/edit/reject
6. Użytkownik może edytować pojedyncze fiszki w modalu
7. Zapisuje zaakceptowane lub wszystkie fiszki jako nowy zestaw

### Logika po stronie Klienta
- Walidacja długości tematu (1-40 znaków)
- Wymagane wybory języków z dropdown
- Zarządzanie stanem sugestii (accept/reject/edit)
- Lokalne filtrowanie zaakceptowanych fiszek przed zapisem
- Generowanie unikalnych nazw zestawów na podstawie tematu i języków

## 4. Kompleksowy Przepływ Danych (End-to-End)

### Krok 1: Inicjalizacja widoku
1. Użytkownik przechodzi z Dashboard do `/generate-language-flashcards`
2. Komponent LanguageFlashcardGenerator ładuje się z pustym stanem
3. Wyświetla się formularz z polami: topic, front language, back language

### Krok 2: Wprowadzanie danych
1. Użytkownik wpisuje tematykę -> walidacja client-side (1-40 znaków)
2. Wybiera języki z dropdown -> sprawdzenie czy oba pola wybrane
3. Przycisk "Generuj fiszki językowe" aktywuje się po spełnieniu walidacji

### Krok 3: Generowanie AI
1. Frontend wysyła POST do `/api/ai/generate-language-flashcards`
2. Backend waliduje dane wejściowe (Zod schema)
3. Service `languageFlashcardGenerationService` wywołuje OpenRouter API z promptem:
   ```
   Generate exactly 30 unique vocabulary words/phrases for the topic: "{topic}".
   Return each word/phrase in {front_language} and its {back_language} translation.
   Focus on commonly used, practical vocabulary related to this topic.
   Ensure all words are unique and relevant to the topic.
   ```
4. AI odpowiada listą 30 słów w obu językach
5. Backend waliduje odpowiedź, zapisuje metadane, zwraca LanguageFlashcardSuggestionDto[]

### Krok 4: Wyświetlanie sugestii
1. Frontend otrzymuje response, parsuje sugestie
2. Konwertuje na FlashcardSuggestionItemVM z unikalnym ID i statusem isAccepted
3. Wyświetla w siatce 3-kolumnowej z opcjami accept/edit/reject

### Krok 5: Zarządzanie sugestiami  
1. Accept: oznacza fiszkę jako zaakceptowaną
2. Edit: otwiera modal z polami front/back, po zapisie oznacza jako zaakceptowaną
3. Reject: usuwa z listy po potwierdzeniu w AlertDialog

### Krok 6: Zapisywanie zestawu
1. User klika "Zapisz zaakceptowane" lub "Zapisz wszystkie"
2. Otwiera się SaveSetDialog z automatycznie wygenerowaną nazwą: "{topic} - {frontLang} na {backLang}"
3. Po potwierdzeniu:
   - POST `/api/flashcard-sets` (tworzy zestaw z metadanymi AI)
   - POST `/api/flashcard-sets/{id}/flashcards/batch-create` (dodaje fiszki)
4. Success -> czyszczenie formularza + redirect do dashboard z toast notification

## 5. Względy bezpieczeństwa

### Uwierzytelnianie i Autoryzacja
- Endpoint chroniony JWT tokenem (middleware Astro)
- RLS policies w Supabase zapewniają dostęp tylko do własnych danych
- Rate limiting na poziomie użytkownika (max 10 generowań na godzinę)

### Walidacja Danych Full-Stack
**Frontend:**
- Input sanitization dla pola topic
- Dropdown validation dla języków (tylko dozwolone wartości)
- Character count validation (1-40 znaków)

**Backend:**
- Zod schema validation dla wszystkich parametrów
- Whitelist dozwolonych języków
- Sanitization topic przed wysłaniem do AI API
- Validation response z AI przed zwróceniem do klienta

### Mitigacja Zagrożeń
- **XSS**: Sanitization wszystkich user inputs, React automatic escaping
- **CSRF**: Astro middleware + SameSite cookies
- **AI Prompt Injection**: Sanitization tematu, structured prompt format
- **Over-posting**: Explicit DTO mapping, tylko wymagane pola
- **Rate Limiting**: Redis-based rate limiting na AI calls

## 6. Obsługa błędów

### Błędy po stronie Klienta (400 Bad Request)
```typescript
const CLIENT_ERROR_MESSAGES = {
  TOPIC_REQUIRED: "Tematyka jest wymagana",
  TOPIC_TOO_SHORT: "Tematyka musi mieć co najmniej 1 znak", 
  TOPIC_TOO_LONG: "Tematyka może mieć maksymalnie 40 znaków",
  FRONT_LANGUAGE_REQUIRED: "Język awersu jest wymagany",
  BACK_LANGUAGE_REQUIRED: "Język rewersu jest wymagany",
  INVALID_LANGUAGE: "Wybrany język nie jest obsługiwany"
};
```

### Błędy Sieci i Serwera
- **401 Unauthorized**: Redirect do login page
- **429 Rate Limited**: "Osiągnięto limit generowań. Spróbuj ponownie za godzinę."
- **500 Internal Server Error**: "Wystąpił problem z generowaniem fiszek. Spróbuj ponownie."
- **503 Service Unavailable**: "Usługa AI jest tymczasowo niedostępna. Spróbuj ponownie za chwilę."

### Logowanie Backend
```typescript
// W generation_error_logs table
interface ErrorLogEntry {
  user_id: string;
  model: string;
  topic_hash: string; // SHA-256 of topic
  topic_length: number;
  front_language: LanguageCode;
  back_language: LanguageCode;
  error_code: string;
  error_message: string;
}
```

### Monitorowanie Frontend
- Toast notifications dla wszystkich błędów użytkownika
- Console.error dla błędów deweloperskich
- Metrics tracking: generation success rate, average response time

## 7. Wydajność i Optymalizacja

### Potencjalne Wąskie Gardła
1. **AI API Response Time**: 2-5 sekund dla 30 słów
2. **Database Batch Insert**: 30 flashcard inserts + metadata update
3. **Frontend Rendering**: 30 flashcard components w siatce

### Strategie Optymalizacji

**Backend:**
- Connection pooling dla DB connections
- Redis caching dla często używanych tematów (opcjonalnie)
- Batch database operations w transactions
- AI API timeout handling (15s max)

**Frontend:**
- React.memo dla FlashcardDisplayItem komponenty
- useCallback dla event handlers  
- Lazy loading dla EditFlashcardDialog
- Debounced topic validation (300ms)
- Virtual scrolling jeśli >50 sugestii (future enhancement)

**Database:**
- Indeksy na user_id, topic_hash w generation_error_logs
- Przygotowane transactions dla batch operations

## 8. Etapy Wdrożenia (Backend/Frontend)

### Backend Implementation
1. **Krok 1**: Dodanie nowych typów do `src/types.ts`
   - `AIGenerateLanguageFlashcardsCommand`
   - `AIGenerateLanguageFlashcardsResponseDto`
   - `LanguageFlashcardSuggestionDto`
   - `LanguageCode` enum

2. **Krok 2**: Implementacja `languageFlashcardGenerationService`
   - Service w `src/lib/services/languageFlashcardGenerationService.ts`
   - OpenRouter integration z dedykowanym promptem
   - Error handling i logging do `generation_error_logs`

3. **Krok 3**: Implementacja API endpoint
   - `src/pages/api/ai/generate-language-flashcards.ts`
   - Zod validation schema
   - Rate limiting middleware
   - JWT authentication check

4. **Krok 4**: Testy Backend
   - Unit tests dla service layer
   - Integration tests dla API endpoint
   - Error scenarios testing

### Frontend Implementation
5. **Krok 5**: Dodanie routingu
   - Nowa strona `src/pages/generate-language-flashcards.astro`
   - Link w Dashboard do nowej funkcjonalności

6. **Krok 6**: Implementacja głównego komponentu
   - `src/components/language-generator/LanguageFlashcardGenerator.tsx`
   - Stan management z React hooks
   - API integration dla generowania

7. **Krok 7**: Implementacja komponentów form
   - `LanguageTopicInput.tsx` z walidacją i licznikiem
   - `LanguageSelector.tsx` z dropdown options
   - Reuse istniejących komponentów (FlashcardSuggestionGrid, dialogi)

8. **Krok 8**: Implementacja UX flows
   - Loading states podczas generowania
   - Error handling z toast notifications  
   - Success flow z redirect do dashboard

### Full-Stack Integration
9. **Krok 9**: E2E Testing
   - Playwright testy dla complete user journey
   - Test cases: happy path, validation errors, API failures
   - Cross-browser compatibility testing

10. **Krok 10**: Performance Testing & Monitoring
    - Load testing API endpoint
    - Frontend performance metrics
    - AI response time monitoring
    - Database query optimization

11. **Krok 11**: Deployment & Rollout
    - Feature flag deployment
    - Gradual rollout to users
    - Monitoring error rates i user adoption
    - Feedback collection i iteration

### Post-Launch Enhancements  
12. **Krok 12**: Analytics & Improvements
    - Usage analytics (najpopularniejsze języki/tematy)
    - AI model optimization na podstawie user feedback
    - UI/UX improvements na podstawie user behavior
    - Performance optimizations na podstawie metrics
