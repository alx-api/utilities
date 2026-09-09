const ENDPOINTS = {
  dev: 'https://live-map-dev.ialexk.workers.dev/',
  prod: 'https://live-map.ialexk.workers.dev/',
};

const hostname = window.location.hostname;
const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
const ENV = isLocal ? 'dev' : 'prod';

const params = new URLSearchParams(window.location.search);
const clampInt = (value, fallback, min, max) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
};

const config = {
  rows: 12,
  pageDuration: clampInt(params.get('duration'), 8000, 1000, 60000),
  refresh: clampInt(params.get('refresh'), 10000, 2000, 300000),
  endpoint: ENDPOINTS[ENV],
};

const viewport = document.querySelector('#standings-viewport');
const track = document.querySelector('#standings-track');
const message = document.querySelector('#standings-message');
const root = document.documentElement;

root.style.setProperty('--visible-rows', config.rows);

let standings = [];
let currentPage = 0;
let pageTimer;
let fadeTimer;

const lastPlacement = (placements) => {
  if (!Array.isArray(placements)) return null;
  const informed = placements.filter((value) => value !== null && value !== undefined && value !== '');
  return informed.length ? informed.at(-1) : null;
};

const formatScore = (score) => {
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore)) return '—';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(numericScore);
};

const cell = (className, value) => {
  const element = document.createElement('span');
  element.className = className;
  element.textContent = value;
  element.setAttribute('role', 'cell');
  return element;
};

const render = () => {
  const pageCount = Math.max(1, Math.ceil(standings.length / config.rows));
  currentPage = Math.min(currentPage, pageCount - 1);
  const firstIndex = currentPage * config.rows;
  const page = standings.slice(firstIndex, firstIndex + config.rows);

  track.replaceChildren(...page.map((team, index) => {
    const placement = lastPlacement(team.placements);
    const row = document.createElement('div');
    row.className = `standings__row${placement !== null ? ' is-placed' : ''}`;
    row.setAttribute('role', 'row');
    row.append(
      cell('standings__rank', team.rank ?? firstIndex + index + 1),
      cell('standings__team', String(team.team_name || 'Unknown team').trim()),
      cell('standings__kills', team.total_kills ?? '—'),
      cell('standings__placement', placement ?? '—'),
      cell('standings__points', formatScore(team.final_score)),
    );
    return row;
  }));

  message.hidden = standings.length > 0;
};

const scheduleNextPage = () => {
  window.clearTimeout(pageTimer);
  pageTimer = undefined;

  if (standings.length <= config.rows) return;

  pageTimer = window.setTimeout(() => {
    pageTimer = undefined;
    viewport.classList.add('is-fading');

    fadeTimer = window.setTimeout(() => {
      fadeTimer = undefined;
      const pageCount = Math.ceil(standings.length / config.rows);
      currentPage = (currentPage + 1) % pageCount;
      render();
      viewport.classList.remove('is-fading');
      scheduleNextPage();
    }, 400);
  }, config.pageDuration);
};

const loadStandings = async () => {
  try {
    const response = await fetch(config.endpoint, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    if (!Array.isArray(payload.standings)) throw new Error('Invalid standings response');
    standings = payload.standings;
    render();

    if (standings.length <= config.rows) {
      window.clearTimeout(pageTimer);
      pageTimer = undefined;
    } else if (!pageTimer && !fadeTimer) {
      scheduleNextPage();
    }
  } catch (error) {
    console.error('Unable to load live map standings:', error);
    if (!standings.length) {
      message.hidden = false;
      message.textContent = 'Standings unavailable';
    }
  }
};

loadStandings();
window.setInterval(loadStandings, config.refresh);

