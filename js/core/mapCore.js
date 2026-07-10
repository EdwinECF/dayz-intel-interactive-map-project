// ======================================================
// MapCore
// Creates and configures the Leaflet map.
// ======================================================

window.MapCore = function () {
    const tileSize = 256;
    const maxTileLevel = 7;
    const maxTiles = Math.pow(2, maxTileLevel);
    const mapSize = maxTiles * tileSize;

    const bounds = [
        [-mapSize, 0],
        [0, mapSize]
    ];

    const isMobile = window.matchMedia("(max-width: 980px)").matches;

    const map = L.map("dayz-map", {
        crs: L.CRS.Simple,

        // Match the lowest available tile level.
        minZoom: -6,
        maxZoom: 0,

        zoomControl: true,
        touchZoom: true,
        doubleClickZoom: true,
        scrollWheelZoom: true,

        // Smoother pinch zoom on mobile.
        zoomSnap: isMobile ? 0.25 : 1,
        zoomDelta: isMobile ? 0.5 : 1,

        // Prevent the elastic zoom effect at the limits.
        bounceAtZoomLimits: false,

        maxBounds: bounds,

        // 1.0 feels too rigid on touchscreens.
        maxBoundsViscosity: isMobile ? 0.65 : 1.0
    });

    const DayZTileLayer = L.TileLayer.extend({
        getTileUrl(coords) {
            const tileLevel = maxTileLevel + coords.z;
            const tilesCount = Math.pow(2, tileLevel);

            const x = coords.x;
            const y = Math.abs(coords.y);

            if (
                tileLevel < 1 ||
                tileLevel > maxTileLevel ||
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
        minNativeZoom: -6,
        maxNativeZoom: 0,
        noWrap: true,
        bounds,
        keepBuffer: isMobile ? 1 : 2,
        updateWhenZooming: false,
        updateWhenIdle: true
    }).addTo(map);

    function atlasToMapCoords(lat, lng) {
        const point = L.CRS.EPSG3857.latLngToPoint(
            L.latLng(lat, lng),
            maxTileLevel
        );

        return [-point.y, point.x];
    }

    function mapToAtlasCoords(mapLat, mapLng) {
        const point = L.point(mapLng, Math.abs(mapLat));

        return L.CRS.EPSG3857.pointToLatLng(
            point,
            maxTileLevel
        );
    }

    function resetView() {
        map.setView(
            [-mapSize / 2, mapSize / 2],
            isMobile ? -6 : -5,
            {
                animate: false
            }
        );

        requestAnimationFrame(() => {
            map.invalidateSize({
                pan: false,
                debounceMoveend: true
            });
        });
    }

    function refreshSize() {
        map.invalidateSize({
            pan: false,
            debounceMoveend: true
        });

        map.panInsideBounds(bounds, {
            animate: false
        });
    }

    return {
        map,
        mapSize,
        bounds,
        maxTileLevel,
        atlasToMapCoords,
        mapToAtlasCoords,
        resetView,
        refreshSize
    };
};