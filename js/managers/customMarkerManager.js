// ======================================================
// CustomMarkerManager
// Handles user-created map markers.
// ======================================================

window.CustomMarkerManager = function ({ map, mapToAtlasCoords, atlasToMapCoords, infoPanel }) {
    const customLayer = L.layerGroup().addTo(map);
    const customMarkers = [];
    const markerMenu = document.getElementById("custom-marker-menu");
    let selectedCustomMarker = null;
    const markerEditorModal = document.getElementById("marker-editor-modal");
    const markerNameInput = document.getElementById("marker-name-input");
    const markerTypeSelect = document.getElementById("marker-type-select");
    const cancelMarkerEdit = document.getElementById("cancel-marker-edit");
    const saveMarkerEdit = document.getElementById("save-marker-edit");

    const markerTypes = {
        regular: {
            title: "Marker",
            icon: "location-dot",
            className: "custom-marker-regular"
        },
        objective: {
            title: "Objective",
            icon: "bullseye",
            className: "custom-marker-objective"
        },
        danger: {
            title: "Danger",
            icon: "triangle-exclamation",
            className: "custom-marker-danger"
        },
        poi: {
            title: "Point of Interest",
            icon: "star",
            className: "custom-marker-poi"
        },
        base: {
            title: "Base",
            icon: "house",
            className: "custom-marker-base"
        },
        stash: {
            title: "Stash",
            icon: "box",
            className: "custom-marker-stash"
        }
    };

    function createIcon(typeConfig) {
        return L.divIcon({
            className: `custom-marker ${typeConfig.className}`,
            html: `<i class="fa-solid fa-${typeConfig.icon}"></i>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
    }

    function updateMarkerType(customMarker, newType) {
        const typeConfig = markerTypes[newType] || markerTypes.regular;

        customMarker.data.name = typeConfig.title;
        customMarker.data.type = "Custom Marker";
        customMarker.data.category = typeConfig.title;
        customMarker.data.objectName = typeConfig.title;
        customMarker.data.markerType = newType;

        customMarker.marker.setIcon(createIcon(typeConfig));

        infoPanel.show(customMarker.data);
    }


    function openMarkerEditor(customMarker) {
        selectedCustomMarker = customMarker;

        if (markerNameInput) {
            markerNameInput.value = customMarker.data.name || "";
        }

        if (markerTypeSelect) {
            markerTypeSelect.value = customMarker.data.markerType || "regular";
        }

        markerEditorModal?.classList.remove("hidden");
    }

    function closeMarkerEditor() {
        markerEditorModal?.classList.add("hidden");
    }

    function saveMarkerEditor() {
        if (!selectedCustomMarker) return;

        const newName = markerNameInput?.value.trim() || "Marker";
        const newType = markerTypeSelect?.value || "regular";

        selectedCustomMarker.data.name = newName;
        selectedCustomMarker.data.objectName = newName;
        selectedCustomMarker.data.markerType = newType;

        updateMarkerType(selectedCustomMarker, newType);

        selectedCustomMarker.data.name = newName;
        selectedCustomMarker.data.objectName = newName;

        infoPanel.show(selectedCustomMarker.data);

        closeMarkerEditor();
    }

    function addMarker(latlng, type = "regular") {
        const typeConfig = markerTypes[type] || markerTypes.regular;
        const atlasCoords = mapToAtlasCoords(latlng.lat, latlng.lng);

        const markerData = {
            id: `custom-${Date.now()}`,
            name: typeConfig.title,
            type: "Custom Marker",
            category: typeConfig.title,
            lat: atlasCoords.lat,
            lng: atlasCoords.lng,
            objectName: typeConfig.title,
            markerType: type,
            tags: ["custom"]
        };

        const marker = L.marker(
            atlasToMapCoords(markerData.lat, markerData.lng),
            {
                icon: createIcon(typeConfig),
                interactive: true,
                draggable: true
            }
        ).addTo(customLayer);

        marker.on("click", () => {
            infoPanel.show(markerData);
        });

        marker.on("contextmenu", event => {
            L.DomEvent.stopPropagation(event);

            selectedCustomMarker = {
                marker,
                data: markerData
            };

            const point = map.latLngToContainerPoint(event.latlng);

            markerMenu.style.left = `${point.x}px`;
            markerMenu.style.top = `${point.y}px`;
            markerMenu.classList.remove("hidden");
        });

        marker.on("dragend", () => {

            const position = marker.getLatLng();

            const atlas = mapToAtlasCoords(position.lat, position.lng);

            markerData.lat = atlas.lat;
            markerData.lng = atlas.lng;

            infoPanel.show(markerData);

        });

        customMarkers.unshift({
            marker,
            data: markerData
        });

        infoPanel.show(markerData);
    }

    markerMenu?.addEventListener("click", event => {
        const button = event.target.closest("button");
        if (!button || !selectedCustomMarker) return;

        const action = button.dataset.action;

        if (action === "edit") {
            openMarkerEditor(selectedCustomMarker);
        }

        if (action === "delete") {
            customLayer.removeLayer(selectedCustomMarker.marker);

            const index = customMarkers.findIndex(
                item => item.data.id === selectedCustomMarker.data.id
            );

            if (index !== -1) {
                customMarkers.splice(index, 1);
            }
        }

        markerMenu.classList.add("hidden");

        if (action === "delete") {
            selectedCustomMarker = null;
        }
    });

    map.on("click", () => {
        markerMenu?.classList.add("hidden");
    });

    cancelMarkerEdit?.addEventListener("click", closeMarkerEditor);
    saveMarkerEdit?.addEventListener("click", saveMarkerEditor);

    markerEditorModal?.addEventListener("click", event => {
        if (event.target === markerEditorModal) {
            closeMarkerEditor();
        }
    });

    return {
        addMarker
    };
};