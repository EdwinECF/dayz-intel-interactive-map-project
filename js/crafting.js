let allCraftingItems = []

fetch("../data/crafting.json")
  .then(response => response.json())
  .then(craftingItems => {
    allCraftingItems = craftingItems;
    renderCraftingItems(allCraftingItems);
  })
  .catch(error => console.error(error));

function renderCraftingItems(craftingItems) {
    const container = document.getElementById("crafting-container");

    container.innerHTML = "";

    craftingItems.forEach(item => {
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

const searchInput = document.getElementById("crafting-search");

searchInput.addEventListener("input", function () {
    const searchText = searchInput.value.toLowerCase();

    const filteredItems = allCraftingItems.filter(item => {
        return (
            item.name.toLowerCase().includes(searchText) ||
            item.category.toLowerCase().includes(searchText) ||
            item.description.toLowerCase().includes(searchText) ||
            item.ingredients.toLowerCase().includes(searchText));
    });

    renderCraftingItems(filteredItems);
});
