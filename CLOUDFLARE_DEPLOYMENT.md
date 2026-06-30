# Cloudflare Workers Deployment Guide

This guide explains how to deploy the Nightly Wisdom Telegram Bot to Cloudflare Workers using webhooks instead of polling.

## Prerequisites

- Node.js 18+ installed
- Wrangler CLI installed
- Cloudflare account
- Telegram Bot Token from [@BotFather](https://t.me/BotFather)
- Gemini API Key from [Google AI Studio](https://aistudio.google.com/)
- Admin Telegram User ID
- Channel username (e.g., Nightly_Wisdom)

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `@cloudflare/workers-types` - TypeScript types for Cloudflare Workers
- `typescript` - TypeScript compiler
- `wrangler` - Cloudflare Workers CLI

### 2. Configure Wrangler

Update `wrangler.toml` with your configuration:

```toml
name = "nightly-wisdom-bot"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "nightly-wisdom-db"
database_id = "your-d1-database-id"  # Will be filled after creating D1

[[kv_namespaces]]
binding = "KV"
id = "your-kv-namespace-id"  # Will be filled after creating KV

[vars]
CHANNEL_USERNAME = "Nightly_Wisdom"
```

### 3. Create D1 Database

```bash
# Create D1 database
wrangler d1 create nightly-wisdom-db

# Copy the database_id from the output and update wrangler.toml
```

### 4. Create KV Namespace

```bash
# Create KV namespace
wrangler kv:namespace create TEMP_STORAGE

# Copy the namespace id from the output and update wrangler.toml
```

### 5. Set Secrets

```bash
# Set Telegram Bot Token
wrangler secret put TELEGRAM_BOT_TOKEN

# Set Gemini API Key
wrangler secret put GEMINI_API_KEY

# Set Admin User ID
wrangler secret put ADMIN_USER_ID

# Set Telegram API ID (for Telethon if needed)
wrangler secret put TELEGRAM_API_ID

# Set Telegram API Hash (for Telethon if needed)
wrangler secret put TELEGRAM_API_HASH
```

### 6. Run Database Migrations

```bash
# Apply database schema
wrangler d1 execute nightly-wisdom-db --file=./migrations/0001_init.sql
```

## Local Development

### Run Locally

```bash
# Start local development server
npm run dev
```

This will start a local server at `http://localhost:8787`

### Test Webhook Locally

Use a tool like ngrok to expose your local server:

```bash
# Install ngrok
# Then run:
ngrok http 8787
```

Set the Telegram webhook to your ngrok URL:
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://<your-ngrok-url>"
```

## Deployment

### Deploy to Cloudflare Workers

```bash
# Deploy to Cloudflare
npm run deploy
```

This will:
- Build the TypeScript code
- Deploy to Cloudflare Workers
- Provide you with the worker URL

### Set Telegram Webhook

After deployment, set the webhook to your worker URL:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://<your-worker-url>.workers.dev"
```

Or use the Telegram API helper in the code:

```bash
# You can also set webhook via the bot itself by calling a special endpoint
# This will be implemented in a future update
```

## Architecture Changes

### From Polling to Webhooks

**Python (Polling):**
- Bot continuously polls Telegram for updates
- Long-running process
- Requires 24/7 server

**Cloudflare Workers (Webhooks):**
- Telegram sends updates to the worker via HTTP POST
- Event-driven, serverless
- No need for continuous polling
- Scales automatically

### Storage Changes

**SQLite → D1:**
- SQLite database file → Cloudflare D1 (SQLite-compatible)
- Same schema, different backend
- Managed by Cloudflare

**In-memory → KV:**
- Temporary message storage → Cloudflare KV
- Distributed key-value storage
- TTL support for automatic cleanup

### API Integration

**Gemini API:**
- Same API, called from Workers
- Uses `fetch` API (built into Workers)
- No changes needed

## Monitoring and Debugging

### View Logs

```bash
# View real-time logs
wrangler tail
```

### Check Webhook Status

```bash
# Check current webhook
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"

# Delete webhook (to switch back to polling if needed)
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook"
```

### Database Queries

```bash
# Query D1 database
wrangler d1 execute nightly-wisdom-db --command="SELECT * FROM users LIMIT 10"
```

## Troubleshooting

### Webhook Not Receiving Updates

1. Check webhook status: `getWebhookInfo`
2. Verify worker URL is correct
3. Check worker logs: `wrangler tail`
4. Ensure worker is deployed successfully

### Database Errors

1. Verify D1 database is created
2. Check migrations were applied
3. Test database connection with wrangler

### KV Storage Issues

1. Verify KV namespace is created
2. Check KV namespace ID in wrangler.toml
3. Test KV operations

### TypeScript Compilation Errors

If you see TypeScript errors:
```bash
# Install dependencies
npm install

# Type check
npm run typecheck
```

The errors shown in the IDE are expected before running `npm install` because the `@cloudflare/workers-types` package needs to be installed.

## Cost

**Cloudflare Workers Free Tier:**
- 100,000 requests/day
- 10ms CPU time per request
- Free for most bot use cases

**D1 Free Tier:**
- 5GB storage
- 5 million read requests/day
- 100,000 write requests/day

**KV Free Tier:**
- 100,000 read requests/day
- 1,000 write requests/day
- 1GB storage

**Total Cost:** Free for typical bot usage

## Scaling

The Workers architecture automatically scales:
- No need to manage servers
- Auto-scaling based on traffic
- Global edge deployment
- No cold starts for frequent requests

## Security

- Secrets are stored in Cloudflare's secure secret store
- Never commit secrets to git
- Use environment variables for configuration
- Webhook URL can be secured with a secret token (optional)

## Rollback

If you need to rollback to the Python version:

1. Delete webhook: `curl "https://api.telegram.org/bot<TOKEN>/deleteWebhook"`
2. Stop the Worker deployment
3. Run the Python bot with polling

## Migration Checklist

- [ ] Install Node.js and npm
- [ ] Install dependencies (`npm install`)
- [ ] Configure `wrangler.toml`
- [ ] Create D1 database
- [ ] Create KV namespace
- [ ] Set all secrets
- [ ] Run database migrations
- [ ] Deploy to Cloudflare Workers
- [ ] Set Telegram webhook
- [ ] Test bot functionality
- [ ] Monitor logs and performance

## Support

For issues with:
- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **D1 Database**: https://developers.cloudflare.com/d1/
- **KV Storage**: https://developers.cloudflare.com/kv/
- **Wrangler CLI**: https://developers.cloudflare.com/workers/wrangler/
