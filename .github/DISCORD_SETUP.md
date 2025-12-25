# Discord Webhook Setup Guide

## 🎯 Solution for Fork PRs

**IMPORTANT:** If you use forking workflow (industry standard), GitHub Actions secrets **won't work** for fork PRs. 

**✅ Use the Middleware Solution** (see below) - it works for **ALL PRs including forks!**

---

## How to Set Up Discord Notifications for PRs

### Option A: Middleware Solution (Works for Fork PRs) ⭐ RECOMMENDED

This solution works for **ALL PRs including fork PRs** by using GitHub's native webhook system.

See: [`.github/webhook-middleware/README.md`](../webhook-middleware/README.md)

**Quick Setup:**
1. Deploy middleware to Vercel/Netlify (free)
2. Set `DISCORD_WEBHOOK_URL` in middleware's environment variables
3. Set up GitHub webhook pointing to your middleware URL
4. ✅ Works for fork PRs!

### Option B: GitHub Actions (Only works for same-repo PRs)

### Step 1: Create a Discord Webhook

1. Open your Discord server
2. Go to **Server Settings** → **Integrations** → **Webhooks**
3. Click **New Webhook** or **Create Webhook**
4. Configure the webhook:
   - **Name**: `PSITS CI/CD` (or any name you prefer)
   - **Channel**: Select the channel where you want notifications
   - **Avatar**: Optional (you can use the PSITS logo)
5. Click **Copy Webhook URL** - **Save this URL!** You won't be able to see it again

### Step 2: Add Secret to GitHub Repository

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Configure the secret:
   - **Name**: `DISCORD_WEBHOOK_URL` (must be exactly this name)
   - **Secret**: Paste the Discord webhook URL you copied in Step 1
5. Click **Add secret**

### Step 3: Verify Setup

1. Create a test PR or wait for the next PR event
2. Check the GitHub Actions workflow logs
3. If successful, you should see:
   ```
   ✅ Successfully sent Discord notification (HTTP 204)
   ```
4. Check your Discord channel for the notification

## Troubleshooting

### Issue: "Discord webhook URL not available"

**Important distinction:**

#### 🔒 Fork PRs (from different repository)
- **Secrets are NOT available** - This is a GitHub security feature
- **Cannot be changed** - This is expected behavior
- **Workflow still runs** - But Discord notifications will be skipped
- **Why?** GitHub doesn't allow fork PRs to access secrets to prevent malicious code from stealing secrets

**Solution for fork PRs:**
- ❌ You **cannot** add secrets to make fork PRs work
- ✅ The workflow will still run and process the PR
- ✅ After merging the fork PR, future PRs from the same repo will have access to secrets
- ✅ Or create branches directly in the repository (not from a fork)

#### 📋 Same-Repo PRs (from same repository)
- **Secrets ARE available** - You need to set them up
- **Must configure** - Add the secret in repository settings

**Solution for same-repo PRs:**
1. Go to: **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `DISCORD_WEBHOOK_URL` (exact name, case-sensitive)
4. Value: Your Discord webhook URL
5. Click **Add secret**

### Issue: "Discord webhook returned HTTP 4xx"

**Possible causes:**
1. Webhook URL is invalid or expired
2. Webhook was deleted from Discord
3. Webhook URL was modified

**Solution:**
1. Create a new webhook in Discord
2. Update the `DISCORD_WEBHOOK_URL` secret in GitHub with the new URL

### Issue: Notifications not appearing in Discord

**Check:**
1. Verify the webhook is still active in Discord
2. Check the channel permissions (webhook needs permission to send messages)
3. Check GitHub Actions logs for any errors
4. Verify the secret name is exactly `DISCORD_WEBHOOK_URL` (case-sensitive)

## Security Notes

- **Never commit the webhook URL to the repository**
- Webhook URLs are sensitive - treat them like passwords
- If a webhook URL is exposed, delete it immediately and create a new one
- Fork PRs cannot access secrets for security reasons (this is expected)

## Testing

To test if your webhook is working, you can manually send a test message:

```bash
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"content": "Test message from PSITS CI/CD"}'
```

If successful, you should see the message appear in your Discord channel.

