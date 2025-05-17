# Przewodnik Implementacji Usługi OpenRouter

## 1. Opis Usługi

Usługa OpenRouter (`OpenRouterService`) będzie działać jako klient API dla OpenRouter.ai, umożliwiając integrację zaawansowanych modeli językowych (LLM) w aplikacji. Głównym celem usługi jest uproszczenie procesu wysyłania żądań do API OpenRouter, zarządzania konfiguracją (w tym kluczem API), konstruowania złożonych żądań (z wiadomościami systemowymi, użytkownika, historią konwersacji, formatowaniem odpowiedzi JSON) oraz obsługi odpowiedzi i błędów. Usługa będzie napisana w TypeScript i zaprojektowana do użytku w środowisku backendowym (np. w endpointach API Astro lub po stronie serwera).

Kluczowe funkcje:
-   Bezpieczne zarządzanie kluczem API OpenRouter pobieranym ze zmiennych środowiskowych.
-   Wysyłanie żądań uzupełniania czatu do punktu końcowego `/api/v1/chat/completions`.
-   Obsługa wiadomości systemowych, użytkownika oraz historii konwersacji.
-   Możliwość definiowania formatu odpowiedzi, w tym wymuszanie schematu JSON (`response_format`).
-   Elastyczny wybór modeli, w tym mechanizmy fallback.
-   Konfiguracja parametrów modelu (np. `temperature`, `max_tokens`).
-   Obsługa opcji routingu dostawcy.
-   Implementacja strategii ponowień dla błędów przejściowych.
-   Centralne zarządzanie błędami i logowanie.

## 2. Opis Konstruktora

Konstruktor `OpenRouterService` będzie odpowiedzialny za inicjalizację usługi.

```typescript
// Przykład definicji interfejsu konfiguracji
interface OpenRouterServiceConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  httpReferer?: string;
  siteName?: string;
  defaultMaxRetries?: number;
  defaultTimeoutMs?: number;
}

class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel?: string;
  private readonly httpReferer?: string;
  private readonly siteName?: string;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;

  constructor(config?: Partial<OpenRouterServiceConfig>) {
    this.apiKey = config?.apiKey || process.env.OPENROUTER_API_KEY;
    if (!this.apiKey) {
      console.error("OpenRouter API Key is not configured. Please set OPENROUTER_API_KEY environment variable.");
      throw new Error("OpenRouter API Key is missing.");
    }

    this.baseUrl = config?.baseUrl || "https://openrouter.ai/api/v1";
    this.defaultModel = config?.defaultModel;
    this.httpReferer = config?.httpReferer || process.env.YOUR_SITE_URL; // Opcjonalne, dla rankingu
    this.siteName = config?.siteName || process.env.YOUR_SITE_NAME;     // Opcjonalne, dla rankingu
    this.maxRetries = config?.defaultMaxRetries ?? 3;
    this.timeoutMs = config?.defaultTimeoutMs ?? 30000; // 30 sekund
  }

  // ... reszta metod
}
```

**Parametry Konstruktora:**
-   `config` (opcjonalny): Obiekt konfiguracyjny `Partial<OpenRouterServiceConfig>`.
    -   `apiKey` (opcjonalny): Klucz API OpenRouter. Jeśli nie zostanie podany, usługa spróbuje odczytać go ze zmiennej środowiskowej `OPENROUTER_API_KEY`.
    -   `baseUrl` (opcjonalny): Bazowy URL API OpenRouter. Domyślnie: `https://openrouter.ai/api/v1`.
    -   `defaultModel` (opcjonalny): Domyślny model do użycia, jeśli nie zostanie określony w żądaniu.
    -   `httpReferer` (opcjonalny): Wartość nagłówka `HTTP-Referer`. Może być pobierana ze zmiennej środowiskowej.
    -   `siteName` (opcjonalny): Wartość nagłówka `X-Title`. Może być pobierana ze zmiennej środowiskowej.
    -   `defaultMaxRetries` (opcjonalny): Domyślna liczba ponowień dla żądań. Domyślnie: `3`.
    -   `defaultTimeoutMs` (opcjonalny): Domyślny czas oczekiwania na odpowiedź w milisekundach. Domyślnie: `30000`.

**Logika Inicjalizacji:**
1.  Przypisuje `apiKey`: priorytet dla wartości z `config`, następnie `process.env.OPENROUTER_API_KEY`. Jeśli klucz nie jest dostępny, zgłasza błąd i zatrzymuje inicjalizację.
2.  Przypisuje pozostałe wartości konfiguracyjne, używając wartości domyślnych, jeśli nie zostały dostarczone.

## 3. Publiczne Metody i Pola

### Pola Publiczne
Brak pól publicznych. Konfiguracja i stan wewnętrzny są zarządzane prywatnie.

### Metody Publiczne

#### `async getChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>`
Główna metoda do uzyskiwania uzupełnień czatu.

**Parametry:**
-   `request`: Obiekt `ChatCompletionRequest` zawierający:
    -   `messages`: `Message[]` - Tablica obiektów wiadomości (`{ role: "system" | "user" | "assistant", content: string }`). Wymagane.
    -   `model`: `string` (opcjonalny) - Nazwa modelu do użycia (np. `"openai/gpt-4o"`). Jeśli nie podano, użyty zostanie `defaultModel` z konfiguracji. Można użyć `models` zamiast tego.
    -   `models`: `string[]` (opcjonalny) - Lista modeli do użycia z mechanizmem fallback (np. `["anthropic/claude-3.5-sonnet", "openai/gpt-4o"]`).
    -   `response_format`: `ResponseFormat` (opcjonalny) - Definiuje format odpowiedzi.
        -   `type`: `"json_schema"`
        -   `json_schema`: Obiekt schematu JSON:
            -   `name`: `string` - Nazwa schematu.
            -   `strict`: `boolean` (opcjonalny, domyślnie `true`) - Czy model ma ściśle przestrzegać schematu.
            -   `schema`: `object` - Definicja schematu JSON.
    -   `temperature`: `number` (opcjonalny) - Kontroluje losowość. Wartości od 0.0 do 2.0.
    -   `max_tokens`: `number` (opcjonalny) - Maksymalna liczba tokenów do wygenerowania.
    -   `top_p`: `number` (opcjonalny) - Kontroluje próbkowanie nucleus.
    -   `stream`: `boolean` (opcjonalny, domyślnie `false`) - Czy odpowiedź ma być strumieniowana (niezaimplementowane w tym planie dla uproszczenia, ale można dodać).
    -   `provider`: `ProviderOptions` (opcjonalny) - Zaawansowane opcje routingu dostawcy (zgodnie z dokumentacją OpenRouter).
    -   ...inne parametry wspierane przez API OpenRouter.

**Zwraca:**
-   `Promise<ChatCompletionResponse>`: Obietnica, która rozwiązuje się do obiektu `ChatCompletionResponse` zawierającego m.in.:
    -   `id`: `string` - ID uzupełnienia.
    -   `choices`: `Choice[]` - Tablica wyborów (zazwyczaj jeden).
        -   `message`: `ResponseMessage` (`{ role: "assistant", content: string }`) - Wygenerowana wiadomość.
    -   `model`: `string` - Nazwa modelu, który faktycznie wygenerował odpowiedź.
    -   `usage`: `UsageStats` (opcjonalny) - Statystyki użycia tokenów.
    -   ...inne pola zwracane przez API.

**Przykład użycia:**
```typescript
const openRouter = new OpenRouterService();

try {
  const response = await openRouter.getChatCompletion({
    messages: [
      { role: "system", content: "Jesteś pomocnym asystentem." },
      { role: "user", content: "Opisz stolicę Francji w formacie JSON z polami 'miasto' i 'kraj'." }
    ],
    model: "openai/gpt-3.5-turbo",
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "informacje_o_stolicy",
        strict: true,
        schema: {
          type: "object",
          properties: {
            miasto: { type: "string", description: "Nazwa miasta" },
            kraj: { type: "string", description: "Nazwa kraju" }
          },
          required: ["miasto", "kraj"]
        }
      }
    },
    temperature: 0.7
  });

  const content = response.choices[0].message.content;
  // content powinien być stringiem JSON, np. '{"miasto": "Paryż", "kraj": "Francja"}'
  const parsedContent = JSON.parse(content); 
  console.log(parsedContent.miasto);

} catch (error) {
  console.error("Błąd podczas komunikacji z OpenRouter:", error);
}
```

## 4. Integracja Kluczowych Elementów API OpenRouter

W tej sekcji szczegółowo omówiono, w jaki sposób usługa `OpenRouterService` integruje kluczowe elementy API OpenRouter, zgodnie z wymaganiami.

### 1. Komunikat Systemowy (System Message)

-   **Cel**: Definiuje instrukcje lub kontekst dla modelu AI, które kierują jego zachowaniem i odpowiedziami.
-   **Implementacja**: Komunikaty systemowe są częścią tablicy `messages` przekazywanej w obiekcie `ChatCompletionRequest` do metody `getChatCompletion`. Każdy komunikat systemowy to obiekt z `role: "system"` i `content` zawierającym treść komunikatu.
    ```typescript
    // Przykład w ChatCompletionRequest
    const request: ChatCompletionRequest = {
      messages: [
        { role: "system", content: "Jesteś pomocnym asystentem, który zawsze odpowiada w języku francuskim." },
        { role: "user", content: "Witaj!" }
        // ... inne komunikaty
      ],
      model: "openai/gpt-3.5-turbo"
    };
    ```
-   **Sposób użycia w usłudze**: Usługa przekazuje tablicę `messages` bezpośrednio do ciała żądania API OpenRouter. Użytkownik usługi jest odpowiedzialny za poprawne sformatowanie tych komunikatów.

### 2. Komunikat Użytkownika (User Message)

-   **Cel**: Reprezentuje dane wejściowe lub pytania od użytkownika końcowego.
-   **Implementacja**: Komunikaty użytkownika są również częścią tablicy `messages` w `ChatCompletionRequest`, z `role: "user"`.
    ```typescript
    // Przykład w ChatCompletionRequest
    const request: ChatCompletionRequest = {
      messages: [
        { role: "system", content: "Jesteś ekspertem od historii." },
        { role: "user", content: "Kiedy odbyła się Bitwa pod Grunwaldem?" }
      ],
      model: "openai/gpt-3.5-turbo"
    };
    ```
-   **Sposób użycia w usłudze**: Podobnie jak komunikaty systemowe, są one przekazywane w tablicy `messages`.

### 3. Ustrukturyzowane Odpowiedzi (Structured Outputs - Schemat JSON)

-   **Cel**: Umożliwia wymuszenie na modelu AI generowania odpowiedzi w określonym formacie JSON, zgodnie z zadanym schematem.
-   **Implementacja**: Realizowane poprzez parametr `response_format` w `ChatCompletionRequest`. Musi on mieć `type: "json_schema"` oraz zagnieżdżony obiekt `json_schema` zawierający:
    -   `name`: `string` - Nazwa schematu (identyfikator).
    -   `strict`: `boolean` (opcjonalnie) - Jeśli `true`, model będzie bardziej rygorystycznie przestrzegał schematu.
    -   `schema`: `object` - Właściwa definicja schematu JSON, opisująca oczekiwaną strukturę, typy pól, wymagane pola itp.
-   **Przykład definicji w `ChatCompletionRequest`**:
    ```typescript
    const request: ChatCompletionRequest = {
      messages: [
        { role: "user", content: "Podaj informacje o książce 'Dune' Franka Herberta w formacie JSON." }
      ],
      model: "openai/gpt-4o", // Model musi wspierać structured outputs
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "informacje_o_ksiazce",
          strict: true,
          schema: {
            type: "object",
            properties: {
              tytul: { type: "string", description: "Tytuł książki" },
              autor: { type: "string", description: "Autor książki" },
              rok_wydania: { type: "integer", description: "Rok pierwszego wydania" },
              gatunek: { type: "string", enum: ["science-fiction", "fantasy", "powieść historyczna"] }
            },
            required: ["tytul", "autor", "rok_wydania"]
          }
        }
      }
    };
    ```
-   **Sposób użycia w usłudze**: Obiekt `response_format` jest przekazywany w ciele żądania do API OpenRouter. Typ `JsonSchema` i `ResponseFormat` w `src/lib/openrouter/types.ts` odzwierciedlają tę strukturę.

### 4. Nazwa Modelu (Model Name)

-   **Cel**: Określa, który model LLM ma zostać użyty do przetworzenia żądania.
-   **Implementacja**: Przekazywana jako parametr `model: string` (np., `"openai/gpt-4o"`) w `ChatCompletionRequest`. Alternatywnie, można użyć parametru `models: string[]` (np., `["anthropic/claude-3.5-sonnet", "openai/gpt-4o"]`) do zdefiniowania listy modeli z obsługą fallback.
-   **Sposób użycia w usłudze**: `OpenRouterService` przyjmuje `model` lub `models` w `ChatCompletionRequest`. Jeśli `model` nie jest podany, a `defaultModel` został skonfigurowany w konstruktorze, użyty zostanie `defaultModel`. Metoda `_buildRequestPayload` odpowiednio konstruuje ciało żądania.
    ```typescript
    // Przykład 1: Pojedynczy model
    const requestSingleModel: ChatCompletionRequest = {
      messages: [{ role: "user", content: "Hello!" }],
      model: "google/gemini-pro"
    };

    // Przykład 2: Lista modeli z fallback
    const requestMultipleModels: ChatCompletionRequest = {
      messages: [{ role: "user", content: "Hello!" }],
      models: ["anthropic/claude-3-opus", "openai/gpt-4-turbo"]
    };
    ```

### 5. Parametry Modelu (Model Parameters)

-   **Cel**: Dostosowują zachowanie modelu podczas generowania odpowiedzi.
-   **Implementacja**: Są to opcjonalne właściwości w obiekcie `ChatCompletionRequest`. Kluczowe parametry to:
    -   `temperature`: `number` (zakres zwykle 0.0 - 2.0, domyślnie często 1.0) - Kontroluje losowość. Niższe wartości czynią odpowiedź bardziej deterministyczną.
    -   `top_p`: `number` (zakres 0.0 - 1.0, domyślnie często 1.0) - Stosuje próbkowanie jądra (nucleus sampling). Model rozważa tokeny o skumulowanym prawdopodobieństwie `top_p`.
    -   `max_tokens`: `number` - Maksymalna liczba tokenów do wygenerowania w odpowiedzi.
    -   `frequency_penalty`: `number` (zakres zwykle -2.0 - 2.0, domyślnie 0.0) - Kara za częste występowanie tokenów, zniechęca do powtarzania tych samych słów.
    -   `presence_penalty`: `number` (zakres zwykle -2.0 - 2.0, domyślnie 0.0) - Kara za pojawienie się nowych tokenów, może zachęcać do trzymania się tematów już wprowadzonych.
-   **Przykład w `ChatCompletionRequest`**:
    ```typescript
    const requestWithParams: ChatCompletionRequest = {
      messages: [{ role: "user", content: "Napisz krótką historię." }],
      model: "openai/gpt-3.5-turbo",
      temperature: 0.7,
      max_tokens: 150,
      top_p: 0.9,
      frequency_penalty: 0.5,
      presence_penalty: 0.2
    };
    ```
-   **Sposób użycia w usłudze**: Usługa dołącza te parametry do ciała żądania API, jeśli są zdefiniowane w `ChatCompletionRequest`. Metoda `_buildRequestPayload` dba o to, aby tylko zdefiniowane parametry zostały wysłane.

## 5. Prywatne Metody i Pola

### Prywatne Pola
Opisane w sekcji Konstruktor (`apiKey`, `baseUrl`, `defaultModel`, etc.).

### Prywatne Metody

#### `async _fetchWithRetry(url: string, options: RequestInit, retries: number): Promise<Response>`
Wewnętrzna metoda do wykonywania żądań `fetch` z logiką ponowień.
-   Obsługuje wykładniczy backoff.
-   Sprawdza kody statusu odpowiedzi i decyduje o ponowieniu (np. dla 429, 5xx).
-   Wykorzystuje `AbortController` do implementacji timeoutu.

#### `_buildRequestPayload(request: ChatCompletionRequest): OpenRouterApiRequestBody`
Konstruuje ciało żądania dla API OpenRouter na podstawie `ChatCompletionRequest`.
-   Ustawia `model` lub `models`.
-   Dołącza `messages`.
-   Dodaje `response_format`, jeśli zdefiniowano.
-   Dołącza pozostałe parametry (`temperature`, `max_tokens`, etc.).
-   Dołącza opcje `provider`, jeśli zdefiniowano.

#### `_parseResponse(response: Response): Promise<ChatCompletionResponse>`
Parsuje odpowiedź HTTP, sprawdza błędy API i zwraca przetworzony obiekt `ChatCompletionResponse`.
-   Jeśli odpowiedź nie jest OK, rzuca odpowiedni `OpenRouterApiError`.

## 6. Obsługa Błędów

Usługa będzie definiować niestandardowe klasy błędów dla lepszej diagnostyki:
-   `OpenRouterApiError`: Ogólny błąd API OpenRouter, zawiera kod statusu i wiadomość błędu z API.
-   `OpenRouterAuthError`: Błąd autoryzacji (np. nieprawidłowy klucz API).
-   `OpenRouterRateLimitError`: Przekroczono limit zapytań.
-   `OpenRouterTimeoutError`: Żądanie przekroczyło limit czasu.
-   `OpenRouterInvalidRequestError`: Błąd związany z nieprawidłowym żądaniem (np. zły schemat).

**Scenariusze błędów i ich obsługa:**
1.  **Brak Klucza API**: Konstruktor rzuca `Error` przy inicjalizacji.
2.  **Nieprawidłowy Klucz API (401 Unauthorized)**: `_fetchWithRetry` przechwytuje, `_parseResponse` rzuca `OpenRouterAuthError`. Nie ponawia.
3.  **Rate Limit (429 Too Many Requests)**: `_fetchWithRetry` obsługuje ponowienia z backoffem, uwzględniając nagłówek `Retry-After`. Jeśli wszystkie próby zawiodą, rzuca `OpenRouterRateLimitError`.
4.  **Błędy Serwera OpenRouter (5xx)**: `_fetchWithRetry` obsługuje ponowienia z backoffem. Jeśli wszystkie próby zawiodą, rzuca `OpenRouterApiError`.
5.  **Błędy Walidacji Żądania (400 Bad Request)**: `_parseResponse` rzuca `OpenRouterInvalidRequestError`. Nie ponawia.
6.  **Timeouts**: `_fetchWithRetry` rzuca `OpenRouterTimeoutError` po przekroczeniu `timeoutMs`. Może być ponawiane.
7.  **Błędy Sieciowe**: `_fetchWithRetry` przechwytuje błędy `fetch` i ponawia. Jeśli wszystkie próby zawiodą, rzuca ogólny `Error` lub specyficzny błąd sieciowy.
8.  **Błędy Parsowania Odpowiedzi**: Jeśli odpowiedź API nie jest poprawnym JSON-em, `_parseResponse` rzuca `OpenRouterApiError` z odpowiednim komunikatem.

Logowanie będzie realizowane za pomocą `console.error` lub `console.warn` dla uproszczenia. W bardziej złożonym systemie można by zintegrować dedykowaną bibliotekę do logowania.

## 7. Kwestie Bezpieczeństwa

1.  **Klucz API**:
    -   Klucz API OpenRouter jest wrażliwą daną. **NIGDY** nie powinien być hardkodowany w kodzie frontendu ani publicznie dostępnym kodzie.
    -   Klucz API musi być przechowywany jako zmienna środowiskowa (`OPENROUTER_API_KEY`) na serwerze, gdzie działa usługa backendowa (np. w środowisku DigitalOcean, Vercel, Netlify dla funkcji server-side).
    -   Dostęp do zmiennych środowiskowych po stronie serwera jest bezpieczny.
2.  **Komunikacja**:
    -   Komunikacja z API OpenRouter odbywa się przez HTTPS (`https://openrouter.ai`), co zapewnia szyfrowanie danych w tranzycie.
3.  **Walidacja Danych Wejściowych**:
    -   Chociaż OpenRouter wykonuje walidację po swojej stronie, warto rozważyć podstawową walidację danych wejściowych do metody `getChatCompletion` (np. typy, obecność wymaganych pól), aby uniknąć niepotrzebnych zapytań API.
4.  **Ochrona przed Nadużyciami**:
    -   Jeśli usługa jest wystawiona publicznie przez API aplikacji, należy zaimplementować mechanizmy rate limiting i autoryzacji dla własnego API, aby chronić przed nadużyciem klucza OpenRouter.
5.  **Logowanie**:
    -   Należy unikać logowania wrażliwych danych (np. pełnych wiadomości użytkowników, jeśli zawierają dane osobowe) w sposób niezabezpieczony. Jeśli logowanie jest konieczne, należy zadbać o odpowiednie zabezpieczenie logów.

## 8. Plan Wdrożenia Krok po Kroku (TypeScript w środowisku Astro/Node.js)

### Krok 1: Konfiguracja Środowiska
1.  Upewnij się, że masz zainstalowany Node.js i npm/yarn/pnpm.
2.  W projekcie Astro (lub dowolnym projekcie Node.js/TypeScript) zainstaluj potrzebne typy, jeśli jeszcze ich nie masz:
    ```bash
    npm install -D @types/node
    # lub
    yarn add -D @types/node
    # lub
    pnpm add -D @types/node
    ```
3.  Utwórz plik `.env` w głównym katalogu projektu (dodaj go do `.gitignore`!) i zdefiniuj w nim klucz API:
    ```env
    OPENROUTER_API_KEY="sk-or-your-openrouter-api-key"
    YOUR_SITE_URL="http://localhost:4321" # Opcjonalne, zmień na produkcyjny URL
    YOUR_SITE_NAME="Moja Aplikacja" # Opcjonalne
    ```
    W środowisku produkcyjnym (np. DigitalOcean), te zmienne należy ustawić w panelu konfiguracyjnym aplikacji/środowiska.

### Krok 2: Definicja Typów i Interfejsów
Utwórz plik, np. `src/lib/openrouter/types.ts`, i zdefiniuj w nim potrzebne interfejsy:

```typescript
// src/lib/openrouter/types.ts

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface JsonSchemaProperty {
  type: string;
  description?: string;
  enum?: string[];
  items?: JsonSchemaProperty | { type: string }; // For arrays
  properties?: Record<string, JsonSchemaProperty>; // For nested objects
  required?: string[]; // For nested objects
  [key: string]: any; // Allow other schema properties
}

export interface JsonSchema {
  name: string;
  strict?: boolean;
  schema: {
    type: "object";
    properties: Record<string, JsonSchemaProperty>;
    required?: string[];
    [key: string]: any; // Allow other schema properties
  };
}

export interface ResponseFormat {
  type: "json_schema";
  json_schema: JsonSchema;
}

// Minimalna definicja dla uproszczenia
export interface ProviderOptions {
  order?: string[];
  allow_fallbacks?: boolean;
  // ... inne opcje zgodnie z dokumentacją OpenRouter
}

export interface ChatCompletionRequest {
  messages: Message[];
  model?: string;
  models?: string[];
  response_format?: ResponseFormat;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean; // Strumieniowanie nie jest w pełni zaimplementowane w tym planie
  provider?: ProviderOptions;
  // Inne dozwolone parametry OpenRouter API
  [key: string]: any; 
}

export interface ResponseMessage {
  role: "assistant";
  content: string;
}

export interface Choice {
  message: ResponseMessage;
  // ... inne pola jak finish_reason
}

export interface UsageStats {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletionResponse {
  id: string;
  choices: Choice[];
  created: number;
  model: string;
  object: string;
  usage?: UsageStats;
  // ... inne pola
}

// Typy błędów
export class OpenRouterApiError extends Error {
  constructor(message: string, public statusCode?: number, public details?: any) {
    super(message);
    this.name = "OpenRouterApiError";
  }
}
export class OpenRouterAuthError extends OpenRouterApiError {
  constructor(message: string = "Authentication failed. Check your API key.", details?: any) {
    super(message, 401, details);
    this.name = "OpenRouterAuthError";
  }
}
export class OpenRouterRateLimitError extends OpenRouterApiError {
   constructor(message: string = "Rate limit exceeded.", public retryAfter?: number, details?: any) {
    super(message, 429, details);
    this.name = "OpenRouterRateLimitError";
  }
}
export class OpenRouterTimeoutError extends OpenRouterApiError {
  constructor(message: string = "Request timed out.") {
    super(message, 408); // 408 Request Timeout
    this.name = "OpenRouterTimeoutError";
  }
}
export class OpenRouterInvalidRequestError extends OpenRouterApiError {
  constructor(message: string = "Invalid request.", details?: any) {
    super(message, 400, details);
    this.name = "OpenRouterInvalidRequestError";
  }
}
```

### Krok 3: Implementacja Usługi `OpenRouterService`
Utwórz plik `src/lib/openrouter/OpenRouterService.ts`:

```typescript
// src/lib/openrouter/OpenRouterService.ts
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  OpenRouterServiceConfig // Załóżmy, że jest zdefiniowany jak w sekcji Konstruktor
} from './types';
import { 
  OpenRouterApiError, 
  OpenRouterAuthError, 
  OpenRouterInvalidRequestError, 
  OpenRouterRateLimitError, 
  OpenRouterTimeoutError 
} from './types';

// Helper do opóźnienia
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel?: string;
  private readonly httpReferer?: string;
  private readonly siteName?: string;
  private readonly maxRetries: number;
  private readonly requestTimeoutMs: number;

  constructor(config?: Partial<OpenRouterServiceConfig>) {
    // Używamy process.env bezpośrednio, Astro i Node.js to wspierają.
    // Dla przeglądarki (co nie jest celem tej usługi) trzeba by użyć import.meta.env
    this.apiKey = config?.apiKey || process.env.OPENROUTER_API_KEY!;
    if (!this.apiKey) {
      console.error("OpenRouter API Key is not configured. Please set OPENROUTER_API_KEY environment variable.");
      throw new Error("OpenRouter API Key is missing.");
    }

    this.baseUrl = config?.baseUrl || "https://openrouter.ai/api/v1";
    this.defaultModel = config?.defaultModel;
    this.httpReferer = config?.httpReferer || process.env.YOUR_SITE_URL;
    this.siteName = config?.siteName || process.env.YOUR_SITE_NAME;
    this.maxRetries = config?.defaultMaxRetries ?? 3;
    this.requestTimeoutMs = config?.defaultTimeoutMs ?? 30000;
  }

  private _buildRequestPayload(request: ChatCompletionRequest): object {
    const payload: any = {
      messages: request.messages,
      // Inne parametry modelu
      temperature: request.temperature,
      max_tokens: request.max_tokens,
      top_p: request.top_p,
      response_format: request.response_format,
      provider: request.provider,
      stream: request.stream ?? false, // Domyślnie false
    };

    if (request.models && request.models.length > 0) {
      payload.models = request.models;
    } else {
      payload.model = request.model || this.defaultModel;
    }
    if (!payload.model && !payload.models) {
        throw new OpenRouterInvalidRequestError("Model name or models list must be provided.");
    }

    // Usuń niezdefiniowane klucze, aby nie wysyłać ich jako `null`
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
    return payload;
  }

  private async _fetchWithRetry(
    url: string,
    options: RequestInit,
    attempt: number = 1
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        // Specjalna obsługa dla 429 Too Many Requests
        if (response.status === 429 && attempt <= this.maxRetries) {
          const retryAfterHeader = response.headers.get("Retry-After");
          let retryAfterSeconds = parseInt(retryAfterHeader || "5", 10); // Domyślnie 5 sekund
          if (isNaN(retryAfterSeconds) || retryAfterSeconds <= 0) retryAfterSeconds = Math.pow(2, attempt); // Wykładniczy backoff jeśli Retry-After jest niepoprawny
          
          console.warn(`OpenRouterService: Rate limit exceeded. Retrying after ${retryAfterSeconds}s (attempt ${attempt}/${this.maxRetries})...`);
          await delay(retryAfterSeconds * 1000);
          return this._fetchWithRetry(url, options, attempt + 1);
        }
        // Ogólne błędy serwera (5xx) lub inne kwalifikujące się do ponowienia
        if (response.status >= 500 && response.status <= 599 && attempt <= this.maxRetries) {
           const waitTime = Math.pow(2, attempt) * 1000; // Wykładniczy backoff
           console.warn(`OpenRouterService: Server error (${response.status}). Retrying in ${waitTime/1000}s (attempt ${attempt}/${this.maxRetries})...`);
           await delay(waitTime);
           return this._fetchWithRetry(url, options, attempt + 1);
        }
        // Jeśli nie jest to błąd kwalifikujący się do ponowienia lub przekroczono liczbę prób
        return response; // Zwróć odpowiedź błędu do dalszego przetwarzania
      }
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        if (attempt <= this.maxRetries) {
          console.warn(`OpenRouterService: Request timed out. Retrying (attempt ${attempt}/${this.maxRetries})...`);
          await delay(Math.pow(2, attempt) * 1000); // Wykładniczy backoff
          return this._fetchWithRetry(url, options, attempt + 1);
        }
        throw new OpenRouterTimeoutError(`Request timed out after ${this.maxRetries} attempts.`);
      }
      // Inne błędy sieciowe, które mogą się kwalifikować do ponowienia
      if (attempt <= this.maxRetries) {
        console.warn(`OpenRouterService: Network error (${error.message}). Retrying (attempt ${attempt}/${this.maxRetries})...`);
        await delay(Math.pow(2, attempt) * 1000);
        return this._fetchWithRetry(url, options, attempt + 1);
      }
      throw error; // Rzuć błąd dalej, jeśli przekroczono liczbę prób
    }
  }
  
  private async _parseError(response: Response): Promise<OpenRouterApiError> {
    let errorDetails;
    try {
      errorDetails = await response.json();
    } catch (e) {
      errorDetails = { message: response.statusText };
    }

    const message = errorDetails?.error?.message || errorDetails?.message || `API request failed with status ${response.status}`;

    if (response.status === 401) return new OpenRouterAuthError(message, errorDetails);
    if (response.status === 400) return new OpenRouterInvalidRequestError(message, errorDetails);
    if (response.status === 429) {
        const retryAfterHeader = response.headers.get("Retry-After");
        const retryAfterSeconds = parseInt(retryAfterHeader || "0", 10);
        return new OpenRouterRateLimitError(message, retryAfterSeconds, errorDetails);
    }
    return new OpenRouterApiError(message, response.status, errorDetails);
  }


  public async getChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const payload = this._buildRequestPayload(request);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.apiKey}`,
    };
    if (this.httpReferer) headers["HTTP-Referer"] = this.httpReferer;
    if (this.siteName) headers["X-Title"] = this.siteName;

    const response = await this._fetchWithRetry(
      `${this.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw await this._parseError(response);
    }

    try {
      const data = await response.json();
      return data as ChatCompletionResponse;
    } catch (error) {
      console.error("OpenRouterService: Failed to parse JSON response.", error);
      throw new OpenRouterApiError("Failed to parse JSON response from OpenRouter.", response.status, error);
    }
  }
}
```

### Krok 4: Użycie Usługi w Aplikacji (np. w Astro API Endpoint)
Utwórz endpoint API w Astro, np. `src/pages/api/chat.ts`:

```typescript
// src/pages/api/chat.ts
import type { APIRoute } from 'astro';
import { OpenRouterService } from '../../lib/openrouter/OpenRouterService';
import type { Message } from '../../lib/openrouter/types'; // Zaimportuj typy

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const userMessages: Message[] = body.messages; // Oczekujemy tablicy wiadomości
    const model: string | undefined = body.model;   // Opcjonalny model

    if (!userMessages || !Array.isArray(userMessages) || userMessages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages are required and must be an array.' }), { status: 400 });
    }

    const openRouter = new OpenRouterService(); // Inicjalizacja z domyślną konfiguracją (z .env)

    // Przykładowe dodanie wiadomości systemowej
    const messagesWithSystemPrompt: Message[] = [
      { role: "system", content: "Jesteś pomocnym asystentem AI." },
      ...userMessages
    ];
    
    const completion = await openRouter.getChatCompletion({
      messages: messagesWithSystemPrompt,
      model: model || "openai/gpt-3.5-turbo", // Domyślny model jeśli nie podano
      // Można dodać response_format, temperature itp. na podstawie body requestu
    });

    return new Response(JSON.stringify(completion), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[API Chat Error]', error);
    
    let statusCode = 500;
    let errorMessage = 'An unexpected error occurred.';

    if (error.name === 'OpenRouterAuthError') statusCode = 401;
    else if (error.name === 'OpenRouterRateLimitError') statusCode = 429;
    else if (error.name === 'OpenRouterInvalidRequestError') statusCode = 400;
    else if (error.name === 'OpenRouterTimeoutError') statusCode = 408;
    
    if (error.message) errorMessage = error.message;
    if (error.statusCode) statusCode = error.statusCode;


    return new Response(JSON.stringify({ error: errorMessage, details: error.details }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

### Krok 5: Testowanie
1.  Uruchom aplikację Astro (`npm run dev` lub `yarn dev`).
2.  Użyj narzędzia takiego jak Postman, cURL lub prostego skryptu frontendowego, aby wysłać żądanie POST do `/api/chat` z odpowiednim ciałem JSON, np.:
    ```json
    {
      "messages": [
        { "role": "user", "content": "Witaj, jak się masz?" }
      ],
      "model": "openai/gpt-3.5-turbo"
    }
    ```
3.  Sprawdź odpowiedź i logi serwera.

Ten plan dostarcza solidnych podstaw do implementacji usługi OpenRouter. Pamiętaj o dostosowaniu typów, obsługi błędów i logiki do specyficznych potrzeb Twojego projektu. Rozważ dodanie bardziej zaawansowanych funkcji, takich jak strumieniowanie odpowiedzi, jeśli będą potrzebne.
