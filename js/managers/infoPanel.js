// ======================================================
// InfoPanel
// Controls the right sidebar details view.
// ======================================================

window.InfoPanel = function ({
    recentMarkersManager,
    displayNameFormatter,
    coordinateUtils
} = {}) {
    const layersPanel = document.getElementById("panel-layers");
    const infoPanel = document.getElementById("panel-info");
    const recentMarkersWidget = document.getElementById("recent-markers-widget");
    const weatherWidget = document.getElementById("weather-widget");

    const closeInfoPanel = document.getElementById("close-info-panel");
    const infoTitle = document.getElementById("info-title");
    const infoType = document.getElementById("info-type");
    const infoCoords = document.getElementById("info-coords");

    function showPanel(panelToShow) {
        layersPanel?.classList.remove("active");
        infoPanel?.classList.remove("active");

        recentMarkersWidget?.classList.toggle("hidden", panelToShow === infoPanel);
        weatherWidget?.classList.toggle("hidden", panelToShow === infoPanel);

        panelToShow?.classList.add("active");
    }

    function show(data) {
        if (!data || !infoPanel || !infoTitle || !infoType || !infoCoords) return;

        const title =
            data.displayName ||
            displayNameFormatter?.format(data) ||
            data.name ||
            data.objectName ||
            "Unknown";

        const type = data.type || data.category || "Unknown";
        const group = data.group || "";
        const tier = data.tier ? `Tier ${data.tier}` : "N/A";
        const nearest = data.nearestLocation || "N/A";

        infoTitle.textContent = title;
        infoType.textContent = group ? `Type: ${type} / ${group}` : `Type: ${type}`;

        infoCoords.textContent = coordinateUtils
            ? coordinateUtils.formatDayZCoords(data)
            : `X: ${Math.round(data.lng || 0)} | Y: ${Math.round(data.lat || 0)}`;

        let extraInfo = document.getElementById("info-extra");

        if (!extraInfo) {
            extraInfo = document.createElement("div");
            extraInfo.id = "info-extra";
            infoCoords.after(extraInfo);
        }

        if (data.routeInfo) {
            extraInfo.innerHTML = `
                <p><strong>Route Distance:</strong> ${data.routeInfo.distance}</p>
                <p><strong>Walking:</strong> ${data.routeInfo.walking}</p>
                <p><strong>Jogging:</strong> ${data.routeInfo.jogging}</p>
                <p><strong>Sprinting:</strong> ${data.routeInfo.sprinting}</p>
            `;

            if (!data.skipRecent) {
                recentMarkersManager?.add({
                    ...data,
                    displayName: title
                });
            }

            showPanel(infoPanel);
            return;
        }

        extraInfo.innerHTML = `
            <p><strong>Nearest:</strong> ${nearest}</p>
            <p><strong>Loot Tier:</strong> ${tier}</p>
            <p><strong>Object:</strong> ${data.objectName || "N/A"}</p>
            <p><strong>Tags:</strong> ${data.tags?.length ? data.tags.join(", ") : "None"}</p>
        `;

        if (!data.skipRecent) {
            recentMarkersManager?.add({
                ...data,
                displayName: title
            });
        }

        showPanel(infoPanel);
    }

    function hide() {
        showPanel(layersPanel);
    }

    closeInfoPanel?.addEventListener("click", hide);

    return {
        show,
        hide
    };
};