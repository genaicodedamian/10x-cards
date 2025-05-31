# Cloudflare Pages Deployment Setup

Ten dokument opisuje konfigurację automatycznego wdrażania aplikacji na Cloudflare Pages za pomocą GitHub Actions.

## Wymagane Sekrety GitHub

Aby workflow działał poprawnie, musisz skonfigurować następujące sekrety w ustawieniach repozytorium GitHub (Settings > Secrets and variables > Actions):

### Cloudflare Sekrety

1. **CLOUDFLARE_API_TOKEN**
   - Opis: Token API Cloudflare z uprawnieniami "Cloudflare Pages — Edit"
   - Jak uzyskać:
     1. Zaloguj się do panelu Cloudflare
     2. Przejdź do My Profile > API Tokens
     3. Kliknij "Create Token"
     4. Wybierz "Custom token"
     5. Ustaw uprawnienia: Account - Cloudflare Pages:Edit
     6. Skopiuj wygenerowany token

2. **CLOUDFLARE_ACCOUNT_ID**
   - Opis: ID konta Cloudflare
   - Jak uzyskać:
     1. Zaloguj się do panelu Cloudflare
     2. Przejdź do dowolnej domeny lub do sekcji Pages
     3. ID konta znajdziesz w prawym panelu w sekcji "API"
     4. Lub z URL: `https://dash.cloudflare.com/<ACCOUNT_ID>/pages`

3. **CLOUDFLARE_PROJECT_NAME**
   - Opis: Nazwa projektu Cloudflare Pages
   - Wartość: Nazwa projektu utworzonego w Cloudflare Pages (np. "10xcards")

### Supabase Sekrety

4. **SUPABASE_URL** - URL instancji Supabase
5. **SUPABASE_KEY** - Klucz Supabase
6. **PUBLIC_SUPABASE_URL** - Publiczny URL Supabase
7. **PUBLIC_SUPABASE_ANON_KEY** - Publiczny klucz anonimowy Supabase
8. **SUPABASE_SERVICE_ROLE_KEY** - Klucz roli serwisowej Supabase

### Inne Sekrety

9. **OPENROUTER_API_KEY** - Klucz API OpenRouter
10. **E2E_USERNAME_ID** - ID użytkownika do testów E2E
11. **E2E_USERNAME** - Nazwa użytkownika do testów E2E
12. **E2E_PASSWORD** - Hasło do testów E2E

## Workflow

Workflow `.github/workflows/master.yml` automatycznie:

1. **Uruchamia testy jednostkowe** - sprawdza czy kod jest poprawny
2. **Buduje aplikację** - tworzy wersję produkcyjną
3. **Wdraża na Cloudflare Pages** - publikuje aplikację

### Triggery

Workflow uruchamia się automatycznie gdy:
- Kod jest pushowany do brancha `master`
- Ręcznie przez GitHub Actions UI (workflow_dispatch)

### Struktura

```yaml
jobs:
  test:           # Uruchamia testy jednostkowe
  build-and-deploy: # Buduje i wdraża aplikację (tylko po udanych testach)
```

## Konfiguracja Cloudflare Pages

Upewnij się, że projekt Cloudflare Pages jest skonfigurowany z następującymi ustawieniami:

- **Framework preset**: Astro
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Node.js version**: 22.14.0 (zgodnie z `.nvmrc`)

## Zmienne Środowiskowe w Cloudflare

Wszystkie zmienne środowiskowe z `.env.example` muszą być również skonfigurowane w panelu Cloudflare Pages:

1. Przejdź do projektu w Cloudflare Pages
2. Settings > Environment variables
3. Dodaj wszystkie zmienne z odpowiednimi wartościami
4. Zaznacz "Encrypt" dla wrażliwych danych

## Troubleshooting

### Błąd: "No account id found"
- Sprawdź czy `CLOUDFLARE_ACCOUNT_ID` jest poprawnie ustawiony w sekretach GitHub

### Błąd: "Project not found"
- Sprawdź czy `CLOUDFLARE_PROJECT_NAME` odpowiada nazwie projektu w Cloudflare Pages

### Błąd: "Unauthorized"
- Sprawdź czy `CLOUDFLARE_API_TOKEN` ma odpowiednie uprawnienia
- Token musi mieć uprawnienia "Cloudflare Pages — Edit"

### Build fails
- Sprawdź czy wszystkie zmienne środowiskowe są ustawione
- Sprawdź logi budowania w GitHub Actions 