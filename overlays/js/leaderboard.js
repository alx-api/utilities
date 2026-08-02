function createRow(team, index){

    const qualification = (Number(team.points) >= 150) ? "matchpoint":"";
    //: (index >= 6) ? qualification = "eliminated";
    //: qualification = "survival";

    const wiped = team.squads_alive <= 1 ? "nogame" 
                  : team.players_alive === 0
                    ? "wiped"
                    : "";
    
    return `
        <div class="row">

            <div class="rank-section ${qualification || ''}">
                <div class="rank">
                    #${index + 1}
                </div>
            </div>

            <div class="team-info ${wiped}">

                <div class="player">
                    ${team.team} <span class="matchpoint-team ${wiped}">${qualification==="matchpoint"? "MP":""}</span>
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

function renderLeaderboard(data){

    const leftColumn = document.getElementById("left-column");
    const rightColumn = document.getElementById("right-column");

    document.querySelector(".title").innerHTML =
    `${event_name} • MAPA ${map_count}`;

    const leftSide = data.slice(0,8);

    const rightSide = data.slice(8,16);

    leftColumn.innerHTML =
        leftSide.map((team, index) => createRow(team, index)).join("");

    rightColumn.innerHTML =
        rightSide.map((team, index) => createRow(team, index + 8)).join("");
}
