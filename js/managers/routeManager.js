// ======================================================
// RouteManager
// Handles route planning, measuring and future saved routes.
// ======================================================

window.RouteManager = function ({
    map,
    infoPanel,
    mapSize
}) {
    const DAYZ_WORLD_SIZE = 15360;

    let startPoint = null;
    let endPoint = null;
    let previewLine = null;
    let planning = false;

    const routeLines = [];

    const routeEditorModal = document.getElementById("route-editor-modal");
    const routeNameInput = document.getElementById("route-name-input");
    const routeColorSelect = document.getElementById("route-color-select");
    const cancelRouteStart = document.getElementById("cancel-route-start");
    const confirmRouteStart = document.getElementById("confirm-route-start");

    let pendingStartPoint = null;
    let routeCount = 1;
    let currentRoute = null;

    function mapDistanceToMeters(pointA, pointB) {
        const dx = pointB.lng - pointA.lng;
        const dy = pointB.lat - pointA.lat;

        const mapDistance = Math.sqrt(dx * dx + dy * dy);
        return (mapDistance / mapSize) * DAYZ_WORLD_SIZE;
    }

    function formatTime(minutes) {
        if (minutes < 60) {
            return `${Math.round(minutes)} min`;
        }

        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);

        return `${hours}h ${mins}m`;
    }

    function getTravelTimes(distanceMeters) {
        return {
            walking: formatTime(distanceMeters / 80),
            jogging: formatTime(distanceMeters / 140),
            sprinting: formatTime(distanceMeters / 220)
        };
    }

    function clearRoute() {
        routeLines.forEach(line => {
            map.removeLayer(line);
        });

        routeLines.length = 0;

        if (previewLine) {
            map.removeLayer(previewLine);
            previewLine = null;
        }

        planning = false;
        startPoint = null;
        endPoint = null;
        currentRoute = null;
    }

    function clearActiveRoutePlanning() {
        if (previewLine) {
            map.removeLayer(previewLine);
            previewLine = null;
        }

        planning = false;
        startPoint = null;
        endPoint = null;
    }

    function begin(point) {
        pendingStartPoint = point;

        if (routeNameInput) {
            routeNameInput.value = `Route ${routeCount}`;
        }

        if (routeColorSelect) {
            routeColorSelect.value = "#22c55e";
        }

        routeEditorModal?.classList.remove("hidden");
    }

    function startConfirmedRoute() {
        if (!pendingStartPoint) return;

        clearActiveRoutePlanning();

        const routeName = routeNameInput?.value.trim() || `Route ${routeCount}`;
        const routeColor = routeColorSelect?.value || "#22c55e";

        currentRoute = {
            name: routeName,
            color: routeColor
        };

        routeCount++;

        startPoint = pendingStartPoint;
        pendingStartPoint = null;
        planning = true;

        routeEditorModal?.classList.add("hidden");

        infoPanel.show({
            skipRecent: true,
            name: routeName,
            type: "Route Planner",
            category: "Route",
            lat: startPoint.lat,
            lng: startPoint.lng,
            objectName: "Move your mouse and left-click to finish the route.",
            tags: ["Planning route"]
        });
    }

    function cancelRouteStartHandler() {
        pendingStartPoint = null;
        routeEditorModal?.classList.add("hidden");
    }

    function preview(point) {
        if (!planning || !startPoint) return;

        if (previewLine) {
            map.removeLayer(previewLine);
        }

        previewLine = L.polyline(
            [
                [startPoint.lat, startPoint.lng],
                [point.lat, point.lng]
            ],
            {
                color: currentRoute?.color || "#22c55e",
                weight: 3,
                dashArray: "6 8",
                opacity: 0.7
            }
        ).addTo(map);
    }

    function finish(point) {
        if (!startPoint) return;

        planning = false;

        if (previewLine) {
            map.removeLayer(previewLine);
            previewLine = null;
        }

        endPoint = point;

        drawRoute();
        showRouteInfo();
    }

    function drawRoute() {
        const newRouteLine = L.polyline(
            [
                [startPoint.lat, startPoint.lng],
                [endPoint.lat, endPoint.lng]
            ],
            {
                color: currentRoute?.color || "#22c55e",
                weight: 4,
                dashArray: "10 8"
            }
        ).addTo(map);

        newRouteLine.bringToFront();
        routeLines.push(newRouteLine);

        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }

    function showRouteInfo() {
        const distanceMeters = mapDistanceToMeters(startPoint, endPoint);
        const distanceKm = (distanceMeters / 1000).toFixed(2);
        const times = getTravelTimes(distanceMeters);

        infoPanel.show({
            name: currentRoute?.name || "Planned Route",
            type: "Route Planner",
            category: "Route",
            lat: endPoint.lat,
            lng: endPoint.lng,
            startLat: startPoint.lat,
            startLng: startPoint.lng,
            routeInfo: {
                distance: `${distanceKm} km`,
                walking: times.walking,
                jogging: times.jogging,
                sprinting: times.sprinting
            },
            tags: ["route"]
        });
    }

    function isPlanning() {
        return planning;
    }

    confirmRouteStart?.addEventListener("click", startConfirmedRoute);
    cancelRouteStart?.addEventListener("click", cancelRouteStartHandler);

    routeEditorModal?.addEventListener("click", event => {
        if (event.target === routeEditorModal) {
            cancelRouteStartHandler();
        }
    });

    return {
        begin,
        preview,
        finish,
        clearRoute,
        clearActiveRoutePlanning,
        isPlanning
    };
};