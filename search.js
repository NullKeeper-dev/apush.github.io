(function () {
  const NOTES_SECTIONS = [
    { key: "overview", label: "Overview" },
    { key: "context", label: "Historical Context" },
    { key: "events", label: "Key Events" },
    { key: "figures", label: "Key Figures" },
    { key: "vocabulary", label: "Vocabulary" },
    { key: "essay", label: "Essay Tips" }
  ];

  const state = {
    entries: [],
    active: false,
    lastFocusedElement: null
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    const trigger = document.querySelector("[data-search-open]");
    if (!trigger) {
      return;
    }

    ensureModal();
    bindEvents();
    state.entries = buildEntries();
    renderResults("");

    Promise.resolve(window.chapterDataReady || Promise.resolve())
      .catch(function () {
        return [];
      })
      .then(function () {
        state.entries = buildEntries();
        renderResults(getInput().value);
      });
  }

  function ensureModal() {
    if (document.getElementById("global-search-modal")) {
      return;
    }

    const modal = document.createElement("div");
    modal.id = "global-search-modal";
    modal.className = "search-modal-backdrop";
    modal.hidden = true;
    modal.innerHTML =
      '<section class="search-modal-panel" role="dialog" aria-modal="true" aria-labelledby="global-search-title">' +
        '<div class="search-modal-header">' +
          "<div>" +
            "<p>Quick Jump</p>" +
            '<h2 id="global-search-title">Search Chapters and Tools</h2>' +
          "</div>" +
          '<button class="search-close" type="button" data-search-close aria-label="Close search">&times;</button>' +
        "</div>" +
        '<label class="search-input-shell">' +
          '<span class="visually-hidden">Search the APUSH site</span>' +
          '<input id="global-search-input" class="search-input" type="search" placeholder="Search by chapter, tool, section, or page">' +
        "</label>" +
        '<div id="global-search-results" class="search-results" aria-live="polite"></div>' +
      "</section>";

    document.body.appendChild(modal);
  }

  function bindEvents() {
    document.addEventListener("click", function (event) {
      const openTrigger = event.target.closest("[data-search-open]");
      const closeTrigger = event.target.closest("[data-search-close]");
      const backdrop = event.target.classList.contains("search-modal-backdrop") ? event.target : null;

      if (openTrigger) {
        event.preventDefault();
        openModal();
      }

      if (closeTrigger || backdrop) {
        closeModal();
      }
    });

    document.addEventListener("keydown", function (event) {
      const isShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
      if (isShortcut) {
        event.preventDefault();
        if (state.active) {
          closeModal();
        } else {
          openModal();
        }
        return;
      }

      if (!state.active) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
        return;
      }

      if (event.key === "Tab") {
        trapFocus(event);
      }
    });

    getInput().addEventListener("input", function () {
      renderResults(this.value);
    });

    getInput().addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        const firstResult = document.querySelector(".search-result");
        if (firstResult) {
          event.preventDefault();
          firstResult.click();
        }
      }
    });
  }

  function buildEntries() {
    const chapters = getChapterEntries();
    const baseEntries = [
      {
        label: "Home",
        subtitle: "Master APUSH landing page and chapter overview.",
        url: "index.html",
        keywords: ["home", "overview", "landing"]
      },
      {
        label: "Timeline",
        subtitle: "Chronology view with event details and chapter filters.",
        url: "timeline.html",
        keywords: ["timeline", "events", "chronology"]
      },
      {
        label: "Notes",
        subtitle: "Integrated chapter notes with context, figures, vocabulary, and essay review.",
        url: "notes.html",
        keywords: ["notes", "study map", "vocabulary", "essay"]
      },
      {
        label: "MCQ Quiz",
        subtitle: "Practice APUSH multiple-choice questions.",
        url: "practice.html?tool=mcq#mcq",
        keywords: ["mcq", "quiz", "multiple choice", "practice"]
      },
      {
        label: "Flashcards",
        subtitle: "Flip and score APUSH flashcards.",
        url: "practice.html?tool=flashcards#flashcards",
        keywords: ["flashcards", "terms", "definitions", "practice"]
      },
      {
        label: "Essay Builder",
        subtitle: "Guided SAQ, LEQ, and DBQ planning workspace.",
        url: "practice.html?tool=essay#essay",
        keywords: ["essay", "saq", "leq", "dbq", "writing"]
      }
    ];

    chapters.forEach(function (chapter) {
      baseEntries.push({
        label: chapter.short + " · Timeline",
        subtitle: chapter.title,
        url: "timeline.html?chapter=" + encodeURIComponent(chapter.short),
        keywords: [chapter.id, chapter.short, "timeline", "events", chapter.title]
      });

      NOTES_SECTIONS.forEach(function (section) {
        const hash = "#" + chapter.id + "-" + section.key;
        baseEntries.push({
          label: chapter.short + " · " + section.label,
          subtitle: chapter.title,
          url: "notes.html?chapter=" + encodeURIComponent(chapter.id) + "&section=" + encodeURIComponent(section.key) + hash,
          keywords: [chapter.id, chapter.short, "notes", section.label, chapter.title]
        });
      });

      baseEntries.push({
        label: chapter.short + " · MCQ Quiz",
        subtitle: chapter.title,
        url: "practice.html?tool=mcq&period=" + encodeURIComponent(chapter.id) + "#mcq",
        keywords: [chapter.id, chapter.short, "mcq", "quiz", chapter.title]
      });

      baseEntries.push({
        label: chapter.short + " · Flashcards",
        subtitle: chapter.title,
        url: "practice.html?tool=flashcards&deck=" + encodeURIComponent(chapter.id) + "#flashcards",
        keywords: [chapter.id, chapter.short, "flashcards", "terms", chapter.title]
      });

      baseEntries.push({
        label: chapter.short + " · Essay Builder",
        subtitle: chapter.title,
        url: "practice.html?tool=essay&promptPeriod=" + encodeURIComponent(chapter.id) + "#essay",
        keywords: [chapter.id, chapter.short, "essay", "saq", "leq", "dbq", chapter.title]
      });
    });

    return dedupeEntries(baseEntries);
  }

  function getChapterEntries() {
    const configs = typeof window.getChapterConfigs === "function" ? window.getChapterConfigs() : [];
    const configMap = new Map((Array.isArray(configs) ? configs : []).map(function (entry) {
      return [entry.id, {
        id: entry.id,
        short: entry.short,
        title: (entry.data && entry.data.chapterMeta && entry.data.chapterMeta.chapterTitle) || entry.title || entry.short
      }];
    }));
    const manifestEntries = Array.isArray(window.chapterManifest) ? window.chapterManifest : [];

    if (manifestEntries.length) {
      return manifestEntries.map(function (entry) {
        return configMap.get(entry.id) || {
          id: entry.id,
          short: entry.short,
          title: entry.title
        };
      });
    }

    return Array.from(configMap.values());
  }

  function dedupeEntries(entries) {
    const seen = new Set();
    return entries.filter(function (entry) {
      const key = entry.label + "::" + entry.url;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  function renderResults(query) {
    const resultsRoot = document.getElementById("global-search-results");
    if (!resultsRoot) {
      return;
    }

    const normalizedQuery = normalize(query);
    const filtered = normalizedQuery
      ? state.entries.filter(function (entry) {
          const haystack = [entry.label, entry.subtitle].concat(entry.keywords || []).join(" ").toLowerCase();
          return haystack.indexOf(normalizedQuery) !== -1;
        })
      : state.entries.slice(0, 14);

    resultsRoot.innerHTML = "";

    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "search-empty";
      empty.innerHTML = "<strong>No matches</strong><span>Try a chapter number, section, or tool name.</span>";
      resultsRoot.appendChild(empty);
      return;
    }

    filtered.slice(0, 18).forEach(function (entry) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "search-result";
      button.innerHTML = "<strong>" + escapeHtml(entry.label) + "</strong><span>" + escapeHtml(entry.subtitle) + "</span>";
      button.addEventListener("click", function () {
        window.location.href = entry.url;
      });
      resultsRoot.appendChild(button);
    });
  }

  function openModal() {
    const modal = getModal();
    if (!modal) {
      return;
    }

    state.active = true;
    state.lastFocusedElement = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("search-modal-open");
    renderResults(getInput().value);

    window.requestAnimationFrame(function () {
      getInput().focus();
      getInput().select();
    });
  }

  function closeModal() {
    const modal = getModal();
    if (!modal) {
      return;
    }

    state.active = false;
    modal.hidden = true;
    document.body.classList.remove("search-modal-open");

    if (state.lastFocusedElement && typeof state.lastFocusedElement.focus === "function") {
      state.lastFocusedElement.focus();
    }
  }

  function trapFocus(event) {
    const focusable = Array.from(getModal().querySelectorAll('button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'));
    if (!focusable.length) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function getModal() {
    return document.getElementById("global-search-modal");
  }

  function getInput() {
    return document.getElementById("global-search-input");
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
