const allowedForms = new Set([
  "Contatti",
  "Candidatura collaborazione",
  "Newsletter",
]);

const fieldLabels = {
  nome: "Nome",
  email: "Email",
  motivo: "Motivo",
  messaggio: "Messaggio",
  profilo: "Profilo",
  portfolio: "Portfolio",
  presentazione: "Presentazione",
  privacy: "Privacy accettata",
};

function clean(value, maxLength = 2000) {
  return String(value ?? "")
    .replace(/\r/g, "")
    .trim()
    .slice(0, maxLength);
}

function buildMessage(data) {
  const type = clean(data.tipo_modulo, 80);
  const lines = [`NUOVO INVIO - ${type}`, ""];

  for (const [key, label] of Object.entries(fieldLabels)) {
    const value = clean(data[key]);
    if (value) lines.push(`${label}: ${value}`);
  }

  const receivedAt = new Date().toLocaleString("it-IT", {
    timeZone: "Europe/Rome",
  });
  lines.push("", `Ricevuto: ${receivedAt}`);

  return lines.join("\n").slice(0, 4096);
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Metodo non consentito." });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
    return response
      .status(503)
      .json({ error: "Il servizio Telegram non è ancora configurato." });
  }

  let data;
  try {
    data =
      typeof request.body === "string"
        ? JSON.parse(request.body)
        : request.body;
  } catch {
    return response.status(400).json({ error: "Dati del modulo non validi." });
  }

  if (!data || typeof data !== "object") {
    return response.status(400).json({ error: "Dati del modulo non validi." });
  }

  if (clean(data["bot-field"])) {
    return response.status(200).json({ ok: true });
  }

  const formType = clean(data.tipo_modulo, 80);
  if (!allowedForms.has(formType)) {
    return response.status(400).json({ error: "Modulo non riconosciuto." });
  }

  if (!clean(data.email, 320)) {
    return response.status(400).json({ error: "Inserisci un indirizzo email." });
  }

  if (formType === "Contatti" && (!clean(data.messaggio) || !clean(data.privacy))) {
    return response
      .status(400)
      .json({ error: "Completa il messaggio e accetta la privacy." });
  }

  if (
    formType === "Candidatura collaborazione"
    && (!clean(data.profilo) || !clean(data.presentazione) || !clean(data.privacy))
  ) {
    return response
      .status(400)
      .json({ error: "Completa i campi obbligatori e accetta la privacy." });
  }

  let telegramResponse;
  try {
    telegramResponse = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: buildMessage(data),
          disable_web_page_preview: true,
        }),
      },
    );
  } catch (error) {
    console.error("Telegram connection error:", error);
    return response
      .status(502)
      .json({ error: "Telegram non è raggiungibile. Riprova tra poco." });
  }

  if (!telegramResponse.ok) {
    const details = await telegramResponse.text();
    console.error("Telegram API error:", telegramResponse.status, details);
    return response
      .status(502)
      .json({ error: "Telegram non ha accettato il messaggio." });
  }

  return response.status(200).json({ ok: true });
}
