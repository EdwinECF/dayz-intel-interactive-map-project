let allWeapons = []

fetch("../data/weapons.json")
  .then(response => response.json())
  .then(weapons => {
    allWeapons = weapons;
    renderWeapons(allWeapons);
  })
  .catch(error => console.error(error));


function renderWeapons(weapons) {
    const container = document.getElementById("weapons-container");

    container.innerHTML = "";

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
}

const searchInput = document.getElementById("weapons-search");

searchInput.addEventListener("input", function () {
    const searchText = searchInput.value.toLowerCase();

    const filteredItems = allWeapons.filter(weapon => {
        return (
            weapon.name.toLowerCase().includes(searchText) ||
            weapon.description.toLowerCase().includes(searchText) ||
            weapon.category.toLowerCase().includes(searchText) ||
            weapon.caliber.toLowerCase().includes(searchText) ||
            String(weapon.damage).includes(searchText));
      });

    renderWeapons(filteredItems);
});