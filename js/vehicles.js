let allVehicles = []

fetch("../data/vehicles.json")
  .then(response => response.json())
  .then(vehicles => {
    allVehicles = vehicles;
    renderVehicles(allVehicles);
  })
  .catch(error => console.error(error));


function renderVehicles(vehicles) {
    const container = document.getElementById("vehicles-container");

    container.innerHTML = "";

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
}

const searchInput = document.getElementById("vehicles-search");

searchInput.addEventListener("input", function () {
    const searchText = searchInput.value.toLowerCase();

    const filteredItems = allVehicles.filter(vehicle => {
        return (
            vehicle.name.toLowerCase().includes(searchText) ||
            vehicle.description.toLowerCase().includes(searchText) ||
            vehicle.type.toLowerCase().includes(searchText) ||
            vehicle.fuelType.toLowerCase().includes(searchText) ||
            vehicle.seats.toString().includes(searchText));
    });

    renderVehicles(filteredItems);
});