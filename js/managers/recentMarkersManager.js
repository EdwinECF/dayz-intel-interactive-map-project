// ======================================================
// RecentMarkersManager
// Tracks recently viewed map items.
//
// Why this exists:
// InfoPanel should only display details.
// Recent marker history belongs in its own manager.
// ======================================================

window.RecentMarkersManager = function ({ onSelect, onToggleVisibility } = {}) {
    const recentList = document.getElementById("recent-markers-list");
    const maxItems = 5;

    const recentItems = [];

    function getItemId(item) {
        return item.id || `${item.name}-${item.lat}-${item.lng}`;
    }

    function add(item) {
        if (!item || !item.lat || !item.lng) return;

        const itemId = getItemId(item);

        const existingIndex = recentItems.findIndex(
            recentItem => getItemId(recentItem) === itemId
        );

        if (existingIndex !== -1) {
            recentItems.splice(existingIndex, 1);
        }

        recentItems.unshift(item);

        if (recentItems.length > maxItems) {
            recentItems.pop();
        }

        render();
    }

    function render() {
        if (!recentList) return;

        recentList.innerHTML = "";

        if (!recentItems.length) {
            recentList.innerHTML = `
                <div class="sidebar-mini-item">
                    <i class="fa-solid fa-location-dot"></i>
                    <div>
                        <strong>No markers yet</strong>
                        <span>Recently viewed locations will appear here.</span>
                    </div>
                </div>
            `;
            return;
        }

        recentItems.forEach(item => {

            const button = document.createElement("button");
            button.className = "recent-marker-item";

            button.innerHTML = `
                <i class="fa-solid fa-location-dot"></i>

                <div class="recent-marker-text">
                    <strong>${item.displayName || item.name || item.objectName || "Unknown"}</strong>
                    <span>${item.type || item.category || "Location"}</span>
                </div>

                <span class="recent-marker-visibility">
                    <i class="fa-solid ${item.hidden ? "fa-eye-slash" : "fa-eye"}"></i>
                </span>
            `;

            const visibilityButton = button.querySelector(".recent-marker-visibility");

            visibilityButton?.addEventListener("click", event => {
                event.stopPropagation();

                item.hidden = !item.hidden;

                onToggleVisibility?.(item);

                render();
            });
            button.addEventListener("click", () => {
                onSelect?.(item);
            });

            recentList.appendChild(button);

        });
    }

    render();

    return {
        add
    };
};