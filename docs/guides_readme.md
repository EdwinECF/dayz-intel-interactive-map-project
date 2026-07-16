# DZ-Atlas Modular Guide Database

Generated from the enhanced guide library.

## Contents

- `data/guides/index.json` — lightweight card/search data
- `data/guides/entries/*.json` — one complete file per guide
- `data/guides/categories.json` — category metadata
- `data/guides/sources.json` — source registry
- `data/manifest.json` — all collections and entry paths
- `data/schemas/guide.schema.json` — guide validation schema
- `data/schemas/entity-standard.json` — shared DZ-Atlas entity conventions

## Runtime flow

1. The Guides page fetches `../data/guides/index.json`.
2. It renders cards without downloading full guide bodies.
3. Clicking a card fetches the `file` property, such as:
   `../data/guides/entries/first-30-minutes.json`.
4. The full-screen reader renders that one guide.
5. Relationship IDs are resolved from future item, map, crafting, and weapon databases.

## Counts

- Guides: 38
- Categories: 13
- Featured guides: 7

## Next implementation step

Update `js/pages/guides.js` to load the modular index and create the card library.
Then add the guide reader to `pages/guides.html`.
