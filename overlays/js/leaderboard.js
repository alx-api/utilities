function createRow(team, index){

    const qualified = index < 3;

    return `
        <div class="row ${qualified ? 'qualified' : ''}">

            <div class="rank-section">
                <div class="rank">
                    #${index + 1}
                </div>
            </div>

            <div class="team-info">

                <div class="player">
                    ${team.team}
                </div>

                <div class="players">
                    ${team.players || ""}
                </div>

            </div>

            <div class="stats">

                <div class="points">
                    ${Number(team.points).toFixed(2)}
                </div>

                <div class="kills">
                    ${team.kills} KILLS
                </div>

                <div class="maps">
                    MAP ${team.maps}
                </div>

            </div>

        </div>
    `;
}

function renderLeaderboard(data){

    const leftColumn = document.getElementById("left-column");
    const rightColumn = document.getElementById("right-column");

    document.querySelector(".title").innerHTML =
    `STANDINGS • MAP ${map_count}`;

    const leftSide = data.slice(0,8);

    const rightSide = data.slice(8,16);

    leftColumn.innerHTML =
        leftSide.map((team, index) => createRow(team, index)).join("");

    rightColumn.innerHTML =
        rightSide.map((team, index) => createRow(team, index + 8)).join("");
}
