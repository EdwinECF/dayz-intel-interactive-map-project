// ======================================================
// MarkerManager
// Responsible ONLY for creating Leaflet markers.
//
// Why this exists:
// LayerManager should decide which marker datasets load.
// MarkerManager should decide how individual markers are
// visually created and how they behave when clicked.
// ======================================================
window.MarkerManager = function ({ atlasToMapCoords, infoPanel }) {

    const markerRegistry = new Map();

    function createIcon(className, icon) {
        return L.divIcon({
            className,
            html: `<i class="fa-solid fa-${icon}"></i>`,
            iconSize: null
        });
    }

    function createMarker(marker, config) {
        const leafletMarker = L.marker(
            atlasToMapCoords(marker.lat, marker.lng),
            {
                icon: createIcon(config.className, config.icon),
                interactive: true
            }
        );

        leafletMarker.on("click", () => {
            infoPanel.show({
                ...marker,
                type: config.title
            });
        });

        if (marker.id) {
            markerRegistry.set(marker.id, leafletMarker);
        }
        return leafletMarker;
    }
    function getMarker(markerId) {
        return markerRegistry.get(markerId);
    }

    function hasMarker(markerId) {
        return markerRegistry.has(markerId);
    }

    function flashMarker(markerId) {
        const marker = getMarker(markerId);

        if (!marker) {
            console.warn("Marker not found:", markerId);
            return;
        }

        const element = marker.getElement();

        if (!element) {
            console.warn("Marker element not ready:", markerId);
            return;
        }

        const icon = element.querySelector("i") || element;

        icon.classList.remove("marker-flash");
        void icon.offsetWidth;
        icon.classList.add("marker-flash");

        setTimeout(() => {
            icon.classList.remove("marker-flash");
        }, 1400);
    }

    return {
        createMarker,
        getMarker,
        hasMarker,
        flashMarker
    };
};