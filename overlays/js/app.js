"use strict";

const CONFIG = {
  endpoint: "https://json-live-merge.ialexk.workers.dev/",
  pollIntervalMs: 2000,
  showDeadPlayers: true,
  showLegend: true,
};

/*
 * Approximate centers and bounds for Area 99.
 * All values are percentages relative to the complete 1110 × 1110 image.
 *
 * x/y: center used as the base position.
 * width/height: area used to spread teams that share the same POI.
 */
const POI_ZONES = {
  "TRAIN STATION": {
    x: 23.5,
    y: 41.0,
    width: 11,
    height: 10,
  },
  "POND": {
    x: 34.5,
    y: 31.0,
    width: 10,
    height: 10,
  },
  "MANSION": {
    x: 49.0,
    y: 29.5,
    width: 14,
    height: 10,
  },
  "BARN": {
    x: 47.5,
    y: 44.0,
    width: 11,
    height: 10,
  },
  "MAIN STREET": {
    x: 37.5,
    y: 59.0,
    width: 15,
    height: 12,
  },
  "RESEARCH CENTER": {
    x: 73.0,
    y: 42.0,
    width: 15,
    height: 13,
  },
  "COAL DEPOT": {
    x: 67.0,
    y: 55.5,
    width: 13,
    height: 11,
  },
  "LUMBERMILL": {
    x: 60.0,
    y: 66.0,
    width: 14,
    height: 10,
  },
  "RIVERBOAT": {
    x: 47.0,
    y: 68.5,
    width: 10,
    height: 8,
  },

  /*
   * The sample payload includes these names, but they are not printed as
   * labels on the supplied Area 99 image. They are initial approximations
   * and are intentionally isolated here so they can be calibrated easily.
   */
  "CHAPEL": {
    x: 50.5,
    y: 31.5,
    width: 10,
    height: 9,
  },
  "MONUMENT": {
    x: 35.5,
    y: 31.5,
    width: 8,
    height: 8,
  },
};

/* Normalize alternate API names to the labels used by the map. */
const POI_ALIASES = {
  "TRAIN WRECK": "TRAIN STATION",
};

const TEAM_COLORS = [
  "#ff3b30",
  "#34c759",
  "#0a84ff",
  "#ffcc00",
  "#bf5af2",
  "#64d2ff",
  "#ff9f0a",
  "#ff375f",
  "#30d158",
  "#5e5ce6",
  "#ffd60a",
  "#ac8e68",
  "#00c7be",
  "#ff6482",
  "#7d7aff",
  "#8e8e93",
];

const PLAYER_OFFSETS = {
  1: [{ x: 0, y: 0 }],
  2: [
    { x: -8, y: 0 },
    { x: 8, y: 0 },
  ],
  3: [
    { x: -8, y: 6 },
    { x: 8, y: 6 },
    { x: 0, y: -8 },
  ],
};

const markersElement = document.getElementById("markers");
const statusElement = document.getElementById("status");
const legendElement = document.getElementById("legend");

let requestInProgress = false;
let lastPayloadTimestamp = null;

function normalizePoi(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();

  if (!normalized || normalized === "—" || normalized === "-") {
    return null;
  }

  return POI_ALIASES[normalized] ?? normalized;
}

function hashString(value) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededPercent(seed, min, max) {
  const normalized = (seed % 10000) / 9999;
  return min + normalized * (max - min);
}

function getTeamBasePosition(poiName, teamName) {
  const zone = POI_ZONES[poiName];

  if (!zone) {
    return null;
  }

  const seed = hashString(`${poiName}|${teamName}`);
  const xRatio = seededPercent(seed, -0.38, 0.38);
  const yRatio = seededPercent(Math.imul(seed, 31) >>> 0, -0.38, 0.38);

  return {
    x: zone.x + zone.width * xRatio,
    y: zone.y + zone.height * yRatio,
  };
}

function groupPlayersByTeamAndPoi(teams) {
  const groups = [];

  teams.forEach((team, teamIndex) => {
    const teamName = team.team_name || `Team ${teamIndex + 1}`;
    const color = TEAM_COLORS[teamIndex % TEAM_COLORS.length];
    const byPoi = new Map();

    (team.players || []).forEach((player) => {
      const poi = normalizePoi(player.last_known_poi);

      if (!poi || (!CONFIG.showDeadPlayers && player.is_dead)) {
        return;
      }

      if (!byPoi.has(poi)) {
        byPoi.set(poi, []);
      }

      byPoi.get(poi).push(player);
    });

    byPoi.forEach((players, poi) => {
      groups.push({
        teamName,
        teamIndex,
        color,
        poi,
        players,
      });
    });
  });

  return groups;
}

function renderMarkers(payload) {
  const teams = Array.isArray(payload.teams) ? payload.teams : [];
  const groups = groupPlayersByTeamAndPoi(teams);
  const unknownPois = new Set();
  const fragments = [];

  groups.forEach((group) => {
    const basePosition = getTeamBasePosition(group.poi, group.teamName);

    if (!basePosition) {
      unknownPois.add(group.poi);
      return;
    }

    const offsets =
      PLAYER_OFFSETS[Math.min(group.players.length, 3)] ||
      PLAYER_OFFSETS[3];

    group.players.forEach((player, playerIndex) => {
      const offset = offsets[playerIndex % offsets.length];

      const marker = document.createElement("div");
      marker.className =
        `player-marker${player.is_dead ? " is-dead" : ""}`;
      marker.dataset.player = player.name || "Unknown";
      marker.title =
        `${group.teamName} — ${player.name || "Unknown"} — ${group.poi}`;
      marker.style.setProperty("--x", `${basePosition.x}%`);
      marker.style.setProperty("--y", `${basePosition.y}%`);
      marker.style.setProperty("--offset-x", `${offset.x}px`);
      marker.style.setProperty("--offset-y", `${offset.y}px`);
      marker.style.setProperty("--team-color", group.color);

      fragments.push(marker);
    });
  });

  markersElement.replaceChildren(...fragments);

  if (unknownPois.size > 0) {
    console.warn(
      "POIs without coordinates:",
      [...unknownPois].sort()
    );
  }

  renderLegend(teams);
}

function renderLegend(teams) {
  if (!CONFIG.showLegend) {
    legendElement.replaceChildren();
    return;
  }

  const items = teams.map((team, teamIndex) => {
    const item = document.createElement("div");
    item.className = "legend__item";

    const dot = document.createElement("span");
    dot.className = "legend__dot";
    dot.style.setProperty(
      "--team-color",
      TEAM_COLORS[teamIndex % TEAM_COLORS.length]
    );

    const name = document.createElement("span");
    name.className = "legend__name";
    name.textContent = team.team_name || `Team ${teamIndex + 1}`;

    item.append(dot, name);
    return item;
  });

  legendElement.replaceChildren(...items);
}

function setStatus(message, type) {
  statusElement.textContent = message;
  statusElement.className = `status status--${type}`;
}

async function refreshMap() {
  if (requestInProgress) {
    return;
  }

  requestInProgress = true;

  try {
    const response = await fetch(CONFIG.endpoint, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();

    if (!payload || !Array.isArray(payload.teams)) {
      throw new Error("The response does not contain a teams array");
    }

    /*
     * Avoid replacing all marker nodes when the worker returns the exact
     * same snapshot. updated_at is present in the supplied example.
     */
    const payloadTimestamp = payload.updated_at ?? null;

    if (
      payloadTimestamp === null ||
      payloadTimestamp !== lastPayloadTimestamp
    ) {
      renderMarkers(payload);
      lastPayloadTimestamp = payloadTimestamp;
    }

    const playerCount = payload.teams.reduce(
      (total, team) => total + (team.players?.length || 0),
      0
    );

    setStatus(
      `${payload.event_name || payload.event || "Live"} · ` +
        `${playerCount} players`,
      "ok"
    );
  } catch (error) {
    console.error("Unable to update map:", error);
    setStatus(`Connection error: ${error.message}`, "error");
  } finally {
    requestInProgress = false;
  }
}

refreshMap();
window.setInterval(refreshMap, CONFIG.pollIntervalMs);
