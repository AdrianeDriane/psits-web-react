# Discord Webhook Middleware for Fork PRs

This middleware service allows Discord notifications to work for **fork PRs** by acting as a bridge between GitHub webhooks and Discord.

## Why This Exists

GitHub Actions secrets are **not available for fork PRs** (security feature). This middleware solves that by:
1. Receiving GitHub webhooks (works for fork PRs)
2. Forwarding to Discord using the webhook URL stored in the middleware

## Setup Options

### Option 1: Deploy to Vercel (Recommended - Free)

1. **Deploy the middleware:**
   ```bash
   cd .github/webhook-middleware
   vercel deploy
   ```

2. **Set environment variable in Vercel:**
   - Go to Vercel dashboard → Your project → Settings → Environment Variables
   - Add: `DISCORD_WEBHOOK_URL` = your Discord webhook URL

3. **Set up GitHub Webhook:**
   - Go to: GitHub Repo → Settings → Webhooks → Add webhook
   - Payload URL: `https://your-vercel-app.vercel.app/webhook`
   - Content type: `application/json`
   - Events: Select "Pull requests" and "Pull request reviews"
   - Active: ✅

### Option 2: Deploy to Netlify (Free)

1. **Deploy the middleware:**
   ```bash
   cd .github/webhook-middleware
   netlify deploy --prod
   ```

2. **Set environment variable in Netlify:**
   - Go to Netlify dashboard → Site settings → Environment variables
   - Add: `DISCORD_WEBHOOK_URL` = your Discord webhook URL

3. **Set up GitHub Webhook:**
   - Same as Vercel, but use your Netlify URL

### Option 3: Deploy to Railway/Render (Free tier available)

Same process - deploy the function and set the environment variable.

## How It Works

```
GitHub PR Event → GitHub Webhook → Middleware Service → Discord
                    (works for forks)    (has webhook URL)
```

The middleware:
- Receives GitHub webhook payload
- Formats it for Discord
- Sends to Discord using the stored webhook URL
- Works for **ALL PRs** including forks!

## Security

- Discord webhook URL is stored in middleware's environment variables (not in GitHub)
- Only the middleware endpoint is public (GitHub webhook URL)
- No secrets exposed to fork PRs

