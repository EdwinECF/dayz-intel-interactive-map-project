let allFactions = []

fetch("../data/factions.json")
  .then(response => response.json())
  .then(factions => {
    allFactions = factions;
    renderFactions(allFactions);
  })
  .catch(error => console.error(error));

  function renderFactions(factions) {
    const container = document.getElementById("factions-container");

    container.innerHTML = "";

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
  }

const searchInput = document.getElementById("factions-search");

searchInput.addEventListener("input", function () {
    const searchText = searchInput.value.toLowerCase();

    const filteredItems = allFactions.filter(faction => {
        return (
            faction.name.toLowerCase().includes(searchText) ||
            faction.type.toLowerCase().includes(searchText) ||
            faction.description.toLowerCase().includes(searchText)
        );
    });

    renderFactions(filteredItems);
});