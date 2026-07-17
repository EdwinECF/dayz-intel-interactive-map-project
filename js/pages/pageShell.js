window.DZAtlasPageShell = (() => {
  const state = { items: [], query: "", category: "all", config: null };
  const normalize = value => String(value ?? "").toLowerCase().trim();
  const safe = value => String(value ?? "").replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  function initNavigation() {
    const sidebar = document.getElementById("primary-sidebar");
    const open = document.getElementById("mobile-menu-btn");
    const close = document.getElementById("mobile-menu-close");
    const backdrop = document.getElementById("mobile-drawer-backdrop");

    const setOpen = value => {
      sidebar?.classList.toggle("mobile-open", value);
      document.body.classList.toggle("mobile-menu-active", value);
      document.body.classList.toggle("mobile-drawer-active", value);
      open?.setAttribute("aria-expanded", String(value));
      sidebar?.setAttribute("aria-hidden", String(!value));
      backdrop?.setAttribute("aria-hidden", String(!value));

      if (value) {
        window.setTimeout(() => close?.focus(), 40);
      } else if (document.activeElement === close) {
        open?.focus();
      }
    };

    open?.setAttribute("aria-expanded", "false");
    open?.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      setOpen(true);
    });
    close?.addEventListener("click", () => setOpen(false));
    backdrop?.addEventListener("click", () => setOpen(false));
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") setOpen(false);
    });
    sidebar?.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => setOpen(false));
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 980) setOpen(false);
    });
  }

  function iconFor(category = "") {
    const c = normalize(category);
    if (c.includes("medical")) return "briefcase-medical";
    if (c.includes("military") || c.includes("armor")) return "shield-halved";
    if (c.includes("food")) return "utensils";
    if (c.includes("vehicle") || c.includes("car")) return "car";
    if (c.includes("weapon") || c.includes("rifle")) return "gun";
    if (c.includes("basic")) return "compass";
    if (c.includes("hostile")) return "skull";
    if (c.includes("friendly")) return "handshake";
    if (c.includes("event")) return "calendar-days";
    return "location-dot";
  }

  function getFiltered() {
    const { items, query, category, config } = state;
    return items.filter(item => {
      const matchesCategory = category === "all" || normalize(config.category(item)) === category;
      const haystack = config.searchFields(item).map(normalize).join(" ");
      return matchesCategory && (!query || haystack.includes(query));
    });
  }

  function renderFilters() {
    const row = document.getElementById("category-filter-row");
    if (!row || !state.config) return;

    const categories = [...new Set(state.items.map(item => state.config.category(item)).filter(Boolean))].sort();
    row.innerHTML = ["all", ...categories].map(category => {
      const key = normalize(category);
      const active = key === state.category;
      return `<button type="button" class="category-filter-btn ${active ? "active" : ""}" data-category="${safe(key)}" aria-pressed="${active}">${category === "all" ? "All" : safe(category)}</button>`;
    }).join("");

    row.querySelectorAll("button").forEach(button => {
      button.addEventListener("click", () => {
        state.category = button.dataset.category || "all";
        renderFilters();
        render();
      });
    });
  }

  function ensureDetailSheet() {
    if (document.getElementById("library-detail-sheet")) return;
    document.body.insertAdjacentHTML("beforeend", `
      <section class="library-detail-sheet" id="library-detail-sheet" aria-hidden="true">
        <div class="library-detail-backdrop" data-detail-close></div>
        <article class="library-detail-panel" role="dialog" aria-modal="true" aria-label="Item details">
          <header class="library-detail-header">
            <span>DZ-Atlas Intelligence</span>
            <button class="library-detail-close" type="button" data-detail-close aria-label="Close details">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </header>
          <div class="library-detail-content" id="library-detail-content"></div>
        </article>
      </section>`);

    document.querySelectorAll("[data-detail-close]").forEach(button => {
      button.addEventListener("click", closeDetailSheet);
    });
  }

  function openDetailSheet(card) {
    ensureDetailSheet();
    const sheet = document.getElementById("library-detail-sheet");
    const content = document.getElementById("library-detail-content");
    if (!sheet || !content || !card) return;

    const clone = card.cloneNode(true);
    clone.removeAttribute("tabindex");
    clone.removeAttribute("role");
    clone.removeAttribute("data-mobile-detail");
    content.replaceChildren(clone);
    sheet.classList.add("is-open");
    sheet.setAttribute("aria-hidden", "false");
    document.body.classList.add("library-detail-open");
    window.setTimeout(() => sheet.querySelector(".library-detail-close")?.focus(), 40);
  }

  function closeDetailSheet() {
    const sheet = document.getElementById("library-detail-sheet");
    if (!sheet?.classList.contains("is-open")) return;
    sheet.classList.remove("is-open");
    sheet.setAttribute("aria-hidden", "true");
    document.body.classList.remove("library-detail-open");
  }

  function bindRenderedCards(container) {
    container.querySelectorAll(".library-card").forEach(card => {
      card.dataset.mobileDetail = "true";
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", `Open details for ${card.querySelector("h3")?.textContent || "item"}`);
      card.addEventListener("click", event => {
        if (event.target.closest("a, button, input, select, textarea")) return;
        openDetailSheet(card);
      });
      card.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openDetailSheet(card);
        }
      });
    });
  }

  function render() {
    const container = document.getElementById(state.config.containerId);
    const empty = document.getElementById("library-empty-state");
    if (!container) return;

    const rows = getFiltered();
    container.innerHTML = rows.map((item, index) => state.config.card(item, index, safe, iconFor)).join("");
    document.getElementById("visible-result-count")?.replaceChildren(String(rows.length));
    document.getElementById("page-total-count")?.replaceChildren(String(state.items.length));
    empty?.classList.toggle("hidden", rows.length > 0);
    container.classList.toggle("hidden", rows.length === 0);
    bindRenderedCards(container);
  }

  async function mount(config) {
    state.config = config;
    const input = document.getElementById(config.searchId);

    try {
      const response = await fetch(config.dataFile, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      state.items = await response.json();
      renderFilters();
      render();
    } catch (error) {
      console.error(error);
      const empty = document.getElementById("library-empty-state");
      empty?.classList.remove("hidden");
      empty?.querySelector("h3")?.replaceChildren("Database unavailable");
      empty?.querySelector("p")?.replaceChildren("The data file could not be loaded. Check the file path and local server.");
    }

    input?.addEventListener("input", () => {
      state.query = normalize(input.value);
      render();
    });

    document.querySelector(".search-clear-btn")?.addEventListener("click", () => {
      if (input) input.value = "";
      state.query = "";
      render();
      input?.focus();
    });

    document.getElementById("reset-library-search")?.addEventListener("click", () => {
      if (input) input.value = "";
      state.query = "";
      state.category = "all";
      renderFilters();
      render();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    ensureDetailSheet();
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeDetailSheet();
    });
  });

  return { mount, safe, iconFor };
})();
