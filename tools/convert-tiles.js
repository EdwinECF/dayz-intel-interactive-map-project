#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const DEFAULT_LEVELS = [1, 2, 3, 4, 5, 6, 7];

const SUPPORTED_EXTENSIONS = new Set([
    ".jpg",
    ".jpeg",
    ".png",
    ".webp"
]);

function printHelp() {
    console.log(`
Convert DZ-Atlas source tiles into Leaflet's /{level}/{x}/{y}.ext structure.

Usage:
  node tools/convert-tiles.js [options]

Options:
  --style satellite|topographic
  --input <path>
  --output <path>
  --levels 1,2,3,4,5,6,7
  --clean
  -h, --help

Default satellite input folders:
  raw-tiles/chernarus-satellite-1
  raw-tiles/chernarus-satellite-2
  ...
  raw-tiles/chernarus-satellite-7

Default topographic input folders:
  raw-tiles/chernarus-top-1
  raw-tiles/chernarus-top-2
  ...
  raw-tiles/chernarus-top-7

Accepted flat filenames:
  row_column.jpg
  row-column.png

Accepted folder layout:
  x/y.jpg
`);
}

function parseArguments(argv) {
    const options = {
        style: "satellite",
        levels: [...DEFAULT_LEVELS],
        input: null,
        output: null,
        clean: false
    };

    for (let index = 0; index < argv.length; index += 1) {
        const argument = argv[index];

        if (argument === "--clean") {
            options.clean = true;
            continue;
        }

        if (argument === "--help" || argument === "-h") {
            printHelp();
            process.exit(0);
        }

        const value = argv[index + 1];

        if (!value || value.startsWith("--")) {
            throw new Error(`Missing value for ${argument}`);
        }

        switch (argument) {
            case "--style":
                options.style = value;
                break;

            case "--input":
                options.input = value;
                break;

            case "--output":
                options.output = value;
                break;

            case "--levels":
                options.levels = value
                    .split(",")
                    .map(Number)
                    .filter(level => Number.isInteger(level) && level > 0);
                break;

            default:
                throw new Error(`Unknown argument: ${argument}`);
        }

        index += 1;
    }

    if (options.levels.length === 0) {
        throw new Error("No valid levels were provided.");
    }

    return options;
}

function normalizeStyle(style) {
    const aliases = {
        sat: "satellite",
        satellite: "satellite",
        top: "top",
        topo: "top",
        topographic: "top"
    };

    const normalized = aliases[String(style).toLowerCase()];

    if (!normalized) {
        throw new Error(`Unsupported map style: ${style}`);
    }

    return normalized;
}

function resolveLevelInput(inputOption, style, level) {
    if (!inputOption) {
        return path.join(
            PROJECT_ROOT,
            "raw-tiles",
            `chernarus-${style}-${level}`
        );
    }

    if (inputOption.includes("{level}")) {
        const replacedPath = inputOption.replace(
            /\{level\}/g,
            String(level)
        );

        return path.resolve(PROJECT_ROOT, replacedPath);
    }

    const absoluteInput = path.resolve(PROJECT_ROOT, inputOption);
    const nestedLevel = path.join(absoluteInput, String(level));

    if (fs.existsSync(nestedLevel)) {
        return nestedLevel;
    }

    return absoluteInput;
}

function parseFlatTileName(filename) {
    const extension = path.extname(filename).toLowerCase();

    if (!SUPPORTED_EXTENSIONS.has(extension)) {
        return null;
    }

    const basename = path.basename(filename, extension);
    const match = basename.match(/^(\d+)[_-](\d+)$/);

    if (!match) {
        return null;
    }

    const row = Number(match[1]);
    const column = Number(match[2]);

    return {
        x: column,
        y: row,
        extension: extension === ".jpeg" ? ".jpg" : extension
    };
}

function collectTiles(inputDirectory) {
    const tiles = [];

    const entries = fs.readdirSync(inputDirectory, {
        withFileTypes: true
    });

    for (const entry of entries) {
        const entryPath = path.join(inputDirectory, entry.name);

        if (entry.isFile()) {
            const parsedTile = parseFlatTileName(entry.name);

            if (parsedTile) {
                tiles.push({
                    source: entryPath,
                    ...parsedTile
                });
            }

            continue;
        }

        if (!entry.isDirectory()) {
            continue;
        }

        if (!/^\d+$/.test(entry.name)) {
            continue;
        }

        const x = Number(entry.name);

        const tileFiles = fs.readdirSync(entryPath, {
            withFileTypes: true
        });

        for (const tileFile of tileFiles) {
            if (!tileFile.isFile()) {
                continue;
            }

            const extension = path
                .extname(tileFile.name)
                .toLowerCase();

            if (!SUPPORTED_EXTENSIONS.has(extension)) {
                continue;
            }

            const yName = path.basename(
                tileFile.name,
                extension
            );

            if (!/^\d+$/.test(yName)) {
                continue;
            }

            tiles.push({
                source: path.join(entryPath, tileFile.name),
                x,
                y: Number(yName),
                extension: extension === ".jpeg"
                    ? ".jpg"
                    : extension
            });
        }
    }

    return tiles;
}

function convertLevel(inputDirectory, outputDirectory, clean) {
    if (!fs.existsSync(inputDirectory)) {
        return {
            status: "missing",
            count: 0
        };
    }

    const inputStats = fs.statSync(inputDirectory);

    if (!inputStats.isDirectory()) {
        throw new Error(
            `Input path is not a directory: ${inputDirectory}`
        );
    }

    if (clean && fs.existsSync(outputDirectory)) {
        fs.rmSync(outputDirectory, {
            recursive: true,
            force: true
        });
    }

    fs.mkdirSync(outputDirectory, {
        recursive: true
    });

    const tiles = collectTiles(inputDirectory);

    for (const tile of tiles) {
        const xDirectory = path.join(
            outputDirectory,
            String(tile.x)
        );

        fs.mkdirSync(xDirectory, {
            recursive: true
        });

        const outputFile = path.join(
            xDirectory,
            `${tile.y}${tile.extension}`
        );

        fs.copyFileSync(tile.source, outputFile);
    }

    return {
        status: "converted",
        count: tiles.length
    };
}

function main() {
    const options = parseArguments(
        process.argv.slice(2)
    );

    const style = normalizeStyle(options.style);

    const outputRoot = options.output
        ? path.resolve(PROJECT_ROOT, options.output)
        : path.join(
            PROJECT_ROOT,
            "assets",
            "maps",
            "chernarus",
            style
        );

    let totalConverted = 0;

    for (const level of options.levels) {
        const inputDirectory = resolveLevelInput(
            options.input,
            style,
            level
        );

        const outputDirectory = path.join(
            outputRoot,
            String(level)
        );

        console.log(`Reading level ${level}:`);
        console.log(`  Input:  ${inputDirectory}`);
        console.log(`  Output: ${outputDirectory}`);

        const result = convertLevel(
            inputDirectory,
            outputDirectory,
            options.clean
        );

        if (result.status === "missing") {
            console.warn(
                `  Skipped: input folder was not found.`
            );

            continue;
        }

        console.log(
            `  Converted ${result.count} tiles.`
        );

        totalConverted += result.count;
    }

    if (totalConverted === 0) {
        throw new Error(
            "No tiles were converted. Check that the source folders exist and that the files use row_column or row-column names."
        );
    }

    console.log("");
    console.log(
        `Finished: ${totalConverted} ${style} tiles written to:`
    );
    console.log(outputRoot);
}

try {
    main();
} catch (error) {
    console.error("");
    console.error(
        `Tile conversion failed: ${error.message}`
    );

    process.exitCode = 1;
}