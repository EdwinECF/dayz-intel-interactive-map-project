// ======================================================
// MapCore
// Only responsible for:
// - creating the Leaflet map
// - loading map tiles
// - converting DZ-Atlas source coordinates to map pixels
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
        noWrap: true,
        bounds
    }).addTo(map);

    // Converts DZ-Atlas source coordinates into this map's CRS.Simple coordinates
    function atlasToMapCoords(lat, lng) {
        const point = L.CRS.EPSG3857.latLngToPoint(
            L.latLng(lat, lng),
            maxTileLevel
        );

        return [-point.y, point.x];
    }

    // Converts this map's CRS.Simple coordinates back into DZ-Atlas source coordinates
    function mapToAtlasCoords(mapLat, mapLng) {
        const point = L.point(mapLng, Math.abs(mapLat));
        return L.CRS.EPSG3857.pointToLatLng(point, maxTileLevel);
    }

    function resetView() {
        map.setView([-mapSize / 2, mapSize / 2], -5);

        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }

    return {
        map,
        mapSize,
        bounds,
        maxTileLevel,
        atlasToMapCoords,
        mapToAtlasCoords,
        resetView
    };
};