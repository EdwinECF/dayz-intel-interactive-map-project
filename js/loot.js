let allLoot = []

fetch("../data/loot.json")
  .then(response => response.json())
  .then(lootItems => {
    allLoot = lootItems;
    renderLoot(allLoot);
  })
  .catch(error => console.error(error));

  function renderLoot(lootItems) {
    const container = document.getElementById("loot-container");

    container.innerHTML = "";

    lootItems.forEach(item => {
      container.innerHTML += `
        <article class="content-card">
          <h3>${item.name}</h3>
          <p>${item.description}</p>

          <div class="card-meta">
              <span class="card-badge badge-success">${item.category}</span>
              <span class="card-badge badge-warning">${item.rarity}</span>
          </div>
        </article>
      `;
    });
}

const searchInput = document.getElementById("loot-search");

searchInput.addEventListener("input", function () {
    const searchText = searchInput.value.toLowerCase();

    const filteredItems = allLoot.filter(item => {
        return (
            item.name.toLowerCase().includes(searchText) ||
            item.description.toLowerCase().includes(searchText) ||
            item.category.toLowerCase().includes(searchText) ||
            item.rarity.toLowerCase().includes(searchText)
        );
    });

    renderLoot(filteredItems);
});