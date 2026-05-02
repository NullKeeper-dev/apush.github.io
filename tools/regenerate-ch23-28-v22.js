const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const TEXTBOOK_DIR = path.join(ROOT, "textbook");
const OUTPUT_CHAPTERS = [23, 24, 25, 26, 27, 28];
const MCQ_OPTION_LABELS = ["A", "B", "C", "D"];

const PERIOD_META = {
  p8: {
    period: "Period 8",
    periodId: "p8",
    apExamWeight: "10-17%"
  },
  p9: {
    period: "Period 9",
    periodId: "p9",
    apExamWeight: "4-6%"
  }
};

const THEME = {
  politics: "Politics and Power",
  identity: "American and National Identity",
  work: "Work, Exchange, Technology",
  culture: "Culture and Society",
  migration: "Migration and Settlement",
  geography: "Geography and Environment",
  world: "America in the World"
};

function normalizeText(value) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f\u00a0\u2028\u2029]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, "\"")
    .replace(/&ldquo;/g, "\"")
    .replace(/&mdash;/g, "-")
    .replace(/&ndash;/g, "-")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(parseInt(num, 10)));
}

function stripTags(value) {
  return decodeHtml(String(value || ""))
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getAttr(tag, name) {
  const normalizedTag = decodeHtml(tag);
  const quoted = normalizedTag.match(new RegExp(`${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i"));
  if (quoted) {
    return decodeHtml(quoted[2]).trim().replace(/^["']|["']$/g, "");
  }

  const bare = normalizedTag.match(new RegExp(`${name}\\s*=\\s*([^\\s>]+)`, "i"));
  return bare ? decodeHtml(bare[1]).trim().replace(/^["']|["']$/g, "") : "";
}

function getNearbyCaption(html, index) {
  const after = html.slice(index, Math.min(html.length, index + 5000));
  const figcaption = after.match(/<figcaption[\s\S]*?<\/figcaption>/i);
  if (figcaption) {
    return stripTags(figcaption[0]);
  }

  const paragraph = after.match(/<p(?:\s[^>]*)?>[\s\S]*?<\/p>/i);
  if (paragraph) {
    const text = stripTags(paragraph[0]);
    if (text.length > 20 && text.length < 900) {
      return text;
    }
  }

  return "";
}

function extensionFromDataUrl(src) {
  const type = String(src || "").match(/^data:([^;,]+)[;,]/i)?.[1]?.toLowerCase() || "";
  if (type.includes("png")) return "png";
  if (type.includes("svg")) return "svg";
  if (type.includes("webp")) return "webp";
  return "jpg";
}

function writeImageFile(src, outputBase) {
  const cleaned = String(src || "").trim().replace(/^["']|["']$/g, "");
  const extension = extensionFromDataUrl(cleaned);
  const outputPath = `${outputBase}.${extension}`;

  if (cleaned.startsWith("data:")) {
    const base64 = cleaned.match(/^data:[^;,]+;base64,([\s\S]+)$/i);
    if (base64) {
      fs.writeFileSync(outputPath, Buffer.from(base64[1], "base64"));
    } else {
      const raw = cleaned.replace(/^data:[^,]+,/i, "");
      fs.writeFileSync(outputPath, decodeURIComponent(raw));
    }
  }

  return path.relative(ROOT, outputPath).replace(/\\/g, "/");
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function chapterImageId(chapterNum, index) {
  return `chapter${chapterNum}-img-${String(index).padStart(3, "0")}`;
}

function splitSentences(text) {
  return normalizeText(text)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => normalizeText(sentence))
    .filter(Boolean);
}

function escapeForJsAssignment(data) {
  return `window.chapter${data.chapterNum}Data = ${JSON.stringify(data, null, 2)};\n`;
}

function loadAssignedWindowData(filePath, globalName) {
  const code = fs.readFileSync(filePath, "utf8");
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(code, context);
  return context.window[globalName];
}

function buildImageLookup(images = []) {
  return new Map(images.filter((image) => image?.imageId).map((image) => [image.imageId, image]));
}

function imageRef(imageId, placement, displayCaption) {
  return { imageId, placement, displayCaption };
}

function factBlock(label, text, apSignificance) {
  return {
    type: "fact",
    label,
    text,
    apSignificance
  };
}

function definitionBlock(term, definition, inContext, apRelevance) {
  return {
    type: "definition",
    term,
    definition,
    inContext,
    apRelevance
  };
}

function statBlock(label, value, date, apSignificance) {
  return {
    type: "stat",
    label,
    value,
    date,
    apSignificance
  };
}

function whoBlock(config) {
  return {
    type: "who",
    name: config.name,
    title: config.title,
    dates: config.dates || "",
    keyActions: config.keyActions || [],
    perspective: config.perspective || "",
    legacy: config.legacy || "",
    apSignificance: config.apSignificance || "",
    imageId: config.imageId || null
  };
}

function chainBlock(label, steps, apSignificance) {
  return {
    type: "chain",
    label,
    steps,
    apSignificance
  };
}

function clusterBlock(label, items, apSignificance) {
  return {
    type: "cluster",
    label,
    items,
    apSignificance
  };
}

function comparisonBlock(label, itemA, itemB, sharedTraits, apSignificance) {
  return {
    type: "comparison",
    label,
    itemA,
    itemB,
    sharedTraits,
    apSignificance
  };
}

function tensionBlock(label, sideA, sideB, outcome, apSignificance) {
  return {
    type: "tension",
    label,
    sideA,
    sideB,
    outcome,
    apSignificance
  };
}

function quoteBlock(text, attribution, context, apSignificance) {
  return {
    type: "quote",
    text,
    attribution,
    context,
    apSignificance
  };
}

function flattenBlockText(block) {
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
      return [
        block.label,
        ...(block.steps || []).flatMap((step) => [step.event, step.result]),
        block.apSignificance
      ].filter(Boolean).join(" ");
    case "cluster":
      return [
        block.label,
        ...(block.items || []).flatMap((item) => [item.name, item.description, item.date]),
        block.apSignificance
      ].filter(Boolean).join(" ");
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
}

function buildLegacyWhoBlocks(keyFigures = []) {
  return keyFigures.map((figure) => {
    const bioSentences = splitSentences(figure.bio || "");
    const significanceSentences = splitSentences(figure.significance || "");
    const keyActions = [
      bioSentences[0] || figure.bio || "",
      significanceSentences[0] || bioSentences[1] || ""
    ].filter(Boolean);

    return whoBlock({
      name: figure.name,
      title: figure.title,
      dates: "",
      keyActions,
      perspective: figure.perspective || "",
      legacy: figure.significance || "",
      apSignificance: figure.significance || figure.bio || "",
      imageId: figure.imageId || null
    });
  });
}

function buildLegacyContentBlocks(section) {
  const sentences = splitSentences(section.narrative || "");
  const overview = sentences.slice(0, 2).join(" ");
  const remaining = sentences.slice(2);
  const blocks = [];

  remaining.forEach((sentence, index) => {
    blocks.push(factBlock(
      index === 0 ? section.sectionTitle : `Section Detail ${index + 1}`,
      sentence,
      section.significance || `This detail helps explain why ${section.sectionTitle.toLowerCase()} mattered in the broader chapter.`
    ));
  });

  if ((section.causes || []).length || (section.effects || []).length) {
    const steps = [];
    const causes = (section.causes || []).slice(0, 2);
    const effects = (section.effects || []).slice(0, 2);

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

    blocks.push(chainBlock(
      `How ${section.sectionTitle} unfolded`,
      steps.slice(0, 5),
      section.significance || `This chain matters because APUSH questions often trace causes and consequences across the period.`
    ));
  }

  if ((section.primarySourceConnections || []).length) {
    blocks.push(clusterBlock(
      "Primary source windows",
      section.primarySourceConnections.map((item, index) => ({
        name: `Source ${index + 1}`,
        description: item,
        date: null
      })),
      "Primary-source analysis questions often use these examples to test contextualization and argumentation."
    ));
  }

  blocks.push(...buildLegacyWhoBlocks(section.keyFigures || []));

  if (section.significance) {
    blocks.push(factBlock(
      "AP significance",
      section.significance,
      "This is the clearest claim the textbook makes about why this development belongs in an APUSH argument."
    ));
  }

  if (blocks.length < 5) {
    (section.connections || []).forEach((connection, index) => {
      if (blocks.length < 5) {
        blocks.push(factBlock(
          `Connection ${index + 1}`,
          connection,
          "Cross-period links are frequently rewarded in LEQ and DBQ analysis."
        ));
      }
    });
  }

  while (blocks.length < 5) {
    blocks.push(factBlock(
      "Section takeaway",
      overview || section.sectionTitle,
      "This preserves a separate detail so the section remains fully structured rather than paragraph-based."
    ));
  }

  return {
    overview,
    contentBlocks: blocks
  };
}

function deriveLegacyExamAngles(section) {
  const firstCause = section.causes?.[0] || section.sectionTitle;
  const firstEffect = section.effects?.[0] || section.significance || section.sectionTitle;

  return [
    `Causation MCQs and SAQs often ask how ${firstCause} contributed to ${section.sectionTitle} and what changed as a result.`,
    `Argumentation and CCOT prompts use ${section.sectionTitle} to evaluate ${firstEffect}.`
  ];
}

function normalizeLegacySection(section) {
  const { overview, contentBlocks } = buildLegacyContentBlocks(section);
  return {
    sectionTitle: section.sectionTitle,
    apThemes: section.apThemes || [],
    overview,
    contentBlocks,
    sectionImages: section.sectionImages || [],
    apExamAngles: deriveLegacyExamAngles(section),
    connections: section.connections || []
  };
}

function upgradeLegacyChapter(data) {
  const upgraded = {
    chapterId: data.chapterId,
    chapterNum: data.chapterNum,
    periodId: data.periodId,
    chapterOrder: data.chapterOrder,
    images: JSON.parse(JSON.stringify(data.images || [])),
    chapterMeta: JSON.parse(JSON.stringify(data.chapterMeta || {})),
    notes: {
      historicalContext: JSON.parse(JSON.stringify(data.notes?.historicalContext || {})),
      sections: (data.notes?.sections || []).map(normalizeLegacySection),
      overarchingAnalysis: JSON.parse(JSON.stringify(data.notes?.overarchingAnalysis || {}))
    },
    chapterTimeline: JSON.parse(JSON.stringify(data.chapterTimeline || data.periodTimeline || [])),
    periodTimelineEvents: JSON.parse(JSON.stringify(data.periodTimelineEvents || [])),
    vocabulary: JSON.parse(JSON.stringify(data.vocabulary || [])),
    mcqQuestions: JSON.parse(JSON.stringify(data.mcqQuestions || [])),
    essayPractice: JSON.parse(JSON.stringify(data.essayPractice || {})),
    flashcards: JSON.parse(JSON.stringify(data.flashcards || []))
  };

  upgraded.periodTimeline = JSON.parse(JSON.stringify(upgraded.chapterTimeline));
  return upgraded;
}

function enhanceMcqDistractors(mcqQuestions = []) {
  const correctPool = mcqQuestions
    .map((question) => question.options?.[question.correctAnswer])
    .filter(Boolean);

  return mcqQuestions.map((question, index) => {
    const correct = question.options?.[question.correctAnswer] || "";
    const distractors = [];
    let cursor = index + 1;

    while (distractors.length < 3 && cursor < index + 400) {
      const candidate = correctPool[cursor % correctPool.length];
      if (candidate && candidate !== correct && !distractors.includes(candidate)) {
        distractors.push(candidate);
      }
      cursor += 1;
    }

    while (distractors.length < 3) {
      distractors.push(`A development more closely associated with another major issue from this chapter`);
    }

    return {
      ...question,
      options: {
        A: correct,
        B: distractors[0],
        C: distractors[1],
        D: distractors[2]
      },
      correctAnswer: "A",
      explanation: {
        correct: question.explanation?.correct || "",
        wrongB: question.explanation?.wrongB || "Choice B refers to a real development from the period, but it fits a different problem or turning point than the one identified in the question.",
        wrongC: question.explanation?.wrongC || "Choice C sounds plausible because it belongs to the same broad era, but it does not match the specific historical relationship being tested.",
        wrongD: question.explanation?.wrongD || "Choice D points to a different chapter theme and therefore does not directly answer the prompt."
      }
    };
  });
}

function updateSuggestedUse(data) {
  const notesImages = new Set();
  const mcqImages = new Set();
  const saqImages = new Set();
  const flashcardImages = new Set();
  const dbqImages = new Set();

  if (data.notes?.historicalContext?.contextImage?.imageId) {
    notesImages.add(data.notes.historicalContext.contextImage.imageId);
  }

  (data.notes?.sections || []).forEach((section) => {
    (section.sectionImages || []).forEach((image) => {
      if (image?.imageId) {
        notesImages.add(image.imageId);
      }
    });
  });

  (data.mcqQuestions || []).forEach((question) => {
    if (question.stimulusImageId) {
      mcqImages.add(question.stimulusImageId);
    }
  });

  (data.essayPractice?.saq || []).forEach((prompt) => {
    if (prompt.stimulusImageId) {
      saqImages.add(prompt.stimulusImageId);
    }
  });

  (data.flashcards || []).forEach((card) => {
    if (card.imageId) {
      flashcardImages.add(card.imageId);
    }
  });

  (data.essayPractice?.dbq || []).forEach((dbq) => {
    (dbq.documents || []).forEach((doc) => {
      if (doc.imageId) {
        dbqImages.add(doc.imageId);
      }
    });
  });

  data.images = (data.images || []).map((image) => {
    const suggestedUse = [];
    if (notesImages.has(image.imageId)) suggestedUse.push("notes");
    if (mcqImages.has(image.imageId)) suggestedUse.push("mcq-stimulus");
    if (saqImages.has(image.imageId)) suggestedUse.push("saq-stimulus");
    if (flashcardImages.has(image.imageId) || dbqImages.has(image.imageId)) suggestedUse.push("flashcard");

    return {
      ...image,
      suggestedUse: suggestedUse.length ? suggestedUse : ["flashcard"]
    };
  });
}

function reindexFlashcards(cards = [], chapterId, periodId) {
  return cards.map((card, index) => ({
    ...card,
    id: `${chapterId}-fc-${String(index + 1).padStart(3, "0")}`,
    chapterId,
    periodId
  }));
}

function extractChapterImages(chapterNum) {
  const files = fs.readdirSync(TEXTBOOK_DIR)
    .filter((file) => file.toLowerCase().endsWith(".html"))
    .filter((file) => new RegExp(`chapter\\s*${chapterNum}`, "i").test(file))
    .sort();

  const images = [];
  let rawIndex = 0;

  for (const file of files) {
    const html = fs.readFileSync(path.join(TEXTBOOK_DIR, file), "utf8");
    const imgRegex = /<img\b[^>]*>/gi;
    let match;
    while ((match = imgRegex.exec(html))) {
      rawIndex += 1;
      images.push({
        rawIndex,
        file,
        src: getAttr(match[0], "src"),
        alt: getAttr(match[0], "alt"),
        caption: getNearbyCaption(html, match.index)
      });
    }
  }

  return images;
}

function clearChapterImageDirectory(chapterNum) {
  const imageDir = path.join(ROOT, "images", `chapter${chapterNum}`);
  if (fs.existsSync(imageDir)) {
    fs.rmSync(imageDir, { recursive: true, force: true });
  }
  fs.mkdirSync(imageDir, { recursive: true });
  return imageDir;
}

function materializeSelectedImages(chapterNum, selections, periodId) {
  const extracted = extractChapterImages(chapterNum);
  const imageDir = clearChapterImageDirectory(chapterNum);

  return selections.map((selection, index) => {
    const raw = extracted.find((image) => image.rawIndex === selection.rawIndex);
    if (!raw) {
      throw new Error(`Missing raw image #${selection.rawIndex} for chapter ${chapterNum}`);
    }

    const imageId = chapterImageId(chapterNum, index + 1);
    const src = writeImageFile(raw.src, path.join(imageDir, imageId));

    return {
      imageId,
      src,
      alt: raw.alt || selection.alt || "",
      caption: selection.caption || raw.caption || "",
      relevanceScore: selection.relevanceScore,
      apCategory: selection.apCategory,
      description: selection.description,
      apThemes: selection.apThemes,
      suggestedUse: selection.suggestedUse || []
    };
  });
}

function makeTimelineEvent(spec, event) {
  return {
    id: event.id || `chapter${spec.chapterNum}-${slugify(event.title)}`,
    chapterId: spec.chapterId,
    periodId: spec.periodId,
    year: event.year,
    month: event.month ?? null,
    title: event.title,
    summary: event.summary,
    fullDescription: event.fullDescription,
    categories: event.categories,
    apThemes: event.apThemes,
    keyFigures: event.keyFigures || [],
    causes: event.causes || [],
    effects: event.effects || [],
    connectedEventIds: event.connectedEventIds || [],
    significance: event.significance || "Medium",
    apPriority: event.apPriority === true,
    essayRelevance: event.essayRelevance || "",
    commonMisconception: event.commonMisconception || "",
    imageId: event.imageId || null
  };
}

function makePeriodTimelineEvents(chapterId, periodId, timeline = []) {
  return timeline
    .filter((event) => event.apPriority && event.significance === "High")
    .slice(0, 8)
    .map((event) => ({
      id: event.id,
      chapterId,
      periodId,
      year: event.year,
      title: event.title,
      summary: event.summary.split(". ")[0].replace(/\.$/, "") + ".",
      categories: event.categories,
      apPriority: true,
      significance: event.essayRelevance || event.summary,
      imageId: event.imageId || null
    }));
}

function makeMcqsFromFacts(spec, images) {
  const imageIds = images.map((image) => image.imageId);
  const facts = Array.isArray(spec.mcqFacts) ? spec.mcqFacts : [];
  const totalQuestions = Math.max(50, facts.length);
  const buildQuestion = (fact, variantIndex) => {
    const topic = normalizeText(fact.topicTag || fact.correct || "this development");
    const variants = [
      fact.question || `Which statement about ${topic} is most accurate?`,
      `Which development best illustrates ${topic}?`,
      `A historian using ${topic} as evidence would most likely emphasize which of the following?`,
      `The APUSH significance of ${topic} is most directly connected to which broader development?`,
      `Which claim about ${topic} is best supported by the historical record?`
    ];

    return variants[variantIndex % variants.length];
  };

  return Array.from({ length: totalQuestions }, (_, index) => {
    const fact = facts[index % facts.length];
    const difficulty = index < 12 ? "Easy" : index < 32 ? "Medium" : "Hard";
    const imageStimulus = index < 8 ? imageIds[index % imageIds.length] : null;
    const textStimulus = index >= 8 && index < 14 ? spec.textStimuli[(index - 8) % spec.textStimuli.length] : null;
    const variantIndex = Math.floor(index / Math.max(facts.length, 1));

    return {
      id: `${spec.chapterId}-mcq-${String(index + 1).padStart(3, "0")}`,
      chapterId: spec.chapterId,
      difficulty,
      apSkill: fact.apSkill,
      stimulusType: imageStimulus ? "image" : textStimulus ? "text" : null,
      stimulusImageId: imageStimulus,
      stimulusText: textStimulus ? textStimulus.text : null,
      stimulusCaption: imageStimulus
        ? images.find((image) => image.imageId === imageStimulus)?.caption || null
        : textStimulus
          ? textStimulus.caption
          : null,
      question: buildQuestion(fact, variantIndex),
      options: {
        A: fact.correct,
        B: fact.wrong[0],
        C: fact.wrong[1],
        D: fact.wrong[2]
      },
      correctAnswer: "A",
      explanation: {
        correct: fact.explanation,
        wrongB: fact.wrongExplanationB || "Choice B belongs to the period but does not directly match the development described in the question.",
        wrongC: fact.wrongExplanationC || "Choice C confuses a related issue with the specific argument or outcome being tested.",
        wrongD: fact.wrongExplanationD || "Choice D points to a different turning point or theme than the one identified in the question."
      },
      topicTag: fact.topicTag,
      apTheme: fact.apTheme
    };
  });
}

function makeSaqs(spec, images) {
  return spec.saq.map((prompt, index) => {
    const stimulusType = index < 3 ? "image" : index < 6 ? "text" : "none";
    const stimulusImageId = stimulusType === "image" ? images[index % images.length].imageId : null;
    const textStimulus = stimulusType === "text" ? spec.textStimuli[(index - 3) % spec.textStimuli.length] : null;

    return {
      id: `${spec.chapterId}-saq-${String(index + 1).padStart(3, "0")}`,
      chapterId: spec.chapterId,
      stimulusType,
      stimulusImageId,
      stimulusText: textStimulus ? textStimulus.text : null,
      stimulusCaption: stimulusType === "image"
        ? images[index % images.length].caption
        : textStimulus
          ? textStimulus.caption
          : null,
      prompt: prompt.prompt,
      partA: prompt.partA,
      partB: prompt.partB,
      partC: prompt.partC,
      scoringGuidance: prompt.scoringGuidance,
      sampleAnswers: prompt.sampleAnswers
    };
  });
}

function makeFlashcards(spec, images, timeline) {
  const cards = [];
  let count = 1;
  const push = (type, front, back, hint, imageId, difficulty = "Medium", apPriority = true) => {
    cards.push({
      id: `${spec.chapterId}-fc-${String(count).padStart(3, "0")}`,
      chapterId: spec.chapterId,
      type,
      front,
      back,
      hint,
      imageId: imageId || null,
      periodId: spec.periodId,
      difficulty,
      apPriority
    });
    count += 1;
  };

  (spec.vocabulary || []).forEach((term) => {
    push("Term", term.term, `${term.definition} ${term.apRelevance}`.trim(), term.context, null, "Easy", true);
  });

  (spec.keyFigures || []).forEach((figure) => {
    push("Person", figure.name, `${figure.title}: ${figure.bio} ${figure.significance}`.trim(), figure.perspective, figure.imageId || null, "Medium", true);
  });

  timeline.slice(0, 12).forEach((event) => {
    push("Event", event.title, `${event.year}: ${event.summary} ${event.essayRelevance}`.trim(), event.commonMisconception || "Connect this event to a broader APUSH theme.", event.imageId || null, event.apPriority ? "Medium" : "Easy", event.apPriority);
  });

  (spec.conceptCards || []).forEach((card) => {
    push(card.type, card.front, card.back, card.hint, null, card.difficulty || "Hard", card.apPriority !== false);
  });

  images.filter((image) => image.relevanceScore >= 4).forEach((image) => {
    push("Visual", "What does this image show and why is it significant?", image.description, image.caption, image.imageId, "Medium", true);
  });

  while (cards.length < 40) {
    const event = timeline[(cards.length - spec.vocabulary.length) % timeline.length];
    push(
      "Cause-Effect",
      `What caused and resulted from ${event.title}?`,
      `Causes included ${event.causes.join(", ")}. Effects included ${event.effects.join(", ")}.`,
      event.essayRelevance,
      event.imageId || null,
      "Medium",
      event.apPriority
    );
  }

  return cards;
}

function buildChapterFromSpec(spec) {
  const images = materializeSelectedImages(spec.chapterNum, spec.imageSelections, spec.periodId);
  const timeline = spec.timeline.map((event) => makeTimelineEvent(spec, event));
  const data = {
    chapterId: spec.chapterId,
    chapterNum: spec.chapterNum,
    periodId: spec.periodId,
    chapterOrder: spec.chapterOrder,
    images,
    chapterMeta: spec.chapterMeta,
    notes: spec.notes,
    chapterTimeline: timeline,
    periodTimelineEvents: makePeriodTimelineEvents(spec.chapterId, spec.periodId, timeline),
    periodTimeline: JSON.parse(JSON.stringify(timeline)),
    vocabulary: spec.vocabulary,
    mcqQuestions: makeMcqsFromFacts(spec, images),
    essayPractice: {
      saq: makeSaqs(spec, images),
      leq: spec.leq,
      dbq: spec.dbq
    },
    flashcards: []
  };

  data.flashcards = makeFlashcards(spec, images, timeline);
  updateSuggestedUse(data);
  return data;
}

function writeChapterData(data) {
  const outputPath = path.join(ROOT, `chapter${data.chapterNum}-data.js`);
  fs.writeFileSync(outputPath, escapeForJsAssignment(data));
}

function loadLegacyBaseChapter(chapterNum) {
  return loadAssignedWindowData(
    path.join(ROOT, `chapter${chapterNum}-data.js`),
    `chapter${chapterNum}Data`
  );
}

function rewriteLegacyChapter(chapterNum) {
  const legacy = loadLegacyBaseChapter(chapterNum);
  const upgraded = upgradeLegacyChapter(legacy);
  upgraded.mcqQuestions = enhanceMcqDistractors(upgraded.mcqQuestions);
  upgraded.flashcards = reindexFlashcards(upgraded.flashcards, upgraded.chapterId, upgraded.periodId);
  updateSuggestedUse(upgraded);
  writeChapterData(upgraded);
  return upgraded;
}

const chapter27Spec = {
  chapterId: "chapter27",
  chapterNum: 27,
  chapterOrder: 27,
  periodId: "p9",
  chapterMeta: {
    ...PERIOD_META.p9,
    dateRange: "1989-2004",
    chapterTitle: "From Triumph to Tragedy, 1989-2004",
    chapterSubtitle: "Globalization, culture wars, and the War on Terror",
    bigPictureThemes: [THEME.world, THEME.work, THEME.culture],
    oneLineSummary: "The United States emerged from the Cold War as the world's dominant power, but globalization, intense cultural conflict, and the response to September 11 exposed new limits, divisions, and contradictions.",
    periodContext: "This chapter opens Period 9 by tracing what happened after the Cold War victory celebrated in the late 1980s. Instead of a stable liberal consensus, the United States confronted economic restructuring, demographic change, partisan warfare, and new forms of military conflict.",
    examTips: [
      "Do not treat the 1990s as simply a calm decade between the Cold War and 9/11; APUSH frequently tests globalization, NAFTA/WTO politics, and culture-war polarization.",
      "Use 9/11 and the Bush Doctrine together: the attacks explain the political opening for preemption, Afghanistan, Iraq, and expanded security powers at home.",
      "For continuity and change, connect late-twentieth-century immigration, incarceration, and identity politics to the rights revolutions of the 1960s and 1970s."
    ]
  },
  imageSelections: [
    {
      rawIndex: 11,
      relevanceScore: 5,
      apCategory: "Photograph",
      caption: "A democracy statue faced Mao Zedong's portrait during the Tiananmen Square protests in 1989.",
      description: "The image captures the global democratic hopes that accompanied the end of the Cold War. For APUSH, it matters because American leaders often read 1989 as proof that liberal capitalism and political freedom had triumphed.",
      apThemes: [THEME.world, THEME.politics]
    },
    {
      rawIndex: 72,
      relevanceScore: 5,
      apCategory: "Photograph",
      caption: "People stood atop the Berlin Wall as communist authority in Eastern Europe collapsed.",
      description: "This photograph symbolizes the fall of Soviet power and the apparent end of the Cold War. It is historically significant because it shaped the American belief that the United States had entered a unipolar moment.",
      apThemes: [THEME.world, THEME.identity]
    },
    {
      rawIndex: 71,
      relevanceScore: 5,
      apCategory: "Map",
      caption: "Oil fields clustered around the Persian Gulf remained central to post-Cold War American strategy.",
      description: "The map shows why Kuwait, Saudi Arabia, and Iraq mattered far beyond local politics. For APUSH, it explains how oil, military power, and post-Cold War intervention became closely linked.",
      apThemes: [THEME.world, THEME.geography]
    },
    {
      rawIndex: 40,
      relevanceScore: 5,
      apCategory: "Photograph",
      caption: "Workers at the Foxconn campus in China symbolize the global movement of manufacturing.",
      description: "The factory image visualizes globalization's reliance on transnational production and cheap labor. It matters because American consumers, corporations, and workers were all reshaped by the offshoring of manufacturing.",
      apThemes: [THEME.work, THEME.world]
    },
    {
      rawIndex: 46,
      relevanceScore: 5,
      apCategory: "Chart/Graph",
      caption: "A graph traces manufacturing's long decline as a share of the American economy.",
      description: "The chart quantifies deindustrialization in the post-1970 era. It is AP-relevant because it links the politics of globalization to class realignment, wage pressure, and regional change.",
      apThemes: [THEME.work, THEME.migration]
    },
    {
      rawIndex: 21,
      relevanceScore: 5,
      apCategory: "Map",
      caption: "Maps compare immigrant settlement patterns in 1900 and 2010.",
      description: "The maps show how post-1965 immigration transformed the geography of the United States. They matter because Period 9 debates over identity, bilingualism, and citizenship grew from this demographic shift.",
      apThemes: [THEME.migration, THEME.identity]
    },
    {
      rawIndex: 29,
      relevanceScore: 5,
      apCategory: "Photograph",
      caption: "A maximum-security prison stands in a desert landscape, reflecting the scale of mass incarceration.",
      description: "This photograph represents the spread of imprisonment late in the twentieth century. It is significant because criminal justice policy became a major site of racial inequality, state power, and culture-war politics.",
      apThemes: [THEME.politics, THEME.identity]
    },
    {
      rawIndex: 31,
      relevanceScore: 4,
      apCategory: "Photograph",
      caption: "The AIDS quilt brought grief, visibility, and political claims into public space.",
      description: "The AIDS Memorial Quilt turned private loss into a national political statement. For APUSH, it marks how the continuing rights revolution expanded debates over sexuality, citizenship, and public health.",
      apThemes: [THEME.culture, THEME.identity]
    },
    {
      rawIndex: 53,
      relevanceScore: 5,
      apCategory: "Map",
      caption: "The election map of 2000 reflects the regional polarization of the Bush-Gore contest.",
      description: "The map shows the divisive and geographically uneven result of the 2000 presidential election. It is significant because the razor-thin outcome intensified distrust of institutions and foreshadowed durable partisan polarization.",
      apThemes: [THEME.politics, THEME.geography]
    },
    {
      rawIndex: 67,
      relevanceScore: 5,
      apCategory: "Photograph",
      caption: "The World Trade Center burned after the terrorist attacks of September 11, 2001.",
      description: "This photograph records the most dramatic terrorist attack ever carried out on American soil. It matters for APUSH because 9/11 transformed foreign policy, civil liberties, and political rhetoric about freedom and security.",
      apThemes: [THEME.world, THEME.politics]
    },
    {
      rawIndex: 59,
      relevanceScore: 4,
      apCategory: "Photograph",
      caption: "A scene at Guantanamo Bay evokes the detention regime created after September 11.",
      description: "The image represents the offshore detention system used in the War on Terror. It is historically significant because it exposes the tension between national-security claims and constitutional traditions.",
      apThemes: [THEME.politics, THEME.world]
    },
    {
      rawIndex: 61,
      relevanceScore: 5,
      apCategory: "Political Cartoon",
      caption: "A hooded prisoner image echoes the abuses that came to symbolize the moral costs of the War on Terror.",
      description: "The image recalls the visual language of torture and prisoner abuse that shocked the world. For APUSH, it illustrates how the War on Terror damaged American claims to be defending liberty and human rights.",
      apThemes: [THEME.politics, THEME.world]
    },
    {
      rawIndex: 5,
      relevanceScore: 5,
      apCategory: "Political Cartoon",
      caption: "An 'Iraq War Memorial' cartoon tied the invasion to oil and imperial ambition.",
      description: "The cartoon captures a major critique of the Iraq War: that strategic and economic interests were driving intervention. It matters because APUSH essays often ask students to evaluate whether post-Cold War American power became imperial.",
      apThemes: [THEME.world, THEME.work]
    },
    {
      rawIndex: 8,
      relevanceScore: 5,
      apCategory: "Photograph",
      caption: "George W. Bush's 'Mission Accomplished' appearance became shorthand for the Iraq War's misjudged optimism.",
      description: "The photograph shows the administration's early declaration of success in Iraq. It is significant because later insurgency and occupation violence made it a symbol of the gap between wartime rhetoric and reality.",
      apThemes: [THEME.world, THEME.politics]
    }
  ],
  notes: {
    historicalContext: {
      overview: "The late Cold War ended with the Soviet bloc weakening, communist governments collapsing in Eastern Europe, and American conservatives claiming that free markets and democracy had defeated their twentieth-century rivals. At the same time, Reagan-era deregulation, finance, and deindustrialization had already reshaped the economy. Immigration patterns created by the 1965 law continued to diversify the nation. These developments formed the backdrop to a period that mixed triumphal confidence with deepening instability.",
      precedingCauses: [
        "The collapse of Soviet authority in Eastern Europe and the dissolution of the Soviet Union created a unipolar world in which the United States faced no rival superpower.",
        "Deindustrialization, global finance, and corporate restructuring continued the economic changes that had accelerated in the 1970s and 1980s.",
        "Post-1965 immigration and the continuing rights revolutions of women, gay Americans, Native Americans, and racial minorities intensified debates over national identity and citizenship."
      ],
      geographicContext: "Post-Cold War conflicts centered heavily on the Persian Gulf, the Balkans, Afghanistan, and Iraq, while immigration and economic globalization tied the United States more tightly to Mexico, East Asia, and transnational supply chains.",
      contextImage: {
        imageId: "chapter27-img-002",
        displayCaption: "The fall of communist barriers encouraged Americans to imagine a new era of liberal triumph."
      }
    },
    sections: [
      {
        sectionTitle: "The Post-Cold War World",
        apThemes: [THEME.world, THEME.politics, THEME.geography],
        overview: "The Cold War's end appeared to vindicate American capitalism and military leadership, but the new world order still depended on intervention, alliances, and unstable regional power balances.",
        contentBlocks: [
          factBlock("Panama, 1989", "George H. W. Bush sent troops to Panama in 1989 to remove Manuel Noriega, a former American ally tied to the drug trade, showing that intervention in the Western Hemisphere outlived the Cold War.", "This is useful evidence for continuity in U.S. interventionism after earlier anti-communist campaigns."),
          chainBlock("The Gulf crisis, 1990-1991", [
            { step: 1, event: "Iraq invaded and annexed Kuwait in 1990.", result: "Bush feared that Saddam Hussein might next threaten Saudi Arabia and the oil supplies of the Persian Gulf." },
            { step: 2, event: "The United States assembled a broad international coalition and deployed troops to the region.", result: "Operation Desert Storm drove Iraqi forces from Kuwait in early 1991." },
            { step: 3, event: "The United Nations ordered Iraq to disarm, but Hussein remained in power.", result: "Long-term sanctions and a lasting U.S. military presence in the Gulf followed." }
          ], "APUSH often tests how post-Cold War intervention combined multilateral language with enduring strategic interests."),
          whoBlock({
            name: "George H. W. Bush",
            title: "President",
            keyActions: [
              "Ordered the Panama intervention and built the coalition that fought the Gulf War.",
              "Framed the early 1990s as a 'new world order' in which the United States would lead global responses to aggression."
            ],
            perspective: "Cold War internationalist committed to managed American leadership.",
            legacy: "Bush oversaw the first major exercise of American power after the Soviet collapse.",
            apSignificance: "He appears in questions about the transition from Cold War containment to post-Cold War intervention."
          }),
          factBlock("The Soviet collapse", "The dissolution of the Soviet Union in 1991 left the United States as the world's only superpower and encouraged Americans to believe that history now favored markets, democracy, and U.S. influence.", "This supplies the core context for Period 9 foreign policy and American triumphalism."),
          comparisonBlock(
            "Cold War confrontation versus post-Cold War intervention",
            {
              label: "Cold War model",
              points: [
                "Policy focused on containing a rival superpower.",
                "Wars and alliances were justified primarily in anti-communist terms.",
                "American leaders could explain intervention as part of bipolar competition."
              ]
            },
            {
              label: "Post-Cold War model",
              points: [
                "The United States acted without a single global rival.",
                "Operations in Panama and the Gulf were justified through security, law, and regional stability.",
                "American power increasingly looked unilateral even when backed by coalitions."
              ]
            },
            ["In both eras, U.S. leaders linked military action to the defense of freedom and order."],
            "Comparison prompts often ask how the end of the Cold War changed the language and structure of American power."
          ),
          factBlock("Yugoslavia and ethnic conflict", "The post-Cold War era also saw brutal ethnic violence in the Balkans, reminding Americans that the disappearance of Soviet power did not produce a peaceful or ideologically simple world.", "This adds complexity to claims that 1989 created a stable liberal world order.")
        ],
        sectionImages: [
          imageRef("chapter27-img-001", "after-overview", "Tiananmen Square symbolized the democratic hopes and contradictions of 1989."),
          imageRef("chapter27-img-002", "after-block-4", "The Berlin Wall's fall fed the belief that the United States had entered a unipolar moment."),
          imageRef("chapter27-img-003", "after-block-2", "The Persian Gulf remained strategically central because of oil and regional military balance.")
        ],
        apExamAngles: [
          "Contextualization and causation questions often ask how the Soviet collapse shaped the Bush administration's confidence in intervention.",
          "Argumentation prompts use the Gulf War to test whether post-Cold War American power was multilateral leadership or disguised imperialism."
        ],
        connections: [
          "Links back to Chapter 26 because Reagan-era military buildup and late Cold War diplomacy created the setting for Bush's unipolar moment."
        ]
      },
      {
        sectionTitle: "Globalization and its Discontents",
        apThemes: [THEME.work, THEME.world, THEME.geography, THEME.culture],
        overview: "Globalization connected production, consumption, finance, and information across borders, but it also sharpened debates over labor, environment, sovereignty, and inequality.",
        contentBlocks: [
          definitionBlock("globalization", "The process by which people, capital, goods, information, and culture increasingly moved across national boundaries.", "By the 1990s, commentators treated globalization as the defining force remaking work, politics, and everyday life.", "This is one of the central Period 9 concepts on APUSH exams."),
          factBlock("Seattle, 1999", "More than 30,000 protesters gathered in Seattle during a World Trade Organization meeting, uniting labor activists, environmentalists, and antiglobalization critics who believed that corporate power was outrunning democracy.", "This event is frequently used to test the backlash against free-trade optimism in the 1990s."),
          factBlock("Corporate reach", "Companies such as Microsoft, Starbucks, and Apple came to symbolize an American economy increasingly tied to global brands, transnational supply chains, and information technology.", "This shows how economic power in Period 9 shifted toward technology, finance, and global consumption."),
          comparisonBlock(
            "Competing views of globalization",
            {
              label: "Supporters",
              points: [
                "Argued that free trade, open markets, and technology would raise efficiency and expand prosperity.",
                "Saw institutions such as the WTO as tools for managing a more integrated world economy.",
                "Linked globalization to the spread of democracy and consumer choice."
              ]
            },
            {
              label: "Critics",
              points: [
                "Argued that corporations moved factories abroad in search of cheap labor and weak regulation.",
                "Warned that workers, small producers, and national governments lost control over economic decisions.",
                "Connected globalization to environmental degradation, sweatshops, and democratic unaccountability."
              ]
            },
            ["Both sides recognized that national economies were becoming far more interconnected than before."],
            "APUSH comparison questions regularly ask students to contrast free-trade advocates with critics of outsourcing and deregulation."
          ),
          statBlock("Manufacturing decline", "Manufacturing's share of the American economy declined steadily after 1970.", "1970s-2000s", "This trend explains why globalization debates were closely tied to deindustrialization and the fate of blue-collar labor."),
          factBlock("NAFTA and border economies", "Trade integration with Mexico accelerated cross-border production and migration debates, encouraging Americans to connect factory relocation, immigration, and wage pressure in new ways.", "This helps explain why economic and immigration politics increasingly overlapped in Period 9."),
          factBlock("Technology and information", "Personal computers, the internet, and the expanding reach of digital communication made globalization feel immediate, not abstract, by changing how Americans worked, shopped, and received news.", "This matters because APUSH sometimes tests how technological change reshaped both economic life and political culture.")
        ],
        sectionImages: [
          imageRef("chapter27-img-004", "after-overview", "Global production depended on overseas labor sites such as the Foxconn complex."),
          imageRef("chapter27-img-005", "after-block-4", "Manufacturing decline visualized the economic restructuring behind globalization."),
          imageRef("chapter27-img-012", "after-block-2", "Environmental and labor protesters in Seattle attacked the human costs of deregulated trade.")
        ],
        apExamAngles: [
          "Causation questions often connect globalization to deindustrialization, labor weakness, and new immigration tensions.",
          "Comparison and argumentation prompts use Seattle, NAFTA, and the WTO to test whether globalization expanded freedom or concentrated corporate power."
        ],
        connections: [
          "Connects to Chapter 26 because the deindustrialization and anti-tax politics of the 1970s and 1980s helped set the stage for global economic restructuring."
        ]
      },
      {
        sectionTitle: "Culture Wars",
        apThemes: [THEME.identity, THEME.culture, THEME.migration, THEME.politics],
        overview: "Late-twentieth-century politics increasingly revolved around identity, immigration, incarceration, sexuality, and historical memory rather than a single Cold War consensus about American purpose.",
        contentBlocks: [
          statBlock("Post-1965 immigration", "Nearly 38 million immigrants entered the United States between 1965 and 2010.", "1965-2010", "This exact figure helps explain why demographic change became central to debates over language, schooling, and citizenship."),
          factBlock("New diversity", "Because immigration after 1965 came overwhelmingly from Latin America and Asia rather than Europe, racial and cultural diversity became far more visible across the nation.", "This is essential context for identity politics and multiculturalism in Period 9."),
          tensionBlock(
            "Multiculturalism and the identity debate",
            {
              label: "Multicultural advocates",
              points: [
                "Argued that schools, museums, and public culture should acknowledge the histories of groups long excluded from national narratives.",
                "Connected citizenship to recognition, bilingual education, and racial or ethnic pride.",
                "Saw diversity as a strength rather than a threat to the nation."
              ]
            },
            {
              label: "Cultural conservatives",
              points: [
                "Argued that a common national culture was being weakened by excessive attention to group difference.",
                "Criticized affirmative action, bilingualism, and identity-based curricula as divisive.",
                "Presented family values, patriotism, and traditional morality as the anchors of social order."
              ]
            },
            "The conflict remained unresolved and shaped election campaigns, school battles, and media politics well into the twenty-first century.",
            "This tension is central to APUSH arguments about the meaning of citizenship and national identity."
          ),
          factBlock("Mass incarceration", "The spread of imprisonment fell especially heavily on African Americans and Latinos, making criminal justice a defining part of the culture wars and a major source of racial inequality.", "This offers strong evidence for continuity in structural racial inequality after the civil rights era."),
          factBlock("AIDS and the continuing rights revolution", "The AIDS crisis forced public recognition of gay communities and reshaped activism around health, sexuality, and citizenship, while the AIDS quilt turned grief into a national public claim.", "APUSH often uses this to show that rights politics continued after the classic 1960s movements."),
          factBlock("The antigovernment extreme", "The Oklahoma City bombing revealed how anti-federal paranoia and militant antigovernment rhetoric could turn violent inside the United States.", "This matters because it complicates any simple story that terrorism only came from abroad."),
          factBlock("Family structure and moral politics", "Conservatives worried about divorce, single-parent households, abortion, and same-sex relationships, while liberals argued that freedom required broader acceptance of family diversity.", "This is core evidence for the social side of culture-war polarization.")
        ],
        sectionImages: [
          imageRef("chapter27-img-006", "after-overview", "Immigration maps show how diversity spread far beyond the older northeastern gateways."),
          imageRef("chapter27-img-007", "after-block-3", "The carceral landscape illustrates the physical scale of mass incarceration."),
          imageRef("chapter27-img-008", "after-block-4", "The AIDS quilt made the continuing rights revolution visible in public memory.")
        ],
        apExamAngles: [
          "Comparison prompts often ask students to connect multiculturalism and immigration debates to earlier arguments over assimilation, citizenship, and pluralism.",
          "CCOT essays use incarceration and identity politics to evaluate what changed and what endured after the civil rights movement."
        ],
        connections: [
          "Builds directly on Chapter 25 and Chapter 26 because feminism, gay rights, Native sovereignty, and backlash politics all intensified in new forms after the 1960s."
        ]
      },
      {
        sectionTitle: "Impeachment and the Election of 2000",
        apThemes: [THEME.politics, THEME.culture],
        overview: "Even as Bill Clinton governed from the center and presided over economic growth, partisan hostility intensified, public and private morality became politically weaponized, and the 2000 election ended in institutional crisis.",
        contentBlocks: [
          factBlock("Clinton and triangulation", "Clinton moved toward the political center on welfare, crime, and budget policy, but conservatives continued to treat him as a symbol of everything they hated about the 1960s.", "This helps explain why prosperity did not reduce partisan warfare."),
          factBlock("Public scrutiny of private life", "In the 1990s, the private conduct of politicians became a routine subject of public combat, as seen earlier in the Anita Hill-Clarence Thomas hearings and later in the Monica Lewinsky scandal.", "This matters because culture-war politics blurred the line between policy conflict and moral spectacle."),
          chainBlock("From Lewinsky to impeachment", [
            { step: 1, event: "Clinton's affair with Monica Lewinsky became public in 1998.", result: "Independent counsel Kenneth Starr shifted his investigation toward whether the president had lied under oath." },
            { step: 2, event: "The House of Representatives impeached Clinton.", result: "The Senate then held a trial on charges centered on perjury and obstruction." },
            { step: 3, event: "Clinton was acquitted and remained in office.", result: "The episode deepened partisan mistrust instead of producing national closure." }
          ], "APUSH often tests how impeachment reflected the intensity of 1990s partisanship rather than simple constitutional consensus."),
          factBlock("Bush v. Gore", "The election of 2000 hinged on disputed Florida ballots, a Supreme Court ruling that stopped the recount, and an Electoral College outcome that awarded the presidency to George W. Bush.", "This is a major APUSH example of institutional conflict, judicial power, and political polarization."),
          statBlock("The election map", "The 2000 map displayed a sharp red-blue regional divide.", "2000", "This visual pattern foreshadowed the geographic polarization that hardened in later elections."),
          whoBlock({
            name: "Bill Clinton",
            title: "President",
            keyActions: [
              "Governed from the center while embracing budget discipline and selective reform.",
              "Survived impeachment but left office as a focal point of intense partisan and cultural conflict."
            ],
            perspective: "New Democrat who tried to reconcile liberal and centrist constituencies.",
            legacy: "Clinton's presidency linked prosperity, triangulation, and unrelenting culture-war hostility.",
            apSignificance: "He appears in questions about triangulation, impeachment, and the politics of the 1990s."
          })
        ],
        sectionImages: [
          imageRef("chapter27-img-009", "after-overview", "The 2000 election map made partisan geography unusually visible."),
          imageRef("chapter27-img-010", "after-block-2", "Clinton-era scandal politics turned morality and governance into one continuous spectacle.")
        ],
        apExamAngles: [
          "Argumentation prompts use impeachment and Bush v. Gore to evaluate whether the 1990s strengthened or weakened trust in institutions.",
          "Causation questions often ask how 1990s culture wars shaped later partisan polarization."
        ],
        connections: [
          "Connects to Chapter 28 because the polarized electoral map and distrust surrounding 2000 persisted into the Obama and Trump years."
        ]
      },
      {
        sectionTitle: "The Attacks of September 11",
        apThemes: [THEME.world, THEME.politics],
        overview: "The terrorist attacks of September 11, 2001, immediately shattered the sense of post-Cold War invulnerability and refocused American politics around fear, patriotism, and security.",
        contentBlocks: [
          factBlock("The attacks", "Hijackers seized four passenger jets on the morning of September 11, crashing two into the World Trade Center, one into the Pentagon, and one in Pennsylvania after passengers fought back.", "This is the defining event that anchors Period 9 foreign-policy and civil-liberties questions."),
          statBlock("Immediate destruction", "The attacks turned September 11 into one of the most tragic dates in American history.", "2001", "APUSH questions often use 9/11 as the hinge between 1990s post-Cold War politics and the War on Terror."),
          factBlock("Al Qaeda", "The Bush administration blamed Al Qaeda, led by Osama bin Laden, whose earlier anti-Soviet activism in Afghanistan had intersected with American Cold War policy in the 1980s.", "This is crucial for linking the War on Terror back to late Cold War intervention."),
          whoBlock({
            name: "Osama bin Laden",
            title: "Leader of Al Qaeda",
            keyActions: [
              "Built an international terrorist organization after the Afghan war against the Soviet Union.",
              "Planned attacks on the United States that turned nonstate violence into the central security issue of the early twenty-first century."
            ],
            perspective: "Militant Islamist opponent of American military and cultural influence in the Middle East.",
            legacy: "Bin Laden became the symbolic enemy of the War on Terror and a reminder of unintended blowback from earlier policy.",
            apSignificance: "He appears in APUSH questions as the figure linking Cold War Afghanistan to post-9/11 conflict."
          }),
          factBlock("Patriotic response", "An outpouring of spontaneous patriotism followed the attacks, with citizens displaying flags, honoring victims, and accepting an expanded national-security state.", "This helps explain the political space the Bush administration gained in late 2001."),
          quoteBlock("“Freedom and fear are at war.”", "George W. Bush, address to Congress, September 20, 2001", "Bush echoed the moral language of earlier wartime presidents by describing the crisis as a struggle for human freedom.", "This line is AP-relevant because it shows continuity in the language presidents used to mobilize support for war.")
        ],
        sectionImages: [
          imageRef("chapter27-img-011", "after-overview", "September 11 immediately reoriented American politics around vulnerability and security.")
        ],
        apExamAngles: [
          "Contextualization questions ask students to connect 9/11 to both earlier Middle East intervention and later domestic security expansion.",
          "Argumentation prompts often use Bush's language of freedom to compare the War on Terror to earlier wartime mobilizations."
        ],
        connections: [
          "Connects back to Chapter 23 because both the early Cold War and the post-9/11 moment used freedom rhetoric to justify a durable security state."
        ]
      },
      {
        sectionTitle: "The War on Terrorism",
        apThemes: [THEME.world, THEME.politics],
        overview: "After September 11, the Bush administration used the language of freedom to justify a global, open-ended war that began in Afghanistan and expanded through the Bush Doctrine of preemption.",
        contentBlocks: [
          definitionBlock("Bush Doctrine", "The post-9/11 foreign-policy principle that the United States could act preemptively against states or groups it believed threatened its security.", "The doctrine rejected any middle ground in the new war and widened the scope of possible intervention.", "This term frequently appears in APUSH essays about unilateralism and preemptive war."),
          chainBlock("Afghanistan to Iraq", [
            { step: 1, event: "The United States invaded Afghanistan in 2001 to overthrow the Taliban and pursue Al Qaeda.", result: "The initial campaign won widespread international support." },
            { step: 2, event: "Bush's advisers then argued that Saddam Hussein's Iraq posed a threat through weapons of mass destruction and regional instability.", result: "The administration turned from retaliation against terrorism toward preemptive war." },
            { step: 3, event: "The United States invaded Iraq in 2003.", result: "The occupation generated insurgency, instability, and international criticism." }
          ], "APUSH causation questions frequently ask students to distinguish the broadly supported Afghanistan war from the far more divisive Iraq invasion."),
          whoBlock({
            name: "George W. Bush",
            title: "President",
            keyActions: [
              "Turned the response to September 11 into a broad war on terrorism and made freedom its central public language.",
              "Approved the invasions of Afghanistan and Iraq and embraced the doctrine of preemptive action."
            ],
            perspective: "Post-9/11 executive nationalist who framed American power as a defense of liberty.",
            legacy: "Bush reshaped U.S. foreign policy, military commitments, and civil-liberties debates for the rest of Period 9.",
            apSignificance: "He is central to questions about unilateralism, the Iraq War, and the expansion of executive power."
          }),
          factBlock("Freedom rhetoric", "Bush, like FDR, Truman, and Reagan before him, made freedom the rallying cry of wartime politics, presenting terror and tyranny as the universal enemies of the United States.", "This is valuable continuity evidence across multiple eras."),
          factBlock("A vague enemy", "Unlike earlier wars against clearly bounded nation-states, the war on terrorism targeted a diffuse network of enemies and had no clear timetable for victory.", "This helps explain why the conflict remained open-ended and politically elastic."),
          factBlock("International strain", "Support for Afghanistan did not automatically extend to Iraq, and many allies feared that the United States was claiming a right to act as a world policeman.", "This is central to evaluating whether the post-Cold War United States acted multilaterally or unilaterally.")
        ],
        sectionImages: [
          imageRef("chapter27-img-012", "after-block-1", "Guantanamo detention symbolized the institutional reach of the War on Terror."),
          imageRef("chapter27-img-013", "after-overview", "The 'Iraq War Memorial' cartoon captured the claim that intervention and oil were intertwined."),
          imageRef("chapter27-img-014", "after-block-2", "The 'Mission Accomplished' image became a lasting symbol of misplaced wartime optimism.")
        ],
        apExamAngles: [
          "Comparison and argumentation questions often ask students to compare the Bush Doctrine to Cold War containment or earlier interventionist doctrines.",
          "DBQ-style prompts use Afghanistan and Iraq to test whether post-9/11 war policy expanded or undermined American freedom."
        ],
        connections: [
          "Connects to Chapter 27's globalization section because the same transnational networks that moved goods and information also shaped the language of borderless threats."
        ]
      },
      {
        sectionTitle: "The Aftermath of September 11 at Home",
        apThemes: [THEME.politics, THEME.identity],
        overview: "The domestic response to September 11 expanded surveillance, detention, and executive power while reviving long-standing American arguments about liberty, dissent, and security in wartime.",
        contentBlocks: [
          definitionBlock("USA Patriot Act", "A sweeping law passed after September 11 that greatly expanded surveillance and law-enforcement powers in the name of preventing terrorism.", "Congress approved the act quickly, and many members admitted they had not read the entire bill before voting.", "This is a foundational Period 9 civil-liberties term."),
          factBlock("Military tribunals", "In November 2001, the administration authorized secret military tribunals for noncitizens accused of assisting terrorism, limiting access to lawyers, evidence, and traditional courtroom protections.", "This is important evidence for wartime executive expansion."),
          factBlock("Detention and citizenship", "The Justice Department claimed that even American citizens could be held indefinitely as enemy combatants, echoing earlier national-security arguments that had restricted civil liberties in wartime.", "This supports continuity arguments across World War II, the Red Scare, and the War on Terror."),
          tensionBlock(
            "Security versus liberty after 9/11",
            {
              label: "Security advocates",
              points: [
                "Argued that unconventional terrorism required faster intelligence sharing and broader police powers.",
                "Defended detention, surveillance, and interrogation as necessary tools against a hidden enemy.",
                "Claimed that another mass-casualty attack would be catastrophic if officials hesitated."
              ]
            },
            {
              label: "Civil-liberties critics",
              points: [
                "Warned that vague definitions of domestic terrorism threatened speech, privacy, and due process.",
                "Criticized secret prisons, military tribunals, and indefinite detention as violations of constitutional norms.",
                "Argued that torture and humiliation at sites such as Abu Ghraib discredited American claims about freedom."
              ]
            },
            "The conflict remained unresolved; courts, activists, and later administrations limited some practices, but the security state persisted.",
            "This is one of the clearest APUSH examples of how war reshapes civil liberties."
          ),
          factBlock("Abu Ghraib and moral damage", "Photographs and reports of abuse at Abu Ghraib prison made it far harder for the United States to present itself as the global guardian of human rights.", "This is a powerful complexity point for essays about American power."),
          factBlock("Homeland security state", "The post-9/11 years normalized new expectations of airport screening, data collection, intelligence coordination, and suspicion toward Muslim Americans and immigrants.", "This helps students explain how foreign policy crises transform domestic political culture.")
        ],
        sectionImages: [
          imageRef("chapter27-img-012", "after-overview", "Guantanamo became one of the most visible symbols of detention without ordinary legal process."),
          imageRef("chapter27-img-011", "after-block-4", "Abuse imagery turned the domestic security debate into an international legitimacy crisis.")
        ],
        apExamAngles: [
          "Continuity and change questions use the Patriot Act and wartime detention to compare 9/11 with earlier moments such as Japanese internment or McCarthy-era loyalty politics.",
          "Argumentation prompts often ask whether expanded executive power after 9/11 protected or endangered American freedom."
        ],
        connections: [
          "Connects directly to Chapter 23 because national-security politics once again narrowed civil liberties while claiming to defend freedom."
        ]
      },
      {
        sectionTitle: "An American Empire?",
        apThemes: [THEME.world, THEME.politics, THEME.work],
        overview: "The Iraq War revived arguments that the United States had become an empire, because unmatched power, military occupation, and oil politics seemed to push post-Cold War leadership toward coercive dominance.",
        contentBlocks: [
          factBlock("Unmatched power", "By the early 2000s, the United States still far outpaced every other country in military, economic, and cultural power and maintained bases across the globe.", "This is the essential context for the imperial debate."),
          factBlock("Charges of empire", "Critics argued that the United States was claiming the right to reorder other nations while expecting little restraint from allies, international law, or global opinion.", "This claim appears in APUSH arguments about unilateralism and hegemony."),
          comparisonBlock(
            "Leadership or empire?",
            {
              label: "Defenders of U.S. leadership",
              points: [
                "Claimed the United States was using power to remove dictators, defend allies, and spread freedom.",
                "Pointed to elections and constitutional language in occupied Iraq as evidence against old-style colonialism.",
                "Argued that no rival power could provide comparable order."
              ]
            },
            {
              label: "Critics of empire",
              points: [
                "Pointed to long occupations, military bases, and strategic oil interests.",
                "Argued that preemptive war and regime change resembled imperial domination even without formal annexation.",
                "Highlighted the civilian costs and instability produced by occupation."
              ]
            },
            ["Both sides agreed that the United States possessed unmatched global reach after the Cold War."],
            "This comparison is well suited to LEQ or DBQ argumentation about American power in Period 9."
          ),
          factBlock("Iraq occupation", "Bush advisers predicted that Iraqis would welcome the invasion, but insurgency, sectarian conflict, and occupation violence turned the war into a grinding struggle.", "This is crucial evidence against early triumphalist claims."),
          factBlock("Another Vietnam?", "As casualties rose and antiwar protest spread, Americans increasingly compared Iraq to Vietnam as a costly war fought in the name of freedom without a clear path to victory.", "This provides a direct cross-period comparison APUSH rewards."),
          quoteBlock("Many overseas observers feared that the United States was claiming the right to act as a world policeman.", "Textbook discussion of the Iraq debate", "The tone of the period shifted from early post-9/11 sympathy to deep anxiety about unilateral American power.", "This captures the international backlash that complicated the image of the United States as liberator.")
        ],
        sectionImages: [
          imageRef("chapter27-img-013", "after-overview", "The cartoon tied war memory, oil, and intervention together in one stark imperial critique."),
          imageRef("chapter27-img-014", "after-block-3", "Mission Accomplished became shorthand for how badly early occupation assumptions misfired.")
        ],
        apExamAngles: [
          "Comparison essays often ask students to weigh how closely Iraq resembled Vietnam in limits, legitimacy, and public opposition.",
          "Argumentation prompts use the empire debate to test whether post-Cold War American power should be seen as liberation, hegemony, or both."
        ],
        connections: [
          "This section links back to Chapter 26 because Vietnam remained the most powerful historical analogy for evaluating the Iraq occupation."
        ]
      }
    ],
    overarchingAnalysis: {
      continuity: "The United States still described foreign policy in the language of freedom, still projected military power abroad, and still debated who counted fully as American within a changing society.",
      change: "The Cold War's bipolar structure disappeared, globalization became the dominant economic framework, and nonstate terrorism replaced communism as the central security threat.",
      complexity: "The period looked triumphant from one angle because the United States stood alone as a superpower, but the same moment exposed how military supremacy, cultural conflict, and economic integration could deepen vulnerability and division.",
      comparisonAngles: [
        "Compare post-9/11 civil-liberties disputes with World War II internment and the anticommunist politics of the early Cold War.",
        "Compare the Iraq War with Vietnam as examples of prolonged conflict justified through the language of freedom and credibility."
      ]
    }
  },
  vocabulary: [
    { term: "Globalization", definition: "The growing movement of capital, goods, labor, information, and culture across national borders.", context: "Globalization shaped work, migration, and political protest in the 1990s and early 2000s.", apRelevance: "A defining Period 9 concept that often appears in comparison and causation questions." },
    { term: "World Trade Organization (WTO)", definition: "An international body created to reduce trade barriers and settle commercial disputes.", context: "The WTO meeting in Seattle became a focal point for antiglobalization protest.", apRelevance: "Useful evidence for trade politics and globalization backlash." },
    { term: "NAFTA", definition: "The North American Free Trade Agreement linking the United States, Mexico, and Canada in a large free-trade zone.", context: "NAFTA intensified debates over factory relocation, migration, and wages.", apRelevance: "Frequently used as evidence in arguments about globalization." },
    { term: "Multiculturalism", definition: "The idea that American public life should recognize and value cultural, racial, and ethnic diversity.", context: "Multiculturalism became a central battlefield in the culture wars.", apRelevance: "Important for identity and citizenship questions." },
    { term: "Culture Wars", definition: "Political conflict centered on morality, identity, family, religion, and historical memory.", context: "The 1990s saw these disputes expand far beyond electoral politics.", apRelevance: "A core interpretive concept for late twentieth-century politics." },
    { term: "Mass Incarceration", definition: "The dramatic expansion of imprisonment and punitive criminal justice policy in the late twentieth century.", context: "The burden of imprisonment fell heavily on African Americans and Latinos.", apRelevance: "Important for essays about continuity in racial inequality." },
    { term: "AIDS Quilt", definition: "A massive memorial project commemorating those who died of AIDS.", context: "The quilt made the AIDS crisis and gay activism visible in national public culture.", apRelevance: "Evidence for the continuing rights revolution." },
    { term: "Impeachment", definition: "The constitutional process by which the House charges a federal official with misconduct and the Senate tries the case.", context: "Bill Clinton was impeached in 1998 but acquitted by the Senate.", apRelevance: "Important for institutional conflict and 1990s partisanship." },
    { term: "Bush v. Gore", definition: "The 2000 Supreme Court case that halted the Florida recount and effectively awarded the presidency to George W. Bush.", context: "The decision intensified public distrust after the contested election of 2000.", apRelevance: "A common example of judicial power affecting national politics." },
    { term: "Al Qaeda", definition: "A transnational Islamist terrorist organization led by Osama bin Laden.", context: "Al Qaeda carried out the attacks of September 11, 2001.", apRelevance: "Essential for understanding the War on Terror." },
    { term: "September 11", definition: "The terrorist attacks of September 11, 2001, on New York, Washington, and Pennsylvania.", context: "9/11 transformed foreign policy, security policy, and political rhetoric.", apRelevance: "One of the most tested turning points in Period 9." },
    { term: "Bush Doctrine", definition: "The post-9/11 principle that the United States could strike preemptively against perceived threats.", context: "The doctrine justified the move from Afghanistan to Iraq.", apRelevance: "Central to essays on unilateralism and preemption." },
    { term: "War on Terrorism", definition: "The open-ended U.S. campaign against terrorist groups and the states thought to support them.", context: "Bush treated it as a global struggle for freedom after September 11.", apRelevance: "A major Period 9 foreign-policy framework." },
    { term: "USA Patriot Act", definition: "A sweeping law expanding surveillance and law-enforcement powers after September 11.", context: "The act raised sharp questions about liberty and security.", apRelevance: "Key civil-liberties term for APUSH." },
    { term: "Guantanamo Bay", definition: "The U.S. detention facility in Cuba used to hold suspected terrorists outside the ordinary civilian court system.", context: "Guantanamo symbolized detention without usual constitutional protections.", apRelevance: "Useful for arguments about executive power and due process." },
    { term: "Preemptive War", definition: "War launched in anticipation of a future threat rather than in response to an actual attack.", context: "The Iraq invasion rested heavily on this logic.", apRelevance: "Important for understanding the Bush Doctrine." },
    { term: "Outsourcing", definition: "The transfer of jobs or production to other countries where labor costs are lower.", context: "Outsourcing intensified American anxieties about globalization.", apRelevance: "Useful in work and economy questions." },
    { term: "Desert Storm", definition: "The 1991 U.S.-led military campaign that expelled Iraqi forces from Kuwait.", context: "The Gulf War seemed to confirm the reach of post-Cold War American power.", apRelevance: "Important evidence for the early post-Cold War world." },
    { term: "Operation Iraqi Freedom", definition: "The 2003 U.S.-led invasion of Iraq.", context: "The invasion became the most controversial military action of the Bush presidency.", apRelevance: "Key for arguments about empire, preemption, and war powers." },
    { term: "Homeland Security", definition: "The enlarged domestic security apparatus created after September 11 to prevent future terrorist attacks.", context: "Homeland security normalized new surveillance and border practices.", apRelevance: "Shows how foreign-policy crises reshaped domestic life." }
  ],
  keyFigures: [
    { name: "George H. W. Bush", title: "President", bio: "Bush managed the transition from the Cold War to the Gulf War and presented the United States as leader of a new world order.", significance: "He personified the confident early post-Cold War moment.", perspective: "Internationalist conservative", imageId: null },
    { name: "Bill Clinton", title: "President", bio: "Clinton governed from the political center during prosperity but faced impeachment amid intense culture-war hostility.", significance: "He linked triangulation, prosperity, and partisan conflict.", perspective: "New Democrat centrist", imageId: null },
    { name: "George W. Bush", title: "President", bio: "Bush responded to September 11 with the War on Terror, the Bush Doctrine, and the Iraq invasion.", significance: "He defined the foreign-policy and civil-liberties controversies of the early twenty-first century.", perspective: "Post-9/11 executive nationalist", imageId: "chapter27-img-014" },
    { name: "Osama bin Laden", title: "Leader of Al Qaeda", bio: "Bin Laden organized attacks against the United States after building a militant network rooted in the Afghan anti-Soviet war.", significance: "He became the symbolic enemy of the War on Terror and a case study in policy blowback.", perspective: "Militant Islamist opponent of U.S. power", imageId: null },
    { name: "Dick Cheney", title: "Vice President", bio: "Cheney was one of the senior Bush administration officials most committed to removing Saddam Hussein and expanding executive power after 9/11.", significance: "He represents the hard-line side of the Bush national-security state.", perspective: "Neoconservative and executive-power advocate", imageId: null },
    { name: "Saddam Hussein", title: "President of Iraq", bio: "Hussein's invasion of Kuwait triggered the Gulf War, and his regime later became the target of the 2003 U.S. invasion.", significance: "He sat at the center of both the Gulf War and the Iraq War.", perspective: "Authoritarian Iraqi ruler", imageId: null }
  ],
  textStimuli: [
    { text: "“Freedom and fear are at war.”", caption: "George W. Bush, address to Congress, September 20, 2001" },
    { text: "The administration would recognize no middle ground in the new war on terrorism.", caption: "Textbook summary of the Bush Doctrine" },
    { text: "More than 30,000 protesters gathered in Seattle to challenge the WTO meeting.", caption: "Textbook discussion of the Seattle protests, 1999" },
    { text: "The election of 2000 revealed a nation divided by region, party, and confidence in institutions.", caption: "Textbook discussion of Bush v. Gore and the election of 2000" },
    { text: "Many observers feared that the United States was claiming the right to act as a world policeman.", caption: "Textbook discussion of post-9/11 unilateralism" },
    { text: "The Patriot Act conferred unprecedented powers on law-enforcement agencies charged with preventing domestic terrorism.", caption: "Textbook discussion of the domestic response to 9/11" }
  ],
  mcqFacts: [
    { apSkill: "Contextualization", apTheme: THEME.world, topicTag: "The Post-Cold War World", question: "The fall of the Berlin Wall and the collapse of the Soviet Union most directly encouraged many Americans to believe that", correct: "liberal democracy and market capitalism had won a decisive global victory", wrong: ["the United States should abandon overseas alliances and military commitments", "economic globalization would immediately end social inequality in the United States", "regional conflicts would disappear because ideological rivalry had ended"], explanation: "The end of Soviet power fostered a triumphalist belief that the American model had prevailed globally." },
    { apSkill: "Causation", apTheme: THEME.world, topicTag: "The Gulf War", question: "A major reason George H. W. Bush responded forcefully to Iraq's invasion of Kuwait was that", correct: "American leaders feared Iraq might threaten Saudi Arabia and Persian Gulf oil supplies", wrong: ["Congress had already declared war on Iraq before the invasion occurred", "the Soviet Union demanded direct American military occupation of Iraq", "the United States wanted to annex Kuwait as a formal territory"], explanation: "Oil, regional balance, and the defense of an international order after the Cold War all pushed the Bush administration toward intervention." },
    { apSkill: "Comparison", apTheme: THEME.work, topicTag: "Globalization", question: "Critics of globalization in the 1990s most often argued that free-trade policies", correct: "allowed corporations to move production abroad while weakening labor and environmental protections", wrong: ["made the United States too dependent on small family farms", "ended the influence of multinational corporations in the American economy", "required the federal government to nationalize major industries"], explanation: "Antiglobalization critics tied free trade to outsourcing, labor vulnerability, and weak environmental regulation." },
    { apSkill: "Argumentation", apTheme: THEME.culture, topicTag: "Culture Wars", question: "The term 'culture wars' most directly refers to political conflict over", correct: "morality, identity, family life, and the meaning of American values", wrong: ["the best strategy for rebuilding Western Europe after World War II", "whether the United States should adopt a socialist economic system", "the expansion of slavery into western territories"], explanation: "Late twentieth-century culture wars centered on social values and identity rather than nineteenth-century sectional issues or early Cold War reconstruction." },
    { apSkill: "Continuity and Change Over Time", apTheme: THEME.identity, topicTag: "Immigration", question: "Post-1965 immigration most directly changed the United States by", correct: "making newcomers from Latin America and Asia far more prominent than in earlier immigration waves", wrong: ["ending all political controversy over national identity", "restoring the national-origins quota system of the 1920s", "eliminating concerns about undocumented migration"], explanation: "The demographic shift created new debates over diversity, citizenship, and assimilation." },
    { apSkill: "Causation", apTheme: THEME.politics, topicTag: "Impeachment", question: "The impeachment of Bill Clinton best illustrates the extent to which the 1990s were marked by", correct: "intense partisan hostility even during economic prosperity", wrong: ["a national consensus against moral scrutiny of public officials", "the collapse of party competition after the Cold War", "a return to the political style of the New Deal coalition"], explanation: "Clinton's impeachment showed how culture-war politics and partisan antagonism persisted despite favorable economic conditions." },
    { apSkill: "Contextualization", apTheme: THEME.politics, topicTag: "Bush v. Gore", question: "The significance of Bush v. Gore in 2000 lay primarily in the fact that the case", correct: "demonstrated the Supreme Court's decisive role in settling a disputed presidential election", wrong: ["created the Electoral College for the first time", "abolished state authority over ballot procedures", "required all future elections to be decided by Congress"], explanation: "Bush v. Gore halted the Florida recount and effectively awarded the presidency to George W. Bush." },
    { apSkill: "Causation", apTheme: THEME.world, topicTag: "September 11", question: "The attacks of September 11, 2001, most directly led to", correct: "a dramatic expansion of American security policy at home and abroad", wrong: ["the immediate end of U.S. military involvement in the Middle East", "the repeal of federal surveillance powers", "a bipartisan agreement to reduce defense spending"], explanation: "9/11 transformed both foreign policy and domestic security policy." },
    { apSkill: "Argumentation", apTheme: THEME.world, topicTag: "Bush Doctrine", question: "The Bush Doctrine is best understood as a justification for", correct: "preemptive action against perceived threats before they directly attacked the United States", wrong: ["strict neutrality in conflicts outside the Western Hemisphere", "permanent disarmament and withdrawal from alliances", "reliance on the League of Nations to settle disputes"], explanation: "The doctrine defended preemptive war in the War on Terror." },
    { apSkill: "Comparison", apTheme: THEME.politics, topicTag: "Patriot Act", question: "Critics of the USA Patriot Act most directly compared it to earlier episodes in U.S. history when", correct: "wartime fears led the government to narrow civil liberties", wrong: ["Congress abolished the armed forces after a foreign-policy crisis", "states refused to cooperate with federal tax collection", "presidents permanently surrendered emergency powers to the courts"], explanation: "The Patriot Act revived the recurring conflict between security and liberty in wartime." },
    { apSkill: "Argumentation", apTheme: THEME.world, topicTag: "Iraq War", question: "A major criticism of the 2003 Iraq War was that it", correct: "extended the War on Terror into a preemptive conflict that many allies and critics considered unjustified", wrong: ["received stronger worldwide support than the Afghanistan war", "ended American involvement in Persian Gulf politics", "restored the post-1945 policy of isolationism"], explanation: "The Iraq invasion drew sharper criticism than the Afghanistan war because it seemed more unilateral and more speculative." },
    { apSkill: "Comparison", apTheme: THEME.world, topicTag: "Iraq and Vietnam", question: "Americans who described Iraq as 'another Vietnam' generally meant that the war", correct: "became a prolonged conflict fought in the language of freedom without a clear path to victory", wrong: ["was fought entirely through naval blockades rather than ground troops", "occurred before the spread of television journalism", "ended with immediate and undisputed public consensus"], explanation: "The analogy emphasized limits, occupation, and the gap between official claims and battlefield reality." },
    { apSkill: "Contextualization", apTheme: THEME.work, topicTag: "Seattle protests", question: "The Seattle protests of 1999 are best understood in the context of", correct: "a growing backlash against free-trade institutions and corporate globalization", wrong: ["the campaign to outlaw all labor unions in the United States", "the immediate response to the attacks of September 11", "the restoration of nineteenth-century mercantilist policy"], explanation: "Seattle became the emblematic protest against globalization's winners and losers." },
    { apSkill: "Causation", apTheme: THEME.identity, topicTag: "Mass incarceration", question: "The rapid growth of prisons in the late twentieth century most directly reflected", correct: "the rise of punitive crime politics and the unequal racial burden of incarceration", wrong: ["a dramatic decline in federal and state power over criminal justice", "the abolition of mandatory sentencing laws", "the end of political debate over race and punishment"], explanation: "The carceral state expanded through tough-on-crime policies with unequal racial consequences." },
    { apSkill: "Continuity and Change Over Time", apTheme: THEME.culture, topicTag: "AIDS and rights", question: "The AIDS crisis contributed to political change by", correct: "pushing gay activism and public-health demands into national politics", wrong: ["ending all conflicts over sexuality and family life", "convincing most conservatives to support same-sex marriage immediately", "making public protest less important than in earlier rights movements"], explanation: "AIDS intensified activism and broadened the continuing rights revolution." },
    { apSkill: "Argumentation", apTheme: THEME.work, topicTag: "Outsourcing", question: "Opponents of outsourcing in the 1990s and early 2000s most often argued that it", correct: "accelerated factory relocation and weakened the bargaining power of American workers", wrong: ["caused the federal government to ban all foreign investment", "immediately restored manufacturing employment in older industrial cities", "ended the use of technology in the workplace"], explanation: "Outsourcing was criticized as a driver of labor insecurity and deindustrialization." },
    { apSkill: "Comparison", apTheme: THEME.world, topicTag: "Post-Cold War power", question: "Compared with the Cold War era, the United States in the 1990s was more likely to", correct: "use power without a single rival superpower shaping every intervention", wrong: ["reject international coalitions under all circumstances", "abandon the use of freedom as a foreign-policy justification", "treat the Persian Gulf as strategically irrelevant"], explanation: "The United States entered a unipolar moment, but it still justified power in moral and strategic terms." },
    { apSkill: "Contextualization", apTheme: THEME.identity, topicTag: "Multiculturalism", question: "Supporters of multiculturalism most directly argued that", correct: "American public life should recognize the histories and perspectives of diverse groups", wrong: ["the United States should restore immigration restrictions from the 1920s", "regional identity mattered more than race, gender, or ethnicity", "group differences should be erased from schools and public culture"], explanation: "Multiculturalism emphasized recognition and representation rather than erasure." },
    { apSkill: "Causation", apTheme: THEME.politics, topicTag: "Homeland Security", question: "The expansion of homeland security after 2001 most directly resulted from", correct: "fear that another mass-casualty terrorist attack could occur without stronger surveillance and coordination", wrong: ["an economic plan to reduce the federal budget deficit", "pressure to dismantle federal intelligence agencies", "the success of antiglobalization protests in Seattle"], explanation: "The post-9/11 security state grew out of fear, vulnerability, and new intelligence priorities." },
    { apSkill: "Argumentation", apTheme: THEME.world, topicTag: "American empire", question: "Historians who describe the early twenty-first-century United States as an empire usually emphasize", correct: "its unmatched military reach, worldwide bases, and willingness to invade and occupy other countries", wrong: ["its formal annexation of all countries in the Middle East", "its rejection of free markets and global trade", "its abandonment of all claims to liberty and democracy"], explanation: "The empire argument rests on power projection, occupation, and strategic dominance rather than formal colonial annexation." }
  ],
  saq: [
    {
      prompt: "Answer parts A, B, and C about the post-Cold War world.",
      partA: "Describe ONE consequence of the end of the Cold War for U.S. foreign policy.",
      partB: "Explain ONE reason the Gulf War became the defining early post-Cold War military conflict.",
      partC: "Explain ONE way critics challenged the idea that the United States was simply bringing freedom to the world.",
      scoringGuidance: {
        partA: "Must identify unipolar power, interventionism, the Gulf War, or the disappearance of the Soviet rival.",
        partB: "Must connect Kuwait, Persian Gulf oil, coalition politics, or Iraqi aggression to the war.",
        partC: "Must discuss empire, oil, unilateralism, occupation, or limits of American power."
      },
      sampleAnswers: {
        partA: "One consequence of the Cold War's end was that the United States no longer had to frame every intervention around a direct Soviet threat and instead acted as the world's only superpower.",
        partB: "The Gulf War became the defining early post-Cold War conflict because Iraq's invasion of Kuwait threatened Persian Gulf oil supplies and gave Bush a chance to lead a broad international coalition.",
        partC: "Critics argued that the United States was acting like an empire because it maintained military bases around the world and used overwhelming force in regions such as the Persian Gulf."
      }
    },
    {
      prompt: "Answer parts A, B, and C about globalization.",
      partA: "Describe ONE feature of globalization in the 1990s.",
      partB: "Explain ONE reason some Americans protested the WTO meeting in Seattle.",
      partC: "Explain ONE effect of globalization on workers or communities in the United States.",
      scoringGuidance: {
        partA: "Must identify movement of goods, capital, information, outsourcing, or global production.",
        partB: "Must mention labor standards, environmental concerns, corporate power, or sovereignty.",
        partC: "Must connect globalization to deindustrialization, outsourcing, wage pressure, or regional inequality."
      },
      sampleAnswers: {
        partA: "One feature of globalization was the growing ability of corporations to move production across national borders in search of cheaper labor and lower regulation.",
        partB: "Many protesters in Seattle opposed the WTO because they believed it gave multinational corporations too much power over labor standards and environmental policy.",
        partC: "Globalization hurt many industrial communities because factories closed or moved abroad, which weakened unions and reduced stable manufacturing jobs."
      }
    },
    {
      prompt: "Answer parts A, B, and C about the culture wars.",
      partA: "Describe ONE way immigration changed the United States after 1965.",
      partB: "Explain ONE argument made by supporters of multiculturalism.",
      partC: "Explain ONE reason cultural conservatives opposed late-twentieth-century social changes.",
      scoringGuidance: {
        partA: "Must identify immigrants from Latin America and Asia or growing diversity.",
        partB: "Must discuss recognition, representation, education, or identity.",
        partC: "Must mention family values, religion, abortion, sexuality, or national identity."
      },
      sampleAnswers: {
        partA: "After 1965, immigrants from Latin America and Asia made the population far more visibly diverse than in earlier decades dominated by European immigration.",
        partB: "Supporters of multiculturalism argued that schools and public culture should include the histories of groups that had long been marginalized in national narratives.",
        partC: "Cultural conservatives opposed these changes because they believed traditional family roles and a common national culture were being weakened."
      }
    },
    {
      prompt: "Use the stimulus to answer parts A, B, and C about the election of 2000.",
      partA: "Describe ONE issue that made the 2000 election unusually contentious.",
      partB: "Explain ONE effect of Bush v. Gore on public confidence in politics.",
      partC: "Explain ONE broader trend in U.S. politics that the election reflected.",
      scoringGuidance: {
        partA: "Must identify Florida ballots, recounts, the Electoral College, or partisan conflict.",
        partB: "Must connect to distrust, polarization, or questions about institutional legitimacy.",
        partC: "Must connect to red-blue geography, partisan hostility, or culture wars."
      },
      sampleAnswers: {
        partA: "The election became contentious because the result depended on disputed Florida ballots and a recount that neither party trusted.",
        partB: "Bush v. Gore reduced public confidence because the Supreme Court's intervention made many Americans believe politics was being settled by judges instead of voters.",
        partC: "The election reflected a broader trend toward sharper partisan polarization and regional division in national politics."
      }
    },
    {
      prompt: "Use the stimulus to answer parts A, B, and C about September 11.",
      partA: "Describe ONE immediate consequence of the attacks of September 11.",
      partB: "Explain ONE reason the Bush administration focused on Al Qaeda and Afghanistan first.",
      partC: "Explain ONE way 9/11 changed domestic political life in the United States.",
      scoringGuidance: {
        partA: "Must mention patriotism, security expansion, war, or public fear.",
        partB: "Must connect Al Qaeda, the Taliban, or the location of bin Laden's network to Afghanistan.",
        partC: "Must discuss surveillance, the Patriot Act, airport security, or suspicion of Muslim Americans."
      },
      sampleAnswers: {
        partA: "One immediate consequence of September 11 was a dramatic surge of patriotism and support for a stronger national-security response.",
        partB: "The administration focused first on Afghanistan because Al Qaeda operated there under Taliban protection and the attacks were traced to that network.",
        partC: "The attacks changed domestic life by making expanded surveillance and airport security seem normal to many Americans."
      }
    },
    {
      prompt: "Use the stimulus to answer parts A, B, and C about the War on Terror.",
      partA: "Describe ONE feature of the Bush Doctrine.",
      partB: "Explain ONE difference between the Afghanistan War and the Iraq War in the eyes of many observers.",
      partC: "Explain ONE criticism of the Iraq invasion.",
      scoringGuidance: {
        partA: "Must mention preemption, no middle ground, or broad executive action against threats.",
        partB: "Must contrast international support, immediate causes, or perceived legitimacy.",
        partC: "Must mention oil, weak evidence about WMD, unilateralism, occupation, or insurgency."
      },
      sampleAnswers: {
        partA: "One feature of the Bush Doctrine was the claim that the United States could strike perceived threats before they attacked directly.",
        partB: "Many observers saw Afghanistan as a direct response to 9/11, while they regarded Iraq as a more controversial and less clearly justified preemptive war.",
        partC: "A major criticism of Iraq was that the administration exaggerated the threat of weapons of mass destruction to justify invasion."
      }
    },
    {
      prompt: "Answer parts A, B, and C about the Patriot Act and civil liberties.",
      partA: "Describe ONE power expanded by the USA Patriot Act.",
      partB: "Explain ONE argument made by supporters of the act.",
      partC: "Explain ONE concern raised by critics of the act.",
      scoringGuidance: {
        partA: "Must mention surveillance, intelligence sharing, searches, or detention authority.",
        partB: "Must connect to preventing another attack or dealing with unconventional threats.",
        partC: "Must mention privacy, due process, speech, or indefinite detention."
      },
      sampleAnswers: {
        partA: "The Patriot Act expanded the government's ability to conduct surveillance and share intelligence across agencies.",
        partB: "Supporters argued that broader powers were necessary because terrorist networks were hard to detect before they attacked.",
        partC: "Critics warned that the act endangered civil liberties by weakening privacy protections and due-process safeguards."
      }
    },
    {
      prompt: "Answer parts A, B, and C about mass incarceration.",
      partA: "Describe ONE development that contributed to mass incarceration.",
      partB: "Explain ONE way incarceration affected racial inequality.",
      partC: "Explain ONE connection between mass incarceration and culture-war politics.",
      scoringGuidance: {
        partA: "Must mention tough-on-crime laws, punitive sentencing, or the war on drugs.",
        partB: "Must connect incarceration to the burden on African Americans or Latinos.",
        partC: "Must connect crime politics to order, fear, race, or moral rhetoric."
      },
      sampleAnswers: {
        partA: "One development that contributed to mass incarceration was the expansion of punitive sentencing and tough-on-crime policies.",
        partB: "Incarceration worsened racial inequality because African Americans and Latinos were imprisoned at disproportionately high rates.",
        partC: "Mass incarceration became part of culture-war politics because politicians used crime and disorder to argue for harsher punishment and stronger social control."
      }
    },
    {
      prompt: "Answer parts A, B, and C about Clinton and partisanship.",
      partA: "Describe ONE reason conservatives strongly disliked Bill Clinton.",
      partB: "Explain ONE way Clinton governed from the center.",
      partC: "Explain ONE reason prosperity did not reduce partisanship in the 1990s.",
      scoringGuidance: {
        partA: "Must mention symbolism of the 1960s, moral criticism, feminism, or culture wars.",
        partB: "Must cite welfare reform, balanced budgets, triangulation, or centrist positioning.",
        partC: "Must connect to moral politics, media scrutiny, or ideological polarization."
      },
      sampleAnswers: {
        partA: "Many conservatives disliked Clinton because they saw him as symbolizing the antiwar, feminist, and morally permissive culture they associated with the 1960s.",
        partB: "Clinton governed from the center by embracing budget discipline and positioning himself between liberal Democrats and conservative Republicans.",
        partC: "Prosperity did not reduce partisanship because moral conflict and culture-war identity were just as important as economic satisfaction."
      }
    },
    {
      prompt: "Answer parts A, B, and C about anti-American backlash.",
      partA: "Describe ONE reason some foreign observers grew suspicious of U.S. power after 2001.",
      partB: "Explain ONE way the Iraq War encouraged charges of empire.",
      partC: "Explain ONE reason the United States still retained enormous influence despite criticism.",
      scoringGuidance: {
        partA: "Must mention unilateralism, preemption, bases, or world-policing fears.",
        partB: "Must mention occupation, oil, regime change, or military power.",
        partC: "Must mention unmatched military, economic, or cultural power."
      },
      sampleAnswers: {
        partA: "Foreign observers grew suspicious because the Bush administration seemed willing to act without much restraint from allies or international institutions.",
        partB: "The Iraq War encouraged charges of empire because the United States invaded, occupied Iraq, and appeared to be using overwhelming power to reorder another country.",
        partC: "The United States still retained enormous influence because it remained unmatched in military reach, economic resources, and cultural visibility."
      }
    }
  ],
  leq: [
    {
      id: "chapter27-leq-001",
      chapterId: "chapter27",
      prompt: "Evaluate the extent to which the end of the Cold War transformed the United States' role in the world from 1989 to 2004.",
      recommendedArgument: "Continuity and Change Over Time",
      thesisExamples: [
        "The end of the Cold War transformed the United States from a superpower focused on containing communism into a unipolar state that intervened in Panama, the Persian Gulf, Afghanistan, and Iraq, but it did not end the older American habit of justifying global power in the name of freedom.",
        "Although the disappearance of the Soviet Union changed the scale of American freedom to act abroad, post-Cold War intervention still showed continuity with earlier eras in its reliance on military force, strategic resources, and moral rhetoric."
      ],
      outlineScaffold: {
        contextualization: "Explain late Cold War détente's collapse, Reagan-era military strength, and the disintegration of Soviet authority in Eastern Europe.",
        bodyParagraph1: { claim: "The post-Cold War world encouraged unprecedented American confidence.", evidence: ["fall of the Berlin Wall", "Panama intervention", "Gulf War"], analysis: "A unipolar moment let U.S. leaders act without a rival superpower framing every decision." },
        bodyParagraph2: { claim: "The meaning of intervention changed after September 11.", evidence: ["9/11", "Bush Doctrine", "Afghanistan", "Iraq"], analysis: "The War on Terror broadened the scope of intervention beyond classic state-to-state rivalry." },
        bodyParagraph3: { claim: "Important continuities remained.", evidence: ["freedom rhetoric", "Persian Gulf oil", "alliances and bases"], analysis: "American power still mixed strategic interests with moral language, much as it had in earlier periods." },
        complexity: "Show both change and continuity by arguing that U.S. power became less constrained but not less interventionist or less ideological."
      },
      scoringRubric: {
        thesis: "1 point - Make a defensible claim about transformation and continuity.",
        contextualization: "1 point - Situate the essay in late Cold War change.",
        evidence: "2 points - Use specific events from both the early 1990s and the post-9/11 era.",
        analysis: "2 points - Explain both the changes and the survivals in U.S. global behavior.",
        complexity: "1 point - Weigh the imperial critique against claims of liberal leadership."
      }
    },
    {
      id: "chapter27-leq-002",
      chapterId: "chapter27",
      prompt: "Evaluate the extent to which domestic politics in the United States became more polarized from 1989 to 2004.",
      recommendedArgument: "Causation",
      thesisExamples: [
        "Domestic politics became far more polarized from 1989 to 2004 because immigration, multiculturalism, crime, sexuality, and religion reshaped political identity, while scandals such as impeachment and Bush v. Gore weakened trust in neutral institutions.",
        "Polarization grew not simply because parties disagreed on policy, but because the culture wars and the contested election of 2000 turned political conflict into a struggle over morality, legitimacy, and the meaning of America itself."
      ],
      outlineScaffold: {
        contextualization: "Discuss the conservative turn of the 1970s and 1980s, the rights revolutions, and Reagan-era realignment.",
        bodyParagraph1: { claim: "Demographic and cultural change intensified conflict.", evidence: ["post-1965 immigration", "multiculturalism", "family values"], analysis: "Culture-war issues moved identity questions to the center of politics." },
        bodyParagraph2: { claim: "Institutional conflict made polarization feel constitutional as well as cultural.", evidence: ["Clinton impeachment", "Bush v. Gore"], analysis: "Political opponents increasingly treated each other as illegitimate rather than simply mistaken." },
        bodyParagraph3: { claim: "Security politics after 9/11 changed but did not erase division.", evidence: ["Patriot Act", "Iraq War protests", "civil-liberties debate"], analysis: "National crisis briefly unified Americans but quickly generated new forms of disagreement." },
        complexity: "Explain that polarization deepened even during prosperity and patriotic mobilization, not only during recession or defeat."
      },
      scoringRubric: {
        thesis: "1 point - Make a defensible claim about growing polarization.",
        contextualization: "1 point - Establish the late Cold War political background.",
        evidence: "2 points - Use specific examples from culture wars, impeachment, and post-9/11 politics.",
        analysis: "2 points - Explain how and why political conflict changed in nature and intensity.",
        complexity: "1 point - Show how prosperity or patriotic unity coexisted with deepening division."
      }
    }
  ],
  dbq: [
    {
      id: "chapter27-dbq-001",
      chapterId: "chapter27",
      prompt: "Evaluate the extent to which the United States' response to September 11, 2001, represented a departure from earlier American ideas about freedom and security.",
      documents: [
        {
          docNumber: 1,
          docType: "text",
          title: "Bush Address to Congress",
          source: "George W. Bush, September 20, 2001",
          imageId: null,
          excerpt: "Bush told Congress that freedom and fear were at war and argued that the nation faced a global enemy with no middle ground between support and opposition. He used language of universal liberty to justify a long war against terrorism.",
          happ: {
            historicalSituation: "The speech came nine days after the attacks of September 11.",
            audience: "Congress, the American public, and foreign governments deciding whether to support the United States.",
            purpose: "To mobilize patriotic support and define the crisis in moral terms.",
            pointOfView: "Bush spoke as a wartime president determined to enlarge executive authority and public unity."
          }
        },
        {
          docNumber: 2,
          docType: "image",
          title: "World Trade Center burning",
          source: "News photograph, September 11, 2001",
          imageId: "chapter27-img-011",
          excerpt: "The photograph shows the World Trade Center towers engulfed in smoke after hijacked planes struck them. The visual drama of the attack made vulnerability and emergency impossible to ignore.",
          happ: {
            historicalSituation: "The image records the attacks that triggered the War on Terror.",
            audience: "Mass American and global news audiences.",
            purpose: "To document the scale of the destruction.",
            pointOfView: "The photograph presents the event from the standpoint of civilian shock and catastrophe."
          }
        },
        {
          docNumber: 3,
          docType: "text",
          title: "Patriot Act summary",
          source: "Textbook discussion of the USA Patriot Act, 2001",
          imageId: null,
          excerpt: "Congress quickly passed a mammoth bill granting unprecedented powers to law-enforcement agencies. Few legislators had read the entire measure before voting, but the atmosphere of fear made opposition difficult.",
          happ: {
            historicalSituation: "Lawmakers acted in the immediate aftermath of September 11.",
            audience: "Students evaluating the security-liberty debate.",
            purpose: "To explain how rapidly the legal basis of the security state expanded.",
            pointOfView: "The textbook frames the act as both politically understandable and constitutionally consequential."
          }
        },
        {
          docNumber: 4,
          docType: "image",
          title: "Guantanamo detention regime",
          source: "Photograph from Guantanamo Bay, early 2000s",
          imageId: "chapter27-img-012",
          excerpt: "The image points to the offshore detention regime used to hold terrorism suspects outside the ordinary civilian court system. It evokes the exceptional legal status the administration sought to create.",
          happ: {
            historicalSituation: "The administration created Guantanamo as part of the War on Terror.",
            audience: "Americans and foreign observers debating detention, law, and human rights.",
            purpose: "To record the physical world of wartime detention.",
            pointOfView: "The image emphasizes how the War on Terror created new institutions outside ordinary constitutional routines."
          }
        },
        {
          docNumber: 5,
          docType: "image",
          title: "Abuse imagery and torture debate",
          source: "Political image recalling prisoner abuse, early 2000s",
          imageId: "chapter27-img-013",
          excerpt: "The image evokes the prisoner-abuse scandals that damaged American moral standing. It turns a military practice into a public debate about liberty, law, and human rights.",
          happ: {
            historicalSituation: "Reports of prisoner abuse circulated during the Iraq occupation and the wider War on Terror.",
            audience: "Domestic critics and an international public skeptical of American claims to defend freedom.",
            purpose: "To condemn or expose abuse.",
            pointOfView: "The image assumes that abuse undermined the legitimacy of U.S. policy."
          }
        },
        {
          docNumber: 6,
          docType: "text",
          title: "Civil-liberties critique",
          source: "Textbook discussion of tribunals and detention, early 2000s",
          imageId: null,
          excerpt: "The administration claimed that noncitizens could be tried in secret military tribunals and that even citizens might be held as enemy combatants without ordinary protections. Critics argued that wartime fear was hollowing out constitutional guarantees.",
          happ: {
            historicalSituation: "The War on Terror widened executive claims over detention and trial.",
            audience: "Readers asked to evaluate whether the new security state fit American constitutional traditions.",
            purpose: "To highlight the civil-liberties implications of post-9/11 policy.",
            pointOfView: "The framing is cautious toward broad executive power and attentive to constitutional continuity."
          }
        }
      ],
      thesisExample: "The response to September 11 partly departed from earlier ideas about freedom and security because it normalized preemptive war, indefinite detention, and sweeping surveillance, yet it also followed an older American pattern of using freedom rhetoric to justify wartime expansions of state power.",
      outlineScaffold: {
        contextualization: "Explain Cold War anticommunism, Vietnam-era distrust, and earlier wartime limits on civil liberties.",
        bodyParagraph1: { claim: "The response looked continuous in its moral language.", documentsUsed: [1, 2], outsideEvidence: "Compare Bush's freedom rhetoric to Truman or Reagan.", happ: "Bush's audience and purpose help explain why he framed the crisis as a universal war for liberty." },
        bodyParagraph2: { claim: "The security state expanded in striking ways.", documentsUsed: [3, 4, 6], outsideEvidence: "Patriot Act surveillance and Guantanamo detention", happ: "The historical situation around 9/11 made it politically easier to accept extraordinary measures." },
        bodyParagraph3: { claim: "Abuse and detention exposed the contradiction within the new freedom language.", documentsUsed: [5, 6], outsideEvidence: "Abu Ghraib and military tribunals", happ: "The point of view behind abuse criticism highlights how legitimacy became a global issue." },
        complexity: "Argue that 9/11 was both a sharp turning point and a repetition of a recurrent American wartime pattern."
      }
    }
  ],
  timeline: [
    { year: 1989, title: "Panama Intervention", summary: "George H. W. Bush sent troops to Panama to remove Manuel Noriega. The operation showed that American interventionism survived the Cold War's end.", fullDescription: "At the end of 1989, Bush ordered U.S. troops into Panama to overthrow Manuel Noriega, a former ally involved in drug trafficking. The intervention resembled earlier twentieth-century actions in the Western Hemisphere more than a new era of restraint. The United States installed a new government and flew Noriega to Florida for trial. The operation demonstrated both the reach of American power and the continuity of hemispheric intervention. It also suggested that the disappearance of the Soviet threat would not automatically reduce the use of force abroad. For APUSH, it marks the opening foreign-policy move of the post-Cold War era.", categories: ["Military", "Diplomatic"], apThemes: [THEME.world, THEME.politics], keyFigures: ["George H. W. Bush", "Manuel Noriega"], causes: ["Bush's desire to remove a compromised former ally", "American concerns about drugs and regional control"], effects: ["A new Panamanian government", "Evidence of continued interventionism"], significance: "Medium", apPriority: true, essayRelevance: "Useful for continuity in intervention after the Cold War.", commonMisconception: "The end of the Cold War did not mean the end of American military intervention." },
    { year: 1989, title: "Tiananmen Square Protests", summary: "Chinese protesters demanding political reform occupied Tiananmen Square. The crackdown complicated American assumptions that economic change would automatically bring democracy.", fullDescription: "In 1989, Chinese students and workers filled Tiananmen Square with demands for political reform. Their democracy statue and the scale of the demonstrations attracted enormous international attention. The Chinese government's violent crackdown shocked observers around the world. For Americans, the event occurred during a moment of broader Cold War collapse and democratic optimism. It reminded policymakers that the spread of markets and global contact would not necessarily produce liberal democracy. The episode also helped shape the moral language of post-Cold War triumphalism.", categories: ["Political", "Diplomatic"], apThemes: [THEME.world, THEME.politics], keyFigures: [], causes: ["Demands for political reform", "Global democratic ferment"], effects: ["Violent repression", "Complications for democratic triumphalism"], significance: "Medium", apPriority: true, essayRelevance: "Useful context for post-Cold War claims about freedom.", commonMisconception: "The end of the Cold War did not create immediate democratic victory everywhere.", imageId: "chapter27-img-001" },
    { year: 1989, title: "Fall of the Berlin Wall", summary: "The Berlin Wall fell as communist governments in Eastern Europe unraveled. The event symbolized the apparent triumph of liberal democracy over Soviet-style rule.", fullDescription: "The fall of the Berlin Wall in 1989 became the most iconic symbol of the collapse of Soviet authority in Eastern Europe. Crowds climbed the wall and celebrated the weakening of the old communist order. American observers treated the scene as confirmation that their system had prevailed in the ideological conflict of the twentieth century. The event accelerated the unmaking of the Eastern bloc. It also encouraged a belief that history now favored capitalism, democracy, and American-style freedom. That confidence shaped foreign-policy thinking throughout the 1990s.", categories: ["Political", "Diplomatic"], apThemes: [THEME.world, THEME.identity], keyFigures: [], causes: ["Collapse of communist authority", "Popular protest in Eastern Europe"], effects: ["Triumphal American rhetoric", "Unipolar confidence"], significance: "High", apPriority: true, essayRelevance: "Strong evidence for the beginning of the post-Cold War order.", commonMisconception: "The wall's fall symbolized collapse but did not create instant global stability.", imageId: "chapter27-img-002" },
    { year: 1990, title: "Iraq Invades Kuwait", summary: "Iraq invaded Kuwait in 1990 and triggered the first major post-Cold War military crisis. The invasion forced American leaders to define what the new world order would mean.", fullDescription: "When Iraqi forces invaded and annexed Kuwait in 1990, the Bush administration feared that Saddam Hussein might next threaten Saudi Arabia. Oil supplies and regional military balance immediately became central concerns. Bush moved troops into the Persian Gulf and built a multinational coalition. The crisis tested whether the United States would use its unmatched power to enforce international order after the Cold War. It also made the Persian Gulf a focal point of long-term American military presence. The invasion set up Operation Desert Storm in early 1991.", categories: ["Diplomatic", "Military"], apThemes: [THEME.world, THEME.geography], keyFigures: ["George H. W. Bush", "Saddam Hussein"], causes: ["Iraqi aggression", "Regional struggle over Persian Gulf power"], effects: ["Coalition war preparations", "Long-term U.S. Gulf commitment"], significance: "High", apPriority: true, essayRelevance: "Anchors the Gulf War and post-Cold War intervention.", commonMisconception: "The crisis was about both international order and strategic oil interests.", imageId: "chapter27-img-003" },
    { year: 1991, title: "Operation Desert Storm", summary: "The United States led a coalition that expelled Iraqi forces from Kuwait in 1991. The quick military victory appeared to confirm American power in the unipolar era.", fullDescription: "In February 1991, Operation Desert Storm drove Iraqi forces from Kuwait. The campaign used overwhelming air and ground power and appeared, at first, to validate the effectiveness of post-Vietnam military reform. Bush did not remove Saddam Hussein from power, however, and the United Nations imposed sanctions instead. Tens of thousands of Iraqis and 184 Americans died. The war left behind a durable American military presence in Saudi Arabia and the Persian Gulf. It also established a precedent for post-Cold War intervention under the language of international law and freedom.", categories: ["Military", "Diplomatic"], apThemes: [THEME.world, THEME.politics], keyFigures: ["George H. W. Bush"], causes: ["Iraq's invasion of Kuwait", "Coalition defense of Gulf order"], effects: ["Iraqi expulsion from Kuwait", "Persistent U.S. military presence in the Gulf"], significance: "High", apPriority: true, essayRelevance: "Useful for evaluating post-Cold War intervention.", commonMisconception: "The Gulf War did not remove Saddam Hussein or end U.S. involvement in Iraq.", imageId: "chapter27-img-003" },
    { year: 1991, title: "Soviet Union Dissolves", summary: "The Soviet Union dissolved in 1991 and ended the Cold War. The United States emerged as the world's only superpower.", fullDescription: "By late 1991 the Soviet Union had collapsed, ending the bipolar structure that had dominated global politics since World War II. American elites across the political spectrum treated this as confirmation of the superiority of liberal capitalism. The disappearance of a rival superpower encouraged a sense of strategic freedom and confidence. Yet it also raised new questions about how U.S. power would be used without the organizing logic of containment. In APUSH, the Soviet collapse supplies the crucial context for every major foreign-policy issue in the rest of Period 9. It marks both triumph and the beginning of new uncertainty.", categories: ["Political", "Diplomatic"], apThemes: [THEME.world], keyFigures: [], causes: ["Internal Soviet weakness", "Eastern European collapse"], effects: ["U.S. unipolar moment", "New debates over intervention"], significance: "High", apPriority: true, essayRelevance: "Essential context for all post-Cold War developments.", commonMisconception: "The Soviet collapse did not eliminate global conflict; it changed its form." },
    { year: 1993, title: "NAFTA Takes Effect", summary: "NAFTA deepened continental economic integration among the United States, Mexico, and Canada. It also intensified domestic arguments about globalization and labor.", fullDescription: "NAFTA took effect in 1994 after fierce political debate. Supporters argued it would increase trade and economic efficiency, while critics warned it would accelerate outsourcing and weaken labor. The agreement made North America a more integrated economic space. It also changed how Americans linked trade to immigration and border politics. For APUSH, NAFTA is a core piece of evidence for globalization's winners and losers. Its politics continued to reverberate into the twenty-first century.", categories: ["Economic", "Political"], apThemes: [THEME.work, THEME.world], keyFigures: ["Bill Clinton"], causes: ["Free-trade consensus", "Pressure for regional economic integration"], effects: ["Cross-border production expanded", "Backlash against globalization intensified"], significance: "Medium", apPriority: true, essayRelevance: "Strong evidence for debates over globalization.", commonMisconception: "NAFTA intensified, rather than ended, arguments about national sovereignty and work." },
    { year: 1995, title: "Oklahoma City Bombing", summary: "The Oklahoma City bombing revealed the deadly potential of domestic antigovernment extremism. The attack complicated later assumptions that terrorism only came from abroad.", fullDescription: "In 1995, antigovernment extremists Timothy McVeigh and Terry Nichols bombed the Alfred P. Murrah Federal Building in Oklahoma City. The blast killed 168 people and shocked the nation. It drew attention to militia movements and radical suspicion of federal power. The bombing occurred before September 11, showing that domestic political violence already posed serious danger. It also became part of the broader culture-war landscape of the 1990s. For APUSH, it demonstrates how internal and external security fears overlapped.", categories: ["Political", "Social"], apThemes: [THEME.politics, THEME.identity], keyFigures: ["Timothy McVeigh"], causes: ["Antigovernment extremism", "Militia politics"], effects: ["Heightened security concerns", "Attention to domestic terror"], significance: "Medium", apPriority: true, essayRelevance: "Useful for complexity in discussions of terrorism.", commonMisconception: "Pre-9/11 security threats were not solely foreign." },
    { year: 1999, title: "Seattle WTO Protests", summary: "Mass protests disrupted the 1999 WTO meeting in Seattle. The demonstrations made globalization's critics newly visible.", fullDescription: "In December 1999, protesters from labor unions, environmental groups, and activist networks converged on Seattle during a WTO meeting. Their demonstrations highlighted sweatshops, ecological damage, and the democratic power of multinational corporations. Seattle became shorthand for the broad coalition against corporate-led globalization. The protests showed that the 1990s boom did not produce universal faith in free trade. They also revealed a new style of movement politics shaped by media spectacle and transnational concerns. For APUSH, Seattle anchors the backlash to neoliberal globalization.", categories: ["Economic", "Social"], apThemes: [THEME.work, THEME.world, THEME.culture], keyFigures: [], causes: ["WTO expansion", "Outsourcing and environmental fears"], effects: ["Globalization critics gained visibility", "Trade politics became more contested"], significance: "High", apPriority: true, essayRelevance: "A strong example of backlash against corporate globalization.", commonMisconception: "The antiglobalization movement did not reject all international exchange; it targeted the terms on which it occurred.", imageId: "chapter27-img-012" },
    { year: 1998, title: "Clinton Impeached", summary: "The House impeached Bill Clinton in 1998 after the Lewinsky scandal. The case exposed the intensity of late-twentieth-century partisan conflict.", fullDescription: "The Lewinsky scandal shifted Kenneth Starr's investigation toward whether Clinton had lied under oath. The House of Representatives impeached the president, but the Senate acquitted him. Clinton remained in office and retained substantial public support. The scandal nevertheless consumed national politics and turned questions of private morality into weapons of partisan warfare. It also helped define the 1990s as an era when prosperity did not reduce political bitterness. For APUSH, impeachment is a key indicator of deepening polarization.", categories: ["Political"], apThemes: [THEME.politics, THEME.culture], keyFigures: ["Bill Clinton"], causes: ["Lewinsky scandal", "Partisan hostility"], effects: ["Senate acquittal", "Trust in institutions strained"], significance: "High", apPriority: true, essayRelevance: "Important evidence for culture-war polarization.", commonMisconception: "Clinton was impeached but not removed from office." },
    { year: 2000, title: "Bush v. Gore", summary: "The Supreme Court halted the Florida recount in the 2000 presidential election. The ruling effectively awarded the presidency to George W. Bush.", fullDescription: "The election of 2000 turned on disputed ballots in Florida. As recounts and legal challenges multiplied, the Supreme Court intervened in Bush v. Gore and halted further recounting. The decision secured Bush's Electoral College victory despite the contested vote count. Many Americans saw the ruling as a sign that institutional legitimacy itself had become partisan terrain. The election map also showed a stark red-blue divide. For APUSH, this event anchors discussions of judicial power and political polarization.", categories: ["Political"], apThemes: [THEME.politics], keyFigures: ["George W. Bush", "Al Gore"], causes: ["Razor-thin election result", "Florida ballot dispute"], effects: ["Bush presidency began", "Institutional distrust deepened"], significance: "High", apPriority: true, essayRelevance: "Excellent evidence for polarized politics at the turn of the century.", commonMisconception: "The case did not create polarization but intensified existing distrust.", imageId: "chapter27-img-009" },
    { year: 2001, title: "September 11 Attacks", summary: "Al Qaeda terrorists attacked New York and Washington on September 11, 2001. The event transformed foreign policy, domestic security, and political rhetoric.", fullDescription: "On September 11, hijackers seized four passenger jets and crashed them into the World Trade Center, the Pentagon, and a field in Pennsylvania after passengers resisted. The attacks killed thousands and became one of the most traumatic events in American history. The Bush administration quickly blamed Al Qaeda and Osama bin Laden. Patriotism surged, but so did fear and acceptance of a strengthened security state. The attacks reoriented U.S. policy toward terrorism as the central global threat. In APUSH, 9/11 is the crucial turning point of early twenty-first-century America.", categories: ["Military", "Political"], apThemes: [THEME.world, THEME.politics], keyFigures: ["George W. Bush", "Osama bin Laden"], causes: ["Al Qaeda's anti-American militancy", "Earlier Middle East and Afghan entanglements"], effects: ["Afghanistan War", "Patriot Act", "War on Terror"], significance: "High", apPriority: true, essayRelevance: "Essential anchor event for Period 9 essays.", commonMisconception: "The attacks were both a rupture and a consequence of earlier U.S. global involvement.", imageId: "chapter27-img-011" },
    { year: 2001, title: "USA Patriot Act", summary: "Congress passed the Patriot Act in the aftermath of September 11. The law greatly expanded surveillance and law-enforcement power.", fullDescription: "In late 2001, Congress rapidly enacted the USA Patriot Act. The law broadened surveillance authority, intelligence sharing, and investigative powers in the name of fighting terrorism. Few members read the entire bill before voting, reflecting the urgency and fear of the moment. Supporters argued that new threats required new tools. Critics countered that the act endangered privacy and due process. The law became a defining example of the security-liberty tradeoff after 9/11.", categories: ["Political"], apThemes: [THEME.politics], keyFigures: ["George W. Bush"], causes: ["September 11 attacks", "Fear of future terrorism"], effects: ["Surveillance expanded", "Civil-liberties criticism intensified"], significance: "High", apPriority: true, essayRelevance: "Core evidence for domestic effects of 9/11.", commonMisconception: "The Patriot Act was not just about foreign battlefields; it transformed domestic governance." },
    { year: 2001, title: "War in Afghanistan Begins", summary: "The United States invaded Afghanistan in 2001 to destroy Al Qaeda and remove the Taliban. The war initially drew broad international support.", fullDescription: "After September 11, the United States targeted the Taliban regime that sheltered Al Qaeda in Afghanistan. American forces, working with local allies, toppled the Taliban quickly. The invasion enjoyed far more international legitimacy than the later Iraq War. Yet the conflict soon became prolonged and difficult. Afghanistan showed that even apparently justified military action in the War on Terror could become open-ended. The war marked the first major military campaign of the new era.", categories: ["Military", "Diplomatic"], apThemes: [THEME.world], keyFigures: ["George W. Bush", "Osama bin Laden"], causes: ["September 11 attacks", "Taliban sheltering Al Qaeda"], effects: ["Taliban ousted", "Long war began"], significance: "High", apPriority: true, essayRelevance: "Important comparison point with Iraq.", commonMisconception: "Afghanistan initially received wider support than Iraq because it was seen as directly tied to 9/11." },
    { year: 2003, title: "Iraq War Begins", summary: "The United States invaded Iraq in 2003. The war quickly became the most divisive and consequential military action of the Bush presidency.", fullDescription: "Bush administration officials claimed that Saddam Hussein possessed weapons of mass destruction and posed an intolerable threat. The United States invaded Iraq in 2003 with less international support than it had enjoyed in Afghanistan or the Gulf War. Baghdad fell quickly, but the occupation gave way to insurgency, sectarian conflict, and prolonged instability. The war fueled arguments that the United States was acting as an empire or repeating Vietnam. It also intensified criticism of preemptive war. In APUSH, Iraq is indispensable for analyzing the Bush Doctrine and the limits of American power.", categories: ["Military", "Diplomatic"], apThemes: [THEME.world, THEME.politics], keyFigures: ["George W. Bush", "Saddam Hussein", "Dick Cheney"], causes: ["Bush Doctrine", "Claims about weapons of mass destruction"], effects: ["Occupation and insurgency", "Antiwar protest grew"], significance: "High", apPriority: true, essayRelevance: "A centerpiece of essays on empire and the War on Terror.", commonMisconception: "The rapid fall of Baghdad did not mean the war was finished.", imageId: "chapter27-img-014" },
    { year: 2004, title: "Abu Ghraib Scandal", summary: "Abuse at Abu Ghraib prison became public in 2004. The scandal undermined America's moral claims in the War on Terror.", fullDescription: "Images and reports from Abu Ghraib prison in Iraq revealed the humiliation and abuse of prisoners by American personnel. The scandal quickly spread around the world. It damaged U.S. credibility precisely because the Bush administration had framed the war as a defense of freedom and human dignity. Critics argued that torture and abuse exposed the contradictions of the security state. Abu Ghraib therefore became both an international and a domestic political crisis. For APUSH, it is a crucial complexity point about wartime power and liberty.", categories: ["Military", "Political"], apThemes: [THEME.world, THEME.politics], keyFigures: [], causes: ["Occupation pressures", "Expanded detention and interrogation practices"], effects: ["Global criticism of the United States", "Civil-liberties and human-rights concerns deepened"], significance: "High", apPriority: true, essayRelevance: "Excellent evidence for the contradiction between freedom rhetoric and wartime practice.", commonMisconception: "Abu Ghraib mattered not only because of abuse itself but because it damaged America's international legitimacy.", imageId: "chapter27-img-013" },
    { year: 2004, title: "Bush Reelected", summary: "George W. Bush won reelection in 2004. The result showed that post-9/11 politics and culture-war divisions continued to structure national elections.", fullDescription: "Despite the Iraq War and growing criticism of his administration, Bush defeated John Kerry in 2004. The election revealed remarkable red-blue stability and intense partisan mobilization on both sides. Bush's supporters remained energized by national-security concerns and moral politics. The victory suggested that the polarization of the 1990s had not ended with 9/11. It also set the stage for the more troubled second term that would lead into Chapter 28. For APUSH, the election demonstrates how war, culture, and partisanship intertwined.", categories: ["Political"], apThemes: [THEME.politics, THEME.culture], keyFigures: ["George W. Bush", "John Kerry"], causes: ["Post-9/11 politics", "Persistent culture-war and partisan alignments"], effects: ["Bush second term", "Polarization persisted"], significance: "Medium", apPriority: true, essayRelevance: "Useful transition to the crises of Chapter 28.", commonMisconception: "The 2004 election did not resolve the divisions of the early twenty-first century." }
  ],
  conceptCards: [
    { type: "Concept", front: "Unipolar moment", back: "The period after the Soviet collapse when the United States faced no rival superpower and seemed able to shape world affairs on its own terms.", hint: "No Soviet counterweight.", difficulty: "Medium" },
    { type: "Cause-Effect", front: "9/11 -> War on Terror", back: "The September 11 attacks produced the Patriot Act, the Afghanistan War, the Bush Doctrine, and eventually the Iraq invasion.", hint: "Attack to security state.", difficulty: "Medium" },
    { type: "Document", front: "Bush Doctrine", back: "The principle that the United States could strike preemptively against threats before they attacked directly.", hint: "Preempt first.", difficulty: "Hard" },
    { type: "Concept", front: "Culture wars", back: "Late-twentieth-century conflict over morality, family life, immigration, race, sexuality, and historical memory.", hint: "Values as politics.", difficulty: "Medium" }
  ]
};

const chapter28Spec = {
  chapterId: "chapter28",
  chapterNum: 28,
  chapterOrder: 28,
  periodId: "p9",
  chapterMeta: {
    ...PERIOD_META.p9,
    dateRange: "2005-Present",
    chapterTitle: "A Divided Nation",
    chapterSubtitle: "Recession, reform, inequality, and polarization",
    bigPictureThemes: [THEME.politics, THEME.identity, THEME.work],
    oneLineSummary: "The early twenty-first century brought financial crisis, demographic change, rights expansion, and extreme political polarization, producing a nation more diverse and more divided at the same time.",
    periodContext: "This chapter continues Period 9 after the Iraq War and the contested Bush years. It follows the financial collapse of 2008, Barack Obama's presidency, and Donald Trump's rise as the culmination of mounting inequality, backlash, and constitutional conflict over freedom itself.",
    examTips: [
      "Treat the Great Recession as both an immediate financial collapse and a culmination of longer trends such as deregulation, debt, wage stagnation, and inequality.",
      "Do not reduce the Obama years to symbolism alone; APUSH often tests the stimulus, Affordable Care Act, Dodd-Frank, same-sex marriage, and the limits of reform.",
      "For recent politics, connect Trump not only to personality but to polarization, immigration, anti-establishment anger, and economic discontent."
    ]
  },
  imageSelections: [
    {
      rawIndex: 63,
      relevanceScore: 5,
      apCategory: "Photograph",
      caption: "Residents of New Orleans tried to flag down a rescue helicopter after Hurricane Katrina.",
      description: "The photograph captures the human consequences of state failure during Hurricane Katrina. For APUSH, it highlights the intersection of race, poverty, infrastructure, and federal responsibility in the early twenty-first century.",
      apThemes: [THEME.politics, THEME.identity, THEME.geography]
    },
    {
      rawIndex: 39,
      relevanceScore: 5,
      apCategory: "Chart/Graph",
      caption: "Figure 28.2 charts the recession's steep drop and slow recovery.",
      description: "The graph summarizes the depth of the financial crisis and the weakness of the recovery. It is significant because it gives quantitative shape to the economic instability that remade American politics after 2008.",
      apThemes: [THEME.work, THEME.politics]
    },
    {
      rawIndex: 41,
      relevanceScore: 5,
      apCategory: "Photograph",
      caption: "Barack Obama celebrated with supporters in Chicago on the night of his 2008 victory.",
      description: "The image marks the election of the first Black president in U.S. history. It matters because Obama's victory symbolized both demographic change and the hope that the crisis of 2008 might produce a new reform era.",
      apThemes: [THEME.identity, THEME.politics]
    },
    {
      rawIndex: 23,
      relevanceScore: 5,
      apCategory: "Chart/Graph",
      caption: "A chart tracks the share of national income going to the top 10 percent of families.",
      description: "The inequality chart visualizes the concentration of income at the top of the distribution. It is AP-relevant because it connects the Great Recession, Occupy Wall Street, and broader arguments about the meaning of economic freedom.",
      apThemes: [THEME.work, THEME.politics]
    },
    {
      rawIndex: 24,
      relevanceScore: 5,
      apCategory: "Photograph",
      caption: "An Occupy Wall Street protester holds a sign declaring, 'We Are the 99%.'",
      description: "The protest image turns inequality into a mass political claim. It matters for APUSH because it shows how the recession reshaped popular language about class, democracy, and corporate power.",
      apThemes: [THEME.work, THEME.politics]
    },
    {
      rawIndex: 18,
      relevanceScore: 4,
      apCategory: "Photograph",
      caption: "A 2010 photograph records the women who had served on the Supreme Court up to that point.",
      description: "The photograph captures the changing gender composition of the nation's highest court. It is significant as evidence of the long rights revolution and the altered public role of women in national institutions.",
      apThemes: [THEME.identity, THEME.politics]
    },
    {
      rawIndex: 53,
      relevanceScore: 5,
      apCategory: "Photograph",
      caption: "Obama and his national security team received updates during the mission against Osama bin Laden.",
      description: "This widely circulated image turned a covert military operation into a national political moment. It matters because it linked Obama's presidency to the unfinished legacy of the War on Terror.",
      apThemes: [THEME.world, THEME.politics]
    },
    {
      rawIndex: 56,
      relevanceScore: 4,
      apCategory: "Photograph",
      caption: "Tea Party demonstrators protested taxes, government spending, and federal reform.",
      description: "The image captures the conservative grassroots backlash against Obama's agenda. It is AP-relevant because the Tea Party transformed Republican politics and accelerated polarization.",
      apThemes: [THEME.politics, THEME.identity]
    },
    {
      rawIndex: 30,
      relevanceScore: 5,
      apCategory: "Map",
      caption: "The 2016 election map illustrates the geographic pattern of Donald Trump's victory.",
      description: "The map shows the regional and electoral structure of Trump's win. It matters because political geography became a central way to visualize polarization, populism, and the reshaping of party coalitions.",
      apThemes: [THEME.politics, THEME.geography]
    },
    {
      rawIndex: 31,
      relevanceScore: 4,
      apCategory: "Photograph",
      caption: "Protesters in Seattle challenged the Trump administration's travel ban.",
      description: "The image captures one of the first mass mobilizations against Trump's immigration policy. It is historically significant because immigration became one of the clearest tests of executive power and national identity in the new administration.",
      apThemes: [THEME.identity, THEME.politics]
    },
    {
      rawIndex: 32,
      relevanceScore: 5,
      apCategory: "Photograph",
      caption: "A detention center interior reflects the hardening of immigration enforcement at the southern border.",
      description: "The photograph visualizes the carceral dimension of modern immigration policy. For APUSH, it shows how border enforcement, detention, and asylum politics defined the debate over American membership.",
      apThemes: [THEME.identity, THEME.politics]
    },
    {
      rawIndex: 34,
      relevanceScore: 5,
      apCategory: "Photograph",
      caption: "The Women's March in Washington symbolized immediate national resistance to the Trump administration.",
      description: "The march photograph records one of the largest protest mobilizations of the era. It matters because it linked gender politics, anti-Trump activism, and the continuing rights revolution.",
      apThemes: [THEME.identity, THEME.politics]
    },
    {
      rawIndex: 12,
      relevanceScore: 5,
      apCategory: "Photograph",
      caption: "White supremacists marched in Charlottesville in 2017 during the conflict over Confederate memory.",
      description: "The image captures how debates over monuments, race, and history became flashpoints for national conflict. It is AP-relevant because it shows the persistence of white supremacist politics in disputes over memory and citizenship.",
      apThemes: [THEME.identity, THEME.culture]
    },
    {
      rawIndex: 15,
      relevanceScore: 4,
      apCategory: "Photograph",
      caption: "A visitor at the Civil Rights Memorial reflects the era's battles over how Americans use and remember history.",
      description: "The memorial image shows that historical memory became part of active political struggle. It matters because Chapter 28 treats debates over history as debates over freedom, equality, and belonging.", apThemes: [THEME.culture, THEME.identity]
    }
  ],
  notes: {
    historicalContext: {
      overview: "By 2005, the United States was already strained by the Iraq War, post-9/11 security politics, deepening inequality, and partisan conflict sharpened in the election of 2000. Financial deregulation, household debt, and wage stagnation weakened the economic foundations of the middle class. Demographic change continued to diversify the population, and rights movements kept expanding expectations of equality. These pressures framed the crises and political upheavals of the next decade.",
      precedingCauses: [
        "The Iraq War and the War on Terror damaged trust in government and left the federal state heavily committed abroad.",
        "Deregulated finance, easy credit, housing speculation, and stagnant wages made the economy vulnerable well before 2008.",
        "Demographic change, culture-war politics, and the red-blue divide of the 1990s and early 2000s laid the groundwork for extreme polarization."
      ],
      geographicContext: "The chapter ranges from New Orleans and Wall Street to the U.S.-Mexico border, the Supreme Court, and global oil waters, showing how domestic inequality, climate risk, and transnational security remained geographically uneven.",
      contextImage: {
        imageId: "chapter28-img-001",
        displayCaption: "Hurricane Katrina exposed how geography, race, and state capacity shaped vulnerability in modern America."
      }
    },
    sections: [
      {
        sectionTitle: "The Winds of Change",
        apThemes: [THEME.politics, THEME.identity, THEME.geography],
        overview: "The final Bush years revealed how war fatigue, immigration conflict, and disaster response could unravel political authority even before the financial collapse of 2008.",
        contentBlocks: [
          factBlock("Katrina and state failure", "Hurricane Katrina in 2005 devastated New Orleans and exposed how poverty, race, and weak government response magnified natural disaster into a political crisis.", "This is one of the clearest APUSH examples of environmental vulnerability intersecting with inequality."),
          factBlock("Iraq and Bush's decline", "Bush's popularity fell because of the Iraq War and a widespread sense that many Americans were not benefiting from economic growth, giving Democrats a major opening by 2004 and 2006.", "This matters because foreign-policy fatigue fed domestic political realignment."),
          factBlock("Immigration marches", "Mass immigration demonstrations signaled that Latino political mobilization had become a decisive national force, while border enforcement arguments intensified.", "This is important evidence for identity and citizenship politics before 2016."),
          comparisonBlock(
            "Bush coalition under pressure",
            {
              label: "Strengths that remained",
              points: [
                "Republicans still mobilized strong support around national security and cultural conservatism.",
                "Bush could present himself as a defender of moral certainty and anti-terror resolve."
              ]
            },
            {
              label: "Sources of erosion",
              points: [
                "Iraq damaged confidence in presidential competence.",
                "Katrina highlighted state failure and racial inequality.",
                "Economic gains seemed uneven and insecure to many families."
              ]
            },
            ["Both sides recognized that partisan identities were becoming harder rather than softer."],
            "Comparison helps explain why late-Bush politics created the conditions for dramatic change in 2008."
          ),
          factBlock("Electoral stability and division", "Even before the recession, elections revealed a remarkably stable but deeply divided political map, showing that advertising and campaign spending could not erase the underlying partisan split.", "This provides continuity with Chapter 27's 2000 election map."),
          whoBlock({
            name: "George W. Bush",
            title: "President",
            keyActions: [
              "Entered his second term promising to end tyranny abroad and sustain conservative political dominance at home.",
              "Saw his authority weaken because of Iraq, Katrina, and growing public frustration with uneven prosperity."
            ],
            perspective: "Conservative president committed to national-security leadership and market-oriented politics.",
            legacy: "Bush's weakened second term set the stage for the demand for change in 2008.",
            apSignificance: "He bridges the Iraq era of Chapter 27 and the crisis politics of Chapter 28."
          })
        ],
        sectionImages: [
          imageRef("chapter28-img-001", "after-overview", "Katrina became a national indictment of preparedness and inequality."),
          imageRef("chapter28-img-013", "after-block-2", "Immigration demonstrations showed how national identity and labor politics were converging.")
        ],
        apExamAngles: [
          "Contextualization prompts often use Katrina and the Bush decline to set up the 2008 election.",
          "Causation questions connect war fatigue, immigration conflict, and weak state performance to later political realignment."
        ],
        connections: [
          "Extends Chapter 27's polarized politics by showing how they deepened under the strain of war, immigration conflict, and disaster response."
        ]
      },
      {
        sectionTitle: "The Great Recession",
        apThemes: [THEME.work, THEME.politics, THEME.identity],
        overview: "The financial crisis of 2008 grew from years of speculation, debt, deregulation, and stagnant wages, and its aftermath transformed economic and political debate.",
        contentBlocks: [
          factBlock("Housing bubble and credit", "Low interest rates, speculative finance, and risky mortgage practices encouraged Americans to borrow heavily, tying household stability to inflated housing prices.", "This is the core causal background of the recession."),
          chainBlock("The crisis of 2008", [
            { step: 1, event: "Housing values stopped rising and mortgage defaults spread.", result: "Securities tied to home loans collapsed in value." },
            { step: 2, event: "Major banks and financial institutions suddenly faced insolvency.", result: "The federal government rushed to rescue the financial system." },
            { step: 3, event: "The crisis pushed the broader economy into deep recession.", result: "Job losses, foreclosures, and public anger reshaped the political climate." }
          ], "APUSH causation questions often use the recession to connect deregulation, debt, and the crisis of legitimacy facing markets."),
          statBlock("Portrait of a recession", "The economy suffered a steep decline in 2008 and the first part of 2009, followed by a slow recovery through 2012.", "2008-2012", "This trend explains why political anger persisted long after the formal recession ended."),
          factBlock("China and deindustrialization", "Cheap goods from China allowed Americans to keep buying even as manufacturing jobs continued to decline, reinforcing both dependence on credit and the hollowing out of older industrial work.", "This is key for explaining why the crisis hit a labor market already weakened by globalization."),
          factBlock("Unequal damage", "African Americans suffered especially severe losses because family wealth was more concentrated in housing than in stocks, and the collapse of the housing bubble devastated that wealth.", "This helps explain why the recession deepened racial inequality instead of simply causing temporary hardship."),
          factBlock("TARP and bailout anger", "Government rescues of major financial institutions convinced many Americans that elites were protected while ordinary households bore the costs of collapse.", "This became a major source of anti-establishment politics on both the left and the right.")
        ],
        sectionImages: [
          imageRef("chapter28-img-002", "after-overview", "The recession graph captures the depth of the collapse and the weakness of recovery."),
          imageRef("chapter28-img-004", "after-block-5", "Occupy Wall Street turned inequality into a visible national slogan.")
        ],
        apExamAngles: [
          "Causation questions often ask students to connect deregulation and debt to the 2008 collapse.",
          "Argumentation and CCOT prompts use the recession to evaluate whether late-twentieth-century inequality became a twenty-first-century political crisis."
        ],
        connections: [
          "Connects to Chapter 27's globalization section because cheap imports, financial integration, and deindustrialization all intensified the recession's effects."
        ]
      },
      {
        sectionTitle: "Obama in Office",
        apThemes: [THEME.politics, THEME.work, THEME.world],
        overview: "Obama's first initiatives used activist government to confront crisis, but they also triggered fierce resistance that showed how limited the national consensus for reform had become.",
        contentBlocks: [
          whoBlock({
            name: "Barack Obama",
            title: "President",
            keyActions: [
              "Entered office in 2009 promising change, a larger federal response to economic crisis, and a different tone in foreign affairs.",
              "Pushed through a stimulus package and major health-care reform while facing relentless partisan resistance."
            ],
            perspective: "Liberal reformer working within a polarized constitutional order.",
            legacy: "Obama symbolized demographic change and revived arguments over the positive use of federal power.",
            apSignificance: "He is central to APUSH questions on reform, rights, and polarization in Period 9.",
            imageId: "chapter28-img-003"
          }),
          factBlock("Stimulus", "Obama pushed through a stimulus package of nearly $800 billion in new government spending and tax cuts, reviving a much more activist understanding of federal responsibility than the Reagan-era slogan that government was the problem.", "This is a major point of comparison with the New Deal and Great Society."),
          definitionBlock("Affordable Care Act", "The 2010 health-care law that expanded insurance coverage, regulated insurers, and sought to make medical access more secure.", "The ACA became the signature domestic reform of Obama's first term and the focal point of partisan battles over the role of government.", "The ACA is one of the most testable domestic reforms of Period 9."),
          factBlock("Tea Party backlash", "Conservative activists denounced stimulus spending, taxation, and health-care reform through the Tea Party movement, which pulled the Republican Party toward a sharper anti-government identity.", "This explains why reform produced intensified polarization rather than a new consensus."),
          factBlock("Foreign-policy reset and limits", "Obama tried to close Guantanamo, end torture, and improve relations with the Muslim world, but the persistence of drone warfare and national-security pressures showed how hard it was to escape the structures built after 9/11.", "This gives the section an important complexity point about continuity in the security state."),
          factBlock("Killing of Osama bin Laden", "The 2011 mission that killed bin Laden gave Obama a major national-security victory while underlining how strongly the War on Terror still shaped American politics.", "This matters because it links Obama's presidency to unresolved post-9/11 policy.")
        ],
        sectionImages: [
          imageRef("chapter28-img-003", "after-overview", "Obama's 2008 victory symbolized both crisis and possibility."),
          imageRef("chapter28-img-007", "after-block-5", "The bin Laden situation-room image fused counterterrorism and presidential command."),
          imageRef("chapter28-img-008", "after-block-3", "Tea Party protest shows the scale of conservative resistance to Obama's reforms.")
        ],
        apExamAngles: [
          "Comparison prompts often ask whether Obama's first term resembled the reform eras of the New Deal and Great Society more than the market politics that preceded it.",
          "Argumentation questions use the ACA and Tea Party together to test whether activist government remained politically legitimate after the recession."
        ],
        connections: [
          "Connects back to Chapter 24 and Chapter 25 because Obama revived arguments over whether federal power could broaden freedom through social reform."
        ]
      },
      {
        sectionTitle: "The Obama Presidency",
        apThemes: [THEME.work, THEME.identity, THEME.politics],
        overview: "Obama governed in a country where recovery remained unequal, rights continued to expand, and structural inequality made every policy achievement politically fragile.",
        contentBlocks: [
          factBlock("Job polarization", "Recovery after the recession concentrated job growth at either the high or the low end of the wage scale, while many of the old middle-tier manufacturing routes into stability did not return.", "This explains why recovery could coexist with ongoing insecurity."),
          statBlock("White and Black family wealth", "In 2016, median white family wealth stood at $171,000, more than ten times the figure for Black families.", "2016", "This exact figure is strong evidence for enduring racial wealth inequality."),
          factBlock("Dodd-Frank and financial reform", "The administration pursued financial reform, but many Americans felt that even after the crisis, banks remained too powerful and inequality too entrenched.", "This helps explain dissatisfaction from both left and right."),
          factBlock("Occupy Wall Street", "The Occupy movement made inequality politically vivid through the language of the 99 percent, arguing that finance and concentrated wealth had captured democracy.", "This is major evidence for class protest in the Obama years."),
          quoteBlock("The Constitution's Fourteenth Amendment establishes a constitutional right to marriage for gay Americans.", "Obergefell v. Hodges, 2015", "The Supreme Court's ruling reflected a rapid shift in public opinion and extended the rights revolution into marriage equality.", "This quote is AP-relevant because it shows the continuing expansion of constitutional freedom in Period 9."),
          factBlock("Black Lives Matter", "Police violence and the uneven burden of recession contributed to the Black Lives Matter movement, which argued that formal civil rights victories had not ended systemic racial inequality.", "This is essential evidence for continuity and change after the mid-twentieth-century civil-rights movement.")
        ],
        sectionImages: [
          imageRef("chapter28-img-005", "after-block-3", "Income concentration at the top made inequality measurable and politically visible."),
          imageRef("chapter28-img-004", "after-block-4", "Occupy translated recession anger into a mass democratic slogan."),
          imageRef("chapter28-img-006", "after-overview", "Women's presence on the Supreme Court reflected the long arc of the rights revolution.")
        ],
        apExamAngles: [
          "CCOT prompts use Obama-era inequality to ask what changed and what endured since the New Deal, Great Society, and Reagan eras.",
          "Argumentation and comparison questions often connect Obergefell and Black Lives Matter to earlier rights movements."
        ],
        connections: [
          "Connects directly to Chapter 25 because the rights revolution continued through same-sex marriage and antiracist mobilization rather than ending in the 1960s."
        ]
      },
      {
        sectionTitle: "President Trump",
        apThemes: [THEME.politics, THEME.identity, THEME.geography],
        overview: "Trump's rise drew energy from anti-establishment anger, immigration conflict, racial backlash, and geographic polarization, pushing American politics into even sharper confrontation.",
        contentBlocks: [
          factBlock("2016 campaign context", "Hillary Clinton entered 2016 with long experience and establishment support, while Bernie Sanders pressured Democrats from the left with calls for universal health insurance and limits on corporate political power.", "This is important because it shows that the election emerged from dissatisfaction inside both parties."),
          whoBlock({
            name: "Donald Trump",
            title: "President",
            keyActions: [
              "Won the Republican nomination by combining celebrity, nativism, anti-establishment anger, and direct attacks on political elites.",
              "Made immigration restriction, environmental rollback, and confrontational nationalism central to his administration."
            ],
            perspective: "Populist nationalist who fused grievance politics with executive confrontation.",
            legacy: "Trump intensified polarization and turned immigration and executive power into permanent constitutional flashpoints.",
            apSignificance: "He appears in questions about populism, polarization, and the meaning of American freedom in the twenty-first century.",
            imageId: "chapter28-img-009"
          }),
          comparisonBlock(
            "Clinton and Trump in 2016",
            {
              label: "Hillary Clinton",
              points: [
                "Represented the Democratic establishment and policy experience.",
                "Benefited from support among many women, minorities, and college-educated voters.",
                "Struggled to channel anti-establishment anger."
              ]
            },
            {
              label: "Donald Trump",
              points: [
                "Presented himself as the outsider candidate against both parties' establishments.",
                "Appealed to resentment over immigration, trade, and cultural displacement.",
                "Used rallies, media spectacle, and blunt language to dominate the campaign."
              ]
            },
            ["Both candidates operated in an electorate already shaped by high distrust and intense partisanship."],
            "APUSH comparison questions use 2016 to examine how party coalitions and political style changed in Period 9."
          ),
          factBlock("Travel ban and border enforcement", "Trump's travel ban targeting several Muslim-majority countries and his detention-centered immigration policy made the boundary of national membership one of the administration's defining issues.", "This is strong evidence for identity politics and executive power."),
          factBlock("Environmental rollback", "Trump attacked climate regulation and environmental constraints, treating them as burdens on growth, energy production, and national sovereignty.", "This helps connect Period 9 politics to long-running debates over environment and markets."),
          factBlock("Women's March and resistance", "Mass protest greeted Trump's inauguration, and the Women's March became one of the era's largest demonstrations, showing how opposition movements responded immediately through public mobilization.", "This matters because it shows that protest politics remained central to national conflict.")
        ],
        sectionImages: [
          imageRef("chapter28-img-009", "after-overview", "The 2016 election map visualized Trump's electoral path."),
          imageRef("chapter28-img-010", "after-block-3", "Travel ban protests immediately challenged the administration's use of executive power."),
          imageRef("chapter28-img-011", "after-block-3", "Detention spaces made immigration enforcement visibly carceral."),
          imageRef("chapter28-img-012", "after-block-5", "The Women's March signaled that public protest would remain a central response to polarization.")
        ],
        apExamAngles: [
          "Causation prompts often ask why Trump's message resonated in regions marked by economic frustration, immigration conflict, and distrust of elites.",
          "Argumentation questions use immigration, the travel ban, and protest politics to test how executive power and citizenship collided under Trump."
        ],
        connections: [
          "Connects to Chapter 27 because the red-blue electoral divide, culture wars, and anti-globalization politics of the 1990s and early 2000s all fed Trump's rise."
        ]
      },
      {
        sectionTitle: "Freedom in the Twenty-First Century",
        apThemes: [THEME.identity, THEME.culture, THEME.politics],
        overview: "The early twenty-first century forced Americans to argue over what freedom meant in a society that was richer, more diverse, and more unequal than ever before.",
        contentBlocks: [
          statBlock("Rising old-age population", "In 2018, more than one American in seven was older than sixty-five.", "2018", "This figure highlights the demographic pressures shaping health care, retirement, and Social Security debates."),
          statBlock("Income in 1900", "In 1900, the average annual income was $3,000 in today's dollars.", "1900", "The textbook uses this figure to underscore the scale of long-term material change before examining newer inequalities."),
          factBlock("Varieties of freedom", "Americans in the early twenty-first century enjoyed longer lives, broader access to education, and higher living standards than earlier generations, yet poverty, infant mortality, and inequality remained stubbornly severe.", "This gives students an ideal complexity point: progress and crisis coexisted."),
          tensionBlock(
            "Battles over history",
            {
              label: "Those seeking a more critical public memory",
              points: [
                "Argued that slavery, segregation, conquest, and exclusion had to be confronted honestly.",
                "Supported new monuments, revised curricula, and challenges to older celebratory narratives."
              ]
            },
            {
              label: "Those defending older national symbols",
              points: [
                "Argued that removing monuments and revising patriotic narratives dishonored the nation's heritage.",
                "Warned that criticism of the national past weakened civic unity."
              ]
            },
            "The conflict remained unresolved, and clashes such as Charlottesville showed that memory itself had become a front in national politics.",
            "This is central to APUSH because historical interpretation became part of political struggle, not just classroom debate."
          ),
          factBlock("Exceptional America questioned", "The chapter presents the early twenty-first century as a period in which Americans still believed in exceptional freedom but argued bitterly over whether that freedom meant markets, social rights, protest, security, or recognition.", "This frames Period 9 as a debate over the meaning rather than the existence of freedom."),
          factBlock("Learning from history", "Public sites such as the Civil Rights Memorial became places where Americans asked what history should teach about democracy, suffering, and citizenship in the present.", "This makes memory itself a subject for APUSH argumentation.")
        ],
        sectionImages: [
          imageRef("chapter28-img-013", "after-block-3", "Charlottesville turned historical memory into immediate political violence."),
          imageRef("chapter28-img-014", "after-block-5", "The Civil Rights Memorial shows how public history became a civic battleground.")
        ],
        apExamAngles: [
          "Complexity points are easy to earn here by balancing real gains in life expectancy, rights, and comfort against inequality, racism, and democratic distrust.",
          "Comparison prompts often ask students to connect modern battles over monuments and public memory to earlier disputes over Reconstruction, civil rights, and national identity."
        ],
        connections: [
          "This section links the whole course together by asking how freedom changed from Reconstruction through the Cold War, the rights revolution, and the present."
        ]
      }
    ],
    overarchingAnalysis: {
      continuity: "Americans still defined politics through arguments over freedom, inequality, citizenship, and the proper size of federal power.",
      change: "The Great Recession, marriage equality, Black Lives Matter, and Trump's rise made polarization more existential and tied it more clearly to inequality, race, and demographic change.",
      complexity: "The nation became more diverse and more inclusive in some rights-based ways even as wealth concentrated upward, institutions lost trust, and political identity hardened into mutual suspicion.",
      comparisonAngles: [
        "Compare the Great Recession with the Great Depression by examining state rescue, regulation, and popular protest.",
        "Compare Black Lives Matter with the mid-twentieth-century civil-rights movement in goals, methods, and the meaning of citizenship."
      ]
    }
  },
  vocabulary: [
    { term: "Great Recession", definition: "The severe economic downturn that began in 2007-2008 after the collapse of the housing bubble and financial markets.", context: "The recession reshaped policy, protest, and political trust.", apRelevance: "Essential Period 9 economic turning point." },
    { term: "Subprime Mortgage", definition: "A risky home loan often made to borrowers with weaker credit histories.", context: "Subprime lending fueled the housing bubble that burst in 2008.", apRelevance: "Important causal term for the Great Recession." },
    { term: "TARP", definition: "The federal bank-rescue program used during the financial crisis.", context: "Bailouts convinced many Americans that elites were protected while ordinary people suffered.", apRelevance: "Useful for arguments about crisis management and legitimacy." },
    { term: "Stimulus", definition: "Large-scale government spending and tax cuts intended to revive economic activity during recession.", context: "Obama's stimulus package marked a return to activist government.", apRelevance: "Important for comparison with New Deal-style responses." },
    { term: "Affordable Care Act", definition: "The 2010 law that expanded health insurance and regulated parts of the health-care system.", context: "The ACA became the signature domestic reform of Obama's first term.", apRelevance: "A central Period 9 reform frequently tested on APUSH." },
    { term: "Dodd-Frank", definition: "A major financial-reform law passed after the 2008 crisis.", context: "It tried to regulate finance more tightly after the crash.", apRelevance: "Useful evidence for the federal response to the recession." },
    { term: "Occupy Wall Street", definition: "A protest movement that attacked inequality and the political power of finance using the language of the 99 percent.", context: "Occupy turned class inequality into a visible political slogan.", apRelevance: "Important for protest and inequality questions." },
    { term: "Tea Party", definition: "A conservative grassroots movement opposing taxes, government spending, and Obama's reforms.", context: "Tea Party activism pushed the Republican Party in a more confrontational anti-government direction.", apRelevance: "Key to understanding post-2008 conservatism." },
    { term: "Marriage Equality", definition: "The recognition of same-sex marriage as a legal right.", context: "The Supreme Court's ruling in Obergefell v. Hodges made marriage equality constitutional nationwide.", apRelevance: "Important for rights-revolution continuity." },
    { term: "Obergefell v. Hodges", definition: "The 2015 Supreme Court case establishing a constitutional right to same-sex marriage.", context: "The decision reflected a rapid shift in public opinion and rights claims.", apRelevance: "Major constitutional-rights case in Period 9." },
    { term: "Black Lives Matter", definition: "A movement protesting police violence and systemic racial inequality.", context: "BLM argued that formal civil-rights victories had not ended structural racism.", apRelevance: "Core evidence for continuity and change in racial politics." },
    { term: "Income Inequality", definition: "The unequal distribution of income across a society, especially the concentration of gains at the top.", context: "Inequality became a major political issue after the recession.", apRelevance: "Important for work, exchange, and politics themes." },
    { term: "Drone Warfare", definition: "The use of unmanned aircraft to carry out surveillance and targeted strikes.", context: "Obama's presidency showed that the War on Terror's methods continued even with different rhetoric.", apRelevance: "Useful for continuity in national-security policy." },
    { term: "Travel Ban", definition: "Trump administration restrictions on entry from several Muslim-majority countries.", context: "The policy became an early flashpoint over executive power and immigration.", apRelevance: "Important for identity, citizenship, and constitutional debate." },
    { term: "Detention Center", definition: "A facility used to confine migrants or asylum seekers during immigration proceedings.", context: "Border detention became central to debates over Trump's immigration policy.", apRelevance: "Useful for citizenship and state-power arguments." },
    { term: "Women's March", definition: "The mass protests that took place the day after Trump's inauguration.", context: "The marches signaled immediate nationwide resistance to Trump's politics.", apRelevance: "Evidence of protest politics in the Trump era." },
    { term: "Political Polarization", definition: "The process by which political groups move farther apart and view each other with growing distrust.", context: "Polarization defined elections, governance, and public culture in the period.", apRelevance: "A key interpretive concept for contemporary politics." },
    { term: "Democratic Socialist", definition: "A label used by Bernie Sanders to describe support for a stronger welfare state, regulation, and universal social benefits.", context: "The Sanders campaign showed a powerful left critique inside Democratic politics.", apRelevance: "Useful for the ideological range of modern politics." },
    { term: "Charlottesville", definition: "The 2017 white-supremacist rally and violence in Charlottesville, Virginia.", context: "Charlottesville became a national symbol of battles over race, monuments, and history.", apRelevance: "Important for identity and memory politics." },
    { term: "Katrina", definition: "Short for Hurricane Katrina, the 2005 storm that exposed government failure and inequality in New Orleans.", context: "Katrina revealed how environmental disaster could become a racial and political crisis.", apRelevance: "A major event for geography, environment, and state capacity." }
  ],
  keyFigures: [
    { name: "Barack Obama", title: "President", bio: "Obama led the federal response to the recession, signed the Affordable Care Act, and presided over major rights and inequality debates.", significance: "He symbolized demographic change and revived battles over the role of government.", perspective: "Liberal reformer", imageId: "chapter28-img-003" },
    { name: "Donald Trump", title: "President", bio: "Trump rose through anti-establishment populism, immigration restriction, and confrontational nationalism.", significance: "He intensified polarization and reshaped Republican politics.", perspective: "Populist nationalist", imageId: "chapter28-img-009" },
    { name: "Hillary Clinton", title: "Democratic nominee", bio: "Clinton represented experience, establishment politics, and the possibility of the first female presidency in 2016.", significance: "Her defeat showed the limits of establishment politics in a polarized age.", perspective: "Centrist Democrat", imageId: null },
    { name: "Bernie Sanders", title: "Senator", bio: "Sanders challenged Democratic orthodoxy by calling for universal health care, stronger regulation, and limits on corporate political influence.", significance: "He pushed class inequality and democratic socialism into the center of debate.", perspective: "Left populist", imageId: null },
    { name: "Sonia Sotomayor", title: "Supreme Court justice", bio: "Sotomayor's rise reflected the growing diversity of national institutions during the Obama years.", significance: "She symbolizes demographic change and the continuing rights revolution.", perspective: "Judicial voice shaped by minority representation", imageId: "chapter28-img-006" },
    { name: "Joe Biden", title: "Vice President", bio: "Biden helped advance Obama's legislative agenda and later became part of the larger story of post-2016 political realignment.", significance: "He represents continuity between the Obama reform coalition and later Democratic politics.", perspective: "Center-left institutional politician", imageId: null }
  ],
  textStimuli: [
    { text: "The roots of the crisis of 2008 lay in policies that favored speculation, easy credit, and get-rich-quick schemes over stable growth.", caption: "Textbook discussion of the Great Recession" },
    { text: "Government is not the problem, Obama implied; in a crisis, it must act.", caption: "Paraphrase of Obama's early budget and stimulus politics" },
    { text: "The Constitution's Fourteenth Amendment establishes a constitutional right to marriage for gay Americans.", caption: "Obergefell v. Hodges, 2015" },
    { text: "The Tea Party denounced taxes, deficits, and federal reform as threats to freedom.", caption: "Textbook discussion of the Tea Party backlash" },
    { text: "Occupy argued that concentrated wealth had captured democracy and left the 99 percent exposed.", caption: "Textbook discussion of Occupy Wall Street" },
    { text: "Trump turned immigration, borders, and national decline into central themes of the 2016 campaign.", caption: "Textbook discussion of Trump's rise" }
  ],
  mcqFacts: [
    { apSkill: "Causation", apTheme: THEME.work, topicTag: "Great Recession", question: "The Great Recession most directly resulted from", correct: "years of risky lending, housing speculation, and financial deregulation", wrong: ["a sudden nationwide shortage of industrial labor", "the immediate elimination of all federal bank oversight in 2008 alone", "a return to the gold standard by the Federal Reserve"], explanation: "The housing bubble, easy credit, and deregulated finance created the structural conditions for the collapse." },
    { apSkill: "Contextualization", apTheme: THEME.politics, topicTag: "Katrina", question: "The political significance of Hurricane Katrina lay primarily in the way it", correct: "revealed how race, poverty, and weak government response shaped vulnerability to disaster", wrong: ["ended all debate about the federal role in social welfare", "restored public confidence in the Bush administration", "eliminated the need for disaster preparedness in coastal cities"], explanation: "Katrina became a symbol of state failure and unequal citizenship." },
    { apSkill: "Argumentation", apTheme: THEME.politics, topicTag: "Obama", question: "Obama's early stimulus package is best understood as evidence that", correct: "the federal government could again be presented as an active tool for economic recovery", wrong: ["the New Deal and Great Society had been fully repealed before 2009", "most conservatives now favored large permanent deficits for social programs", "the recession could be solved without any debate over taxes or spending"], explanation: "The stimulus marked a significant, if contested, return to activist government." },
    { apSkill: "Comparison", apTheme: THEME.work, topicTag: "Occupy and Tea Party", question: "Occupy Wall Street and the Tea Party differed most clearly in that", correct: "Occupy attacked concentrated wealth and finance, while the Tea Party attacked taxation and federal expansion", wrong: ["Occupy rejected protest while the Tea Party embraced it", "the Tea Party supported the Affordable Care Act while Occupy opposed it", "Occupy demanded stronger border enforcement while the Tea Party promoted open immigration"], explanation: "Both were protest movements, but they identified very different enemies and solutions." },
    { apSkill: "Continuity and Change Over Time", apTheme: THEME.identity, topicTag: "Rights Revolution", question: "The Obergefell v. Hodges decision most directly demonstrates that", correct: "the rights revolution continued into the twenty-first century through new claims about equality and personal liberty", wrong: ["the Supreme Court had permanently withdrawn from all social questions", "same-sex marriage was the only major civil-rights issue left in the United States", "the federal government no longer played any role in defining citizenship"], explanation: "Obergefell extended constitutional claims about freedom rather than ending political conflict." },
    { apSkill: "Causation", apTheme: THEME.politics, topicTag: "Tea Party", question: "The Tea Party movement grew largely in response to", correct: "anger over stimulus spending, taxes, and what conservatives saw as excessive federal activism", wrong: ["support for a stronger labor-union movement", "a desire to expand immigration benefits for undocumented migrants", "the success of Occupy Wall Street's anti-finance agenda"], explanation: "Tea Party activism surged as a backlash against Obama's early reforms." },
    { apSkill: "Argumentation", apTheme: THEME.identity, topicTag: "Black Lives Matter", question: "Black Lives Matter activists most directly argued that", correct: "formal civil-rights victories had not ended systemic racial inequality and police violence", wrong: ["all racial inequalities had disappeared by the Obama presidency", "racial issues should be removed from public politics entirely", "the only important issue facing Black Americans was access to consumer credit"], explanation: "BLM insisted that structural inequality persisted after the classic civil-rights era." },
    { apSkill: "Comparison", apTheme: THEME.politics, topicTag: "Trump and Clinton", question: "A major difference between Donald Trump and Hillary Clinton in 2016 was that", correct: "Trump ran as an anti-establishment outsider while Clinton embodied institutional experience and party leadership", wrong: ["Clinton campaigned against all forms of federal regulation while Trump demanded universal health insurance", "Trump rejected immigration as a campaign issue while Clinton emphasized it", "Clinton attacked all major American alliances while Trump defended them without criticism"], explanation: "Their contrast in political style and establishment status was one of the central dynamics of the race." },
    { apSkill: "Contextualization", apTheme: THEME.geography, topicTag: "2016 election", question: "The map of the 2016 election is most useful for showing", correct: "the geographic pattern of political polarization across the United States", wrong: ["the disappearance of the Electoral College", "the replacement of presidential elections with direct national referenda", "the end of regional differences in party support"], explanation: "The electoral map visualized the regional structure of partisan division." },
    { apSkill: "Causation", apTheme: THEME.identity, topicTag: "Travel ban", question: "Opposition to Trump's travel ban most directly reflected concerns that the policy", correct: "used executive power to exclude people on the basis of religion and national origin", wrong: ["required the abolition of all border controls", "expanded asylum access without restriction", "ended federal authority over immigration"], explanation: "Critics saw the ban as a discriminatory use of executive authority." },
    { apSkill: "Argumentation", apTheme: THEME.work, topicTag: "Inequality", question: "The slogan 'We are the 99 percent' most directly expressed concern about", correct: "the concentration of wealth and power in the hands of a small elite", wrong: ["the immediate return of nineteenth-century plantation agriculture", "the complete disappearance of finance from the U.S. economy", "the abolition of the middle class by constitutional amendment"], explanation: "Occupy made inequality and elite power the center of its message." },
    { apSkill: "Comparison", apTheme: THEME.world, topicTag: "War on Terror continuity", question: "Obama's use of drone warfare is best understood as evidence that", correct: "important features of the national-security state survived even after the Bush years", wrong: ["the United States withdrew completely from counterterrorism operations", "Obama rejected every military tool associated with the War on Terror", "Congress permanently abolished covert action after 2008"], explanation: "Obama changed tone and some policies, but major counterterrorism practices remained." },
    { apSkill: "Contextualization", apTheme: THEME.identity, topicTag: "Women's March", question: "The Women's Marches of 2017 are best understood as part of the broader pattern of", correct: "mass protest and rights-based mobilization continuing into the twenty-first century", wrong: ["the disappearance of feminism from national politics", "the end of political organization after the 2016 election", "a rejection of all social media and modern organizing tools"], explanation: "The marches showed that public protest remained central to democratic conflict." },
    { apSkill: "Causation", apTheme: THEME.identity, topicTag: "Charlottesville", question: "The conflict in Charlottesville in 2017 most directly demonstrated that", correct: "debates over race, monuments, and historical memory had become central political flashpoints", wrong: ["all controversies over the Civil War had disappeared", "most Americans agreed on a single interpretation of slavery and segregation", "federal courts had banned all public discussion of Confederate symbols"], explanation: "Charlottesville made memory politics visible as immediate conflict." },
    { apSkill: "Continuity and Change Over Time", apTheme: THEME.work, topicTag: "Recovery after 2008", question: "A major feature of the post-2008 recovery was that", correct: "job growth was uneven and many older middle-class industrial routes into stability did not return", wrong: ["every sector recovered equally and rapidly", "manufacturing employment returned to its twentieth-century peak", "wage inequality disappeared because of the stimulus"], explanation: "Recovery was real but uneven, which is why political anger endured." },
    { apSkill: "Argumentation", apTheme: THEME.politics, topicTag: "ACA", question: "Supporters of the Affordable Care Act generally argued that the law", correct: "expanded freedom by making access to health insurance more secure", wrong: ["eliminated all private insurance immediately", "ended federal involvement in health care entirely", "guaranteed equal incomes for all Americans"], explanation: "Supporters tied health coverage to security and practical freedom rather than abolishing all private insurance." },
    { apSkill: "Comparison", apTheme: THEME.identity, topicTag: "Obama symbolism", question: "Obama's election in 2008 can best be compared to earlier moments in U.S. history when", correct: "changes in who held public power symbolized broader struggles over citizenship and inclusion", wrong: ["the Constitution was suspended in peacetime without controversy", "presidents were chosen by direct popular appointment rather than election", "all racial inequalities disappeared overnight after a single vote"], explanation: "Obama's victory had deep symbolic weight but did not end structural inequality." },
    { apSkill: "Contextualization", apTheme: THEME.geography, topicTag: "Border detention", question: "Photographs of detention centers at the U.S.-Mexico border are most useful for illustrating", correct: "the increasingly carceral character of immigration enforcement in the Trump era", wrong: ["the end of all federal power over asylum and migration", "a national commitment to open borders without detention", "the disappearance of immigration from public debate"], explanation: "Detention became a visible symbol of how immigration policy was being enforced." },
    { apSkill: "Causation", apTheme: THEME.politics, topicTag: "Trumpism", question: "Trump's rise to the presidency was aided most by", correct: "anti-establishment anger, immigration conflict, and economic frustration in a polarized electorate", wrong: ["broad national agreement on immigration liberalization", "the disappearance of conservative media and grassroots activism", "the collapse of all regional voting differences"], explanation: "Trump succeeded by channeling grievance in a country already divided by class, culture, and geography." },
    { apSkill: "Argumentation", apTheme: THEME.culture, topicTag: "Freedom in the 21st century", question: "The chapter's discussion of freedom in the twenty-first century most strongly suggests that", correct: "Americans increasingly fought over what freedom meant rather than whether freedom mattered", wrong: ["freedom had vanished entirely from political language", "all Americans agreed that market freedom was the only legitimate kind", "historical memory had become irrelevant to current politics"], explanation: "The era was defined by competing definitions of freedom tied to identity, economics, history, and rights." }
  ],
  saq: [
    {
      prompt: "Answer parts A, B, and C about the Great Recession.",
      partA: "Describe ONE cause of the Great Recession.",
      partB: "Explain ONE reason the recession produced intense public anger.",
      partC: "Explain ONE way the recession reshaped politics in the United States.",
      scoringGuidance: {
        partA: "Must mention housing speculation, risky lending, deregulation, or debt.",
        partB: "Must discuss bailouts, foreclosures, unemployment, or unequal recovery.",
        partC: "Must connect to Obama, Tea Party, Occupy, inequality, or distrust of elites."
      },
      sampleAnswers: {
        partA: "One cause of the Great Recession was the spread of risky mortgages and financial speculation tied to the housing bubble.",
        partB: "The recession produced anger because the federal government rescued major financial institutions while many ordinary people lost jobs and homes.",
        partC: "The recession reshaped politics by fueling both the Tea Party on the right and Occupy Wall Street on the left."
      }
    },
    {
      prompt: "Answer parts A, B, and C about Obama's first term.",
      partA: "Describe ONE major policy initiative of Obama's first term.",
      partB: "Explain ONE reason that initiative provoked backlash.",
      partC: "Explain ONE way Obama's presidency represented change in U.S. political history.",
      scoringGuidance: {
        partA: "Must mention the stimulus, ACA, financial reform, or foreign-policy reset.",
        partB: "Must connect to taxes, federal power, partisanship, race, or anti-government ideology.",
        partC: "Must identify Obama's election as the first Black presidency or a renewed activist state."
      },
      sampleAnswers: {
        partA: "A major policy initiative of Obama's first term was the Affordable Care Act, which expanded health insurance coverage.",
        partB: "The law provoked backlash because conservatives believed it expanded federal power too far and threatened individual freedom.",
        partC: "Obama's presidency represented change because he became the first African American elected president and revived a more active role for government in crisis."
      }
    },
    {
      prompt: "Answer parts A, B, and C about inequality.",
      partA: "Describe ONE way inequality became more visible after 2008.",
      partB: "Explain ONE reason inequality hit Black Americans especially hard.",
      partC: "Explain ONE movement that responded to inequality.",
      scoringGuidance: {
        partA: "Must mention income concentration, unequal recovery, or job polarization.",
        partB: "Must connect to housing wealth, recession losses, or structural racial gaps.",
        partC: "Must identify Occupy Wall Street, Sanders, or another response."
      },
      sampleAnswers: {
        partA: "Inequality became more visible because charts and public debate showed how much of national income flowed to the top 10 percent.",
        partB: "Black Americans were hit especially hard because their family wealth was more concentrated in housing, which collapsed in value during the recession.",
        partC: "Occupy Wall Street responded by arguing that a tiny elite had captured too much wealth and political influence."
      }
    },
    {
      prompt: "Use the stimulus to answer parts A, B, and C about the Tea Party.",
      partA: "Describe ONE issue that mobilized the Tea Party.",
      partB: "Explain ONE reason the Tea Party became influential inside the Republican Party.",
      partC: "Explain ONE difference between the Tea Party and Occupy Wall Street.",
      scoringGuidance: {
        partA: "Must mention taxes, stimulus, ACA, deficits, or federal spending.",
        partB: "Must connect to conservative grassroots activism or anti-establishment energy.",
        partC: "Must contrast their targets, ideology, or view of government."
      },
      sampleAnswers: {
        partA: "One issue that mobilized the Tea Party was opposition to taxes and what activists saw as excessive federal spending.",
        partB: "The Tea Party became influential because it tapped conservative grassroots anger and pressured Republican leaders to reject compromise.",
        partC: "The Tea Party attacked federal power, while Occupy Wall Street attacked concentrated wealth and financial elites."
      }
    },
    {
      prompt: "Use the stimulus to answer parts A, B, and C about marriage equality.",
      partA: "Describe ONE significance of Obergefell v. Hodges.",
      partB: "Explain ONE reason public opinion on same-sex marriage changed rapidly.",
      partC: "Explain ONE way marriage equality fits into the broader rights revolution.",
      scoringGuidance: {
        partA: "Must identify constitutional right to same-sex marriage.",
        partB: "Must discuss activism, visibility, generational change, or shifting culture.",
        partC: "Must connect to earlier civil-rights or feminist rights claims."
      },
      sampleAnswers: {
        partA: "Obergefell v. Hodges established that same-sex couples had a constitutional right to marry nationwide.",
        partB: "Public opinion changed rapidly because gay Americans became more visible and activists persuaded many people to view marriage as a matter of equal dignity.",
        partC: "Marriage equality fits into the rights revolution because it extended constitutional claims about equality and liberty to a group long excluded from full citizenship."
      }
    },
    {
      prompt: "Use the stimulus to answer parts A, B, and C about Trump and immigration.",
      partA: "Describe ONE immigration policy associated with Trump's presidency.",
      partB: "Explain ONE reason immigration became so politically powerful in 2016.",
      partC: "Explain ONE response to Trump's immigration agenda.",
      scoringGuidance: {
        partA: "Must mention the travel ban, detention, asylum restriction, or border enforcement.",
        partB: "Must connect to identity politics, economic fear, cultural backlash, or anti-establishment rhetoric.",
        partC: "Must mention protests, court challenges, activism, or sanctuary politics."
      },
      sampleAnswers: {
        partA: "One immigration policy associated with Trump was the travel ban that restricted entry from several Muslim-majority countries.",
        partB: "Immigration became politically powerful because many voters linked border control to national identity, economic anxiety, and security.",
        partC: "A major response to Trump's immigration agenda was mass protest and court challenges against the travel ban."
      }
    },
    {
      prompt: "Answer parts A, B, and C about Katrina.",
      partA: "Describe ONE way Hurricane Katrina exposed inequality.",
      partB: "Explain ONE criticism of the government's response to the disaster.",
      partC: "Explain ONE reason Katrina remained politically significant after the immediate emergency ended.",
      scoringGuidance: {
        partA: "Must mention race, poverty, infrastructure, or vulnerability.",
        partB: "Must connect to slow response, weak preparedness, or state failure.",
        partC: "Must link to Bush's decline, trust in government, or environmental vulnerability."
      },
      sampleAnswers: {
        partA: "Katrina exposed inequality because poor Black residents of New Orleans were especially vulnerable and had fewer resources to escape or recover.",
        partB: "The response was criticized because government agencies appeared disorganized and too slow to rescue or support residents.",
        partC: "Katrina remained politically significant because it became a symbol of how weak state capacity and inequality could turn a storm into a national crisis."
      }
    },
    {
      prompt: "Answer parts A, B, and C about Black Lives Matter.",
      partA: "Describe ONE issue that Black Lives Matter highlighted.",
      partB: "Explain ONE way BLM echoed earlier civil-rights activism.",
      partC: "Explain ONE way BLM differed from earlier civil-rights movements.",
      scoringGuidance: {
        partA: "Must mention police violence, systemic racism, or unequal justice.",
        partB: "Must connect to protest, citizenship, racial equality, or federal accountability.",
        partC: "Must mention social media, decentralized leadership, or a different institutional context."
      },
      sampleAnswers: {
        partA: "Black Lives Matter highlighted police violence and the persistence of systemic racial inequality.",
        partB: "It echoed earlier civil-rights activism by using protest to demand that the nation live up to its promises of equal citizenship.",
        partC: "It differed because it relied heavily on decentralized organizing and social media rather than a single national leadership structure."
      }
    },
    {
      prompt: "Answer parts A, B, and C about the 2016 election.",
      partA: "Describe ONE feature of Trump's appeal in 2016.",
      partB: "Explain ONE reason Clinton still seemed likely to win for much of the campaign.",
      partC: "Explain ONE broader trend that the 2016 election revealed.",
      scoringGuidance: {
        partA: "Must mention outsider image, immigration, anti-establishment rhetoric, or populism.",
        partB: "Must mention establishment support, experience, polling, or demographic expectations.",
        partC: "Must connect to polarization, geography, distrust, or party realignment."
      },
      sampleAnswers: {
        partA: "One feature of Trump's appeal was that he presented himself as an outsider who would fight elites and crack down on immigration.",
        partB: "Clinton seemed likely to win because she had broad establishment support and appeared more experienced than Trump.",
        partC: "The election revealed how deeply polarized and geographically divided American politics had become."
      }
    },
    {
      prompt: "Answer parts A, B, and C about freedom in the twenty-first century.",
      partA: "Describe ONE way Americans experienced greater freedom or comfort than earlier generations.",
      partB: "Explain ONE problem that complicated that progress.",
      partC: "Explain ONE reason battles over history became politically important.",
      scoringGuidance: {
        partA: "Must mention longer life, material comfort, rights expansion, or education.",
        partB: "Must mention inequality, poverty, infant mortality, racism, or distrust.",
        partC: "Must connect to monuments, memory, national identity, or civic meaning."
      },
      sampleAnswers: {
        partA: "Americans in the early twenty-first century generally lived longer and enjoyed far higher material comfort than people had a century earlier.",
        partB: "That progress was complicated by severe inequality and persistent racial and economic injustice.",
        partC: "Battles over history became important because people believed that public memory of slavery, segregation, and citizenship shaped what freedom should mean in the present."
      }
    }
  ],
  leq: [
    {
      id: "chapter28-leq-001",
      chapterId: "chapter28",
      prompt: "Evaluate the extent to which the Great Recession transformed the role of the federal government in the United States.",
      recommendedArgument: "Causation",
      thesisExamples: [
        "The Great Recession transformed the role of the federal government by reviving aggressive intervention through bailouts, stimulus, financial reform, and the Affordable Care Act, although the backlash against these measures showed that Americans remained deeply divided over activist government.",
        "The crisis pushed Washington toward a more active response than many Americans had accepted since the Reagan era, but it did not produce a lasting consensus because the Tea Party and later anti-establishment anger turned reform itself into a source of polarization."
      ],
      outlineScaffold: {
        contextualization: "Discuss Reagan-era deregulation, Clinton/Bush finance, and the long weakening of industrial stability before 2008.",
        bodyParagraph1: { claim: "Crisis demanded intervention.", evidence: ["bank bailouts", "stimulus", "Dodd-Frank"], analysis: "A collapsing financial system made federal inaction politically impossible." },
        bodyParagraph2: { claim: "Health reform expanded the meaning of federal responsibility.", evidence: ["Affordable Care Act", "debate over coverage", "Tea Party reaction"], analysis: "The recession widened arguments about what security and freedom required." },
        bodyParagraph3: { claim: "Transformation was real but contested.", evidence: ["Tea Party", "Occupy", "continued distrust of elites"], analysis: "Government power grew, but legitimacy did not grow with it." },
        complexity: "Argue that the recession changed the federal role while simultaneously making government itself more politically fragile."
      },
      scoringRubric: {
        thesis: "1 point - Make a defensible claim about transformation and limits.",
        contextualization: "1 point - Place the essay in the long arc of deregulation and inequality.",
        evidence: "2 points - Use specific policy responses and backlash movements.",
        analysis: "2 points - Explain why crisis expanded government and why consensus still failed.",
        complexity: "1 point - Weigh transformation against continued anti-government politics."
      }
    },
    {
      id: "chapter28-leq-002",
      chapterId: "chapter28",
      prompt: "Evaluate the extent to which political conflict in the United States from 2005 to the present centered on the meaning of freedom.",
      recommendedArgument: "Argumentation",
      thesisExamples: [
        "From Katrina to Trump, political conflict centered heavily on the meaning of freedom because Americans fought over whether freedom meant security, health care, marriage equality, low taxes, border control, protest, or historical recognition.",
        "Although economic crisis and partisan strategy intensified conflict, the deepest disputes from 2005 to the present revolved around competing definitions of freedom in matters of race, gender, immigration, government power, and rights."
      ],
      outlineScaffold: {
        contextualization: "Explain the freedom language of the Cold War, the rights revolutions, and the conservative turn before 2005.",
        bodyParagraph1: { claim: "Economic freedom and social provision collided after 2008.", evidence: ["stimulus", "ACA", "Tea Party"], analysis: "One side saw federal action as enabling security, the other as threatening liberty." },
        bodyParagraph2: { claim: "Personal freedom expanded through the rights revolution.", evidence: ["Obergefell", "Black Lives Matter", "Women's March"], analysis: "Freedom increasingly meant recognition, dignity, and equality for many activists." },
        bodyParagraph3: { claim: "Trump-era politics sharpened boundary questions.", evidence: ["travel ban", "detention", "Charlottesville"], analysis: "Conflict turned to who belonged and whose history the nation would honor." },
        complexity: "Show that Americans all claimed freedom, but attached the term to radically different priorities and communities."
      },
      scoringRubric: {
        thesis: "1 point - Offer a defensible argument about freedom as the center of conflict.",
        contextualization: "1 point - Situate the issue in longer freedom debates across the course.",
        evidence: "2 points - Use specific examples from economic, rights, and immigration politics.",
        analysis: "2 points - Explain how competing meanings of freedom structured conflict.",
        complexity: "1 point - Demonstrate that multiple sides invoked freedom even while opposing each other."
      }
    }
  ],
  dbq: [
    {
      id: "chapter28-dbq-001",
      chapterId: "chapter28",
      prompt: "Evaluate the extent to which the Great Recession and its aftermath intensified political polarization in the United States.",
      documents: [
        {
          docNumber: 1,
          docType: "image",
          title: "Portrait of a Recession",
          source: "Economic chart, 2008-2012",
          imageId: "chapter28-img-002",
          excerpt: "The chart shows a sharp economic collapse in 2008 and early 2009 followed by a slower recovery. It visually emphasizes both crisis and lingering weakness.",
          happ: {
            historicalSituation: "The financial crisis produced the deepest downturn since the Great Depression.",
            audience: "Readers evaluating the scale of economic dislocation.",
            purpose: "To quantify the recession and recovery.",
            pointOfView: "The chart foregrounds structural economic change rather than partisan rhetoric."
          }
        },
        {
          docNumber: 2,
          docType: "text",
          title: "Obama's recovery politics",
          source: "Textbook discussion of the stimulus and early Obama budget, 2009",
          imageId: null,
          excerpt: "Obama's first budget recalled the New Deal and Great Society, anticipating active government support for health care, clean energy, and education. It broke sharply with the Reagan-era claim that government itself was the problem.",
          happ: {
            historicalSituation: "Obama entered office amid financial panic and recession.",
            audience: "Readers asked to compare modern crisis policy with earlier reform eras.",
            purpose: "To explain the ideological significance of Obama's early agenda.",
            pointOfView: "The textbook emphasizes the return of activist-government language."
          }
        },
        {
          docNumber: 3,
          docType: "image",
          title: "Tea Party demonstration",
          source: "Photograph, 2009-2010",
          imageId: "chapter28-img-008",
          excerpt: "The image shows demonstrators protesting taxes, spending, and federal reform. It conveys the moral urgency and populist anger of the Tea Party movement.",
          happ: {
            historicalSituation: "Conservative backlash surged against Obama's stimulus and health-care plans.",
            audience: "The wider public and Republican politicians watching grassroots mobilization.",
            purpose: "To display movement activism and opposition to government expansion.",
            pointOfView: "The protesters present themselves as defending taxpayers and constitutional freedom."
          }
        },
        {
          docNumber: 4,
          docType: "image",
          title: "Occupy Wall Street",
          source: "Photograph of protester, 2011",
          imageId: "chapter28-img-004",
          excerpt: "A protester identifies with the 99 percent, turning inequality into a mass political identity. The image dramatizes class resentment after the bailout era.",
          happ: {
            historicalSituation: "Occupy emerged after recovery seemed to benefit elites more than ordinary Americans.",
            audience: "A public increasingly aware of inequality and corporate power.",
            purpose: "To mobilize popular anger against concentrated wealth.",
            pointOfView: "The protest assumes that democracy has been warped by elite dominance."
          }
        },
        {
          docNumber: 5,
          docType: "image",
          title: "Income inequality chart",
          source: "Chart, 1910-2015",
          imageId: "chapter28-img-005",
          excerpt: "The graph tracks the share of income going to the top 10 percent and shows that inequality rose sharply in the late twentieth and early twenty-first centuries.", 
          happ: {
            historicalSituation: "Long-term inequality made recession politics more combustible.",
            audience: "Students comparing recent inequality with earlier eras such as the Gilded Age.",
            purpose: "To quantify the concentration of income at the top.",
            pointOfView: "The chart invites structural rather than purely partisan interpretation."
          }
        },
        {
          docNumber: 6,
          docType: "image",
          title: "Election of 2016 map",
          source: "Electoral map, 2016",
          imageId: "chapter28-img-009",
          excerpt: "The map reveals the geographic pattern of Donald Trump's victory. It shows how the politics of the post-recession era hardened into a regionally divided electoral alignment.",
          happ: {
            historicalSituation: "The 2016 election followed years of weak recovery, Tea Party activism, and anti-establishment anger.",
            audience: "Citizens and students evaluating the outcome of contemporary polarization.",
            purpose: "To visualize the electoral structure of Trump's win.",
            pointOfView: "The map emphasizes space and coalition rather than campaign rhetoric."
          }
        }
      ],
      thesisExample: "The Great Recession intensified political polarization to a large extent because it discredited elites, revived conflict over the role of government, and turned inequality into a mass political grievance, although earlier culture-war and identity divisions ensured that recession politics would be absorbed into an already fractured political system.",
      outlineScaffold: {
        contextualization: "Explain deregulation, the Bush years, and preexisting red-blue polarization before 2008.",
        bodyParagraph1: { claim: "The recession revived activist government and backlash at the same time.", documentsUsed: [1, 2, 3], outsideEvidence: "Stimulus and ACA", happ: "Document 2 shows why Obama's language sounded like a break with Reagan-era orthodoxy." },
        bodyParagraph2: { claim: "Inequality became a mass political language.", documentsUsed: [4, 5], outsideEvidence: "Occupy Wall Street and long-term wage stagnation", happ: "Document 4's point of view reveals grassroots anger rather than technocratic reform." },
        bodyParagraph3: { claim: "Post-recession anger helped harden the electoral map that produced Trump.", documentsUsed: [3, 6], outsideEvidence: "Tea Party, anti-establishment populism, 2016 campaign", happ: "Document 6's historical situation connects recovery frustration to partisan geography." },
        complexity: "Argue that the recession intensified polarization because it fused economic grievance to earlier identity and culture-war divisions."
      }
    }
  ],
  timeline: [
    { year: 2005, title: "Hurricane Katrina", summary: "Hurricane Katrina devastated the Gulf Coast in 2005. The disaster exposed racial inequality, weak state response, and the political costs of governmental failure.", fullDescription: "When Katrina struck in 2005, levee failures and broken response systems left many New Orleans residents stranded and vulnerable. Television coverage made the suffering impossible to ignore. The disaster exposed how poverty, race, and infrastructure shaped who bore the greatest risks. It also damaged public confidence in the Bush administration. Katrina became a lasting symbol of the state's failure to protect equal citizenship. In APUSH, it links geography and environment to politics and race.", categories: ["Political", "Social", "Geography"], apThemes: [THEME.politics, THEME.identity, THEME.geography], keyFigures: ["George W. Bush"], causes: ["Storm vulnerability", "Weak disaster preparedness"], effects: ["Bush's standing declined", "Inequality became more visible"], significance: "High", apPriority: true, essayRelevance: "Useful for linking environmental crisis to inequality and state capacity.", commonMisconception: "Katrina was not only a natural disaster; it became a political and racial crisis.", imageId: "chapter28-img-001" },
    { year: 2006, title: "Immigration Demonstrations", summary: "Mass immigration demonstrations reflected the growing political power of Latino communities. They showed that citizenship and border policy had become central national issues.", fullDescription: "Large immigration demonstrations in the mid-2000s responded to restrictive legislation and enforcement proposals. Protesters asserted the dignity and political visibility of immigrants and their families. The marches helped show that post-1965 immigration had transformed the national electorate. They also intensified conservative backlash. Immigration thus became both a rights claim and a partisan dividing line. This event is important evidence for modern identity politics.", categories: ["Political", "Social"], apThemes: [THEME.identity, THEME.politics], keyFigures: [], causes: ["Restrictive immigration proposals", "Demographic change"], effects: ["Immigrant political mobilization grew", "Backlash intensified"], significance: "Medium", apPriority: true, essayRelevance: "Useful for citizenship and identity questions.", commonMisconception: "Immigration politics involved both restriction and mass democratic mobilization." },
    { year: 2007, title: "Housing Bubble Bursts", summary: "The housing market began to collapse in 2007. The downturn exposed the fragility of a debt-fueled economy.", fullDescription: "Housing values stopped rising, mortgage defaults spread, and complex financial products tied to home loans began to fail. The broader significance of the housing crash quickly became clear because so much borrowing and investment had been tied to real estate. The collapse hurt homeowners, banks, and entire communities. It also revealed how much apparent prosperity had depended on speculation and easy credit. By 2008, the problem had become a systemic crisis. For APUSH, the burst housing bubble is the essential first step in the Great Recession.", categories: ["Economic"], apThemes: [THEME.work], keyFigures: [], causes: ["Speculative lending", "Low interest rates", "Financial deregulation"], effects: ["Defaults spread", "Financial panic intensified"], significance: "High", apPriority: true, essayRelevance: "A clear causal starting point for the recession.", commonMisconception: "The crisis did not begin only when banks failed in 2008; the housing market had already started collapsing." },
    { year: 2008, title: "Financial Crisis Peaks", summary: "The American financial system neared collapse in 2008. The crisis led to emergency rescue measures and widespread public anger.", fullDescription: "As mortgage-backed securities lost value, major financial institutions faced insolvency. The federal government responded with emergency programs such as TARP to stabilize the system. While policymakers feared a complete financial collapse, many Americans saw the rescues as proof that elites would be protected first. The crisis drove the economy into severe recession and made unemployment soar. It also discredited many assumptions about deregulated markets. In APUSH, 2008 is the central economic turning point of contemporary politics.", categories: ["Economic", "Political"], apThemes: [THEME.work, THEME.politics], keyFigures: ["George W. Bush"], causes: ["Housing collapse", "Speculative finance"], effects: ["Bailouts", "Recession deepened", "Public distrust grew"], significance: "High", apPriority: true, essayRelevance: "Essential for essays on the recession and the role of government.", commonMisconception: "The bailout stabilized finance but did not resolve wider inequality or public anger.", imageId: "chapter28-img-002" },
    { year: 2008, title: "Barack Obama Elected", summary: "Barack Obama won the presidency in 2008. His election symbolized demographic change and hopes for a new reform era.", fullDescription: "Obama's victory came amid war fatigue and financial panic. As the first African American president, he represented a major symbolic turning point in the history of citizenship and political inclusion. Supporters saw his election as evidence that the nation might move beyond some of its older racial limits. Yet his presidency also unfolded within a deeply unequal and polarized political order. The hopes attached to his win were therefore matched by strong backlash. The event marks both change and continuity in modern American politics.", categories: ["Political", "Social"], apThemes: [THEME.identity, THEME.politics], keyFigures: ["Barack Obama"], causes: ["Bush fatigue", "Recession", "Democratic mobilization"], effects: ["Stimulus politics", "Symbolic breakthrough", "Backlash intensified"], significance: "High", apPriority: true, essayRelevance: "Useful for rights, identity, and reform comparisons.", commonMisconception: "Obama's election had great symbolic significance but did not erase structural racial inequality.", imageId: "chapter28-img-003" },
    { year: 2009, title: "Stimulus Package Passed", summary: "Obama secured a major stimulus package in 2009. The law marked a renewed federal effort to fight recession through activist government.", fullDescription: "Facing economic free fall, Obama's administration promoted a package of spending and tax cuts worth nearly $800 billion. The stimulus recalled earlier reform eras that treated government as a positive instrument for recovery. Supporters argued it was necessary to prevent a worse collapse, while critics said it enlarged federal power too much. The law became a touchstone in debates over deficit spending and state responsibility. It also helped define the ideological clash of the Obama years. For APUSH, the stimulus is essential evidence for the return of activist government.", categories: ["Political", "Economic"], apThemes: [THEME.work, THEME.politics], keyFigures: ["Barack Obama"], causes: ["Great Recession", "Fear of deeper economic collapse"], effects: ["Federal spending expanded", "Backlash to government intervention"], significance: "High", apPriority: true, essayRelevance: "Key evidence for the role of government after 2008.", commonMisconception: "The stimulus was contested as soon as it passed; it did not create a stable new consensus." },
    { year: 2010, title: "Affordable Care Act Signed", summary: "Obama signed the Affordable Care Act in 2010. The law became the signature domestic reform of his presidency and a central target of conservative backlash.", fullDescription: "The Affordable Care Act attempted to widen insurance coverage and regulate parts of the health-care system. Its supporters treated health security as part of modern freedom, while its opponents saw the law as an overreach of federal power. The intense debate over the act helped energize the Tea Party. Repeal efforts and court battles continued for years. The ACA became one of the clearest dividing lines in twenty-first-century politics. In APUSH, it stands beside the New Deal and Great Society as a major reform benchmark.", categories: ["Political", "Social"], apThemes: [THEME.politics, THEME.identity], keyFigures: ["Barack Obama"], causes: ["Reform agenda after the recession", "Long-term pressure over medical costs and access"], effects: ["Coverage expanded", "Partisan conflict sharpened"], significance: "High", apPriority: true, essayRelevance: "Important for comparing reform eras and debates over government.", commonMisconception: "The ACA expanded regulation and coverage, but it did not create a fully government-run health system." },
    { year: 2010, title: "Tea Party Ascends", summary: "Tea Party activism reshaped the Republican Party in the early Obama years. The movement linked anti-tax politics to a broader attack on federal reform.", fullDescription: "The Tea Party grew out of conservative anger over stimulus spending, taxes, and health-care reform. Its activists treated federal expansion as a threat to liberty and constitutional order. Republican leaders increasingly had to respond to this grassroots pressure. The movement accelerated confrontation and reduced the space for compromise. It also laid groundwork for later anti-establishment populism. In APUSH, the Tea Party is a major sign that the recession intensified polarization rather than consensus.", categories: ["Political"], apThemes: [THEME.politics], keyFigures: [], causes: ["Stimulus backlash", "Opposition to ACA", "Anti-government ideology"], effects: ["Republican Party moved rightward", "Polarization deepened"], significance: "High", apPriority: true, essayRelevance: "Strong evidence for post-2008 polarization.", commonMisconception: "The Tea Party was not simply spontaneous anger; it became an organized force inside Republican politics.", imageId: "chapter28-img-008" },
    { year: 2010, title: "Deepwater Horizon Spill", summary: "The Deepwater Horizon oil spill in 2010 became a major environmental disaster. The spill intensified debate over regulation, energy, and corporate risk.", fullDescription: "When the Deepwater Horizon rig exploded in the Gulf of Mexico, oil poured into the water for months. The disaster damaged wildlife, tourism, and local livelihoods. It also exposed the risks of deregulation and the politics of fossil-fuel dependence. Obama faced pressure to manage both the environmental crisis and the economic consequences. The spill turned environmental policy into another partisan conflict. In APUSH, it links energy, regulation, and the costs of growth.", categories: ["Geography", "Economic", "Political"], apThemes: [THEME.geography, THEME.work, THEME.politics], keyFigures: ["Barack Obama"], causes: ["Offshore drilling risk", "Weak oversight"], effects: ["Environmental damage", "Regulatory debate intensified"], significance: "Medium", apPriority: true, essayRelevance: "Useful for environment and regulation arguments.", commonMisconception: "The spill was not only an environmental story; it also exposed political conflict over regulation.", imageId: "chapter28-img-006" },
    { year: 2011, title: "Osama bin Laden Killed", summary: "American forces killed Osama bin Laden in 2011. The operation gave Obama a major symbolic victory in the War on Terror.", fullDescription: "The raid that killed bin Laden in Pakistan became one of the signature foreign-policy moments of Obama's presidency. It seemed to deliver justice for September 11 and showed continuity in the national-security state's global reach. Yet it did not end drone warfare, surveillance, or the wider War on Terror. The operation therefore combined closure with continuity. It also temporarily strengthened Obama's standing on foreign policy. For APUSH, it demonstrates how the legacy of 9/11 still shaped politics years later.", categories: ["Military", "Political"], apThemes: [THEME.world, THEME.politics], keyFigures: ["Barack Obama", "Osama bin Laden"], causes: ["Long War on Terror pursuit", "U.S. intelligence operations"], effects: ["Obama gained a major symbolic victory", "War on Terror structures remained"], significance: "High", apPriority: true, essayRelevance: "Useful for continuity and change in national-security policy.", commonMisconception: "Killing bin Laden did not end the War on Terror.", imageId: "chapter28-img-007" },
    { year: 2011, title: "Occupy Wall Street Emerges", summary: "Occupy Wall Street protested inequality and elite power in 2011. The movement made the language of the 99 percent central to national debate.", fullDescription: "Occupy activists responded to bailout anger and unequal recovery by naming concentrated wealth as the central problem of American democracy. Their slogans, encampments, and direct-action style gave inequality a memorable political vocabulary. Even though the movement lacked unified leadership, it succeeded in shifting public conversation. It also showed that mass protest remained a major political tool in the twenty-first century. For APUSH, Occupy is essential evidence that the recession transformed class politics. It belongs in essays about inequality, freedom, and protest.", categories: ["Political", "Economic"], apThemes: [THEME.work, THEME.politics], keyFigures: [], causes: ["Great Recession", "Bailout anger", "Income concentration"], effects: ["Inequality became more central to politics", "Class protest intensified"], significance: "High", apPriority: true, essayRelevance: "Powerful evidence for inequality becoming a political issue.", commonMisconception: "Occupy mattered politically even without becoming a conventional party or electoral movement.", imageId: "chapter28-img-004" },
    { year: 2015, title: "Obergefell v. Hodges", summary: "The Supreme Court established a constitutional right to same-sex marriage in 2015. The decision extended the rights revolution into a new domain of citizenship and family.", fullDescription: "In Obergefell v. Hodges, the Supreme Court held that the Fourteenth Amendment protected same-sex marriage. The ruling reflected years of activism and a rapid shift in public opinion. It also showed that constitutional freedom remained an expanding category in modern America. Supporters celebrated the decision as a major civil-rights victory, while opponents treated it as judicial overreach. The case became one of the defining rights landmarks of the Obama era. It provides excellent comparison material with earlier rights decisions in APUSH.", categories: ["Political", "Social"], apThemes: [THEME.identity, THEME.politics], keyFigures: ["Supreme Court"], causes: ["Gay rights activism", "Changing public opinion"], effects: ["Marriage equality nationwide", "Culture-war conflict continued"], significance: "High", apPriority: true, essayRelevance: "Essential for the continuing rights revolution.", commonMisconception: "Marriage equality did not end wider conflicts over sexuality and religious liberty." },
    { year: 2013, title: "Black Lives Matter Begins", summary: "Black Lives Matter emerged in the 2010s to protest police violence and systemic racial inequality. The movement carried civil-rights politics into a new era of decentralized activism.", fullDescription: "Black Lives Matter arose from outrage over police killings and the sense that formal equality had not ended structural racism. The movement used protests, social media, and a flexible organizing model to force national attention. It connected police violence to broader patterns of housing, wealth, and incarceration. Critics disputed its methods and message, but it changed national debate. The movement showed both continuity with and change from the older civil-rights era. In APUSH, it is indispensable evidence for modern racial politics.", categories: ["Political", "Social"], apThemes: [THEME.identity, THEME.politics], keyFigures: [], causes: ["Police violence", "Persistent racial inequality"], effects: ["National debate over systemic racism", "New protest wave"], significance: "High", apPriority: true, essayRelevance: "Important for comparing civil-rights eras.", commonMisconception: "Black Lives Matter built on, rather than simply repeated, earlier civil-rights activism." },
    { year: 2016, title: "Donald Trump Elected", summary: "Donald Trump won the presidency in 2016. His victory revealed the strength of anti-establishment populism, nativism, and political polarization.", fullDescription: "Trump defeated Hillary Clinton in one of the most contentious elections in modern history. He appealed to voters angry about immigration, trade, elites, and cultural change. Clinton represented experience and establishment politics but struggled to turn that into electoral enthusiasm. The result confirmed that the Obama years had not softened polarization. It also suggested that the recession's political aftershocks had not disappeared. For APUSH, Trump's election is a major turning point in modern political identity.", categories: ["Political"], apThemes: [THEME.politics, THEME.identity], keyFigures: ["Donald Trump", "Hillary Clinton"], causes: ["Anti-establishment anger", "Immigration conflict", "Polarized geography"], effects: ["Trump presidency began", "Resistance movements surged"], significance: "High", apPriority: true, essayRelevance: "Key evidence for post-recession and post-Obama realignment.", commonMisconception: "Trump's victory reflected both economic and cultural grievance, not just one or the other.", imageId: "chapter28-img-009" },
    { year: 2017, title: "Women's Marches", summary: "The Women's Marches of 2017 became one of the largest protest mobilizations in U.S. history. They signaled immediate organized resistance to Trump's presidency.", fullDescription: "The day after Trump's inauguration, enormous crowds marched in Washington and cities across the country. Participants linked gender equality to immigration, race, health care, and democratic norms. The marches showed that protest remained a central feature of political participation. They also revealed how opposition to Trump quickly built coalitions across movements. In APUSH, the Women's Marches demonstrate the persistence of rights-based protest into the present. They are useful for comparison with earlier feminist and civil-rights mobilizations.", categories: ["Political", "Social"], apThemes: [THEME.identity, THEME.politics], keyFigures: [], causes: ["Trump's election", "Gender and rights backlash"], effects: ["Resistance movements gained momentum", "Protest politics intensified"], significance: "Medium", apPriority: true, essayRelevance: "Useful for protest and rights comparisons.", commonMisconception: "The marches were not about a single issue; they unified many grievances.", imageId: "chapter28-img-012" },
    { year: 2017, title: "Charlottesville Violence", summary: "White supremacists and counterprotesters clashed in Charlottesville in 2017. The conflict made historical memory, race, and public symbolism central political flashpoints.", fullDescription: "A rally against the removal of a Confederate monument in Charlottesville, Virginia, drew white supremacists, neo-Nazis, and armed counterprotesters. Violence culminated in murder and national outrage. The event showed that battles over monuments and memory were also battles over race and citizenship. It deepened debate over Trump's response and the state of American democracy. Charlottesville made visible the persistence of white supremacist politics. In APUSH, it is a crucial example of how history itself became politically contested terrain.", categories: ["Political", "Social", "Cultural"], apThemes: [THEME.identity, THEME.culture, THEME.politics], keyFigures: ["Donald Trump"], causes: ["Monument controversy", "White supremacist mobilization"], effects: ["National debate over history intensified", "Trump criticism deepened"], significance: "High", apPriority: true, essayRelevance: "Excellent evidence for memory politics and racial conflict.", commonMisconception: "Charlottesville was not only about statues; it exposed deeper struggles over national identity.", imageId: "chapter28-img-013" }
  ],
  conceptCards: [
    { type: "Concept", front: "Great Recession", back: "The financial and economic crisis that began in 2007-2008 and exposed the weakness of debt-fueled, deregulated growth.", hint: "Bubble bursts, system shakes.", difficulty: "Medium" },
    { type: "Cause-Effect", front: "Great Recession -> Polarization", back: "Economic collapse, bailout anger, and unequal recovery helped fuel the Tea Party, Occupy, and the anti-establishment politics that shaped the 2010s.", hint: "Crash becomes politics.", difficulty: "Medium" },
    { type: "Document", front: "Obergefell v. Hodges", back: "The 2015 Supreme Court decision that recognized same-sex marriage as a constitutional right under the Fourteenth Amendment.", hint: "Marriage equality case.", difficulty: "Hard" },
    { type: "Concept", front: "Trumpism", back: "A style of nationalist, anti-establishment politics centered on immigration restriction, executive confrontation, grievance, and populist spectacle.", hint: "Populism plus nativism.", difficulty: "Medium" }
  ]
};

function main() {
  const rewritten = [];

  for (const chapterNum of [23, 24, 25, 26]) {
    const data = rewriteLegacyChapter(chapterNum);
    rewritten.push(data.chapterId);
  }

  const newChapters = [buildChapterFromSpec(chapter27Spec), buildChapterFromSpec(chapter28Spec)];
  newChapters.forEach(writeChapterData);

  console.log(`Reworked chapters: ${[...rewritten, ...newChapters.map((chapter) => chapter.chapterId)].join(", ")}`);
}

main();
