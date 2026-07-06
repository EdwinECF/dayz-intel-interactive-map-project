document.addEventListener("DOMContentLoaded", () => {
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
        minZoom: -6,
        maxZoom: 0,
        zoomControl: true,
        maxBounds: bounds,
        maxBoundsViscosity: 1.0
    });

    const DayZTileLayer = L.TileLayer.extend({
        getTileUrl: function (coords) {
            const leafletZoom = coords.z;
            const tileLevel = maxTileLevel + leafletZoom;
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

    const tileLayer = new DayZTileLayer("", {
        tileSize: tileSize,
        minZoom: -6,
        maxZoom: 0,
        noWrap: true,
        bounds: bounds
    });

    tileLayer.addTo(map);

    map.setView([-mapSize / 2, mapSize / 2], -3);

    setTimeout(() => {
        map.invalidateSize();
    }, 100);
});