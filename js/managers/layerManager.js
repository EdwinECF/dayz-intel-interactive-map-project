// js/layerManager.js

window.LayerManager = function ({ map, markerManager }) {
    const markerLayers = {};
    const markerCache = {};
    const layerConfigs = new Map();

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
                text(marker.name).includes("farm"),

            cow: marker =>
                text(marker.group).includes("cow") ||
                text(marker.objectName).includes("cow") ||
                text(marker.name).includes("cow"),

            chicken: marker =>
                text(marker.group).includes("hen") ||
                text(marker.objectName).includes("hen") ||
                text(marker.name).includes("hen"),

            rabbit: marker =>
                text(marker.group).includes("hare") ||
                text(marker.objectName).includes("hare") ||
                text(marker.name).includes("hare"),

            deer: marker =>
                text(marker.group).includes("deer") ||
                text(marker.objectName).includes("deer") ||
                text(marker.name).includes("deer"),

            boar: marker =>
                text(marker.group).includes("boar") ||
                text(marker.objectName).includes("boar") ||
                text(marker.name).includes("boar"),

            wolf: marker =>
                text(marker.group).includes("wolf") ||
                text(marker.objectName).includes("wolf") ||
                text(marker.name).includes("wolf"),

            bear: marker =>
                text(marker.group).includes("bear") ||
                text(marker.objectName).includes("bear") ||
                text(marker.name).includes("bear"),

            goat: marker =>
                text(marker.group).includes("goat") ||
                text(marker.group).includes("sheep") ||
                text(marker.objectName).includes("goat") ||
                text(marker.objectName).includes("sheep") ||
                text(marker.name).includes("goat") ||
                text(marker.name).includes("sheep")
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
        function buildLayerGroup(groupConfig) {
            const layerList = document.getElementById("layer-list");
            if (!layerList) return;

            const group = document.createElement("div");
            group.className = "layer-group";

            const header = document.createElement("button");
            header.className = "layer-group-header";

            header.innerHTML = `
                <span>
                    <i class="fa-solid fa-${groupConfig.icon}"></i>
                    ${groupConfig.title}
                </span>
                <i class="fa-solid fa-chevron-down"></i>
            `;

            const children = document.createElement("div");
            children.className = "layer-group-children";

            groupConfig.children.forEach(childConfig => {
                layerConfigs.set(childConfig.id, childConfig);

                const childButton = buildLayerButton(childConfig, true);
                children.appendChild(childButton);
            });

            // Start all groups closed by default
            group.classList.add("collapsed");

            header.addEventListener("click", () => {
                const isOpening = group.classList.contains("collapsed");

                document.querySelectorAll(".layer-group").forEach(otherGroup => {
                    otherGroup.classList.add("collapsed");
                });

                if (isOpening) {
                    group.classList.remove("collapsed");
                }

                setTimeout(() => {
                    map.invalidateSize();
                }, 150);
            });

            group.appendChild(header);
            group.appendChild(children);

            layerList.appendChild(group);
        }
        function buildLayerButton(config, returnButton = false) {
        const layerList = document.getElementById("layer-list");

        const button = document.createElement("button");

        button.dataset.layer = config.id;
        button.className = "layer-button";

        button.innerHTML = `
            <i class="fa-solid fa-${config.icon}"></i>
            <span>${config.title}</span>
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

        if (returnButton) {
            return button;
        }

        if (layerList) {
            layerList.appendChild(button);
        }

        return button;
    }

    function loadLayerCatalog() {
        fetch("../data/layers.json")
            .then(response => response.json())
            .then(layerData => {
                layerData.categories.forEach(category => {
                    if (category.type === "group") {
                        buildLayerGroup(category);
                        return;
                    }

                    layerConfigs.set(category.id, category);
                    buildLayerButton(category);
                });
            })
            .catch(error => {
                console.error("Failed to load layers.json", error);
            });
    }
    function enableLayer(layerId) {
        const config = getLayerConfig(layerId);

        if (!config) {
            console.warn(`Layer not found: ${layerId}`);
            return;
        }

        loadLayer(config);

        const button = document.querySelector(`[data-layer="${layerId}"]`);
        button?.classList.add("active");
        }

    function getLayerConfig(layerId) {
        return layerConfigs.get(layerId);
    }

    return {
        loadLayerCatalog,
        loadLayer,
        unloadLayer,
        enableLayer,
        getLayerConfig
    };
};