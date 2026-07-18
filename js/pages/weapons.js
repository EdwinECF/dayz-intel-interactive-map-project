document.addEventListener("DOMContentLoaded", () =>
  DZAtlasPageShell.mount({
    searchId: "weapons-search",
    dataFile: "../data/dayz/weapons.json",
    containerId: "weapons-container",

    category: item => item.category,

    searchFields: item => [
      item.displayName,
      item.fallbackName,
      item.className,
      item.category,
      ...(item.chamberableFrom || []),
      ...(item.magazines || []),
      ...(item.attachments || []),
      ...(item.modes || [])
    ],

    card: (item, index, safe) => {
      const name = item.displayName || item.fallbackName || item.className;
      const ammo = item.chamberableFrom?.[0] || "Unknown ammo";
      const size = item.itemSize?.join(" × ") || "N/A";

      return `
        <article class="content-card library-card weapon-card">
          <div class="library-card-icon">
            <i class="fa-solid fa-gun"></i>
          </div>

          <div class="library-card-content">
            <span class="card-eyebrow">${safe(item.category || "Weapon")}</span>
            <h3>${safe(name)}</h3>
            <p>${safe(ammo)}</p>

            <div class="weapon-specs">
              <span>
                <small>WEIGHT</small>
                <strong>${item.weight != null ? safe(`${item.weight} g`) : "N/A"}</strong>
              </span>
              <span>
                <small>SIZE</small>
                <strong>${safe(size)}</strong>
              </span>
            </div>
          </div>
        </article>`;
    },

    detail: (item, safe) => {
      const name = item.displayName || item.fallbackName || item.className;
      const list = (values, emptyText) => {
        if (!Array.isArray(values) || values.length === 0) {
          return `<span class="weapon-detail-empty">${safe(emptyText)}</span>`;
        }

        return `<div class="weapon-detail-tags">${values
          .map(value => `<span>${safe(value)}</span>`)
          .join("")}</div>`;
      };

      const size = item.itemSize?.join(" × ") || "N/A";
      const weight = item.weight != null ? `${item.weight} g` : "N/A";

      return `
        <section class="weapon-intel-sheet">
          <div class="weapon-intel-title">
            <div class="weapon-intel-icon"><i class="fa-solid fa-gun"></i></div>
            <div>
              <span class="atlas-kicker">Combat Intelligence</span>
              <h2>${safe(name)}</h2>
              <p>${safe(item.className)}</p>
            </div>
          </div>

          <div class="weapon-intel-stats">
            <div><small>WEIGHT</small><strong>${safe(weight)}</strong></div>
            <div><small>INVENTORY</small><strong>${safe(size)}</strong></div>
            <div><small>FIRE MODES</small><strong>${safe(item.modes?.join(" / ") || "N/A")}</strong></div>
            <div><small>MAGAZINES</small><strong>${safe(item.magazines?.length ?? 0)}</strong></div>
          </div>

          <section class="weapon-detail-section">
            <h3><i class="fa-solid fa-bullseye"></i> Ammunition</h3>
            ${list(item.chamberableFrom, "No ammunition data")}
          </section>

          <section class="weapon-detail-section">
            <h3><i class="fa-solid fa-box"></i> Compatible Magazines</h3>
            ${list(item.magazines, "No detachable magazines")}
          </section>

          <section class="weapon-detail-section">
            <h3><i class="fa-solid fa-puzzle-piece"></i> Attachment Slots</h3>
            ${list(item.attachments, "No attachment slots")}
          </section>

          <section class="weapon-detail-section weapon-detail-technical">
            <h3><i class="fa-solid fa-code"></i> Technical Record</h3>
            <dl>
              <div><dt>Parent class</dt><dd>${safe(item.parentClass || "N/A")}</dd></div>
              <div><dt>Source PBO</dt><dd>${safe(item.sourcePbo || "N/A")}</dd></div>
              <div><dt>Model</dt><dd>${safe(item.model || "N/A")}</dd></div>
            </dl>
          </section>
        </section>`;
    }
  })
);
