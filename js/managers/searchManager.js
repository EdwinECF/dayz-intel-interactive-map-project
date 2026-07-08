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
    infoPanel,
    layerManager,
    markerManager,
}) {
    const input = document.getElementById("map-search-input");
    const resultsContainer = document.getElementById("map-search-results");
    let currentResults = [];
    let activeIndex = -1;
    let debounceTimer = null;
    const SEARCH_DELAY = 150;

    function clearResults() {
        currentResults = [];
        activeIndex = -1;

        if (resultsContainer) {
            resultsContainer.innerHTML = "";
        }
    }

    function renderResults(results) {
        clearResults();

        currentResults = results;
        activeIndex = results.length ? 0 : -1;

        if (!resultsContainer || !results.length) return;

        results.forEach((result, index) => {
            const item = document.createElement("button");
            item.className = "search-result-item";

            if (index === activeIndex) {
                item.classList.add("active");
            }

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

        if (result.layerId) {
            layerManager.enableLayer(result.layerId);
        }

        setTimeout(() => {
            markerManager.flashMarker(result.id);
        }, 1000);

        const coords = atlasToMapCoords(result.lat, result.lng);

        map.flyTo(coords, -2, {
            duration: 0.75
        });

        infoPanel.show(result);

        clearResults();

        if (input) {
            input.value = "";
            input.blur();
        }
    }
    function updateActiveResult() {
        if (!resultsContainer) return;

        const items = resultsContainer.querySelectorAll(".search-result-item");

        items.forEach((item, index) => {
            item.classList.toggle("active", index === activeIndex);
        });

        const activeItem = items[activeIndex];

        if (activeItem) {
            activeItem.scrollIntoView({
                block: "nearest"
            });
        }
    }

    function handleInput(event) {
        const query = event.target.value;

        clearTimeout(debounceTimer);

        debounceTimer = setTimeout(() => {
            const results = searchService.search(query);
            renderResults(results);
        }, SEARCH_DELAY);
    }

    function init() {
        if (!input || !resultsContainer) return;

        input.addEventListener("input", handleInput);

        input.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                clearResults();
                input.blur();
                return;
            }

            if (!currentResults.length) return;

            if (event.key === "ArrowDown") {
                event.preventDefault();

                activeIndex =
                    activeIndex < currentResults.length - 1
                        ? activeIndex + 1
                        : 0;

                updateActiveResult();
            }

            if (event.key === "ArrowUp") {
                event.preventDefault();

                activeIndex =
                    activeIndex > 0
                        ? activeIndex - 1
                        : currentResults.length - 1;

                updateActiveResult();
            }

            if (event.key === "Enter") {
                event.preventDefault();

                if (activeIndex >= 0) {
                    selectResult(currentResults[activeIndex]);
                }
            }
        });
        document.addEventListener("click", event => {
            const clickedInsideSearch =
                input.contains(event.target) ||
                resultsContainer.contains(event.target);

            if (!clickedInsideSearch) {
                clearResults();
            }
        });
    }

    return {
        init,
        clearResults
    };
};