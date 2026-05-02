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

const normalizeInlineText = (value) => String(value || "")
  .replace(/[\u0000-\u001f\u007f\u00a0\u2028\u2029]+/g, " ")
  .replace(/\s+/g, " ")
  .replace(/\s+([,.;:!?])/g, "$1")
  .trim();

const normalizeTextList = (values = []) => values
  .map((value) => normalizeInlineText(value))
  .filter(Boolean);

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
    placement: ref.placement || "after-overview",
    displayCaption: ref.displayCaption || image.caption || ""
  };
};

const splitIntoSentences = (value) => {
  const placeholders = [
    ["U.S.", "__US__"],
    ["U.N.", "__UN__"],
    ["Mr.", "__MR__"],
    ["Mrs.", "__MRS__"],
    ["Ms.", "__MS__"],
    ["Dr.", "__DR__"],
    ["Jr.", "__JR__"],
    ["Sr.", "__SR__"],
    ["St.", "__ST__"],
    ["v.", "__V__"]
  ];

  let text = normalizeInlineText(value);
  if (!text) {
    return [];
  }

  placeholders.forEach(([needle, token]) => {
    text = text.replaceAll(needle, token);
  });

  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => {
      let restored = sentence;
      placeholders.forEach(([needle, token]) => {
        restored = restored.replaceAll(token, needle);
      });
      return normalizeInlineText(restored);
    })
    .filter(Boolean);
};

const dedupeTextList = (values = []) => Array.from(new Set(
  normalizeTextList(values).filter(Boolean)
));

const flattenContentBlock = (block) => {
  if (!block || typeof block !== "object") {
    return "";
  }

  switch (block.type) {
    case "fact":
      return [block.label, block.text, block.apSignificance].filter(Boolean).join(" ");
    case "definition":
      return [block.term, block.definition, block.inContext, block.apRelevance].filter(Boolean).join(" ");
    case "stat":
      return [block.label, block.value, block.date, block.apSignificance].filter(Boolean).join(" ");
    case "quote":
      return [block.text, block.attribution, block.context, block.apSignificance].filter(Boolean).join(" ");
    case "who":
      return [block.name, block.title, ...(block.keyActions || []), block.perspective, block.legacy, block.apSignificance].filter(Boolean).join(" ");
    case "chain":
      return [block.label, ...(block.steps || []).flatMap((step) => [step.event, step.result]), block.apSignificance].filter(Boolean).join(" ");
    case "cluster":
      return [block.label, ...(block.items || []).flatMap((item) => [item.name, item.description, item.date]), block.apSignificance].filter(Boolean).join(" ");
    case "comparison":
      return [
        block.label,
        block.itemA?.label,
        ...(block.itemA?.points || []),
        block.itemB?.label,
        ...(block.itemB?.points || []),
        ...(block.sharedTraits || []),
        block.apSignificance
      ].filter(Boolean).join(" ");
    case "tension":
      return [
        block.label,
        block.sideA?.label,
        ...(block.sideA?.points || []),
        block.sideB?.label,
        ...(block.sideB?.points || []),
        block.outcome,
        block.apSignificance
      ].filter(Boolean).join(" ");
    default:
      return Object.values(block).flat().filter(Boolean).join(" ");
  }
};

const buildLegacyBlocks = (section) => {
  const sentences = splitIntoSentences(section.narrative || "");
  const blocks = [];

  sentences.slice(2).forEach((sentence, index) => {
    blocks.push({
      type: "fact",
      label: index === 0 ? section.sectionTitle : `Section Detail ${index + 1}`,
      text: sentence,
      apSignificance: section.significance || ""
    });
  });

  if ((section.causes || []).length || (section.effects || []).length) {
    const steps = [];
    const causes = normalizeTextList(section.causes || []).slice(0, 2);
    const effects = normalizeTextList(section.effects || []).slice(0, 2);

    causes.forEach((cause, index) => {
      steps.push({
        step: steps.length + 1,
        event: cause,
        result: index === causes.length - 1 ? `${section.sectionTitle} gathered momentum.` : "The pressure for change kept building."
      });
    });

    steps.push({
      step: steps.length + 1,
      event: section.sectionTitle,
      result: section.significance || `${section.sectionTitle} reshaped the politics of the era.`
    });

    effects.forEach((effect) => {
      steps.push({
        step: steps.length + 1,
        event: "The immediate aftermath",
        result: effect
      });
    });

    blocks.push({
      type: "chain",
      label: `How ${section.sectionTitle} unfolded`,
      steps: steps.slice(0, 5),
      apSignificance: section.significance || ""
    });
  }

  if ((section.primarySourceConnections || []).length) {
    blocks.push({
      type: "cluster",
      label: "Primary source windows",
      items: normalizeTextList(section.primarySourceConnections || []).map((item, index) => ({
        name: `Source ${index + 1}`,
        description: item,
        date: null
      })),
      apSignificance: "Primary-source analysis questions often use these examples to test contextualization and argumentation."
    });
  }

  (section.keyFigures || []).forEach((figure) => {
    const bioSentences = splitIntoSentences(figure.bio || "");
    const significanceSentences = splitIntoSentences(figure.significance || "");
    blocks.push({
      type: "who",
      name: figure.name,
      title: figure.title,
      dates: "",
      keyActions: [
        bioSentences[0] || figure.bio || "",
        significanceSentences[0] || bioSentences[1] || ""
      ].filter(Boolean),
      perspective: figure.perspective || "",
      legacy: figure.significance || "",
      apSignificance: figure.significance || figure.bio || "",
      imageId: figure.imageId || null
    });
  });

  if (section.significance) {
    blocks.push({
      type: "fact",
      label: "AP significance",
      text: section.significance,
      apSignificance: "This is the clearest claim the section makes about why the development matters."
    });
  }

  while (blocks.length < 5) {
    const fallbackSentence = sentences[blocks.length + 1] || sentences[0] || section.sectionTitle || "";
    blocks.push({
      type: "fact",
      label: "Section takeaway",
      text: fallbackSentence,
      apSignificance: section.significance || ""
    });
  }

  return blocks;
};

const getSectionOverview = (section) => {
  if (section?.overview) {
    return normalizeInlineText(section.overview);
  }

  return splitIntoSentences(section?.narrative || "").slice(0, 2).join(" ");
};

const getSectionBlocks = (section) => {
  if (Array.isArray(section?.contentBlocks) && section.contentBlocks.length) {
    return section.contentBlocks;
  }

  return buildLegacyBlocks(section || {});
};

const deriveSectionChains = (blocks = []) => blocks
  .filter((block) => block?.type === "chain" && Array.isArray(block.steps) && block.steps.length);

const deriveSectionCauses = (section, blocks) => {
  if (Array.isArray(section?.causes) && section.causes.length) {
    return normalizeTextList(section.causes);
  }

  const chain = deriveSectionChains(blocks)[0];
  if (!chain) {
    return [];
  }

  return dedupeTextList(chain.steps.slice(0, Math.max(chain.steps.length - 1, 1)).map((step) => step.event)).slice(0, 3);
};

const deriveSectionEffects = (section, blocks) => {
  if (Array.isArray(section?.effects) && section.effects.length) {
    return normalizeTextList(section.effects);
  }

  const chain = deriveSectionChains(blocks)[0];
  if (!chain) {
    return [];
  }

  return dedupeTextList(chain.steps.map((step) => step.result)).slice(-3);
};

const deriveSectionSources = (section, blocks) => {
  if (Array.isArray(section?.primarySourceConnections) && section.primarySourceConnections.length) {
    return normalizeTextList(section.primarySourceConnections);
  }

  const sources = [];
  blocks.forEach((block) => {
    if (block?.type === "quote") {
      sources.push([block.attribution, block.text].filter(Boolean).join(": "));
    }

    if (block?.type === "cluster" && /primary source/i.test(String(block.label || ""))) {
      (block.items || []).forEach((item) => {
        sources.push([item.name, item.description].filter(Boolean).join(": "));
      });
    }
  });

  return dedupeTextList(sources);
};

const deriveSectionSignificance = (section, blocks) => normalizeInlineText(
  section?.significance
  || (Array.isArray(section?.apExamAngles) ? section.apExamAngles[0] : "")
  || blocks.map((block) => block?.apSignificance || block?.apRelevance).find(Boolean)
  || ""
);

const collectSectionFigures = (section, blocks, imageLookup) => {
  const figures = [];

  (section?.keyFigures || []).forEach((figure) => {
    figures.push({
      name: figure.name,
      role: figure.title,
      bio: figure.bio,
      significance: figure.significance,
      perspective: figure.perspective,
      image: figure.imageId ? (imageLookup.get(figure.imageId) || null) : null
    });
  });

  blocks
    .filter((block) => block?.type === "who" && block.name)
    .forEach((block) => {
      figures.push({
        name: block.name,
        role: block.title,
        bio: normalizeTextList(block.keyActions || []).join(" "),
        significance: block.legacy || block.apSignificance || "",
        perspective: block.perspective || "",
        image: block.imageId ? (imageLookup.get(block.imageId) || null) : null
      });
    });

  return figures;
};

const buildPlacedImages = (images = []) => {
  const placed = {
    afterOverview: [],
    afterKeyFigures: [],
    afterBlocks: new Map()
  };

  images.forEach((image) => {
    const placement = String(image?.placement || "after-overview");
    const blockMatch = placement.match(/^after-block-(\d+)$/i);

    if (blockMatch) {
      const blockIndex = Number(blockMatch[1]);
      const current = placed.afterBlocks.get(blockIndex) || [];
      current.push(image);
      placed.afterBlocks.set(blockIndex, current);
      return;
    }

    if (placement === "after-key-figures") {
      placed.afterKeyFigures.push(image);
      return;
    }

    placed.afterOverview.push(image);
  });

  return placed;
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

  const normalizedSections = sections.map((section, index) => {
    const blocks = getSectionBlocks(section);
    const resolvedImages = (section.sectionImages || [])
      .map((imageRef) => resolveNoteImage(imageRef, imageLookup))
      .filter(Boolean);

    collectSectionFigures(section, blocks, imageLookup).forEach((figure) => {
      if (!figureMap.has(figure.name)) {
        figureMap.set(figure.name, figure);
      }
    });

    return {
      eventId: `${id}-event-${slugifyFragment(section.sectionTitle) || `section-${index + 1}`}-${index + 1}`,
      title: section.sectionTitle,
      date: `Section ${index + 1}`,
      meta: (section.apThemes || []).join(" · "),
      overview: getSectionOverview(section),
      blocks,
      significance: deriveSectionSignificance(section, blocks),
      causes: deriveSectionCauses(section, blocks),
      effects: deriveSectionEffects(section, blocks),
      connections: normalizeTextList(section.connections || []),
      sources: deriveSectionSources(section, blocks),
      apExamAngles: normalizeTextList(section.apExamAngles || []),
      images: buildPlacedImages(resolvedImages)
    };
  });

  return {
    id,
    short,
    images: data.images || [],
    navTitle: data.chapterMeta.chapterTitle,
    title: data.chapterMeta.chapterTitle,
    range: data.chapterMeta.dateRange,
    weightLabel: data.chapterMeta.apExamWeight,
    weightValue: parseWeightValue(data.chapterMeta.apExamWeight),
    overview: normalizeInlineText(data.chapterMeta.oneLineSummary),
    bigThemes: data.chapterMeta.bigPictureThemes || [],
    examTips: normalizeTextList(data.chapterMeta.examTips || []),
    sectionThemes: {
      context: mergeThemeKeys(sections, ["wor", "pol", "mig"]),
      events: mergeThemeKeys(sections, ["wor", "pol", "cul"]),
      figures: mergeThemeKeys(sections, ["wor", "pol", "nat"]),
      vocabulary: mergeThemeKeys(sections, ["wor", "pol", "cul"]),
      essay: mergeThemeKeys(sections, ["pol", "wor", "nat"])
    },
    context: normalizeInlineText(data.notes.historicalContext?.overview || ""),
    contextHighlights: [
      {
        title: "Preceding Causes",
        items: normalizeTextList(data.notes.historicalContext?.precedingCauses || [])
      },
      {
        title: "Geographic Context",
        text: normalizeInlineText(data.notes.historicalContext?.geographicContext || "")
      }
    ],
    contextImage: resolveNoteImage(data.notes.historicalContext?.contextImage, imageLookup),
    events: normalizedSections,
    figures: Array.from(figureMap.values()),
    vocabulary,
    vocabLookup,
    vocabPattern,
    essay: {
      intro: normalizeInlineText(data.notes.overarchingAnalysis?.complexity || ""),
      prompts: [
        ...(data.essayPractice?.saq || []).map((item) => item.prompt),
        ...(data.essayPractice?.leq || []).map((item) => item.prompt),
        ...(data.essayPractice?.dbq || []).map((item) => item.prompt)
      ].map((item) => normalizeInlineText(item)).filter(Boolean),
      theses: [
        ...(data.essayPractice?.leq || []).flatMap((item) => item.thesisExamples || []),
        ...(data.essayPractice?.dbq || []).map((item) => item.thesisExample).filter(Boolean)
      ].map((item) => normalizeInlineText(item)).filter(Boolean),
      analysis: [
        data.notes.overarchingAnalysis?.continuity ? `Continuity: ${data.notes.overarchingAnalysis.continuity}` : "",
        data.notes.overarchingAnalysis?.change ? `Change: ${data.notes.overarchingAnalysis.change}` : "",
        ...(data.notes.overarchingAnalysis?.comparisonAngles || [])
      ].map((item) => normalizeInlineText(item)).filter(Boolean)
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

const noteIgnoredEmphasisPhrases = new Set([
  "United States",
  "The United States"
]);

const shouldSkipCapitalizedPhrase = (matchedText) => (
  noteIgnoredEmphasisPhrases.has(String(matchedText || "").trim())
  || /^(?:The|A|An)\s+[A-Z]{2,}$/.test(String(matchedText || "").trim())
);

const noteEmphasisPatterns = [
  /\b(?:17|18|19|20)\d{2}(?:\s*[-–]\s*(?:\d{2}|\d{4}))?\b/g,
  /"[^"\n]{3,72}"|'[^'\n]{3,72}'/g,
  /\b(?:[A-Z][\w.-]*(?:\s+(?:[A-Z][\w.-]*|and|of|the|for|to|in|on|at|by|from|with|without|against|under|over|v\.|v|I|II|III|IV)){0,6})\s(?:Act|Amendment|Agreement|Army|Bill|Campaign|Case|Charter|Coalition|Conference|Convention|Corollary|Crusade|Debate|Deal|Decision|Diplomacy|Doctrine|Era|Expedition|Front|Movement|Order|Party|Plan|Platform|Policy|Program|Proclamation|Purchase|Rebellion|Revolution|Scare|Society|Speech|Strike|System|Tariff|Treaty|War)\b/g,
  /\b(?:[A-Z][\w.-]*|[A-Z]\.)(?:\s+(?:(?:of|the|and|for|to|in|on|at|by|from|with|without|against|under|over|v\.|v)\s+)?(?:[A-Z][\w.-]*|[A-Z]\.|I|II|III|IV)){1,5}\b/g,
  /\b(?:(?!a\b|an\b|and\b|as\b|at\b|by\b|for\b|from\b|in\b|into\b|of\b|on\b|or\b|the\b|to\b|under\b|with\b)[a-z][\w'-]*)(?:\s+(?:(?!a\b|an\b|and\b|as\b|at\b|by\b|for\b|from\b|in\b|into\b|of\b|on\b|or\b|the\b|to\b|under\b|with\b)[a-z][\w'-]*)){0,2}\s(?:capitalism|consumerism|imperialism|internationalism|pluralism|nativism|segregation|liberties|rights|freedom|democracy|nationalism|conservatism|liberalism|industrialization|urbanization|deindustrialization|assimilation|intervention|containment|detente|stagflation|economy|production|credit|advertising|enterprise|welfare|citizenship|repression|mobilization|migration|activism)\b/g
];

const noteTakeawaySentencePatterns = [
  /\b(?:APUSH|AP exam|For APUSH)\b/i,
  /\bThis\s+(?:section|topic|material|chapter|case|development|pattern|shift|change|conflict|law|policy|movement)\s+(?:matters|shows|explains|reveals|illustrates|highlights|helps|marks|is)\b/i,
  /\b(?:This|That|These)\s+(?:matters?|shows?|explains?|reveals?|illustrates?|captures?|demonstrates?|marks?|connects?|foreshadows?|highlights?)\b/i,
  /\b(?:The result|The effect|The outcome)\s+(?:was|is)\b/i,
  /\b(?:is|was)\s+(?:central|crucial|critical|vital|essential|core)\s+(?:to|for)\b/i
];

const mergeRanges = (ranges) => {
  if (!ranges.length) {
    return [];
  }

  const sorted = [...ranges]
    .filter((range) => Number.isFinite(range.start) && Number.isFinite(range.end) && range.end > range.start)
    .sort((left, right) => left.start - right.start || left.end - right.end);

  if (!sorted.length) {
    return [];
  }

  return sorted.reduce((merged, range) => {
    const lastRange = merged[merged.length - 1];
    if (!lastRange || range.start > lastRange.end) {
      merged.push({ ...range });
      return merged;
    }

    lastRange.end = Math.max(lastRange.end, range.end);
    return merged;
  }, []);
};

const collectPatternRanges = (text, pattern, skipMatch = null) => {
  const ranges = [];
  pattern.lastIndex = 0;

  let match = pattern.exec(text);
  while (match) {
    const matchedText = match[0];
    const start = match.index ?? 0;
    const end = start + matchedText.length;

    if (!skipMatch || !skipMatch(matchedText)) {
      ranges.push({ start, end });
    }

    if (!matchedText.length) {
      pattern.lastIndex += 1;
    }

    match = pattern.exec(text);
  }

  pattern.lastIndex = 0;
  return ranges;
};

const collectTakeawayRanges = (text) => {
  const sentenceRanges = [];
  const sentencePattern = /[^.!?]+(?:[.!?](?:"|')?)?/g;
  let match = sentencePattern.exec(text);

  while (match) {
    const sentence = match[0];
    const trimmedSentence = sentence.trim();

    if (trimmedSentence && trimmedSentence.length >= 40 && trimmedSentence.length <= 320) {
      const isTakeaway = noteTakeawaySentencePatterns.some((pattern) => pattern.test(trimmedSentence));
      if (isTakeaway) {
        const leadingWhitespace = sentence.match(/^\s*/)?.[0].length || 0;
        const trailingWhitespace = sentence.match(/\s*$/)?.[0].length || 0;
        sentenceRanges.push({
          start: (match.index ?? 0) + leadingWhitespace,
          end: (match.index ?? 0) + sentence.length - trailingWhitespace
        });
      }
    }

    match = sentencePattern.exec(text);
  }

  return sentenceRanges;
};

const renderEmphasizedText = (text) => {
  const value = String(text || "");
  if (!value) {
    return "";
  }

  const ranges = noteEmphasisPatterns.flatMap((pattern, index) => collectPatternRanges(
    value,
    pattern,
    index === 3 ? shouldSkipCapitalizedPhrase : index === 2 ? (matchedText) => noteIgnoredEmphasisPhrases.has(matchedText.trim()) : null
  ));
  ranges.push(...collectTakeawayRanges(value));
  const mergedRanges = mergeRanges(ranges);

  if (!mergedRanges.length) {
    return escapeHtml(value);
  }

  let cursor = 0;
  let markup = "";

  mergedRanges.forEach((range) => {
    if (range.start < cursor) {
      return;
    }

    markup += escapeHtml(value.slice(cursor, range.start));
    markup += `<strong class="note-emphasis">${escapeHtml(value.slice(range.start, range.end))}</strong>`;
    cursor = range.end;
  });

  markup += escapeHtml(value.slice(cursor));
  return markup;
};

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
  const text = normalizeInlineText(value);

  if (!text) {
    return "";
  }

  if (!period?.vocabPattern) {
    return renderEmphasizedText(text);
  }

  period.vocabPattern.lastIndex = 0;
  const matches = Array.from(text.matchAll(period.vocabPattern));
  period.vocabPattern.lastIndex = 0;

  if (!matches.length) {
    return renderEmphasizedText(text);
  }

  let cursor = 0;
  let tokenizedText = "";
  const vocabReplacements = [];

  matches.forEach((match) => {
    const index = match.index ?? 0;
    const matchedText = match[0];
    const vocabItem = period.vocabLookup.get(normalizeTerm(matchedText));

    if (!vocabItem) {
      return;
    }

    const token = `__NOTE_VOCAB_${vocabReplacements.length}__`;
    tokenizedText += text.slice(cursor, index);
    tokenizedText += token;
    vocabReplacements.push({
      token,
      markup: `<a class="note-vocab-link" href="#${escapeHtml(vocabItem.id)}" data-period="${period.id}" data-term-key="${escapeHtml(vocabItem.key)}" data-vocab-id="${escapeHtml(vocabItem.id)}">${escapeHtml(matchedText)}</a>`
    });
    cursor = index + matchedText.length;
  });

  tokenizedText += text.slice(cursor);
  let markup = renderEmphasizedText(tokenizedText);
  vocabReplacements.forEach(({ token, markup: replacementMarkup }) => {
    markup = markup.replaceAll(token, replacementMarkup);
  });

  return markup;
};

const renderKeyPointText = (value, period) => `<span class="note-point">${renderNoteText(value, period)}</span>`;

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

const contentBlockTypeLabels = {
  fact: "Fact",
  chain: "Cause and Effect",
  tension: "Tension",
  comparison: "Comparison",
  cluster: "Cluster",
  quote: "Quote",
  who: "Who",
  stat: "Statistic",
  definition: "Definition"
};

const renderBulletList = (items, period, className = "arrow-list", prefix = "") => `
  <ul class="${className}">
    ${items.map((item) => `<li>${prefix}${renderKeyPointText(item, period)}</li>`).join("")}
  </ul>
`;

const renderContentBlockHeader = (block, label) => `
  <div class="content-block-head">
    <span class="content-block-type">${escapeHtml(contentBlockTypeLabels[block.type] || "Block")}</span>
    ${label ? `<span class="content-block-label">${escapeHtml(label)}</span>` : ""}
  </div>
`;

const renderContentBlockFooter = (block, period) => {
  const significance = normalizeInlineText(block.apSignificance || block.apRelevance || "");
  if (!significance) {
    return "";
  }

  return `
    <div class="content-block-footer">
      <strong>AP Angle</strong>
      <p>${renderNoteText(significance, period)}</p>
    </div>
  `;
};

const renderContentBlock = (block, period) => {
  if (!block?.type) {
    return "";
  }

  if (block.type === "fact") {
    return `
      <article class="content-block content-block-fact">
        ${renderContentBlockHeader(block, block.label)}
        <div class="content-block-copy">
          <p>${renderNoteText(block.text, period)}</p>
        </div>
        ${renderContentBlockFooter(block, period)}
      </article>
    `;
  }

  if (block.type === "definition") {
    return `
      <article class="content-block content-block-definition">
        ${renderContentBlockHeader(block, block.term)}
        <div class="content-block-copy">
          <p>${renderNoteText(block.definition, period)}</p>
          ${block.inContext ? `<p><strong>In Context:</strong> ${renderNoteText(block.inContext, period)}</p>` : ""}
          ${block.apRelevance ? `<p><strong>AP Relevance:</strong> ${renderNoteText(block.apRelevance, period)}</p>` : ""}
        </div>
      </article>
    `;
  }

  if (block.type === "stat") {
    return `
      <article class="content-block content-block-stat">
        ${renderContentBlockHeader(block, block.label)}
        <div class="content-block-statline">
          <strong class="content-block-value">${escapeHtml(block.value || "")}</strong>
          ${block.date ? `<span class="content-block-date">${escapeHtml(block.date)}</span>` : ""}
        </div>
        ${renderContentBlockFooter(block, period)}
      </article>
    `;
  }

  if (block.type === "quote") {
    return `
      <article class="content-block content-block-quote-wrap">
        ${renderContentBlockHeader(block, block.attribution)}
        <blockquote class="content-block-quote">
          <p>${renderNoteText(block.text, period)}</p>
          ${block.context ? `<footer>${renderNoteText(block.context, period)}</footer>` : ""}
        </blockquote>
        ${renderContentBlockFooter(block, period)}
      </article>
    `;
  }

  if (block.type === "who") {
    return `
      <article class="content-block content-block-who">
        ${renderContentBlockHeader(block, block.name)}
        <div class="content-block-who-grid">
          ${block.imageId && getPeriodById(period.id)
            ? renderNoteMediaGrid([buildImageLookup(getPeriodById(period.id)?.images || []).get(block.imageId)].filter(Boolean), period)
            : ""}
          <div class="content-block-copy">
            ${block.title ? `<p><strong>${escapeHtml(block.title)}</strong>${block.dates ? ` · ${escapeHtml(block.dates)}` : ""}</p>` : ""}
            ${(block.keyActions || []).length ? renderBulletList(block.keyActions, period, "content-block-list") : ""}
            ${block.perspective ? `<p><strong>Perspective:</strong> ${renderNoteText(block.perspective, period)}</p>` : ""}
            ${block.legacy ? `<p><strong>Legacy:</strong> ${renderNoteText(block.legacy, period)}</p>` : ""}
          </div>
        </div>
        ${renderContentBlockFooter(block, period)}
      </article>
    `;
  }

  if (block.type === "chain") {
    return `
      <article class="content-block content-block-chain">
        ${renderContentBlockHeader(block, block.label)}
        <div class="content-block-steps">
          ${(block.steps || []).map((step) => `
            <div class="content-block-step">
              <span class="content-block-step-index">Step ${escapeHtml(step.step)}</span>
              <p><strong>Event:</strong> ${renderNoteText(step.event, period)}</p>
              <p><strong>Result:</strong> ${renderNoteText(step.result, period)}</p>
            </div>
          `).join("")}
        </div>
        ${renderContentBlockFooter(block, period)}
      </article>
    `;
  }

  if (block.type === "cluster") {
    return `
      <article class="content-block content-block-cluster">
        ${renderContentBlockHeader(block, block.label)}
        <div class="content-block-items">
          ${(block.items || []).map((item) => `
            <div class="content-block-item">
              <p><strong>${escapeHtml(item.name || "")}</strong>${item.date ? ` <span class="content-block-date">${escapeHtml(item.date)}</span>` : ""}</p>
              <p>${renderNoteText(item.description, period)}</p>
            </div>
          `).join("")}
        </div>
        ${renderContentBlockFooter(block, period)}
      </article>
    `;
  }

  if (block.type === "comparison" || block.type === "tension") {
    const left = block.type === "comparison" ? block.itemA : block.sideA;
    const right = block.type === "comparison" ? block.itemB : block.sideB;
    const shared = block.type === "comparison" ? (block.sharedTraits || []) : [];
    const outro = block.type === "comparison" ? "" : normalizeInlineText(block.outcome || "");

    return `
      <article class="content-block content-block-grid-wrap">
        ${renderContentBlockHeader(block, block.label)}
        <div class="content-block-grid">
          <div class="content-block-panel">
            <h5>${escapeHtml(left?.label || "Side A")}</h5>
            ${(left?.points || []).length ? renderBulletList(left.points, period, "content-block-list") : ""}
          </div>
          <div class="content-block-panel">
            <h5>${escapeHtml(right?.label || "Side B")}</h5>
            ${(right?.points || []).length ? renderBulletList(right.points, period, "content-block-list") : ""}
          </div>
        </div>
        ${shared.length ? `<div class="content-block-footer"><strong>Shared Traits</strong>${renderBulletList(shared, period, "content-block-list")}</div>` : ""}
        ${outro ? `<div class="content-block-footer"><strong>Outcome</strong><p>${renderNoteText(outro, period)}</p></div>` : ""}
        ${renderContentBlockFooter(block, period)}
      </article>
    `;
  }

  return `
    <article class="content-block">
      ${renderContentBlockHeader(block, block.label || "")}
      <div class="content-block-copy">
        <p>${renderNoteText(flattenContentBlock(block), period)}</p>
      </div>
    </article>
  `;
};

const renderEventBlockStack = (event, period) => {
  const blockMarkup = event.blocks.map((block, index) => `
    ${renderContentBlock(block, period)}
    ${renderNoteMediaGrid(event.images.afterBlocks.get(index + 1) || [], period)}
  `).join("");

  return `
    <div class="content-block-stack">
      ${blockMarkup}
      ${renderNoteMediaGrid(event.images.afterKeyFigures || [], period)}
    </div>
  `;
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
          ${(period.examTips || []).map((tip) => `<li>${renderKeyPointText(tip, period)}</li>`).join("")}
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
              ? `<ul class="arrow-list">${block.items.map((item) => `<li>${renderKeyPointText(item, period)}</li>`).join("")}</ul>`
              : `<p>${renderKeyPointText(block.text || "", period)}</p>`}
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
      ${event.overview ? `<p class="event-overview">${renderNoteText(event.overview, period)}</p>` : ""}
      ${renderNoteMediaGrid(event.images.afterOverview || [], period)}
      ${renderEventBlockStack(event, period)}
      ${event.significance ? `
        <div class="significance-callout">
          <strong>Section Significance</strong>
          <p>${renderKeyPointText(event.significance, period)}</p>
        </div>
      ` : ""}
      ${(event.causes.length || event.effects.length || event.apExamAngles.length || event.connections?.length || event.sources?.length) ? `
        <div class="arrow-grid">
          ${event.causes.length ? `
            <div class="arrow-block">
              <h5>Drivers</h5>
              ${renderBulletList(event.causes, period, "arrow-list", "&rarr; ")}
            </div>
          ` : ""}
          ${event.effects.length ? `
            <div class="arrow-block">
              <h5>Consequences</h5>
              ${renderBulletList(event.effects, period, "arrow-list", "&rarr; ")}
            </div>
          ` : ""}
          ${event.apExamAngles.length ? `
            <div class="arrow-block">
              <h5>AP Exam Angles</h5>
              ${renderBulletList(event.apExamAngles, period)}
            </div>
          ` : ""}
          ${event.connections?.length ? `
            <div class="arrow-block">
              <h5>Connections</h5>
              ${renderBulletList(event.connections, period)}
            </div>
          ` : ""}
          ${event.sources?.length ? `
            <div class="arrow-block">
              <h5>Primary Sources</h5>
              ${renderBulletList(event.sources, period)}
            </div>
          ` : ""}
        </div>
      ` : ""}
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
