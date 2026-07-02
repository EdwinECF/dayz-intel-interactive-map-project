fetch("../data/gear.json")
  .then(response => response.json())
  .then(gear => {
    const container = document.getElementById("gear-container");

    gear.forEach(item => {
      container.innerHTML += `
        <article class="content-card">
          <h3>${item.name}</h3>
          <p>${item.description}</p>

          <div class="card-meta">
              <span class="card-badge badge-success">${item.category}</span>
          </div>
        </article>
      `;
    });
  })
  .catch(error => console.error(error));