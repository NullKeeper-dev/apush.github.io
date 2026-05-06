const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const TEXTBOOK_DIR = path.join(ROOT, "textbook");

const THEME = {
  politics: "Politics and Power",
  identity: "American and National Identity",
  work: "Work, Exchange, Technology",
  culture: "Culture and Society",
  migration: "Migration and Settlement",
  geography: "Geography and Environment",
  world: "America in the World"
};

const PERIOD_META = {
  p3: { label: "Period 3", range: "1754-1800", weight: "10-17%" },
  p4: { label: "Period 4", range: "1800-1848", weight: "10-17%" },
  p5: { label: "Period 5", range: "1844-1877", weight: "10-17%" },
  p6: { label: "Period 6", range: "1865-1898", weight: "10-17%" },
  p7: { label: "Period 7", range: "1890-1945", weight: "17-23%" }
};

const CHAPTER_CONFIGS = {
  8: {
    chapterId: "chapter8",
    chapterNum: 8,
    title: "Securing the Republic",
    dateRange: "1791-1815",
    periodId: "p3",
    chapterSubtitle: "Political parties, Jeffersonian power, and the War of 1812 transformed the early republic.",
    bigPictureThemes: [THEME.politics, THEME.identity, THEME.world],
    periodContext: "In the early republic, Americans had to decide how much power the federal government should hold, how the new nation would respond to European wars, and what freedom would mean in a rapidly expanding United States.",
    keyFigures: [
      { name: "George Washington", title: "First president and symbol of national unity", aliases: ["Washington"] },
      { name: "Alexander Hamilton", title: "Federalist architect of national finance", aliases: ["Hamilton"] },
      { name: "Thomas Jefferson", title: "Republican leader and expansionist president", aliases: ["Jefferson"] },
      { name: "John Marshall", title: "Chief Justice who strengthened federal judicial power", aliases: ["Marshall"] },
      { name: "Tecumseh", title: "Shawnee leader who sought Native confederation", aliases: ["Tecumseh"] },
      { name: "Toussaint Louverture", title: "Leader of the Haitian Revolution", aliases: ["Louverture", "Toussaint"] },
      { name: "James Madison", title: "President during the War of 1812", aliases: ["Madison"] }
    ]
  },
  9: {
    chapterId: "chapter9",
    chapterNum: 9,
    title: "The Market Revolution",
    dateRange: "1800-1840",
    periodId: "p4",
    chapterSubtitle: "Transportation, industry, and reform remade work, migration, and ideas of freedom.",
    bigPictureThemes: [THEME.work, THEME.migration, THEME.culture],
    periodContext: "During the early nineteenth century, transportation revolutions, industrial growth, and westward migration connected distant regions while creating new inequalities in labor, race, gender, and opportunity.",
    keyFigures: [
      { name: "Eli Whitney", title: "Inventor tied to interchangeable parts and cotton processing", aliases: ["Whitney"] },
      { name: "Samuel F. B. Morse", title: "Inventor of the telegraph", aliases: ["Samuel Morse", "Morse"] },
      { name: "Charles Grandison Finney", title: "Evangelical preacher of the Second Great Awakening", aliases: ["Finney"] },
      { name: "Joseph Smith", title: "Founder of Mormonism", aliases: ["Smith"] },
      { name: "Ralph Waldo Emerson", title: "Transcendentalist writer", aliases: ["Emerson"] },
      { name: "Henry David Thoreau", title: "Transcendentalist critic of conformity", aliases: ["Thoreau"] }
    ]
  },
  10: {
    chapterId: "chapter10",
    chapterNum: 10,
    title: "Democracy in America",
    dateRange: "1815-1840",
    periodId: "p4",
    chapterSubtitle: "Mass politics widened participation while sharpening sectional conflict and democratic limits.",
    bigPictureThemes: [THEME.politics, THEME.identity, THEME.world],
    periodContext: "After the War of 1812, the United States experienced a surge in popular political participation, but that democratic expansion unfolded alongside banking crises, sectional arguments, Native removal, and racial exclusion.",
    keyFigures: [
      { name: "Andrew Jackson", title: "Democratic president and symbol of mass politics", aliases: ["Jackson"] },
      { name: "John Quincy Adams", title: "National Republican president", aliases: ["Adams", "John Quincy Adams"] },
      { name: "Martin Van Buren", title: "Democratic party organizer and president", aliases: ["Van Buren"] },
      { name: "Henry Clay", title: "Advocate of the American System", aliases: ["Clay"] },
      { name: "John C. Calhoun", title: "States' rights theorist", aliases: ["Calhoun"] },
      { name: "Alexis de Tocqueville", title: "French observer of American democracy", aliases: ["Tocqueville"] },
      { name: "Nicholas Biddle", title: "Defender of the Second Bank of the United States", aliases: ["Biddle"] }
    ]
  },
  11: {
    chapterId: "chapter11",
    chapterNum: 11,
    title: "The Peculiar Institution",
    dateRange: "1800-1848",
    periodId: "p4",
    chapterSubtitle: "Slavery expanded, reshaped the southern economy, and provoked resistance and abolition.",
    bigPictureThemes: [THEME.culture, THEME.work, THEME.identity],
    periodContext: "As cotton production surged, slavery became more profitable and more deeply embedded in the national economy, even while enslaved people built families, cultures, and forms of resistance under brutal conditions.",
    keyFigures: [
      { name: "Frederick Douglass", title: "Former slave and abolitionist writer", aliases: ["Douglass"] },
      { name: "Harriet Tubman", title: "Conductor on the Underground Railroad", aliases: ["Tubman"] },
      { name: "Nat Turner", title: "Leader of a major slave rebellion", aliases: ["Turner"] },
      { name: "Denmark Vesey", title: "Associated with a planned slave uprising", aliases: ["Vesey"] },
      { name: "John C. Calhoun", title: "Politician who defended slavery", aliases: ["Calhoun"] },
      { name: "Sojourner Truth", title: "Black activist shaped by slavery and reform", aliases: ["Truth"] }
    ]
  },
  12: {
    chapterId: "chapter12",
    chapterNum: 12,
    title: "An Age of Reform",
    dateRange: "1820-1840",
    periodId: "p5",
    chapterSubtitle: "Evangelical energy, abolitionism, and early feminism widened public activism.",
    bigPictureThemes: [THEME.culture, THEME.identity, THEME.politics],
    periodContext: "Religious revival, print culture, and democratic politics encouraged Americans to believe society could be improved, but reform movements also exposed conflicts over race, slavery, gender, and citizenship.",
    keyFigures: [
      { name: "William Lloyd Garrison", title: "Militant abolitionist editor", aliases: ["Garrison"] },
      { name: "Frederick Douglass", title: "Black abolitionist leader", aliases: ["Douglass"] },
      { name: "Elizabeth Cady Stanton", title: "Early feminist organizer", aliases: ["Stanton"] },
      { name: "Lucretia Mott", title: "Abolitionist and women's rights activist", aliases: ["Mott"] },
      { name: "Dorothea Dix", title: "Reformer of mental health institutions", aliases: ["Dix"] },
      { name: "Angelina Grimke", title: "Female abolitionist and public speaker", aliases: ["Grimke", "Grimke sisters"] }
    ]
  },
  13: {
    chapterId: "chapter13",
    chapterNum: 13,
    title: "A House Divided",
    dateRange: "1840-1861",
    periodId: "p5",
    chapterSubtitle: "Expansion, slavery, and party breakdown pushed the Union toward civil war.",
    bigPictureThemes: [THEME.politics, THEME.identity, THEME.world],
    periodContext: "Territorial expansion after the 1840s intensified the national struggle over slavery, turning political compromise into repeated crisis and making sectional identity stronger than party loyalty.",
    keyFigures: [
      { name: "Abraham Lincoln", title: "Republican critic of slavery's expansion", aliases: ["Lincoln"] },
      { name: "Stephen A. Douglas", title: "Senator associated with popular sovereignty", aliases: ["Douglas"] },
      { name: "John Brown", title: "Militant abolitionist", aliases: ["Brown"] },
      { name: "Henry Clay", title: "Author of the Compromise of 1850", aliases: ["Clay"] },
      { name: "David Wilmot", title: "Sponsor of the Wilmot Proviso", aliases: ["Wilmot"] },
      { name: "Harriet Beecher Stowe", title: "Author whose antislavery novel shaped northern opinion", aliases: ["Stowe"] }
    ]
  },
  14: {
    chapterId: "chapter14",
    chapterNum: 14,
    title: "A New Birth of Freedom: The Civil War",
    dateRange: "1861-1865",
    periodId: "p5",
    chapterSubtitle: "Civil war mobilized the nation and transformed the meaning of union and emancipation.",
    bigPictureThemes: [THEME.politics, THEME.identity, THEME.work],
    periodContext: "The Civil War began as a struggle to preserve the Union, but military conflict, emancipation, and unprecedented state power transformed the war into a revolution in citizenship, labor, and federal authority.",
    keyFigures: [
      { name: "Abraham Lincoln", title: "President who led the Union through civil war", aliases: ["Lincoln"] },
      { name: "Jefferson Davis", title: "President of the Confederacy", aliases: ["Davis"] },
      { name: "Ulysses S. Grant", title: "Union general and architect of victory", aliases: ["Grant"] },
      { name: "Robert E. Lee", title: "Leading Confederate general", aliases: ["Lee"] },
      { name: "Frederick Douglass", title: "Black leader who pushed the war toward emancipation", aliases: ["Douglass"] },
      { name: "William Tecumseh Sherman", title: "Union general of total-war campaigns", aliases: ["Sherman"] }
    ]
  },
  15: {
    chapterId: "chapter15",
    chapterNum: 15,
    title: "\"What Is Freedom?\": Reconstruction",
    dateRange: "1865-1877",
    periodId: "p5",
    chapterSubtitle: "Reconstruction rewrote citizenship and rights before white supremacy regained political power.",
    bigPictureThemes: [THEME.politics, THEME.identity, THEME.culture],
    periodContext: "After emancipation, Reconstruction became a struggle over the meaning of freedom, federal power, labor, and black citizenship, producing major constitutional changes that outlasted the era's political defeat.",
    keyFigures: [
      { name: "Andrew Johnson", title: "President whose lenient reconstruction clashed with Congress", aliases: ["Johnson", "Andrew Johnson"] },
      { name: "Thaddeus Stevens", title: "Radical Republican leader", aliases: ["Stevens"] },
      { name: "Ulysses S. Grant", title: "President during later Reconstruction", aliases: ["Grant"] },
      { name: "Hiram Revels", title: "Early black officeholder during Reconstruction", aliases: ["Revels"] },
      { name: "Frederick Douglass", title: "Advocate for black citizenship and rights", aliases: ["Douglass"] },
      { name: "Robert Smalls", title: "Black Reconstruction politician and veteran", aliases: ["Smalls"] }
    ]
  },
  16: {
    chapterId: "chapter16",
    chapterNum: 16,
    title: "America's Gilded Age",
    dateRange: "1870-1890",
    periodId: "p6",
    chapterSubtitle: "Industrial capitalism, western conquest, and labor unrest reshaped the nation after Reconstruction.",
    bigPictureThemes: [THEME.work, THEME.migration, THEME.politics],
    periodContext: "Rapid industrial growth linked the nation into a single market, but the Gilded Age also intensified inequality, corporate power, labor protest, and conflict over land, citizenship, and democracy.",
    keyFigures: [
      { name: "Andrew Carnegie", title: "Steel industrialist and symbol of consolidation", aliases: ["Carnegie"] },
      { name: "John D. Rockefeller", title: "Oil magnate and corporate consolidator", aliases: ["Rockefeller"] },
      { name: "Terence V. Powderly", title: "Leader of the Knights of Labor", aliases: ["Powderly"] },
      { name: "Henry George", title: "Critic of inequality and author of Progress and Poverty", aliases: ["George"] },
      { name: "Edward Bellamy", title: "Utopian novelist critical of industrial inequality", aliases: ["Bellamy"] },
      { name: "Sitting Bull", title: "Lakota leader during western resistance", aliases: ["Sitting Bull"] }
    ]
  },
  17: {
    chapterId: "chapter17",
    chapterNum: 17,
    title: "Freedom's Boundaries, at Home and Abroad",
    dateRange: "1890-1900",
    periodId: "p6",
    chapterSubtitle: "Segregation, Populism, labor conflict, and imperial expansion redefined who counted as American.",
    bigPictureThemes: [THEME.identity, THEME.politics, THEME.world],
    periodContext: "By the 1890s, older promises of freedom collided with Jim Crow, nativism, labor unrest, and overseas empire, forcing Americans to ask who belonged inside democracy and who remained excluded from it.",
    keyFigures: [
      { name: "William Jennings Bryan", title: "Populist and Democratic champion of free silver", aliases: ["Bryan"] },
      { name: "Booker T. Washington", title: "Black leader navigating segregation and uplift politics", aliases: ["Washington", "Booker T. Washington"] },
      { name: "Theodore Roosevelt", title: "Hero of the Spanish-American War and rising nationalist", aliases: ["Roosevelt", "Theodore Roosevelt"] },
      { name: "Emilio Aguinaldo", title: "Filipino leader who resisted U.S. empire", aliases: ["Aguinaldo"] },
      { name: "Samuel Gompers", title: "Leader of the AFL", aliases: ["Gompers"] },
      { name: "Ida B. Wells", title: "Anti-lynching activist and critic of racial violence", aliases: ["Wells", "Ida B. Wells"] }
    ]
  },
  18: {
    chapterId: "chapter18",
    chapterNum: 18,
    title: "The Progressive Era",
    dateRange: "1900-1916",
    periodId: "p7",
    chapterSubtitle: "Reformers, workers, and progressive presidents tried to make industrial America more democratic and efficient.",
    bigPictureThemes: [THEME.politics, THEME.work, THEME.culture],
    periodContext: "In the early twentieth century, reformers responded to urban growth, corporate power, labor conflict, and mass immigration by expanding government oversight while still arguing over race, democracy, and the limits of freedom.",
    keyFigures: [
      { name: "Theodore Roosevelt", title: "Progressive president and regulator", aliases: ["Roosevelt", "Theodore Roosevelt"] },
      { name: "William Howard Taft", title: "President who continued and complicated progressive reform", aliases: ["Taft"] },
      { name: "Woodrow Wilson", title: "President associated with New Freedom reform", aliases: ["Wilson", "Woodrow Wilson"] },
      { name: "Jane Addams", title: "Settlement-house reformer", aliases: ["Addams"] },
      { name: "Eugene V. Debs", title: "Socialist labor leader", aliases: ["Debs"] },
      { name: "John Muir", title: "Conservationist and preservation advocate", aliases: ["Muir"] }
    ]
  }
};

const GENERIC_SECTION_EXCLUSIONS = new Set([
  "ebook content area has updated",
  "ebook content is loading",
  "FOCUS QUESTIONS",
  "REVIEW QUESTIONS",
  "KEY TERMS",
  "SHORT-ANSWER QUESTION PRACTICE",
  "LONG ESSAY QUESTION PRACTICE",
  "HISTORIANS' VOICES",
  "HISTORIANS’ VOICES",
  "VOICES OF FREEDOM",
  "WHO IS AN AMERICAN?"
]);

const STOPWORDS = new Set([
  "the", "and", "for", "that", "with", "from", "into", "this", "these", "those", "their", "about", "after",
  "before", "during", "through", "under", "over", "between", "among", "while", "where", "which", "whose", "what",
  "when", "were", "was", "have", "has", "had", "into", "onto", "than", "then", "them", "they", "his", "her",
  "its", "our", "your", "who", "why", "how", "did", "does", "just", "also", "became", "become", "being", "because",
  "both", "many", "most", "more", "less", "much", "such", "made", "make", "used", "using", "across", "around",
  "within", "without", "toward", "towards", "would", "could", "should", "chapter", "period", "questions", "review",
  "united", "states", "state", "american", "america"
]);

const THEME_KEYWORDS = [
  { theme: THEME.politics, keywords: ["election", "president", "congress", "court", "government", "constitution", "law", "party", "political", "democracy", "republic", "federal", "state"] },
  { theme: THEME.identity, keywords: ["freedom", "citizen", "citizenship", "identity", "race", "slavery", "rights", "american", "nation", "republican", "democracy", "liberty"] },
  { theme: THEME.work, keywords: ["market", "bank", "labor", "factory", "railroad", "trade", "economy", "industrial", "capital", "cotton", "workers", "manufacturing", "agriculture"] },
  { theme: THEME.culture, keywords: ["religion", "family", "women", "reform", "culture", "moral", "church", "education", "society", "social", "awakening"] },
  { theme: THEME.migration, keywords: ["west", "migration", "immigration", "settlement", "frontier", "territory", "canal", "city", "urban", "region", "border"] },
  { theme: THEME.geography, keywords: ["land", "plains", "river", "canal", "environment", "conservation", "west", "territory", "geography", "frontier"] },
  { theme: THEME.world, keywords: ["britain", "france", "mexico", "foreign", "war", "world", "atlantic", "empire", "imperial", "diplomatic", "international", "europe"] }
];

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

function normalizeCopy(value) {
  return decodeHtml(String(value || ""))
    .replace(/[\u0000-\u001f\u007f\u00a0\u2028\u2029]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function stripQuestionPageNumbers(value) {
  return normalizeCopy(value)
    .replace(/(\?)\s+\d{2,4}(?=(?:\s+[A-Z]|$))/g, "$1")
    .trim();
}

function stripTags(value) {
  return normalizeCopy(
    String(value || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<img\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi, " ")
      .replace(/<source\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi, " ")
      .replace(/<\/?[a-z][\w:-]*(?:"[^"]*"|'[^']*'|[^'">])*>/gi, " ")
  );
}

function normalizeTitle(value) {
  return normalizeCopy(String(value || "").replace(/[“”]/g, "\"").replace(/[‘’]/g, "'").replace(/：/g, ":"));
}

function sentenceKey(value) {
  return normalizeCopy(value)
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/[.,;:!?]+$/g, "")
    .toLowerCase();
}

function splitSentences(value) {
  return normalizeCopy(value)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => normalizeCopy(sentence))
    .filter(Boolean);
}

function sanitizeLearningCopy(value) {
  const text = normalizeCopy(value)
    .replace(/Link this event to a larger APUSH theme\./gi, "This event connects to a broader historical pattern.")
    .replace(/Connect this event to a broader APUSH theme\./gi, "This event connects to a broader historical pattern.")
    .replace(/\bAPUSH\b/gi, "this chapter")
    .replace(/\bAP exam\b/gi, "this chapter")
    .replace(/\bAP-relevant\b/gi, "historically important")
    .replace(/\bAP relevance\b/gi, "historical relevance");

  return /^[a-z]/.test(text) ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function dedupeSentences(values = []) {
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
}

function buildVocabularyExplanation(definition, context) {
  const sentences = dedupeSentences([definition, context]).filter((sentence) => sentence.length >= 28);
  return sentences.length ? sentences.slice(0, 3).join(" ") : normalizeCopy(definition);
}

function buildVocabularyContext(context) {
  return dedupeSentences([context]).find((sentence) => (
    sentence.length >= 24
    && !/^(?:this event|this term|this image)\s+(?:connects|fits|helps)\s+to\b/i.test(sentence)
  )) || "";
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getAttr(tag, name) {
  const normalizedTag = decodeHtml(tag);
  const quoted = normalizedTag.match(new RegExp(`${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i"));
  if (quoted) {
    return normalizeCopy(quoted[2]).replace(/^["']|["']$/g, "");
  }

  const bare = normalizedTag.match(new RegExp(`${name}\\s*=\\s*([^\\s>]+)`, "i"));
  return bare ? normalizeCopy(bare[1]).replace(/^["']|["']$/g, "") : "";
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
  if (!cleaned.startsWith("data:")) {
    return "";
  }

  const extension = extensionFromDataUrl(cleaned);
  const outputPath = `${outputBase}.${extension}`;
  const base64 = cleaned.match(/^data:[^;,]+;base64,([\s\S]+)$/i);

  if (base64) {
    fs.writeFileSync(outputPath, Buffer.from(base64[1], "base64"));
  } else {
    const raw = cleaned.replace(/^data:[^,]+,/i, "");
    fs.writeFileSync(outputPath, decodeURIComponent(raw));
  }

  return path.relative(ROOT, outputPath).replace(/\\/g, "/");
}

function getNearbyCaption(html, index) {
  const after = html.slice(index, Math.min(html.length, index + 6000));
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

function findChapterFiles(chapterNum) {
  const files = fs.readdirSync(TEXTBOOK_DIR).filter((file) => file.toLowerCase().endsWith(".html"));
  const chapterPattern = new RegExp(`chapter ${chapterNum}(?:\\D|$)`, "i");
  const chapterFiles = files.filter((file) => chapterPattern.test(file));
  const mainFile = chapterFiles.find((file) => new RegExp(`^Chapter ${chapterNum}(?:\\D|$)`, "i").test(file));
  const reviewFile = chapterFiles.find((file) => new RegExp(`^AP.+Chapter ${chapterNum}(?:\\D|$)`, "i").test(file));
  const sectionFiles = chapterFiles
    .filter((file) => file !== mainFile && file !== reviewFile)
    .filter((file) => !/^PERIOD\b/i.test(file))
    .sort();

  if (!mainFile || !reviewFile || !sectionFiles.length) {
    throw new Error(`Missing textbook files for chapter ${chapterNum}`);
  }

  return { mainFile, reviewFile, sectionFiles };
}

function parseHeadingChunks(html) {
  const matches = [...html.matchAll(/<(h[1-4])\b[^>]*>([\s\S]*?)<\/\1>/gi)];
  return matches.map((match, index) => ({
    tag: match[1].toLowerCase(),
    text: normalizeTitle(stripTags(match[2])),
    index: match.index,
    nextIndex: index + 1 < matches.length ? matches[index + 1].index : html.length
  }));
}

function extractChunkItems(chunk) {
  return [...chunk.matchAll(/<(p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi)]
    .map((match) => normalizeTitle(stripTags(match[2])))
    .filter(Boolean);
}

function isMeaningfulParagraph(text) {
  if (!text || text.length < 20) {
    return false;
  }

  if (GENERIC_SECTION_EXCLUSIONS.has(text)) {
    return false;
  }

  if (/^Directions:/i.test(text)) {
    return false;
  }

  if (/^\d{4}$/.test(text)) {
    return false;
  }

  if (text.split(" ").length <= 5 && !/[.!?]/.test(text)) {
    return false;
  }

  return true;
}

function summarizeParagraphs(paragraphs, maxSentences = 3) {
  const sentences = dedupeSentences(paragraphs)
    .filter((sentence) => sentence.length >= 24)
    .slice(0, maxSentences);
  return sentences.join(" ");
}

function inferThemes(text, fallback = []) {
  const lower = normalizeCopy(text).toLowerCase();
  const scored = THEME_KEYWORDS
    .map(({ theme, keywords }) => ({
      theme,
      score: keywords.reduce((sum, keyword) => sum + (lower.includes(keyword) ? 1 : 0), 0)
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((entry) => entry.theme);
  const merged = Array.from(new Set([...scored, ...fallback]));
  return merged.slice(0, 3);
}

function categoriesFromThemes(themes = []) {
  const categories = [];
  if (themes.includes(THEME.politics) || themes.includes(THEME.identity)) {
    categories.push("Political");
  }
  if (themes.includes(THEME.world)) {
    categories.push("Diplomatic");
  }
  if (themes.includes(THEME.work)) {
    categories.push("Economic");
  }
  if (themes.includes(THEME.culture)) {
    categories.push("Social");
  }
  if (themes.includes(THEME.migration) || themes.includes(THEME.geography)) {
    categories.push("Territorial");
  }
  return categories.length ? categories : ["Political"];
}

function normalizeSearch(value) {
  return normalizeCopy(value).toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

function termKeywords(term) {
  return Array.from(new Set(
    normalizeSearch(term)
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 4 && !STOPWORDS.has(word))
  ));
}

function scoreSentenceForTerm(term, sentence) {
  const normalizedSentence = normalizeSearch(sentence);
  const normalizedTerm = normalizeSearch(term);

  if (normalizedSentence.includes(normalizedTerm)) {
    return 100;
  }

  const keywords = termKeywords(term);
  if (!keywords.length) {
    return 0;
  }

  return keywords.reduce((score, keyword) => score + (normalizedSentence.includes(keyword) ? 1 : 0), 0);
}

function findRelevantSentences(term, sentences, limit = 3) {
  const normalizedTerm = normalizeSearch(term);
  const exactMatches = sentences
    .filter((sentence) => normalizeSearch(sentence).includes(normalizedTerm))
    .filter((sentence, index, array) => array.findIndex((item) => sentenceKey(item) === sentenceKey(sentence)) === index);

  if (exactMatches.length) {
    return exactMatches.slice(0, limit);
  }

  const keywords = termKeywords(term);
  const minimumScore = keywords.length > 1 ? 2 : 1;

  return sentences
    .map((sentence) => ({ sentence, score: scoreSentenceForTerm(term, sentence) }))
    .filter((entry) => entry.score >= minimumScore)
    .sort((left, right) => right.score - left.score || right.sentence.length - left.sentence.length)
    .map((entry) => entry.sentence)
    .filter((sentence, index, array) => array.findIndex((item) => sentenceKey(item) === sentenceKey(sentence)) === index)
    .slice(0, limit);
}

function cleanSectionTitleFromFilename(fileName) {
  return normalizeTitle(fileName.split(" - Chapter ")[0]);
}

function extractChapterIntro(mainFile) {
  const html = fs.readFileSync(path.join(TEXTBOOK_DIR, mainFile), "utf8");
  const headings = parseHeadingChunks(html);
  const focusHeading = headings.find((heading) => heading.text === "FOCUS QUESTIONS");
  if (!focusHeading) {
    return {
      introParagraphs: [],
      focusQuestions: [],
      timelineLines: [],
      contextImageRawIndexes: []
    };
  }

  const chunk = html.slice(focusHeading.index, focusHeading.nextIndex);
  const items = extractChunkItems(chunk).map(stripQuestionPageNumbers);
  const focusQuestions = items.filter((item) => /\?$/.test(item)).slice(0, 5);
  const timelineLines = items.filter((item) => /^\d{4}(?:\s*[--]\s*\d{4})?\s+/.test(item));
  const introParagraphs = items
    .filter((item) => isMeaningfulParagraph(item))
    .filter((item) => !focusQuestions.includes(item))
    .filter((item) => !timelineLines.includes(item))
    .slice(0, 6);
  const contextImageRawIndexes = [...chunk.matchAll(/<img\b[^>]*>/gi)]
    .map((_, index) => index + 1)
    .slice(0, 1);

  return {
    introParagraphs,
    focusQuestions,
    timelineLines,
    contextImageRawIndexes
  };
}

function extractReviewData(reviewFile) {
  const html = fs.readFileSync(path.join(TEXTBOOK_DIR, reviewFile), "utf8");
  const headings = parseHeadingChunks(html);
  const byHeading = new Map();

  headings.forEach((heading) => {
    const chunk = html.slice(heading.index, heading.nextIndex);
    byHeading.set(heading.text, extractChunkItems(chunk).map(stripQuestionPageNumbers));
  });

  return {
    reviewQuestions: byHeading.get("REVIEW QUESTIONS") || [],
    keyTerms: (byHeading.get("KEY TERMS") || [])
      .map((item) => normalizeTitle(item.replace(/\(\s*p\.\s*\d+\s*\)/gi, "").replace(/^\d+\.\s*/, "")))
      .filter(Boolean),
    saqItems: byHeading.get("SHORT-ANSWER QUESTION PRACTICE") || [],
    leqItems: byHeading.get("LONG ESSAY QUESTION PRACTICE") || [],
    historiansVoices: byHeading.get("HISTORIANS' VOICES") || byHeading.get("HISTORIANS’ VOICES") || []
  };
}

function extractRawImages(chapterNum) {
  const files = fs.readdirSync(TEXTBOOK_DIR)
    .filter((file) => new RegExp(`chapter ${chapterNum}(?:\\D|$)`, "i").test(file))
    .filter((file) => file.toLowerCase().endsWith(".html"))
    .sort();

  const rawImages = [];
  let rawIndex = 0;

  files.forEach((file) => {
    const html = fs.readFileSync(path.join(TEXTBOOK_DIR, file), "utf8");
    for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
      rawIndex += 1;
      rawImages.push({
        rawIndex,
        file,
        src: getAttr(match[0], "src"),
        alt: normalizeTitle(getAttr(match[0], "alt")),
        caption: normalizeTitle(getNearbyCaption(html, match.index))
      });
    }
  });

  return rawImages;
}

function inferImageCategory(alt) {
  const lower = normalizeCopy(alt).toLowerCase();
  if (lower.includes("map")) return "Map";
  if (lower.includes("portrait")) return "Portrait";
  if (lower.includes("cartoon")) return "Political Cartoon";
  if (lower.includes("painting")) return "Painting";
  if (lower.includes("photograph")) return "Photograph";
  if (lower.includes("drawing") || lower.includes("engraving")) return "Illustration";
  return "Primary Source";
}

function isRelevantImage(rawImage) {
  const alt = normalizeCopy(rawImage.alt);
  if (!rawImage.src || !rawImage.src.startsWith("data:")) {
    return false;
  }
  if (!/^data:image\/(?:jpeg|jpg|png|webp)/i.test(rawImage.src)) {
    return false;
  }
  if (!alt || alt.length < 12) {
    return false;
  }
  if (/^(?:norton logo|give me liberty!?)$/i.test(alt)) {
    return false;
  }
  if (/^chapter\s+\d+/i.test(alt)) {
    return false;
  }
  return true;
}

function materializeImages(config, rawImages, sectionFiles) {
  const chapterDir = path.join(ROOT, "images", `chapter${config.chapterNum}`);
  fs.rmSync(chapterDir, { recursive: true, force: true });
  fs.mkdirSync(chapterDir, { recursive: true });

  const seenAlt = new Set();
  const imageByRawIndex = new Map();
  const images = [];

  rawImages
    .filter(isRelevantImage)
    .filter((rawImage) => {
      const key = normalizeSearch(rawImage.alt);
      if (!key || seenAlt.has(key)) {
        return false;
      }
      seenAlt.add(key);
      return true;
    })
    .slice(0, 16)
    .forEach((rawImage, index) => {
      const imageId = `chapter${config.chapterNum}-img-${String(index + 1).padStart(3, "0")}`;
      const src = writeImageFile(rawImage.src, path.join(chapterDir, imageId));
      const sectionTitle = sectionFiles.find((file) => file.fileName === rawImage.file)?.sectionTitle || config.title;
      const descriptionBase = rawImage.caption || rawImage.alt;
      const themes = inferThemes(`${sectionTitle} ${descriptionBase}`, config.bigPictureThemes);
      const image = {
        imageId,
        src,
        alt: rawImage.alt,
        caption: rawImage.caption || rawImage.alt,
        relevanceScore: 4,
        apCategory: inferImageCategory(rawImage.alt),
        description: buildVocabularyExplanation(descriptionBase, `${sectionTitle} uses this image to anchor the chapter's discussion.`),
        apThemes: themes,
        period: config.periodId,
        suggestedUse: ["notes", "mcq-stimulus", "flashcard"]
      };

      images.push(image);
      imageByRawIndex.set(rawImage.rawIndex, image);
    });

  return { images, imageByRawIndex };
}

function extractSectionFiles(config, sectionFiles, rawImages) {
  return sectionFiles.map((fileName) => {
    const html = fs.readFileSync(path.join(TEXTBOOK_DIR, fileName), "utf8");
    const headings = parseHeadingChunks(html)
      .filter((heading) => heading.tag === "h2")
      .filter((heading) => !GENERIC_SECTION_EXCLUSIONS.has(heading.text))
      .filter((heading) => !/^\d{4}$/.test(heading.text));
    const sectionTitle = cleanSectionTitleFromFilename(fileName);
    const blocks = [];
    const fullTextParts = [];
    const sourceTextParts = [];

    headings.forEach((heading) => {
      const chunk = html.slice(heading.index, heading.nextIndex);
      const paragraphs = extractChunkItems(chunk)
        .filter((item) => item !== heading.text)
        .filter(isMeaningfulParagraph)
        .slice(0, 4);
      const summary = summarizeParagraphs(paragraphs, 3);
      if (!summary) {
        return;
      }

      sourceTextParts.push(paragraphs.join(" "));
      fullTextParts.push(summary);
      blocks.push({
        type: "fact",
        label: heading.text,
        text: summary,
        apSignificance: ""
      });
    });

    const overview = summarizeParagraphs(fullTextParts, 3) || summarizeParagraphs(extractChunkItems(html).filter(isMeaningfulParagraph), 3);
    const sectionImageRawIndexes = rawImages
      .filter((image) => image.file === fileName && isRelevantImage(image))
      .map((image) => image.rawIndex);

    return {
      fileName,
      sectionTitle,
      overview,
      fullText: fullTextParts.join(" "),
      sourceText: sourceTextParts.join(" "),
      contentBlocks: blocks.slice(0, 10),
      apThemes: inferThemes(`${sectionTitle} ${overview} ${fullTextParts.join(" ")}`, config.bigPictureThemes),
      significance: overview,
      sectionImageRawIndexes
    };
  });
}

function buildKeyFigures(config, sections, images, corpusSentences) {
  const imageList = images || [];

  return config.keyFigures.map((figure) => {
    const aliases = Array.from(new Set([figure.name, ...(figure.aliases || [])]));
    const matchingSentences = aliases
      .flatMap((alias) => findRelevantSentences(alias, corpusSentences, 2))
      .filter((sentence, index, array) => array.findIndex((item) => sentenceKey(item) === sentenceKey(sentence)) === index)
      .slice(0, 3);
    const bio = buildVocabularyExplanation(
      matchingSentences.join(" "),
      `${figure.name} appears throughout ${config.title} as a major historical actor.`
    );
    const perspective = buildVocabularyContext(matchingSentences.slice(1).join(" "));
    const image = imageList.find((item) => aliases.some((alias) => normalizeSearch(item.alt).includes(normalizeSearch(alias))));

    return {
      name: figure.name,
      title: figure.title,
      bio,
      significance: buildVocabularyExplanation(
        matchingSentences.join(" "),
        `${figure.name} is useful for understanding the main argument of ${config.title}.`
      ),
      perspective,
      imageId: image?.imageId || null
    };
  }).filter((figure) => figure.bio);
}

function buildSectionImageRefs(section, imageByRawIndex) {
  const sectionImages = section.sectionImageRawIndexes
    .map((rawIndex) => imageByRawIndex.get(rawIndex))
    .filter(Boolean)
    .slice(0, 4);

  return sectionImages.map((image, index) => ({
    imageId: image.imageId,
    placement: index === 0 ? "afterOverview" : `afterBlock-${Math.min(index, 3)}`,
    displayCaption: image.caption
  }));
}

function attachFiguresToSections(sections, chapterFigures) {
  return sections.map((section) => {
    const lowerText = normalizeSearch(`${section.sectionTitle} ${section.overview} ${section.fullText} ${section.sourceText || ""}`);
    const keyFigures = chapterFigures
      .filter((figure) => normalizeSearch(figure.name).split(/\s+/).some((part) => part.length >= 4 && lowerText.includes(part)))
      .slice(0, 3);

    return {
      sectionTitle: section.sectionTitle,
      apThemes: section.apThemes,
      narrative: section.fullText || section.overview,
      causes: [],
      effects: [],
      significance: section.significance,
      connections: [],
      keyFigures,
      primarySourceConnections: [],
      sectionImages: section.sectionImages,
      contentBlocks: section.contentBlocks
    };
  });
}

function buildVocabulary(config, reviewData, sections, corpusSentences) {
  const sectionHeadingTerms = sections
    .flatMap((section) => section.contentBlocks.map((block) => block.label))
    .filter((label) => label.split(" ").length <= 6)
    .filter((label) => !GENERIC_SECTION_EXCLUSIONS.has(label))
    .slice(0, 18);
  const candidates = Array.from(new Set([...reviewData.keyTerms, ...sectionHeadingTerms]));

  return candidates.map((term) => {
    const relevant = findRelevantSentences(term, corpusSentences, 3);
    const fallbackSection = sections.find((section) => scoreSentenceForTerm(term, `${section.sectionTitle} ${section.sourceText || ""} ${section.fullText}`) > 0);
    const context = buildVocabularyContext(
      relevant[0]
      || fallbackSection?.overview
      || `${term} appears repeatedly in ${config.title}.`
    );
    const definition = buildVocabularyExplanation(
      relevant.length ? relevant.join(" ") : (fallbackSection?.sourceText || fallbackSection?.fullText || `${term} is one of the main concepts that organizes this chapter.`),
      relevant.length ? "" : (fallbackSection?.overview || "")
    );

    return {
      term,
      definition,
      context,
      apRelevance: ""
    };
  }).filter((item) => item.definition && item.definition.length >= 18);
}

function buildTimeline(config, intro, sections, images, chapterFigures) {
  const lineEvents = intro.timelineLines.map((line, index) => {
    const match = line.match(/^(\d{4})(?:\s*[--]\s*(\d{4}))?\s+(.+)$/);
    if (!match) {
      return null;
    }

    const year = Number(match[1]);
    const title = normalizeTitle(match[3].replace(/\s+/g, " "));
    const relatedSection = sections.find((section) => scoreSentenceForTerm(title, `${section.sectionTitle} ${section.fullText}`) > 0) || sections[index % sections.length];
    const summary = buildVocabularyExplanation(
      relatedSection?.overview || relatedSection?.fullText || title,
      `${title} became one of the turning points highlighted in ${config.title}.`
    );
    const themes = relatedSection?.apThemes?.length ? relatedSection.apThemes : config.bigPictureThemes;
    const figures = chapterFigures
      .filter((figure) => scoreSentenceForTerm(figure.name, `${title} ${summary}`) > 0)
      .slice(0, 3)
      .map((figure) => figure.name);

    return {
      id: `${config.chapterId}-${slugify(title) || `timeline-${index + 1}`}`,
      chapterId: config.chapterId,
      periodId: config.periodId,
      year,
      month: null,
      title,
      summary,
      fullDescription: buildVocabularyExplanation(summary, relatedSection?.fullText || relatedSection?.overview || ""),
      categories: categoriesFromThemes(themes),
      apThemes: themes,
      keyFigures: figures,
      causes: relatedSection?.contentBlocks?.slice(0, 2).map((block) => block.label) || [],
      effects: relatedSection?.contentBlocks?.slice(-2).map((block) => block.label) || [],
      connectedEventIds: [],
      significance: index < 5 ? "High" : "Medium",
      apPriority: true,
      essayRelevance: `Useful evidence for writing about ${config.title.toLowerCase()} and its larger historical consequences.`,
      commonMisconception: `${title} should be connected to the larger political and social changes of the chapter, not treated as an isolated event.`,
      imageId: images[index]?.imageId || null
    };
  }).filter(Boolean);

  if (lineEvents.length >= 6) {
    return lineEvents.slice(0, 14);
  }

  const fallbackEvents = sections.slice(0, 10).map((section, index) => {
    const yearMatch = `${section.sourceText || ""} ${section.fullText} ${section.overview}`.match(/\b(1[6-9]\d{2}|20\d{2})\b/);
    const title = section.contentBlocks[0]?.label || section.sectionTitle;
    return {
      id: `${config.chapterId}-${slugify(title) || `timeline-${index + 1}`}`,
      chapterId: config.chapterId,
      periodId: config.periodId,
      year: yearMatch ? Number(yearMatch[1]) : Number(config.dateRange.match(/\d{4}/)?.[0] || 1800) + index,
      month: null,
      title,
      summary: section.overview,
      fullDescription: section.sourceText || section.fullText || section.overview,
      categories: categoriesFromThemes(section.apThemes),
      apThemes: section.apThemes,
      keyFigures: [],
      causes: section.contentBlocks.slice(0, 2).map((block) => block.label),
      effects: section.contentBlocks.slice(-2).map((block) => block.label),
      connectedEventIds: [],
      significance: index < 4 ? "High" : "Medium",
      apPriority: true,
      essayRelevance: `Useful evidence for writing about ${config.title.toLowerCase()}.`,
      commonMisconception: `This development belongs in a broader chapter argument rather than as a stand-alone fact.`,
      imageId: images[index]?.imageId || null
    };
  });

  return fallbackEvents;
}

function buildOverallTimelineEvents(timeline, periodNumber) {
  return timeline.map((event) => ({
    id: event.id,
    year: event.year,
    title: event.title,
    summary: event.summary,
    period: periodNumber,
    significance: event.essayRelevance,
    categories: event.categories,
    apPriority: event.apPriority
  }));
}

function buildSaqs(config, reviewData, images) {
  const lines = reviewData.saqItems.filter((item) => !/^Directions:/i.test(item));
  const groups = [];
  let current = null;

  lines.forEach((line) => {
    if (/^Answer all parts/i.test(line)) {
      if (current && (current.partA || current.partB || current.partC)) {
        groups.push(current);
      }
      current = {
        prompt: line,
        stimulusText: "",
        parts: []
      };
      return;
    }

    if (!current) {
      return;
    }

    if (/^Briefly /i.test(line) || /^Using /i.test(line)) {
      current.parts.push(line);
      return;
    }

    if (!current.stimulusText) {
      current.stimulusText = line;
    }
  });

  if (current && (current.partA || current.partB || current.partC || current.parts.length)) {
    groups.push(current);
  }

  const mapped = groups.map((group, index) => ({
    id: `${config.chapterId}-saq-${String(index + 1).padStart(3, "0")}`,
    chapterId: config.chapterId,
    stimulusType: group.stimulusText ? "text" : "",
    stimulusImageId: images[index]?.imageId || null,
    stimulusText: group.stimulusText || null,
    stimulusCaption: group.stimulusText ? null : (images[index]?.caption || null),
    prompt: `Answer parts A, B, and C about ${config.title.toLowerCase()}.`,
    partA: group.parts[0] || `Describe one major development from ${config.title}.`,
    partB: group.parts[1] || `Explain one important cause or effect connected to ${config.title}.`,
    partC: group.parts[2] || `Explain one broader consequence of the chapter's developments.`,
    scoringGuidance: {
      partA: "Use a specific event, idea, or development named in the chapter.",
      partB: "Explain a clear causal relationship rather than just naming another fact.",
      partC: "Connect the chapter to a bigger historical change, conflict, or continuity."
    },
    sampleAnswers: {
      partA: buildVocabularyExplanation(group.parts[0] || config.chapterSubtitle, config.periodContext),
      partB: buildVocabularyExplanation(group.parts[1] || config.periodContext, config.chapterSubtitle),
      partC: buildVocabularyExplanation(group.parts[2] || config.chapterSubtitle, config.periodContext)
    }
  }));

  if (reviewData.historiansVoices.length >= 3) {
    mapped.push({
      id: `${config.chapterId}-saq-${String(mapped.length + 1).padStart(3, "0")}`,
      chapterId: config.chapterId,
      stimulusType: "text",
      stimulusImageId: null,
      stimulusText: reviewData.historiansVoices.slice(0, 4).join(" "),
      stimulusCaption: null,
      prompt: `Answer parts A, B, and C by comparing historical interpretations related to ${config.title.toLowerCase()}.`,
      partA: reviewData.historiansVoices.find((item) => /^Briefly describe/i.test(item)) || `Describe one major historical interpretation tied to ${config.title}.`,
      partB: reviewData.historiansVoices.find((item) => /^Briefly explain how ONE specific historical event/i.test(item)) || `Explain one event that supports one interpretation of ${config.title}.`,
      partC: reviewData.historiansVoices.slice().reverse().find((item) => /^Briefly explain how ONE specific historical event/i.test(item)) || `Explain one event that complicates another interpretation of ${config.title}.`,
      scoringGuidance: {
        partA: "Identify a real difference in interpretation or emphasis.",
        partB: "Use a specific event not just a general trend.",
        partC: "Show how evidence can support or complicate an interpretation."
      },
      sampleAnswers: {
        partA: `A strong answer would explain how historians disagree over what freedom, democracy, labor, or citizenship most clearly meant in ${config.title}.`,
        partB: `A strong answer would connect one concrete event from the chapter to the interpretation being defended.`,
        partC: `A strong answer would use another event from the chapter to qualify or challenge a simplified interpretation.`
      }
    });
  }

  return mapped.slice(0, 4);
}

function inferLeqArgument(prompt) {
  if (/turning point|change|extent to which|transformed?/i.test(prompt)) {
    return "Continuity and Change Over Time";
  }
  if (/caused?|reasons?|result/i.test(prompt)) {
    return "Causation";
  }
  if (/compare/i.test(prompt)) {
    return "Comparison";
  }
  return "Argument Development";
}

function buildLeqs(config, reviewData, sections, historicalContext) {
  const prompts = reviewData.leqItems.filter((item) => !/^In your response/i.test(item));
  if (!prompts.length) {
    return [];
  }

  return prompts.slice(0, 2).map((prompt, index) => {
    const recommendedArgument = inferLeqArgument(prompt);
    const sectionEvidences = sections.slice(0, 3).map((section) => ({
      claim: section.sectionTitle,
      evidence: section.contentBlocks.slice(0, 3).map((block) => block.label),
      analysis: section.overview
    }));

    return {
      id: `${config.chapterId}-leq-${String(index + 1).padStart(3, "0")}`,
      chapterId: config.chapterId,
      prompt,
      recommendedArgument,
      thesisExamples: [
        `A strong thesis on ${config.title.toLowerCase()} should make a clear claim about how the chapter's developments changed political power, social relations, or ideas of freedom.`,
        `Another strong thesis could argue that ${config.title.toLowerCase()} reshaped the United States in important ways while also preserving older inequalities and conflicts.`
      ],
      outlineScaffold: {
        contextualization: historicalContext,
        bodyParagraph1: sectionEvidences[0] || { claim: sections[0]?.sectionTitle || "Early development", evidence: [], analysis: sections[0]?.overview || "" },
        bodyParagraph2: sectionEvidences[1] || { claim: sections[1]?.sectionTitle || "Middle development", evidence: [], analysis: sections[1]?.overview || "" },
        bodyParagraph3: sectionEvidences[2] || { claim: sections[2]?.sectionTitle || "Later development", evidence: [], analysis: sections[2]?.overview || "" },
        complexity: `A strong complexity point should show that ${config.title.toLowerCase()} expanded opportunity for some groups while tightening limits on others.`
      },
      scoringRubric: {
        thesis: "1 point - Make a clear historical claim that answers the prompt.",
        contextualization: "1 point - Place the chapter in its broader historical setting.",
        evidence: "2 points - Use several specific examples from the chapter.",
        analysis: "2 points - Explain how your evidence proves the argument.",
        complexity: "1 point - Show contradiction, qualification, or change over time."
      }
    };
  });
}

function buildEssayPractice(config, reviewData, sections, historicalContext, images) {
  return {
    saq: buildSaqs(config, reviewData, images),
    leq: buildLeqs(config, reviewData, sections, historicalContext),
    dbq: []
  };
}

function buildMcqTermQuestion(config, item, distractors, index) {
  const options = [item.definition, ...distractors.map((entry) => entry.definition)].slice(0, 4);
  const labels = ["A", "B", "C", "D"];
  const optionsObject = Object.fromEntries(options.map((option, optionIndex) => [labels[optionIndex], option]));
  const correctAnswer = labels[0];

  return {
    id: `${config.chapterId}-mcq-${String(index + 1).padStart(3, "0")}`,
    chapterId: config.chapterId,
    difficulty: "Easy",
    apSkill: "Contextualization",
    stimulusType: "text",
    stimulusImageId: null,
    stimulusText: item.context || item.definition,
    stimulusCaption: null,
    question: `Which of the following best describes ${item.term}?`,
    options: optionsObject,
    correctAnswer,
    explanation: {
      wrongA: null,
      correct: item.definition,
      wrongB: `This option describes a different development from ${config.title}.`,
      wrongC: `This choice belongs to another concept or event from the same chapter.`,
      wrongD: `This answer uses plausible period language but does not define ${item.term}.`
    },
    topicTag: item.term,
    apTheme: config.bigPictureThemes[0],
    stimulus: item.context || item.definition
  };
}

function buildMcqFigureQuestion(config, figure, distractors, index) {
  const labels = ["A", "B", "C", "D"];
  const choices = [figure, ...distractors].slice(0, 4);
  return {
    id: `${config.chapterId}-mcq-${String(index + 1).padStart(3, "0")}`,
    chapterId: config.chapterId,
    difficulty: "Medium",
    apSkill: "Comparison",
    stimulusType: "text",
    stimulusImageId: figure.imageId || null,
    stimulusText: figure.bio,
    stimulusCaption: figure.imageId ? `Identify the historical figure most closely associated with this development from ${config.title}.` : null,
    question: `Which historical figure is most directly associated with the development described above?`,
    options: Object.fromEntries(choices.map((choice, choiceIndex) => [labels[choiceIndex], `${choice.name} - ${choice.title}`])),
    correctAnswer: "A",
    explanation: {
      wrongA: null,
      correct: `${figure.name} is the correct answer because ${figure.bio}`,
      wrongB: "This person is historically important, but the description points more directly to another figure.",
      wrongC: "This answer belongs to the same period but not to the development named in the stimulus.",
      wrongD: "This distractor is plausible only because it shares chapter context, not because it fits the evidence best."
    },
    topicTag: figure.name,
    apTheme: config.bigPictureThemes[0],
    stimulus: figure.bio
  };
}

function buildMcqTimelineQuestion(config, event, distractors, index) {
  const labels = ["A", "B", "C", "D"];
  const choices = [event, ...distractors].slice(0, 4);
  return {
    id: `${config.chapterId}-mcq-${String(index + 1).padStart(3, "0")}`,
    chapterId: config.chapterId,
    difficulty: "Medium",
    apSkill: "Causation",
    stimulusType: event.imageId ? "image" : "text",
    stimulusImageId: event.imageId || null,
    stimulusText: event.imageId ? null : event.summary,
    stimulusCaption: event.imageId ? event.summary : null,
    question: `The historical development associated with ${event.title} is best described by which of the following?`,
    options: Object.fromEntries(choices.map((choice, choiceIndex) => [labels[choiceIndex], choice.summary])),
    correctAnswer: "A",
    explanation: {
      wrongA: null,
      correct: event.summary,
      wrongB: `This answer describes a real development from ${config.title}, but not the one named in the question.`,
      wrongC: "This option belongs to the same chapter but does not match the specific event being tested.",
      wrongD: "This choice confuses the event with another turning point from the period."
    },
    topicTag: event.title,
    apTheme: event.apThemes[0] || config.bigPictureThemes[0],
    stimulus: event.summary
  };
}

function buildMcqQuestions(config, vocabulary, figures, timeline) {
  const questions = [];
  const vocabPool = vocabulary.slice(0, 14);

  vocabPool.forEach((item, index) => {
    const distractors = vocabulary.filter((entry) => entry.term !== item.term).slice(index, index + 6);
    if (distractors.length >= 3) {
      questions.push(buildMcqTermQuestion(config, item, distractors, questions.length));
    }
  });

  figures.slice(0, 6).forEach((figure, index) => {
    const distractors = figures.filter((entry) => entry.name !== figure.name).slice(index, index + 6);
    if (distractors.length >= 3) {
      questions.push(buildMcqFigureQuestion(config, figure, distractors, questions.length));
    }
  });

  timeline.slice(0, 10).forEach((event, index) => {
    const distractors = timeline.filter((entry) => entry.id !== event.id).slice(index, index + 6);
    if (distractors.length >= 3) {
      questions.push(buildMcqTimelineQuestion(config, event, distractors, questions.length));
    }
  });

  if (questions.length < 20) {
    vocabulary.slice(14, 20).forEach((item, index) => {
      const distractors = vocabulary.filter((entry) => entry.term !== item.term).slice(index, index + 6);
      if (distractors.length >= 3) {
        questions.push(buildMcqTermQuestion(config, item, distractors, questions.length));
      }
    });
  }

  return questions.slice(0, 24);
}

function buildFlashcards(config, vocabulary, figures, timeline) {
  const cards = [];
  let count = 1;
  const addCard = (type, front, back, hint, imageId, difficulty = "Medium", apPriority = true) => {
    cards.push({
      id: `${config.chapterId}-fc-${String(count).padStart(3, "0")}`,
      chapterId: config.chapterId,
      type,
      front,
      back,
      hint,
      imageId: imageId || null,
      periodId: config.periodId,
      difficulty,
      apPriority,
      period: Number(config.periodId.replace("p", ""))
    });
    count += 1;
  };

  vocabulary.forEach((item) => addCard("Term", item.term, item.definition, item.context, null, "Easy", true));
  figures.forEach((figure) => addCard("Person", figure.name, `${figure.title}. ${figure.bio}`.trim(), figure.perspective || `${figure.name} helps anchor the main developments of this chapter.`, figure.imageId, "Medium", true));
  timeline.forEach((event) => addCard("Event", event.title, event.summary, event.essayRelevance, event.imageId, event.significance === "High" ? "Medium" : "Easy", true));

  if (cards.length < 50) {
    timeline.slice(0, 6).forEach((event) => {
      addCard("Concept", `${event.title} significance`, event.fullDescription || event.summary, event.essayRelevance, event.imageId, "Medium", false);
    });
  }

  return cards.slice(0, 50);
}

function buildOverarchingAnalysis(config, sections) {
  const firstSection = sections[0];
  const lastSection = sections[sections.length - 1];

  return {
    continuity: `${config.title} shows that debates over freedom, power, and belonging remained central even as the country changed around them.`,
    change: `${config.title} also demonstrates that institutions, political coalitions, labor systems, or social movements were transformed by the developments traced across the chapter.`,
    complexity: `${config.title} is best understood as a period of expansion and conflict at the same time: new opportunities opened for some Americans while older inequalities hardened for others.`,
    comparisonAngles: [
      `Compare ${firstSection?.sectionTitle || config.title} with ${lastSection?.sectionTitle || config.title} to track change across the chapter.`,
      `Compare the political language of freedom in ${config.title} with the actual limits different groups faced.`,
      `Compare this chapter's developments with the period that came before it to show what changed and what endured.`
    ]
  };
}

function buildExamTips(config, sections) {
  return [
    `Track how ${config.title.toLowerCase()} changed who held political power and who remained excluded from it.`,
    `Use section evidence from ${sections.slice(0, 2).map((section) => section.sectionTitle).join(" and ")} to connect ideas to concrete events.`,
    `When writing on this chapter, balance expansion or reform with the limits that still shaped freedom.`
  ];
}

function buildChapterData(config) {
  const { mainFile, reviewFile, sectionFiles } = findChapterFiles(config.chapterNum);
  const rawImages = extractRawImages(config.chapterNum);
  const intro = extractChapterIntro(mainFile);
  const reviewData = extractReviewData(reviewFile);
  const extractedSections = extractSectionFiles(config, sectionFiles, rawImages);
  const { images, imageByRawIndex } = materializeImages(config, rawImages, extractedSections);
  const sectionImageAugmented = extractedSections.map((section) => ({
    ...section,
    sectionImages: buildSectionImageRefs(section, imageByRawIndex)
  }));
  const corpusSentences = dedupeSentences([
    ...intro.introParagraphs,
    ...sectionImageAugmented.map((section) => section.overview),
    ...sectionImageAugmented.map((section) => section.sourceText || section.fullText),
    ...reviewData.reviewQuestions
  ]);
  const chapterFigures = buildKeyFigures(config, sectionImageAugmented, images, corpusSentences);
  const sections = attachFiguresToSections(sectionImageAugmented, chapterFigures);
  const vocabulary = buildVocabulary(config, reviewData, sectionImageAugmented, corpusSentences);
  const historicalContext = buildVocabularyExplanation(
    intro.introParagraphs.join(" "),
    config.periodContext
  );
  const timeline = buildTimeline(config, intro, sectionImageAugmented, images, chapterFigures);
  const essayPractice = buildEssayPractice(config, reviewData, sections, historicalContext, images);
  const mcqQuestions = buildMcqQuestions(config, vocabulary, chapterFigures, timeline);
  const flashcards = buildFlashcards(config, vocabulary, chapterFigures, timeline);
  const periodNumber = Number(config.periodId.replace("p", ""));
  const periodMeta = PERIOD_META[config.periodId];
  const contextImage = images[0] ? { imageId: images[0].imageId, placement: "afterOverview", displayCaption: images[0].caption } : null;

  return {
    chapterId: config.chapterId,
    chapterNum: config.chapterNum,
    periodId: config.periodId,
    chapterOrder: config.chapterNum,
    images,
    chapterMeta: {
      period: periodMeta.label,
      periodId: config.periodId,
      dateRange: config.dateRange,
      apExamWeight: periodMeta.weight,
      chapterTitle: config.title,
      chapterSubtitle: config.chapterSubtitle,
      bigPictureThemes: config.bigPictureThemes,
      oneLineSummary: buildVocabularyExplanation(
        intro.introParagraphs.slice(0, 2).join(" "),
        config.chapterSubtitle
      ),
      periodContext: config.periodContext,
      examTips: buildExamTips(config, sections)
    },
    notes: {
      historicalContext: {
        overview: historicalContext,
        precedingCauses: intro.focusQuestions.slice(0, 3).map((question) => question.replace(/\?$/, "")),
        geographicContext: `${config.title} connected national debates to wider regional, territorial, and international developments in ways that reshaped the United States beyond a single city or state.`,
        contextImage
      },
      sections,
      overarchingAnalysis: buildOverarchingAnalysis(config, sections)
    },
    chapterTimeline: timeline,
    periodTimelineEvents: timeline,
    periodTimeline: timeline,
    overallTimelineEvents: buildOverallTimelineEvents(timeline, periodNumber),
    vocabulary,
    essayPractice,
    mcqQuestions,
    flashcards
  };
}

function writeChapterFile(data) {
  const outputPath = path.join(ROOT, `chapter${data.chapterNum}-data.js`);
  fs.writeFileSync(outputPath, `window.chapter${data.chapterNum}Data = ${JSON.stringify(data, null, 2)};\n`);
}

function main() {
  const built = [];

  Object.values(CHAPTER_CONFIGS)
    .sort((left, right) => left.chapterNum - right.chapterNum)
    .forEach((config) => {
      const data = buildChapterData(config);
      writeChapterFile(data);
      built.push({
        chapterId: data.chapterId,
        images: data.images.length,
        sections: data.notes.sections.length,
        vocabulary: data.vocabulary.length,
        timeline: data.chapterTimeline.length,
        mcq: data.mcqQuestions.length,
        flashcards: data.flashcards.length
      });
    });

  built.forEach((item) => {
    console.log(`${item.chapterId}: ${item.images} images, ${item.sections} sections, ${item.vocabulary} vocab, ${item.timeline} timeline, ${item.mcq} MCQ, ${item.flashcards} flashcards`);
  });
}

main();
