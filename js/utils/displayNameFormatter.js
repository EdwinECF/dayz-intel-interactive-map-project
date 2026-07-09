// ======================================================
// DisplayNameFormatter
// Converts raw game/object names into user-friendly names.
// ======================================================

window.DisplayNameFormatter = function () {
    function cleanObjectName(value) {
        return String(value || "")
            .replaceAll("_", " ")
            .replace(/\bland\b/gi, "")
            .replace(/\bmisc\b/gi, "")
            .replace(/\bcity\b/gi, "City")
            .replace(/\s+/g, " ")
            .trim();
    }
    
    function format(item) {
        const nearest = item.nearestLocation || item.name || "Unknown Area";
        const rawName = item.objectName || item.name || "";
        const cleaned = cleanObjectName(rawName);
        
        if (!item.objectName && item.name) {
            return item.name;
        }

        if (item.type === "Custom Marker") {
            return item.name || item.objectName || "Custom Marker";
        }

        if (!cleaned) return nearest;

        if (item.type?.toLowerCase().includes("medical")) {
            return `${nearest} ${cleaned}`;
        }

        if (item.type?.toLowerCase().includes("water")) {
            return `${nearest} Water Pump`;
        }

        if (item.type?.toLowerCase().includes("hunting")) {
            return `Near ${nearest} Hunting Stand`;
        }

        if (item.type?.toLowerCase().includes("police")) {
            return `${nearest} Police Station`;
        }

        return `${nearest} ${cleaned}`;
    }

    return {
        format
    };
};