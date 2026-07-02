fetch("../data/loot.json")
  .then(response => response.json())
  .then(lootItems => {
    const container = document.getElementById("loot-container");

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
  })
  .catch(error => console.error(error));