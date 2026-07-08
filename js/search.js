// ======================================================
// SearchManager
// Handles all search functionality for DZ-Atlas.
// ======================================================

window.SearchManager = function () {

    let searchIndex = [];

    async function initialize() {
        console.log("Initializing Search Manager...");

        await loadSearchIndex();

        console.log(`Loaded ${searchIndex.length} searchable items.`);
    }

    async function loadSearchIndex() {
        try {
            const response = await fetch("../data/search-index.json");
            searchIndex = await response.json();
        } catch (error) {
            console.warn("Search index not found yet.");
        }
    }

    function search(query) {

        query = query.toLowerCase().trim();

        if (!query) return [];

        return searchIndex.filter(item =>
            item.name.toLowerCase().includes(query)
        );
    }

    return {
        initialize,
        search
    };

};