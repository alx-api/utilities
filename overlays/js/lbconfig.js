(function () {
  "use strict";

  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  const apiBase = isLocal
    ? "https://api-dev.ialexk.workers.dev"
    : "https://api.ialexk.workers.dev";
  const configUrl = `${apiBase}/config`;

  const form = document.querySelector("#config-form");
  const fields = document.querySelector("#config-fields");
  const status = document.querySelector("#status");
  const statusText = document.querySelector("#status-text");
  const environment = document.querySelector("#environment");
  const reloadButton = document.querySelector("#reload-button");
  const submitButton = document.querySelector("#submit-button");
  const submitLabel = submitButton.querySelector(".button-label");

  const inputs = {
    provider: document.querySelector("#provider"),
    title: document.querySelector("#title"),
    qualificationType: form.elements.qualificationType,
    qualificationValue: document.querySelector("#qualificationValue"),
    sheetId: document.querySelector("#sheetId"),
    flaggedPlayers: document.querySelector("#flaggedPlayers"),
    highlightedPlayers: document.querySelector("#highlightedPlayers"),
  };

  environment.textContent = isLocal ? "Desarrollo" : "Producción";

  function setStatus(message, state) {
    statusText.textContent = message;
    status.dataset.state = state;
  }

  function setBusy(isBusy, label) {
    fields.disabled = isBusy;
    submitLabel.textContent = label || "Guardar cambios";
  }

  function normalizePlayerList(value, forPost = false) {
    const trimmed = String(value ?? "").trim();
    const names = trimmed.startsWith("[") && trimmed.endsWith("]")
      ? trimmed.slice(1, -1).trim()
      : trimmed;
    if (!forPost) return names;
    return `[${names.split(",").map((name) => name.trim()).filter(Boolean).join(",")}]`;
  }

  function isPlayerList(value) {
    const trimmed = value.trim();
    return !trimmed.includes("[") && !trimmed.includes("]");
  }

  function fillForm(config) {
    inputs.provider.value = config.provider ?? "";
    inputs.title.value = config.title ?? "";
    inputs.qualificationType.value = config.qualificationType ?? "";
    updateQualificationLabel();
    inputs.qualificationValue.value = config.qualificationValue ?? "";
    inputs.sheetId.value = config.sheetId ?? "";
    inputs.flaggedPlayers.value = normalizePlayerList(config.flaggedPlayers);
    inputs.highlightedPlayers.value = normalizePlayerList(config.highlightedPlayers);
  }

  async function parseResponse(response) {
    const contentType = response.headers.get("content-type") || "";
    const body = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message = typeof body === "object" && body
        ? body.message || body.error
        : body;
      throw new Error(message || `La solicitud falló (${response.status}).`);
    }

    return body;
  }

  async function loadConfig() {
    setBusy(true, "Cargando…");
    setStatus("Cargando configuración…", "loading");

    try {
      const response = await fetch(configUrl, {
        method: "GET",
        cache: "no-store",
      });
      const config = await parseResponse(response);

      if (!config || typeof config !== "object") {
        throw new Error("El servidor devolvió una configuración no válida.");
      }

      fillForm(config);
      setStatus("Configuración cargada. Puedes editar los valores.", "success");
    } catch (error) {
      setStatus(`No fue posible cargar la configuración: ${error.message}`, "error");
    } finally {
      setBusy(false);
    }
  }

  function getPayload() {
    return {
      provider: inputs.provider.value.trim(),
      title: inputs.title.value.trim(),
      qualificationType: inputs.qualificationType.value.trim(),
      qualificationValue: inputs.qualificationValue.value.trim(),
      sheetId: inputs.sheetId.value.trim(),
      flaggedPlayers: normalizePlayerList(inputs.flaggedPlayers.value, true),
      highlightedPlayers: normalizePlayerList(inputs.highlightedPlayers.value, true),
    };
  }

  async function saveConfig(event) {
    event.preventDefault();

    if (!form.reportValidity()) {
      setStatus("Revisa los campos obligatorios antes de guardar.", "error");
      return;
    }

    if (!isPlayerList(inputs.flaggedPlayers.value) || !isPlayerList(inputs.highlightedPlayers.value)) {
      setStatus("Escribe solo nombres separados por comas, sin corchetes.", "error");
      return;
    }

    setBusy(true, "Guardando…");
    setStatus("Guardando cambios…", "loading");

    try {
      const response = await fetch(configUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(getPayload()),
      });
      await parseResponse(response);
      setStatus("Los cambios se guardaron correctamente.", "success");
    } catch (error) {
      setStatus(`No fue posible guardar los cambios: ${error.message}`, "error");
    } finally {
      setBusy(false);
    }
  }

  form.addEventListener("submit", saveConfig);
  function updateQualificationLabel() {
    inputs.qualificationValue.previousElementSibling.textContent = inputs.qualificationType.value === "survival"
      ? "Top que clasifica"
      : "Puntos matchpoint";
  }

  inputs.qualificationType.forEach((option) => option.addEventListener("change", updateQualificationLabel));
  reloadButton.addEventListener("click", loadConfig);
  loadConfig();
  updateQualificationLabel();
}());
