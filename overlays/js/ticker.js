function renderCards(){

    ticker.innerHTML = "";

    const visible = [];

    for(let i = 0; i < 4; i++){

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

        const card =
            document.createElement("div");

        card.className = "card";

        card.innerHTML = `


            <div class="rank-section">
                <div class="rank">
                    #${team.rank}
                </div>
                <div class="maps-label">
                    M: ${team.maps}
                </div>
            </div>

            <div class="team-section">

                <div class="team-name">
                    ${team.team}
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
        (currentIndex + 4)
        % standings.length;
}