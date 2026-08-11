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
    let sliceSize=0;
    let leftColumn;
    let centerColumn;
    let rightColumn;

    if (data.length > 16 ){
        leftColumn = document.getElementById("column-1");
        centerColumn = document.getElementById("column-2");
        rightColumn = document.getElementById("column-3");
        sliceSize = data.length / 6;
    } else {
        leftColumn = document.getElementById("left-column");
        rightColumn = document.getElementById("right-column");
        sliceSize = data.length / 2;
    }

    document.querySelector(".title").innerHTML =
    `${event_name} • MAPA ${map_count}`;

    if (data.length > 16 ){
        const leftSide = data.slice(0,sliceSize);
        const centerSide = data.slice(sliceSize,sliceSize*2);        
        const rightSide = data.slice(sliceSize*2,sliceSize * 3);
        
        leftColumn.innerHTML =
        leftSide.map((team, index) => createRow(team, index)).join("");
        
        centerColumn.innerHTML =
        centerSide.map((team, index) => createRow(team, index + 8)).join("");
        
        rightColumn.innerHTML =
        rightSide.map((team, index) => createRow(team, index + 16)).join("");
    } else {
        const leftSide = data.slice(0,sliceSize);
        
        const rightSide = data.slice(sliceSize,sliceSize * 2);
        
        leftColumn.innerHTML =
        leftSide.map((team, index) => createRow(team, index)).join("");
        
        rightColumn.innerHTML =
        rightSide.map((team, index) => createRow(team, index + 8)).join("");
    }
}
