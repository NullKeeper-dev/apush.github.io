const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const MANIFEST_FILE = path.join(ROOT, "chapter-manifest.js");
const LETTERS = ["A", "B", "C", "D"];
const QUESTION_THRESHOLD_RATIO = 0.6;

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "because", "been", "before", "by", "did", "do", "does",
  "for", "from", "had", "has", "have", "in", "into", "is", "it", "its", "most", "not", "of", "on",
  "or", "that", "the", "their", "them", "these", "they", "this", "those", "through", "to", "was",
  "were", "which", "while", "with", "would", "after", "during", "about", "across", "among", "best",
  "broader", "claim", "contributed", "development", "directly", "evidence", "explain", "explains",
  "following", "historian", "historical", "likely", "most", "question", "significance", "studying",
  "support", "supported", "trend", "what", "when", "where", "why"
]);

const loadWindowContext = (files) => {
  const context = { window: {} };
  vm.createContext(context);

  files.forEach((file) => {
    const source = fs.readFileSync(file, "utf8");
    vm.runInContext(source, context, { filename: file });
  });

  return context.window;
};

const normalizeText = (value) => String(value || "")
  .replace(/[\u0000-\u001f\u007f\u00a0\u2028\u2029]+/g, " ")
  .replace(/\s+/g, " ")
  .replace(/\s+([,.;:!?])/g, "$1")
  .trim();

const normalizeKey = (value) => normalizeText(value)
  .replace(/[“”]/g, "\"")
  .replace(/[‘’]/g, "'")
  .replace(/[.,;:!?]+$/g, "")
  .toLowerCase();

const extractKeywords = (...values) => {
  const tokens = values
    .map((value) => normalizeText(value).toLowerCase())
    .join(" ")
    .match(/[a-z][a-z'-]{2,}/g) || [];

  return new Set(tokens.filter((token) => !STOP_WORDS.has(token)));
};

const sharedCount = (left, right) => {
  let count = 0;
  left.forEach((token) => {
    if (right.has(token)) {
      count += 1;
    }
  });
  return count;
};

const jaccard = (left, right) => {
  const union = new Set([...left, ...right]);
  if (!union.size) {
    return 0;
  }

  return sharedCount(left, right) / union.size;
};

const countOptionFrequency = (questions = []) => {
  const counts = new Map();

  questions.forEach((question) => {
    Object.values(question.options || {}).forEach((optionText) => {
      const key = normalizeKey(optionText);
      if (!key) {
        return;
      }

      counts.set(key, {
        text: normalizeText(optionText),
        count: (counts.get(key)?.count || 0) + 1
      });
    });
  });

  return counts;
};

const needsDistractorRepair = (questions = []) => {
  if (questions.length < 4) {
    return false;
  }

  const threshold = Math.max(6, Math.ceil(questions.length * QUESTION_THRESHOLD_RATIO));
  const overused = Array.from(countOptionFrequency(questions).values())
    .filter((entry) => entry.count >= threshold)
    .sort((left, right) => right.count - left.count);

  return overused.length >= 3;
};

const buildQuestionRecords = (questions = []) => questions.map((question, index) => {
  const correctText = normalizeText(question.options?.[question.correctAnswer] || "");
  const correctKeywords = extractKeywords(correctText);
  const topicTag = normalizeText(question.topicTag || "");

  return {
    original: question,
    index,
    questionText: normalizeText(question.question || ""),
    correctText,
    correctKey: normalizeKey(correctText),
    apTheme: normalizeText(question.apTheme || ""),
    apSkill: normalizeText(question.apSkill || ""),
    topicTag,
    topicKey: normalizeKey(topicTag),
    questionKeywords: extractKeywords(
      question.question,
      question.stimulusText,
      question.stimulusCaption,
      question.explanation?.correct
    ),
    correctKeywords
  };
});

const buildCandidatePool = (records = []) => {
  const grouped = new Map();

  records.forEach((record) => {
    if (!record.correctKey) {
      return;
    }

    if (!grouped.has(record.correctKey)) {
      grouped.set(record.correctKey, {
        key: record.correctKey,
        text: record.correctText,
        themes: new Set(),
        skills: new Set(),
        topicKeys: new Set(),
        keywords: new Set(),
        sourceIndexes: []
      });
    }

    const candidate = grouped.get(record.correctKey);
    if (record.apTheme) {
      candidate.themes.add(record.apTheme);
    }
    if (record.apSkill) {
      candidate.skills.add(record.apSkill);
    }
    if (record.topicKey) {
      candidate.topicKeys.add(record.topicKey);
    }
    record.questionKeywords.forEach((token) => candidate.keywords.add(token));
    record.correctKeywords.forEach((token) => candidate.keywords.add(token));
    candidate.sourceIndexes.push(record.index);
  });

  return Array.from(grouped.values()).map((candidate) => ({
    ...candidate,
    averageIndex: candidate.sourceIndexes.reduce((sum, value) => sum + value, 0) / candidate.sourceIndexes.length
  }));
};

const scoreCandidate = (record, candidate, reuseCount) => {
  if (!candidate?.key || candidate.key === record.correctKey) {
    return Number.NEGATIVE_INFINITY;
  }

  if (record.topicKey && candidate.topicKeys.has(record.topicKey)) {
    return Number.NEGATIVE_INFINITY;
  }

  const overlapWithPrompt = sharedCount(record.questionKeywords, candidate.keywords);
  const overlapWithCorrect = sharedCount(record.correctKeywords, candidate.keywords);
  const similarityToCorrect = jaccard(record.correctKeywords, candidate.keywords);

  if (similarityToCorrect >= 0.4 || overlapWithCorrect >= 4) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = 0;

  if (record.apTheme && candidate.themes.has(record.apTheme)) {
    score += 14;
  }

  if (record.apSkill && candidate.skills.has(record.apSkill)) {
    score += 7;
  }

  score += overlapWithPrompt * 4;
  score += Math.min(overlapWithCorrect, 2);

  const lengthRatio = candidate.text.length / Math.max(record.correctText.length, 1);
  if (lengthRatio >= 0.65 && lengthRatio <= 1.6) {
    score += 2;
  }

  score -= (reuseCount.get(candidate.key) || 0) * 3;
  score -= Math.abs(candidate.averageIndex - record.index) * 0.05;

  return score;
};

const pickDistractors = (records = []) => {
  const candidates = buildCandidatePool(records);
  const reuseCount = new Map();

  return records.map((record) => {
    const ranked = candidates
      .map((candidate) => ({
        candidate,
        score: scoreCandidate(record, candidate, reuseCount)
      }))
      .filter((entry) => Number.isFinite(entry.score))
      .sort((left, right) => (
        right.score - left.score
        || (reuseCount.get(left.candidate.key) || 0) - (reuseCount.get(right.candidate.key) || 0)
        || left.candidate.text.localeCompare(right.candidate.text)
      ));

    const chosen = [];
    for (const entry of ranked) {
      if (chosen.length >= 3) {
        break;
      }

      if (chosen.some((item) => item.key === entry.candidate.key)) {
        continue;
      }

      chosen.push(entry.candidate);
      reuseCount.set(entry.candidate.key, (reuseCount.get(entry.candidate.key) || 0) + 1);
    }

    if (chosen.length < 3) {
      const fallback = candidates
        .filter((candidate) => candidate.key !== record.correctKey && !chosen.some((item) => item.key === candidate.key))
        .sort((left, right) => (
          (reuseCount.get(left.key) || 0) - (reuseCount.get(right.key) || 0)
          || left.text.localeCompare(right.text)
        ));

      while (chosen.length < 3 && fallback.length) {
        const candidate = fallback.shift();
        chosen.push(candidate);
        reuseCount.set(candidate.key, (reuseCount.get(candidate.key) || 0) + 1);
      }
    }

    return chosen.map((candidate) => candidate.text);
  });
};

const repairQuestions = (questions = []) => {
  const records = buildQuestionRecords(questions);
  const distractorsByQuestion = pickDistractors(records);

  return records.map((record, index) => {
    const correctSlot = LETTERS[index % LETTERS.length];
    const distractors = distractorsByQuestion[index];
    const options = {};
    let distractorIndex = 0;

    LETTERS.forEach((letter) => {
      if (letter === correctSlot) {
        options[letter] = record.correctText;
        return;
      }

      options[letter] = distractors[distractorIndex];
      distractorIndex += 1;
    });

    return {
      ...record.original,
      options,
      correctAnswer: correctSlot
    };
  });
};

const escapeTemplateLiteral = (value) => String(value)
  .replace(/`/g, "\\`")
  .replace(/\$\{/g, "\\${");

const serializeChapterAssignment = (globalName, data) => {
  const payload = escapeTemplateLiteral(JSON.stringify(data, null, 2));
  return `window.${globalName} = JSON.parse(String.raw\`${payload}\`);\n`;
};

const manifestWindow = loadWindowContext([MANIFEST_FILE]);
const manifest = Array.isArray(manifestWindow.chapterManifest) ? manifestWindow.chapterManifest : [];
const chapterFiles = Array.from(new Set(manifest.map((entry) => path.join(ROOT, entry.script))));
const chapterWindow = loadWindowContext(chapterFiles);

const chapterOutputs = [];
const repairSummary = [];

manifest.forEach((entry) => {
  const data = chapterWindow[entry.global];
  if (!data?.mcqQuestions?.length) {
    return;
  }

  const beforeNeedsRepair = needsDistractorRepair(data.mcqQuestions);
  const repairedQuestions = beforeNeedsRepair ? repairQuestions(data.mcqQuestions) : data.mcqQuestions;
  const updatedData = {
    ...data,
    mcqQuestions: repairedQuestions
  };

  chapterOutputs.push({
    script: entry.script,
    global: entry.global,
    data: updatedData,
    repaired: beforeNeedsRepair
  });

  const topBefore = Array.from(countOptionFrequency(data.mcqQuestions).values())
    .sort((left, right) => right.count - left.count)
    .slice(0, 3)
    .map((entryValue) => `${entryValue.count}x ${entryValue.text}`);

  const topAfter = Array.from(countOptionFrequency(repairedQuestions).values())
    .sort((left, right) => right.count - left.count)
    .slice(0, 3)
    .map((entryValue) => `${entryValue.count}x ${entryValue.text}`);

  repairSummary.push({
    id: entry.id,
    repaired: beforeNeedsRepair,
    beforeTop: topBefore,
    afterTop: topAfter
  });
});

const scriptsNeedingWrite = new Set(
  chapterOutputs.filter((entry) => entry.repaired).map((entry) => entry.script)
);

scriptsNeedingWrite.forEach((scriptPath) => {
  const entries = chapterOutputs.filter((entry) => entry.script === scriptPath);
  const output = entries
    .map((entry) => serializeChapterAssignment(entry.global, entry.data))
    .join("\n");

  fs.writeFileSync(path.join(ROOT, scriptPath), output);
});

repairSummary.forEach((entry) => {
  console.log(`${entry.id}: ${entry.repaired ? "repaired" : "unchanged"}`);
  console.log(`  before: ${entry.beforeTop.join(" | ")}`);
  console.log(`  after: ${entry.afterTop.join(" | ")}`);
});
