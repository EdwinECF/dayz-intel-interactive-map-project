fetch("../data/factions.json")
  .then(response => response.json())
  .then(factions => {
    const container = document.getElementById("factions-container");

    factions.forEach(faction => {
      container.innerHTML += `
        <article class="content-card">
          <h3>${faction.name}</h3>
          <p>${faction.description}</p>

          <div class="card-meta">
              <span class="card-badge badge-success">${faction.type}</span>
          </div>
        </article>
      `;
    });
  })
  .catch(error => console.error(error));