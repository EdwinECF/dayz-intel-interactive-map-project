document.addEventListener("DOMContentLoaded", () => {
    // =========================
    // Base map setup
    // =========================
    const tileSize = 256;
    const maxTileLevel = 7;
    const maxTiles = Math.pow(2, maxTileLevel);
    const mapSize = maxTiles * tileSize;

    const bounds = [
        [-mapSize, 0],
        [0, mapSize]
    ];

    const map = L.map("dayz-map", {
        crs: L.CRS.Simple,
        minZoom: -5,
        maxZoom: 0,
        zoomControl: true,
        maxBounds: bounds,
        maxBoundsViscosity: 1.0
    });

    // =========================
    // Tile layer
    // =========================
    const DayZTileLayer = L.TileLayer.extend({
        getTileUrl: function (coords) {
            const tileLevel = maxTileLevel + coords.z;
            const tilesCount = Math.pow(2, tileLevel);

            const x = coords.x;
            const y = Math.abs(coords.y);

            if (
                tileLevel < 1 ||
                tileLevel > 7 ||
                x < 0 ||
                x >= tilesCount ||
                y < 0 ||
                y >= tilesCount
            ) {
                return "";
            }

            return `../assets/maps/chernarus/top/${tileLevel}/${x}/${y}.jpg`;
        }
    });

    const tileLayer = new DayZTileLayer("", {
        tileSize: tileSize,
        minZoom: -6,
        maxZoom: 0,
        noWrap: true,
        bounds: bounds
    });

    tileLayer.addTo(map);

    // =========================
    // Grid lines
    // =========================
    const gridLayer = L.layerGroup().addTo(map);

    function drawGrid() {
        gridLayer.clearLayers();

        const gridCount = 16;
        const cellSize = mapSize / gridCount;

        for (let i = 0; i <= gridCount; i++) {
            const position = i * cellSize;

            L.polyline(
                [[-position, 0], [-position, mapSize]],
                { className: "map-grid-line" }
            ).addTo(gridLayer);

            L.polyline(
                [[-mapSize, position], [0, position]],
                { className: "map-grid-line" }
            ).addTo(gridLayer);
        }
    }

    drawGrid();

    // =========================
    // Fixed grid numbers
    // =========================
    const topAxis = document.getElementById("grid-axis-top");
    const leftAxis = document.getElementById("grid-axis-left");

function updateGridAxis() {
    if (!topAxis || !leftAxis) return;

    topAxis.innerHTML = "";
    leftAxis.innerHTML = "";

    const zoom = map.getZoom();

    if (zoom > -4) {
        return;
    }

    const gridCount = 16;
    const cellSize = mapSize / gridCount;

    for (let i = 0; i < gridCount; i++) {
        const center = i * cellSize + cellSize / 2;

        const topPoint = map.latLngToContainerPoint([0, center]);
        const leftPoint = map.latLngToContainerPoint([-center, 0]);

        if (topPoint.x >= 0 && topPoint.x <= map.getSize().x) {
            const label = document.createElement("span");
            label.textContent = String(i + 1).padStart(2, "0");
            label.style.position = "absolute";
            label.style.left = `${topPoint.x}px`;
            label.style.transform = "translateX(-50%)";
            topAxis.appendChild(label);
        }

        if (leftPoint.y >= 0 && leftPoint.y <= map.getSize().y) {
            const label = document.createElement("span");
            label.textContent = String(i + 1).padStart(2, "0");
            label.style.position = "absolute";
            label.style.top = `${leftPoint.y}px`;
            label.style.transform = "translateY(-50%)";
            leftAxis.appendChild(label);
        }
    }
}

    map.on("move zoom", updateGridAxis);

    // =========================
    // Coordinate helpers
    // =========================
    function dayzToMapCoords(dayzX, dayzY) {
        const dayzWorldSize = 15360;

        const x = (dayzX / dayzWorldSize) * mapSize;
        const y = (dayzY / dayzWorldSize) * mapSize;

        return [-y, x];
    }

    function mapToDayzCoords(mapX, mapY) {
        const dayzWorldSize = 15360;

        return {
            x: Math.round((mapX / mapSize) * dayzWorldSize),
            y: Math.round((mapY / mapSize) * dayzWorldSize)
        };
    }

    // =========================
    // Crosshair and coordinate tooltip
    // =========================
    const crosshair = document.getElementById("map-crosshair");
    const coordinateTooltip = document.getElementById("coordinate-tooltip");

    map.on("mousemove", function (event) {
        const mapX = event.latlng.lng;
        const mapY = Math.abs(event.latlng.lat);
        const dayzCoords = mapToDayzCoords(mapX, mapY);
        const point = map.mouseEventToContainerPoint(event.originalEvent);

        coordinateTooltip.style.display = "block";
        coordinateTooltip.style.left = `${point.x}px`;
        coordinateTooltip.style.top = `${point.y}px`;
        coordinateTooltip.textContent = `X: ${dayzCoords.x} | Y: ${dayzCoords.y}`;

        crosshair.style.display = "block";
        crosshair.style.left = `${point.x}px`;
        crosshair.style.top = `${point.y}px`;
    });

    map.on("mouseout", function () {
        coordinateTooltip.style.display = "none";
        crosshair.style.display = "none";
    });

    // =========================
    // Location labels
    // =========================
    const locationLabels = [];

    fetch("../data/locations.json")
        .then(response => response.json())
        .then(locations => {
            locations.forEach(location => {
                const label = L.marker(dayzToMapCoords(location.dayzX, location.dayzY), {
                    icon: L.divIcon({
                        className: `map-label ${location.size}`,
                        html: `
                            <span class="label-main">${location.name}</span>
                            <span class="label-local">${location.localName}</span>
                        `,
                        iconSize: null
                    })
                }).addTo(map);

                locationLabels.push({
                    marker: label,
                    size: location.size
                });

                label.on("mouseover", () => {
                    crosshair.classList.add("crosshair-hover");
                });

                label.on("mouseout", () => {
                    crosshair.classList.remove("crosshair-hover");
                });
            });

            updateLabelVisibility();
        });

    // =========================
    // Label zoom visibility
    // =========================
    function updateLabelVisibility() {
        const zoom = map.getZoom();

        locationLabels.forEach(item => {
            const shouldShow =
                item.size === "major" ||
                (item.size === "medium" && zoom >= -4) ||
                (item.size === "small" && zoom >= -2);

            if (shouldShow && !map.hasLayer(item.marker)) {
                item.marker.addTo(map);
            }

            if (!shouldShow && map.hasLayer(item.marker)) {
                map.removeLayer(item.marker);
            }
        });
    }

    map.on("zoomend", updateLabelVisibility);

    // =========================
    // Initial map position
    // =========================
    map.setView([-mapSize / 2, mapSize / 2], -5);

    setTimeout(() => {
        map.invalidateSize();
        updateGridAxis();
    }, 100);
});