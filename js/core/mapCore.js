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
        initialize(style, options) {
            this.style = style;
            L.TileLayer.prototype.initialize.call(this, "", options);
        },

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

            return `../assets/maps/chernarus/${this.style}/${tileLevel}/${x}/${y}.jpg`;
        }
    });

    const tileLayerOptions = {
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
    };

    const mapStyles = {
        satellite: new DayZTileLayer("satellite", tileLayerOptions),
        top: new DayZTileLayer("top", tileLayerOptions)
    };

    let activeMapStyle = "satellite";
    mapStyles[activeMapStyle].addTo(map);

    const MapStyleControl = L.Control.extend({
    options: {
        position: "topleft"
    },

    onAdd() {
        const container = L.DomUtil.create(
            "div",
            "leaflet-control map-style-control"
        );

        const toggle = L.DomUtil.create(
            "button",
            "map-style-toggle",
            container
        );

        toggle.type = "button";
        toggle.setAttribute("aria-label", "Change map style");
        toggle.setAttribute("aria-expanded", "false");

        const menu = L.DomUtil.create(
            "div",
            "map-style-menu",
            container
        );

        const styles = [
            {
                id: "satellite",
                label: "Satellite",
                preview: "../assets/maps/chernarus/satellite/4/8/8.jpg"
            },
            {
                id: "top",
                label: "Topographic",
                preview: "../assets/maps/chernarus/top/4/8/8.jpg"
            }
        ];

        function updateControl(activeStyle) {
            const active = styles.find(style => style.id === activeStyle);

            toggle.innerHTML = `
                <span
                    class="map-style-preview"
                    style="background-image: url('${active.preview}')"
                    aria-hidden="true"
                ></span>

                <span class="map-style-arrow" aria-hidden="true">
                    ▾
                </span>
            `;

            menu.innerHTML = "";

            styles
                .filter(style => style.id !== activeStyle)
                .forEach(style => {
                    const button = L.DomUtil.create(
                        "button",
                        "map-style-option",
                        menu
                    );

                    button.type = "button";
                    button.title = style.label;
                    button.setAttribute(
                        "aria-label",
                        `Use ${style.label} map`
                    );

                    button.innerHTML = `
                        <span
                            class="map-style-preview"
                            style="background-image: url('${style.preview}')"
                            aria-hidden="true"
                        ></span>
                    `;

                    L.DomEvent.on(button, "click", event => {
                        L.DomEvent.stop(event);

                        setMapStyle(style.id);
                        updateControl(style.id);

                        container.classList.remove("open");
                        toggle.setAttribute("aria-expanded", "false");
                    });
                });
        }

        L.DomEvent.on(toggle, "click", event => {
            L.DomEvent.stop(event);

            const isOpen = container.classList.toggle("open");

            toggle.setAttribute(
                "aria-expanded",
                String(isOpen)
            );
        });

        updateControl("satellite");

        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);

        return container;
    }
});

    function updateMapStyleControl() {
        document.querySelectorAll(".map-style-btn").forEach(button => {
            const isActive = button.dataset.mapStyle === activeMapStyle;
            button.classList.toggle("active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
        });

        const mapContainer = document.querySelector(".map-container");
        if (mapContainer) {
            mapContainer.dataset.mapStyle = activeMapStyle;
        }
    }

    function setMapStyle(style) {
        if (!mapStyles[style] || style === activeMapStyle) {
            return;
        }

        map.removeLayer(mapStyles[activeMapStyle]);
        activeMapStyle = style;
        mapStyles[activeMapStyle].addTo(map);
        updateMapStyleControl();
    }

    new MapStyleControl().addTo(map);
    updateMapStyleControl();

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
        refreshSize,
        setMapStyle,
        getMapStyle: () => activeMapStyle
    };
};