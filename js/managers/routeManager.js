// ======================================================
// RouteManager
// Handles route planning, measuring and future saved routes.
// ======================================================

window.RouteManager = function ({
    map,
    infoPanel,
    mapSize,
    recentMarkersManager
}) {
    const DAYZ_WORLD_SIZE = 15360;
    const STORAGE_KEY = "dzAtlasRoutes";
    const savedRoutes = [];
    let startPoint = null;
    let endPoint = null;
    let previewLine = null;
    const routeMarkers = [];
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

    function emitPlanningChange(isPlanning) {
        document.dispatchEvent(
            new CustomEvent("dzatlas:route-planning-change", {
                detail: {
                    planning: isPlanning,
                    routeName: currentRoute?.name || ""
                }
            })
        );
    }

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
        routeMarkers.forEach(marker => {
            map.removeLayer(marker);
        });

        routeMarkers.length = 0;

        if (previewLine) {
            map.removeLayer(previewLine);
            previewLine = null;
        }
        savedRoutes.length = 0;
        localStorage.removeItem(STORAGE_KEY);
        
        planning = false;
        startPoint = null;
        endPoint = null;
        currentRoute = null;
        emitPlanningChange(false);
    }

    function clearActiveRoutePlanning() {
        if (previewLine) {
            map.removeLayer(previewLine);
            previewLine = null;
        }

        planning = false;
        startPoint = null;
        endPoint = null;
        emitPlanningChange(false);
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
        emitPlanningChange(true);
        createRouteMarker(startPoint, "start");
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
        emitPlanningChange(false);
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
        emitPlanningChange(false);

        if (previewLine) {
            map.removeLayer(previewLine);
            previewLine = null;
        }

        endPoint = point;
        createRouteMarker(endPoint, "finish");

        drawRoute();
        showRouteInfo();
    }

    function createRouteMarker(point, type) {
        const icon = L.divIcon({
            className: `route-point-marker route-point-${type}`,
            html: type === "start"
                ? `<i class="fa-solid fa-play"></i>`
                : `<i class="fa-solid fa-flag-checkered"></i>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        const marker = L.marker([point.lat, point.lng], {
            icon,
            interactive: false
        }).addTo(map);

        routeMarkers.push(marker);
    }

    function drawRoute(routeData = null, shouldSave = true) {
        const routeStart = routeData?.startPoint || startPoint;
        const routeEnd = routeData?.endPoint || endPoint;
        const routeColor = routeData?.color || currentRoute?.color || "#22c55e";

        const newRouteLine = L.polyline(
            [
                [routeStart.lat, routeStart.lng],
                [routeEnd.lat, routeEnd.lng]
            ],
            {
                color: routeColor,
                weight: 4,
                dashArray: "10 8"
            }
        ).addTo(map);

        newRouteLine.bringToFront();
        routeLines.push(newRouteLine);

        if (shouldSave) {
            const newRoute = {
                id: `route-${Date.now()}`,
                name: currentRoute?.name || "Planned Route",
                color: routeColor,
                startPoint: {
                    lat: routeStart.lat,
                    lng: routeStart.lng
                },
                endPoint: {
                    lat: routeEnd.lat,
                    lng: routeEnd.lng
                }
            };

            savedRoutes.push(newRoute);
            saveRoutes();
        }

        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }

    function saveRoutes() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedRoutes));
        console.log("Saving routes:", savedRoutes);
    }

    function loadSavedRoutes() {
        const routes = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

        routes.forEach(routeData => {
            savedRoutes.push(routeData);

            createRouteMarker(routeData.startPoint, "start");
            createRouteMarker(routeData.endPoint, "finish");

            drawRoute(routeData, false);

            recentMarkersManager?.add({
                id: routeData.id,
                name: routeData.name,
                displayName: routeData.name,
                type: "Route Planner",
                category: "Route",
                lat: routeData.endPoint.lat,
                lng: routeData.endPoint.lng,
                startLat: routeData.startPoint.lat,
                startLng: routeData.startPoint.lng,
                routeInfo: {
                    distance: "Saved route",
                    walking: "Open route",
                    jogging: "Open route",
                    sprinting: "Open route"
                },
                tags: ["route"]
            });
        });
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

    function setRoutesVisibility(isVisible) {
        routeLines.forEach(line => {
            if (isVisible) {
                if (!map.hasLayer(line)) line.addTo(map);
            } else {
                if (map.hasLayer(line)) map.removeLayer(line);
            }
        });

        routeMarkers.forEach(marker => {
            if (isVisible) {
                if (!map.hasLayer(marker)) marker.addTo(map);
            } else {
                if (map.hasLayer(marker)) map.removeLayer(marker);
            }
        });
    }

    loadSavedRoutes();

    return {
        begin,
        preview,
        finish,
        clearRoute,
        clearActiveRoutePlanning,
        isPlanning,
        setRoutesVisibility
    };
};