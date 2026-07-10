document.addEventListener("DOMContentLoaded", () => {

    // ======================================================
    // 1. Initialize MapCore
    // Creates the Leaflet map, loads map tiles,
    // and provides coordinate conversion utilities.
    // ======================================================
    const atlas = window.MapCore();
    const map = atlas.map;
    const mapSize = atlas.mapSize;
    const atlasToMapCoords = atlas.atlasToMapCoords;
    const mapToAtlasCoords = atlas.mapToAtlasCoords;
    const coordinateUtils = window.CoordinateUtils({
        atlasToMapCoords,
        mapSize
    });

    // ======================================================
    // Set the initial map position before any other module
    // starts drawing overlays, markers or labels.
    // Leaflet requires a valid center and zoom first.
    // ======================================================
    atlas.resetView();
    
    setTimeout(() => {
        map.invalidateSize();
    }, 200);

    // ======================================================
    // 2. Map Overlay Manager
    // Responsible ONLY for visual map overlays:
    //
    // • Grid lines
    // • Grid axis numbers
    // • Crosshair
    // • Coordinate tooltip
    // ======================================================
    const mapOverlayManager = window.MapOverlayManager({
        map,
        mapSize,
        mapToAtlasCoords
    });

    mapOverlayManager.init();

    // Crosshair reference is shared with other modules
    // (for example LocationManager changes its appearance
    // when hovering city labels).
    const crosshair = mapOverlayManager.getCrosshair();

    // ======================================================
    // Recent Markers Manager
    // Tracks recently viewed locations and markers.
    // ======================================================
    const recentMarkersManager = window.RecentMarkersManager({
        onSelect: item => {
            const coords = item.type === "Route Planner" && item.startLat && item.startLng
                ? [item.startLat, item.startLng]
                : atlasToMapCoords(item.lat, item.lng);

            if (item.layerId) {
                const layerConfig = layerManager.getLayerConfig(item.layerId);

                if (layerConfig) {
                    markerManager.showOnly(item, layerConfig);
                }
            }

            map.flyTo(coords, -2, {
                duration: 0.75
            });

            infoPanel.show(item);

            if (item.id) {
                setTimeout(() => {
                    markerManager.flashMarker(item.id);
                }, 300);
            }
        },

        onToggleVisibility: item => {
            const isVisible = !item.hidden;

            if (item.type === "Route Planner") {
                routeManager.setRoutesVisibility(isVisible);
                return;
            }

            if (item.layerId || item.id) {
                markerManager.setFocusedMarkerVisibility(isVisible);
            }
        }
    });

    // ======================================================
    // Formatter for Data Names to Known Names
    // ======================================================
    const displayNameFormatter = window.DisplayNameFormatter();

    // ======================================================
    // 3. Information Panel
    // Controls the right sidebar when displaying
    // information about cities, markers or future search
    // results.
    // ======================================================
    const infoPanel = window.InfoPanel({
        recentMarkersManager,
        displayNameFormatter,
        coordinateUtils
    });

    // ======================================================
    // Custom Marker Manager
    // Handles user-created markers from the map context menu.
    // ======================================================
    const customMarkerManager = window.CustomMarkerManager({
        map,
        mapToAtlasCoords,
        atlasToMapCoords,
        infoPanel,
        recentMarkersManager
    });

    const routeManager = window.RouteManager({
        map,
        infoPanel,
        mapSize,
        recentMarkersManager
    });

    // ======================================================
    // Map Context Menu
    // Right-click menu for custom marker tools.
    // ======================================================
    const contextMenu = document.getElementById("map-context-menu");
    let contextMenuLatLng = null;

    map.on("contextmenu", event => {
        contextMenuLatLng = event.latlng;

        const point = map.latLngToContainerPoint(event.latlng);

        if (!contextMenu) return;
        contextMenu.classList.remove("hidden");
        contextMenu.style.visibility = "hidden";

        const menuWidth = contextMenu.offsetWidth;
        const menuHeight = contextMenu.offsetHeight;
        const container = map.getContainer();
        let left = point.x;
        let top = point.y;

        if (left + menuWidth > container.clientWidth) {
            left = container.clientWidth - menuWidth - 8;
        }

        if (top + menuHeight > container.clientHeight) {
            top = container.clientHeight - menuHeight - 8;
        }

        left = Math.max(8, left);
        top = Math.max(8, top);

        contextMenu.style.left = `${left}px`;
        contextMenu.style.top = `${top}px`;

        contextMenu.style.visibility = "visible";
    });

    contextMenu?.addEventListener("click", event => {
        const button = event.target.closest("button");
        if (!button || !contextMenuLatLng) return;

        const routeAction = button.dataset.route;
        const markerType = button.dataset.markerType;

        if (routeAction) {
            if (routeAction === "start") {
                routeManager.begin(contextMenuLatLng);
            }

            if (routeAction === "finish") {
                routeManager.finish(contextMenuLatLng);
            }

            if (routeAction === "clear") {
                routeManager.clearRoute();
            }

            contextMenu.classList.add("hidden");
            return;
        }

        if (markerType) {
            console.log("Adding custom marker:", markerType, contextMenuLatLng);
            customMarkerManager.addMarker(contextMenuLatLng, markerType);
        }

        contextMenu.classList.add("hidden");
    });

    map.on("mousemove", event => {
    routeManager.preview?.(event.latlng);
});

    map.on("click", event => {
        if (routeManager.isPlanning?.()) {
            routeManager.finish(event.latlng);
            return;
        }

        contextMenu?.classList.add("hidden");
    });
    document.addEventListener("click", event => {
        if (!contextMenu) return;

        const clickedInsideMenu = contextMenu.contains(event.target);

        if (!clickedInsideMenu) {
            contextMenu.classList.add("hidden");
        }
    });

    // ======================================================
    // 4. Location Manager
    // Handles city labels:
    //
    // • Loads locations.json
    // • Creates labels
    // • Handles zoom visibility
    // • Opens the info panel when clicked
    // ======================================================
    const locationManager = window.LocationManager({
        map,
        atlasToMapCoords,
        infoPanel,
        crosshair
    });

    locationManager.init();
    // ======================================================
    // 5. Marker Manager
    // Creates Leaflet markers and marker icons.
    // LayerManager will use this instead of creating markers itself.
    // ======================================================
    const markerManager = window.MarkerManager({
        map,
        atlasToMapCoords,
        infoPanel
    });

    const layerManager = window.LayerManager({
        map,
        markerManager
    });

    layerManager.loadLayerCatalog();
    const resetLayersBtn = document.getElementById("reset-layers-btn");

    resetLayersBtn?.addEventListener("click", () => {
        layerManager.resetLayers();
    });


    // ======================================================
    // 6. UI Manager
    // Handles interface controls that are not directly
    // related to the map itself.
    //
    // Current:
    // • Marker size slider
    // • City label size slider
    //
    // Future:
    // • Theme
    // • Settings
    // • User preferences
    // ======================================================
    const uiManager = window.UIManager();

    uiManager.init();
    // ======================================================
    // 7. Search Service
    // Loads searchable data and exposes search methods.
    // For now it only indexes locations. Later it will use
    // generated search-index.json for all DZ-Atlas data.
    // ======================================================
    const searchService = window.SearchService();

    searchService.load(); 
    window.searchService = searchService;
    
    // ======================================================
    // 8. Search Manager
    // Connects the search input, search results, map movement,
    // and info panel together.
    // ======================================================
    const searchManager = window.SearchManager({
        map,
        atlasToMapCoords,
        searchService,
        infoPanel,
        layerManager,
        markerManager,
        displayNameFormatter
    });

    searchManager.init();

    // ======================================================
    // Final initialization
    // Give Leaflet a moment to finish rendering, then
    // update overlays that depend on the map size.
    // ======================================================
    setTimeout(() => {
        mapOverlayManager.updateGridAxis();
        map.invalidateSize();
    }, 150);


    // ======================================================
    // Presentation layer helpers
    // These do not alter map logic.
    // ======================================================
    const serverTime = document.getElementById("server-time");

    function updateServerTime() {
        if (!serverTime) return;

        const now = new Date();
        serverTime.textContent = now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        });
    }

    updateServerTime();
    setInterval(updateServerTime, 30000);

    document.querySelectorAll(".quick-layer-btn").forEach(button => {
        button.addEventListener("click", () => {
            button.classList.toggle("active");

            const layerName = button.dataset.quickLayer?.toLowerCase();
            if (!layerName) return;

            const matchingButtons = [...document.querySelectorAll(".layer-button")].filter(layerButton => {
                const text = layerButton.textContent.trim().toLowerCase();
                return text.includes(layerName);
            });

            matchingButtons.forEach(layerButton => layerButton.click());
        });
    });

});


    // ======================================================
    // MAP BRIGTHNESS
    // ======================================================

const mapBrightnessSlider = document.getElementById(
    "map-brightness-slider"
);

const mapContainer = document.querySelector(".map-container");

const savedBrightness =
    localStorage.getItem("dzAtlasMapBrightness") || "0.72";

if (mapBrightnessSlider && mapContainer) {
    mapBrightnessSlider.value = savedBrightness;

    mapContainer.style.setProperty(
        "--map-brightness",
        savedBrightness
    );

    mapBrightnessSlider.addEventListener("input", event => {
        const brightness = event.target.value;

        mapContainer.style.setProperty(
            "--map-brightness",
            brightness
        );

        localStorage.setItem(
            "dzAtlasMapBrightness",
            brightness
        );
    });
}