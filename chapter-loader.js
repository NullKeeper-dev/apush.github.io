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
      const data = window[entry.global];

      return {
        ...entry,
        title: data?.chapterMeta?.chapterTitle || entry.title,
        data
      };
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
