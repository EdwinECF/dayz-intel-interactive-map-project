fetch("../data/vehicles.json")
  .then(response => response.json())
  .then(vehicles => {
    const container = document.getElementById("vehicles-container");

    vehicles.forEach(vehicle => {
      container.innerHTML += `
        <article class="content-card">
          <h3>${vehicle.name}</h3>
          <p>${vehicle.description}</p>

          <div class="card-meta">
              <span class="card-badge badge-success">${vehicle.type}</span>
              <span class="card-badge badge-warning">${vehicle.fuelType}</span>
              <span class="card-badge badge-blue">${vehicle.seats}</span>
          </div>
        </article>
      `;
    });
  })
  .catch(error => console.error(error));