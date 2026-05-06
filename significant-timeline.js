(function () {
  const data = window.significantTimelineData || { events: [] };
  const allEvents = Array.isArray(data.events) ? data.events.slice() : [];
  const periodMeta = typeof window.getApushPeriodMeta === "function"
    ? window.apushPeriodCatalog || []
    : [];
  const periodMetaById = new Map((periodMeta || []).map((period) => [period.id, period]));
  const state = {
    query: "",
    activePeriod: "all",
    activeCategory: "all"
  };

  const heroEventCount = document.getElementById("hero-event-count");
  const heroPeriodCount = document.getElementById("hero-period-count");
  const heroRange = document.getElementById("hero-range");
  const scopeNote = document.getElementById("scope-note");
  const strategyNote = document.getElementById("strategy-note");
  const periodFilters = document.getElementById("period-filter-list");
  const categoryFilters = document.getElementById("category-filter-list");
  const jumpLinks = document.getElementById("period-jump-links");
  const resultSummary = document.getElementById("results-summary");
  const sectionsRoot = document.getElementById("timeline-sections");
  const searchInput = document.getElementById("timeline-search");
  const clearButton = document.getElementById("clear-timeline-search");

  const normalize = (value) => String(value || "").trim().toLowerCase();
  const escapeHtml = (value) => String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  const getSortYear = (value) => Number(String(value || "").match(/\d{4}/)?.[0] || 0);

  const buildHaystack = (event) => [
    event.year,
    event.title,
    event.summary,
    event.category,
    ...(event.evidence || []),
    ...(event.essayAngles || [])
  ].join(" ").toLowerCase();

  const sortedPeriods = Array.from(new Set(allEvents.map((event) => event.periodId)))
    .map((periodId) => periodMetaById.get(periodId) || { id: periodId, number: Number.MAX_SAFE_INTEGER, short: periodId.toUpperCase(), label: periodId.toUpperCase(), range: "" })
    .sort((left, right) => (left.number || Number.MAX_SAFE_INTEGER) - (right.number || Number.MAX_SAFE_INTEGER));

  const categories = Array.from(new Set(allEvents.map((event) => event.category))).sort();

  const getFilteredEvents = () => {
    const query = normalize(state.query);

    return allEvents
      .filter((event) => {
        const matchesPeriod = state.activePeriod === "all" || event.periodId === state.activePeriod;
        const matchesCategory = state.activeCategory === "all" || event.category === state.activeCategory;

        if (!matchesPeriod || !matchesCategory) {
          return false;
        }

        if (!query) {
          return true;
        }

        return buildHaystack(event).includes(query);
      })
      .sort((left, right) => getSortYear(left.year) - getSortYear(right.year));
  };

  const getVisiblePeriods = (events) => {
    const counts = new Map();

    events.forEach((event) => {
      counts.set(event.periodId, (counts.get(event.periodId) || 0) + 1);
    });

    return sortedPeriods
      .map((period) => ({
        ...period,
        count: counts.get(period.id) || 0
      }))
      .filter((period) => period.count > 0);
  };

  const renderHero = () => {
    const years = allEvents.map((event) => getSortYear(event.year)).filter((year) => Number.isFinite(year) && year > 0);
    if (heroEventCount) {
      heroEventCount.textContent = String(allEvents.length);
    }
    if (heroPeriodCount) {
      heroPeriodCount.textContent = String(sortedPeriods.length);
    }
    if (heroRange) {
      heroRange.textContent = years.length ? `${Math.min(...years)}-${Math.max(...years)}` : "n/a";
    }
    if (scopeNote) {
      scopeNote.textContent = data.scopeNote || "";
    }
    if (strategyNote) {
      strategyNote.textContent = data.strategyNote || "";
    }
  };

  const renderPeriodFilters = () => {
    if (!periodFilters) {
      return;
    }

    const counts = new Map();
    allEvents.forEach((event) => {
      counts.set(event.periodId, (counts.get(event.periodId) || 0) + 1);
    });

    periodFilters.innerHTML = [
      `<button class="filter-pill${state.activePeriod === "all" ? " is-active" : ""}" type="button" data-period-filter="all" aria-pressed="${state.activePeriod === "all"}"><span>All Periods</span><strong>${allEvents.length}</strong></button>`,
      ...sortedPeriods.map((period) => `
        <button class="filter-pill${state.activePeriod === period.id ? " is-active" : ""}" type="button" data-period-filter="${escapeHtml(period.id)}" aria-pressed="${state.activePeriod === period.id}">
          <span>${escapeHtml(period.short || period.label)}</span>
          <strong>${counts.get(period.id) || 0}</strong>
        </button>
      `)
    ].join("");
  };

  const renderCategoryFilters = () => {
    if (!categoryFilters) {
      return;
    }

    const counts = new Map();
    allEvents.forEach((event) => {
      counts.set(event.category, (counts.get(event.category) || 0) + 1);
    });

    categoryFilters.innerHTML = [
      `<button class="filter-pill${state.activeCategory === "all" ? " is-active" : ""}" type="button" data-category-filter="all" aria-pressed="${state.activeCategory === "all"}"><span>All Categories</span><strong>${allEvents.length}</strong></button>`,
      ...categories.map((category) => `
        <button class="filter-pill${state.activeCategory === category ? " is-active" : ""}" type="button" data-category-filter="${escapeHtml(category)}" aria-pressed="${state.activeCategory === category}">
          <span>${escapeHtml(category)}</span>
          <strong>${counts.get(category) || 0}</strong>
        </button>
      `)
    ].join("");
  };

  const renderJumpLinks = (visiblePeriods) => {
    if (!jumpLinks) {
      return;
    }

    jumpLinks.innerHTML = visiblePeriods.map((period) => `
      <a class="jump-link" href="#period-${escapeHtml(period.id)}">
        <span>${escapeHtml(period.short || period.label)}</span>
        <strong>${period.count}</strong>
      </a>
    `).join("");
  };

  const renderSummary = (events, visiblePeriods) => {
    if (!resultSummary) {
      return;
    }

    const activePeriodLabel = state.activePeriod === "all"
      ? "all periods"
      : (periodMetaById.get(state.activePeriod)?.label || state.activePeriod.toUpperCase());
    const activeCategoryLabel = state.activeCategory === "all" ? "all categories" : state.activeCategory;
    const queryLabel = normalize(state.query) ? ` for "${state.query.trim()}"` : "";

    resultSummary.textContent = `Showing ${events.length} major event${events.length === 1 ? "" : "s"} across ${visiblePeriods.length} visible period${visiblePeriods.length === 1 ? "" : "s"} in ${activePeriodLabel} and ${activeCategoryLabel}${queryLabel}.`;
  };

  const renderSections = (events, visiblePeriods) => {
    if (!sectionsRoot) {
      return;
    }

    if (!events.length) {
      sectionsRoot.innerHTML = `
        <section class="empty-state">
          <h3>No evidence events matched that filter.</h3>
          <p>Try a broader period, a broader category, or search a bigger term like New Deal, civil rights, labor, or Cold War.</p>
          <button class="reset-button" type="button" id="reset-significant-timeline">Reset Filters</button>
        </section>
      `;
      document.getElementById("reset-significant-timeline")?.addEventListener("click", resetFilters);
      return;
    }

    const grouped = new Map();
    visiblePeriods.forEach((period) => grouped.set(period.id, []));
    events.forEach((event) => {
      if (grouped.has(event.periodId)) {
        grouped.get(event.periodId).push(event);
      }
    });

    sectionsRoot.innerHTML = visiblePeriods.map((period) => `
      <section class="period-section" id="period-${escapeHtml(period.id)}">
        <div class="period-head">
          <div>
            <span class="eyebrow">${escapeHtml(period.label || period.short || period.id.toUpperCase())}</span>
            <h2>${escapeHtml(period.range || period.short || period.id.toUpperCase())}</h2>
          </div>
          <div class="period-meta">
            <strong>${period.count}</strong>
            <span>major event${period.count === 1 ? "" : "s"}</span>
          </div>
        </div>
        <div class="event-grid">
          ${(grouped.get(period.id) || []).map((event) => `
            <article class="event-card" id="${escapeHtml(event.id)}">
              <div class="event-topline">
                <span class="year-badge">${escapeHtml(event.year)}</span>
                <span class="event-category">${escapeHtml(event.category)}</span>
              </div>
              <h3>${escapeHtml(event.title)}</h3>
              <p class="event-summary">${escapeHtml(event.summary)}</p>
              <div class="event-block">
                <p class="block-label">Specific Evidence</p>
                <ul class="evidence-list">
                  ${(event.evidence || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
                </ul>
              </div>
              <div class="angle-row">
                ${(event.essayAngles || []).map((angle) => `<span class="angle-chip">${escapeHtml(angle)}</span>`).join("")}
              </div>
            </article>
          `).join("")}
        </div>
      </section>
    `).join("");
  };

  const resetFilters = () => {
    state.query = "";
    state.activePeriod = "all";
    state.activeCategory = "all";
    if (searchInput) {
      searchInput.value = "";
    }
    render();
  };

  const render = () => {
    const events = getFilteredEvents();
    const visiblePeriods = getVisiblePeriods(events);
    renderPeriodFilters();
    renderCategoryFilters();
    renderJumpLinks(visiblePeriods);
    renderSummary(events, visiblePeriods);
    renderSections(events, visiblePeriods);

    if (clearButton) {
      clearButton.disabled = !normalize(state.query) && state.activePeriod === "all" && state.activeCategory === "all";
    }
  };

  periodFilters?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-period-filter]");
    if (!button) {
      return;
    }

    state.activePeriod = button.dataset.periodFilter || "all";
    render();
  });

  categoryFilters?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category-filter]");
    if (!button) {
      return;
    }

    state.activeCategory = button.dataset.categoryFilter || "all";
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
