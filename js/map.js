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
    
    const crosshair = document.getElementById("map-crosshair");
    const coordinateTooltip = document.getElementById("coordinate-tooltip");
    map.on("mousemove", function (event) {
    const x = Math.round(event.latlng.lng);
    const y = Math.round(Math.abs(event.latlng.lat));

    coordinateTooltip.style.display = "block";
    coordinateTooltip.style.left = `${event.originalEvent.offsetX}px`;
    coordinateTooltip.style.top = `${event.originalEvent.offsetY}px`;
    coordinateTooltip.textContent = `X: ${x} | Y: ${y}`;
    
    crosshair.style.display = "block";
    crosshair.style.left = `${event.originalEvent.offsetX}px`;
    crosshair.style.top = `${event.originalEvent.offsetY}px`;
    });
    
    map.on("mouseout", function () {
        coordinateTooltip.style.display = "none";
        crosshair.style.display = "none";
    });


    fetch("../data/locations.json")
    .then(response => response.json())
    .then(locations => {
        locations.forEach(location => {
            const label = L.marker([-location.y, location.x], {
                icon: L.divIcon({
                    className: `map-label ${location.size}`,
                    html: location.name,
                    iconSize: null
                })
            }).addTo(map);
        });
    })

    .catch(error => console.error("Error loading locations:", error));

    map.setView([-mapSize / 2, mapSize / 2], -7);

    setTimeout(() => {
        map.invalidateSize();
    }, 100);
});