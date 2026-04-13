(window.chapterDataReady || Promise.resolve()).then(() => {
const themeLabels = {
  nat: "American and National Identity",
  pol: "Politics and Power",
  wxt: "Work, Exchange, and Technology",
  cul: "Culture and Society",
  mig: "Migration and Settlement",
  geo: "Geography and Environment",
  wor: "America in the World"
};

const themeKeyMap = {
  "American and National Identity": "nat",
  "Politics and Power": "pol",
  "Work, Exchange, Technology": "wxt",
  "Work, Exchange, and Technology": "wxt",
  "Culture and Society": "cul",
  "Migration and Settlement": "mig",
  "Geography and Environment": "geo",
  "America in the World": "wor"
};

const subtopics = [
  { key: "overview", label: "Overview" },
  { key: "context", label: "Historical Context" },
  { key: "events", label: "Key Events" },
  { key: "figures", label: "Key Figures" },
  { key: "vocabulary", label: "Vocabulary" },
  { key: "essay", label: "Essay Tips" }
];

const alphabet = ["All", ...Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index))];

const chapterConfigs = (window.getChapterConfigs ? window.getChapterConfigs() : [])
  .map(({ id, short, data }) => ({ id, short, data }))
  .filter((entry) => entry.data?.chapterMeta && entry.data?.notes);

const parseWeightValue = (label) => {
  const values = String(label || "").match(/\d+/g);
  if (!values || !values.length) {
    return 0;
  }

  return Number(values[values.length - 1]);
};

const toThemeKeys = (themes = []) => Array.from(
  new Set(themes.map((theme) => themeKeyMap[theme]).filter(Boolean))
);

const mergeThemeKeys = (sections = [], fallback = []) => {
  const keys = new Set(fallback);
  sections.forEach((section) => {
    toThemeKeys(section.apThemes).forEach((key) => keys.add(key));
  });
  return Array.from(keys);
};

const buildNotesPeriod = ({ id, short, data }) => {
  const sections = data.notes.sections || [];
  const figureMap = new Map();

  sections.forEach((section) => {
    (section.keyFigures || []).forEach((figure) => {
      if (!figureMap.has(figure.name)) {
        figureMap.set(figure.name, {
          name: figure.name,
          role: figure.title,
          bio: figure.bio,
          significance: figure.significance,
          perspective: figure.perspective,
          impact: figure.significance || figure.perspective || figure.title
        });
      }
    });
  });

  return {
    id,
    short,
    navTitle: data.chapterMeta.chapterTitle,
    title: data.chapterMeta.chapterTitle,
    range: data.chapterMeta.dateRange,
    weightLabel: data.chapterMeta.apExamWeight,
    weightValue: parseWeightValue(data.chapterMeta.apExamWeight),
    overview: data.chapterMeta.oneLineSummary,
    bigThemes: data.chapterMeta.bigPictureThemes || [],
    examTips: data.chapterMeta.examTips || [],
    sectionThemes: {
      context: mergeThemeKeys(sections, ["wor", "pol", "mig"]),
      events: mergeThemeKeys(sections, ["wor", "pol", "cul"]),
      figures: mergeThemeKeys(sections, ["wor", "pol", "nat"]),
      vocabulary: mergeThemeKeys(sections, ["wor", "pol", "cul"]),
      essay: mergeThemeKeys(sections, ["pol", "wor", "nat"])
    },
    context: data.notes.historicalContext?.overview || "",
    contextHighlights: [
      {
        title: "Preceding Causes",
        items: data.notes.historicalContext?.precedingCauses || []
      },
      {
        title: "Geographic Context",
        text: data.notes.historicalContext?.geographicContext || ""
      }
    ],
    events: sections.map((section, index) => ({
      title: section.sectionTitle,
      date: `Section ${index + 1}`,
      meta: (section.apThemes || []).join(" · "),
      description: section.narrative,
      significance: section.significance,
      causes: section.causes || [],
      effects: section.effects || [],
      connections: section.connections || [],
      sources: section.primarySourceConnections || []
    })),
    figures: Array.from(figureMap.values()),
    vocabulary: (data.vocabulary || []).map((item) => ({
      term: item.term,
      definition: item.definition,
      context: item.context,
      apRelevance: item.apRelevance
    })),
    essay: {
      intro: data.notes.overarchingAnalysis?.complexity || "",
      prompts: [
        ...(data.essayPractice?.saq || []).map((item) => item.prompt),
        ...(data.essayPractice?.leq || []).map((item) => item.prompt),
        ...(data.essayPractice?.dbq || []).map((item) => item.prompt)
      ],
      theses: [
        ...(data.essayPractice?.leq || []).flatMap((item) => item.thesisExamples || []),
        ...(data.essayPractice?.dbq || []).map((item) => item.thesisExample).filter(Boolean)
      ],
      analysis: [
        data.notes.overarchingAnalysis?.continuity ? `Continuity: ${data.notes.overarchingAnalysis.continuity}` : "",
        data.notes.overarchingAnalysis?.change ? `Change: ${data.notes.overarchingAnalysis.change}` : "",
        ...(data.notes.overarchingAnalysis?.comparisonAngles || [])
      ].filter(Boolean)
    }
  };
};

const periods = chapterConfigs.map(buildNotesPeriod);
const maxWeightValue = Math.max(1, ...periods.map((period) => period.weightValue));

const navTree = document.getElementById("nav-tree");
const notesContent = document.getElementById("notes-content");
const miniToc = document.getElementById("mini-toc");
const tocIndicator = document.getElementById("toc-indicator");
const progressBar = document.getElementById("reading-progress");
const heroEyebrow = document.getElementById("notes-hero-eyebrow");
const heroTitle = document.getElementById("notes-hero-title");
const heroSubtitle = document.getElementById("notes-hero-subtitle");
const heroChapters = document.getElementById("notes-hero-chapters");
const heroSections = document.getElementById("notes-hero-sections");
const heroVocabulary = document.getElementById("notes-hero-vocab");

const defaultPeriodId = periods[0]?.id || "ch19";

const state = {
  activeSectionId: `${defaultPeriodId}-overview`,
  currentPeriodId: defaultPeriodId,
  openPeriods: new Set(defaultPeriodId ? [defaultPeriodId] : []),
  vocabFilters: Object.fromEntries(periods.map((period) => [period.id, "All"]))
};

let sectionAnchors = [];

const escapeHtml = (value) => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const renderThemeChips = (themeKeys) => themeKeys
  .map((key) => `<span class="theme-chip">${escapeHtml(themeLabels[key])}</span>`)
  .join("");

const renderSectionHeading = (title, themeKeys) => `
  <div class="section-heading">
    <h3>${escapeHtml(title)}</h3>
    <div class="theme-meta">
      <p class="theme-meta-label">APUSH Themes</p>
      <div class="theme-row">${renderThemeChips(themeKeys)}</div>
    </div>
  </div>
`;

const updateHero = () => {
  const totalSections = periods.reduce((sum, period) => sum + period.events.length, 0);
  const totalVocabulary = periods.reduce((sum, period) => sum + period.vocabulary.length, 0);

  if (heroEyebrow) {
    heroEyebrow.textContent = periods.length === 1 ? `${periods[0].short} Study Notes` : `${periods.length} Live Chapters`;
  }

  if (heroTitle) {
    heroTitle.textContent = periods.length === 1 ? periods[0].title : "Integrated APUSH Chapter Notes";
  }

  if (heroSubtitle) {
    heroSubtitle.textContent = periods.length === 1
      ? `${periods[0].short} only: section analysis, figures, vocabulary, and essay-ready review cues built from the integrated textbook chapter.`
      : `Study ${periods.length} live chapters together with source-backed notes, section explainers, key figures, vocabulary, and essay-ready synthesis.`;
  }

  if (heroChapters) {
    heroChapters.textContent = String(periods.length);
  }

  if (heroSections) {
    heroSections.textContent = String(totalSections);
  }

  if (heroVocabulary) {
    heroVocabulary.textContent = String(totalVocabulary);
  }
};

const renderPeriod = (period) => {
  const weightWidth = Math.min(100, (period.weightValue / maxWeightValue) * 100);
  const vocabLetters = new Set(period.vocabulary.map((item) => item.term.charAt(0).toUpperCase()));
  const examTipsMarkup = (period.examTips || []).length
    ? `
      <div class="significance-callout">
        <strong>Exam Tips</strong>
        <ul class="arrow-list">
          ${(period.examTips || []).map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}
        </ul>
      </div>
    `
    : "";
  const contextHighlightsMarkup = (period.contextHighlights || []).length
    ? `
      <div class="arrow-grid">
        ${(period.contextHighlights || []).map((block) => `
          <div class="arrow-block">
            <h5>${escapeHtml(block.title)}</h5>
            ${block.items?.length
              ? `<ul class="arrow-list">${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
              : `<p>${escapeHtml(block.text || "")}</p>`}
          </div>
        `).join("")}
      </div>
    `
    : "";

  const eventsMarkup = period.events.map((event) => `
    <article class="event-card">
      <div class="event-head">
        <div>
          <h4>${escapeHtml(event.title)}</h4>
          ${event.meta ? `<div class="event-kicker">${escapeHtml(event.meta)}</div>` : ""}
        </div>
        <span class="event-date">${escapeHtml(event.date)}</span>
      </div>
      <p>${escapeHtml(event.description)}</p>
      <div class="significance-callout">
        <strong>Significance</strong>
        <p>${escapeHtml(event.significance)}</p>
      </div>
      <div class="arrow-grid">
        <div class="arrow-block">
          <h5>Causes</h5>
          <ul class="arrow-list">
            ${event.causes.map((cause) => `<li>&rarr; ${escapeHtml(cause)}</li>`).join("")}
          </ul>
        </div>
        <div class="arrow-block">
          <h5>Effects</h5>
          <ul class="arrow-list">
            ${event.effects.map((effect) => `<li>&rarr; ${escapeHtml(effect)}</li>`).join("")}
          </ul>
        </div>
        ${event.connections?.length ? `
          <div class="arrow-block">
            <h5>Connections</h5>
            <ul class="arrow-list">
              ${event.connections.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          </div>
        ` : ""}
        ${event.sources?.length ? `
          <div class="arrow-block">
            <h5>Primary Sources</h5>
            <ul class="arrow-list">
              ${event.sources.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          </div>
        ` : ""}
      </div>
    </article>
  `).join("");

  const figuresMarkup = period.figures.map((figure) => `
    <article class="figure-card">
      <h4>${escapeHtml(figure.name)}</h4>
      <div class="figure-role">${escapeHtml(figure.role)}</div>
      <p>${escapeHtml(figure.bio)}</p>
      ${figure.significance ? `<p class="figure-extra"><strong>Significance:</strong> ${escapeHtml(figure.significance)}</p>` : ""}
      ${figure.perspective ? `<p class="figure-extra"><strong>Perspective:</strong> ${escapeHtml(figure.perspective)}</p>` : ""}
      <span class="impact-badge">${escapeHtml(figure.impact)}</span>
    </article>
  `).join("");

  const vocabFilterMarkup = alphabet.map((letter) => {
    if (letter === "All") {
      return `<button class="vocab-letter is-active" type="button" data-period="${period.id}" data-letter="All">All</button>`;
    }

    const hasTerms = vocabLetters.has(letter);
    return `<button class="vocab-letter" type="button" data-period="${period.id}" data-letter="${letter}"${hasTerms ? "" : " disabled"}>${letter}</button>`;
  }).join("");

  const vocabMarkup = period.vocabulary.map((item) => `
    <article class="vocab-row" data-letter="${escapeHtml(item.term.charAt(0).toUpperCase())}" data-period="${period.id}">
      <div class="term">${escapeHtml(item.term)}</div>
      <div>
        <div class="definition">${escapeHtml(item.definition)}</div>
        ${item.context ? `<div class="definition definition-note"><strong>Context:</strong> ${escapeHtml(item.context)}</div>` : ""}
        ${item.apRelevance ? `<div class="definition definition-note"><strong>AP Relevance:</strong> ${escapeHtml(item.apRelevance)}</div>` : ""}
      </div>
    </article>
  `).join("");

  return `
    <section class="period-section" id="${period.id}">
      <article class="period-header-card section-anchor" id="${period.id}-overview" data-period="${period.id}" data-label="Overview">
        <div class="period-topline">
          <div class="period-kicker">
            <span class="period-number">${escapeHtml(period.short)}</span>
            <span class="period-range">${escapeHtml(period.range)}</span>
          </div>
          <div class="period-weight">
            <span><strong>Exam Weight</strong><em>${escapeHtml(period.weightLabel)}</em></span>
            <div class="weight-track"><div class="weight-bar" style="width:${weightWidth}%"></div></div>
          </div>
        </div>
        <h2>${escapeHtml(period.title)}</h2>
        <p>${escapeHtml(period.overview)}</p>
        <div class="big-theme-row">
          ${period.bigThemes.map((theme) => `<span class="big-theme">${escapeHtml(theme)}</span>`).join("")}
        </div>
        ${examTipsMarkup}
      </article>

      <article class="notes-section section-anchor" id="${period.id}-context" data-period="${period.id}" data-label="Historical Context">
        ${renderSectionHeading("Historical Context", period.sectionThemes.context)}
        <p class="section-intro">${escapeHtml(period.context)}</p>
        ${contextHighlightsMarkup}
      </article>

      <article class="notes-section section-anchor" id="${period.id}-events" data-period="${period.id}" data-label="Key Events">
        ${renderSectionHeading("Key Events", period.sectionThemes.events)}
        <div class="event-stack">${eventsMarkup}</div>
      </article>

      <article class="notes-section section-anchor" id="${period.id}-figures" data-period="${period.id}" data-label="Key Figures">
        ${renderSectionHeading("Key Figures", period.sectionThemes.figures)}
        <div class="figure-grid">${figuresMarkup}</div>
      </article>

      <article class="notes-section section-anchor" id="${period.id}-vocabulary" data-period="${period.id}" data-label="Vocabulary">
        ${renderSectionHeading("Key Vocabulary", period.sectionThemes.vocabulary)}
        <div class="vocab-filter" data-filter-period="${period.id}">
          ${vocabFilterMarkup}
        </div>
        <div class="vocab-list">${vocabMarkup}</div>
      </article>

      <article class="notes-section section-anchor" id="${period.id}-essay" data-period="${period.id}" data-label="Essay Tips">
        ${renderSectionHeading("Essay Tips", period.sectionThemes.essay)}
        <div class="essay-callout">
          <p>${escapeHtml(period.essay.intro || "Use these prompts to move from recall to argument. The strongest answers connect chronology, change over time, and causation instead of listing facts.")}</p>
          <div class="essay-grid">
            <div class="essay-block">
              <h4>Practice Prompts</h4>
              <ul class="essay-list">
                ${period.essay.prompts.map((prompt) => `<li>${escapeHtml(prompt)}</li>`).join("")}
              </ul>
            </div>
            <div class="essay-block">
              <h4>LEQ Thesis Models</h4>
              <ul class="essay-list">
                ${period.essay.theses.map((thesis) => `<li>${escapeHtml(thesis)}</li>`).join("")}
              </ul>
            </div>
            ${period.essay.analysis?.length ? `
              <div class="essay-block">
                <h4>Analysis Angles</h4>
                <ul class="essay-list">
                  ${period.essay.analysis.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
                </ul>
              </div>
            ` : ""}
          </div>
        </div>
      </article>
    </section>
  `;
};

const renderNotes = () => {
  notesContent.innerHTML = periods.map(renderPeriod).join("");
  sectionAnchors = Array.from(document.querySelectorAll(".section-anchor"));
};

const renderNavTree = () => {
  navTree.innerHTML = periods.map((period) => {
    const periodNumber = String(period.short).match(/\d+/)?.[0] || String(period.short).replace(/\D+/g, "");

    return `
      <section class="nav-period" data-period="${period.id}">
        <button class="nav-period-toggle" type="button" data-action="toggle-period" data-period="${period.id}">
          <span class="nav-period-main">
            <span class="nav-period-code"><small>Ch</small><strong>${escapeHtml(periodNumber || period.short)}</strong></span>
            <span class="nav-period-copy">
              <strong>${escapeHtml(period.title)}</strong>
              <span>${escapeHtml(period.range)}</span>
            </span>
          </span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6"></path>
          </svg>
        </button>
        <div class="nav-subtopics">
          <div class="nav-subtopic-list">
            ${subtopics.map((subtopic) => {
              const targetId = `${period.id}-${subtopic.key}`;
              return `<a class="nav-subtopic" href="#${targetId}" data-target-id="${targetId}">${escapeHtml(subtopic.label)}</a>`;
            }).join("")}
          </div>
        </div>
      </section>
    `;
  }).join("");
};

const renderMiniToc = () => {
  miniToc.innerHTML = periods.map((period) => `
    <a class="toc-link" href="#${period.id}-overview" data-period="${period.id}">
      ${escapeHtml(period.short)} · ${escapeHtml(period.navTitle)}
    </a>
  `).join("");

  updateMiniTocState();
};

const updateNavTreeState = () => {
  const periodNodes = navTree.querySelectorAll(".nav-period");
  const subtopicLinks = navTree.querySelectorAll(".nav-subtopic");

  periodNodes.forEach((node) => {
    const isOpen = state.openPeriods.has(node.dataset.period);
    const isCurrent = state.currentPeriodId === node.dataset.period;
    node.classList.toggle("is-open", isOpen);
    node.classList.toggle("is-current", isCurrent);
  });

  subtopicLinks.forEach((link) => {
    link.classList.toggle("is-active", link.dataset.targetId === state.activeSectionId);
  });
};

const updateMiniTocState = () => {
  const tocLinks = miniToc.querySelectorAll(".toc-link");
  tocLinks.forEach((link) => {
    link.classList.toggle("is-active", link.dataset.period === state.currentPeriodId);
  });

  updateTocIndicator();
};

const updateTocIndicator = () => {
  const activeLink = miniToc.querySelector(".toc-link.is-active");

  if (!activeLink) {
    tocIndicator.style.opacity = "0";
    return;
  }

  const y = activeLink.offsetTop + (activeLink.offsetHeight / 2) - 4;
  tocIndicator.style.opacity = "1";
  tocIndicator.style.transform = `translate(-13px, ${y}px)`;
};

const updateVocabPeriod = (periodId) => {
  const activeLetter = state.vocabFilters[periodId];
  const filterButtons = notesContent.querySelectorAll(`.vocab-letter[data-period="${periodId}"]`);
  const rows = notesContent.querySelectorAll(`.vocab-row[data-period="${periodId}"]`);

  filterButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.letter === activeLetter);
  });

  rows.forEach((row) => {
    const shouldHide = activeLetter !== "All" && row.dataset.letter !== activeLetter;
    row.classList.toggle("is-hidden", shouldHide);
  });
};

const updateAllVocabFilters = () => {
  periods.forEach((period) => updateVocabPeriod(period.id));
};

const updateReadingProgress = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable <= 0 ? 0 : window.scrollY / scrollable;
  progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
};

const getAnchorMetrics = () => sectionAnchors.map((anchor) => ({
  anchor,
  top: anchor.getBoundingClientRect().top + window.scrollY
}));

const pickCurrentSection = () => {
  if (!sectionAnchors.length) {
    return null;
  }

  if (window.scrollY <= 32) {
    return sectionAnchors[0];
  }

  const anchorMetrics = getAnchorMetrics().filter((metric) => Number.isFinite(metric.top));
  const hasReliableLayout = anchorMetrics.every((metric, index) => (
    index === 0 || metric.top > anchorMetrics[index - 1].top
  ));

  if (!anchorMetrics.length || !hasReliableLayout) {
    return sectionAnchors[0];
  }

  const marker = window.scrollY + 150;
  let currentSection = anchorMetrics[0].anchor;

  anchorMetrics.forEach((metric) => {
    if (metric.top <= marker) {
      currentSection = metric.anchor;
    }
  });

  return currentSection;
};

const syncScrollState = () => {
  const currentSection = pickCurrentSection();

  if (!currentSection) {
    return;
  }

  const nextSectionId = currentSection.id;
  const nextPeriodId = currentSection.dataset.period;
  const sectionChanged = nextSectionId !== state.activeSectionId;
  const periodChanged = nextPeriodId !== state.currentPeriodId;

  state.activeSectionId = nextSectionId;
  state.currentPeriodId = nextPeriodId;
  state.openPeriods.add(nextPeriodId);

  if (sectionChanged || periodChanged) {
    updateNavTreeState();
    updateMiniTocState();
    return;
  }

  updateTocIndicator();
};

const handleNavPanelClick = (event) => {
  const toggle = event.target.closest("[data-action='toggle-period']");

  if (!toggle) {
    return;
  }

  const { period } = toggle.dataset;

  if (state.openPeriods.has(period)) {
    state.openPeriods.delete(period);
  } else {
    state.openPeriods.add(period);
  }

  updateNavTreeState();
};

const handleNotesClick = (event) => {
  const button = event.target.closest(".vocab-letter");

  if (!button || button.disabled) {
    return;
  }

  const { period, letter } = button.dataset;
  state.vocabFilters[period] = letter;
  updateVocabPeriod(period);
};

updateHero();
renderNotes();
renderNavTree();
renderMiniToc();
updateAllVocabFilters();
updateNavTreeState();

document.getElementById("nav-panel").addEventListener("click", handleNavPanelClick);
notesContent.addEventListener("click", handleNotesClick);

window.addEventListener("scroll", () => {
  updateReadingProgress();
  syncScrollState();
}, { passive: true });

window.addEventListener("resize", () => {
  updateTocIndicator();
  updateReadingProgress();
  syncScrollState();
});

const initializeNotesLayout = () => {
  updateReadingProgress();
  syncScrollState();
};

window.requestAnimationFrame(initializeNotesLayout);
window.addEventListener("load", initializeNotesLayout);

if (document.fonts?.ready) {
  document.fonts.ready.then(initializeNotesLayout);
}
}).catch((error) => {
  console.error("Failed to initialize chapter data on the notes page.", error);
});
