(function () {
  const STORAGE_KEY = "apush-progress-check-v1";
  const FILTERS = [
    { key: "all", label: "All Sections" },
    { key: "untouched", label: "Not Checked" },
    { key: "review", label: "Needs Review" },
    { key: "ready", label: "Ready" }
  ];
  const SUPPORT_LINKS = [
    { key: "overview", label: "Overview" },
    { key: "context", label: "Historical Context" },
    { key: "figures", label: "Key Figures" },
    { key: "vocabulary", label: "Vocabulary" },
    { key: "essay", label: "Essay Tips" }
  ];

  const state = {
    chapters: [],
    filter: "all",
    statusMap: loadStatusMap(),
    initialized: false
  };

  const heroChapters = document.getElementById("progress-hero-chapters");
  const heroSections = document.getElementById("progress-hero-sections");
  const heroReady = document.getElementById("progress-hero-ready");
  const heroReview = document.getElementById("progress-hero-review");
  const heroSubtitle = document.getElementById("progress-hero-subtitle");
  const overallProgressPercent = document.getElementById("overall-progress-percent");
  const overallProgressCopy = document.getElementById("overall-progress-copy");
  const overallProgressBar = document.getElementById("overall-progress-bar");
  const overallProgressNote = document.getElementById("overall-progress-note");
  const filterRow = document.getElementById("progress-filter-row");
  const chapterJumps = document.getElementById("chapter-jumps");
  const progressBoard = document.getElementById("progress-board");

  const escapeHtml = (value) => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const normalizeCopy = (value) => String(value || "")
    .replace(/\s+/g, " ")
    .trim();

  const slugifyFragment = (value) => String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const SEARCH_STOP_WORDS = new Set([
    "a",
    "an",
    "and",
    "as",
    "at",
    "by",
    "for",
    "from",
    "in",
    "into",
    "of",
    "on",
    "or",
    "the",
    "to",
    "with"
  ]);

  const normalizeStatus = (value) => (value === "review" || value === "ready" ? value : "");

  function loadStatusMap() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
      return Object.fromEntries(
        Object.entries(parsed || {}).filter(([, value]) => normalizeStatus(value))
      );
    } catch (error) {
      return {};
    }
  }

  function saveStatusMap() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.statusMap));
  }

  function normalizeSearchText(value) {
    return normalizeCopy(value)
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ");
  }

  function buildSearchTokens(value) {
    return normalizeSearchText(value)
      .split(" ")
      .filter((token) => token && !SEARCH_STOP_WORDS.has(token));
  }

  function buildAcronym(value) {
    return String(value || "")
      .split(/[^A-Za-z0-9]+/)
      .filter((part) => /^[A-Za-z]/.test(part) && !SEARCH_STOP_WORDS.has(part.toLowerCase()))
      .map((part) => part[0].toUpperCase())
      .join("");
  }

  function collectSectionText(section) {
    return [
      section.sectionTitle,
      section.narrative,
      section.significance,
      ...(section.causes || []),
      ...(section.effects || []),
      ...(section.connections || [])
    ]
      .map(normalizeCopy)
      .filter(Boolean)
      .join(" ");
  }

  function buildSectionSummary(section) {
    const narrative = normalizeCopy(section.narrative);
    if (narrative) {
      return narrative;
    }

    const summaryParts = [];
    if (Array.isArray(section.causes) && section.causes.length) {
      summaryParts.push(`Key drivers: ${section.causes.slice(0, 2).map(normalizeCopy).filter(Boolean).join("; ")}`);
    }
    if (Array.isArray(section.effects) && section.effects.length) {
      summaryParts.push(`Major results: ${section.effects.slice(0, 2).map(normalizeCopy).filter(Boolean).join("; ")}`);
    }
    if (section.significance) {
      summaryParts.push(normalizeCopy(section.significance));
    }

    return summaryParts.join(" ");
  }

  function buildSectionDigest(items, maxItems = 2) {
    return (Array.isArray(items) ? items : [])
      .map(normalizeCopy)
      .filter(Boolean)
      .slice(0, maxItems)
      .join(" ");
  }

  function scoreVocabularyMatch(section, vocabEntry) {
    const term = normalizeCopy(vocabEntry?.term);
    if (!term) {
      return 0;
    }

    const sectionSource = normalizeSearchText(collectSectionText(section));
    const sectionTitle = normalizeSearchText(section.sectionTitle);
    const normalizedTerm = normalizeSearchText(term);
    const normalizedHaystack = ` ${sectionSource} `;
    const normalizedTitle = ` ${sectionTitle} `;
    const exactPhrase = normalizedHaystack.includes(` ${normalizedTerm} `);
    const exactTitle = normalizedTitle.includes(` ${normalizedTerm} `);
    const tokens = buildSearchTokens(term);
    const matchedTokenCount = tokens.filter((token) => normalizedHaystack.includes(` ${token} `)).length;
    const acronym = buildAcronym(term);
    const acronymMatch = acronym.length > 1 && normalizedHaystack.includes(` ${acronym.toLowerCase()} `);
    const qualifies = exactPhrase
      || exactTitle
      || acronymMatch
      || (tokens.length === 1 && matchedTokenCount === 1)
      || (tokens.length > 1 && matchedTokenCount >= Math.min(tokens.length, 2));

    if (!qualifies) {
      return 0;
    }

    let score = 0;
    if (exactPhrase) {
      score += 120;
    }
    if (exactTitle) {
      score += 90;
    }
    if (acronymMatch) {
      score += 80;
    }
    score += matchedTokenCount * 14;
    return score;
  }

  function getSectionKeyTerms(section, vocabulary) {
    return (Array.isArray(vocabulary) ? vocabulary : [])
      .map((entry, index) => ({
        term: normalizeCopy(entry?.term),
        score: scoreVocabularyMatch(section, entry),
        index
      }))
      .filter((entry) => entry.term && entry.score > 0)
      .sort((left, right) => right.score - left.score || left.index - right.index)
      .slice(0, 6)
      .map((entry) => entry.term);
  }

  function buildNotesHref(chapterId, sectionKey = "overview", hash = "") {
    const params = new URLSearchParams({ chapter: chapterId });
    if (sectionKey && sectionKey !== "overview") {
      params.set("section", sectionKey);
    }

    const targetHash = hash || `${chapterId}-${sectionKey || "overview"}`;
    return `notes.html?${params.toString()}#${targetHash}`;
  }

  function buildEventId(chapterId, title, index) {
    const slug = slugifyFragment(title) || `section-${index + 1}`;
    return `${chapterId}-event-${slug}-${index + 1}`;
  }

  function buildSectionAnchorId(sectionId) {
    return `review-${sectionId}`;
  }

  function getStatusMeta(status) {
    if (status === "review") {
      return {
        label: "Needs Review",
        className: "is-review",
        helper: "Flagged for another pass in the detailed notes."
      };
    }

    if (status === "ready") {
      return {
        label: "Ready",
        className: "is-ready",
        helper: "Marked as solid for final review."
      };
    }

    return {
      label: "Not Checked",
      className: "is-untouched",
      helper: "Open the notes if this section still feels uncertain."
    };
  }

  function buildReviewChapter(entry) {
    const { id, short, data } = entry;
    const vocabulary = Array.isArray(data.vocabulary) ? data.vocabulary : [];
    const sections = (data.notes?.sections || []).map((section, index) => {
      const sectionId = buildEventId(id, section.sectionTitle, index);
      return {
        id: sectionId,
        anchorId: buildSectionAnchorId(sectionId),
        chapterId: id,
        title: section.sectionTitle,
        index: index + 1,
        preview: buildSectionSummary(section),
        significance: section.significance || "",
        cue: section.significance || section.effects?.[0] || section.causes?.[0] || "",
        drivers: buildSectionDigest(section.causes, 2),
        consequences: buildSectionDigest(section.effects, 2),
        keyTerms: getSectionKeyTerms(section, vocabulary),
        themes: section.apThemes || [],
        href: buildNotesHref(id, "events", sectionId)
      };
    });
    const analysis = data.notes?.overarchingAnalysis || {};
    const reviewBullets = (data.chapterMeta?.examTips || []).slice(0, 3);

    if (!reviewBullets.length) {
      if (analysis.continuity) {
        reviewBullets.push(`Continuity: ${analysis.continuity}`);
      }
      if (analysis.change) {
        reviewBullets.push(`Change: ${analysis.change}`);
      }
      (analysis.comparisonAngles || []).slice(0, 2).forEach((item) => reviewBullets.push(item));
    }

    return {
      id,
      short,
      title: data.chapterMeta?.chapterTitle || entry.title || short,
      range: data.chapterMeta?.dateRange || "",
      weightLabel: data.chapterMeta?.apExamWeight || "",
      summary: data.chapterMeta?.oneLineSummary || "",
      reviewFocus: analysis.complexity || data.notes?.historicalContext?.overview || data.chapterMeta?.oneLineSummary || "",
      themes: data.chapterMeta?.bigPictureThemes || [],
      vocabularyCount: vocabulary.length,
      reviewBullets,
      supportLinks: SUPPORT_LINKS.map((link) => ({
        label: link.label,
        href: buildNotesHref(id, link.key)
      })),
      sections
    };
  }

  function getSectionStatus(sectionId) {
    return normalizeStatus(state.statusMap[sectionId]);
  }

  function getOverallCounts() {
    return state.chapters.reduce((totals, chapter) => {
      chapter.sections.forEach((section) => {
        const status = getSectionStatus(section.id);
        totals.total += 1;
        if (status === "ready") {
          totals.ready += 1;
        } else if (status === "review") {
          totals.review += 1;
        } else {
          totals.untouched += 1;
        }
      });
      return totals;
    }, {
      total: 0,
      ready: 0,
      review: 0,
      untouched: 0
    });
  }

  function getChapterCounts(chapter) {
    return chapter.sections.reduce((totals, section) => {
      const status = getSectionStatus(section.id);
      totals.total += 1;
      if (status === "ready") {
        totals.ready += 1;
      } else if (status === "review") {
        totals.review += 1;
      } else {
        totals.untouched += 1;
      }
      return totals;
    }, {
      total: 0,
      ready: 0,
      review: 0,
      untouched: 0
    });
  }

  function getFilterCount(filterKey) {
    const counts = getOverallCounts();
    if (filterKey === "review") {
      return counts.review;
    }
    if (filterKey === "ready") {
      return counts.ready;
    }
    if (filterKey === "untouched") {
      return counts.untouched;
    }
    return counts.total;
  }

  function matchesFilter(status) {
    if (state.filter === "all") {
      return true;
    }
    if (state.filter === "untouched") {
      return !status;
    }
    return status === state.filter;
  }

  function renderFilterControls() {
    filterRow.innerHTML = FILTERS.map((filter) => {
      const isActive = filter.key === state.filter;
      return `
        <button
          class="filter-chip${isActive ? " is-active" : ""}"
          type="button"
          data-filter="${escapeHtml(filter.key)}"
          aria-pressed="${isActive ? "true" : "false"}"
        >
          <span>${escapeHtml(filter.label)}</span>
          <strong>${escapeHtml(getFilterCount(filter.key))}</strong>
        </button>
      `;
    }).join("");
  }

  function renderHeroStats() {
    const counts = getOverallCounts();
    const completionPercent = counts.total ? Math.round((counts.ready / counts.total) * 100) : 0;

    if (heroChapters) {
      heroChapters.textContent = String(state.chapters.length);
    }
    if (heroSections) {
      heroSections.textContent = String(counts.total);
    }
    if (heroReady) {
      heroReady.textContent = String(counts.ready);
    }
    if (heroReview) {
      heroReview.textContent = String(counts.review);
    }
    if (heroSubtitle) {
      if (counts.review > 0) {
        heroSubtitle.textContent = `${completionPercent}% of your final-review sections are marked ready. Use the amber cards to jump straight into anything that still feels weak.`;
      } else if (counts.untouched > 0) {
        heroSubtitle.textContent = `${completionPercent}% of your final-review sections are marked ready. The remaining unchecked sections are where you should test real understanding instead of scrolling.`;
      } else {
        heroSubtitle.textContent = `Every live review section has been checked. Use the page for a final sweep and jump into notes only where precision still matters.`;
      }
    }
  }

  function renderOverallRail() {
    const counts = getOverallCounts();
    const completionPercent = counts.total ? Math.round((counts.ready / counts.total) * 100) : 0;

    overallProgressPercent.textContent = `${completionPercent}%`;
    overallProgressCopy.textContent = `${counts.ready} of ${counts.total} sections marked ready`;
    overallProgressBar.style.width = `${completionPercent}%`;

    if (counts.review > 0) {
      overallProgressNote.textContent = `${counts.review} sections are still flagged. Clear those first, then use the unchecked stack for one last confidence pass.`;
      return;
    }

    if (counts.untouched > 0) {
      overallProgressNote.textContent = `${counts.untouched} sections have not been checked yet. Mark them only after you can explain them without the notes open.`;
      return;
    }

    overallProgressNote.textContent = "All sections have been reviewed. Reopen only the cards that still need one final evidence or chronology refresh.";
  }

  function renderChapterJumps() {
    chapterJumps.innerHTML = state.chapters.map((chapter) => {
      const counts = getChapterCounts(chapter);
      const completionPercent = counts.total ? Math.round((counts.ready / counts.total) * 100) : 0;
      const stateClass = counts.review ? "has-review" : counts.ready === counts.total ? "is-ready" : "";
      return `
        <a class="jump-card ${stateClass}" href="#review-${escapeHtml(chapter.id)}">
          <div class="jump-card-head">
            <span>${escapeHtml(chapter.short)}</span>
            <strong>${completionPercent}%</strong>
          </div>
          <strong class="jump-card-title">${escapeHtml(chapter.title)}</strong>
          <span class="jump-card-copy">${counts.ready}/${counts.total} ready · ${counts.review} flagged</span>
          <span class="jump-meter"><span style="width:${completionPercent}%"></span></span>
        </a>
      `;
    }).join("");
  }

  function renderSupportLinks(chapter) {
    return chapter.supportLinks.map((link) => `
      <a class="support-link" href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>
    `).join("");
  }

  function renderThemeRow(themes) {
    return (themes || []).map((theme) => `<span class="theme-chip">${escapeHtml(theme)}</span>`).join("");
  }

  function renderKeyTerms(terms) {
    if (!Array.isArray(terms) || !terms.length) {
      return "";
    }

    return `
      <div class="section-vocab-block">
        <p class="section-vocab-label">Key Terms</p>
        <div class="section-vocab-row">
          ${terms.map((term) => `<span class="section-vocab-chip">${escapeHtml(term)}</span>`).join("")}
        </div>
      </div>
    `;
  }

  function renderReviewBullets(chapter) {
    if (!chapter.reviewBullets.length) {
      return `
        <li>Use the one-line summary, section cards, and note links below as the chapter’s final-review circuit.</li>
      `;
    }

    return chapter.reviewBullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  }

  function renderSectionCard(section) {
    const status = getSectionStatus(section.id);
    const meta = getStatusMeta(status);
    const reviewActive = status === "review";
    const readyActive = status === "ready";

    return `
      <article
        class="section-review-card ${meta.className}"
        id="${escapeHtml(section.anchorId)}"
        data-section-card="${escapeHtml(section.id)}"
        data-status="${escapeHtml(status || "untouched")}"
      >
        <div class="section-review-topline">
          <span class="section-order">Section ${escapeHtml(section.index)}</span>
          <span class="status-pill">${escapeHtml(meta.label)}</span>
        </div>
        <h3>
          <a class="section-title-link" href="${escapeHtml(section.href)}">${escapeHtml(section.title)}</a>
        </h3>
        <p class="section-preview">${escapeHtml(section.preview)}</p>
        ${section.drivers ? `<p class="section-detail-line"><strong>Key Drivers:</strong> ${escapeHtml(section.drivers)}</p>` : ""}
        ${section.consequences ? `<p class="section-detail-line"><strong>Consequences:</strong> ${escapeHtml(section.consequences)}</p>` : ""}
        ${renderKeyTerms(section.keyTerms)}
        <p class="section-cue"><strong>Why It Matters:</strong> ${escapeHtml(section.cue || meta.helper)}</p>
        <div class="theme-row">
          ${renderThemeRow(section.themes)}
        </div>
        <div class="section-actions">
          <button
            class="section-state-button is-review${reviewActive ? " is-active" : ""}"
            type="button"
            data-status-action="review"
            data-section-id="${escapeHtml(section.id)}"
            aria-pressed="${reviewActive ? "true" : "false"}"
          >
            Needs Review
          </button>
          <button
            class="section-state-button is-ready${readyActive ? " is-active" : ""}"
            type="button"
            data-status-action="ready"
            data-section-id="${escapeHtml(section.id)}"
            aria-pressed="${readyActive ? "true" : "false"}"
          >
            Ready
          </button>
          <a class="section-link-button" href="${escapeHtml(section.href)}">Open in Notes</a>
        </div>
      </article>
    `;
  }

  function renderChapterCard(chapter) {
    const counts = getChapterCounts(chapter);
    const completionPercent = counts.total ? Math.round((counts.ready / counts.total) * 100) : 0;
    const visibleSections = chapter.sections.filter((section) => matchesFilter(getSectionStatus(section.id)));
    const emptyCopy = state.filter === "all"
      ? "This chapter has no review sections yet."
      : "No sections in this chapter match the current filter.";

    return `
      <article class="chapter-review-card" id="review-${escapeHtml(chapter.id)}">
        <div class="chapter-review-head">
          <div>
            <div class="chapter-kicker">
              <span class="chapter-code">${escapeHtml(chapter.short)}</span>
              <span>${escapeHtml(chapter.range)}</span>
              <span class="chapter-weight">${escapeHtml(chapter.weightLabel || "Review Check")}</span>
            </div>
            <h2>${escapeHtml(chapter.title)}</h2>
            <p class="chapter-summary">${escapeHtml(chapter.summary)}</p>
          </div>
          <div class="chapter-progress-box">
            <strong>${completionPercent}% ready</strong>
            <span>${counts.ready}/${counts.total} sections marked ready</span>
            <div class="meter-track"><span style="width:${completionPercent}%"></span></div>
            <p>${counts.review} flagged · ${counts.untouched} unchecked · ${chapter.vocabularyCount} vocab terms in notes</p>
          </div>
        </div>

        <div class="chapter-overview-grid">
          <div class="focus-card">
            <p class="panel-label">Final Review Focus</p>
            <p>${escapeHtml(chapter.reviewFocus)}</p>
            <div class="theme-row">
              ${renderThemeRow(chapter.themes)}
            </div>
          </div>
          <div class="focus-card">
            <p class="panel-label">Checkpoint Prompts</p>
            <ul class="chapter-bullet-list">
              ${renderReviewBullets(chapter)}
            </ul>
          </div>
        </div>

        <div class="support-link-row">
          ${renderSupportLinks(chapter)}
        </div>

        <div class="section-grid">
          ${visibleSections.length
            ? visibleSections.map((section) => renderSectionCard(section)).join("")
            : `<div class="chapter-empty">${escapeHtml(emptyCopy)}</div>`}
        </div>
      </article>
    `;
  }

  function renderBoard() {
    if (!state.chapters.length) {
      progressBoard.innerHTML = `
        <section class="empty-state">
          <h2>No live chapters yet.</h2>
          <p>Add chapter data files to populate the Progress Check board.</p>
        </section>
      `;
      return;
    }

    progressBoard.innerHTML = state.chapters.map((chapter) => renderChapterCard(chapter)).join("");
  }

  function scrollToHashTarget() {
    const hash = String(window.location.hash || "").replace(/^#/, "");
    if (!hash) {
      return;
    }

    const target = document.getElementById(hash);
    if (!target) {
      return;
    }

    window.requestAnimationFrame(() => {
      target.scrollIntoView({ block: "start", behavior: state.initialized ? "smooth" : "auto" });
    });
  }

  function renderAll() {
    renderFilterControls();
    renderHeroStats();
    renderOverallRail();
    renderChapterJumps();
    renderBoard();
  }

  function bindEvents() {
    if (filterRow) {
      filterRow.addEventListener("click", (event) => {
        const filterButton = event.target.closest("[data-filter]");
        if (!filterButton) {
          return;
        }

        state.filter = filterButton.dataset.filter || "all";
        renderAll();
      });
    }

    if (progressBoard) {
      progressBoard.addEventListener("click", (event) => {
        const actionButton = event.target.closest("[data-status-action]");
        if (!actionButton) {
          return;
        }

        const sectionId = String(actionButton.dataset.sectionId || "");
        const nextStatus = normalizeStatus(actionButton.dataset.statusAction);
        if (!sectionId || !nextStatus) {
          return;
        }

        const currentStatus = getSectionStatus(sectionId);
        if (currentStatus === nextStatus) {
          delete state.statusMap[sectionId];
        } else {
          state.statusMap[sectionId] = nextStatus;
        }

        saveStatusMap();
        renderAll();
      });
    }

    window.addEventListener("hashchange", scrollToHashTarget);
  }

  function init() {
    const configs = typeof window.getChapterConfigs === "function" ? window.getChapterConfigs() : [];
    state.chapters = (Array.isArray(configs) ? configs : []).map(buildReviewChapter);
    renderAll();
    bindEvents();
    scrollToHashTarget();
    state.initialized = true;
  }

  Promise.resolve(window.chapterDataReady || Promise.resolve())
    .catch(() => [])
    .then(init);
})();
