// ======================================================
// InfoPanel
// Controls the right sidebar details view.
//
// Why this exists:
// Other modules should not know how the sidebar is built.
// They only ask InfoPanel to show or hide details.
// ======================================================

window.InfoPanel = function () {
    const layersPanel = document.getElementById("panel-layers");
    const infoPanel = document.getElementById("panel-info");

    const closeInfoPanel = document.getElementById("close-info-panel");
    const infoTitle = document.getElementById("info-title");
    const infoType = document.getElementById("info-type");
    const infoCoords = document.getElementById("info-coords");

    function showPanel(panelToShow) {
        layersPanel?.classList.remove("active");
        infoPanel?.classList.remove("active");

        panelToShow?.classList.add("active");
    }

    function show(data) {
        if (!infoPanel || !infoTitle || !infoType || !infoCoords) return;

        const title = data.name || data.objectName || "Unknown";
        const type = data.type || data.category || "Unknown";
        const group = data.group || "";
        const tier = data.tier ? `Tier ${data.tier}` : "N/A";
        const nearest = data.nearestLocation || "N/A";

        infoTitle.textContent = title;
        infoType.textContent = group ? `Type: ${type} / ${group}` : `Type: ${type}`;
        infoCoords.textContent = `X: ${Math.round(data.lng || 0)} | Y: ${Math.round(data.lat || 0)}`;

        let extraInfo = document.getElementById("info-extra");

        if (!extraInfo) {
            extraInfo = document.createElement("div");
            extraInfo.id = "info-extra";
            infoCoords.after(extraInfo);
        }

        extraInfo.innerHTML = `
            <p><strong>Nearest:</strong> ${nearest}</p>
            <p><strong>Loot Tier:</strong> ${tier}</p>
            <p><strong>Object:</strong> ${data.objectName || "N/A"}</p>
            <p><strong>Tags:</strong> ${data.tags?.length ? data.tags.join(", ") : "None"}</p>
        `;

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