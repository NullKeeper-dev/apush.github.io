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

const normalizeTerm = (value) => String(value || "").trim().toLowerCase();

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const slugifyFragment = (value) => String(value || "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

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

const buildImageLookup = (images = []) => new Map(
  images
    .filter((image) => image?.imageId && image?.src)
    .map((image) => [image.imageId, image])
);

const resolveNoteImage = (ref, imageLookup) => {
  if (!ref?.imageId) {
    return null;
  }

  const image = imageLookup.get(ref.imageId);
  if (!image) {
    return null;
  }

  return {
    ...image,
    placement: ref.placement || "after-paragraph",
    displayCaption: ref.displayCaption || image.caption || ""
  };
};

const buildNotesPeriod = ({ id, short, data }) => {
  const sections = data.notes.sections || [];
  const imageLookup = buildImageLookup(data.images || []);
  const figureMap = new Map();
  const vocabulary = (data.vocabulary || []).map((item, index) => {
    const term = String(item.term || "");
    const slug = slugifyFragment(term) || `term-${index + 1}`;
    return {
      id: `${id}-vocab-${slug}-${index + 1}`,
      key: normalizeTerm(term),
      letter: term.charAt(0).toUpperCase(),
      term,
      definition: item.definition,
      context: item.context,
      apRelevance: item.apRelevance
    };
  });
  const vocabLookup = new Map(vocabulary.map((item) => [item.key, item]));
  const vocabTerms = Array.from(new Set(vocabulary.map((item) => item.term)))
    .sort((left, right) => right.length - left.length);
  const vocabPattern = vocabTerms.length
    ? new RegExp(`\\b(${vocabTerms.map(escapeRegex).join("|")})\\b`, "gi")
    : null;

  sections.forEach((section) => {
    (section.keyFigures || []).forEach((figure) => {
      if (!figureMap.has(figure.name)) {
        figureMap.set(figure.name, {
          name: figure.name,
          role: figure.title,
          bio: figure.bio,
          significance: figure.significance,
          perspective: figure.perspective,
          image: figure.imageId ? (imageLookup.get(figure.imageId) || null) : null
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
    contextImage: resolveNoteImage(data.notes.historicalContext?.contextImage, imageLookup),
    events: sections.map((section, index) => ({
      eventId: `${id}-event-${slugifyFragment(section.sectionTitle) || `section-${index + 1}`}-${index + 1}`,
      title: section.sectionTitle,
      date: `Section ${index + 1}`,
      meta: (section.apThemes || []).join(" · "),
      description: section.narrative,
      significance: section.significance,
      causes: section.causes || [],
      effects: section.effects || [],
      connections: section.connections || [],
      sources: section.primarySourceConnections || [],
      images: (section.sectionImages || [])
        .map((imageRef) => resolveNoteImage(imageRef, imageLookup))
        .filter(Boolean)
    })),
    figures: Array.from(figureMap.values()),
    vocabulary,
    vocabLookup,
    vocabPattern,
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

const allPeriods = chapterConfigs.map(buildNotesPeriod);
const fallbackPeriodId = String(window.notesDefaultChapterId || "").toLowerCase();
const periods = fallbackPeriodId && allPeriods.some((period) => period.id === fallbackPeriodId)
  ? allPeriods.filter((period) => period.id === fallbackPeriodId)
  : allPeriods;
const maxWeightValue = Math.max(1, ...periods.map((period) => period.weightValue));
const pageUrl = new URL(window.location.href);
const requestedChapterId = String(pageUrl.searchParams.get("chapter") || "").toLowerCase();
const requestedSectionKey = String(pageUrl.searchParams.get("section") || "").toLowerCase();
const chapterEntries = (Array.isArray(window.chapterManifest) ? window.chapterManifest : []).map((entry) => ({
  id: String(entry.id || "").toLowerCase(),
  short: entry.short,
  title: entry.title
}));
const resolvedRequestedSectionKey = subtopics.some((subtopic) => subtopic.key === requestedSectionKey)
  ? requestedSectionKey
  : "overview";

const getRequestedPeriodId = () => {
  const hashMatch = pageUrl.hash.match(/^#(ch\d+)-/i);
  const hashPeriodId = hashMatch ? hashMatch[1].toLowerCase() : "";

  if (periods.some((period) => period.id === hashPeriodId)) {
    return hashPeriodId;
  }

  if (periods.some((period) => period.id === requestedChapterId)) {
    return requestedChapterId;
  }

  return "";
};

const getRequestedSectionId = () => {
  if (pageUrl.hash) {
    const sectionId = pageUrl.hash.slice(1);
    if (document.getElementById(sectionId) || sectionId) {
      return sectionId;
    }
  }

  const requestedPeriodId = getRequestedPeriodId();
  if (requestedPeriodId && requestedSectionKey) {
    return `${requestedPeriodId}-${requestedSectionKey}`;
  }

  if (requestedPeriodId) {
    return `${requestedPeriodId}-overview`;
  }

  return "";
};

const navTree = document.getElementById("nav-tree");
const notesContent = document.getElementById("notes-content");
const miniToc = document.getElementById("mini-toc");
const tocIndicator = document.getElementById("toc-indicator");
const progressBar = document.getElementById("reading-progress");
const chapterSwitcher = document.getElementById("chapter-switcher");
const heroEyebrow = document.getElementById("notes-hero-eyebrow");
const heroTitle = document.getElementById("notes-hero-title");
const heroSubtitle = document.getElementById("notes-hero-subtitle");
const heroChapters = document.getElementById("notes-hero-chapters");
const heroSections = document.getElementById("notes-hero-sections");
const heroVocabulary = document.getElementById("notes-hero-vocab");
const vocabPreview = document.getElementById("vocab-preview");
const vocabPreviewEyebrow = document.getElementById("vocab-preview-eyebrow");
const vocabPreviewTerm = document.getElementById("vocab-preview-term");
const vocabPreviewDefinition = document.getElementById("vocab-preview-definition");
const vocabPreviewContext = document.getElementById("vocab-preview-context");
const vocabPreviewJump = document.getElementById("vocab-preview-jump");
const vocabPreviewReturn = document.getElementById("vocab-preview-return");

const defaultPeriodId = getRequestedPeriodId() || periods[0]?.id || "ch19";

const state = {
  activeSectionId: getRequestedSectionId() || `${defaultPeriodId}-overview`,
  currentPeriodId: defaultPeriodId,
  openPeriods: new Set(defaultPeriodId ? [defaultPeriodId] : []),
  vocabFilters: Object.fromEntries(periods.map((period) => [period.id, "All"])),
  activeVocabPreview: null,
  noteReturnPoint: null
};

let sectionAnchors = [];
let vocabHighlightTimer = 0;
let noteLinkIdCounter = 0;

const escapeHtml = (value) => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const getPeriodById = (periodId) => periods.find((period) => period.id === periodId) || null;

const buildChapterHref = (chapterId, sectionKey = resolvedRequestedSectionKey) => {
  const queryParts = [`chapter=${encodeURIComponent(chapterId)}`];
  if (sectionKey && sectionKey !== "overview") {
    queryParts.push(`section=${encodeURIComponent(sectionKey)}`);
  }

  return `notes.html?${queryParts.join("&")}#${chapterId}-${sectionKey || "overview"}`;
};

const ensureElementId = (element, prefix = "notes-link") => {
  if (!element) {
    return "";
  }

  if (!element.id) {
    noteLinkIdCounter += 1;
    element.id = `${prefix}-${noteLinkIdCounter}`;
  }

  return element.id;
};

const renderNoteText = (value, period) => {
  const text = String(value || "");

  if (!text) {
    return "";
  }

  if (!period?.vocabPattern) {
    return escapeHtml(text);
  }

  period.vocabPattern.lastIndex = 0;
  const matches = Array.from(text.matchAll(period.vocabPattern));
  period.vocabPattern.lastIndex = 0;

  if (!matches.length) {
    return escapeHtml(text);
  }

  let cursor = 0;
  let markup = "";

  matches.forEach((match) => {
    const index = match.index ?? 0;
    const matchedText = match[0];
    const vocabItem = period.vocabLookup.get(normalizeTerm(matchedText));

    if (!vocabItem) {
      return;
    }

    markup += escapeHtml(text.slice(cursor, index));
    markup += `<button class="note-vocab-link" type="button" data-period="${period.id}" data-term-key="${escapeHtml(vocabItem.key)}" data-vocab-id="${escapeHtml(vocabItem.id)}">${escapeHtml(matchedText)}</button>`;
    cursor = index + matchedText.length;
  });

  markup += escapeHtml(text.slice(cursor));
  return markup;
};

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

const renderNoteMedia = (image, period) => {
  if (!image?.src) {
    return "";
  }

  return `
    <figure class="note-media">
      <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt || image.displayCaption || "")}" loading="lazy">
      ${image.displayCaption ? `<figcaption>${renderNoteText(image.displayCaption, period)}</figcaption>` : ""}
    </figure>
  `;
};

const renderNoteMediaGrid = (images, period) => {
  if (!images?.length) {
    return "";
  }

  return `<div class="note-media-grid">${images.map((image) => renderNoteMedia(image, period)).join("")}</div>`;
};

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

const renderChapterSwitcher = () => {
  if (!chapterSwitcher) {
    return;
  }

  chapterSwitcher.innerHTML = chapterEntries.map((chapter) => {
    const isActive = chapter.id === state.currentPeriodId;
    return `
      <a class="chapter-link${isActive ? " is-active" : ""}" href="${escapeHtml(buildChapterHref(chapter.id))}"${isActive ? ' aria-current="page"' : ""}>
        <span class="chapter-link-code">${escapeHtml(chapter.short)}</span>
        <span class="chapter-link-copy">
          <strong>${escapeHtml(chapter.title)}</strong>
          <span>${isActive ? "Current notes page" : "Open chapter notes"}</span>
        </span>
      </a>
    `;
  }).join("");
};

const renderPeriod = (period) => {
  const weightWidth = Math.min(100, (period.weightValue / maxWeightValue) * 100);
  const vocabLetters = new Set(period.vocabulary.map((item) => item.term.charAt(0).toUpperCase()));
  const examTipsMarkup = (period.examTips || []).length
    ? `
      <div class="significance-callout">
        <strong>Exam Tips</strong>
        <ul class="arrow-list">
          ${(period.examTips || []).map((tip) => `<li>${renderNoteText(tip, period)}</li>`).join("")}
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
              ? `<ul class="arrow-list">${block.items.map((item) => `<li>${renderNoteText(item, period)}</li>`).join("")}</ul>`
              : `<p>${renderNoteText(block.text || "", period)}</p>`}
          </div>
        `).join("")}
      </div>
    `
    : "";
  const contextImageMarkup = renderNoteMediaGrid(period.contextImage ? [period.contextImage] : [], period);

  const eventsMarkup = period.events.map((event) => `
    <article class="event-card" id="${escapeHtml(event.eventId)}" data-period="${period.id}">
      <div class="event-head">
        <div>
          <h4>${escapeHtml(event.title)}</h4>
          ${event.meta ? `<div class="event-kicker">${escapeHtml(event.meta)}</div>` : ""}
        </div>
        <span class="event-date">${escapeHtml(event.date)}</span>
      </div>
      <p>${renderNoteText(event.description, period)}</p>
      ${renderNoteMediaGrid(event.images, period)}
      <div class="significance-callout">
        <strong>Significance</strong>
        <p>${renderNoteText(event.significance, period)}</p>
      </div>
      <div class="arrow-grid">
        <div class="arrow-block">
          <h5>Causes</h5>
          <ul class="arrow-list">
            ${event.causes.map((cause) => `<li>&rarr; ${renderNoteText(cause, period)}</li>`).join("")}
          </ul>
        </div>
        <div class="arrow-block">
          <h5>Effects</h5>
          <ul class="arrow-list">
            ${event.effects.map((effect) => `<li>&rarr; ${renderNoteText(effect, period)}</li>`).join("")}
          </ul>
        </div>
        ${event.connections?.length ? `
          <div class="arrow-block">
            <h5>Connections</h5>
            <ul class="arrow-list">
              ${event.connections.map((item) => `<li>${renderNoteText(item, period)}</li>`).join("")}
            </ul>
          </div>
        ` : ""}
        ${event.sources?.length ? `
          <div class="arrow-block">
            <h5>Primary Sources</h5>
            <ul class="arrow-list">
              ${event.sources.map((item) => `<li>${renderNoteText(item, period)}</li>`).join("")}
            </ul>
          </div>
        ` : ""}
      </div>
    </article>
  `).join("");

  const figuresMarkup = period.figures.map((figure) => `
    <article class="figure-card">
      <div class="figure-meta">
        <h4>${escapeHtml(figure.name)}</h4>
        <div class="figure-role">${escapeHtml(figure.role)}</div>
      </div>
      <div class="figure-body">
        ${figure.image ? renderNoteMediaGrid([figure.image], period) : ""}
        <p>${renderNoteText(figure.bio, period)}</p>
        ${figure.significance ? `<p class="figure-extra"><strong>Significance:</strong> ${renderNoteText(figure.significance, period)}</p>` : ""}
        ${figure.perspective ? `<p class="figure-extra"><strong>Perspective:</strong> ${renderNoteText(figure.perspective, period)}</p>` : ""}
      </div>
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
    <article class="vocab-row" id="${escapeHtml(item.id)}" data-letter="${escapeHtml(item.letter)}" data-period="${period.id}" data-term-key="${escapeHtml(item.key)}">
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
        <p>${renderNoteText(period.overview, period)}</p>
        <div class="big-theme-row">
          ${period.bigThemes.map((theme) => `<span class="big-theme">${escapeHtml(theme)}</span>`).join("")}
        </div>
        ${examTipsMarkup}
      </article>

      <article class="notes-section section-anchor" id="${period.id}-context" data-period="${period.id}" data-label="Historical Context">
        ${renderSectionHeading("Historical Context", period.sectionThemes.context)}
        <p class="section-intro">${renderNoteText(period.context, period)}</p>
        ${contextImageMarkup}
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
          <p>${renderNoteText(period.essay.intro || "Use these prompts to move from recall to argument. The strongest answers connect chronology, change over time, and causation instead of listing facts.", period)}</p>
          <div class="essay-grid">
            <div class="essay-block">
              <h4>Practice Prompts</h4>
              <ul class="essay-list">
                ${period.essay.prompts.map((prompt) => `<li>${renderNoteText(prompt, period)}</li>`).join("")}
              </ul>
            </div>
            <div class="essay-block">
              <h4>LEQ Thesis Models</h4>
              <ul class="essay-list">
                ${period.essay.theses.map((thesis) => `<li>${renderNoteText(thesis, period)}</li>`).join("")}
              </ul>
            </div>
            ${period.essay.analysis?.length ? `
              <div class="essay-block">
                <h4>Analysis Angles</h4>
                <ul class="essay-list">
                  ${period.essay.analysis.map((item) => `<li>${renderNoteText(item, period)}</li>`).join("")}
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

const updateVocabPeriodImmediately = (periodId) => {
  const rows = Array.from(notesContent.querySelectorAll(`.vocab-row[data-period="${periodId}"]`));

  rows.forEach((row) => {
    row.style.transition = "none";
  });

  updateVocabPeriod(periodId);

  // Force layout so the non-animated filter state is committed before scrolling.
  void notesContent.offsetHeight;

  window.requestAnimationFrame(() => {
    rows.forEach((row) => {
      row.style.transition = "";
    });
  });
};

const getPreviewClearance = (gap = 18) => {
  if (!vocabPreview || vocabPreview.hidden) {
    return 0;
  }

  const previewStyles = window.getComputedStyle(vocabPreview);
  const previewTop = Number.parseFloat(previewStyles.top) || 0;
  const previewHeight = vocabPreview.getBoundingClientRect().height;

  if (!Number.isFinite(previewHeight) || previewHeight <= 0) {
    return 0;
  }

  return previewTop + previewHeight + gap;
};

const getCenteredViewportOffset = (target, minimumTop = 118) => {
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  const targetHeight = target.getBoundingClientRect().height || 0;
  const centeredOffset = Math.max(18, (viewportHeight - targetHeight) / 2);

  return Math.max(minimumTop, centeredOffset);
};

const scrollToElement = (target, offset = 118, behavior = "smooth") => {
  const top = target.getBoundingClientRect().top + window.scrollY - offset;

  if (behavior === "auto") {
    window.scrollTo(0, top);
    return;
  }

  window.scrollTo({
    top,
    behavior
  });
};

const setPreviewVisibility = (isVisible) => {
  if (!vocabPreview) {
    return;
  }

  vocabPreview.hidden = !isVisible;
  vocabPreview.classList.toggle("is-active", isVisible);
};

const updatePreviewActions = () => {
  if (vocabPreviewJump) {
    vocabPreviewJump.disabled = !state.activeVocabPreview;
  }

  if (vocabPreviewReturn) {
    vocabPreviewReturn.disabled = !state.noteReturnPoint;
  }
};

const captureNoteReturnPoint = (sourceElement = null) => {
  const currentSection = pickCurrentSection();
  state.noteReturnPoint = {
    scrollY: window.scrollY,
    sectionId: currentSection?.id || state.activeSectionId || `${state.currentPeriodId}-overview`,
    sourceLinkId: ensureElementId(sourceElement, "note-vocab-link")
  };
  updatePreviewActions();
};

const openVocabPreview = (periodId, termKey, options = {}) => {
  const period = getPeriodById(periodId);
  const vocabItem = period?.vocabLookup.get(termKey);

  if (!period || !vocabItem || !vocabPreview) {
    return;
  }

  if (options.captureReturn !== false) {
    captureNoteReturnPoint(options.sourceElement || null);
  }

  state.activeVocabPreview = {
    periodId,
    termKey,
    vocabId: vocabItem.id
  };

  if (vocabPreviewEyebrow) {
    vocabPreviewEyebrow.textContent = `${period.short} vocabulary preview`;
  }

  if (vocabPreviewTerm) {
    vocabPreviewTerm.textContent = vocabItem.term;
  }

  if (vocabPreviewDefinition) {
    vocabPreviewDefinition.textContent = vocabItem.definition;
  }

  if (vocabPreviewContext) {
    const supportingText = vocabItem.context || "";
    vocabPreviewContext.hidden = !supportingText;
    vocabPreviewContext.textContent = supportingText ? `Context: ${supportingText}` : "";
  }

  setPreviewVisibility(true);
  updatePreviewActions();
};

const closeVocabPreview = () => {
  state.activeVocabPreview = null;
  setPreviewVisibility(false);
  updatePreviewActions();
};

const highlightVocabRow = (vocabId) => {
  window.clearTimeout(vocabHighlightTimer);
  notesContent.querySelectorAll(".vocab-row.is-targeted").forEach((row) => {
    row.classList.remove("is-targeted");
  });

  const row = document.getElementById(vocabId);
  if (!row) {
    return;
  }

  row.classList.add("is-targeted");
  vocabHighlightTimer = window.setTimeout(() => {
    row.classList.remove("is-targeted");
  }, 2600);
};

const jumpToVocabularyEntry = () => {
  const previewState = state.activeVocabPreview;
  if (!previewState) {
    return;
  }

  const period = getPeriodById(previewState.periodId);
  const vocabItem = period?.vocabLookup.get(previewState.termKey);
  if (!period || !vocabItem) {
    return;
  }

  state.vocabFilters[period.id] = vocabItem.letter;
  updateVocabPeriodImmediately(period.id);
  state.currentPeriodId = period.id;
  state.activeSectionId = `${period.id}-vocabulary`;
  state.openPeriods.add(period.id);
  updateNavTreeState();
  updateMiniTocState();

  const target = document.getElementById(vocabItem.id) || document.getElementById(`${period.id}-vocabulary`);
  if (!target) {
    return;
  }

  highlightVocabRow(vocabItem.id);
  window.requestAnimationFrame(() => {
    const minimumTop = Math.max(128, getPreviewClearance(16));
    const offset = getCenteredViewportOffset(target, minimumTop);
    scrollToElement(target, offset);
  });
};

const jumpBackToNotes = () => {
  const returnPoint = state.noteReturnPoint;
  if (!returnPoint) {
    return;
  }

  const section = document.getElementById(returnPoint.sectionId);
  if (section?.dataset.period) {
    state.currentPeriodId = section.dataset.period;
    state.activeSectionId = section.id;
    state.openPeriods.add(section.dataset.period);
    updateNavTreeState();
    updateMiniTocState();
  }

  const sourceElement = returnPoint.sourceLinkId ? document.getElementById(returnPoint.sourceLinkId) : null;
  if (sourceElement) {
    window.requestAnimationFrame(() => {
      const minimumTop = Math.max(118, getPreviewClearance(16));
      const offset = getCenteredViewportOffset(sourceElement, minimumTop);
      scrollToElement(sourceElement, offset);
    });
    return;
  }

  window.scrollTo({
    top: Math.max(0, returnPoint.scrollY),
    behavior: "smooth"
  });
};

const updateReadingProgress = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable <= 0 ? 0 : window.scrollY / scrollable;
  progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
};

const scrollToRequestedSection = () => {
  const requestedSectionId = getRequestedSectionId();
  if (!requestedSectionId) {
    return;
  }

  const target = document.getElementById(requestedSectionId);
  if (!target) {
    return;
  }

  state.activeSectionId = requestedSectionId;
  state.currentPeriodId = target.dataset.period || requestedSectionId.split("-")[0];
  state.openPeriods.add(state.currentPeriodId);
  updateNavTreeState();
  updateMiniTocState();

  let attempts = 0;
  const alignTarget = () => {
    const liveTarget = document.getElementById(requestedSectionId);
    if (!liveTarget) {
      return;
    }

    scrollToElement(liveTarget, 118, "auto");
    const rect = liveTarget.getBoundingClientRect();
    const isSettled = rect.top >= 96 && rect.top <= Math.max(220, window.innerHeight * 0.55);

    if (!isSettled && attempts < 6) {
      attempts += 1;
      window.setTimeout(alignTarget, 180);
    }
  };

  window.requestAnimationFrame(alignTarget);
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
    if (periodChanged) {
      renderChapterSwitcher();
    }
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
  const vocabLink = event.target.closest(".note-vocab-link");
  if (vocabLink) {
    event.preventDefault();
    openVocabPreview(vocabLink.dataset.period, vocabLink.dataset.termKey, { sourceElement: vocabLink });
    return;
  }

  const button = event.target.closest(".vocab-letter");

  if (!button || button.disabled) {
    return;
  }

  const { period, letter } = button.dataset;
  state.vocabFilters[period] = letter;
  updateVocabPeriod(period);
};

const handleVocabPreviewClick = (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!action) {
    return;
  }

  if (action === "close-vocab-preview") {
    closeVocabPreview();
    return;
  }

  if (action === "jump-to-vocab") {
    jumpToVocabularyEntry();
    return;
  }

  if (action === "jump-back-to-notes") {
    jumpBackToNotes();
  }
};

updateHero();
renderChapterSwitcher();
renderNotes();
renderNavTree();
renderMiniToc();
updateAllVocabFilters();
updateNavTreeState();
updatePreviewActions();

document.getElementById("nav-panel").addEventListener("click", handleNavPanelClick);
notesContent.addEventListener("click", handleNotesClick);
if (vocabPreview) {
  vocabPreview.addEventListener("click", handleVocabPreviewClick);
}

let layoutFrame = 0;
let requestedScrollSyncArmed = false;

const runLayoutSync = () => {
  layoutFrame = 0;
  updateReadingProgress();
  syncScrollState();
};

const scheduleLayoutSync = () => {
  if (layoutFrame) {
    return;
  }

  layoutFrame = window.requestAnimationFrame(runLayoutSync);
};

const scheduleRequestedScrollSync = () => {
  if (requestedScrollSyncArmed) {
    return;
  }

  requestedScrollSyncArmed = true;
  [0, 240, 900].forEach((delay) => {
    window.setTimeout(() => {
      scrollToRequestedSection();
    }, delay);
  });
};

window.addEventListener("scroll", scheduleLayoutSync, { passive: true });

window.addEventListener("resize", () => {
  updateTocIndicator();
  scheduleLayoutSync();
});

const initializeNotesLayout = () => {
  updateReadingProgress();
  syncScrollState();
};

window.requestAnimationFrame(initializeNotesLayout);
scheduleRequestedScrollSync();
window.addEventListener("load", initializeNotesLayout);
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.activeVocabPreview) {
    closeVocabPreview();
  }
});

if (document.fonts?.ready) {
  document.fonts.ready.then(() => {
    initializeNotesLayout();
    scrollToRequestedSection();
  });
}
}).catch((error) => {
  console.error("Failed to initialize chapter data on the notes page.", error);
});
