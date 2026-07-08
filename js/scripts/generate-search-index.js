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
        text(marker.name).includes("farm")
};

function createMarkerId(layerId, marker) {
    return `${layerId}-${marker.lat}-${marker.lng}-${marker.objectName || marker.name || ""}`;
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
        const distance = distanceSquared(lat, lng, location.lat, location.lng);

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

function createLayerItems(layerConfig) {
    const fileName = path.basename(layerConfig.file);
    const markers = readJson(fileName);

    const filter =
        filterHandlers[layerConfig.filterType] ||
        filterHandlers.all;

    return markers
        .filter(filter)
        .map(marker => ({
            id: createMarkerId(layerConfig.id, marker),
            name: marker.name || marker.objectName || `${layerConfig.title} Marker`,
            objectName: marker.objectName || "",
            type: layerConfig.title,
            category: marker.group || "unknown",
            group: marker.group || "",
            tier: marker.tier || null,
            tags: marker.tags || [],
            lat: marker.lat,
            lng: marker.lng,
            nearestLocation: findNearestLocation(marker.lat, marker.lng),
            source: fileName,
            layerId: layerConfig.id
        }));
}

const layers = readJson("layers.json");

const searchIndex = [
    ...createLocationItems(),
    ...layers.categories.flatMap(createLayerItems)
];

const outputPath = path.join(dataDir, "search-index.json");

fs.writeFileSync(outputPath, JSON.stringify(searchIndex, null, 2));

console.log(`Generated search-index.json with ${searchIndex.length} items.`);