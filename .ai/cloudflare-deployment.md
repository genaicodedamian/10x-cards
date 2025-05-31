# Wdrożenie Aplikacji Astro na Cloudflare Pages

Ten dokument opisuje krok po kroku proces wdrożenia aplikacji zbudowanej w oparciu o framework Astro na platformę Cloudflare Pages. Instrukcja zakłada, że posiadasz już projekt Astro oraz konto na platformach GitHub/GitLab oraz Cloudflare.

## ✒️ Wymagania Wstępne

1.  **Konto Cloudflare**: Aktywne konto na platformie Cloudflare.
2.  **Projekt Astro**: Istniejący projekt Astro umieszczony w repozytorium Git (GitHub lub GitLab).
3.  **Node.js**: Zainstalowane środowisko Node.js w wersji `18.14.1` lub nowszej.

---

## Krok 1: Konfiguracja Projektu Astro

Aby umożliwić wdrożenie na Cloudflare Pages, projekt Astro musi być skonfigurowany do trybu **Server-Side Rendering (SSR)** oraz posiadać odpowiedni adapter.

### 1.1. Instalacja Adaptera Cloudflare

W terminalu, w głównym katalogu projektu, wykonaj poniższą komendę, aby dodać integrację Astro z Cloudflare:

```bash
npx astro add cloudflare
```

### 1.2. Weryfikacja Konfiguracji

Uruchomienie powyższej komendy automatycznie wprowadzi niezbędne zmiany w pliku `astro.config.mjs`. Upewnij się, że plik konfiguracyjny zawiera poniższe wpisy:

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare()
});
```

Kluczowe parametry:

- `output: 'server'`: Informuje Astro, aby budować aplikację do wdrożenia w środowisku serwerowym (SSR), a nie jako statyczne pliki.
- `adapter: cloudflare()`: Aktywuje adapter, który przygotowuje kod projektu do uruchomienia na infrastrukturze Cloudflare Workers.

### 1.3. (Opcjonalnie) Lokalne Testowanie

Aby przetestować aplikację w trybie zbliżonym do produkcyjnego, możesz użyć narzędzia wrangler.

Najpierw zainstaluj wrangler:

```bash
npm install -g wrangler
```

Następnie uruchom podgląd produkcyjnej wersji aplikacji lokalnie:

```bash
npm run build
npx wrangler pages dev ./dist
```

Twoja aplikacja będzie dostępna pod adresem `http://localhost:8788`.

## Krok 2: Wdrożenie w Panelu Cloudflare

Po przygotowaniu kodu aplikacji czas na konfigurację wdrożenia w panelu Cloudflare.

### 2.1. Tworzenie Projektu

- Zaloguj się do panelu Cloudflare.
- Przejdź do sekcji Workers & Pages.
- Kliknij Create application > Pages > Connect to Git.
- Wybierz swoje repozytorium z kodem aplikacji i zatwierdź dostęp.

### 2.2. Konfiguracja Build & Deployments

Po połączeniu z repozytorium, skonfiguruj proces budowania:

- Production branch: Wybierz gałąź, która ma być wdrażana na produkcję (np. main lub master).
- Framework preset: Wybierz z listy Astro. Cloudflare automatycznie uzupełni ustawienia budowania.

Upewnij się, że ustawienia są następujące:

- Build command: `npm run build`
- Build output directory: `/dist`
- Root directory: `/` (lub podkatalog, jeśli projekt nie jest w głównym katalogu repozytorium).

Kliknij przycisk Save and Deploy. Cloudflare rozpocznie proces budowania i wdrażania Twojej aplikacji. Po kilku chwilach aplikacja będzie dostępna pod unikalnym adresem `*.pages.dev`.

## Krok 3: Zarządzanie Zmiennymi Środowiskowymi

W aplikacjach SSR często używa się zmiennych środowiskowych do przechowywania kluczy API, sekretów czy innych danych konfiguracyjnych.

### Dodawanie Zmiennych w Cloudflare

- W panelu projektu Cloudflare Pages przejdź do zakładki Settings > Environment variables.
- Kliknij Add variable i wprowadź nazwę oraz wartość zmiennej.
- Zaznacz opcję Encrypt, aby zabezpieczyć wrażliwe dane (np. klucze API). Zaszyfrowane zmienne nie będą widoczne w panelu po zapisaniu.

### Dostęp do Zmiennych w Kodzie Astro

Zmienne środowiskowe zdefiniowane w panelu Cloudflare są dostępne w kodzie Astro (pliki .astro, .ts, .js) za pomocą obiektu `import.meta.env`:

```javascript
// src/pages/api/example.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ request }) => {
  // Dostęp do zmiennej środowiskowej
  const apiKey = import.meta.env.YOUR_API_KEY;

  if (!apiKey) {
    return new Response('API key is missing', { status: 500 });
  }

  // ... logika endpointu ...

  return new Response(JSON.stringify({ message: 'Success' }));
};
```

Pamiętaj, aby włączyć typowanie dla `import.meta.env` poprzez dodanie pliku `env.d.ts` w katalogu `src/` z odpowiednią definicją:

```typescript
// src/env.d.ts
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly YOUR_API_KEY: string;
  // Dodaj inne zmienne tutaj
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

Twoja aplikacja Astro jest teraz wdrożona i gotowa do skalowania na globalnej sieci Cloudflare. 🚀
