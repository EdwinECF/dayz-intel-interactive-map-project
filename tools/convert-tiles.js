const fs = require("fs");
const path = require("path");

const inputDir = path.join(__dirname, "../raw-tiles/chernarus-top-7");
const outputDir = path.join(__dirname, "../assets/maps/chernarus/top/7");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
console.log(inputDir);
console.log(outputDir);

const files = fs.readdirSync(inputDir).filter(file => file.endsWith(".jpg"));

files.forEach(file => {
  const [row, columnWithExtension] = file.split("_");
  const column = columnWithExtension.replace(".jpg", "");

  const x = Number(column);
  const y = Number(row);

  const xFolder = path.join(outputDir, x.toString());

  if (!fs.existsSync(xFolder)) {
    fs.mkdirSync(xFolder, { recursive: true });
  }

  const oldPath = path.join(inputDir, file);
  const newPath = path.join(xFolder, `${y}.jpg`);

  fs.copyFileSync(oldPath, newPath);
});

console.log("Tiles converted successfully.");