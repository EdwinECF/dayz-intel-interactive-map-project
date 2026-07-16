(() => {
  "use strict";

  const CONFIG = {
    indexUrl: "../data/guides/index.json",
    sourcesUrl: "../data/guides/sources.json",
    guideBaseUrl: "../data/guides/",
    containerId: "guides-container",
    searchId: "guide-search",
    categoryRowId: "category-filter-row",
    emptyStateId: "library-empty-state",
    totalCountId: "page-total-count",
    visibleCountId: "visible-result-count",
    defaultCover: "../assets/guides/placeholders/guide-default.webp"
  };

  const state = {
    guides: [],
    guideBySlug: new Map(),
    sources: new Map(),
    query: "",
    category: "all",
    activeGuide: null,
    activeCard: null,
    previousFocus: null,
    scrollLockY: 0,
    readerRequest: 0
  };

  const normalize = value => String(value ?? "").toLowerCase().trim();
  const safe = value => String(value ?? "").replace(/[&<>'"]/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[char]);
  const attr = safe;

  function elements() {
    return {
      container: document.getElementById(CONFIG.containerId),
      search: document.getElementById(CONFIG.searchId),
      filters: document.getElementById(CONFIG.categoryRowId),
      empty: document.getElementById(CONFIG.emptyStateId),
      total: document.getElementById(CONFIG.totalCountId),
      visible: document.getElementById(CONFIG.visibleCountId),
      reset: document.getElementById("reset-library-search"),
      clear: document.querySelector(".search-clear-btn"),
      reader: document.getElementById("guide-reader"),
      readerPanel: document.querySelector(".guide-reader-panel"),
      readerScroll: document.getElementById("guide-reader-scroll"),
      readerContent: document.getElementById("guide-reader-content"),
      readerLoading: document.getElementById("guide-reader-loading"),
      readerError: document.getElementById("guide-reader-error"),
      progress: document.getElementById("guide-reading-progress-bar"),
      readerBookmark: document.getElementById("guide-reader-bookmark"),
      share: document.getElementById("guide-reader-share")
    };
  }

  function difficultyClass(value = "") {
    const difficulty = normalize(value);
    if (difficulty === "advanced") return "is-advanced";
    if (difficulty === "intermediate") return "is-intermediate";
    return "is-beginner";
  }

  function getSearchText(guide) {
    return [
      guide.title, guide.summary, guide.category, guide.difficulty,
      ...(guide.tags || []), ...(guide.maps || [])
    ].map(normalize).join(" ");
  }

  function filteredGuides() {
    return state.guides.filter(guide => {
      const categoryMatches =
        state.category === "all" || normalize(guide.category) === state.category;
      const queryMatches = !state.query || getSearchText(guide).includes(state.query);
      return categoryMatches && queryMatches;
    });
  }

  function cardImage(guide) {
    const presentation = guide.presentation || {};
    const cover = presentation.thumbnailImage || presentation.coverImage || CONFIG.defaultCover;
    const fallback = presentation.fallbackCoverImage || CONFIG.defaultCover;
    const altText = presentation.coverAlt || `${guide.title} DayZ guide`;

    return `
      <div class="guide-card-media">
        <img src="${attr(cover)}" alt="${attr(altText)}" loading="lazy"
          decoding="async" data-fallback="${attr(fallback)}">
        <div class="guide-card-media-shade"></div>
        ${guide.featured ? `
          <span class="guide-featured-badge">
            <i class="fa-solid fa-star"></i> Featured
          </span>` : ""}
        <span class="guide-difficulty-badge ${difficultyClass(guide.difficulty)}">
          ${safe(guide.difficulty || "Field Guide")}
        </span>
      </div>`;
  }

  function guideCard(guide) {
    const presentation = guide.presentation || {};
    const accent = presentation.accentColor || "var(--atlas-primary)";
    const icon = presentation.icon || "fa-book-open";

    return `
      <article class="content-card guide-library-card"
        data-guide-id="${attr(guide.id)}"
        data-guide-slug="${attr(guide.slug)}"
        style="--guide-accent:${attr(accent)}">

        <div class="guide-card-open" role="button" tabindex="0"
          data-guide-file="${attr(guide.file)}"
          aria-label="Open ${attr(guide.title)}">
          ${cardImage(guide)}

          <div class="guide-card-body">
            <div class="guide-card-heading">
              <span class="guide-category-label">
                <i class="fa-solid ${attr(icon)}"></i>
                ${safe(guide.category)}
              </span>

              <button class="guide-bookmark-btn" type="button"
                data-bookmark-guide="${attr(guide.id)}"
                aria-label="Bookmark ${attr(guide.title)}" aria-pressed="false">
                <i class="fa-regular fa-bookmark"></i>
              </button>
            </div>

            <h3>${safe(guide.title)}</h3>
            <p>${safe(guide.summary)}</p>

            <div class="guide-card-meta">
              <span><i class="fa-regular fa-clock"></i>${safe(guide.estimatedReadMinutes)} min</span>
              <span><i class="fa-solid fa-layer-group"></i>Full guide</span>
              <span><i class="fa-solid fa-map"></i>${safe((guide.maps || []).length)} maps</span>
            </div>

            <div class="guide-card-action">
              <span>Read complete guide</span>
              <i class="fa-solid fa-arrow-right"></i>
            </div>
          </div>
        </div>
      </article>`;
  }

  function renderFilters() {
    const { filters } = elements();
    if (!filters) return;

    const categories = [...new Set(state.guides.map(g => g.category).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));

    filters.innerHTML = ["all", ...categories].map(category => {
      const key = normalize(category);
      const active = key === state.category;
      return `
        <button type="button" class="category-filter-btn ${active ? "active" : ""}"
          data-category="${attr(key)}" aria-pressed="${active}">
          ${category === "all" ? "All Guides" : safe(category)}
        </button>`;
    }).join("");

    filters.querySelectorAll("[data-category]").forEach(button => {
      button.addEventListener("click", () => {
        state.category = button.dataset.category || "all";
        renderFilters();
        renderCards();
      });
    });
  }

  function renderCards() {
    const { container, empty, total, visible } = elements();
    if (!container) return;

    const rows = filteredGuides();
    container.innerHTML = rows.map(guideCard).join("");
    total?.replaceChildren(String(state.guides.length));
    visible?.replaceChildren(String(rows.length));
    container.classList.toggle("hidden", rows.length === 0);
    empty?.classList.toggle("hidden", rows.length > 0);

    bindCards(container);
    restoreBookmarkButtons(container);
    bindFallbackImages(container);
  }

  function bindCards(container) {
    container.querySelectorAll(".guide-card-open").forEach(card => {
      const open = () => {
        const shell = card.closest("[data-guide-slug]");
        openGuide(shell?.dataset.guideSlug, card.dataset.guideFile, card);
      };

      card.addEventListener("click", event => {
        if (!event.target.closest(".guide-bookmark-btn")) open();
      });

      card.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      });
    });

    container.querySelectorAll(".guide-bookmark-btn").forEach(button => {
      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        toggleBookmark(button.dataset.bookmarkGuide);
        syncAllBookmarkButtons(button.dataset.bookmarkGuide);
      });
    });
  }

  function bookmarkKey() { return "dzatlas-guide-bookmarks"; }
  function progressKey() { return "dzatlas-guide-progress"; }

  function getBookmarks() {
    try {
      const parsed = JSON.parse(localStorage.getItem(bookmarkKey()) || "[]");
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch {
      return new Set();
    }
  }

  function toggleBookmark(id) {
    if (!id) return false;
    const bookmarks = getBookmarks();
    const active = !bookmarks.has(id);
    if (active) bookmarks.add(id); else bookmarks.delete(id);
    localStorage.setItem(bookmarkKey(), JSON.stringify([...bookmarks]));
    return active;
  }

  function setBookmarkButton(button, active) {
    if (!button) return;
    button.classList.toggle("is-bookmarked", active);
    button.setAttribute("aria-pressed", String(active));
    const icon = button.querySelector("i");
    icon?.classList.toggle("fa-solid", active);
    icon?.classList.toggle("fa-regular", !active);
  }

  function syncAllBookmarkButtons(id) {
    const active = getBookmarks().has(id);
    document.querySelectorAll(`[data-bookmark-guide="${CSS.escape(id)}"]`)
      .forEach(button => setBookmarkButton(button, active));

    if (state.activeGuide?.id === id) {
      setBookmarkButton(elements().readerBookmark, active);
    }
  }

  function restoreBookmarkButtons(root = document) {
    const bookmarks = getBookmarks();
    root.querySelectorAll("[data-bookmark-guide]").forEach(button => {
      setBookmarkButton(button, bookmarks.has(button.dataset.bookmarkGuide));
    });
  }

  function readProgress() {
    try {
      const parsed = JSON.parse(localStorage.getItem(progressKey()) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveGuideProgress(slug, percent) {
    if (!slug) return;
    const progress = readProgress();
    progress[slug] = {
      percent: Math.max(0, Math.min(100, Math.round(percent))),
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(progressKey(), JSON.stringify(progress));
  }

  function bindFallbackImages(root) {
    root.querySelectorAll("img[data-fallback]").forEach(image => {
      image.addEventListener("error", () => {
        const fallback = image.dataset.fallback || CONFIG.defaultCover;
        if (image.dataset.didFallback === "true") return;
        image.dataset.didFallback = "true";
        image.src = fallback;
      }, { once: true });
    });
  }

  function updateUrl(slug, replace = false) {
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set("guide", slug);
    else url.searchParams.delete("guide");
    window.history[replace ? "replaceState" : "pushState"]({ guide: slug || null }, "", url);
  }

  function showReaderState(type) {
    const { readerLoading, readerError, readerContent } = elements();
    readerLoading?.classList.toggle("hidden", type !== "loading");
    readerError?.classList.toggle("hidden", type !== "error");
    readerContent?.classList.toggle("hidden", type !== "content");
  }

  async function openGuide(slug, file, sourceCard = null, options = {}) {
    if (!slug) return;

    const requestId = ++state.readerRequest;
    const { reader, readerPanel, readerScroll, progress } = elements();
    state.previousFocus = document.activeElement;
    state.activeCard = sourceCard;
    state.scrollLockY = window.scrollY;

    reader?.classList.add("is-open");
    reader?.setAttribute("aria-hidden", "false");
    document.body.classList.add("guide-reader-open");
    readerPanel?.setAttribute("aria-busy", "true");
    if (readerScroll) readerScroll.scrollTop = 0;
    if (progress) progress.style.width = "0%";
    showReaderState("loading");

    if (!options.fromHistory) updateUrl(slug);
    requestAnimationFrame(() => document.getElementById("guide-reader-close")?.focus());

    try {
      const cardData = state.guideBySlug.get(slug);
      const guideFile = file || cardData?.file;
      if (!guideFile) throw new Error("No guide file path was found.");

      const response = await fetch(`${CONFIG.guideBaseUrl}${guideFile}`, { cache: "no-cache" });
      if (!response.ok) throw new Error(`Guide request failed with HTTP ${response.status}`);
      const guide = await response.json();
      if (requestId !== state.readerRequest) return;

      state.activeGuide = guide;
      renderReader(guide);
      showReaderState("content");
      readerPanel?.setAttribute("aria-busy", "false");
      bindReaderInteractions();
      updateReadingProgress();
    } catch (error) {
      if (requestId !== state.readerRequest) return;
      console.error("[DZ-Atlas Guide Reader]", error);
      readerPanel?.setAttribute("aria-busy", "false");
      showReaderState("error");
    }
  }

  function closeGuide(options = {}) {
    const { reader, readerContent, progress } = elements();
    if (!reader?.classList.contains("is-open")) return;

    saveCurrentProgress();
    reader.classList.remove("is-open");
    reader.setAttribute("aria-hidden", "true");
    document.body.classList.remove("guide-reader-open");
    state.activeGuide = null;
    state.readerRequest++;

    if (readerContent) readerContent.innerHTML = "";
    if (progress) progress.style.width = "0%";
    if (!options.fromHistory) updateUrl(null);

    const focusTarget = state.activeCard || state.previousFocus;
    setTimeout(() => focusTarget?.focus?.(), 160);
  }

  function quickFacts(guide) {
    const facts = Array.isArray(guide.quickFacts) && guide.quickFacts.length
      ? guide.quickFacts
      : [
          { label: "Difficulty", value: guide.difficulty, icon: "fa-signal" },
          { label: "Read time", value: `${guide.estimatedReadMinutes} min`, icon: "fa-clock" },
          { label: "Steps", value: String((guide.steps || []).length), icon: "fa-list-check" },
          { label: "Maps", value: (guide.maps || []).join(", "), icon: "fa-map" }
        ];

    return facts.map(fact => `
      <div class="guide-fact">
        <i class="fa-solid ${attr(fact.icon || "fa-circle-info")}"></i>
        <span>${safe(fact.label)}</span>
        <strong>${safe(fact.value)}</strong>
      </div>`).join("");
  }

  function tableOfContents(guide) {
    const steps = guide.steps || [];
    if (steps.length < 2) return "";

    return `
      <nav class="guide-toc" aria-label="Guide contents">
        <div class="guide-section-heading">
          <span>Field Index</span><h2>Table of Contents</h2>
        </div>
        <ol>
          ${steps.map(step => `
            <li>
              <a href="#${attr(step.id || `guide-step-${step.order}`)}">
                <span>${String(step.order).padStart(2, "0")}</span>
                ${safe(step.title)}
              </a>
            </li>`).join("")}
        </ol>
      </nav>`;
  }

  function stepMarkup(step) {
    const id = step.id || `guide-step-${step.order}`;
    const hasImage = Boolean(step.image);
    const image = hasImage ? `
      <figure class="guide-step-image">
        <img src="${attr(step.image)}"
          alt="${attr(step.imageAlt || step.title)}" loading="lazy"
          data-fallback="${attr(CONFIG.defaultCover)}">
      </figure>` : "";

    const callout = step.callout ? `
      <aside class="guide-inline-callout">
        <i class="fa-solid fa-circle-info"></i>
        <p>${safe(step.callout.text || step.callout)}</p>
      </aside>` : "";

    return `
      <section class="guide-step ${hasImage ? `has-image layout-${attr(step.layout || "image-right")}` : ""}"
        id="${attr(id)}">
        <div class="guide-step-number">${String(step.order).padStart(2, "0")}</div>
        <div class="guide-step-copy">
          <span class="guide-step-kicker">Step ${safe(step.order)}</span>
          <h2>${safe(step.title)}</h2>
          <p>${safe(step.body)}</p>
          ${callout}
        </div>
        ${image}
      </section>`;
  }

  function listCallout(type, title, icon, items) {
    if (!Array.isArray(items) || !items.length) return "";
    return `
      <aside class="guide-callout guide-callout-${type}">
        <div class="guide-callout-icon"><i class="fa-solid ${icon}"></i></div>
        <div>
          <span>Survivor Intelligence</span>
          <h2>${title}</h2>
          <ul>${items.map(item => `<li>${safe(item)}</li>`).join("")}</ul>
        </div>
      </aside>`;
  }

  function relatedGuides(guide) {
    const ids = guide.relationships?.guides || guide.relatedGuideIds || [];
    const related = ids.map(id =>
      state.guides.find(item => item.id === id || item.slug === id)
    ).filter(Boolean).slice(0, 4);

    if (!related.length) return "";

    return `
      <section class="guide-related-section">
        <div class="guide-section-heading">
          <span>Continue Learning</span><h2>Related Guides</h2>
        </div>
        <div class="guide-related-grid">
          ${related.map(item => `
            <button type="button" class="guide-related-card"
              data-related-slug="${attr(item.slug)}"
              data-related-file="${attr(item.file)}">
              <span>${safe(item.category)}</span>
              <strong>${safe(item.title)}</strong>
              <small>${safe(item.estimatedReadMinutes)} min read</small>
              <i class="fa-solid fa-arrow-right"></i>
            </button>`).join("")}
        </div>
      </section>`;
  }

  function relationshipPlaceholders(guide) {
    const relationships = guide.relationships || {};
    const itemIds = relationships.items || guide.relatedItemIds || [];
    const mapLinks = relationships.mapLinks || guide.relatedMapLinks || [];
    if (!itemIds.length && !mapLinks.length) return "";

    return `
      <section class="guide-connections">
        <div class="guide-section-heading">
          <span>DZ-Atlas Network</span><h2>Guide Connections</h2>
        </div>
        <div class="guide-connection-grid">
          ${itemIds.length ? `
            <div class="guide-connection-panel">
              <i class="fa-solid fa-box-open"></i>
              <strong>Related Items</strong>
              <span>${itemIds.length} linked records</span>
            </div>` : ""}
          ${mapLinks.length ? `
            <div class="guide-connection-panel">
              <i class="fa-solid fa-map-location-dot"></i>
              <strong>Open on Map</strong>
              <span>${mapLinks.length} linked locations</span>
            </div>` : ""}
        </div>
      </section>`;
  }

  function sourcesMarkup(guide) {
    const ids = guide.sourceIds || [];
    const sourceRows = ids.map(id => state.sources.get(id) || { id, title: id });
    const verification = guide.verification || {};

    return `
      <footer class="guide-document-footer">
        <div>
          <span class="guide-footer-label">Verification</span>
          <strong>${safe(verification.status || "Editorial draft")}</strong>
          <p>${safe(verification.note || "Verify patch-sensitive mechanics against the current game version.")}</p>
        </div>
        ${sourceRows.length ? `
          <div>
            <span class="guide-footer-label">Sources</span>
            <ul>${sourceRows.map(source => `
              <li>${source.url
                ? `<a href="${attr(source.url)}" target="_blank" rel="noopener">${safe(source.title)}</a>`
                : safe(source.title)}
              </li>`).join("")}</ul>
          </div>` : ""}
      </footer>`;
  }

  function renderReader(guide) {
    const { readerContent, readerBookmark } = elements();
    if (!readerContent) return;

    const presentation = guide.presentation || {};
    const cover = presentation.coverImage || presentation.thumbnailImage || CONFIG.defaultCover;
    const fallback = presentation.fallbackCoverImage || CONFIG.defaultCover;
    const icon = presentation.icon || "fa-book-open";
    const accent = presentation.accentColor || "var(--atlas-primary)";
    const steps = guide.steps || [];

    readerContent.style.setProperty("--guide-accent", accent);
    readerContent.innerHTML = `
      <article class="guide-document">
        <header class="guide-document-hero">
          <img src="${attr(cover)}" alt="${attr(presentation.coverAlt || guide.title)}"
            data-fallback="${attr(fallback)}">
          <div class="guide-document-hero-overlay"></div>
          <div class="guide-document-hero-content">
            <span class="guide-document-category">
              <i class="fa-solid ${attr(icon)}"></i>${safe(guide.category)}
            </span>
            <h1 id="guide-reader-title">${safe(guide.title)}</h1>
            <p>${safe(guide.summary)}</p>
            <div class="guide-document-meta">
              <span class="${difficultyClass(guide.difficulty)}">
                <i class="fa-solid fa-signal"></i>${safe(guide.difficulty)}
              </span>
              <span><i class="fa-regular fa-clock"></i>${safe(guide.estimatedReadMinutes)} min read</span>
              <span><i class="fa-solid fa-list-check"></i>${steps.length} steps</span>
            </div>
          </div>
        </header>

        <div class="guide-document-layout">
          <aside class="guide-document-sidebar">
            <div class="guide-sidebar-card">
              <span class="guide-sidebar-label">Quick Facts</span>
              <div class="guide-facts">${quickFacts(guide)}</div>
            </div>
            ${tableOfContents(guide)}
          </aside>

          <main class="guide-document-main">
            <section class="guide-summary-block">
              <span>Mission Brief</span>
              <h2>What this guide covers</h2>
              <p>${safe(guide.summary)}</p>
            </section>

            <div class="guide-steps">
              ${steps.map(stepMarkup).join("")}
            </div>

            ${listCallout("tips", "Field Notes", "fa-lightbulb", guide.tips)}
            ${listCallout("warnings", "Critical Warnings", "fa-triangle-exclamation", guide.warnings)}
            ${relationshipPlaceholders(guide)}
            ${relatedGuides(guide)}
            ${sourcesMarkup(guide)}
          </main>
        </div>
      </article>`;

    setBookmarkButton(readerBookmark, getBookmarks().has(guide.id));
    if (readerBookmark) readerBookmark.dataset.bookmarkGuide = guide.id;
    bindFallbackImages(readerContent);

    const saved = readProgress()[guide.slug];
    if (saved?.percent > 0) {
      requestAnimationFrame(() => {
        const { readerScroll } = elements();
        if (!readerScroll) return;
        const max = readerScroll.scrollHeight - readerScroll.clientHeight;
        if (max > 0 && saved.percent < 95) {
          readerScroll.scrollTop = max * (saved.percent / 100);
        }
      });
    }
  }

  function bindReaderInteractions() {
    const { readerContent } = elements();

    readerContent?.querySelectorAll(".guide-toc a").forEach(link => {
      link.addEventListener("click", event => {
        event.preventDefault();
        const target = readerContent.querySelector(link.getAttribute("href"));
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    readerContent?.querySelectorAll("[data-related-slug]").forEach(button => {
      button.addEventListener("click", () => {
        openGuide(button.dataset.relatedSlug, button.dataset.relatedFile, button);
      });
    });
  }

  function updateReadingProgress() {
    const { readerScroll, progress } = elements();
    if (!readerScroll || !progress || !state.activeGuide) return;
    const max = readerScroll.scrollHeight - readerScroll.clientHeight;
    const percent = max <= 0 ? 100 : (readerScroll.scrollTop / max) * 100;
    progress.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  }

  function saveCurrentProgress() {
    const { readerScroll } = elements();
    if (!readerScroll || !state.activeGuide) return;
    const max = readerScroll.scrollHeight - readerScroll.clientHeight;
    const percent = max <= 0 ? 100 : (readerScroll.scrollTop / max) * 100;
    saveGuideProgress(state.activeGuide.slug, percent);
  }

  function bindReaderShell() {
    const { reader, readerScroll, readerBookmark, share } = elements();

    reader?.querySelectorAll("[data-guide-close]").forEach(button => {
      button.addEventListener("click", () => closeGuide());
    });

    readerScroll?.addEventListener("scroll", () => {
      updateReadingProgress();
      window.clearTimeout(readerScroll._progressTimer);
      readerScroll._progressTimer = window.setTimeout(saveCurrentProgress, 250);
    }, { passive: true });

    readerBookmark?.addEventListener("click", () => {
      if (!state.activeGuide) return;
      toggleBookmark(state.activeGuide.id);
      syncAllBookmarkButtons(state.activeGuide.id);
    });

    share?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        share.classList.add("is-copied");
        share.setAttribute("aria-label", "Guide link copied");
        setTimeout(() => {
          share.classList.remove("is-copied");
          share.setAttribute("aria-label", "Copy guide link");
        }, 1600);
      } catch {
        window.prompt("Copy this guide link:", window.location.href);
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && reader?.classList.contains("is-open")) closeGuide();
      if (event.key === "Tab" && reader?.classList.contains("is-open")) trapFocus(event);
    });

    window.addEventListener("popstate", () => {
      const slug = new URL(window.location.href).searchParams.get("guide");
      if (slug) {
        const guide = state.guideBySlug.get(slug);
        openGuide(slug, guide?.file, null, { fromHistory: true });
      } else {
        closeGuide({ fromHistory: true });
      }
    });
  }

  function trapFocus(event) {
    const panel = elements().readerPanel;
    if (!panel) return;
    const focusable = [...panel.querySelectorAll(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    )].filter(node => node.offsetParent !== null);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  }

  function bindToolbar() {
    const { search, clear, reset } = elements();
    search?.addEventListener("input", () => {
      state.query = normalize(search.value);
      renderCards();
    });
    clear?.addEventListener("click", () => {
      if (search) search.value = "";
      state.query = "";
      renderCards();
      search?.focus();
    });
    reset?.addEventListener("click", () => {
      if (search) search.value = "";
      state.query = "";
      state.category = "all";
      renderFilters();
      renderCards();
    });
  }

  async function loadData() {
    const [indexResponse, sourcesResponse] = await Promise.all([
      fetch(CONFIG.indexUrl, { cache: "no-cache" }),
      fetch(CONFIG.sourcesUrl, { cache: "no-cache" }).catch(() => null)
    ]);

    if (!indexResponse.ok) throw new Error(`Guide index HTTP ${indexResponse.status}`);
    const payload = await indexResponse.json();
    if (!Array.isArray(payload.guides)) throw new TypeError("Guide index has no guides array.");

    state.guides = payload.guides;
    state.guideBySlug = new Map(state.guides.map(guide => [guide.slug, guide]));

    if (sourcesResponse?.ok) {
      const sourcePayload = await sourcesResponse.json();
      state.sources = new Map((sourcePayload.sources || []).map(source => [source.id, source]));
    }
  }

  function renderLoadError() {
    const { container, empty, total, visible } = elements();
    container?.classList.add("hidden");
    total?.replaceChildren("0");
    visible?.replaceChildren("0");
    if (empty) {
      empty.classList.remove("hidden");
      empty.querySelector("h3")?.replaceChildren("Guide database unavailable");
      empty.querySelector("p")?.replaceChildren(
        "Check that data/guides/index.json exists and run DZ-Atlas through a local server."
      );
    }
  }

  async function initialize() {
    bindToolbar();
    bindReaderShell();

    try {
      await loadData();
      renderFilters();
      renderCards();

      const slug = new URL(window.location.href).searchParams.get("guide");
      if (slug) {
        const guide = state.guideBySlug.get(slug);
        if (guide) openGuide(slug, guide.file, null, { fromHistory: true });
        else updateUrl(null, true);
      }
    } catch (error) {
      console.error("[DZ-Atlas Guides]", error);
      renderLoadError();
    }
  }

  document.addEventListener("DOMContentLoaded", initialize);
})();