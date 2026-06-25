


let cachedWebhook = null;

async function getWebhook() {
  if (cachedWebhook !== null) return cachedWebhook;
  const configs = await db.entities.AppConfig.filter({ key: "discord_webhook" });
  cachedWebhook = configs[0]?.value || "";
  return cachedWebhook;
}

export async function notifyDiscord(embed) {
  const webhook = await getWebhook();
  if (!webhook) return;
  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [{ ...embed, footer: { text: "NorthPoint Roleplay — MDT Comercios" } }] }),
    });
  } catch {
    // silently fail — webhook errors shouldn't break the UI
  }
}

export const DISCORD_COLORS = {
  yellow: 0xFDDC03,
  red: 0xFF4444,
  green: 0x44FF88,
  blue: 0x5865F2,
  orange: 0xFF8C00,
};