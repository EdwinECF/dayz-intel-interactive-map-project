let allGear = []

fetch("../data/gear.json")
  .then(response => response.json())
  .then(gear => {
    allGear = gear;
    renderGear(allGear);
  })
  .catch(error => console.error(error));


  function renderGear(gear) {
    const container = document.getElementById("gear-container");

    container.innerHTML = "";

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
  
  }
  const searchInput = document.getElementById("gear-search");

  searchInput.addEventListener("input", function () {
      const searchText = searchInput.value.toLowerCase();

      const filteredItems = allGear.filter(gear => {
          return (
              gear.name.toLowerCase().includes(searchText) ||
              gear.category.toLowerCase().includes(searchText));
      });

      renderGear(filteredItems);
});