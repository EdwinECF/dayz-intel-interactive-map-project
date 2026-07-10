// js/locationManager.js

window.LocationManager = function ({ map, atlasToMapCoords, infoPanel, crosshair }) {
    const locationLabels = [];
    let labelsVisible = localStorage.getItem("dzAtlasCityLabelsVisible") !== "false";

    function loadLocations() {
        fetch("../data/locations.json")
            .then(response => response.json())
            .then(locations => {
                locations.forEach(location => {
                    const label = L.marker(
                        atlasToMapCoords(location.lat, location.lng),
                        {
                            icon: L.divIcon({
                                className: `map-label ${location.size}`,
                                html: `
                                    <span class="label-main">${location.name}</span>
                                    <span class="label-local">${location.localName || ""}</span>
                                `,
                                iconSize: null
                            }),
                            interactive: true
                        }
                    ).addTo(map);

                    locationLabels.push({
                        marker: label,
                        size: location.size
                    });

                    label.on("mouseover", () => {
                        crosshair?.classList.add("crosshair-hover");
                    });

                    label.on("mouseout", () => {
                        crosshair?.classList.remove("crosshair-hover");
                    });

                    label.on("click", () => {
                        infoPanel.show(location);
                    });
                });

                updateVisibility();
            });
    }

    function updateVisibility() {
        const zoom = map.getZoom();

        locationLabels.forEach(item => {
            const shouldShow = labelsVisible && (
                item.size === "major" ||
                (item.size === "medium" && zoom >= -4) ||
                (item.size === "small" && zoom >= -2));

            if (shouldShow && !map.hasLayer(item.marker)) {
                item.marker.addTo(map);
            }

            if (!shouldShow && map.hasLayer(item.marker)) {
                map.removeLayer(item.marker);
            }
        });
    }

    function setLabelsVisible(isVisible) {
        labelsVisible = Boolean(isVisible);
        localStorage.setItem("dzAtlasCityLabelsVisible", String(labelsVisible));
        updateVisibility();
    }

    function areLabelsVisible() { return labelsVisible; }

    function init() {
        loadLocations();
        map.on("zoomend", updateVisibility);
    }

    return {
        init,
        updateVisibility,
        setLabelsVisible,
        areLabelsVisible
    };
};