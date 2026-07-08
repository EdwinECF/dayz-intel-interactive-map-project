// js/infoPanel.js

window.InfoPanel = function () {
    const sidePanel = document.getElementById("map-side-panel");
    const closeInfoPanel = document.getElementById("close-info-panel");
    const infoTitle = document.getElementById("info-title");
    const infoType = document.getElementById("info-type");
    const infoCoords = document.getElementById("info-coords");

    function show(data) {
        if (!sidePanel || !infoTitle || !infoType || !infoCoords) return;

        const title = data.name || data.objectName || "Unknown";
        const type = data.type || data.category || "Unknown";
        const group = data.group || "";
        const tier = data.tier ? `Tier ${data.tier}` : "N/A";

        infoTitle.textContent = title;
        infoType.textContent = group ? `Type: ${type} / ${group}` : `Type: ${type}`;
        infoCoords.textContent = `Lat: ${data.lat?.toFixed(5)} | Lng: ${data.lng?.toFixed(5)}`;

        let extraInfo = document.getElementById("info-extra");

        if (!extraInfo) {
            extraInfo = document.createElement("div");
            extraInfo.id = "info-extra";
            infoCoords.after(extraInfo);
        }

        extraInfo.innerHTML = `
            <p><strong>Loot Tier:</strong> ${tier}</p>
            <p><strong>Object:</strong> ${data.objectName || "N/A"}</p>
            <p><strong>Tags:</strong> ${data.tags?.length ? data.tags.join(", ") : "None"}</p>
        `;

        sidePanel.classList.add("show-info");
    }

    function hide() {
        sidePanel?.classList.remove("show-info");
    }

    closeInfoPanel?.addEventListener("click", hide);

    return {
        show,
        hide
    };
};