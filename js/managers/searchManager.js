// ======================================================
// SearchManager
// Connects the search input to SearchService and the map.
//
// Why this exists:
// SearchService knows how to find data.
// SearchManager knows how the user interacts with search.
// ======================================================

window.SearchManager = function ({
    map,
    atlasToMapCoords,
    searchService,
    infoPanel
}) {
    const input = document.getElementById("map-search-input");
    const resultsContainer = document.getElementById("map-search-results");

    function clearResults() {
        if (resultsContainer) {
            resultsContainer.innerHTML = "";
        }
    }

    function renderResults(results) {
        clearResults();

        if (!resultsContainer || !results.length) return;

        results.forEach(result => {
            const item = document.createElement("button");
            item.className = "search-result-item";

            item.innerHTML = `
                <span class="search-result-name">${result.name}</span>

                <span class="search-result-type">
                    ${result.type}
                    ${result.nearestLocation ? ` • Near ${result.nearestLocation}` : ""}
                </span>
            `;

            item.addEventListener("click", () => {
                selectResult(result);
            });

            resultsContainer.appendChild(item);
        });
    }

    function selectResult(result) {
        if (!result.lat || !result.lng) return;

        const coords = atlasToMapCoords(result.lat, result.lng);

        map.flyTo(coords, -2, {
            duration: 0.75
        });

        infoPanel.show(result);

        clearResults();

        if (input) {
            input.value = result.name;
        }
    }

    function handleInput(event) {
        const query = event.target.value;
        const results = searchService.search(query);

        renderResults(results);
    }

    function init() {
        if (!input || !resultsContainer) return;

        input.addEventListener("input", handleInput);

        input.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                clearResults();
                input.blur();
            }
        });
    }

    return {
        init,
        clearResults
    };
};