"use strict";

const CONFIG = {
  endpoint: "https://json-live-merge.ialexk.workers.dev/",
  pollIntervalMs: 2000,
  showDeadPlayers: true,
  showLegend: true,
  defaultMap: "havens",
};

const MAPS = {
  havens: {
    label: "Area 99",
    image: "./assets/havens.png",
    poiZones: {
      "TRAIN STATION": { x: 23.5, y: 41.0, width: 11, height: 10 },
      "POND": { x: 34.5, y: 31.0, width: 10, height: 10 },
      "MANSION": { x: 49.0, y: 29.5, width: 14, height: 10 },
      "BARN": { x: 47.5, y: 44.0, width: 11, height: 10 },
      "MAIN STREET": { x: 37.5, y: 59.0, width: 15, height: 12 },
      "RESEARCH CENTER": { x: 73.0, y: 42.0, width: 15, height: 13 },
      "COAL DEPOT": { x: 67.0, y: 55.5, width: 13, height: 11 },
      "LUMBERMILL": { x: 60.0, y: 66.0, width: 14, height: 10 },
      "RIVERBOAT": { x: 47.0, y: 68.5, width: 10, height: 8 },

      /*
       * Initial approximations for API names not visibly labeled
       * on the supplied Area 99 image.
       */
      "CHAPEL": { x: 50.5, y: 31.5, width: 10, height: 9 },
      "MONUMENT": { x: 35.5, y: 31.5, width: 8, height: 8 },
    },
    aliases: {
      "TRAIN WRECK": "TRAIN STATION",
    },
  },

  rebirth: {
    label: "Rebirth Island",
    image: "./assets/rebirth.png",
    poiZones: {
      "STRONGHOLD": { x: 22.0, y: 72.0, width: 11, height: 10 },
      "LIVING QUARTERS": { x: 40.0, y: 66.0, width: 13, height: 10 },
      "HEADQUARTERS": { x: 47.0, y: 59.0, width: 11, height: 10 },
      "FACTORY": { x: 55.0, y: 63.0, width: 11, height: 10 },
      "CONTROL CENTER": { x: 36.0, y: 50.0, width: 13, height: 10 },
      "PRISON": { x: 52.0, y: 47.0, width: 15, height: 13 },
      "DOCK": { x: 37.0, y: 40.0, width: 10, height: 11 },
      "TURBINE": { x: 50.0, y: 31.0, width: 11, height: 10 },
      "INDUSTRIES": { x: 61.0, y: 31.0, width: 13, height: 10 },
      "CHEMICAL ENG.": { x: 72.0, y: 38.0, width: 12, height: 10 },
      "HARBOR": { x: 68.0, y: 47.0, width: 11, height: 11 },
      "BIO WEAPONS": { x: 73.0, y: 21.0, width: 11, height: 10 },
    },
    aliases: {
      "CHEMICAL ENGINEERING": "CHEMICAL ENG.",
      "BIOWEAPONS": "BIO WEAPONS",
      "BIO WEAPONS LABS": "BIO WEAPONS",
    },
  },

  fortunes: {
    label: "Fortune's Keep",
    image: "./assets/fortunes.png",
    poiZones: {
      "TOWN": { x: 31.0, y: 56.0, width: 13, height: 11 },
      "OVERLOOK": { x: 29.0, y: 61.0, width: 11, height: 9 },
      "GRAVEYARD": { x: 39.0, y: 40.0, width: 12, height: 10 },
      "TERRACES": { x: 44.0, y: 30.0, width: 13, height: 10 },
      "KEEP": { x: 57.0, y: 30.0, width: 12, height: 11 },
      "GATEHOUSE": { x: 49.0, y: 49.0, width: 12, height: 10 },
      "GROTTO": { x: 42.0, y: 56.0, width: 11, height: 10 },
      "SMUGGLERS COVE": { x: 50.0, y: 61.0, width: 14, height: 9 },
      "BAY": { x: 70.0, y: 34.0, width: 12, height: 10 },
      "WINERY": { x: 67.0, y: 49.0, width: 13, height: 12 },
      "LIGHTHOUSE": { x: 64.0, y: 58.0, width: 11, height: 9 },
      "PIER": { x: 76.0, y: 60.0, width: 10, height: 9 },
    },
    aliases: {
      "SMUGGLER'S COVE": "SMUGGLERS COVE",
      "SMUGGLERS' COVE": "SMUGGLERS COVE",
      "FORTUNES KEEP": "KEEP",
      "FORTUNE'S KEEP": "KEEP",
    },
  },
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

const mapElement = document.getElementById("map");
const mapImageElement = document.getElementById("map-image");
const markersElement = document.getElementById("markers");
const statusElement = document.getElementById("status");
const legendElement = document.getElementById("legend");

let requestInProgress = false;
let lastPayloadTimestamp = null;

function getRequestedMapKey() {
  const params = new URLSearchParams(window.location.search);
  const requested = (params.get("map") || CONFIG.defaultMap)
    .trim()
    .toLowerCase();

  return MAPS[requested] ? requested : CONFIG.defaultMap;
}

const activeMapKey = getRequestedMapKey();
const activeMap = MAPS[activeMapKey];

mapImageElement.src = activeMap.image;
mapElement.setAttribute(
  "aria-label",
  `${activeMap.label} live player map`
);
document.title = `${activeMap.label} Live Player Map`;

function normalizePoi(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();

  if (!normalized || normalized === "—" || normalized === "-") {
    return null;
  }

  return activeMap.aliases[normalized] ?? normalized;
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
  const zone = activeMap.poiZones[poiName];

  if (!zone) {
    return null;
  }

  const seed = hashString(`${activeMapKey}|${poiName}|${teamName}`);
  const xRatio = seededPercent(seed, -0.38, 0.38);
  const yRatio = seededPercent(
    Math.imul(seed, 31) >>> 0,
    -0.38,
    0.38
  );

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
      `[${activeMap.label}] POIs without coordinates:`,
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
      `${activeMap.label} · ` +
        `${payload.event_name || payload.event || "Live"} · ` +
        `${playerCount} players`,
      "ok"
    );
  } catch (error) {
    console.error("Unable to update map:", error);
    setStatus(
      `${activeMap.label} · Connection error: ${error.message}`,
      "error"
    );
  } finally {
    requestInProgress = false;
  }
}

refreshMap();
window.setInterval(refreshMap, CONFIG.pollIntervalMs);
