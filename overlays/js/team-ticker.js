const DEFAULT_DATA_URL =
  "https://json-live-merge.ialexk.workers.dev/";

const DEFAULT_VISIBLE_TEAMS = 2;
const DEFAULT_ROTATION_MS = 10000;
const DEFAULT_REFRESH_MS = 10000;

const elements = {
  ticker: document.getElementById("ticker"),
  eventName: document.getElementById("eventName"),
  mapNumber: document.getElementById("mapNumber"),
  matchTimer: document.getElementById("matchTimer"),
  pageDots: document.getElementById("pageDots"),
};

const state = {
  pages: [],
  currentPage: 0,
  payload: null,
};

const config = getConfigFromUrl();

/* =========================================================
   Configuration
========================================================= */

function getConfigFromUrl() {
  const params = new URLSearchParams(window.location.search);

  const visibleTeams = Number(params.get("visible"));
  const rotationMs = Number(params.get("interval"));
  const refreshMs = Number(params.get("refresh"));

  return {
    dataUrl:
      params.get("url") ||
      DEFAULT_DATA_URL,

    requestedPlayers:
      (params.get("players") || "")
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean),

    visibleTeams:
      Number.isInteger(visibleTeams) &&
      visibleTeams >= 1 &&
      visibleTeams <= 3
        ? visibleTeams
        : DEFAULT_VISIBLE_TEAMS,

    rotationMs:
      Number.isFinite(rotationMs) &&
      rotationMs >= 2000
        ? rotationMs
        : DEFAULT_ROTATION_MS,

    refreshMs:
      Number.isFinite(refreshMs) &&
      refreshMs >= 2000
        ? refreshMs
        : DEFAULT_REFRESH_MS,
  };
}

/* =========================================================
   Utilities
========================================================= */

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clampRatio(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.min(1, Math.max(0, number));
}

function formatCash(value) {
  const amount = Number(value) || 0;

  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }

  if (amount >= 1_000) {
    const thousands = amount / 1_000;

    return `${
      Number.isInteger(thousands)
        ? `$${thousands.toFixed(0)}K`
        : `$${thousands.toFixed(1)}K`
    }`;
  }

  return `$${amount}`;
}

function chunk(items, size) {
  const pages = [];

  for (
    let index = 0;
    index < items.length;
    index += size
  ) {
    pages.push(
      items.slice(index, index + size)
    );
  }

  return pages;
}

/* =========================================================
   Data preparation
========================================================= */

function prepareTeams(payload) {
  const standingsByTeam = new Map(
    (payload.standings || []).map(
      (standing) => [
        normalize(standing.team_name),
        standing,
      ]
    )
  );

  const requestedPlayers = new Set(
    config.requestedPlayers.map(normalize)
  );

  return (payload.teams || [])
    .map((team) => {
      const standing =
        standingsByTeam.get(
          normalize(team.team_name)
        );

      return {
        ...team,

        rank:
          standing?.rank ??
          null,

        squad:
          standing?.squad ??
          null,

        total_kills:
          standing?.total_kills ??
          team.team_score ??
          0,

        final_score:
          standing?.final_score ??
          team.team_score ??
          0,
      };
    })
    .filter((team) => {
      if (requestedPlayers.size === 0) {
        return true;
      }

      return (team.players || []).some(
        (player) =>
          requestedPlayers.has(
            normalize(player.name)
          )
      );
    })
    .sort((teamA, teamB) => {
      const rankA =
        Number(teamA.rank) ||
        Number.MAX_SAFE_INTEGER;

      const rankB =
        Number(teamB.rank) ||
        Number.MAX_SAFE_INTEGER;

      return rankA - rankB;
    });
}

/* =========================================================
   Templates
========================================================= */

function renderStatusBar(
  type,
  value,
  isDead
) {
  const ratio =
    isDead
      ? 0
      : clampRatio(value);

  const percentage =
    Math.round(ratio * 100);

  return `
    <div
      class="status-bar ${type}"
      title="${type}: ${percentage}%"
    >
      <span
        style="width:${percentage}%"
      ></span>
    </div>
  `;
}

function renderPlayer(player) {
  const isDead =
    Boolean(player.is_dead);

  const playerClass =
    isDead
      ? "player-row dead"
      : "player-row";

  const poi =
    player.last_known_poi &&
    player.last_known_poi !== "—"
      ? `
        <div class="player-poi">
          ${escapeHtml(
            player.last_known_poi
          )}
        </div>
      `
      : "";

  return `
    <div class="${playerClass}">

      <div class="player-main-row">

        <div class="player-identity">

          <div class="player-name-row">

            ${
              isDead
                ? `
                  <span class="dead-icon">
                    ✕
                  </span>
                `
                : ""
            }

            <span class="player-name">
              ${escapeHtml(player.name)}
            </span>

            ${poi}

          </div>

        </div>

        <div class="player-cash">
          ${formatCash(player.cash)}
        </div>

      </div>

      <div class="player-status-row">

        <div class="bars">

          ${renderStatusBar(
            "armor",
            player.armor,
            isDead
          )}

          ${renderStatusBar(
            "health",
            player.health,
            isDead
          )}

        </div>
        <div
          class="plates"
          title="${
            Number(player.plates) || 0
          } armor plates"
        >
          <span>
            <svg class="icon"><use href="./icons/icons.svg#target"></use></svg> ${Number(player.kills) || 0}
          </span>
          <span>
            <svg class="icon"><use href="./icons/icons.svg#shield"></use></svg> ${Number(player.plates) || 0}
          </span>

        </div>

      </div>

    </div>
  `;
}

function renderTeam(team, index) {
  const players =
    team.players || [];

  const alivePlayers =
    players.filter(
      (player) => !player.is_dead
    ).length;

  return `
    <article
      class="team-card"
      style="--delay:${index * 100}ms"
    >

      <header class="team-header">

        <div class="team-heading">

          <div class="team-rank">
            ${
              team.rank
                ? `#${team.rank}`
                : "—"
            }
          </div>

          <div class="team-title">

            <div class="team-name">
              ${escapeHtml(
                team.team_name
              )}
            </div>

            <div class="team-meta">
              <span class="team-alive">
                  ${alivePlayers}/${players.length}
                  ALIVE
              </span>
            </div>

          </div>

        </div>

        <div class="team-stats">

          <div class="team-stat">

            <span class="team-stat-value">
              ${
                Number(
                  team.total_kills
                ) || 0
              }
            </span>

            <span class="team-stat-label">
              KILLS
            </span>

          </div>

          <div class="team-stat">

            <span
              class="team-stat-value"
            >
              ${
                Number(
                  team.placement
                ) || 0
              }
            </span>

            <span class="team-stat-label">
              PLC
            </span>

          </div>

          <div class="team-stat">

            <span
              class="team-stat-value gold"
            >
              ${
                Number(
                  team.final_score
                ) || 0
              }
            </span>

            <span class="team-stat-label">
              PTS
            </span>

          </div>

        </div>

      </header>

      <div class="player-list">

        ${players
          .map(renderPlayer)
          .join("")}

      </div>

    </article>
  `;
}

/* =========================================================
   Rendering
========================================================= */

function renderHeader() {
  const payload =
    state.payload;

  if (!payload) {
    return;
  }

  elements.eventName.textContent =
    payload.event_name ||
    payload.event ||
    "LIVE EVENT";

  elements.mapNumber.textContent =
    `MAP ${
      payload.map_number ?? "—"
    }`;

  elements.matchTimer.textContent =
    payload.match_timer ||
    "--:--";
}

function renderPageDots() {
  if (state.pages.length <= 1) {
    elements.pageDots.innerHTML = "";
    return;
  }

  elements.pageDots.innerHTML =
    state.pages
      .map(
        (_, index) => `
          <span
            class="page-dot${
              index === state.currentPage
                ? " active"
                : ""
            }"
          ></span>
        `
      )
      .join("");
}

function renderCurrentPage() {
  if (state.pages.length === 0) {
    elements.ticker.innerHTML = `
      <div class="empty-state">
        No se encontraron equipos para
        los jugadores solicitados.
      </div>
    `;

    elements.pageDots.innerHTML = "";

    return;
  }

  if (
    state.currentPage >=
    state.pages.length
  ) {
    state.currentPage = 0;
  }

  const teams =
    state.pages[state.currentPage];

  elements.ticker.innerHTML =
    teams
      .map(renderTeam)
      .join("");

  renderPageDots();
}

function rebuildTicker() {
  const teams =
    prepareTeams(state.payload);

  state.pages =
    chunk(
      teams,
      config.visibleTeams
    );

  if (
    state.currentPage >=
    state.pages.length
  ) {
    state.currentPage = 0;
  }

  renderHeader();
  renderCurrentPage();
}

/* =========================================================
   Fetch and rotation
========================================================= */

async function loadLiveData() {
  try {
    const response =
      await fetch(
        config.dataUrl,
        {
          cache: "no-store",
        }
      );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    state.payload =
      await response.json();

    rebuildTicker();
  } catch (error) {
    console.error(
      "Error loading live ticker:",
      error
    );

    if (!state.payload) {
      elements.ticker.innerHTML = `
        <div class="error-state">
          No fue posible cargar la
          información en vivo.
        </div>
      `;
    }
  }
}

function rotatePage() {
  if (state.pages.length <= 1) {
    return;
  }

  state.currentPage =
    (
      state.currentPage + 1
    ) % state.pages.length;

  renderCurrentPage();
}

/* =========================================================
   Initialization
========================================================= */

loadLiveData();

/* window.setInterval(
  loadLiveData,
  config.refreshMs
);

window.setInterval(
  rotatePage,
  config.rotationMs
); */