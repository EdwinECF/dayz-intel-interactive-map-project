// js/layerManager.js

window.LayerManager = function ({ map, markerManager }) {
    const markerLayers = {};
    const markerCache = {};

    const filterHandlers = {
        all: () => true,

        water: marker =>
            marker.objectName.includes("well_pump") ||
            marker.objectName.includes("water"),

        police: marker =>
            marker.group === "PoliceStation" ||
            marker.objectName.toLowerCase().includes("police"),

        hunting: marker =>
            marker.group.toLowerCase().includes("deer") ||
            marker.group.toLowerCase().includes("hunting") ||
            marker.objectName.toLowerCase().includes("hunting"),

        farm: marker =>
            marker.group.toLowerCase().includes("farm") ||
            marker.objectName.toLowerCase().includes("farm")
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
                        markerManager.createMarker(marker, config).addTo(markerLayers[config.id]);
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

    return {
        loadLayerCatalog,
        loadLayer,
        unloadLayer
    };
};