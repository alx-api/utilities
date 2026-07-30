const DEFAULT_DATA_URL =
  "https://json-live-merge.ialexk.workers.dev/";

const DEFAULT_REFRESH_MS = 15000;

const elements = {
  eventName:
    document.getElementById(
      "eventName"
    ),

  mapNumber:
    document.getElementById(
      "mapNumber"
    ),

  topFraggers:
    document.getElementById(
      "topFraggers"
    ),

  placementAverage:
    document.getElementById(
      "placementAverage"
    ),

  lastUpdate:
    document.getElementById(
      "lastUpdate"
    )
};

const config =
  getConfigFromUrl();

function getConfigFromUrl() {
  const params =
    new URLSearchParams(
      window.location.search
    );

  const refreshMs =
    Number(
      params.get("refresh")
    );

  return {
    dataUrl:
      params.get("url") ||
      DEFAULT_DATA_URL,

    refreshMs:
      Number.isFinite(refreshMs) &&
      refreshMs >= 5000
        ? refreshMs
        : DEFAULT_REFRESH_MS
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toNumber(
  value,
  fallback = 0
) {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function formatAverage(value) {
  return toNumber(value)
    .toFixed(2);
}

function getRankClass(rank) {
  if (rank === 1) {
    return "rank-first";
  }

  if (rank === 2) {
    return "rank-second";
  }

  if (rank === 3) {
    return "rank-third";
  }

  return "";
}

function renderRank(rank) {
  return `
    <div
      class="ranking-position
      ${getRankClass(rank)}"
    >
      #${rank}
    </div>
  `;
}

function renderTopFragger(
  player,
  index
) {
  const rank =
    toNumber(
      player.rank,
      index + 1
    );

  const kills =
    toNumber(
      player.total_kills
    );

  const mapsPlayed =
    toNumber(
      player.maps_played
    );

  return `
    <div
      class="table-row fraggers-columns"
      style="--delay:${index * 65}ms"
    >

      ${renderRank(rank)}

      <div class="primary-cell">

        <span class="primary-name">
          ${escapeHtml(
            player.player_name
          )}
        </span>

      </div>

      <div class="secondary-cell">

        <span class="team-name">
          ${escapeHtml(
            player.team_name
          )}
        </span>

      </div>

      <div class="numeric-cell maps-value">
        ${mapsPlayed}
      </div>

      <div class="numeric-cell featured-value">
        ${kills}
      </div>

    </div>
  `;
}

function renderPlacementTeam(
  team,
  index
) {
  const rank =
    toNumber(
      team.rank,
      index + 1
    );

  const mapsPlayed =
    toNumber(
      team.maps_played
    );

  const placementAverage =
    formatAverage(
      team.placement_average
    );

  return `
    <div
      class="table-row placement-columns"
      style="--delay:${index * 65}ms"
    >

      ${renderRank(rank)}

      <div class="primary-cell">

        <span class="primary-name">
          ${escapeHtml(
            team.team_name
          )}
        </span>

      </div>

      <div class="numeric-cell maps-value">
        ${mapsPlayed}
      </div>

      <div class="numeric-cell featured-value">
        ${placementAverage}
      </div>

    </div>
  `;
}

function renderEmptyState(
  container,
  message
) {
  container.innerHTML = `
    <div class="empty-state">

      <span class="empty-icon">
        —
      </span>

      <span>
        ${escapeHtml(message)}
      </span>

    </div>
  `;
}

function renderTopFraggers(
  players
) {
  const topTen =
    Array.isArray(players)
      ? players.slice(0, 10)
      : [];

  if (topTen.length === 0) {
    renderEmptyState(
      elements.topFraggers,
      "Official player statistics are not available yet."
    );

    return;
  }

  elements.topFraggers.innerHTML =
    topTen
      .map(renderTopFragger)
      .join("");
}

function renderPlacementAverage(
  teams
) {
  const topTen =
    Array.isArray(teams)
      ? teams.slice(0, 10)
      : [];

  if (topTen.length === 0) {
    renderEmptyState(
      elements.placementAverage,
      "Official team statistics are not available yet."
    );

    return;
  }

  elements.placementAverage.innerHTML =
    topTen
      .map(renderPlacementTeam)
      .join("");
}

function renderHeader(payload) {
  elements.eventName.textContent =
    payload.event_name ||
    payload.event ||
    "LIVE EVENT";

  elements.mapNumber.textContent =
    `MAP ${
      payload.map_number ?? "—"
    }`;
}

function renderLastUpdate(payload) {
  const timestamp =
    toNumber(
      payload.updated_at,
      Date.now()
    );

  const date =
    new Date(timestamp);

  elements.lastUpdate.textContent =
    `UPDATED ${
      date.toLocaleTimeString(
        undefined,
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }
      )
    }`;
}

function renderStats(payload) {
  const ranking =
    payload.ranking || {};

  renderHeader(payload);

  renderTopFraggers(
    ranking.top_fraggers
  );

  renderPlacementAverage(
    ranking.placement_average
  );

  renderLastUpdate(payload);
}

async function loadStats() {
  try {
    const response =
      await fetch(
        config.dataUrl,
        {
          cache: "no-store"
        }
      );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const payload =
      await response.json();

    renderStats(payload);
  } catch (error) {
    console.error(
      "Error loading statistics:",
      error
    );

    renderEmptyState(
      elements.topFraggers,
      "Unable to load player statistics."
    );

    renderEmptyState(
      elements.placementAverage,
      "Unable to load team statistics."
    );

    elements.lastUpdate.textContent =
      "DATA UNAVAILABLE";
  }
}

loadStats();

window.setInterval(
  loadStats,
  config.refreshMs
);