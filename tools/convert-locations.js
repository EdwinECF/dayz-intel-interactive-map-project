const fs = require("fs");
const minX = -234.7006673;
const maxX = -1.8241699;
const minY = 1.4138667;
const maxY = 250.3333333;
const worldSize = 15360;

function convertX(xamX, xamY) {
    return Math.round(
        0.33080283 * xamX +
        57.75097774 * xamY +
        10.26833605
    );
}

function convertY(xamX, xamY) {
    return Math.round(
        -56.43754565 * xamX +
        -2.51903184 * xamY +
        861.97847127
    );
}

const raw = JSON.parse(
  fs.readFileSync("raw-data/chernarus-1.29-2.json", "utf8")
);

const locations = raw.markers.locations.map((item, index) => {
  const typeMap = {
    capital: "Capital",
    city: "City",
    village: "Village",
    local: "Local"
  };

  const sizeMap = {
    capital: "major",
    city: "major",
    village: "medium",
    local: "small"
  };

  return {
    id: index + 1,
    name: item.s?.[0] || "Unknown",
    localName: item.s?.[1] || "",
    type: typeMap[item.w] || item.w || "Location",
    size: sizeMap[item.w] || "small",
    dayzX: convertX(item.p[0], item.p[1]),
    dayzY: convertY(item.p[0], item.p[1])
  };
});

fs.writeFileSync(
  "data/locations.json",
  JSON.stringify(locations, null, 2)
);

console.log(`Created ${locations.length} locations.`);