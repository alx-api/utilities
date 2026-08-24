(() => {
  "use strict";

  const API_URL = "https://api-dev.tvmirrey.workers.dev/bonushunt/bonuses";
  const REFRESH_INTERVAL_MS = 15_000;

  const listElement = document.querySelector("#bonus-list");
  const countElement = document.querySelector("#bonus-count");

  function createPlaceholder() {
    const placeholder = document.createElement("div");
    placeholder.className = "bonus-card__placeholder";
    placeholder.setAttribute("aria-label", "Slot sin miniatura");
    placeholder.innerHTML = `
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect x="8" y="7" width="28" height="34" rx="5" stroke="currentColor" stroke-width="3"/>
        <rect x="13" y="13" width="18" height="12" rx="2" stroke="currentColor" stroke-width="2.5"/>
        <path d="M18 19h8M14 34h16M40 13v11" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
        <circle cx="40" cy="28" r="3" fill="currentColor"/>
      </svg>`;
    return placeholder;
  }

  function createMedia(slot) {
    const media = document.createElement("div");
    media.className = "bonus-card__media";

    if (!slot.imageUrl) {
      media.append(createPlaceholder());
      return media;
    }

    const image = document.createElement("img");
    image.className = "bonus-card__image";
    image.src = slot.imageUrl;
    image.alt = `Miniatura de ${slot.name}`;
    image.loading = "eager";
    image.addEventListener("error", () => media.replaceChildren(createPlaceholder()), { once: true });
    media.append(image);
    return media;
  }

  function createCard(item, index) {
    const slot = item && typeof item.slot === "object" ? item.slot : {};
    const card = document.createElement("article");
    card.className = "bonus-card";
    card.style.animationDelay = `${Math.min(index * 45, 360)}ms`;

    const content = document.createElement("div");
    content.className = "bonus-card__content";

    const name = document.createElement("h2");
    name.className = "bonus-card__name";
    name.textContent = slot.name || "Slot sin nombre";

    const provider = document.createElement("p");
    provider.className = "bonus-card__provider";
    provider.textContent = slot.provider || "Bonus pendiente";

    const position = document.createElement("span");
    position.className = "bonus-card__position";
    position.textContent = String(index + 1).padStart(2, "0");
    position.setAttribute("aria-label", `Posición ${index + 1}`);

    content.append(name, provider);
    card.append(createMedia(slot), content, position);
    return card;
  }

  function renderBonuses(items) {
    const bonuses = Array.isArray(items) ? items : [];
    countElement.textContent = bonuses.length;
    listElement.replaceChildren();
    listElement.setAttribute("aria-busy", "false");

    if (bonuses.length === 0) {
      const empty = document.createElement("div");
      empty.className = "bonus-status";
      empty.textContent = "No hay bonos pendientes por jugar.";
      listElement.append(empty);
      return;
    }

    const fragment = document.createDocumentFragment();
    bonuses.forEach((item, index) => fragment.append(createCard(item, index)));
    listElement.append(fragment);
  }

  function renderError() {
    if (listElement.querySelector(".bonus-card")) return;
    listElement.setAttribute("aria-busy", "false");
    const error = document.createElement("div");
    error.className = "bonus-status bonus-status--error";
    error.textContent = "No se pudo cargar la lista. Reintentando…";
    listElement.replaceChildren(error);
  }

  async function fetchBonuses() {
    try {
      const response = await fetch(API_URL, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      renderBonuses(await response.json());
    } catch (error) {
      console.error("Error al cargar los bonos:", error);
      renderError();
    }
  }

  fetchBonuses();
  window.setInterval(fetchBonuses, REFRESH_INTERVAL_MS);
})();
