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
- `SUPABASE_URL`: Your Supabase project URL (server-side)
- `SUPABASE_KEY`: Your Supabase anon key (server-side)
- `PUBLIC_SUPABASE_URL`: Your Supabase project URL (client-side)
- `PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key (client-side)
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (admin operations)
- `OPENROUTER_API_KEY`: Your OpenRouter API key for AI features

### Test Secrets (if running E2E tests)
- `E2E_USERNAME_ID`: Test user ID
- `E2E_USERNAME`: Test username
- `E2E_PASSWORD`: Test password

## Cloudflare Pages Environment Variables

**IMPORTANT**: You need to add these environment variables in your Cloudflare Pages dashboard:

### Go to: Cloudflare Dashboard > Pages > Your Project > Settings > Environment Variables

Add these variables for **Production** environment:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENROUTER_API_KEY=your-openrouter-key
```

### KV Namespace Configuration

Your project uses Cloudflare KV for Astro sessions. Make sure you have:

1. **Created KV namespaces** in Cloudflare dashboard:
   - `10x-cards-sessions` (production)
   - `10x-cards-preview` (preview)

2. **Updated wrangler.toml** with correct namespace IDs (already done)

## Deployment Process

1. **Push to master branch** - triggers automatic deployment via GitHub Actions
2. **Monitor build** in GitHub Actions tab
3. **Check deployment** in Cloudflare Pages dashboard
4. **Verify environment variables** are set correctly

## Troubleshooting

### Common Issues:

1. **500 Internal Server Error**:
   - Check environment variables in Cloudflare Pages
   - Verify Supabase credentials are correct
   - Check build logs for missing dependencies

2. **Missing Environment Variables**:
   - Ensure all required variables are set in Cloudflare Pages
   - Variables must be set for the correct environment (Production/Preview)

3. **KV Binding Errors**:
   - Verify KV namespaces exist in Cloudflare
   - Check wrangler.toml has correct namespace IDs

4. **Build Failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Review build logs for specific errors

## Testing

After deployment:
1. Visit your Cloudflare Pages URL
2. Test authentication flow
3. Verify all features work correctly
4. Check browser console for any client-side errors

## Support

If you encounter issues:
1. Check Cloudflare Pages build logs
2. Review GitHub Actions workflow logs
3. Verify environment variable configuration
4. Test locally with same environment variables

## Local Development

For local development with Cloudflare bindings:

```bash
# Install dependencies
npm install

# Start development server with Cloudflare runtime
npm run dev
```

The project is configured to use Cloudflare's platform proxy for local development, giving you access to KV and other bindings locally. 