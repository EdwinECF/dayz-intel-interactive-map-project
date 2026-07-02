let allSurvivalItems = []

fetch("../data/survival.json")
  .then(response => response.json())
  .then(survivalItems => {
    allSurvivalItems = survivalItems;
    renderSurvivalItems(allSurvivalItems);

  })
  .catch(error => console.error(error));

function renderSurvivalItems(survivalItems) {
    const container = document.getElementById("survival-container");

    container.innerHTML = "";

    survivalItems.forEach(item => {
      container.innerHTML += `
        <article class="content-card">
          <h3>${item.title}</h3>
          <p>${item.description}</p>

          <div class="card-meta">
              <span class="card-badge badge-success">${item.category}</span>
          </div>
        </article>
      `;
    });
}

const searchInput = document.getElementById("survival-search");

searchInput.addEventListener("input", function () {
    const searchText = searchInput.value.toLowerCase();

    const filteredItems = allSurvivalItems.filter(item => {
        return (
            item.title.toLowerCase().includes(searchText) ||
            item.category.toLowerCase().includes(searchText) ||
            item.description.toLowerCase().includes(searchText)
        );
    });

    renderSurvivalItems(filteredItems);
});