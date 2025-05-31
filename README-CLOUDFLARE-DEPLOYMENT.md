# Cloudflare Pages Deployment Setup

This guide explains how to set up CI/CD deployment to Cloudflare Pages for this Astro project.

## Prerequisites

1. **Cloudflare Account**: You need a Cloudflare account with access to Pages
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Node.js**: Project uses Node.js (version specified in `.nvmrc`)

## Required Secrets

Configure these secrets in your GitHub repository settings under `Settings > Secrets and variables > Actions`:

### Cloudflare Secrets
- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token with Pages permissions
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
- `CLOUDFLARE_PROJECT_NAME`: Your Cloudflare Pages project name

### Application Secrets
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase anon key
- `PUBLIC_SUPABASE_URL`: Your Supabase project URL (public)
- `PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key (public)
- `OPENROUTER_API_KEY`: Your OpenRouter API key for AI features
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

### Test Secrets (if running E2E tests)
- `E2E_USERNAME_ID`: Test user ID
- `E2E_USERNAME`: Test username
- `E2E_PASSWORD`: Test password

## Cloudflare KV Setup for Sessions

This project uses Astro sessions with Cloudflare KV storage. You need to create a KV namespace:

### 1. Create KV Namespace

```bash
# Install Wrangler CLI if you haven't already
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create KV namespace for sessions
wrangler kv namespace create "SESSION"
```

This will output something like:
```
🌀 Creating namespace with title "SESSION"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "SESSION", id = "your-kv-namespace-id" }
```

### 2. Create Preview KV Namespace

```bash
# Create preview namespace
wrangler kv namespace create "SESSION" --preview
```

This will output:
```
🌀 Creating namespace with title "SESSION"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "SESSION", preview_id = "your-preview-kv-namespace-id" }
```

### 3. Update wrangler.toml

Update the `wrangler.toml` file with your actual KV namespace IDs:

```toml
name = "10x-cards"
compatibility_date = "2024-05-31"

# KV namespace for Astro sessions
[[kv_namespaces]]
binding = "SESSION"
id = "your-actual-kv-namespace-id"
preview_id = "your-actual-preview-kv-namespace-id"
```

### 4. Configure Cloudflare Pages Project

In your Cloudflare dashboard:

1. Go to **Workers & Pages**
2. Select your Pages project
3. Go to **Settings** > **Functions**
4. Add the KV namespace binding:
   - **Variable name**: `SESSION`
   - **KV namespace**: Select the namespace you created

## Environment Configuration

### GitHub Environment

1. Go to your repository settings
2. Navigate to **Environments**
3. Create an environment named `production`
4. Add all the required secrets listed above

### Cloudflare Pages Environment Variables

In your Cloudflare Pages project settings, add these environment variables:

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `OPENROUTER_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Deployment Process

The deployment happens automatically when you push to the `master` branch:

1. **Tests Run**: Unit and component tests are executed
2. **Build**: Project is built with all environment variables
3. **Deploy**: Built files are deployed to Cloudflare Pages using Wrangler

## Manual Deployment

You can also trigger deployment manually:

1. Go to your GitHub repository
2. Navigate to **Actions**
3. Select the "Deploy to Cloudflare Pages" workflow
4. Click **Run workflow**

## Troubleshooting

### Build Fails with "missing app token"

If you see errors about missing app tokens, ensure all environment variables are properly set in both GitHub secrets and Cloudflare Pages environment variables.

### KV Binding Errors

If you see errors about SESSION binding:

1. Verify KV namespace is created
2. Check `wrangler.toml` has correct IDs
3. Ensure binding is configured in Cloudflare Pages project settings

### React 18 Compatibility

This project uses React 18 for Cloudflare Workers compatibility. If you encounter React-related errors, ensure you're not accidentally upgrading to React 19.

## Local Development

For local development with Cloudflare bindings:

```bash
# Install dependencies
npm install

# Start development server with Cloudflare runtime
npm run dev
```

The project is configured to use Cloudflare's platform proxy for local development, giving you access to KV and other bindings locally. 