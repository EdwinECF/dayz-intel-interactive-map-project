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

        return leafletMarker;
    }

    return {
        createMarker
    };
};