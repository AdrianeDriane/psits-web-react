# 🚀 Setup Discord Notifications for Fork PRs

## The Problem
- GitHub Actions secrets **don't work** for fork PRs (security feature)
- Your workflow uses forking (industry standard)
- You need notifications for **ALL PRs**, including forks

## ✅ The Solution: Webhook Middleware

Use GitHub's native webhook system + a middleware service to forward to Discord.

```
GitHub PR → GitHub Webhook → Middleware → Discord
           (works for forks)  (has webhook URL)
```

## Quick Setup (5 minutes)

### Step 1: Deploy Middleware to Vercel (Free)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   cd .github/webhook-middleware
   vercel deploy --prod
   ```

3. **Set Environment Variable:**
   - Go to: [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project
   - Settings → Environment Variables
   - Add: `DISCORD_WEBHOOK_URL` = your Discord webhook URL
   - Redeploy

4. **Copy your Vercel URL:**
   - Example: `https://your-app.vercel.app`
   - Your webhook endpoint: `https://your-app.vercel.app/webhook`

### Step 2: Set Up GitHub Webhook

1. **Go to GitHub:**
   - Repository → Settings → Webhooks → Add webhook

2. **Configure:**
   - **Payload URL:** `https://your-app.vercel.app/webhook`
   - **Content type:** `application/json`
   - **Secret:** (optional, leave empty for now)
   - **Events:** Select:
     - ✅ Pull requests
     - ✅ Pull request reviews
   - **Active:** ✅

3. **Save webhook**

### Step 3: Test It!

1. Create a test PR (even from a fork)
2. Check your Discord channel
3. ✅ You should see the notification!

## Alternative: Deploy to Netlify

1. **Install Netlify CLI:**
   ```bash
   npm i -g netlify-cli
   ```

2. **Deploy:**
   ```bash
   cd .github/webhook-middleware
   netlify deploy --prod
   ```

3. **Set Environment Variable:**
   - Netlify Dashboard → Site settings → Environment variables
   - Add: `DISCORD_WEBHOOK_URL`

4. **Set up GitHub webhook** (same as Vercel, but use Netlify URL)

## How It Works

1. **GitHub sends webhook** → Your middleware (works for forks!)
2. **Middleware receives event** → Formats for Discord
3. **Middleware sends to Discord** → Using stored webhook URL
4. **✅ Notification appears in Discord!**

## Benefits

- ✅ Works for **fork PRs** (the main problem solved!)
- ✅ Works for **same-repo PRs** too
- ✅ Free hosting (Vercel/Netlify free tier)
- ✅ No secrets exposed to PRs
- ✅ Simple setup (5 minutes)

## Troubleshooting

### Not receiving notifications?

1. **Check Vercel/Netlify logs:**
   - Vercel: Dashboard → Your project → Functions → View logs
   - Netlify: Site → Functions → View logs

2. **Check GitHub webhook:**
   - Settings → Webhooks → Your webhook → Recent deliveries
   - Check if requests are being sent

3. **Verify environment variable:**
   - Make sure `DISCORD_WEBHOOK_URL` is set correctly
   - Redeploy after setting environment variable

4. **Test webhook manually:**
   ```bash
   curl -X POST https://your-app.vercel.app/webhook \
     -H "Content-Type: application/json" \
     -H "X-GitHub-Event: pull_request" \
     -d '{"action":"opened","pull_request":{"number":1,"title":"Test","html_url":"https://github.com/test/test/pull/1","user":{"login":"test"},"head":{"ref":"feature"},"base":{"ref":"main"},"changed_files":1,"commits":1,"additions":10,"deletions":5}},"sender":{"login":"test"}}'
   ```

## Keep GitHub Actions Workflow?

You can keep both:
- **GitHub Actions workflow** → For same-repo PRs (with more features)
- **Webhook middleware** → For fork PRs (simple notifications)

Or disable the GitHub Actions workflow and use only the middleware (simpler, works for all PRs).

## Next Steps

1. ✅ Deploy middleware
2. ✅ Set up GitHub webhook
3. ✅ Test with a fork PR
4. 🎉 Enjoy notifications for ALL PRs!

