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

    function search(query) {
        const term = normalize(query);

        if (!term) return [];

        return searchIndex
            .map(item => ({
                item,
                rank: getRank(item, term)
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