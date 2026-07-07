const fs = require("fs");

const raw = JSON.parse(
  fs.readFileSync("raw-data/chernarus-1.29-2.json", "utf8")
);

console.log("Top-level keys:", Object.keys(raw));

console.log("\nMarkers keys:");
console.log(Object.keys(raw.markers));

for (const key of Object.keys(raw.markers)) {
  console.log(`\nMARKER GROUP: ${key}`);
  console.log("Type:", Array.isArray(raw.markers[key]) ? "array" : typeof raw.markers[key]);

  if (Array.isArray(raw.markers[key])) {
    console.log("Length:", raw.markers[key].length);
    console.dir(raw.markers[key].slice(0, 5), { depth: null });
  }
}