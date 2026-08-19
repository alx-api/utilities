const ROWS_PER_COLUMN = 9;
const COLUMN_COUNT = 3;
const TEAMS_PER_PAGE = ROWS_PER_COLUMN * COLUMN_COUNT;
const PAGE_ROTATION_MS = 15000;

let leaderboardData = [];
let leaderboardPage = 0;

function createRow(team, index){
    const qualification = Number(team.points) >= 150 ? "matchpoint" : "";
    //const qualification = (index < 24) ? "qualified":"";
    const wiped = team.squads_alive <= 1
        ? "nogame"
        : team.players_alive === 0
            ? "wiped"
            : "";
    const flagged = team.flagged || false;
    const highlighted = team.highlighted || false;

    return `
        <div class="row ${highlighted ? "highlighted" : ""}">
            <div class="rank-section ${qualification}">
                <div class="rank">
                    #${team.rank ?? index + 1}
                </div>
            </div>

            <div class="team-info ${wiped}">
                <div class="player ${highlighted ? "highlighted" : ""}">
                    ${highlighted?`<img class="crown" src="./icons/crown2.svg">`:""}
                    ${team.team} <span class="matchpoint-team ${wiped}">${qualification === "matchpoint" ? "MP" : ""}</span>
                    ${flagged?`<img class="flag" src="./icons/Mexico.svg">`:""}
                </div>

                <div class="players">
                    ${team.players || ""}
                </div>
            </div>

            <div class="stats">
                <div class="points ${wiped}">
                    ${Number(team.points).toFixed(2)}
                </div>

                <div class="kills">
                    ${team.kills} KILLS
                </div>

                <div class="maps">
                    ${team.maps} MAPAS
                </div>
            </div>
        </div>
    `;
}

function renderLeaderboardPage(){
    const pageCount = Math.max(1, Math.ceil(leaderboardData.length / TEAMS_PER_PAGE));
    leaderboardPage %= pageCount;

    const pageStart = leaderboardPage * TEAMS_PER_PAGE;
    const pageTeams = leaderboardData.slice(pageStart, pageStart + TEAMS_PER_PAGE);

    document.querySelector(".title").textContent =
        `${event_name} • MAPA ${map_count} • PÁGINA ${leaderboardPage + 1}/${pageCount}`;

    ["column-1", "column-2", "column-3"].forEach((id, columnIndex) => {
        const columnStart = columnIndex * ROWS_PER_COLUMN;
        document.getElementById(id).innerHTML = pageTeams
            .slice(columnStart, columnStart + ROWS_PER_COLUMN)
            .map((team, index) => createRow(team, pageStart + columnStart + index))
            .join("");
    });
}

function renderLeaderboard(data){
    leaderboardData = data;
    const pageCount = Math.max(1, Math.ceil(leaderboardData.length / TEAMS_PER_PAGE));
    if (leaderboardPage >= pageCount) leaderboardPage = 0;
    renderLeaderboardPage();
}

setInterval(() => {
    const pageCount = Math.ceil(leaderboardData.length / TEAMS_PER_PAGE);
    if (pageCount <= 1) return;

    leaderboardPage = (leaderboardPage + 1) % pageCount;
    renderLeaderboardPage();
}, PAGE_ROTATION_MS);
