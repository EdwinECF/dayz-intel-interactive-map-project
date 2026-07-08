let allNews = [] 

fetch("../data/news.json")
  .then(response => response.json())
  .then(news => {
    allNews = news;
    renderNews(allNews);
  })
  .catch(error => console.error(error));

function renderNews(news) {
    const container = document.getElementById("news-container");

    container.innerHTML = "";

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
}

const searchInput = document.getElementById("news-search");

searchInput.addEventListener("input", function () {
    const searchText = searchInput.value.toLowerCase();

    const filteredItems = allNews.filter(newsItem => {
        return (
            newsItem.title.toLowerCase().includes(searchText) ||
            newsItem.category.toLowerCase().includes(searchText) ||
            newsItem.description.toLowerCase().includes(searchText) ||
            String(newsItem.date).includes(searchText)
        );
    });

    renderNews(filteredItems);
});