(function () {
  const data = window.presidentsReviewData || { eras: [], presidents: [] };
  const eraMap = new Map((data.eras || []).map((era) => [era.key, era]));
  const state = {
    query: "",
    activeEra: "all"
  };

  const heroCount = document.getElementById("hero-president-count");
  const heroEraCount = document.getElementById("hero-era-count");
  const heroSpan = document.getElementById("hero-span");
  const filterBar = document.getElementById("era-filter-list");
  const jumpLinks = document.getElementById("era-jump-links");
  const resultSummary = document.getElementById("results-summary");
  const sectionsRoot = document.getElementById("president-sections");
  const searchInput = document.getElementById("president-search");
  const clearButton = document.getElementById("clear-president-search");
  const scopeNote = document.getElementById("scope-note");
  const structureNote = document.getElementById("structure-note");

  const normalize = (value) => String(value || "").trim().toLowerCase();
  const escapeHtml = (value) => String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const buildHaystack = (president) => [
    president.numberLabel,
    president.name,
    president.years,
    president.party,
    president.summary,
    ...(president.review || []),
    ...(president.themes || []),
    ...(president.periods || []),
    eraMap.get(president.era)?.label || ""
  ].join(" ").toLowerCase();

  const getFilteredPresidents = () => {
    const query = normalize(state.query);

    return (data.presidents || []).filter((president) => {
      const matchesEra = state.activeEra === "all" || president.era === state.activeEra;
      if (!matchesEra) {
        return false;
      }

      if (!query) {
        return true;
      }

      return buildHaystack(president).includes(query);
    });
  };

  const getVisibleEras = (presidents) => {
    const counts = new Map();
    presidents.forEach((president) => {
      counts.set(president.era, (counts.get(president.era) || 0) + 1);
    });

    return (data.eras || [])
      .map((era) => ({
        ...era,
        count: counts.get(era.key) || 0
      }))
      .filter((era) => era.count > 0);
  };

  const renderHero = () => {
    if (heroCount) {
      heroCount.textContent = String((data.presidents || []).length);
    }

    if (heroEraCount) {
      heroEraCount.textContent = String((data.eras || []).length);
    }

    if (heroSpan) {
      const presidents = data.presidents || [];
      const first = presidents[0]?.years?.split("-")[0] || "1789";
      const last = presidents[presidents.length - 1]?.years?.split("-").pop() || "2025";
      heroSpan.textContent = `${first}-${last}`;
    }

    if (scopeNote) {
      scopeNote.textContent = data.scopeNote || "";
    }

    if (structureNote) {
      structureNote.textContent = data.structureNote || "";
    }
  };

  const renderFilters = () => {
    if (!filterBar) {
      return;
    }

    const counts = new Map();
    (data.presidents || []).forEach((president) => {
      counts.set(president.era, (counts.get(president.era) || 0) + 1);
    });

    const buttons = [
      {
        key: "all",
        label: "All Presidents",
        count: (data.presidents || []).length
      },
      ...(data.eras || []).map((era) => ({
        key: era.key,
        label: era.label,
        count: counts.get(era.key) || 0
      }))
    ];

    filterBar.innerHTML = buttons.map((button) => `
      <button
        class="filter-pill${button.key === state.activeEra ? " is-active" : ""}"
        type="button"
        data-era-filter="${escapeHtml(button.key)}"
        aria-pressed="${button.key === state.activeEra ? "true" : "false"}">
        <span>${escapeHtml(button.label)}</span>
        <strong>${button.count}</strong>
      </button>
    `).join("");
  };

  const renderJumpLinks = (visibleEras) => {
    if (!jumpLinks) {
      return;
    }

    jumpLinks.innerHTML = visibleEras.map((era) => `
      <a class="jump-link" href="#era-${escapeHtml(era.key)}">
        <span>${escapeHtml(era.label)}</span>
        <strong>${era.count}</strong>
      </a>
    `).join("");
  };

  const renderSummary = (visibleEras, presidents) => {
    if (!resultSummary) {
      return;
    }

    const queryLabel = normalize(state.query)
      ? ` for "${state.query.trim()}"`
      : "";
    const eraLabel = state.activeEra === "all"
      ? "all eras"
      : (eraMap.get(state.activeEra)?.label || "selected era");

    resultSummary.textContent = `Showing ${presidents.length} president${presidents.length === 1 ? "" : "s"} across ${visibleEras.length} visible era${visibleEras.length === 1 ? "" : "s"} in ${eraLabel}${queryLabel}.`;
  };

  const renderSections = (visibleEras, presidents) => {
    if (!sectionsRoot) {
      return;
    }

    if (!presidents.length) {
      sectionsRoot.innerHTML = `
        <section class="empty-state">
          <h3>No presidents matched that filter.</h3>
          <p>Try a broader era or search by a major theme like slavery, New Deal, civil rights, Cold War, or globalization.</p>
          <button class="reset-button" type="button" id="reset-president-filters">Reset Filters</button>
        </section>
      `;
      document.getElementById("reset-president-filters")?.addEventListener("click", resetFilters);
      return;
    }

    const grouped = new Map();
    visibleEras.forEach((era) => grouped.set(era.key, []));
    presidents.forEach((president) => {
      if (grouped.has(president.era)) {
        grouped.get(president.era).push(president);
      }
    });

    sectionsRoot.innerHTML = visibleEras.map((era) => `
      <section class="era-section" id="era-${escapeHtml(era.key)}">
        <div class="era-head">
          <div>
            <span class="eyebrow">${escapeHtml(era.label)}</span>
            <h2>${escapeHtml(era.range)}</h2>
          </div>
          <div class="era-meta">
            <strong>${era.count}</strong>
            <span>president${era.count === 1 ? "" : "s"}</span>
          </div>
        </div>
        <p class="era-summary">${escapeHtml(era.summary)}</p>
        <div class="president-grid">
          ${(grouped.get(era.key) || []).map((president) => `
            <article class="president-card" id="${escapeHtml(president.id)}">
              <div class="president-topline">
                <span class="president-number">${escapeHtml(president.numberLabel)}</span>
                <span class="president-years">${escapeHtml(president.years)}</span>
              </div>
              <h3>${escapeHtml(president.name)}</h3>
              <div class="president-meta">
                <span>${escapeHtml(president.party)}</span>
                <span>${escapeHtml((president.periods || []).join(" / "))}</span>
              </div>
              <p class="president-summary">${escapeHtml(president.summary)}</p>
              <ul class="review-list">
                ${(president.review || []).map((point) => `<li>${escapeHtml(point)}</li>`).join("")}
              </ul>
              <div class="theme-row">
                ${(president.themes || []).map((theme) => `<span class="theme-chip">${escapeHtml(theme)}</span>`).join("")}
              </div>
            </article>
          `).join("")}
        </div>
      </section>
    `).join("");
  };

  const resetFilters = () => {
    state.query = "";
    state.activeEra = "all";
    if (searchInput) {
      searchInput.value = "";
    }
    render();
  };

  const render = () => {
    const presidents = getFilteredPresidents();
    const visibleEras = getVisibleEras(presidents);

    renderFilters();
    renderJumpLinks(visibleEras);
    renderSummary(visibleEras, presidents);
    renderSections(visibleEras, presidents);

    if (clearButton) {
      clearButton.disabled = !normalize(state.query) && state.activeEra === "all";
    }
  };

  filterBar?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-era-filter]");
    if (!button) {
      return;
    }

    state.activeEra = button.dataset.eraFilter || "all";
    render();
  });

  searchInput?.addEventListener("input", (event) => {
    state.query = event.target.value || "";
    render();
  });

  clearButton?.addEventListener("click", resetFilters);

  renderHero();
  render();
})();
