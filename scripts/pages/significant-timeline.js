(function () {
  const data = window.significantTimelineData || { events: [] };
  const eventContentById = {
    "columbian-exchange": {
      summary: "The Columbian Exchange tied the Americas, Europe, and Africa into a new Atlantic system of disease, crops, animals, and coerced labor.",
      cause: "European voyages after 1492 created sustained contact between the Eastern and Western Hemispheres.",
      effect: "Native populations collapsed from disease while new crops, plantation labor, and imperial rivalry reshaped Atlantic economies."
    },
    jamestown: {
      summary: "Jamestown became the first permanent English colony and showed that tobacco, fragile survival, and Native conflict would shape Chesapeake development.",
      cause: "England wanted a profitable foothold in North America to compete with Spain and France.",
      effect: "Virginia survived through tobacco exports, expanded plantation labor, and intensified warfare with Powhatan peoples."
    },
    "1619-turning-point": {
      summary: "In 1619 Virginia institutionalized both representative government and the early foundations of racialized unfree labor.",
      cause: "The colony needed a political structure for settlers and a larger labor force for tobacco expansion.",
      effect: "English America developed local self-rule at the same time it moved toward hereditary racial slavery."
    },
    "bacons-rebellion": {
      summary: "Bacon's Rebellion exposed deep tensions between frontier settlers and Chesapeake elites in late seventeenth-century Virginia.",
      cause: "Western settlers resented elite control, limited political access, and weak protection during frontier conflict.",
      effect: "Planters reduced dependence on indentured servants and expanded racial slavery as a more controllable labor system."
    },
    "first-great-awakening": {
      summary: "The First Great Awakening spread revivalism across the colonies and weakened deference to established religious authority.",
      cause: "Many colonists reacted against formal church hierarchies and wanted a more emotional, personal religious experience.",
      effect: "The movement encouraged popular participation and habits of challenging authority that later influenced politics."
    },
    "french-indian-war": {
      summary: "The French and Indian War removed France from mainland North America but created the imperial tensions that pushed Britain and its colonies apart.",
      cause: "Britain and France competed for control of the Ohio Valley and the North American interior.",
      effect: "British victory brought new territory, debt, taxes, and western restrictions that fed colonial resistance."
    },
    "declaration-independence": {
      summary: "The Declaration transformed protest into an independence movement grounded in Enlightenment ideas about natural rights and popular sovereignty.",
      cause: "Years of imperial taxation, military coercion, and failed reconciliation convinced many colonists that separation was necessary.",
      effect: "It justified revolution, united support for independence, and provided language later used by abolitionists and reformers."
    },
    "constitution-ratification": {
      summary: "The Constitution replaced the Articles with a stronger federal framework while preserving major compromises over representation and slavery.",
      cause: "Economic weakness, interstate conflict, and unrest like Shays' Rebellion exposed the limits of the Articles of Confederation.",
      effect: "The new government gained taxing and governing power, but sectional and democratic conflicts were built into the system."
    },
    "whiskey-rebellion": {
      summary: "The Whiskey Rebellion became an early test of whether the new federal government could enforce national law.",
      cause: "Western farmers opposed Hamilton's excise tax and saw it as unfair to frontier producers.",
      effect: "Washington's response confirmed federal authority and showed the Constitution created a stronger state than the Articles."
    },
    "louisiana-purchase": {
      summary: "The Louisiana Purchase dramatically expanded U.S. territory and strengthened Jeffersonian hopes for an agrarian republic.",
      cause: "France's willingness to sell and U.S. concern over access to the Mississippi River created an unexpected opportunity.",
      effect: "The purchase doubled national size, accelerated westward expansion, and reopened disputes over slavery in new territories."
    },
    "erie-canal": {
      summary: "The Erie Canal became a signature project of the Market Revolution by linking western producers to eastern and international markets.",
      cause: "Growing commerce created demand for cheaper, faster transportation between the interior and the Atlantic coast.",
      effect: "Regional trade increased, commercial farming expanded, and New York City emerged as the nation's leading port."
    },
    "indian-removal": {
      summary: "Indian removal showed how Jacksonian expansion and white democracy advanced through federal coercion against Native nations.",
      cause: "Southern land hunger, cotton expansion, and pressure for white settlement drove removal policy.",
      effect: "Native peoples were forced west, tribal sovereignty weakened, and the Trail of Tears became a symbol of violent expansion."
    },
    "nullification-crisis": {
      summary: "The Nullification Crisis tested whether states could block federal law and exposed the fragility of the Union before the Civil War.",
      cause: "South Carolina argued the tariff favored northern interests and hurt the plantation South.",
      effect: "Jackson defended federal supremacy, a temporary compromise eased the dispute, and sectional arguments over sovereignty hardened."
    },
    "seneca-falls": {
      summary: "The Seneca Falls Convention launched an organized women's rights movement by applying revolutionary equality language to gender.",
      cause: "Women reformers frustrated by exclusion from abolition and public politics pushed for a separate rights movement.",
      effect: "The Declaration of Sentiments framed suffrage and legal equality as national issues and energized later activism."
    },
    "mexican-american-war": {
      summary: "The Mexican-American War fulfilled Manifest Destiny for many Americans but made the expansion of slavery unavoidable in national politics.",
      cause: "Annexation of Texas and Polk's expansionist agenda heightened tensions and led to war with Mexico.",
      effect: "The United States gained the Southwest, and sectional conflict intensified over whether slavery would expand west."
    },
    "compromise-1850": {
      summary: "The Compromise of 1850 temporarily postponed disunion while deepening sectional anger through the Fugitive Slave Act.",
      cause: "The Mexican Cession forced Congress to decide the status of slavery in large new western territories.",
      effect: "Short-term compromise preserved the Union, but harsher fugitive enforcement radicalized northern opposition to slavery."
    },
    "kansas-nebraska": {
      summary: "The Kansas-Nebraska Act shattered the Missouri Compromise and turned sectional disagreement into direct political and physical conflict.",
      cause: "Stephen Douglas promoted popular sovereignty to organize western territories and support a transcontinental railroad route.",
      effect: "Bleeding Kansas, party realignment, and rising Republican strength pushed the nation closer to civil war."
    },
    "dred-scott": {
      summary: "Dred Scott v. Sandford nationalized the slavery controversy by denying black citizenship and limiting congressional power over the territories.",
      cause: "Slaveholders and their allies sought Supreme Court protection for slavery's expansion into the West.",
      effect: "The ruling outraged Republicans, discredited compromise, and intensified fears of a slave power conspiracy."
    },
    "civil-war": {
      summary: "The Civil War decided the fate of the Union and slavery while expanding the reach of the federal state.",
      cause: "Secession followed the long sectional conflict over slavery, states' rights, and the election of Abraham Lincoln.",
      effect: "The Union survived, slavery was destroyed, and wartime mobilization strengthened national power and industry."
    },
    "emancipation-proclamation": {
      summary: "The Emancipation Proclamation turned Union victory into a war for freedom and tied military success to slavery's destruction.",
      cause: "Lincoln used wartime powers after early military struggle made a limited war strategy unsustainable.",
      effect: "It weakened the Confederacy, encouraged black enlistment, and discouraged foreign recognition of the South."
    },
    "reconstruction-amendments": {
      summary: "Reconstruction legislation and the 13th, 14th, and 15th Amendments created the broadest expansion of black citizenship in the nineteenth century.",
      cause: "Union victory and emancipation forced the nation to redefine freedom, citizenship, and political rights in the South.",
      effect: "Formerly enslaved people gained constitutional protections, though white resistance quickly challenged enforcement."
    },
    "compromise-1877": {
      summary: "The Compromise of 1877 ended federal Reconstruction and marked a turning point from black political gains to white southern redemption.",
      cause: "A disputed presidential election led national Republicans and Democrats to negotiate a settlement.",
      effect: "Federal troops withdrew, Redeemer governments consolidated power, and Jim Crow conditions expanded."
    },
    "haymarket-affair": {
      summary: "The Haymarket Affair linked labor unrest to fears of radicalism and weakened public support for broad worker organizing.",
      cause: "Harsh industrial labor conditions and strikes over the eight-hour day led activists to mass protest in Chicago.",
      effect: "A bombing triggered repression, damaged the Knights of Labor, and intensified suspicion of labor radicals."
    },
    "populist-party": {
      summary: "The Populist movement turned farmer and debtor frustration into a national challenge to Gilded Age corporate power.",
      cause: "Low crop prices, railroad rates, debt, and tight money policies squeezed rural producers.",
      effect: "The Omaha Platform popularized reform ideas that later influenced Progressives, including regulation and electoral change."
    },
    "dawes-act": {
      summary: "The Dawes Act tried to dissolve tribal life by replacing communal landholding with individual allotments.",
      cause: "Federal policymakers embraced assimilation and wanted easier access to Native land for white settlement.",
      effect: "Tribal landholdings shrank dramatically, Native sovereignty weakened, and cultural disruption deepened."
    },
    "plessy-v-ferguson": {
      summary: "Plessy v. Ferguson gave constitutional protection to Jim Crow by endorsing separate but equal.",
      cause: "Southern states built segregation laws as Reconstruction ended and white supremacy reasserted itself.",
      effect: "Segregation spread with legal backing, making future civil-rights challenges much harder."
    },
    "spanish-american-war": {
      summary: "The Spanish-American War pushed the United States beyond continental expansion into overseas empire.",
      cause: "Expansionist sentiment, sympathy for Cuban rebels, and the explosion of the USS Maine fueled war fever.",
      effect: "The United States gained island territories, intervened more aggressively abroad, and sparked anti-imperialist debate."
    },
    "triangle-fire": {
      summary: "The Triangle Shirtwaist Fire exposed the human cost of unregulated industrial labor in the urban economy.",
      cause: "Factory owners prioritized output over safety in crowded garment shops employing immigrant women.",
      effect: "Public outrage strengthened Progressive campaigns for workplace regulation and labor reform."
    },
    "federal-reserve-act": {
      summary: "The Federal Reserve Act created a central banking system designed to stabilize credit and modernize financial governance.",
      cause: "Repeated financial panics convinced reformers that the national banking system was too weak and fragmented.",
      effect: "The federal government gained a lasting tool for managing money, credit, and banking crises."
    },
    "us-entry-wwi": {
      summary: "U.S. entry into World War I transformed the federal state through mass mobilization, intervention abroad, and repression at home.",
      cause: "German unrestricted submarine warfare and the Zimmermann Telegram helped push the United States into the war.",
      effect: "Washington directed production and opinion more aggressively, while dissenters faced new limits on civil liberties."
    },
    "nineteenth-amendment": {
      summary: "The 19th Amendment marked a major democratic expansion by granting women the vote nationwide.",
      cause: "Decades of suffrage activism and women's wartime service strengthened demands for national political inclusion.",
      effect: "Women gained constitutional voting rights, though racial discrimination still limited many women of color."
    },
    "stock-market-crash": {
      summary: "The crash and Great Depression shattered confidence in laissez-faire economics and exposed structural weakness in modern capitalism.",
      cause: "Speculation, weak banking regulation, overproduction, and unequal wealth made the economy unstable by 1929.",
      effect: "Mass unemployment and financial collapse opened the way for New Deal experimentation and federal activism."
    },
    "new-deal": {
      summary: "The New Deal redefined liberalism by making the federal government responsible for relief, recovery, reform, and long-term security.",
      cause: "The depth of the Great Depression discredited limited government responses and created demand for aggressive action.",
      effect: "Washington expanded regulation, labor protections, and social welfare, even as exclusions and inequalities remained."
    },
    "wwii-mobilization": {
      summary: "World War II mobilization ended the Depression and made the United States the leading industrial and military power.",
      cause: "The attack on Pearl Harbor brought the United States fully into a global war requiring total mobilization.",
      effect: "Production and employment surged, U.S. power expanded, and wartime contradictions over race and liberty became more visible."
    },
    "truman-doctrine": {
      summary: "The Truman Doctrine framed the Cold War as a long-term U.S. commitment to contain communism worldwide.",
      cause: "Postwar instability in Greece and Turkey convinced U.S. leaders that Soviet influence had to be checked.",
      effect: "Containment guided American foreign policy and justified a larger permanent national-security state."
    },
    "brown-v-board": {
      summary: "Brown v. Board declared segregated public education unconstitutional and struck at the legal core of Jim Crow.",
      cause: "NAACP litigation challenged separate schooling as inherently unequal under the 14th Amendment.",
      effect: "The ruling energized civil-rights activism but also provoked massive southern resistance."
    },
    "civil-rights-acts": {
      summary: "The Civil Rights Act of 1964 and Voting Rights Act of 1965 produced the most powerful federal protection of black rights since Reconstruction.",
      cause: "Grassroots protest, media coverage of violence, and Cold War pressure forced national leaders to act.",
      effect: "Legal segregation and many voting barriers fell, greatly expanding black political participation."
    },
    "great-society": {
      summary: "The Great Society represented the high point of postwar liberal reform through anti-poverty, education, health, and rights legislation.",
      cause: "Economic prosperity and Democratic congressional strength gave Lyndon Johnson room for ambitious domestic reform.",
      effect: "Medicare, Medicaid, and other programs expanded the welfare state, though backlash soon grew."
    },
    "vietnam-escalation": {
      summary: "Vietnam escalation and the Tet Offensive exposed the limits of containment and widened the credibility gap at home.",
      cause: "Cold War policymakers treated Vietnam as a test of U.S. resolve against communist expansion.",
      effect: "Escalation fueled antiwar protest, weakened trust in officials, and constrained future intervention."
    },
    watergate: {
      summary: "Watergate revealed how far executive power had expanded and deepened public distrust after the 1960s.",
      cause: "Nixon's reelection machinery and White House secrecy produced illegal surveillance, break-ins, and a cover-up.",
      effect: "Nixon resigned, Congress pursued reform, and cynicism about government intensified."
    },
    "roe-v-wade": {
      summary: "Roe v. Wade nationalized abortion rights by grounding them in constitutional privacy doctrine.",
      cause: "Feminist activism and court challenges pushed the Supreme Court to review state abortion restrictions.",
      effect: "The decision expanded reproductive rights but also became a durable source of religious and partisan mobilization."
    },
    "reagan-revolution": {
      summary: "The Reagan Revolution marked a conservative political realignment against New Deal liberalism and 1960s reform culture.",
      cause: "Stagflation, tax revolt politics, and backlash against liberal government helped build a new conservative coalition.",
      effect: "Tax cuts, deregulation, anti-union politics, and the rise of the New Right reshaped national policy and debate."
    },
    "end-cold-war": {
      summary: "The end of the Cold War left the United States in a dominant global position but without its old organizing rivalry.",
      cause: "Soviet economic weakness, reform, and eastern European revolutions undermined communist rule.",
      effect: "The United States entered a unipolar moment and had to redefine foreign-policy priorities after containment."
    },
    nafta: {
      summary: "NAFTA symbolized the bipartisan embrace of globalization and freer trade in the post-Cold War economy.",
      cause: "Leaders in North America sought deeper economic integration and greater competitiveness through trade liberalization.",
      effect: "Cross-border trade grew, but fears of deindustrialization and weaker labor leverage intensified."
    },
    "nine-eleven": {
      summary: "September 11 reordered U.S. policy around counterterrorism, overseas war, and domestic security.",
      cause: "Al-Qaeda's attacks exposed vulnerabilities created by transnational terrorism and limited preattack coordination.",
      effect: "The United States invaded Afghanistan, expanded surveillance, and centered foreign policy on the War on Terror."
    },
    "great-recession": {
      summary: "The Great Recession revealed major weaknesses in finance, housing, and inequality inside the modern U.S. economy.",
      cause: "Risky mortgage lending, housing speculation, and complex financial instruments destabilized the banking system.",
      effect: "Bailouts and stimulus prevented deeper collapse, but anger over inequality and institutions intensified."
    }
  };
  const allEvents = Array.isArray(data.events)
    ? data.events.map((event) => ({
        ...event,
        ...(eventContentById[event.id] || {})
      }))
    : [];
  const periodMeta = typeof window.getApushPeriodMeta === "function"
    ? window.apushPeriodCatalog || []
    : [];
  const periodMetaById = new Map((periodMeta || []).map((period) => [period.id, period]));
  const state = {
    query: "",
    activePeriod: "all",
    activeCategory: "all"
  };

  const heroEventCount = document.getElementById("hero-event-count");
  const heroPeriodCount = document.getElementById("hero-period-count");
  const heroRange = document.getElementById("hero-range");
  const scopeNote = document.getElementById("scope-note");
  const strategyNote = document.getElementById("strategy-note");
  const periodFilters = document.getElementById("period-filter-list");
  const categoryFilters = document.getElementById("category-filter-list");
  const jumpLinks = document.getElementById("period-jump-links");
  const resultSummary = document.getElementById("results-summary");
  const sectionsRoot = document.getElementById("timeline-sections");
  const searchInput = document.getElementById("timeline-search");
  const clearButton = document.getElementById("clear-timeline-search");

  const normalize = (value) => String(value || "").trim().toLowerCase();
  const escapeHtml = (value) => String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  const getSortYear = (value) => Number(String(value || "").match(/\d{4}/)?.[0] || 0);

  const buildHaystack = (event) => [
    event.year,
    event.title,
    event.summary,
    event.cause,
    event.effect,
    event.category,
    ...(event.essayAngles || [])
  ].join(" ").toLowerCase();

  const sortedPeriods = Array.from(new Set(allEvents.map((event) => event.periodId)))
    .map((periodId) => periodMetaById.get(periodId) || { id: periodId, number: Number.MAX_SAFE_INTEGER, short: periodId.toUpperCase(), label: periodId.toUpperCase(), range: "" })
    .sort((left, right) => (left.number || Number.MAX_SAFE_INTEGER) - (right.number || Number.MAX_SAFE_INTEGER));

  const categories = Array.from(new Set(allEvents.map((event) => event.category))).sort();

  const getFilteredEvents = () => {
    const query = normalize(state.query);

    return allEvents
      .filter((event) => {
        const matchesPeriod = state.activePeriod === "all" || event.periodId === state.activePeriod;
        const matchesCategory = state.activeCategory === "all" || event.category === state.activeCategory;

        if (!matchesPeriod || !matchesCategory) {
          return false;
        }

        if (!query) {
          return true;
        }

        return buildHaystack(event).includes(query);
      })
      .sort((left, right) => getSortYear(left.year) - getSortYear(right.year));
  };

  const getVisiblePeriods = (events) => {
    const counts = new Map();

    events.forEach((event) => {
      counts.set(event.periodId, (counts.get(event.periodId) || 0) + 1);
    });

    return sortedPeriods
      .map((period) => ({
        ...period,
        count: counts.get(period.id) || 0
      }))
      .filter((period) => period.count > 0);
  };

  const renderHero = () => {
    const years = allEvents.map((event) => getSortYear(event.year)).filter((year) => Number.isFinite(year) && year > 0);
    if (heroEventCount) {
      heroEventCount.textContent = String(allEvents.length);
    }
    if (heroPeriodCount) {
      heroPeriodCount.textContent = String(sortedPeriods.length);
    }
    if (heroRange) {
      heroRange.textContent = years.length ? `${Math.min(...years)}-${Math.max(...years)}` : "n/a";
    }
    if (scopeNote) {
      scopeNote.textContent = data.scopeNote || "";
    }
    if (strategyNote) {
      strategyNote.textContent = data.strategyNote || "";
    }
  };

  const renderPeriodFilters = () => {
    if (!periodFilters) {
      return;
    }

    const counts = new Map();
    allEvents.forEach((event) => {
      counts.set(event.periodId, (counts.get(event.periodId) || 0) + 1);
    });

    periodFilters.innerHTML = [
      `<button class="filter-pill${state.activePeriod === "all" ? " is-active" : ""}" type="button" data-period-filter="all" aria-pressed="${state.activePeriod === "all"}"><span>All Periods</span><strong>${allEvents.length}</strong></button>`,
      ...sortedPeriods.map((period) => `
        <button class="filter-pill${state.activePeriod === period.id ? " is-active" : ""}" type="button" data-period-filter="${escapeHtml(period.id)}" aria-pressed="${state.activePeriod === period.id}">
          <span>${escapeHtml(period.short || period.label)}</span>
          <strong>${counts.get(period.id) || 0}</strong>
        </button>
      `)
    ].join("");
  };

  const renderCategoryFilters = () => {
    if (!categoryFilters) {
      return;
    }

    const counts = new Map();
    allEvents.forEach((event) => {
      counts.set(event.category, (counts.get(event.category) || 0) + 1);
    });

    categoryFilters.innerHTML = [
      `<button class="filter-pill${state.activeCategory === "all" ? " is-active" : ""}" type="button" data-category-filter="all" aria-pressed="${state.activeCategory === "all"}"><span>All Categories</span><strong>${allEvents.length}</strong></button>`,
      ...categories.map((category) => `
        <button class="filter-pill${state.activeCategory === category ? " is-active" : ""}" type="button" data-category-filter="${escapeHtml(category)}" aria-pressed="${state.activeCategory === category}">
          <span>${escapeHtml(category)}</span>
          <strong>${counts.get(category) || 0}</strong>
        </button>
      `)
    ].join("");
  };

  const renderJumpLinks = (visiblePeriods) => {
    if (!jumpLinks) {
      return;
    }

    jumpLinks.innerHTML = visiblePeriods.map((period) => `
      <a class="jump-link" href="#period-${escapeHtml(period.id)}">
        <span>${escapeHtml(period.short || period.label)}</span>
        <strong>${period.count}</strong>
      </a>
    `).join("");
  };

  const renderSummary = (events, visiblePeriods) => {
    if (!resultSummary) {
      return;
    }

    const activePeriodLabel = state.activePeriod === "all"
      ? "all periods"
      : (periodMetaById.get(state.activePeriod)?.label || state.activePeriod.toUpperCase());
    const activeCategoryLabel = state.activeCategory === "all" ? "all categories" : state.activeCategory;
    const queryLabel = normalize(state.query) ? ` for "${state.query.trim()}"` : "";

    resultSummary.textContent = `Showing ${events.length} major event${events.length === 1 ? "" : "s"} across ${visiblePeriods.length} visible period${visiblePeriods.length === 1 ? "" : "s"} in ${activePeriodLabel} and ${activeCategoryLabel}${queryLabel}.`;
  };

  const renderSections = (events, visiblePeriods) => {
    if (!sectionsRoot) {
      return;
    }

    if (!events.length) {
      sectionsRoot.innerHTML = `
        <section class="empty-state">
          <h3>No major events matched that filter.</h3>
          <p>Try a broader period, a broader category, or search a bigger term like New Deal, civil rights, labor, or Cold War.</p>
          <button class="reset-button" type="button" id="reset-significant-timeline">Reset Filters</button>
        </section>
      `;
      document.getElementById("reset-significant-timeline")?.addEventListener("click", resetFilters);
      return;
    }

    const grouped = new Map();
    visiblePeriods.forEach((period) => grouped.set(period.id, []));
    events.forEach((event) => {
      if (grouped.has(event.periodId)) {
        grouped.get(event.periodId).push(event);
      }
    });

    sectionsRoot.innerHTML = visiblePeriods.map((period) => `
      <section class="period-section" id="period-${escapeHtml(period.id)}">
        <div class="period-head">
          <div>
            <span class="eyebrow">${escapeHtml(period.label || period.short || period.id.toUpperCase())}</span>
            <h2>${escapeHtml(period.range || period.short || period.id.toUpperCase())}</h2>
          </div>
          <div class="period-meta">
            <strong>${period.count}</strong>
            <span>major event${period.count === 1 ? "" : "s"}</span>
          </div>
        </div>
        <div class="event-grid">
          ${(grouped.get(period.id) || []).map((event) => `
            <article class="event-card" id="${escapeHtml(event.id)}">
              <div class="event-topline">
                <span class="year-badge">${escapeHtml(event.year)}</span>
                <span class="event-category">${escapeHtml(event.category)}</span>
              </div>
              <h3>${escapeHtml(event.title)}</h3>
              <p class="event-summary">${escapeHtml(event.summary)}</p>
              <div class="event-detail-grid">
                <div class="event-block event-detail-card">
                  <p class="block-label">Cause</p>
                  <p class="event-detail-copy">${escapeHtml(event.cause)}</p>
                </div>
                <div class="event-block event-detail-card">
                  <p class="block-label">Effect</p>
                  <p class="event-detail-copy">${escapeHtml(event.effect)}</p>
                </div>
              </div>
              <div class="angle-row">
                ${(event.essayAngles || []).map((angle) => `<span class="angle-chip">${escapeHtml(angle)}</span>`).join("")}
              </div>
            </article>
          `).join("")}
        </div>
      </section>
    `).join("");
  };

  const resetFilters = () => {
    state.query = "";
    state.activePeriod = "all";
    state.activeCategory = "all";
    if (searchInput) {
      searchInput.value = "";
    }
    render();
  };

  const render = () => {
    const events = getFilteredEvents();
    const visiblePeriods = getVisiblePeriods(events);
    renderPeriodFilters();
    renderCategoryFilters();
    renderJumpLinks(visiblePeriods);
    renderSummary(events, visiblePeriods);
    renderSections(events, visiblePeriods);

    if (clearButton) {
      clearButton.disabled = !normalize(state.query) && state.activePeriod === "all" && state.activeCategory === "all";
    }
  };

  periodFilters?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-period-filter]");
    if (!button) {
      return;
    }

    state.activePeriod = button.dataset.periodFilter || "all";
    render();
  });

  categoryFilters?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category-filter]");
    if (!button) {
      return;
    }

    state.activeCategory = button.dataset.categoryFilter || "all";
    render();
  });

  searchInput?.addEventListener("input", (event) => {
    state.query = event.target.value || "";
    render();
  });

  clearButton?.addEventListener("click", resetFilters);

  renderHero();
  render();
})();
