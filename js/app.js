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

    // ======================================================
    // Set the initial map position before any other module
    // starts drawing overlays, markers or labels.
    // Leaflet requires a valid center and zoom first.
    // ======================================================
    atlas.resetView();


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
    // 3. Information Panel
    // Controls the right sidebar when displaying
    // information about cities, markers or future search
    // results.
    // ======================================================
    const infoPanel = window.InfoPanel();


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
        atlasToMapCoords,
        infoPanel
    });

    const layerManager = window.LayerManager({
        map,
        markerManager
    });

    layerManager.loadLayerCatalog();


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
        infoPanel
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

});