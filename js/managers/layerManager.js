// js/layerManager.js

window.LayerManager = function ({ map, markerManager }) {
    const markerLayers = {};
    const markerCache = {};

    function createMarkerId(layerId, marker) {
        return `${layerId}-${marker.lat}-${marker.lng}-${marker.objectName || marker.name || ""}`;
    }
    function text(value) {
            return String(value || "").toLowerCase();
        }

        const filterHandlers = {
            all: () => true,

            water: marker =>
                text(marker.objectName).includes("well_pump") ||
                text(marker.objectName).includes("water") ||
                text(marker.name).includes("water"),

            police: marker =>
                text(marker.group) === "policestation" ||
                text(marker.objectName).includes("police") ||
                text(marker.name).includes("police"),

            hunting: marker =>
                text(marker.group).includes("deer") ||
                text(marker.group).includes("hunting") ||
                text(marker.objectName).includes("hunting") ||
                text(marker.objectName).includes("deerstand") ||
                text(marker.objectName).includes("feedshack") ||
                text(marker.name).includes("hunting"),

            farm: marker =>
                text(marker.group).includes("farm") ||
                text(marker.objectName).includes("farm") ||
                text(marker.name).includes("farm")
        };

    function loadLayer(config) {
        if (!markerLayers[config.id]) {
            markerLayers[config.id] = L.layerGroup();
        }

        if (markerCache[config.id]) {
            markerLayers[config.id].addTo(map);
            return;
        }

        fetch(config.file)
            .then(response => response.json())
            .then(markers => {
                const filter =
                    filterHandlers[config.filterType] ||
                    filterHandlers.all;

                markers
                    .filter(filter)
                    .forEach(marker => {
                        const markerId = createMarkerId(config.id, marker);

                        markerManager
                            .createMarker(
                                {
                                    ...marker,
                                    id: markerId
                                },
                                config
                            )
                            .addTo(markerLayers[config.id]);
                    });

                markerCache[config.id] = true;
                markerLayers[config.id].addTo(map);
            })
            .catch(error => {
                console.error(`Failed to load layer: ${config.id}`, error);
            });
    }

    function unloadLayer(layerId) {
        const layer = markerLayers[layerId];

        if (layer && map.hasLayer(layer)) {
            map.removeLayer(layer);
        }
    }

    function buildLayerButton(config) {
        const layerList = document.getElementById("layer-list");
        if (!layerList) return;

        const button = document.createElement("button");

        button.dataset.layer = config.id;
        button.innerHTML = `
            <i class="fa-solid fa-${config.icon}"></i>
            ${config.title}
        `;

        if (config.default) {
            button.classList.add("active");
            loadLayer(config);
        }

        button.addEventListener("click", () => {
            const isActive = button.classList.toggle("active");

            if (isActive) {
                loadLayer(config);
            } else {
                unloadLayer(config.id);
            }
        });

        layerList.appendChild(button);
    }

    function loadLayerCatalog() {
        fetch("../data/layers.json")
            .then(response => response.json())
            .then(layerData => {
                layerData.categories.forEach(buildLayerButton);
            })
            .catch(error => {
                console.error("Failed to load layers.json", error);
            });
    }

    function enableLayer(layerId) {
        fetch("../data/layers.json")
            .then(response => response.json())
            .then(layerData => {
                const config = layerData.categories.find(layer => layer.id === layerId);

                if (!config) {
                    console.warn(`Layer not found: ${layerId}`);
                    return;
                }

                loadLayer(config);

                const button = document.querySelector(`[data-layer="${layerId}"]`);
                button?.classList.add("active");
            })
            .catch(error => {
                console.error("Failed to enable layer", error);
            });
    }

    return {
        loadLayerCatalog,
        loadLayer,
        unloadLayer,
        enableLayer
    };
};