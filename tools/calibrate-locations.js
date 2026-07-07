const fs = require("fs");

const raw = JSON.parse(
  fs.readFileSync("raw-data/chernarus-1.29-2.json", "utf8")
);

const anchors = [
  { name: "tisy", x: 3300, y: 1100 },
  { name: "north-west airfield", x: 4314, y: 5487 },
  { name: "svetlojarsk", x: 13448, y: 2485 },
  { name: "stary sobor", x: 5900, y: 7900 },
  { name: "vybor", x: 3677, y: 6796 },
  { name: "zelenogorsk", x: 2563, y: 10351 },
  { name: "pavlovo", x: 1625, y: 11680 },
  { name: "elektrozavodsk", x: 9800, y: 13100 },
  { name: "chernogorsk", x: 6500, y: 12500 }
];

function findLocation(name) {
  return raw.markers.locations.find(item => item.s?.[0] === name);
}

anchors.forEach(anchor => {
  const item = findLocation(anchor.name);

  if (!item) {
    console.log("NOT FOUND:", anchor.name);
    return;
  }

  console.log({
    name: anchor.name,
    xamX: item.p[0],
    xamY: item.p[1],
    targetX: anchor.x,
    targetY: anchor.y
  });
});