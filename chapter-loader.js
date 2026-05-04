(function () {
  const manifest = Array.isArray(window.chapterManifest)
    ? [...window.chapterManifest].sort((left, right) => left.number - right.number)
    : [];
  const chapterLoadFilter = Array.isArray(window.chapterLoadFilter)
    ? new Set(window.chapterLoadFilter.map((value) => String(value || "").toLowerCase()).filter(Boolean))
    : null;
  const filteredManifest = chapterLoadFilter
    ? manifest.filter((entry) => chapterLoadFilter.has(String(entry.id || "").toLowerCase()))
    : manifest;
  const activeManifest = filteredManifest.length ? filteredManifest : manifest;
  const EXTRA_VOCAB_FLASHCARD_TYPES = new Set(["Term", "Concept", "Law", "Event", "Document", "Case", "Organization", "Policy", "Treaty", "Movement"]);

  const normalizeText = (value) => String(value || "")
    .replace(/[\u0000-\u001f\u007f\u00a0\u2028\u2029]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();

  const normalizeTerm = (value) => normalizeText(value).toLowerCase();

  const sentenceKey = (value) => normalizeText(value)
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/[.,;:!?]+$/g, "")
    .toLowerCase();

  const splitSentences = (value) => normalizeText(value)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => normalizeText(sentence))
    .filter(Boolean);

  const sanitizeLearningCopy = (value) => {
    let text = normalizeText(value)
      .replace(/Link this event to a larger APUSH theme\./gi, "This event connects to a broader historical pattern.")
      .replace(/Connect this event to a broader APUSH theme\./gi, "This event connects to a broader historical pattern.")
      .replace(/Link this event to a broader APUSH theme\./gi, "This event connects to a broader historical pattern.")
      .replace(/Connect the event to a broader APUSH theme\./gi, "This event connects to a broader historical pattern.")
      .replace(/Connect this event to a larger APUSH theme\./gi, "This event connects to a broader historical pattern.")
      .replace(/\bAPUSH\b/gi, "this chapter")
      .replace(/\bAP exam\b/gi, "this chapter")
      .replace(/\bAP-relevant\b/gi, "historically important")
      .replace(/\bAP relevance\b/gi, "historical relevance");

    if (/^[a-z]/.test(text)) {
      text = text.charAt(0).toUpperCase() + text.slice(1);
    }

    return normalizeText(text);
  };

  const dedupeSentences = (values = []) => {
    const seen = new Set();

    return values
      .flatMap((value) => splitSentences(value))
      .map((sentence) => sanitizeLearningCopy(sentence))
      .filter((sentence) => {
        const key = sentenceKey(sentence);
        if (!key || seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      });
  };

  const isGenericStudyPrompt = (value) => /^(?:this event|this term|this image)\s+(?:connects|fits|helps)\s+to\b/i.test(String(value || ""));

  const pickStudyContext = (...values) => dedupeSentences(values)
    .find((sentence) => sentence.length >= 24 && !isGenericStudyPrompt(sentence)) || "";

  const buildDetailedDefinition = (term, definition, context, supplemental = "") => {
    const orderedSentences = dedupeSentences([supplemental, definition, context]);
    const primarySentences = orderedSentences.filter((sentence) => sentence.length >= 28);

    if (!primarySentences.length) {
      return normalizeText(definition);
    }

    if (primarySentences.length === 1) {
      const fallbackContext = pickStudyContext(context, supplemental);
      if (fallbackContext && sentenceKey(fallbackContext) !== sentenceKey(primarySentences[0])) {
        return `${primarySentences[0]} ${fallbackContext}`.trim();
      }
    }

    return primarySentences.slice(0, 3).join(" ");
  };

  const buildFlashcardLookup = (flashcards = []) => {
    const lookup = new Map();

    flashcards.forEach((card) => {
      const key = normalizeTerm(card?.front);
      if (!key || lookup.has(key)) {
        return;
      }

      lookup.set(key, card);
    });

    return lookup;
  };

  const enrichKeyFigures = (sections = [], flashcardLookup) => sections.map((section) => ({
    ...section,
    keyFigures: (section.keyFigures || []).map((figure) => {
      const flashcard = flashcardLookup.get(normalizeTerm(figure.name));
      const bio = buildDetailedDefinition(
        figure.name,
        figure.bio,
        figure.perspective,
        flashcard?.back || ""
      );

      return {
        ...figure,
        bio: bio || normalizeText(figure.bio),
        perspective: pickStudyContext(figure.perspective, flashcard?.hint || ""),
        significance: normalizeText(figure.significance || "")
      };
    })
  }));

  const buildExtraVocabularyFromFlashcards = (flashcards = [], seenTerms = new Set(), limit = 12) => {
    const extras = [];

    flashcards.forEach((card) => {
      if (extras.length >= limit) {
        return;
      }

      if (!EXTRA_VOCAB_FLASHCARD_TYPES.has(card?.type)) {
        return;
      }

      const term = normalizeText(card.front);
      const key = normalizeTerm(term);
      const back = normalizeText(card.back);

      if (!key || seenTerms.has(key) || back.length < 40) {
        return;
      }

      extras.push({
        term,
        definition: buildDetailedDefinition(term, back, card.hint || "", ""),
        context: pickStudyContext(card.hint || ""),
        apRelevance: ""
      });
      seenTerms.add(key);
    });

    return extras;
  };

  const enrichVocabulary = (data) => {
    if (!data || data.__codexVocabularyEnriched) {
      return data;
    }

    const flashcardLookup = buildFlashcardLookup(data.flashcards || []);
    const seenTerms = new Set();
    const vocabulary = (Array.isArray(data.vocabulary) ? data.vocabulary : []).map((item) => {
      const term = normalizeText(item.term);
      const key = normalizeTerm(term);
      const flashcard = flashcardLookup.get(key);
      seenTerms.add(key);

      return {
        ...item,
        term,
        definition: buildDetailedDefinition(term, item.definition, item.context, flashcard?.back || ""),
        context: pickStudyContext(item.context, flashcard?.hint || ""),
        apRelevance: ""
      };
    });

    const extraVocabulary = buildExtraVocabularyFromFlashcards(data.flashcards || [], seenTerms, 12);

    if (data.notes?.sections) {
      data.notes.sections = enrichKeyFigures(data.notes.sections, flashcardLookup);
    }

    data.vocabulary = [...vocabulary, ...extraVocabulary];
    data.__codexVocabularyEnriched = true;
    return data;
  };

  const loadScript = (src) => new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-chapter-script="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.dataset.chapterScript = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load chapter script: ${src}`));
    document.head.appendChild(script);
  });

  const buildConfigs = () => activeManifest
    .map((entry) => {
      const data = enrichVocabulary(window[entry.global]);
      const config = {
        ...entry,
        title: data?.chapterMeta?.chapterTitle || entry.title,
        data
      };

      return typeof window.enrichChapterEntry === "function"
        ? window.enrichChapterEntry(config)
        : config;
    })
    .filter((entry) => entry.data?.chapterMeta);

  window.getChapterConfigs = () => buildConfigs();

  window.chapterDataReady = activeManifest
    .reduce((promise, entry) => promise.then(() => {
      if (window[entry.global]) {
        return null;
      }

      return loadScript(entry.script);
    }), Promise.resolve())
    .then(() => buildConfigs());
})();
