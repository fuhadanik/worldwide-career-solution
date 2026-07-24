# Worldwide Career Solution

Student consultancy, travel & documentation website (Bengali UI).

## Live

Deployed on Vercel from this repository.

## Forms → Telegram

Both the **Quick Lead** and **Full Assessment** forms POST to `/api/submit`, which sends a formatted message to your Telegram bot.

### Required environment variables (Vercel)

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Bot token from [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_CHAT_ID` | Your user/group chat id that should receive leads |

### Link your chat (one-time)

1. Open Telegram and message [@Websitecontactforbot](https://t.me/Websitecontactforbot) with `/start`
2. Get your chat id:
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getUpdates"
   ```
   Look for `"chat":{"id": 123456789}`
3. Set `TELEGRAM_CHAT_ID` in the Vercel project Environment Variables, then redeploy

## Local

```bash
# optional: vercel dev (needs Vercel CLI + env)
cp .env.example .env
# edit .env
vercel dev
```

## Stack

- Static HTML + Tailwind CDN + Font Awesome
- Vercel Serverless Function (`/api/submit`) for Telegram delivery
