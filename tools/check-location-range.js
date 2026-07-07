const fs = require("fs");

const raw = JSON.parse(
  fs.readFileSync("raw-data/chernarus-1.29-2.json", "utf8")
);

const locations = raw.markers.locations;

const xs = locations.map(item => item.p[0]);
const ys = locations.map(item => item.p[1]);

console.log("X min:", Math.min(...xs));
console.log("X max:", Math.max(...xs));
console.log("Y min:", Math.min(...ys));
console.log("Y max:", Math.max(...ys));