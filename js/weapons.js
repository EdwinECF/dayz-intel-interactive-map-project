fetch("../data/weapons.json")
  .then(response => response.json())
  .then(weapons => {
    const container = document.getElementById("weapons-container");

    weapons.forEach(weapon => {
      container.innerHTML += `
        <article class="content-card">
          <h3>${weapon.name}</h3>
          <p>${weapon.description}</p>

          <div class="card-meta">
              <span class="card-badge badge-success">${weapon.category}</span>
              <span class="card-badge badge-warning">${weapon.caliber}</span>
              <span class="card-badge badge-blue">${weapon.damage}</span>
          </div>
        </article>
      `;
    });
  })
  .catch(error => console.error(error));