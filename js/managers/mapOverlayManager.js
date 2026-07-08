// js/mapOverlayManager.js

window.MapOverlayManager = function ({ map, mapSize, mapToAtlasCoords }) {
    const gridLayer = L.layerGroup().addTo(map);

    const topAxis = document.getElementById("grid-axis-top");
    const leftAxis = document.getElementById("grid-axis-left");
    const crosshair = document.getElementById("map-crosshair");
    const coordinateTooltip = document.getElementById("coordinate-tooltip");

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

    function initCoordinateTooltip() {
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
    }

    function init() {
        drawGrid();
        updateGridAxis();
        initCoordinateTooltip();

        map.on("move zoom", updateGridAxis);
    }

    return {
        init,
        updateGridAxis,
        getCrosshair: () => crosshair
    };
};