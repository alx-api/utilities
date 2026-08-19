const TEAMS_PER_PAGE = 5;

function renderCards(){

    ticker.innerHTML = "";

    const visible = [];

    for(let i = 0; i < TEAMS_PER_PAGE; i++){

        const item =
            standings[
                (currentIndex + i)
                % standings.length
            ];

        if(item){
            visible.push(item);
        }
    }

    visible.forEach((team, idx)=>{

        //const qualification = (team.rank < 25) ? "qualified":"";
        const qualification = Number(team.points) >= 120 ? "matchpoint" : "";
        const wiped = team.squads_alive <= 1
            ? "nogame"
            : team.players_alive === 0
                ? "wiped"
                : "";
        const flagged = team.flagged || false;
        const highlighted = team.highlighted || false;

        const teamName = getFirstName(team.team);

        const card =
            document.createElement("div");

        card.className = "card";

        card.innerHTML = `


            <div class="rank-section ${qualification}">
                <div class="rank">
                    #${team.rank}
                </div>
                <div class="maps-label">
                    M: ${team.maps}
                </div>
            </div>

            <div class="team-section ${highlighted ? "highlighted" : ""}">

                <div class="team-name ${highlighted ? "highlighted" : ""}">
                    ${highlighted?`<img class="crown" src="./icons/crown2.svg">`:""}
                    ${teamName} <span class="matchpoint-team ${wiped}">${qualification === "matchpoint" ? "MP" : ""}</span>
                    ${flagged?`<img class="flag" src="./icons/Mexico.svg">`:""}
                </div>

                <div class="players">
                    ${team.players}
                </div>

            </div>

            <div class="stats-section">

                <div class="stat-row">

                    <div class="stat-label">
                        Points
                    </div>
                    <div class="stat-value">
                        ${Number(team.points).toFixed(2)}
                    </div>

                </div>

                <div class="stat-row">

                    <div class="stat-label">
                        Kills
                    </div>

                    <div class="stat-value">
                        ${team.kills}
                    </div>

                </div>
            </div>

        `;

        ticker.appendChild(card);

        setTimeout(()=>{

            card.classList.add("show");

        }, idx * 120);

    });

    currentIndex =
        (currentIndex + TEAMS_PER_PAGE)
        % standings.length;
}

function getFirstName(legend) {
  return legend.split(/\s+x\s+/i)[0].trim();
}