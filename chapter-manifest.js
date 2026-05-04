(function () {
  const apushPeriodCatalog = [
    { id: "p1", number: 1, short: "P1", label: "Period 1", range: "1491-1607" },
    { id: "p2", number: 2, short: "P2", label: "Period 2", range: "1607-1754" },
    { id: "p3", number: 3, short: "P3", label: "Period 3", range: "1754-1800" },
    { id: "p4", number: 4, short: "P4", label: "Period 4", range: "1800-1848" },
    { id: "p5", number: 5, short: "P5", label: "Period 5", range: "1844-1877" },
    { id: "p6", number: 6, short: "P6", label: "Period 6", range: "1865-1898" },
    { id: "p7", number: 7, short: "P7", label: "Period 7", range: "1890-1945" },
    { id: "p8", number: 8, short: "P8", label: "Period 8", range: "1945-1980" },
    { id: "p9", number: 9, short: "P9", label: "Period 9", range: "1980-Present" }
  ];

  const periodMetaById = new Map(apushPeriodCatalog.map((period) => [period.id, period]));
  const periodLabelPattern = /period\s*(\d+)/i;

  const chapterManifest = [
    {
      id: "ch1",
      number: 1,
      short: "Ch 1",
      title: "A New World",
      periodId: "p1",
      script: "chapters1-6-data.js",
      global: "chapter1Data"
    },
    {
      id: "ch2",
      number: 2,
      short: "Ch 2",
      title: "Beginnings of English America, 1607-1660",
      periodId: "p2",
      script: "chapters1-6-data.js",
      global: "chapter2Data"
    },
    {
      id: "ch3",
      number: 3,
      short: "Ch 3",
      title: "Creating Anglo-America, 1660-1750",
      periodId: "p2",
      script: "chapters1-6-data.js",
      global: "chapter3Data"
    },
    {
      id: "ch4",
      number: 4,
      short: "Ch 4",
      title: "Slavery, Freedom, and the Struggle for Empire, to 1763",
      periodId: "p2",
      script: "chapters1-6-data.js",
      global: "chapter4Data"
    },
    {
      id: "ch5",
      number: 5,
      short: "Ch 5",
      title: "The American Revolution, 1763-1783",
      periodId: "p3",
      script: "chapters1-6-data.js",
      global: "chapter5Data"
    },
    {
      id: "ch6",
      number: 6,
      short: "Ch 6",
      title: "The Revolution Within",
      periodId: "p3",
      script: "chapters1-6-data.js",
      global: "chapter6Data"
    },
    {
      id: "ch7",
      number: 7,
      short: "Ch 7",
      title: "Founding a Nation, 1783-1791",
      periodId: "p3",
      script: "chapter7-data.js",
      global: "chapter7Data"
    },
    {
      id: "ch8",
      number: 8,
      short: "Ch 8",
      title: "Securing the Republic",
      periodId: "p3",
      script: "chapter8-data.js",
      global: "chapter8Data"
    },
    {
      id: "ch9",
      number: 9,
      short: "Ch 9",
      title: "The Market Revolution",
      periodId: "p4",
      script: "chapter9-data.js",
      global: "chapter9Data"
    },
    {
      id: "ch10",
      number: 10,
      short: "Ch 10",
      title: "Democracy in America",
      periodId: "p4",
      script: "chapter10-data.js",
      global: "chapter10Data"
    },
    {
      id: "ch11",
      number: 11,
      short: "Ch 11",
      title: "The Peculiar Institution",
      periodId: "p4",
      script: "chapter11-data.js",
      global: "chapter11Data"
    },
    {
      id: "ch12",
      number: 12,
      short: "Ch 12",
      title: "An Age of Reform",
      periodId: "p5",
      script: "chapter12-data.js",
      global: "chapter12Data"
    },
    {
      id: "ch13",
      number: 13,
      short: "Ch 13",
      title: "A House Divided",
      periodId: "p5",
      script: "chapter13-data.js",
      global: "chapter13Data"
    },
    {
      id: "ch14",
      number: 14,
      short: "Ch 14",
      title: "A New Birth of Freedom: The Civil War",
      periodId: "p5",
      script: "chapter14-data.js",
      global: "chapter14Data"
    },
    {
      id: "ch15",
      number: 15,
      short: "Ch 15",
      title: "\"What Is Freedom?\": Reconstruction",
      periodId: "p5",
      script: "chapter15-data.js",
      global: "chapter15Data"
    },
    {
      id: "ch16",
      number: 16,
      short: "Ch 16",
      title: "America's Gilded Age",
      periodId: "p6",
      script: "chapter16-data.js",
      global: "chapter16Data"
    },
    {
      id: "ch17",
      number: 17,
      short: "Ch 17",
      title: "Freedom's Boundaries, at Home and Abroad",
      periodId: "p6",
      script: "chapter17-data.js",
      global: "chapter17Data"
    },
    {
      id: "ch18",
      number: 18,
      short: "Ch 18",
      title: "The Progressive Era",
      periodId: "p7",
      script: "chapter18-data.js",
      global: "chapter18Data"
    },
    {
      id: "ch19",
      number: 19,
      short: "Ch 19",
      title: "Safe for Democracy: The United States and World War I",
      periodId: "p7",
      script: "chapter19-data.js",
      global: "chapter19Data"
    },
    {
      id: "ch20",
      number: 20,
      short: "Ch 20",
      title: "From Business Culture to Great Depression",
      periodId: "p7",
      script: "chapter20-data.js",
      global: "chapter20Data"
    },
    {
      id: "ch21",
      number: 21,
      short: "Ch 21",
      title: "The New Deal",
      periodId: "p7",
      script: "chapter21-data.js",
      global: "chapter21Data"
    },
    {
      id: "ch22",
      number: 22,
      short: "Ch 22",
      title: "Fighting for the Four Freedoms: World War II, 1941-1945",
      periodId: "p7",
      script: "chapter22-data.js",
      global: "chapter22Data"
    },
    {
      id: "ch23",
      number: 23,
      short: "Ch 23",
      title: "The United States and the Cold War, 1945-1953",
      periodId: "p8",
      script: "chapter23-data.js",
      global: "chapter23Data"
    },
    {
      id: "ch24",
      number: 24,
      short: "Ch 24",
      title: "An Affluent Society, 1953-1960",
      periodId: "p8",
      script: "chapter24-data.js",
      global: "chapter24Data"
    },
    {
      id: "ch25",
      number: 25,
      short: "Ch 25",
      title: "The Sixties, 1960-1968",
      periodId: "p8",
      script: "chapter25-data.js",
      global: "chapter25Data"
    },
    {
      id: "ch26",
      number: 26,
      short: "Ch 26",
      title: "The Conservative Turn, 1969-1988",
      periodId: "p8",
      script: "chapter26-data.js",
      global: "chapter26Data"
    },
    {
      id: "ch27",
      number: 27,
      short: "Ch 27",
      title: "From Triumph to Tragedy, 1989-2004",
      periodId: "p9",
      script: "chapter27-data.js",
      global: "chapter27Data"
    },
    {
      id: "ch28",
      number: 28,
      short: "Ch 28",
      title: "A Divided Nation",
      periodId: "p9",
      script: "chapter28-data.js",
      global: "chapter28Data"
    }
  ];

  const clonePeriodMeta = (period) => (period ? { ...period } : null);

  const getPeriodMeta = (periodId) => {
    const normalizedPeriodId = String(periodId || "").toLowerCase();
    return clonePeriodMeta(periodMetaById.get(normalizedPeriodId) || null);
  };

  const resolvePeriodId = (entry = {}) => {
    const explicitPeriodId = String(
      entry.periodId
      || entry.data?.periodId
      || entry.data?.chapterMeta?.periodId
      || ""
    ).toLowerCase();

    if (periodMetaById.has(explicitPeriodId)) {
      return explicitPeriodId;
    }

    const periodLabel = String(
      entry.periodLabel
      || entry.data?.chapterMeta?.period
      || entry.period
      || ""
    );
    const periodMatch = periodLabel.match(periodLabelPattern);

    if (!periodMatch) {
      return "";
    }

    const inferredPeriodId = `p${periodMatch[1]}`;
    return periodMetaById.has(inferredPeriodId) ? inferredPeriodId : "";
  };

  const enrichChapterEntry = (entry = {}) => {
    const periodId = resolvePeriodId(entry);
    const periodMeta = periodMetaById.get(periodId) || null;
    const periodLabel = String(
      entry.periodLabel
      || entry.data?.chapterMeta?.period
      || periodMeta?.label
      || ""
    ).trim();
    const periodRange = String(
      entry.periodRange
      || entry.data?.chapterMeta?.dateRange
      || periodMeta?.range
      || ""
    ).trim();

    return {
      ...entry,
      periodId,
      periodNumber: periodMeta?.number ?? null,
      periodShort: periodMeta?.short || "",
      periodLabel,
      periodRange,
      periodDisplay: [periodLabel, periodRange].filter(Boolean).join(" · ")
    };
  };

  const sortChapterEntries = (left, right) => {
    const leftPeriod = Number.isFinite(Number(left.periodNumber)) ? Number(left.periodNumber) : Number.MAX_SAFE_INTEGER;
    const rightPeriod = Number.isFinite(Number(right.periodNumber)) ? Number(right.periodNumber) : Number.MAX_SAFE_INTEGER;

    if (leftPeriod !== rightPeriod) {
      return leftPeriod - rightPeriod;
    }

    const leftNumber = Number.isFinite(Number(left.number)) ? Number(left.number) : Number.MAX_SAFE_INTEGER;
    const rightNumber = Number.isFinite(Number(right.number)) ? Number(right.number) : Number.MAX_SAFE_INTEGER;

    if (leftNumber !== rightNumber) {
      return leftNumber - rightNumber;
    }

    return String(left.title || left.short || left.id || "").localeCompare(String(right.title || right.short || right.id || ""));
  };

  const groupChapterEntriesByPeriod = (entries = []) => {
    const groups = [];
    const groupIndex = new Map();

    (Array.isArray(entries) ? entries : [])
      .map((entry) => enrichChapterEntry(entry))
      .sort(sortChapterEntries)
      .forEach((entry) => {
        const groupKey = entry.periodId || entry.id || `group-${groups.length + 1}`;

        if (!groupIndex.has(groupKey)) {
          const group = {
            id: groupKey,
            label: entry.periodLabel || "Unassigned Period",
            range: entry.periodRange || "",
            periodNumber: entry.periodNumber,
            entries: []
          };

          groups.push(group);
          groupIndex.set(groupKey, group);
        }

        groupIndex.get(groupKey).entries.push(entry);
      });

    return groups;
  };

  window.apushPeriodCatalog = apushPeriodCatalog.map(clonePeriodMeta);
  window.getApushPeriodMeta = getPeriodMeta;
  window.enrichChapterEntry = enrichChapterEntry;
  window.groupChapterEntriesByPeriod = groupChapterEntriesByPeriod;
  window.chapterManifest = chapterManifest.map((entry) => enrichChapterEntry(entry));
})();
