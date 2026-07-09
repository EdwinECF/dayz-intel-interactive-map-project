// ======================================================
// SearchService
// Responsible ONLY for searching indexed DZ-Atlas data.
//
// Why this exists:
// Search should not care where the data comes from.
// Today it can search locations.json.
// Later it will search generated search-index.json.
// ======================================================

window.SearchService = function () {
    let searchIndex = [];

    function normalize(value) {
        return String(value || "").toLowerCase().trim();
    }

    function load() {
        return fetch("../data/search-index.json")
            .then(response => response.json())
            .then(items => {
                searchIndex = items;
                console.log(`SearchService loaded ${searchIndex.length} searchable items.`);
            })
            .catch(error => {
                console.error("Failed to load search index", error);
            });
    }

    function getSearchableText(item) {
    return [
        item.name,
        item.localName,
        item.objectName,
        item.type,
        item.category,
        item.group,
        item.nearestLocation,
        ...(item.tags || [])
    ]
        .map(normalize)
        .join(" ");
}

    function getRank(item, term) {
        const name = normalize(item.name);
        const localName = normalize(item.localName);
        const objectName = normalize(item.objectName);
        const type = normalize(item.type);
        const category = normalize(item.category);
        const group = normalize(item.group);
        const nearestLocation = normalize(item.nearestLocation);
        const tags = (item.tags || []).map(normalize);
        const searchableText = getSearchableText(item);

        if (name === term) return 100;
        if (localName === term) return 95;

        if (name.startsWith(term)) return 90;
        if (localName.startsWith(term)) return 85;

        if (name.includes(term)) return 80;
        if (objectName.includes(term)) return 70;

        if (nearestLocation.includes(term)) return 60;

        if (type.includes(term)) return 50;
        if (category.includes(term)) return 45;
        if (group.includes(term)) return 40;

        if (tags.some(tag => tag.includes(term))) return 35;

        if (searchableText.includes(term)) return 10;

        return 0;
    }
    function tokenize(value) {
        return normalize(value)
            .split(/\s+/)
            .filter(Boolean);
    }

    function getSearchableText(item) {
        return [
            item.name,
            item.displayName,
            item.localName,
            item.objectName,
            item.type,
            item.category,
            item.group,
            item.nearestLocation,
            ...(item.tags || [])
        ]
            .map(normalize)
            .join(" ");
    }

    function getLocationScore(item, term) {
        const nearest = normalize(item.nearestLocation);

        if (!nearest || !term) return 0;

        if (nearest === term) return 100;
        if (nearest.includes(term)) return 80;

        const locationTokens = tokenize(nearest);
        const queryTokens = tokenize(term);

        const matches = queryTokens.filter(token =>
            locationTokens.some(locationToken => locationToken.includes(token))
        );

        return matches.length * 20;
    }

    function getContentScore(item, term) {
        const searchableText = getSearchableText(item);

        if (!term) return 0;

        if (normalize(item.name) === term) return 100;
        if (normalize(item.objectName) === term) return 90;
        if (normalize(item.name).includes(term)) return 80;
        if (normalize(item.objectName).includes(term)) return 70;
        if (searchableText.includes(term)) return 50;

        const queryTokens = tokenize(term);

        return queryTokens.reduce((score, token) => {
            return searchableText.includes(token) ? score + 10 : score;
        }, 0);
    }

    function getSmartRank(item, query) {
        const term = normalize(query);
        const tokens = tokenize(query);

        const searchableText = getSearchableText(item);

        if (!term) return 0;

        // Base exact / direct match
        let score = getContentScore(item, term);

        // Token matching
        tokens.forEach(token => {
            if (searchableText.includes(token)) {
                score += 8;
            }
        });

        // Location-aware boost:
        // This helps searches like:
        // "hospital cherno"
        // "water near gorka"
        // "stary sobor hunting stands"
        const nearest = normalize(item.nearestLocation);

        tokens.forEach(token => {
            if (nearest.includes(token)) {
                score += 35;
            }
        });

        // Extra boost when query contains "near"
        if (tokens.includes("near")) {
            const nearIndex = tokens.indexOf("near");
            const possibleLocation = tokens.slice(nearIndex + 1).join(" ");

            score += getLocationScore(item, possibleLocation);
        }

        return score;
    }
    function search(query) {
        const term = normalize(query);

        if (!term) return [];

        return searchIndex
            .map(item => ({
                item,
                rank: getSmartRank(item, query)
            }))
            .filter(result => result.rank > 0)
            .sort((a, b) => b.rank - a.rank)
            .map(result => result.item)
            .slice(0, 10);
    }

    function getAll() {
        return searchIndex;
    }

    return {
        load,
        search,
        getAll
    };
};