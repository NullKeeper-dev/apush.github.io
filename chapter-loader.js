(function () {
  const manifest = Array.isArray(window.chapterManifest)
    ? [...window.chapterManifest].sort((left, right) => left.number - right.number)
    : [];

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

  const buildConfigs = () => manifest
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

  window.chapterDataReady = manifest
    .reduce((promise, entry) => promise.then(() => {
      if (window[entry.global]) {
        return null;
      }

      return loadScript(entry.script);
    }), Promise.resolve())
    .then(() => buildConfigs());
})();
