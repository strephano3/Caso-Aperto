const deadline = new Date("2026-07-30T23:00:00+02:00");

function updateCountdown() {
  const remaining = deadline.getTime() - Date.now();
  const countdown = document.querySelector("#countdown");

  if (!countdown) return;

  if (remaining <= 0) {
    countdown.textContent = "Iscrizioni chiuse";
    return;
  }

  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);

  document.querySelector("#days").textContent = String(days);
  document.querySelector("#hours").textContent = String(hours).padStart(2, "0");
}

async function copyIban(button) {
  const value = button.dataset.copy;
  const label = button.querySelector("strong");

  try {
    await navigator.clipboard.writeText(value);
    label.textContent = "Copiato";
  } catch {
    const field = document.createElement("textarea");
    field.value = value;
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    document.execCommand("copy");
    field.remove();
    label.textContent = "Copiato";
  }

  window.setTimeout(() => {
    label.textContent = "Copia";
  }, 1800);
}

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", () => copyIban(button));
});

updateCountdown();
window.setInterval(updateCountdown, 60_000);

function createNewsletterModal() {
  if (document.querySelector(".newsletter-modal") || document.body.classList.contains("thanks-page")) {
    return;
  }

  const modal = document.createElement("div");
  modal.className = "newsletter-modal";
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `
    <div class="newsletter-dialog" role="dialog" aria-modal="true" aria-labelledby="newsletter-title">
      <button class="newsletter-close" type="button" aria-label="Chiudi newsletter">×</button>
      <p class="eyebrow"><span></span> Newsletter Caso Aperto</p>
      <h2 id="newsletter-title">Le storie che vale la pena aprire.</h2>
      <p>Approfondimenti, nuovi casi, concorsi e chiamate aperte direttamente nella tua casella email.</p>
      <form class="newsletter-form" name="newsletter" method="POST" action="/api/telegram-form" data-telegram-form>
        <input type="hidden" name="tipo_modulo" value="Newsletter" />
        <label class="hidden-field">Non compilare <input name="bot-field" /></label>
        <input type="email" name="email" autocomplete="email" placeholder="La tua email" aria-label="Indirizzo email" required />
        <button class="button" type="submit">Iscriviti</button>
      </form>
      <p class="form-status" aria-live="polite"></p>
      <p class="newsletter-privacy">Iscrivendoti accetti la nostra <a href="privacy.html">privacy policy</a>. Puoi cancellarti in qualsiasi momento.</p>
    </div>
  `;

  document.body.appendChild(modal);

  const closeButton = modal.querySelector(".newsletter-close");
  const emailInput = modal.querySelector('input[type="email"]');

  const open = () => {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    window.setTimeout(() => emailInput.focus(), 50);
  };

  const close = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    localStorage.setItem("casoApertoNewsletterClosed", String(Date.now()));
  };

  document.querySelectorAll("[data-open-newsletter]").forEach((button) => {
    button.addEventListener("click", open);
  });

  closeButton.addEventListener("click", close);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) close();
  });

  const lastClosed = Number(localStorage.getItem("casoApertoNewsletterClosed") || 0);
  const fourteenDays = 14 * 24 * 60 * 60 * 1000;
  const canAutoOpen = !document.body.classList.contains("legal-page")
    && Date.now() - lastClosed > fourteenDays;

  if (canAutoOpen) {
    window.setTimeout(open, 8000);
  }
}

function createCookieBanner() {
  if (localStorage.getItem("casoApertoCookieChoice") || document.body.classList.contains("thanks-page")) {
    return;
  }

  const banner = document.createElement("aside");
  banner.className = "cookie-banner is-visible";
  banner.setAttribute("aria-label", "Preferenze cookie");
  banner.innerHTML = `
    <p>
      Usiamo dati locali necessari per ricordare le tue preferenze. La pagina del
      concorso incorpora un servizio Airtable di terze parti.
      <a href="cookie.html">Leggi la cookie policy</a>.
    </p>
    <div class="cookie-actions">
      <button type="button" data-cookie-choice="accepted">Ho capito</button>
      <button type="button" data-cookie-choice="necessary">Solo necessari</button>
    </div>
  `;

  document.body.appendChild(banner);
  banner.querySelectorAll("[data-cookie-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      localStorage.setItem("casoApertoCookieChoice", button.dataset.cookieChoice);
      banner.classList.remove("is-visible");
      window.setTimeout(() => banner.remove(), 200);
    });
  });
}

function createMobileMenu() {
  const header = document.querySelector(".site-header");
  if (!header || document.querySelector(".mobile-menu-toggle")) return;

  const toggle = document.createElement("button");
  toggle.className = "mobile-menu-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", "Apri il menu");
  toggle.innerHTML = "<span></span><span></span>";

  const menu = document.createElement("div");
  menu.className = "mobile-site-menu";
  menu.innerHTML = `
    <a href="index.html">Home</a>
    <a href="premio-caso-aperto-noir-2026.html">Premio Caso Aperto Noir 2026</a>
    <a href="collabora.html">Collabora con noi</a>
    <a href="contatti.html">Contatti</a>
    <button type="button" data-mobile-newsletter>Newsletter</button>
  `;

  header.append(toggle, menu);

  const close = () => {
    toggle.setAttribute("aria-expanded", "false");
    menu.classList.remove("is-open");
  };

  toggle.addEventListener("click", () => {
    const willOpen = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(willOpen));
    menu.classList.toggle("is-open", willOpen);
  });

  menu.querySelector("[data-mobile-newsletter]").addEventListener("click", () => {
    close();
    document.querySelector("[data-open-newsletter]")?.click();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
}

function setupTelegramForms() {
  document.querySelectorAll("[data-telegram-form]").forEach((form) => {
    if (form.dataset.telegramReady === "true") return;
    form.dataset.telegramReady = "true";

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const submitButton = form.querySelector('button[type="submit"]');
      const status = form.parentElement?.querySelector(".form-status")
        || form.querySelector(".form-status");
      const originalLabel = submitButton?.textContent;
      const payload = Object.fromEntries(new FormData(form).entries());

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Invio...";
      }
      if (status) {
        status.className = "form-status";
        status.textContent = "";
      }

      try {
        const response = await fetch(form.action, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result.error || "Invio non riuscito.");
        }

        form.reset();
        if (status) {
          status.className = "form-status is-success";
          status.textContent = "Messaggio inviato correttamente.";
        }
      } catch (error) {
        if (status) {
          status.className = "form-status is-error";
          status.textContent = error.message || "Errore durante l’invio. Riprova.";
        }
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalLabel;
        }
      }
    });
  });
}

createNewsletterModal();
createCookieBanner();
createMobileMenu();
setupTelegramForms();
