/**
 * POST /api/submit — send form leads to Telegram
 * Demo: token is hardcoded (override with env if set).
 *
 * IMPORTANT: Someone must open @Websitecontactforbot and send /start once
 * so we have a chat_id. After that, getUpdates auto-resolves the chat.
 * Optionally set TELEGRAM_CHAT_ID for a fixed destination.
 */

// Demo hardcode — replace/regenerate for production use
const DEMO_BOT_TOKEN = "8483167901:AAFNUkXgL5Wqn9y5GDtU0l0NrG1ds3H7so4";
// Fixed chat id from @iamIbrahim1 who messaged the bot
const DEMO_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "1910951333";

function getToken() {
  return (process.env.TELEGRAM_BOT_TOKEN || DEMO_BOT_TOKEN || "").trim();
}

async function resolveChatId(token) {
  if (DEMO_CHAT_ID) return String(DEMO_CHAT_ID).trim();

  const res = await fetch(
    `https://api.telegram.org/bot${token}/getUpdates?limit=50`
  );
  const data = await res.json();
  if (!data.ok || !Array.isArray(data.result) || data.result.length === 0) {
    return null;
  }

  // Prefer most recent private chat, then group
  for (let i = data.result.length - 1; i >= 0; i--) {
    const u = data.result[i];
    const chat =
      u?.message?.chat ||
      u?.edited_message?.chat ||
      u?.channel_post?.chat ||
      u?.my_chat_member?.chat;
    if (!chat) continue;
    if (chat.type === "private") return String(chat.id);
  }
  for (let i = data.result.length - 1; i >= 0; i--) {
    const u = data.result[i];
    const chat =
      u?.message?.chat ||
      u?.my_chat_member?.chat;
    if (chat && (chat.type === "group" || chat.type === "supergroup")) {
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
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // GET = health / setup status for demos
  if (req.method === "GET") {
    const token = getToken();
    const chatId = token ? await resolveChatId(token) : null;
    return res.status(200).json({
      ok: true,
      configured: Boolean(token),
      chatLinked: Boolean(chatId),
      bot: "@Websitecontactforbot",
      hint: chatId
        ? "Ready — form submissions will be delivered to Telegram."
        : "Open Telegram → message @Websitecontactforbot with /start, then submit a form.",
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const token = getToken();
    if (!token) {
      return res.status(500).json({
        ok: false,
        error: "TELEGRAM_BOT_TOKEN is missing",
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
          "No Telegram chat linked yet. Open @Websitecontactforbot, send /start, then try again.",
        bot: "https://t.me/Websitecontactforbot",
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

    return res.status(200).json({
      ok: true,
      message: "Submitted to Telegram successfully",
      chat_id: chatId,
    });
  } catch (err) {
    console.error("submit error:", err);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    });
  }
};
