fetch("../data/news.json")
  .then(response => response.json())
  .then(news => {
    const container = document.getElementById("news-container");

    news.forEach(newsItem => {
      container.innerHTML += `
        <article class="content-card">
          <h3>${newsItem.title}</h3>
          <p>${newsItem.description}</p>

          <div class="card-meta">
              <span class="card-badge badge-success">${newsItem.category}</span>
              <span class="card-date">${newsItem.date}</span>
          </div>
        </article>
      `;
    });
  })
  .catch(error => console.error(error));