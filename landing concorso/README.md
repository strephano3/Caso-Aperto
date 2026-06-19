# Caso Aperto

Sito statico multipagina di Caso Aperto.

## Pagine

- `index.html` — homepage
- `premio-caso-aperto-noir-2026.html` — Premio Caso Aperto Noir 2026
- `collabora.html` — candidature per autori, grafici e video editor
- `contatti.html` — contatti e richieste
- `privacy.html` — informativa privacy
- `cookie.html` — cookie policy
- `termini.html` — termini di utilizzo
- `grazie.html` — conferma invio moduli

## Avvio locale

```bash
python3 -m http.server 8080
```

Aprire `http://localhost:8080`.

## Moduli

Il modulo del concorso è incorporato direttamente da Airtable:

`https://airtable.com/appxxgBaWMn27x003/pagxxU88NvjJ9pdsa/form`

Newsletter, contatti e candidature vengono inoltrati a Telegram da una Netlify
Function. Il token del bot non è incluso nei file pubblici.

### Configurazione Telegram

1. Creare un bot con `@BotFather` e conservare il token.
2. Aprire la chat con il bot e inviargli almeno un messaggio.
3. Recuperare il `chat_id` tramite il metodo `getUpdates` della Telegram Bot API.
4. Nel pannello Netlify aggiungere le variabili d'ambiente:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
5. Eseguire un nuovo deploy dopo aver salvato le variabili.

I moduli inviano i dati a `/api/telegram-form`, gestito da
`netlify/functions/telegram-form.mjs`.

Non inserire mai il token in `script.js`, nei file HTML o in un repository. Il
file `.env.example` mostra soltanto i nomi delle variabili.

Poiché il sito ora include una funzione serverless, pubblicarlo collegando il
progetto a un repository Git oppure tramite Netlify CLI. Il semplice drag-and-drop
dei soli file statici non attiva la funzione Telegram.

## Pubblicazione

La cartella può essere pubblicata senza build su Netlify, Vercel, GitHub Pages o
qualsiasi hosting statico. Per utilizzare i moduli senza configurare un backend,
pubblicare su Netlify.

Le pagine legali devono essere riesaminate se cambiano titolare, fornitori o
modalità di trattamento.
