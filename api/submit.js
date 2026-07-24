/**
 * Vercel Serverless Function
 * POST /api/submit — forwards lead form data to Telegram bot
 *
 * Env vars (set in Vercel dashboard / CLI):
 *   TELEGRAM_BOT_TOKEN  — bot token from @BotFather
 *   TELEGRAM_CHAT_ID    — your personal or group chat id (required for delivery)
 */

async function resolveChatId(token) {
  if (process.env.TELEGRAM_CHAT_ID) {
    return String(process.env.TELEGRAM_CHAT_ID).trim();
  }

  // Fallback: last private chat that messaged the bot
  const res = await fetch(
    `https://api.telegram.org/bot${token}/getUpdates?limit=20&allowed_updates=${encodeURIComponent(JSON.stringify(["message"]))}`
  );
  const data = await res.json();
  if (!data.ok || !Array.isArray(data.result)) return null;

  for (let i = data.result.length - 1; i >= 0; i--) {
    const chat = data.result[i]?.message?.chat;
    if (chat && (chat.type === "private" || chat.type === "group" || chat.type === "supergroup")) {
      return String(chat.id);
    }
  }
  return null;
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildMessage(body) {
  const type = body.type === "quick" ? "Quick Lead" : "Full Assessment";
  const lines = [
    `🆕 <b>New ${escapeHtml(type)}</b>`,
    `🌐 <b>Worldwide Career Solution</b>`,
    ``,
    `👤 <b>Name:</b> ${escapeHtml(body.name || "—")}`,
    `📱 <b>Phone:</b> ${escapeHtml(body.phone || "—")}`,
  ];

  if (body.email) lines.push(`✉️ <b>Email:</b> ${escapeHtml(body.email)}`);
  if (body.education) lines.push(`🎓 <b>Education:</b> ${escapeHtml(body.education)}`);
  if (body.service) lines.push(`🛠️ <b>Service:</b> ${escapeHtml(body.service)}`);
  if (body.region || body.country) {
    lines.push(`🗺️ <b>Region/Country:</b> ${escapeHtml(body.region || body.country)}`);
  }
  if (body.message || body.notes) {
    lines.push(``);
    lines.push(`💬 <b>Notes:</b>`);
    lines.push(escapeHtml(body.message || body.notes));
  }

  lines.push(``);
  lines.push(`⏰ ${new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })} (Dhaka)`);
  return lines.join("\n");
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return res.status(500).json({
        ok: false,
        error: "Server misconfigured: TELEGRAM_BOT_TOKEN is missing",
      });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const name = (body.name || "").trim();
    const phone = (body.phone || "").trim();

    if (!name || !phone) {
      return res.status(400).json({
        ok: false,
        error: "Name and phone are required",
      });
    }

    const chatId = await resolveChatId(token);
    if (!chatId) {
      return res.status(503).json({
        ok: false,
        error:
          "Telegram chat not linked. Open the bot on Telegram, send /start, then set TELEGRAM_CHAT_ID on Vercel.",
        hint: "Message @Websitecontactforbot first",
      });
    }

    const text = buildMessage(body);
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const tgData = await tgRes.json();
    if (!tgData.ok) {
      console.error("Telegram API error:", tgData);
      return res.status(502).json({
        ok: false,
        error: tgData.description || "Failed to send Telegram message",
      });
    }

    return res.status(200).json({ ok: true, message: "Submitted successfully" });
  } catch (err) {
    console.error("submit error:", err);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    });
  }
};
