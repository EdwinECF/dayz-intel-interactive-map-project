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

    function search(query) {
        const term = normalize(query);

        if (!term) return [];

        return searchIndex
            .filter(item => {
                const searchableText = [
                    item.name,
                    item.localName,
                    item.objectName,
                    item.type,
                    item.category,
                    item.group,
                    ...(item.tags || [])
                ]
                    .map(normalize)
                    .join(" ");

                return searchableText.includes(term);
            })
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