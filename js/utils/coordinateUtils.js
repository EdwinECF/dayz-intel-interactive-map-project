// ======================================================
// CoordinateUtils
// Converts marker/location source coords into DayZ coords.
// ======================================================

window.CoordinateUtils = function ({ atlasToMapCoords, mapSize } = {}) {
    const DAYZ_WORLD_SIZE = 15360;

    function formatDayZCoords(item) {
        if (!item || typeof item.lat !== "number" || typeof item.lng !== "number") {
            return "X: N/A | Y: N/A";
        }

        const mapCoords = atlasToMapCoords(item.lat, item.lng);

        const mapY = Math.abs(mapCoords[0]);
        const mapX = mapCoords[1];

        const dayzX = Math.round((mapX / mapSize) * DAYZ_WORLD_SIZE);
        const dayzY = Math.round((mapY / mapSize) * DAYZ_WORLD_SIZE);

        return `X: ${dayzX} | Y: ${dayzY}`;
    }

    return {
        formatDayZCoords
    };
};