document.addEventListener("DOMContentLoaded", () => {
    // ======================================================
    // 1. Initialize MapCore
    // MapCore creates the Leaflet map, loads tiles,
    // and provides coordinate conversion helpers.
    // ======================================================
    const atlas = window.MapCore();

    const map = atlas.map;
    const mapSize = atlas.mapSize;
    const atlasToMapCoords = atlas.atlasToMapCoords;
    const mapToAtlasCoords = atlas.mapToAtlasCoords;

    // ======================================================
    // 2. Grid lines
    // ======================================================
    const gridLayer = L.layerGroup().addTo(map);

    function drawGrid() {
        gridLayer.clearLayers();

        const gridCount = 16;
        const cellSize = mapSize / gridCount;

        for (let i = 0; i <= gridCount; i++) {
            const position = i * cellSize;

            // Horizontal grid line
            L.polyline(
                [[-position, 0], [-position, mapSize]],
                { className: "map-grid-line" }
            ).addTo(gridLayer);

            // Vertical grid line
            L.polyline(
                [[-mapSize, position], [0, position]],
                { className: "map-grid-line" }
            ).addTo(gridLayer);
        }
    }

    drawGrid();

    // ======================================================
    // 3. Fixed grid numbers
    // These stay on the top and left of the map container.
    // ======================================================
    const topAxis = document.getElementById("grid-axis-top");
    const leftAxis = document.getElementById("grid-axis-left");

    function updateGridAxis() {
        if (!topAxis || !leftAxis) return;

        topAxis.innerHTML = "";
        leftAxis.innerHTML = "";

        // Hide grid numbers when zoomed in too much
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
    // 4. Crosshair and coordinate tooltip
    // ======================================================
    const crosshair = document.getElementById("map-crosshair");
    const coordinateTooltip = document.getElementById("coordinate-tooltip");

    map.on("mousemove", event => {
        const atlasCoords = mapToAtlasCoords(event.latlng.lat, event.latlng.lng);
        const point = map.mouseEventToContainerPoint(event.originalEvent);

        if (coordinateTooltip) {
            coordinateTooltip.style.display = "block";
            coordinateTooltip.style.left = `${point.x}px`;
            coordinateTooltip.style.top = `${point.y}px`;
            coordinateTooltip.textContent =
                `Lat: ${atlasCoords.lat.toFixed(5)} | Lng: ${atlasCoords.lng.toFixed(5)}`;
        }

        if (crosshair) {
            crosshair.style.display = "block";
            crosshair.style.left = `${point.x}px`;
            crosshair.style.top = `${point.y}px`;
        }
    });

    map.on("mouseout", () => {
        if (coordinateTooltip) coordinateTooltip.style.display = "none";
        if (crosshair) crosshair.style.display = "none";
    });

    // ======================================================
    // 5. Info panel
    // Shows marker or city information in the right sidebar.
    // ======================================================
    const sidePanel = document.getElementById("map-side-panel");
    const closeInfoPanel = document.getElementById("close-info-panel");
    const infoTitle = document.getElementById("info-title");
    const infoType = document.getElementById("info-type");
    const infoCoords = document.getElementById("info-coords");

    function showInfoPanel(data) {
        if (!sidePanel || !infoTitle || !infoType || !infoCoords) return;

        const title = data.name || data.objectName || "Unknown";
        const type = data.type || data.category || "Unknown";
        const group = data.group || "";
        const tier = data.tier ? `Tier ${data.tier}` : "N/A";

        infoTitle.textContent = title;
        infoType.textContent = group ? `Type: ${type} / ${group}` : `Type: ${type}`;
        infoCoords.textContent = `Lat: ${data.lat?.toFixed(5)} | Lng: ${data.lng?.toFixed(5)}`;

        let extraInfo = document.getElementById("info-extra");

        if (!extraInfo) {
            extraInfo = document.createElement("div");
            extraInfo.id = "info-extra";
            infoCoords.after(extraInfo);
        }

        extraInfo.innerHTML = `
            <p><strong>Loot Tier:</strong> ${tier}</p>
            <p><strong>Object:</strong> ${data.objectName || "N/A"}</p>
            <p><strong>Tags:</strong> ${data.tags?.length ? data.tags.join(", ") : "None"}</p>
        `;

        sidePanel.classList.add("show-info");
    }

    closeInfoPanel?.addEventListener("click", () => {
        sidePanel?.classList.remove("show-info");
    });

    // ======================================================
    // 6. City / location labels
    // Loads locations.json and places labels on the map.
    // ======================================================
    const locationLabels = [];

    fetch("../data/locations.json")
        .then(response => response.json())
        .then(locations => {
            locations.forEach(location => {
                const label = L.marker(
                    atlasToMapCoords(location.lat, location.lng),
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
                    crosshair?.classList.add("crosshair-hover");
                });

                label.on("mouseout", () => {
                    crosshair?.classList.remove("crosshair-hover");
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
    // 7. Layer Manager
    // Handles dynamic layer buttons, lazy-loaded markers,
    // layer caching, and marker visibility.
    // ======================================================
    const layerManager = window.LayerManager({
        map,
        atlasToMapCoords,
        showInfoPanel
    });

    layerManager.loadLayerCatalog();

    // ======================================================
    // 8. UI settings
    // Sliders control marker and city label scale.
    // ======================================================
    const mapContainer = document.querySelector(".map-container");
    const labelSizeSlider = document.getElementById("label-size-slider");
    const markerSizeSlider = document.getElementById("marker-size-slider");

    labelSizeSlider?.addEventListener("input", event => {
        mapContainer?.style.setProperty("--label-scale", event.target.value);
    });

    markerSizeSlider?.addEventListener("input", event => {
        mapContainer?.style.setProperty("--marker-scale", event.target.value);
    });

    // ======================================================
    // 9. Initial map position
    // ======================================================
    atlas.resetView();

    setTimeout(() => {
        updateGridAxis();
    }, 150);
});