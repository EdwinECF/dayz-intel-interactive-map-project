const fs = require("fs");

const raw = JSON.parse(
  fs.readFileSync("raw-data/chernarus-1.29-2.json", "utf8")
);

const names = ["chernogorsk", "elektrozavodsk", "berezino"];

raw.markers.locations.forEach(item => {
  const englishName = item.s?.[0];

  if (names.includes(englishName)) {
    console.log(englishName, item.p);
  }
});