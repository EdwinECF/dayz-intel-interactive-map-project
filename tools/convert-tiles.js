const fs = require("fs");
const path = require("path");

const levels = [1, 2, 3, 4, 5, 6];

levels.forEach(level => {
  const inputDir = path.join(__dirname, `../raw-tiles/chernarus-top-${level}`);
  const outputDir = path.join(__dirname, `../assets/maps/chernarus/top/${level}`);

  if (!fs.existsSync(inputDir)) {
    console.log(`Skipping level ${level}: input folder not found`);
    return;
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const files = fs.readdirSync(inputDir).filter(file => file.endsWith(".jpg"));

  files.forEach(file => {
    const [row, columnWithExtension] = file.split("_");
    const column = columnWithExtension.replace(".jpg", "");

    const x = Number(column);
    const y = Number(row);

    const xFolder = path.join(outputDir, x.toString());
    fs.mkdirSync(xFolder, { recursive: true });

    const oldPath = path.join(inputDir, file);
    const newPath = path.join(xFolder, `${y}.jpg`);

    fs.copyFileSync(oldPath, newPath);
  });

  console.log(`Level ${level} converted successfully.`);
});

console.log("All tile levels converted.");
