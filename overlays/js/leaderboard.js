const ROWS_PER_COLUMN = 9;
const PAGE_ROTATION_MS = 15000;

let leaderboardData = [];
let leaderboardPage = 0;

function getColumnCount(){
    return leaderboardData.length > ROWS_PER_COLUMN * 2 ? 3 : 2;
}

function getTeamsPerPage(){
    return ROWS_PER_COLUMN * getColumnCount();
}
let qualification="";

function createRow(team, index){
    if(qualificationType == "survival"){
      qualification = (index < qualificationValue) ? "qualified":"";
    } else if (qualificationType == "matchpoint"){
      qualification = Number(team.points) >= qualificationValue ? "matchpoint" : "";
    }
    const wiped = team.squads_alive <= 1
        ? "nogame"
        : team.players_alive === 0
            ? "wiped"
            : "";
    const flagged = team.flagged || false;
    const highlighted = team.highlighted ? "highlighted": "";
    const teamName = getFirstName(team.team);

    return `
        <div class="row ${highlighted}">
            <div class="rank-section ${qualification}">
                <div class="rank">
                    #${team.rank ?? index + 1}
                </div>
            </div>

            <div class="team-info ${wiped}">
                <div class="player ${highlighted}">
                    ${highlighted?`<img class="crown" src="./icons/crown2.svg">`:""}
                    ${teamName} <span class="matchpoint-team ${wiped}">${qualification === "matchpoint" ? "MP" : ""}</span>
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
                    ${team.maps || 0} MAPAS
                </div>
            </div>
        </div>
    `;
}

function renderLeaderboardPage(){
    const columnCount = getColumnCount();
    const teamsPerPage = getTeamsPerPage();
    const pageCount = Math.max(1, Math.ceil(leaderboardData.length / teamsPerPage));
    leaderboardPage %= pageCount;

    const pageStart = leaderboardPage * teamsPerPage;
    const pageTeams = leaderboardData.slice(pageStart, pageStart + teamsPerPage);

    const board = document.querySelector('.board-br');
    board.style.gridTemplateColumns = `repeat(${columnCount}, minmax(0, 1fr))`;

    const title = document.querySelector(".title");
    title.replaceChildren();

    const titleText = document.createElement("span");
    titleText.textContent = `${event_name} • MAPA ${map_count}`;

    const pageIndicator = document.createElement("div");
    pageIndicator.className = "page-indicator";
    pageIndicator.setAttribute("role", "img");
    pageIndicator.setAttribute("aria-label", `Sección ${leaderboardPage + 1} de ${pageCount}`);

    for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
        const segment = document.createElement("span");
        segment.className = `page-indicator__segment${pageIndex === leaderboardPage ? " is-active" : ""}`;
        pageIndicator.appendChild(segment);
    }

    title.append(titleText, pageIndicator);

    ["column-1", "column-2", "column-3"].forEach((id, columnIndex) => {
        const column = document.getElementById(id);
        column.style.display = columnIndex < columnCount ? 'flex' : 'none';
        const columnStart = columnIndex * ROWS_PER_COLUMN;
        column.innerHTML = pageTeams
            .slice(columnStart, columnStart + ROWS_PER_COLUMN)
            .map((team, index) => createRow(team, pageStart + columnStart + index))
            .join("");
    });
}

function renderLeaderboard(data){
    leaderboardData = data;
    const pageCount = Math.max(1, Math.ceil(leaderboardData.length / getTeamsPerPage()));
    if (leaderboardPage >= pageCount) leaderboardPage = 0;
    renderLeaderboardPage();
}

function getFirstName(legend) {
  return legend.split(/\s+x\s+/i)[0].trim();
}

setInterval(() => {
    const pageCount = Math.ceil(leaderboardData.length / getTeamsPerPage());
    if (pageCount <= 1) return;

    leaderboardPage = (leaderboardPage + 1) % pageCount;
    renderLeaderboardPage();
}, PAGE_ROTATION_MS);
