document.addEventListener("DOMContentLoaded", () => {
    const tileSize = 256;
    const tilesCount = 128;
    const mapSize = tilesCount * tileSize;

    const bounds = [
        [0, 0],
        [mapSize, mapSize]
    ];

    const map = L.map("dayz-map", {
        crs: L.CRS.Simple,
        minZoom: -7,
        maxZoom: 0,
        zoomControl: true,
        maxBounds: bounds,
        maxBoundsViscosity: 1.0
    });

    const DayZTileLayer = L.TileLayer.extend({
        getTileUrl: function (coords) {
            const x = coords.x;
            const y = tilesCount - 1 + coords.y;

            console.log("Leaflet:", coords, "URL tile:", x, y);

            if (x < 0 || x >= tilesCount || y < 0 || y >= tilesCount) {
                return "";
            }

            return `../assets/maps/chernarus/top/7/${x}/${y}.jpg`;
        }
    });

    const tileLayer = new DayZTileLayer("", {
        tileSize: tileSize,
        minZoom: -7,
        maxZoom: 0,
        minNativeZoom: 0,
        maxNativeZoom: 0,
        noWrap: true,
        bounds: bounds
    });

    tileLayer.addTo(map);

    map.setView([mapSize / 2, mapSize / 2], 0);
});