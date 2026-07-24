# SOP — Worldwide Career Solution  
## Website Forms → Telegram Bot Delivery

**Document type:** Standard Operating Procedure  
**Project:** Worldwide Career Solution (Student Consultancy / Travel / Documentation)  
**Audience:** Owner, operator, or teammate who will receive leads  
**Status:** Live & working  

---

## 1. Purpose

This SOP explains how website form submissions are delivered to Telegram, what is already set up, and what the receiving user must do to get leads.

**End result:** When someone fills a form on the website, a message is automatically sent to the Telegram bot chat.

---

## 2. Live Links

| Item | Link |
|------|------|
| **Website (public)** | https://worldwide-career-solution.vercel.app |
| **GitHub repo** | https://github.com/fuhadanik/worldwide-career-solution |
| **Telegram bot** | https://t.me/Websitecontactforbot (`@Websitecontactforbot`) |
| **API health check** | https://worldwide-career-solution.vercel.app/api/submit |

---

## 3. How It Works (Simple Flow)

```
Visitor fills form on website
        ↓
Website sends data to /api/submit (Vercel serverless)
        ↓
Server formats the lead message
        ↓
Telegram Bot API sends message to configured chat
        ↓
You receive the lead in Telegram (bot chat)
```

### Forms that send leads

1. **Quick Lead** (hero section card) — name, phone, service, region, notes  
2. **Full Assessment** (assessment section) — name, phone, email, education, service, country, notes  

Both use the same backend: `POST /api/submit`.

---

## 4. What the Receiver Gets in Telegram

Each lead looks similar to this:

```
🆕 New Full Assessment   (or Quick Lead)
🌐 Worldwide Career Solution

👤 Name: …
📱 Phone: …
✉️ Email: …          (if provided)
🎓 Education: …      (if provided)
🛠️ Service: …
🗺️ Region/Country: …

💬 Notes:
…

⏰ date/time (Dhaka timezone)
```

---

## 5. One-Time Setup for a New Telegram Receiver

Telegram bots **cannot message you first**. The person who should receive leads must open the bot once.

### Steps for the user who will receive leads

1. Install / open **Telegram**.
2. Open the bot: **[@Websitecontactforbot](https://t.me/Websitecontactforbot)**.
3. Press **Start** or type **`/start`** (or any message like `Hi`).
4. Confirm the bot chat is open and not blocked/muted.
5. Ask the deployer to submit a **test lead** (or fill the form yourself on the website).
6. You should receive the test message in that same bot chat.

### If leads go to the wrong person

Currently the project is configured to deliver to the chat that completed setup during launch (chat ID is fixed in the API for reliability).

To point leads to a **new person**:

1. New person sends `/start` to `@Websitecontactforbot`.
2. Developer gets their chat ID from Telegram `getUpdates` (or BotFather-related tooling).
3. Developer updates `DEMO_CHAT_ID` in `api/submit.js` (or sets Vercel env `TELEGRAM_CHAT_ID`) and redeploys.

**Do not share the bot token publicly** outside trusted operators.

---

## 6. Operator Checklist (Day-to-Day)

| Task | Action |
|------|--------|
| Receive a lead | Open Telegram → chat with `@Websitecontactforbot` |
| Reply to customer | Call/WhatsApp the phone number in the message (bot does not auto-reply to the customer) |
| Test the pipeline | Submit the form on the live site with a fake name/phone, or call the API (see below) |
| Site down? | Open live URL; if broken, check Vercel dashboard / GitHub latest commit |
| No Telegram message? | Confirm bot not blocked; confirm chat ID still correct; check API health URL |

### Manual API test (optional)

```bash
curl -X POST "https://worldwide-career-solution.vercel.app/api/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "full",
    "name": "Test Lead",
    "phone": "+8801XXXXXXXXX",
    "email": "test@example.com",
    "service": "Student Consultancy",
    "country": "UK / Europe",
    "notes": "SOP test submission"
  }'
```

Expected success response:

```json
{"ok":true,"message":"Submitted to Telegram successfully","chat_id":"…"}
```

---

## 7. Technical Summary (For Developers)

| Piece | Detail |
|-------|--------|
| Hosting | **Vercel** (static HTML + serverless API) |
| Frontend | Single page: `index.html` (Tailwind CDN, Bengali UI) |
| Backend | `api/submit.js` — Node serverless function |
| Telegram | Bot token + chat ID (demo hardcodes allowed; env vars also supported) |
| Env vars (optional) | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` |
| Fallback | Quick form may open WhatsApp if Telegram API fails |

### Repo structure

```
worldwide-career-solution/
├── index.html          # Public website + form JS
├── api/submit.js       # Telegram delivery endpoint
├── vercel.json
├── README.md
└── SOP.md              # This document
```

### Deploy changes

```bash
git add -A
git commit -m "Describe change"
git push origin master
# Vercel auto-deploys if GitHub is linked; or: vercel --prod
```

---

## 8. Roles & Responsibilities

| Role | Responsibility |
|------|----------------|
| **Website visitor** | Fills Quick Lead or Full Assessment form |
| **Telegram receiver** | Monitors bot chat; contacts leads promptly |
| **Site owner / developer** | Maintains site, bot token, chat ID, Vercel project |

**Important:** The bot only **notifies** your team. It does **not** auto-message the student. Follow-up is manual (call / WhatsApp / email).

---

## 9. Troubleshooting

| Problem | Likely cause | Fix |
|---------|--------------|-----|
| Form submits but no Telegram message | Wrong/outdated chat ID; bot blocked | User sends `/start` again; update chat ID & redeploy |
| API returns `chatLinked: false` | Nobody has messaged the bot | Message `@Websitecontactforbot` |
| API 502 / Telegram error | Invalid token or chat banned bot | Check bot token with BotFather; re-add bot |
| Site loads, form spins forever | Network / API error | Check browser console; test `/api/submit` with curl |
| Leads go to old phone’s Telegram | Chat ID still set to old user | Change `TELEGRAM_CHAT_ID` / `DEMO_CHAT_ID` to new user |

Health check:

- Open: https://worldwide-career-solution.vercel.app/api/submit  
- Want: `"configured": true` and `"chatLinked": true`

---

## 10. Acceptance Criteria (Project “Done”)

Mark complete when all of the following are true:

- [x] Website live on Vercel  
- [x] Code on GitHub  
- [x] Forms call `/api/submit`  
- [x] Telegram bot receives test lead  
- [x] Receiver confirmed message in Telegram  
- [ ] (Optional) Custom domain connected  
- [ ] (Optional) Additional receivers / group chat configured  

---

## 11. Message Template (Copy-Paste to Teammate)

You can forward this short version:

---

**Worldwide Career Solution — Lead SOP (short)**

1. Live website: https://worldwide-career-solution.vercel.app  
2. When a visitor submits **Quick Lead** or **Full Assessment**, we get a Telegram alert.  
3. Open Telegram bot: https://t.me/Websitecontactforbot  
4. First time only: press **Start** / send **Hi**.  
5. All new leads appear in that bot chat with name, phone, service, and notes.  
6. Call or WhatsApp the lead using the phone number in the message.  
7. If you stop receiving messages, tell the developer — chat link may need refresh.

---

## 12. Document Control

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | 2026-07-24 | Initial SOP after live Telegram delivery confirmed |

**Contact for technical issues:** project owner / developer who manages the GitHub + Vercel project.
