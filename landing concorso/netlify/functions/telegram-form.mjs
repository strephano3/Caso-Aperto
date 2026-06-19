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

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

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

  lines.push("", `Ricevuto: ${new Date().toLocaleString("it-IT", { timeZone: "Europe/Rome" })}`);
  return lines.join("\n").slice(0, 4096);
}

export default async (request) => {
  if (request.method !== "POST") {
    return json({ error: "Metodo non consentito." }, 405);
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
    return json({ error: "Il servizio Telegram non è ancora configurato." }, 503);
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: "Dati del modulo non validi." }, 400);
  }

  if (clean(data["bot-field"])) {
    return json({ ok: true });
  }

  const formType = clean(data.tipo_modulo, 80);
  if (!allowedForms.has(formType)) {
    return json({ error: "Modulo non riconosciuto." }, 400);
  }

  if (!clean(data.email, 320)) {
    return json({ error: "Inserisci un indirizzo email." }, 400);
  }

  if (formType === "Contatti" && (!clean(data.messaggio) || !clean(data.privacy))) {
    return json({ error: "Completa il messaggio e accetta la privacy." }, 400);
  }

  if (
    formType === "Candidatura collaborazione"
    && (!clean(data.profilo) || !clean(data.presentazione) || !clean(data.privacy))
  ) {
    return json({ error: "Completa i campi obbligatori e accetta la privacy." }, 400);
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
    return json({ error: "Telegram non è raggiungibile. Riprova tra poco." }, 502);
  }

  if (!telegramResponse.ok) {
    const details = await telegramResponse.text();
    console.error("Telegram API error:", telegramResponse.status, details);
    return json({ error: "Telegram non ha accettato il messaggio." }, 502);
  }

  return json({ ok: true });
};

export const config = {
  path: "/api/telegram-form",
};
