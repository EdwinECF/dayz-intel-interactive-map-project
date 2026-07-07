document.addEventListener("DOMContentLoaded", () => {
    // ======================================================
    // 1. Base map setup
    // ======================================================
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

    // ======================================================
    // 2. Tile layer
    // ======================================================
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

    // ======================================================
    // 3. Coordinate conversion
    // iZurvive coordinates -> our CRS.Simple tile map
    // ======================================================
    function izurviveToMapCoords(lat, lng) {
        const point = L.CRS.EPSG3857.latLngToPoint(
            L.latLng(lat, lng),
            maxTileLevel
        );

        return [-point.y, point.x];
    }

    function mapToIzurviveCoords(mapLat, mapLng) {
        const point = L.point(mapLng, Math.abs(mapLat));
        return L.CRS.EPSG3857.pointToLatLng(point, maxTileLevel);
    }

    // ======================================================
    // 4. Grid lines
    // ======================================================
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

    // ======================================================
    // 5. Fixed grid numbers
    // ======================================================
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

    // ======================================================
    // 6. Crosshair and coordinate tooltip
    // ======================================================
    const crosshair = document.getElementById("map-crosshair");
    const coordinateTooltip = document.getElementById("coordinate-tooltip");

    map.on("mousemove", event => {
        const izCoords = mapToIzurviveCoords(event.latlng.lat, event.latlng.lng);
        const point = map.mouseEventToContainerPoint(event.originalEvent);

        coordinateTooltip.style.display = "block";
        coordinateTooltip.style.left = `${point.x}px`;
        coordinateTooltip.style.top = `${point.y}px`;
        coordinateTooltip.textContent =
            `Lat: ${izCoords.lat.toFixed(5)} | Lng: ${izCoords.lng.toFixed(5)}`;

        crosshair.style.display = "block";
        crosshair.style.left = `${point.x}px`;
        crosshair.style.top = `${point.y}px`;
    });

    map.on("mouseout", () => {
        coordinateTooltip.style.display = "none";
        crosshair.style.display = "none";
    });

    // ======================================================
    // 7. City / location labels
    // ======================================================
    const locationLabels = [];

    fetch("../data/locations.json")
        .then(response => response.json())
        .then(locations => {
            locations.forEach(location => {
                const label = L.marker(
                    izurviveToMapCoords(location.lat, location.lng),
                    {
                        icon: L.divIcon({
                            className: `map-label ${location.size}`,
                            html: `
                                <span class="label-main">${location.name}</span>
                                <span class="label-local">${location.localName || ""}</span>
                            `,
                            iconSize: null
                        }),
                        interactive: true
                    }
                ).addTo(map);

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
                label.on("click", () => {
                    showInfoPanel(location);
                });
            });

            updateLabelVisibility();
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

    // ======================================================
    // 8. Dynamic marker layer system
    // Reads data/layers.json and builds buttons automatically
    // ======================================================
    const markerLayers = {};
    const markerCache = {};

    const filterHandlers = {
        all: () => true,

        water: marker =>
            marker.objectName.includes("well_pump") ||
            marker.objectName.includes("water"),

        police: marker =>
            marker.group === "PoliceStation" ||
            marker.objectName.toLowerCase().includes("police"),

        hunting: marker =>
            marker.group.toLowerCase().includes("deer") ||
            marker.group.toLowerCase().includes("hunting") ||
            marker.objectName.toLowerCase().includes("hunting"),

        farm: marker =>
            marker.group.toLowerCase().includes("farm") ||
            marker.objectName.toLowerCase().includes("farm")
    };

    function createMarker(marker, config) {
        const leafletMarker = L.marker(
            izurviveToMapCoords(marker.lat, marker.lng),
            {
                icon: createMarkerIcon(config.className, config.icon),
                interactive: true
            }
        );

        leafletMarker.on("click", () => {
            showInfoPanel({
                ...marker,
                type: config.title
            });
        });

        return leafletMarker;
    }

    function loadLayer(config) {
        if (!markerLayers[config.id]) {
            markerLayers[config.id] = L.layerGroup();
        }

        if (markerCache[config.id]) {
            markerLayers[config.id].addTo(map);
            return;
        }

        fetch(config.file)
            .then(response => response.json())
            .then(markers => {
                const filter =
                    filterHandlers[config.filterType] ||
                    filterHandlers.all;

                markers
                    .filter(filter)
                    .forEach(marker => {
                        createMarker(marker, config).addTo(markerLayers[config.id]);
                    });

                markerCache[config.id] = true;
                markerLayers[config.id].addTo(map);
            });
    }

    function unloadLayer(layerId) {
        const layer = markerLayers[layerId];

        if (layer && map.hasLayer(layer)) {
            map.removeLayer(layer);
        }
    }

    function buildLayerButton(config) {
        const layerList = document.getElementById("layer-list");
        if (!layerList) return;

        const button = document.createElement("button");

        button.dataset.layer = config.id;
        button.innerHTML = `
            <i class="fa-solid fa-${config.icon}"></i>
            ${config.title}
        `;

        if (config.default) {
            button.classList.add("active");
            loadLayer(config);
        }

        button.addEventListener("click", () => {
            const isActive = button.classList.toggle("active");

            if (isActive) {
                loadLayer(config);
            } else {
                unloadLayer(config.id);
            }
        });

        layerList.appendChild(button);
    }

    function loadLayerCatalog() {
        fetch("../data/layers.json")
            .then(response => response.json())
            .then(layerData => {
                layerData.categories.forEach(buildLayerButton);
            });
    }

    loadLayerCatalog();

    const sidePanel = document.getElementById("map-side-panel");
    const closeInfoPanel = document.getElementById("close-info-panel");
    const infoTitle = document.getElementById("info-title");
    const infoType = document.getElementById("info-type");
    const infoCoords = document.getElementById("info-coords");

    function showInfoPanel(data) {
        if (!sidePanel) return;

        infoTitle.textContent = data.name || "Unknown";
        infoType.textContent = `Type: ${data.type || data.category || "Unknown"}`;
        infoCoords.textContent = `Lat: ${data.lat?.toFixed(5)} | Lng: ${data.lng?.toFixed(5)}`;

        sidePanel.classList.add("show-info");
    }

    closeInfoPanel?.addEventListener("click", () => {
        sidePanel.classList.remove("show-info");
    });

    const mapContainer = document.querySelector(".map-container");
    const labelSizeSlider = document.getElementById("label-size-slider");
    const markerSizeSlider = document.getElementById("marker-size-slider");

    labelSizeSlider?.addEventListener("input", event => {
        mapContainer.style.setProperty("--label-scale", event.target.value);
    });

    markerSizeSlider?.addEventListener("input", event => {
        mapContainer.style.setProperty("--marker-scale", event.target.value);
    });

    // ======================================================
    // 9. Initial map position
    // ======================================================
    map.setView([-mapSize / 2, mapSize / 2], -5);

    setTimeout(() => {
        map.invalidateSize();
        updateGridAxis();
    }, 100);
});