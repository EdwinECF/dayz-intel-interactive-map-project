document.addEventListener("DOMContentLoaded", () => {
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

    new DayZTileLayer("", {
        tileSize,
        minZoom: -6,
        maxZoom: 0,
        noWrap: true,
        bounds
    }).addTo(map);

    function izurviveToMapCoords(lat, lng) {
        const point = L.CRS.EPSG3857.latLngToPoint(L.latLng(lat, lng), maxTileLevel);
        return [-point.y, point.x];
    }

    function mapToIzurviveCoords(mapLat, mapLng) {
        const point = L.point(mapLng, Math.abs(mapLat));
        return L.CRS.EPSG3857.pointToLatLng(point, maxTileLevel);
    }

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

    const topAxis = document.getElementById("grid-axis-top");
    const leftAxis = document.getElementById("grid-axis-left");

    function updateGridAxis() {
        if (!topAxis || !leftAxis) return;

        topAxis.innerHTML = "";
        leftAxis.innerHTML = "";

        if (map.getZoom() > -4) return;

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

    const crosshair = document.getElementById("map-crosshair");
    const coordinateTooltip = document.getElementById("coordinate-tooltip");

    map.on("mousemove", function (event) {
        const izCoords = mapToIzurviveCoords(event.latlng.lat, event.latlng.lng);
        const point = map.mouseEventToContainerPoint(event.originalEvent);

        coordinateTooltip.style.display = "block";
        coordinateTooltip.style.left = `${point.x}px`;
        coordinateTooltip.style.top = `${point.y}px`;
        coordinateTooltip.textContent = `Lat: ${izCoords.lat.toFixed(5)} | Lng: ${izCoords.lng.toFixed(5)}`;

        crosshair.style.display = "block";
        crosshair.style.left = `${point.x}px`;
        crosshair.style.top = `${point.y}px`;
    });

    map.on("mouseout", function () {
        coordinateTooltip.style.display = "none";
        crosshair.style.display = "none";
    });

    const locationLabels = [];

    fetch("../data/locations.json")
        .then(response => response.json())
        .then(locations => {
            locations.forEach(location => {
                const label = L.marker(izurviveToMapCoords(location.lat, location.lng), {
                    icon: L.divIcon({
                        className: `map-label ${location.size}`,
                        html: `
                            <span class="label-main">${location.name}</span>
                            <span class="label-local">${location.localName || ""}</span>
                        `,
                        iconSize: null
                    }),
                    interactive: true
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

    const markerLayers = {
        water: L.layerGroup().addTo(map)
    };

    fetch("../data/markers-urban.json")
        .then(response => response.json())
        .then(markers => {
            markers
                .filter(marker =>
                    marker.objectName === "land_misc_well_pump_blue" ||
                    marker.objectName === "land_misc_well_pump_yellow" ||
                    marker.objectName === "land_water_station" ||
                    marker.objectName === "farm_watertower_small" ||
                    marker.objectName === "farm_watertower"
                )
                .forEach(marker => {
                    L.marker(izurviveToMapCoords(marker.lat, marker.lng), {
                        icon: L.divIcon({
                            className: "water-marker",
                            html: `<i class="fa-solid fa-droplet"></i>`,
                            iconSize: null
                        }),
                        interactive: true
                    }).addTo(markerLayers.water);
                });
        });

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

    map.setView([-mapSize / 2, mapSize / 2], -5);

    setTimeout(() => {
        map.invalidateSize();
        updateGridAxis();
    }, 100);
});