const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "../../data");

function readJson(fileName) {
    const filePath = path.join(dataDir, fileName);
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function slugify(value) {
    return String(value || "")
        .toLowerCase()
        .trim()
        .replaceAll(" ", "-")
        .replace(/[^a-z0-9-_]/g, "");
}
function distanceSquared(aLat, aLng, bLat, bLng) {
    const dx = aLat - bLat;
    const dy = aLng - bLng;

    return dx * dx + dy * dy;
}

const locations = readJson("locations.json");

function findNearestLocation(lat, lng) {
    let nearest = null;
    let nearestDistance = Number.MAX_VALUE;

    for (const location of locations) {
        const distance = distanceSquared(
            lat,
            lng,
            location.lat,
            location.lng
        );

        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearest = location;
        }
    }

    return nearest?.name || "";
}

function createLocationItems() {
    return locations.map(location => ({
        id: `location-${slugify(location.name)}`,
        name: location.name,
        localName: location.localName || "",
        type: "location",
        category: location.size || "unknown",
        lat: location.lat,
        lng: location.lng,
        source: "locations",
        nearestLocation: location.name
    }));
}

function createMarkerItems(fileName, type, layerId) {
    const markers = readJson(fileName);

    return markers.map((marker, index) => ({
        id: `${layerId}-${index}`,
        name: marker.name || marker.objectName || `${type} Marker`,
        objectName: marker.objectName || "",
        type,
        category: marker.group || "unknown",
        group: marker.group || "",
        tier: marker.tier || null,
        tags: marker.tags || [],
        lat: marker.lat,
        lng: marker.lng,
        nearestLocation: findNearestLocation(
            marker.lat,
            marker.lng
        ),
        source: fileName,
        layerId
    }));
}

const searchIndex = [
    ...createLocationItems(),

    ...createMarkerItems("markers-medical.json", "medical", "medical"),
    ...createMarkerItems("markers-military.json", "military", "military"),
    ...createMarkerItems("markers-urban.json", "urban", "urban"),
    ...createMarkerItems("markers-industrial.json", "industrial", "industrial"),
    ...createMarkerItems("markers-rural.json", "rural", "rural"),
    ...createMarkerItems("markers-landmark.json", "landmark", "landmark"),
    ...createMarkerItems("markers-areas.json", "area", "areas")
];

const outputPath = path.join(dataDir, "search-index.json");

fs.writeFileSync(outputPath, JSON.stringify(searchIndex, null, 2));

console.log(`Generated search-index.json with ${searchIndex.length} items.`);