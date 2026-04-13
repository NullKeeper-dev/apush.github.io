(window.chapterDataReady || Promise.resolve()).then(() => {
const chapterConfigs = (window.getChapterConfigs ? window.getChapterConfigs() : [])
  .map(({ id, short, data }) => ({ id, short, data }))
  .filter((entry) => entry.data?.chapterMeta);

const periodMeta = chapterConfigs.map(({ id, short, data }) => ({
  id,
  short,
  label: data.chapterMeta.dateRange || "1890-1945",
  title: data.chapterMeta.chapterTitle || short
}));

const mcqBank = [];

const flashcardBank = [];

const essaySteps = [
  { key: "thesis", title: "Thesis", description: "Make a defensible argument." },
  { key: "context", title: "Contextualization", description: "Set up what came before." },
  { key: "evidence", title: "Evidence", description: "Pull in specifics and documents." },
  { key: "analysis", title: "Analysis", description: "Explain how the evidence works." },
  { key: "preview", title: "Preview", description: "See the outline you built." }
];

const essayPrompts = [];

const extractKeywords = (text) => {
  const stopWords = new Set(["the", "and", "that", "with", "from", "into", "through", "which", "many", "would", "during", "after", "this", "these", "those", "answer", "briefly", "explain", "evaluate", "extent"]);
  const matches = String(text || "").toLowerCase().match(/[a-z][a-z'-]{2,}/g) || [];
  return Array.from(new Set(matches.filter((word) => !stopWords.has(word)))).slice(0, 6);
};

const buildPromptTitle = (prompt, fallback) => {
  const cleaned = String(prompt || "").replace(/^Answer a, b, and c\.\s*/i, "").trim();
  if (!cleaned) {
    return fallback;
  }

  return cleaned.length > 72 ? `${cleaned.slice(0, 69).trim()}...` : cleaned;
};

const buildLeqEvidencePrompt = (paragraph) => `Claim: ${paragraph.claim || ""} Evidence: ${(paragraph.evidence || []).join(", ")}`;

const buildEssayPrompts = (chapterId, chapter) => {
  const saqs = (chapter.essayPractice?.saq || []).map((item, index) => ({
    id: `${chapterId}-${item.id}`,
    period: chapterId,
    type: "SAQ",
    title: buildPromptTitle(item.prompt, `SAQ ${index + 1}`),
    text: item.prompt,
    keywords: extractKeywords(item.prompt),
    contextHints: Object.values(item.scoringGuidance || {}),
    evidencePrompts: [item.partA, item.partB, item.partC].filter(Boolean)
  }));

  const leqs = (chapter.essayPractice?.leq || []).map((item, index) => ({
    id: `${chapterId}-${item.id}`,
    period: chapterId,
    type: "LEQ",
    title: buildPromptTitle(item.prompt, `LEQ ${index + 1}`),
    text: item.prompt,
    keywords: extractKeywords(item.prompt),
    contextHints: [
      item.outlineScaffold?.contextualization,
      item.outlineScaffold?.complexity,
      `${item.recommendedArgument} is a strong structure for this prompt.`
    ].filter(Boolean),
    evidencePrompts: [
      buildLeqEvidencePrompt(item.outlineScaffold?.bodyParagraph1 || { claim: "", evidence: [] }),
      buildLeqEvidencePrompt(item.outlineScaffold?.bodyParagraph2 || { claim: "", evidence: [] }),
      buildLeqEvidencePrompt(item.outlineScaffold?.bodyParagraph3 || { claim: "", evidence: [] })
    ]
  }));

  const dbqs = (chapter.essayPractice?.dbq || []).map((item, index) => ({
    id: `${chapterId}-${item.id}`,
    period: chapterId,
    type: "DBQ",
    title: buildPromptTitle(item.prompt, `DBQ ${index + 1}`),
    text: item.prompt,
    keywords: extractKeywords(item.prompt),
    contextHints: [
      item.outlineScaffold?.contextualization,
      item.outlineScaffold?.complexity,
      item.thesisExample
    ].filter(Boolean),
    docs: (item.documents || []).map((doc) => ({
      id: `doc-${doc.docNumber}`,
      title: `Doc ${doc.docNumber} · ${doc.title}`,
      use: doc.excerpt,
      lens: doc.happ?.purpose || doc.happ?.pointOfView || doc.source
    }))
  }));

  return [...saqs, ...leqs, ...dbqs];
};

chapterConfigs.forEach(({ id, data }) => {
  (data.mcqQuestions || []).forEach((item) => {
    mcqBank.push({
      id: `${id}-${item.id}`,
      period: id,
      theme: item.apTheme,
      skill: item.apSkill,
      difficulty: item.difficulty,
      stimulus: item.stimulus,
      question: item.question,
      options: ["A", "B", "C", "D"].map((letter) => item.options[letter]),
      answer: ({ A: 0, B: 1, C: 2, D: 3 })[item.correctAnswer] ?? 0,
      explanation: item.explanation?.correct || ""
    });
  });

  (data.flashcards || []).forEach((card) => {
    flashcardBank.push({
      id: `${id}-${card.id}`,
      period: id,
      kind: card.type,
      front: card.front,
      cue: card.hint,
      back: card.back
    });
  });

  essayPrompts.push(...buildEssayPrompts(id, data));
});

const toolTabs = Array.from(document.querySelectorAll("[data-tool-tab]"));
const toolPanels = Array.from(document.querySelectorAll("[data-tool-panel]"));
const toolTabsWrap = document.getElementById("tool-tabs");
const tabIndicator = document.getElementById("tab-indicator");

const quizPeriodChips = document.getElementById("quiz-period-chips");
const quizCountChips = document.getElementById("quiz-count-chips");
const quizAvailability = document.getElementById("quiz-availability");
const quizStage = document.getElementById("quiz-stage");
const quizStartButton = document.getElementById("quiz-start");
const quizResetButton = document.getElementById("quiz-reset");

const flashcardDecks = document.getElementById("flashcard-decks");
const flashcard = document.getElementById("flashcard");
const flashcardDrag = document.getElementById("flashcard-drag");
const flashcardFrontTitle = document.getElementById("flashcard-front-title");
const flashcardFrontCopy = document.getElementById("flashcard-front-copy");
const flashcardBackTitle = document.getElementById("flashcard-back-title");
const flashcardBackCopy = document.getElementById("flashcard-back-copy");
const flashcardPeriodBadge = document.getElementById("flashcard-period-badge");
const flashcardBackType = document.getElementById("flashcard-back-type");
const flashcardKnownButton = document.getElementById("flashcard-known");
const flashcardUnknownButton = document.getElementById("flashcard-unknown");
const flashcardResetButton = document.getElementById("flashcard-reset");
const flashcardKnownCount = document.getElementById("flashcard-known-count");
const flashcardUnknownCount = document.getElementById("flashcard-unknown-count");
const flashcardReviewedCount = document.getElementById("flashcard-reviewed-count");
const donutKnown = document.getElementById("donut-known");
const donutUnknown = document.getElementById("donut-unknown");

const essayPromptSelect = document.getElementById("essay-prompt-select");
const essayPromptMeta = document.getElementById("essay-prompt-meta");
const essayStepList = document.getElementById("essay-step-list");
const essayStepPanel = document.getElementById("essay-step-panel");
const essayPrevButton = document.getElementById("essay-prev");
const essayNextButton = document.getElementById("essay-next");
const heroTitle = document.getElementById("practice-hero-title");
const heroSubtitle = document.getElementById("practice-hero-subtitle");
const heroMcqCount = document.getElementById("practice-hero-mcq-count");
const heroFlashcardCount = document.getElementById("practice-hero-flashcard-count");
const heroEssayCount = document.getElementById("practice-hero-essay-count");

const state = {
  activeTool: "mcq",
  quiz: {
    selectedPeriods: new Set(periodMeta.map((period) => period.id)),
    targetCount: 10,
    session: null
  },
  flashcards: {
    deck: "all",
    order: [],
    index: 0,
    flipped: false,
    known: 0,
    unknown: 0,
    reviewed: 0,
    isAnimating: false,
    drag: {
      active: false,
      pointerId: null,
      startX: 0,
      deltaX: 0,
      suppressClick: false
    }
  },
  essay: {
    promptId: essayPrompts[0]?.id || null,
    step: 0,
    drafts: {}
  }
};

const escapeHtml = (value) => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const shuffle = (items) => {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
};

const getPeriodMeta = (periodId) => periodMeta.find((period) => period.id === periodId) || {
  id: periodId,
  short: periodId,
  label: "",
  title: periodId
};

const updateHero = () => {
  if (heroTitle) {
    heroTitle.textContent = chapterConfigs.length === 1
      ? `Train recall, timing, and argument for ${periodMeta[0]?.short}.`
      : "Train recall, timing, and argument across the live chapters.";
  }

  if (heroSubtitle) {
    heroSubtitle.textContent = `Use the integrated chapter bank three ways: quiz it under pressure, drill it into memory, then turn it into thesis-driven writing across ${chapterConfigs.length} live chapter${chapterConfigs.length === 1 ? "" : "s"}.`;
  }

  if (heroMcqCount) {
    heroMcqCount.textContent = String(mcqBank.length);
  }

  if (heroFlashcardCount) {
    heroFlashcardCount.textContent = String(flashcardBank.length);
  }

  if (heroEssayCount) {
    heroEssayCount.textContent = String(essayPrompts.length);
  }
};
const getToolFromLocation = () => {
  const searchTool = new URLSearchParams(window.location.search).get("tool");
  if (["mcq", "flashcards", "essay"].includes(searchTool)) {
    return searchTool;
  }

  const hash = window.location.hash.replace("#", "").trim();
  return ["mcq", "flashcards", "essay"].includes(hash) ? hash : null;
};

const updateTabIndicator = () => {
  const activeTab = toolTabs.find((tab) => tab.dataset.toolTab === state.activeTool);

  if (!activeTab) {
    return;
  }

  const activeRect = activeTab.getBoundingClientRect();
  const wrapRect = toolTabsWrap.getBoundingClientRect();
  tabIndicator.style.width = `${activeRect.width}px`;
  tabIndicator.style.transform = `translateX(${activeRect.left - wrapRect.left}px)`;
};

const setActiveTool = (toolId, options = {}) => {
  const { updateLocation = true } = options;
  state.activeTool = toolId;

  toolTabs.forEach((tab) => {
    const isActive = tab.dataset.toolTab === toolId;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });

  toolPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.toolPanel === toolId);
  });

  if (updateLocation) {
    const url = new URL(window.location.href);
    url.searchParams.set("tool", toolId);
    url.hash = toolId;
    history.replaceState(null, "", url);
  }

  updateTabIndicator();
};

const getSelectedQuizPool = () => mcqBank.filter((question) => state.quiz.selectedPeriods.has(question.period));

const renderQuizControls = () => {
  quizPeriodChips.innerHTML = periodMeta.map((period) => {
    const active = state.quiz.selectedPeriods.has(period.id);
    return `<button class="filter-chip${active ? " is-active" : ""}" type="button" data-quiz-period="${period.id}">${escapeHtml(period.short)}</button>`;
  }).join("");

  quizCountChips.innerHTML = [10, 20, 40].map((count) => {
    const active = state.quiz.targetCount === count;
    return `<button class="filter-chip${active ? " is-active" : ""}" type="button" data-quiz-count="${count}">${count}</button>`;
  }).join("");

  const available = getSelectedQuizPool().length;
  const periodCount = state.quiz.selectedPeriods.size;
  const desired = state.quiz.targetCount;
  const suffix = available < desired ? ` This setup only has ${available} available, so the quiz will use all of them.` : "";
  quizAvailability.textContent = `${available} questions available across ${periodCount} selected ${periodCount === 1 ? "chapter" : "chapters"}.${suffix}`;
};

const startQuiz = (periodIds = Array.from(state.quiz.selectedPeriods)) => {
  const pool = shuffle(mcqBank.filter((question) => periodIds.includes(question.period)));
  const questions = pool.slice(0, Math.min(state.quiz.targetCount, pool.length));

  state.quiz.session = {
    questions,
    index: 0,
    score: 0,
    answers: [],
    isAnswered: false,
    selectedOption: null,
    completed: false
  };

  renderQuizStage();
};

const resetQuiz = () => {
  state.quiz.selectedPeriods = new Set(periodMeta.map((period) => period.id));
  state.quiz.targetCount = 10;
  state.quiz.session = null;
  renderQuizControls();
  renderQuizStage();
};

const getWeakPeriods = (answers) => {
  const periodStats = new Map();

  answers.forEach((answer) => {
    if (!periodStats.has(answer.period)) {
      periodStats.set(answer.period, { total: 0, correct: 0 });
    }

    const entry = periodStats.get(answer.period);
    entry.total += 1;
    entry.correct += answer.correct ? 1 : 0;
  });

  return Array.from(periodStats.entries())
    .map(([period, stats]) => ({ period, ...stats, accuracy: stats.total ? stats.correct / stats.total : 0 }))
    .filter((entry) => entry.accuracy < 1)
    .sort((left, right) => left.accuracy - right.accuracy);
};

const renderQuizResults = () => {
  const session = state.quiz.session;
  const total = session.questions.length;
  const percent = total ? Math.round((session.score / total) * 100) : 0;
  const byPeriod = periodMeta
    .map((period) => {
      const answers = session.answers.filter((answer) => answer.period === period.id);
      if (!answers.length) {
        return null;
      }

      const correct = answers.filter((answer) => answer.correct).length;
      return { period: period.id, total: answers.length, correct, accuracy: correct / answers.length };
    })
    .filter(Boolean)
    .sort((left, right) => left.accuracy - right.accuracy);

  const weakPeriods = getWeakPeriods(session.answers);

  quizStage.innerHTML = `
    <article class="result-card">
      <h3>Quiz Complete</h3>
      <p>You answered ${session.score} of ${total} questions correctly. Use the chapter breakdown to see whether the misses clustered around a specific unit.</p>
      <div class="result-grid">
        <div class="score-ring-wrap">
          <svg class="score-ring" viewBox="0 0 120 120" aria-hidden="true">
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#5b5bd6"></stop>
                <stop offset="100%" stop-color="#e8b84b"></stop>
              </linearGradient>
            </defs>
            <circle class="score-track" cx="60" cy="60" r="44"></circle>
            <circle class="score-value" id="score-value" cx="60" cy="60" r="44"></circle>
          </svg>
          <div class="score-copy">
            <strong>${percent}%</strong>
            <span>Accuracy</span>
          </div>
        </div>
        <div class="breakdown-stack">
          ${byPeriod.map((entry) => {
            const period = getPeriodMeta(entry.period);
            return `
              <article class="breakdown-card">
                <strong>${escapeHtml(period.short)} · ${escapeHtml(period.title)}</strong>
                <p>${entry.correct} correct out of ${entry.total} questions.</p>
                <div class="breakdown-meta">
                  <span>${Math.round(entry.accuracy * 100)}% accuracy</span>
                  <span>${escapeHtml(period.label)}</span>
                </div>
              </article>
            `;
          }).join("")}
        </div>
      </div>
      <div class="tool-divider"></div>
      <div class="result-actions">
        ${weakPeriods.length ? weakPeriods.map((entry) => {
          const period = getPeriodMeta(entry.period);
          return `<span class="weak-pill">${escapeHtml(period.short)} weak area</span>`;
        }).join("") : `<span class="weak-pill">No weak areas detected</span>`}
      </div>
      <div class="question-footer">
        <div class="tool-actions">
          ${weakPeriods.length ? `<button class="secondary-button" type="button" data-quiz-action="retry-weak">Retry Weak Areas</button>` : ""}
          <button class="primary-button" type="button" data-quiz-action="restart">Restart Quiz</button>
        </div>
      </div>
    </article>
  `;

  const scoreValue = document.getElementById("score-value");
  const circumference = 2 * Math.PI * 44;
  requestAnimationFrame(() => {
    scoreValue.style.strokeDasharray = `${circumference * (percent / 100)} ${circumference}`;
  });
};

const renderQuizStage = () => {
  const session = state.quiz.session;

  if (!session) {
    quizStage.innerHTML = `
      <article class="quiz-empty">
        <h3>Build a chapter question set.</h3>
        <p>Pick a target size and start. Explanations appear immediately after each answer so you can connect the question back to the chapter's themes and argument patterns.</p>
      </article>
    `;
    return;
  }

  if (!session.questions.length) {
    quizStage.innerHTML = `
      <article class="quiz-empty">
        <h3>No questions available.</h3>
        <p>Select the chapter with available questions, then try again.</p>
      </article>
    `;
    return;
  }

  if (session.completed) {
    renderQuizResults();
    return;
  }

  const question = session.questions[session.index];
  const progress = ((session.index) / session.questions.length) * 100;
  const answerState = session.isAnswered ? session.answers[session.answers.length - 1] : null;

  quizStage.innerHTML = `
    <div class="quiz-meta">
      <div class="progress-wrap">
        <div class="progress-copy">
          <span>Question ${session.index + 1} of ${session.questions.length}</span>
          <span>${escapeHtml(getPeriodMeta(question.period).short)} · ${escapeHtml(question.theme)}</span>
        </div>
        <div class="progress-track">
          <div class="progress-bar" style="width: ${progress}%"></div>
        </div>
      </div>
      <div class="score-pill">
        <div>
          <strong>${session.score}</strong>
          <span>Score</span>
        </div>
      </div>
    </div>
    <article class="question-card">
      <div class="question-kicker">
        <div class="badge-row">
          <span class="badge">${escapeHtml(getPeriodMeta(question.period).short)}</span>
          <span class="badge is-gold">${escapeHtml(question.theme)}</span>
          ${question.skill ? `<span class="badge">${escapeHtml(question.skill)}</span>` : ""}
          ${question.difficulty ? `<span class="badge">${escapeHtml(question.difficulty)}</span>` : ""}
        </div>
      </div>
      ${question.stimulus ? `<div class="question-stimulus">${escapeHtml(question.stimulus)}</div>` : ""}
      <h3 class="question-text">${escapeHtml(question.question)}</h3>
      <div class="option-grid">
        ${question.options.map((option, optionIndex) => {
          let stateClass = "";

          if (session.isAnswered) {
            if (optionIndex === question.answer) {
              stateClass = " is-correct";
            } else if (optionIndex === session.selectedOption) {
              stateClass = " is-incorrect";
            }
          }

          return `
            <button class="option-button${stateClass}" type="button" data-option="${optionIndex}" ${session.isAnswered ? "disabled" : ""}>
              <span class="option-letter">${String.fromCharCode(65 + optionIndex)}</span>
              <span>${escapeHtml(option)}</span>
            </button>
          `;
        }).join("")}
      </div>
      ${session.isAnswered ? `
        <div class="answer-feedback">
          <strong>${answerState.correct ? "Correct" : "Incorrect"} · ${escapeHtml(getPeriodMeta(question.period).short)} · ${escapeHtml(question.theme)}</strong>
          <p>${escapeHtml(question.explanation)}</p>
        </div>
        <div class="question-footer">
          <button class="primary-button" type="button" data-quiz-action="next">${session.index === session.questions.length - 1 ? "View Results" : "Next Question"}</button>
        </div>
      ` : ""}
    </article>
  `;
};

const handleQuizStageClick = (event) => {
  const optionButton = event.target.closest("[data-option]");
  const actionButton = event.target.closest("[data-quiz-action]");
  const session = state.quiz.session;

  if (optionButton && session && !session.isAnswered && !session.completed) {
    const question = session.questions[session.index];
    const selectedOption = Number(optionButton.dataset.option);
    const correct = selectedOption === question.answer;

    session.selectedOption = selectedOption;
    session.isAnswered = true;
    session.answers.push({ period: question.period, correct });

    if (correct) {
      session.score += 1;
    }

    renderQuizStage();
    return;
  }

  if (!actionButton) {
    return;
  }

  if (actionButton.dataset.quizAction === "next" && session) {
    if (session.index === session.questions.length - 1) {
      session.completed = true;
    } else {
      session.index += 1;
      session.isAnswered = false;
      session.selectedOption = null;
    }

    renderQuizStage();
  }

  if (actionButton.dataset.quizAction === "restart") {
    startQuiz();
  }

  if (actionButton.dataset.quizAction === "retry-weak" && session) {
    const weakPeriods = getWeakPeriods(session.answers).map((entry) => entry.period);

    if (weakPeriods.length) {
      state.quiz.selectedPeriods = new Set(weakPeriods);
      renderQuizControls();
      startQuiz(weakPeriods);
    }
  }
};

const renderFlashcardDecks = () => {
  const deckOptions = [{ id: "all", label: "All Cards" }, ...periodMeta.map((period) => ({ id: period.id, label: period.short }))];
  flashcardDecks.innerHTML = deckOptions.map((option) => `
    <button class="deck-chip${state.flashcards.deck === option.id ? " is-active" : ""}" type="button" data-deck="${option.id}">
      ${escapeHtml(option.label)}
    </button>
  `).join("");
};

const getFlashcardPool = () => state.flashcards.deck === "all"
  ? flashcardBank
  : flashcardBank.filter((card) => card.period === state.flashcards.deck);

const updateFlashcardDonut = () => {
  const circumference = 2 * Math.PI * 38;
  const reviewed = state.flashcards.reviewed;
  const knownRatio = reviewed ? state.flashcards.known / reviewed : 0;
  const unknownRatio = reviewed ? state.flashcards.unknown / reviewed : 0;
  const knownLength = circumference * knownRatio;
  const unknownLength = circumference * unknownRatio;

  donutKnown.style.strokeDasharray = `${knownLength} ${circumference}`;
  donutKnown.style.strokeDashoffset = "0";
  donutUnknown.style.strokeDasharray = `${unknownLength} ${circumference}`;
  donutUnknown.style.strokeDashoffset = `${-knownLength}`;
};

const resetFlashcardTransform = () => {
  flashcardDrag.style.transform = "";
  flashcardDrag.style.opacity = "1";
};

const getFlashcardFrontLabel = (card) => (card?.kind === "Term" ? "Vocabulary" : (card?.kind || "Flashcard"));

const getFlashcardBackLabel = (card) => ["Term", "Concept"].includes(card?.kind)
  ? "Definition"
  : "Description";

const canFlipFlashcard = () => !state.flashcards.isAnimating && Boolean(state.flashcards.order[state.flashcards.index]);

const toggleFlashcardFlip = () => {
  if (!canFlipFlashcard()) {
    return;
  }

  state.flashcards.flipped = !state.flashcards.flipped;
  flashcard.classList.toggle("is-flipped", state.flashcards.flipped);
  flashcard.setAttribute("aria-pressed", String(state.flashcards.flipped));

  const card = state.flashcards.order[state.flashcards.index];
  if (card) {
    flashcard.setAttribute("aria-label", `${card.front}. ${state.flashcards.flipped ? "Answer side visible." : "Prompt side visible."} Click, tap, Enter, or Space to flip.`);
  }
};

const resetFlashcards = () => {
  state.flashcards.order = shuffle(getFlashcardPool());
  state.flashcards.index = 0;
  state.flashcards.flipped = false;
  state.flashcards.known = 0;
  state.flashcards.unknown = 0;
  state.flashcards.reviewed = 0;
  state.flashcards.isAnimating = false;
  state.flashcards.drag = { active: false, pointerId: null, startX: 0, deltaX: 0, suppressClick: false };
  resetFlashcardTransform();
  renderFlashcardDecks();
  renderFlashcard();
};

const renderFlashcard = () => {
  const card = state.flashcards.order[state.flashcards.index];
  const isDone = !card;
  flashcard.classList.toggle("is-flipped", state.flashcards.flipped && !isDone);
  flashcard.setAttribute("aria-pressed", String(state.flashcards.flipped && !isDone));

  flashcardKnownCount.textContent = String(state.flashcards.known);
  flashcardUnknownCount.textContent = String(state.flashcards.unknown);
  flashcardReviewedCount.textContent = String(state.flashcards.reviewed);
  updateFlashcardDonut();

  if (isDone) {
    flashcardPeriodBadge.textContent = "Deck Complete";
    flashcardBackType.textContent = "Review";
    flashcardFrontTitle.textContent = "Deck complete.";
    flashcardFrontCopy.textContent = "";
    flashcardBackTitle.textContent = "";
    flashcardBackCopy.textContent = "Known cards went right, misses went left. Use the counters to see how this run felt before starting again.";
    flashcard.setAttribute("aria-label", "Flashcard deck complete. Reset the deck to start a new run.");
    flashcardKnownButton.disabled = true;
    flashcardUnknownButton.disabled = true;
    return;
  }

  flashcardPeriodBadge.textContent = getFlashcardFrontLabel(card);
  flashcardBackType.textContent = getFlashcardBackLabel(card);
  flashcardFrontTitle.textContent = card.front;
  flashcardFrontCopy.textContent = "";
  flashcardBackTitle.textContent = "";
  flashcardBackCopy.textContent = card.back;
  flashcard.setAttribute("aria-label", `${card.front}. ${state.flashcards.flipped ? "Answer side visible." : "Prompt side visible."} Click, tap, Enter, or Space to flip.`);
  flashcardKnownButton.disabled = false;
  flashcardUnknownButton.disabled = false;
};

const scoreFlashcard = (direction) => {
  const card = state.flashcards.order[state.flashcards.index];

  if (!card || state.flashcards.isAnimating) {
    return;
  }

  state.flashcards.isAnimating = true;
  state.flashcards.reviewed += 1;
  state.flashcards[direction === "known" ? "known" : "unknown"] += 1;

  const exitX = direction === "known" ? 520 : -520;
  flashcardDrag.style.transform = `translateX(${exitX}px) rotate(${exitX / 32}deg)`;
  flashcardDrag.style.opacity = "0";
  updateFlashcardDonut();
  flashcardKnownCount.textContent = String(state.flashcards.known);
  flashcardUnknownCount.textContent = String(state.flashcards.unknown);
  flashcardReviewedCount.textContent = String(state.flashcards.reviewed);

  window.setTimeout(() => {
    state.flashcards.index += 1;
    state.flashcards.flipped = false;
    state.flashcards.isAnimating = false;
    resetFlashcardTransform();
    renderFlashcard();
  }, 220);
};

const getCurrentPrompt = () => essayPrompts.find((prompt) => prompt.id === state.essay.promptId);

const getEssayDraft = () => {
  if (!state.essay.drafts[state.essay.promptId]) {
    state.essay.drafts[state.essay.promptId] = {
      thesis: "",
      context: "",
      analysis: "",
      docs: {},
      evidence: ["", "", ""]
    };
  }

  return state.essay.drafts[state.essay.promptId];
};

const evaluateThesis = (thesis, prompt) => {
  const lower = thesis.trim().toLowerCase();
  return {
    claim: thesis.trim().length >= 45,
    prompt: prompt.keywords.some((keyword) => lower.includes(keyword.toLowerCase())) || thesis.trim().length >= 90,
    complexity: /(although|however|while|despite|yet|even though|whereas|rather than)/i.test(thesis)
  };
};

const renderEssayPromptSelect = () => {
  essayPromptSelect.innerHTML = essayPrompts.map((prompt) => {
    const period = getPeriodMeta(prompt.period);
    return `<option value="${prompt.id}"${prompt.id === state.essay.promptId ? " selected" : ""}>${escapeHtml(period.short)} · ${escapeHtml(prompt.type)} · ${escapeHtml(prompt.title)}</option>`;
  }).join("");
};

const renderEssayMeta = () => {
  const prompt = getCurrentPrompt();
  const period = getPeriodMeta(prompt.period);
  essayPromptMeta.innerHTML = `
    <strong>${escapeHtml(period.short)} · ${escapeHtml(prompt.type)} · ${escapeHtml(prompt.title)}</strong>
    <p>${escapeHtml(prompt.text)}</p>
  `;
};

const renderEssaySteps = () => {
  essayStepList.innerHTML = essaySteps.map((step, index) => `
    <button class="step-chip${state.essay.step === index ? " is-active" : ""}" type="button" data-step="${index}">
      <span class="step-index">${index + 1}</span>
      <span>
        ${escapeHtml(step.title)}
        <small>${escapeHtml(step.description)}</small>
      </span>
    </button>
  `).join("");
};

const renderPreviewContent = () => {
  const prompt = getCurrentPrompt();
  const draft = getEssayDraft();
  const evidenceMarkup = prompt.type === "DBQ"
    ? prompt.docs.map((doc) => `<li><strong>${escapeHtml(doc.title)}:</strong> ${draft.docs[doc.id] ? escapeHtml(draft.docs[doc.id]) : "Add a note for this document in Step 3."}</li>`).join("")
    : draft.evidence.map((item, index) => `<li><strong>Evidence ${index + 1}:</strong> ${item ? escapeHtml(item) : "Add a specific example in Step 3."}</li>`).join("");

  return `
    <div class="preview-stack">
      <article class="preview-card is-highlight">
        <h4>Prompt</h4>
        <p>${escapeHtml(prompt.text)}</p>
      </article>
      <article class="preview-card">
        <h4>Thesis</h4>
        <p>${draft.thesis ? escapeHtml(draft.thesis) : "Build your thesis in Step 1."}</p>
      </article>
      <article class="preview-card">
        <h4>Contextualization</h4>
        <p>${draft.context ? escapeHtml(draft.context) : "Add setup and historical background in Step 2."}</p>
      </article>
      <article class="preview-card">
        <h4>Evidence Plan</h4>
        <ul>${evidenceMarkup}</ul>
      </article>
      <article class="preview-card">
        <h4>Analysis Focus</h4>
        <p>${draft.analysis ? escapeHtml(draft.analysis) : "Use Step 4 to explain sourcing, causation, comparison, or change over time."}</p>
      </article>
    </div>
  `;
};

const updateThesisChecklist = () => {
  const prompt = getCurrentPrompt();
  const draft = getEssayDraft();
  const checks = evaluateThesis(draft.thesis, prompt);

  document.querySelectorAll("[data-check]").forEach((node) => {
    const isValid = checks[node.dataset.check];
    node.classList.toggle("is-valid", Boolean(isValid));
    node.querySelector(".check-icon").textContent = isValid ? "✓" : "•";
  });
};

const renderEssayPanel = () => {
  const prompt = getCurrentPrompt();
  const draft = getEssayDraft();
  const step = essaySteps[state.essay.step];
  let content = "";

  if (step.key === "thesis") {
    content = `
      <div class="essay-step-title">
        <div>
          <h3>Step 1: Thesis</h3>
          <p>Write one sentence that answers the prompt and establishes the line of argument.</p>
        </div>
      </div>
      <textarea data-field="thesis" placeholder="Write a defensible thesis here...">${escapeHtml(draft.thesis)}</textarea>
      <div class="checklist">
        <div class="check-item" data-check="claim"><span class="check-icon">•</span><span>Makes a clear historical claim.</span></div>
        <div class="check-item" data-check="prompt"><span class="check-icon">•</span><span>Addresses the prompt directly.</span></div>
        <div class="check-item" data-check="complexity"><span class="check-icon">•</span><span>Shows complexity with qualification or comparison.</span></div>
      </div>
    `;
  }

  if (step.key === "context") {
    content = `
      <div class="essay-step-title">
        <div>
          <h3>Step 2: Contextualization</h3>
          <p>Frame the prompt with broader developments that came before it.</p>
        </div>
      </div>
      <div class="context-layout">
        <div>
          <textarea data-field="context" placeholder="What broader process, conflict, or trend sets up this prompt?">${escapeHtml(draft.context)}</textarea>
        </div>
        <aside class="hint-panel is-visible">
          <strong>Hints Panel</strong>
          <ul>${prompt.contextHints.map((hint) => `<li>${escapeHtml(hint)}</li>`).join("")}</ul>
        </aside>
      </div>
    `;
  }

  if (step.key === "evidence") {
    const docsMarkup = prompt.type === "DBQ"
      ? prompt.docs.map((doc) => `
          <article class="doc-card">
            <h4>${escapeHtml(doc.title)}</h4>
            <p>${escapeHtml(doc.use)}<br>${escapeHtml(doc.lens)}</p>
            <textarea data-doc-id="${doc.id}" placeholder="Document notes, sourcing idea, or outside evidence...">${escapeHtml(draft.docs[doc.id] || "")}</textarea>
          </article>
        `).join("")
      : prompt.evidencePrompts.map((evidencePrompt, index) => `
          <article class="doc-card">
            <h4>Evidence ${index + 1}</h4>
            <p>${escapeHtml(evidencePrompt)}</p>
            <textarea data-evidence-index="${index}" placeholder="Add one specific event, law, person, or pattern...">${escapeHtml(draft.evidence[index] || "")}</textarea>
          </article>
        `).join("");

    content = `
      <div class="essay-step-title">
        <div>
          <h3>Step 3: Evidence</h3>
          <p>${prompt.type === "DBQ" ? "Use the document scaffold to sort argument-worthy evidence." : "Collect specific evidence before you draft."}</p>
        </div>
      </div>
      <div class="docs-stack">${docsMarkup}</div>
    `;
  }

  if (step.key === "analysis") {
    content = `
      <div class="essay-step-title">
        <div>
          <h3>Step 4: Analysis</h3>
          <p>Explain why the evidence matters and how point of view, purpose, or context shapes it.</p>
        </div>
      </div>
      <article class="analysis-card">
        <h4>HAPP / SOAPS Reminder</h4>
        <p>Do not stop at summary. Use sourcing and reasoning to show why the evidence strengthens your argument.</p>
        <div class="analysis-grid">
          <div class="analysis-tip"><strong>Historical Context</strong><span>What bigger moment shapes this source or event?</span></div>
          <div class="analysis-tip"><strong>Audience</strong><span>Who is meant to hear this, and how does that shape the message?</span></div>
          <div class="analysis-tip"><strong>Purpose</strong><span>Why was this produced, and what result did the author want?</span></div>
          <div class="analysis-tip"><strong>Point of View</strong><span>How does the author's position or identity shape the evidence?</span></div>
        </div>
      </article>
      <div class="tool-divider"></div>
      <textarea data-field="analysis" placeholder="Write the analytical moves you need to make in the body paragraphs...">${escapeHtml(draft.analysis)}</textarea>
    `;
  }

  if (step.key === "preview") {
    content = `
      <div class="essay-step-title">
        <div>
          <h3>Step 5: Preview</h3>
          <p>This is the outline assembled from your work in the first four steps.</p>
        </div>
      </div>
      ${renderPreviewContent()}
    `;
  }

  essayStepPanel.innerHTML = content;

  if (step.key === "thesis") {
    updateThesisChecklist();
  }

  essayPrevButton.disabled = state.essay.step === 0;
  essayNextButton.disabled = state.essay.step === essaySteps.length - 1;
};

const renderEssayBuilder = () => {
  renderEssayPromptSelect();
  renderEssayMeta();
  renderEssaySteps();
  renderEssayPanel();
};

toolTabsWrap.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-tool-tab]");

  if (!tab) {
    return;
  }

  setActiveTool(tab.dataset.toolTab);
});

quizPeriodChips.addEventListener("click", (event) => {
  const button = event.target.closest("[data-quiz-period]");

  if (!button) {
    return;
  }

  const periodId = button.dataset.quizPeriod;

  if (state.quiz.selectedPeriods.has(periodId) && state.quiz.selectedPeriods.size === 1) {
    return;
  }

  if (state.quiz.selectedPeriods.has(periodId)) {
    state.quiz.selectedPeriods.delete(periodId);
  } else {
    state.quiz.selectedPeriods.add(periodId);
  }

  renderQuizControls();
});

quizCountChips.addEventListener("click", (event) => {
  const button = event.target.closest("[data-quiz-count]");

  if (!button) {
    return;
  }

  state.quiz.targetCount = Number(button.dataset.quizCount);
  renderQuizControls();
});

quizStartButton.addEventListener("click", () => {
  startQuiz();
});

quizResetButton.addEventListener("click", resetQuiz);
quizStage.addEventListener("click", handleQuizStageClick);

flashcardDecks.addEventListener("click", (event) => {
  const button = event.target.closest("[data-deck]");

  if (!button) {
    return;
  }

  state.flashcards.deck = button.dataset.deck;
  resetFlashcards();
});

flashcardResetButton.addEventListener("click", resetFlashcards);
flashcardDrag.addEventListener("click", (event) => {
  if (state.flashcards.drag.suppressClick) {
    state.flashcards.drag.suppressClick = false;
    return;
  }

  toggleFlashcardFlip();
});

flashcard.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();
  toggleFlashcardFlip();
});

flashcardKnownButton.addEventListener("click", () => scoreFlashcard("known"));
flashcardUnknownButton.addEventListener("click", () => scoreFlashcard("unknown"));

flashcardDrag.addEventListener("pointerdown", (event) => {
  if (state.flashcards.isAnimating || !state.flashcards.order[state.flashcards.index]) {
    return;
  }

  state.flashcards.drag.active = true;
  state.flashcards.drag.pointerId = event.pointerId;
  state.flashcards.drag.startX = event.clientX;
  state.flashcards.drag.deltaX = 0;
  flashcardDrag.setPointerCapture(event.pointerId);
});

flashcardDrag.addEventListener("pointermove", (event) => {
  if (!state.flashcards.drag.active || state.flashcards.drag.pointerId !== event.pointerId) {
    return;
  }

  state.flashcards.drag.deltaX = event.clientX - state.flashcards.drag.startX;
  flashcardDrag.style.transform = `translateX(${state.flashcards.drag.deltaX}px) rotate(${state.flashcards.drag.deltaX / 30}deg)`;
});

const finishDrag = (event) => {
  if (!state.flashcards.drag.active || state.flashcards.drag.pointerId !== event.pointerId) {
    return;
  }

  const { deltaX } = state.flashcards.drag;
  state.flashcards.drag.active = false;
  state.flashcards.drag.suppressClick = Math.abs(deltaX) > 8;
  flashcardDrag.releasePointerCapture(event.pointerId);

  if (deltaX > 120) {
    scoreFlashcard("known");
  } else if (deltaX < -120) {
    scoreFlashcard("unknown");
  } else {
    resetFlashcardTransform();
  }
};

flashcardDrag.addEventListener("pointerup", finishDrag);
flashcardDrag.addEventListener("pointercancel", finishDrag);

essayPromptSelect.addEventListener("change", () => {
  state.essay.promptId = essayPromptSelect.value;
  state.essay.step = 0;
  renderEssayBuilder();
});

essayStepList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-step]");

  if (!button) {
    return;
  }

  state.essay.step = Number(button.dataset.step);
  renderEssayBuilder();
});

essayPrevButton.addEventListener("click", () => {
  state.essay.step = Math.max(0, state.essay.step - 1);
  renderEssayBuilder();
});

essayNextButton.addEventListener("click", () => {
  state.essay.step = Math.min(essaySteps.length - 1, state.essay.step + 1);
  renderEssayBuilder();
});

essayStepPanel.addEventListener("input", (event) => {
  const target = event.target;
  const draft = getEssayDraft();

  if (target.matches("[data-field='thesis']")) {
    draft.thesis = target.value;
    updateThesisChecklist();
  }

  if (target.matches("[data-field='context']")) {
    draft.context = target.value;
  }

  if (target.matches("[data-field='analysis']")) {
    draft.analysis = target.value;
  }

  if (target.matches("[data-doc-id]")) {
    draft.docs[target.dataset.docId] = target.value;
  }

  if (target.matches("[data-evidence-index]")) {
    draft.evidence[Number(target.dataset.evidenceIndex)] = target.value;
  }
});

window.addEventListener("resize", updateTabIndicator);
window.addEventListener("hashchange", () => {
  const tool = getToolFromLocation();
  if (tool) {
    setActiveTool(tool, { updateLocation: false });
  }
});

updateHero();
renderQuizControls();
renderQuizStage();
renderFlashcardDecks();
resetFlashcards();
renderEssayBuilder();

const initialTool = getToolFromLocation();
if (initialTool) {
  setActiveTool(initialTool, { updateLocation: false });
} else {
  updateTabIndicator();
}
}).catch((error) => {
  console.error("Failed to initialize chapter data on the practice page.", error);
});

