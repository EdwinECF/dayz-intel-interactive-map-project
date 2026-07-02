fetch("../data/guides.json")
  .then(response => response.json())
  .then(guides => {
    const container = document.getElementById("guides-container");

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
      `;
    });
  })
  .catch(error => console.error(error));