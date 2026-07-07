const fs = require("fs");

const raw = JSON.parse(
    fs.readFileSync("raw-data/rawdata.json", "utf8")
);

const lootmap = raw.lootmap;
const locations = raw.locations || [];

if (!fs.existsSync("data")) {
    fs.mkdirSync("data");
}

function cleanName(name) {
    return name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-_]/g, "");
}

function saveJson(fileName, data) {
    fs.writeFileSync(
        `data/${fileName}`,
        JSON.stringify(data, null, 2)
    );

    console.log(`Created ${fileName}: ${data.length}`);
}

function extractStaticCategory(category) {
    const markers = [];

    category.types.forEach(type => {
        type.objects.forEach(object => {
            object.positions.forEach((position, index) => {
                markers.push({
                    id: `${cleanName(category.name)}-${cleanName(type.name)}-${object.name}-${index + 1}`,
                    source: "static",
                    category: category.name,
                    group: type.name,
                    name: object.displayName,
                    objectName: object.name,
                    usages: object.usages ?? [],
                    lootCategories: object.categories ?? [],
                    lat: position[0],
                    lng: position[1],
                    tier: position[2] ?? null,
                    tags: position[3] ?? []
                });
            });
        });
    });

    return markers;
}

function extractSimplePositionGroup(groupName, groups) {
    const markers = [];

    groups.forEach(group => {
        group.types.forEach(type => {
            const positions = type.positions || [];

            positions.forEach((position, index) => {
                markers.push({
                    id: `${cleanName(groupName)}-${cleanName(type.name)}-${index + 1}`,
                    source: groupName,
                    category: group.name,
                    group: type.name,
                    name: type.displayName || type.name,
                    objectName: type.name,
                    lat: position[0],
                    lng: position[1],
                    tier: position[2] ?? null,
                    tags: position[3] ?? []
                });
            });
        });
    });

    return markers;
}

function extractAnimals(groups) {
    const markers = [];

    groups.forEach(group => {
        group.types.forEach(type => {
            type.territories.forEach((territory, territoryIndex) => {
                territory.forEach((entry, index) => {
                    markers.push({
                        id: `animal-${cleanName(type.name)}-${territoryIndex + 1}-${index + 1}`,
                        source: "animals",
                        category: group.name,
                        group: type.name,
                        name: type.displayName || type.name,
                        objectName: type.name,
                        lat: entry.position[0],
                        lng: entry.position[1],
                        tier: null,
                        tags: []
                    });
                });
            });
        });
    });

    return markers;
}

function extractAreas(groups) {
    const markers = [];

    groups.forEach(group => {
        group.types.forEach(type => {
            type.objects.forEach((object, index) => {
                const position = object.position;

                if (!position) return;

                markers.push({
                    id: `area-${cleanName(type.name)}-${index + 1}`,
                    source: "areas",
                    category: group.name,
                    group: type.name,
                    name: object.displayName || type.displayName || type.name,
                    objectName: object.name || type.name,
                    lat: position[0],
                    lng: position[1],
                    radius: object.radius ?? null,
                    tier: null,
                    tags: []
                });
            });
        });
    });

    return markers;
}

// =========================
// Static categories
// =========================
if (lootmap.static) {
    lootmap.static.forEach(category => {
        const markers = extractStaticCategory(category);
        saveJson(`markers-${cleanName(category.name)}.json`, markers);
    });
}

// =========================
// Other iZurvive groups
// =========================
if (lootmap.events) {
    saveJson("markers-events.json", extractSimplePositionGroup("events", lootmap.events));
}

if (lootmap.nature) {
    saveJson("markers-nature.json", extractSimplePositionGroup("nature", lootmap.nature));
}

if (lootmap.infected) {
    saveJson("markers-infected.json", extractSimplePositionGroup("infected", lootmap.infected));
}

if (lootmap.animals) {
    saveJson("markers-animals.json", extractAnimals(lootmap.animals));
}

if (lootmap.areas) {
    saveJson("markers-areas.json", extractAreas(lootmap.areas));
}

// =========================
// Location names
// =========================
const cleanLocations = locations.map((location, index) => ({
    id: `location-${index + 1}`,
    name: location.nameEN,
    localName: location.nameRU,
    type: location.type,
    size:
        location.type === "Capital" ? "major" :
        location.type === "City" ? "major" :
        location.type === "Village" ? "medium" :
        "small",
    minZoom: location.minZoom,
    lat: location.lat,
    lng: location.lng,
    spellings: location.spellings ?? []
}));

saveJson("locations.json", cleanLocations);