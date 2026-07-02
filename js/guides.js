let allGuides = []

fetch("../data/guides.json")
  .then(response => response.json())
  .then(guides => {
    allGuides = guides;
    renderGuides(allGuides);
  })
  .catch(error => console.error(error));

  function renderGuides(guides) {
    const container = document.getElementById("guides-container");

    container.innerHTML = "";

    guides.forEach(guide => {
      container.innerHTML += `
        <article class="content-card">
          <h3>${guide.title}</h3>
          <p>${guide.description}</p>

          <div class="card-meta">
              <span class="card-badge badge-success">${guide.category}</span>
              <span class="card-badge badge-warning">${guide.difficulty}</span>
              <span class="card-badge badge-blue">${guide.readTime}</span>
          </div>
        </article>
      `
    });
  }

  const searchInput = document.getElementById("guide-search");

  searchInput.addEventListener("input", function(){
    const searchText = searchInput.value.toLowerCase();

    const filteredGuides = allGuides.filter(guide => {
      return guide.title.toLowerCase().includes(searchText) || 
             guide.description.toLowerCase().includes(searchText) ||
             guide.category.toLowerCase().includes(searchText) ||
             guide.difficulty.toLowerCase().includes(searchText);
    });

    renderGuides(filteredGuides);
  });
    