const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const CHAPTERS = [23, 24, 25, 26, 27, 28];
const PERIOD_NUMBER = {
  p1: 1,
  p2: 2,
  p3: 3,
  p4: 4,
  p5: 5,
  p6: 6,
  p7: 7,
  p8: 8,
  p9: 9
};

const MANUAL_SECTION_OVERRIDES = {
  27: {
    "The Post-Cold War World": {
      narrative: "The end of the Cold War convinced many Americans that the United States had entered a unipolar age in which free markets, democracy, and U.S. military power had decisively won. George H. W. Bush tested that assumption first in Panama, where U.S. troops removed Manuel Noriega in 1989 and showed that intervention in the Western Hemisphere continued even without a Soviet rival. The larger test came in 1990, when Iraq invaded Kuwait and threatened the oil-rich Persian Gulf. Bush assembled a broad international coalition, secured U.N. backing, and launched Operation Desert Storm, which expelled Iraqi forces from Kuwait in early 1991 with overwhelming American military superiority. Yet the war also left Saddam Hussein in power, produced sanctions and a long-term U.S. troop presence in the Gulf, and tied American strategy more closely to Middle Eastern stability and oil. At the same time, ethnic violence in places such as the Balkans showed that the Soviet collapse had not created a simple or peaceful world order. For APUSH, this section matters because it explains how the United States moved from Cold War containment to post-Cold War interventionism while still claiming to act in defense of freedom and international order.",
      causes: [
        "The collapse of Soviet power removed the bipolar framework that had guided American foreign policy since 1945.",
        "Iraq's 1990 invasion of Kuwait raised fears that Saddam Hussein might dominate Persian Gulf oil supplies and threaten regional allies.",
        "Bush administration confidence in U.S. military and diplomatic leadership encouraged intervention under the language of a 'new world order.'"
      ],
      effects: [
        "Operation Desert Storm restored Kuwaiti independence and demonstrated overwhelming U.S. military superiority in the post-Cold War world.",
        "Sanctions on Iraq and a lasting American military presence in the Persian Gulf deepened U.S. involvement in Middle Eastern affairs.",
        "The success of the Gulf War encouraged later presidents to believe that American power could reorder unstable regions quickly and at limited cost."
      ],
      significance: "APUSH uses the Gulf War and the Soviet collapse to show how U.S. foreign policy changed after containment while preserving the older habit of linking intervention to freedom, order, and American leadership."
    },
    "Globalization and its Discontents": {
      narrative: "In the 1990s, globalization became the central process reshaping the American economy, as capital, goods, information, and labor moved across borders with increasing speed. New trade agreements, global supply chains, and the growth of technology firms tied American prosperity more directly to world markets than ever before. Supporters argued that freer trade and international institutions such as the World Trade Organization would promote efficiency, lower prices, and spread democracy and consumer choice. Critics answered that corporations were moving production abroad to exploit cheap labor and weak environmental rules, while workers and local communities in the United States lost bargaining power and stable manufacturing jobs. The 1999 protests in Seattle brought labor activists, environmentalists, and antiglobalization critics together in a dramatic challenge to corporate-led integration. At the same time, NAFTA, expanding trade with Mexico and China, and the rise of the internet made globalization feel immediate in workplaces, shopping habits, and political debate. This section is essential for APUSH because it connects deindustrialization, inequality, migration debates, and the new politics of protest in the late twentieth century.",
      causes: [
        "Corporations sought lower production costs through overseas manufacturing, deregulated finance, and transnational supply chains.",
        "Trade agreements such as NAFTA and institutions such as the WTO accelerated cross-border exchange and investment.",
        "Personal computers, the internet, and faster communication made global markets more integrated and visible in everyday life."
      ],
      effects: [
        "Manufacturing employment and industrial regions in the United States continued to weaken as production moved abroad.",
        "Seattle's 1999 WTO protests turned globalization into a major political controversy rather than a purely economic trend.",
        "Americans increasingly linked trade, immigration, wage pressure, and corporate power in debates that carried into the twenty-first century."
      ],
      significance: "This section matters because AP questions often connect globalization to deindustrialization, new protest movements, and the realignment of both labor politics and immigration politics after 1970."
    },
    "Culture Wars": {
      narrative: "By the 1990s, American politics was no longer organized mainly around Cold War consensus but around fierce arguments over identity, morality, citizenship, and public memory. Immigration after 1965 had transformed the nation's demographic makeup, making multiculturalism, bilingual education, and the meaning of national identity recurring political flashpoints. Supporters of multiculturalism argued that schools and public culture should recognize groups long excluded from national narratives, while conservatives warned that too much emphasis on group difference would weaken national unity and traditional values. The culture wars also included bitter disputes over affirmative action, abortion, same-sex relationships, and the definition of the family. At the same time, mass incarceration expanded state power and fell especially heavily on African Americans and Latinos, making criminal justice a major site of inequality. The AIDS crisis forced public recognition of gay communities and produced new activism, while the Oklahoma City bombing exposed the violent potential of anti-federal extremism. APUSH frequently uses this era to show that the rights revolutions of the 1960s did not end conflict but instead opened a new phase of debate over who belonged, whose history counted, and what freedom should protect.",
      causes: [
        "Post-1965 immigration made the United States more visibly diverse and intensified arguments over language, assimilation, and identity.",
        "The continuing rights revolution encouraged demands for recognition from women, gay Americans, immigrants, and racial minorities.",
        "Conservative backlash against affirmative action, secularization, abortion rights, and changing family norms sharpened partisan conflict."
      ],
      effects: [
        "School curricula, public memory, and national symbols became recurring battlegrounds in elections and media politics.",
        "Mass incarceration became a defining feature of late twentieth-century state power and racial inequality.",
        "Debates over sexuality, family, and belonging helped produce the polarized political culture that carried into Period 9."
      ],
      significance: "APUSH often tests this section through comparison and continuity questions that link late twentieth-century identity debates to earlier fights over immigration, pluralism, civil rights, and citizenship."
    },
    "Impeachment and the Election of 2000": {
      narrative: "Bill Clinton governed during prosperity, but his presidency revealed how deeply partisan and morally charged national politics had become by the 1990s. Clinton often moved toward the political center on welfare, crime, and budget issues, yet conservatives still treated him as a symbol of the cultural and political changes they had opposed since the 1960s. The Monica Lewinsky scandal gave independent counsel Kenneth Starr grounds to investigate whether Clinton had lied under oath, and the House of Representatives impeached him in 1998 on charges including perjury and obstruction of justice. The Senate acquitted Clinton, but the process deepened mistrust rather than settling the conflict. Two years later, the presidential election between George W. Bush and Al Gore turned on disputed ballots in Florida and ended only after the Supreme Court halted the recount in Bush v. Gore. Bush won the Electoral College while Gore won the popular vote, reinforcing the sense that political institutions themselves were becoming objects of suspicion. This section matters for APUSH because it shows how the late twentieth century combined economic growth with institutional fragility, partisan warfare, and a sharp red-blue regional divide.",
      causes: [
        "Partisan hostility toward Clinton persisted even after he embraced centrist policies on welfare, crime, and fiscal discipline.",
        "The Lewinsky scandal and Starr investigation turned private misconduct into a constitutional and partisan crisis.",
        "The 2000 election hinged on razor-thin vote margins in Florida and ambiguities in ballot counting."
      ],
      effects: [
        "Clinton's impeachment intensified cynicism about politics without removing him from office.",
        "Bush v. Gore left many Americans doubting the legitimacy and fairness of the 2000 election outcome.",
        "The election map of 2000 highlighted a durable red-blue polarization that shaped twenty-first-century politics."
      ],
      significance: "This section is AP-relevant because it helps explain the erosion of trust in institutions and the intense partisanship that framed politics before and after 9/11."
    },
    "The Attacks of September 11": {
      narrative: "The terrorist attacks of September 11, 2001, abruptly ended the assumption that the United States could enjoy post-Cold War dominance without major danger at home. Nineteen hijackers seized four commercial airplanes, crashing two into the World Trade Center, one into the Pentagon, and another in Pennsylvania after passengers resisted. The Bush administration identified Al Qaeda, led by Osama bin Laden, as the organizer of the attacks, and Americans quickly linked the crisis to earlier U.S. involvement in the Middle East and Afghanistan. The attacks produced a powerful surge of patriotism, public mourning, and national unity, but they also created a political opening for a much larger security state. Bush framed the moment as a struggle between freedom and fear, using language that connected the response to older wartime traditions in American history. September 11 therefore became not only a human tragedy but also the pivot that reordered foreign policy, civil liberties, and political rhetoric for the next generation. APUSH emphasizes this event because it marks the clearest turning point between the post-Cold War 1990s and the War on Terror era.",
      causes: [
        "Al Qaeda developed out of transnational Islamist militancy shaped partly by the anti-Soviet war in Afghanistan.",
        "Osama bin Laden targeted the United States as the central backer of Middle Eastern regimes and military presence in the region.",
        "The post-Cold War assumption of American safety at home left the nation psychologically unprepared for mass-casualty terrorism."
      ],
      effects: [
        "The attacks generated an outpouring of patriotism and broad support for a forceful federal response.",
        "George W. Bush gained the political authority to redefine foreign and domestic policy around a global war on terrorism.",
        "September 11 became the central reference point for later debates over war, surveillance, immigration, and civil liberties."
      ],
      significance: "APUSH treats 9/11 as a major turning point because it explains both the expansion of American power abroad and the expansion of security powers at home."
    },
    "The War on Terrorism": {
      narrative: "After September 11, the Bush administration transformed retaliation against Al Qaeda into a broad doctrine of global preemption. The United States invaded Afghanistan in 2001 to overthrow the Taliban, destroy terrorist bases, and pursue bin Laden, and the opening phase of the war won wide international support. Bush and his advisers then argued that Iraq's alleged weapons of mass destruction and Saddam Hussein's regime made preemptive war necessary even without a direct link to the September 11 attacks. The 2003 invasion toppled Hussein quickly, but the occupation produced insurgency, sectarian violence, and growing international criticism. Bush described the entire struggle as a defense of freedom against terror and tyranny, echoing older American wartime rhetoric even as the enemy was now a diffuse network rather than a rival superpower. The war in Iraq also revealed the risks of assuming that U.S. military superiority could easily create democratic stability. This section matters because APUSH often asks students to compare the Bush Doctrine to Cold War containment and to evaluate why Afghanistan initially drew support while Iraq became far more divisive.",
      causes: [
        "The shock of 9/11 created broad political support for military action against Al Qaeda and the Taliban.",
        "Bush administration officials embraced the idea that the United States should strike potential threats before they fully emerged.",
        "Claims about Iraqi weapons of mass destruction and regional instability provided the public rationale for invading Iraq in 2003."
      ],
      effects: [
        "The United States removed the Taliban from power in Afghanistan but became committed to a long, unresolved conflict.",
        "The Iraq invasion sparked insurgency, destabilized the region, and damaged American credibility abroad.",
        "Preemptive war enlarged presidential power and deepened domestic and international arguments over the legitimacy of U.S. intervention."
      ],
      significance: "APUSH uses the War on Terror to test comparison, causation, and argumentation, especially around preemption, intervention, and the limits of American power after the Cold War."
    },
    "The Aftermath of September 11 at Home": {
      narrative: "At home, September 11 produced one of the largest expansions of federal security power in modern American history. Congress passed the USA PATRIOT Act with little debate, greatly widening surveillance authority and intelligence sharing in the name of preventing another attack. The administration also authorized military tribunals, indefinite detention for some suspects, and the classification of even U.S. citizens as enemy combatants in certain cases. Supporters argued that unconventional terrorism required speed, secrecy, and broader police powers, while critics warned that vague definitions and secret procedures threatened constitutional protections. The abuse of prisoners at Abu Ghraib and the detention regime at Guantanamo Bay weakened the moral language through which the United States claimed to defend freedom. Everyday life also changed through airport screening, data collection, and heightened suspicion toward Muslim Americans and immigrants. This section is central to APUSH because it invites comparison with earlier wartime restrictions on liberty, from World War I repression to Japanese internment and McCarthy-era loyalty politics.",
      causes: [
        "Fear of another large-scale terrorist attack created bipartisan support for stronger surveillance and intelligence tools.",
        "The Bush administration argued that old legal procedures were inadequate against a hidden, nonstate enemy.",
        "Congressional urgency after 9/11 reduced scrutiny of new national-security legislation and executive claims."
      ],
      effects: [
        "The PATRIOT Act and related policies expanded surveillance, detention, and executive authority.",
        "Guantanamo, military tribunals, and Abu Ghraib raised major constitutional and human-rights controversies.",
        "A stronger and more permanent security state became part of normal American political life after 2001."
      ],
      significance: "This section matters because APUSH often asks students to weigh security against liberty and to compare post-9/11 policies with earlier moments when war narrowed civil liberties."
    },
    "An American Empire?": {
      narrative: "The Iraq War revived an old question in a new form: had the United States become an empire even without formal colonies? In the early twenty-first century, the nation still possessed unmatched military, economic, and cultural influence, along with bases and alliances that stretched across the globe. Supporters of U.S. policy argued that American power was being used to remove dictators, defend allies, and spread democracy rather than to rule subject peoples directly. Critics responded that preemptive war, occupation, and the centrality of oil made Iraq look less like liberation than imperial domination. The gap between the administration's optimism and the reality of insurgency, sectarian conflict, and mounting casualties sharpened those doubts. As the war dragged on, more Americans compared Iraq to Vietnam as a costly conflict fought in the name of freedom without a convincing path to victory. APUSH emphasizes this debate because it captures the tension between American exceptionalist rhetoric and the coercive realities of global power in Period 9.",
      causes: [
        "The Soviet collapse left the United States with unmatched global reach and few external constraints on intervention.",
        "The Iraq invasion and long occupation made Americans confront how military power could resemble imperial control.",
        "Strategic concern with oil, regional stability, and unilateral action fueled criticism of U.S. motives."
      ],
      effects: [
        "Debates over whether the United States was an empire intensified as Iraq became longer, bloodier, and more unstable.",
        "International criticism and antiwar protest weakened the moral authority of the Bush administration's freedom rhetoric.",
        "Comparisons between Iraq and Vietnam highlighted recurring limits on American power despite military superiority."
      ],
      significance: "This section is important because AP essays often ask students to judge whether post-Cold War intervention represented a new form of empire or a continuation of older American global ambitions."
    }
  },
  28: {
    "The Winds of Change": {
      narrative: "Before the 2008 financial collapse, George W. Bush's second term was already being undermined by war fatigue, demographic change, and doubts about government competence. The Iraq War steadily eroded confidence in presidential leadership and weakened the Republican claim to strong stewardship of national security. Hurricane Katrina in 2005 exposed how poverty, race, and governmental failure could turn a natural disaster into a devastating political indictment, especially in New Orleans. At the same time, large immigration demonstrations showed that Latino political mobilization had become a major national force and that battles over borders and belonging would remain central to politics. Economic growth in the mid-2000s also felt uneven, leaving many Americans convinced that prosperity was bypassing them even before the recession began. Elections in 2004 and 2006 revealed a deeply divided political map, with partisanship becoming more stable rather than less intense. APUSH uses this section to explain why the demand for change in 2008 grew out of accumulated dissatisfaction, not just the banking crisis alone.",
      causes: [
        "The Iraq War damaged public faith in the Bush administration's competence and judgment.",
        "Hurricane Katrina exposed racial inequality and weak government response in a highly visible way.",
        "Immigration growth and economic insecurity intensified conflicts over citizenship, labor, and national identity."
      ],
      effects: [
        "Bush's approval and Republican political strength weakened well before the 2008 election.",
        "Latino political mobilization and immigration protests became a lasting force in national politics.",
        "The political climate increasingly favored candidates promising reform, competence, and a break from Bush-era policies."
      ],
      significance: "This section matters because APUSH often treats Katrina, immigration protest, and Bush's decline as the political context for the 2008 election and the Obama presidency."
    },
    "The Great Recession": {
      narrative: "The Great Recession grew out of years of easy credit, speculative finance, risky mortgages, and a larger economy in which wages were stagnant even as consumption stayed high. Rising home values encouraged Americans to borrow heavily, while lenders bundled mortgages into securities that spread risk throughout the financial system without removing it. When housing prices stopped rising, defaults multiplied and the value of mortgage-backed assets collapsed, pushing major banks and investment firms toward insolvency. The federal government responded with extraordinary rescues, including TARP and other emergency measures, because officials feared total financial breakdown. The result was a severe recession marked by job loss, foreclosure, household insecurity, and anger that elites seemed protected while ordinary families paid the price. The damage fell unevenly, with African American wealth suffering especially deep losses because so much family wealth was concentrated in housing. APUSH emphasizes this crisis because it revived arguments over regulation, inequality, and the proper role of the federal government in stabilizing capitalism.",
      causes: [
        "Low interest rates, speculative finance, and loose lending standards fueled a housing bubble.",
        "Mortgage-backed securities spread housing risk throughout the banking and investment system.",
        "Years of deregulation and debt-driven consumption made the economy more fragile than headline growth suggested."
      ],
      effects: [
        "Bank failures and emergency federal rescues produced intense public anger at financial and political elites.",
        "Foreclosures, unemployment, and slow recovery reshaped political debate about regulation and the social safety net.",
        "The recession widened racial and class inequalities, especially through the destruction of housing-based wealth."
      ],
      significance: "APUSH often uses the Great Recession to test causation and comparison, especially in relation to the Great Depression, the New Deal state, and late twentieth-century deregulation."
    },
    "Obama in Office": {
      narrative: "Barack Obama entered office in 2009 as the first Black president, carrying enormous symbolic weight as well as the immediate burden of economic crisis. His administration passed a large stimulus package that revived a more activist vision of federal responsibility than conservatives had championed since the Reagan years. Obama then secured the Affordable Care Act in 2010, expanding insurance coverage and making health care the signature domestic policy battle of his first term. These initiatives energized fierce backlash from the Tea Party, which cast taxation, stimulus spending, and health reform as proof of federal overreach. Abroad, Obama promised a different tone from the Bush years and tried to close Guantanamo and reduce the emphasis on torture, yet drone warfare and the national-security state remained deeply entrenched. The killing of Osama bin Laden in 2011 gave Obama a major foreign-policy success while also showing how strongly post-9/11 priorities still shaped the presidency. This section matters because APUSH often asks whether Obama's early presidency marked a real break from Reagan-era conservatism or only a limited correction within its political constraints.",
      causes: [
        "The financial collapse of 2008 created pressure for aggressive federal action to stabilize the economy.",
        "Long-running problems in the American health-care system gave Democrats momentum for reform when they controlled Washington.",
        "Bush-era war policies and international image problems created expectations that Obama would change both tone and method abroad."
      ],
      effects: [
        "The stimulus and Affordable Care Act re-centered debates over how far the federal government should go in solving social and economic problems.",
        "The Tea Party movement pushed Republicans toward a sharper anti-government identity and intensified partisan obstruction.",
        "Obama's foreign policy mixed symbolic change with strong continuities in surveillance, drones, and War on Terror structures."
      ],
      significance: "This section is AP-relevant because it ties together federal activism, partisan backlash, and the question of whether the Obama years revived or merely modified older liberal reform traditions."
    },
    "The Obama Presidency": {
      narrative: "Obama's presidency unfolded in a nation where formal rights expanded but economic inequality and racial tension remained deeply entrenched. The recovery from the recession restored growth, yet many middle-income jobs did not return, and wealth remained concentrated at the top. Movements such as Occupy Wall Street attacked the political influence of finance through the language of the '99 percent,' while many Americans still believed banks had emerged from the crisis with too much power. The administration and the Supreme Court also oversaw major civil-rights developments, most notably the recognition of same-sex marriage in Obergefell v. Hodges. At the same time, police violence, mass incarceration, and the unequal burdens of recession helped give rise to Black Lives Matter, which argued that the victories of the civil-rights era had not ended systemic racial injustice. Obama's years therefore combined real change in rights and representation with stubborn continuity in class inequality and racial hierarchy. APUSH uses this section to push students beyond simple celebration or condemnation and toward a more complex argument about reform in an unequal democracy.",
      causes: [
        "The slow and uneven recovery after 2008 left many Americans frustrated with persistent inequality and elite influence.",
        "Long-term racial disparities in wealth, policing, and criminal justice remained visible despite the election of a Black president.",
        "The continuing rights revolution and changing public opinion opened new space for marriage equality and broader social reform."
      ],
      effects: [
        "Occupy Wall Street made inequality a central political issue through the language of the '99 percent.'",
        "Obergefell v. Hodges extended the rights revolution into marriage equality and marked a major cultural shift.",
        "Black Lives Matter forced national debate over policing, structural racism, and the unfinished work of civil rights."
      ],
      significance: "This section is important for APUSH because it highlights the tension between expanded legal rights and persistent structural inequality, a classic complexity point for essays on modern America."
    },
    "President Trump": {
      narrative: "Donald Trump's rise reflected the convergence of anti-establishment anger, racial and cultural backlash, and frustration with both parties after years of slow recovery and intense polarization. The 2016 election also showed a Democratic Party divided between Hillary Clinton's establishment candidacy and Bernie Sanders's left critique of inequality and corporate influence. Trump won the Republican nomination by combining celebrity, nativism, attacks on trade and immigration, and an explicit appeal to voters who felt displaced by demographic and cultural change. Once in office, he made immigration restriction, environmental rollback, and confrontational nationalism central features of his administration. Measures such as the travel ban, detention-centered immigration policy, and aggressive rhetoric about borders turned national membership itself into a defining political issue. Trump's presidency also immediately generated mass resistance, including the Women's March, demonstrating that protest politics remained a major feature of the era. APUSH emphasizes this section because it helps explain how populism, polarization, and executive conflict became central to early twenty-first-century politics.",
      causes: [
        "Economic frustration, distrust of elites, and backlash against demographic and cultural change created a strong anti-establishment mood.",
        "Republican voters were increasingly drawn to hard-line positions on immigration, trade, and national identity.",
        "Democratic divisions between establishment and insurgent wings shaped the political environment of 2016."
      ],
      effects: [
        "Trump's election intensified polarization and made immigration, executive power, and nationalism central political flashpoints.",
        "Environmental deregulation and anti-regulatory rhetoric reshaped federal priorities around energy, climate, and growth.",
        "Large-scale protest mobilization showed that opposition movements would answer Trump-era politics with immediate public action."
      ],
      significance: "This section matters because APUSH often asks why Trump's message resonated and how his presidency reflected longer trends in populism, backlash politics, and distrust of institutions."
    },
    "Freedom in the Twenty-First Century": {
      narrative: "The chapter closes by showing that twenty-first-century Americans still spoke constantly about freedom, but no longer agreed on what the term required. The nation was older, wealthier, more educated, and more diverse than ever before, yet poverty, inequality, infant mortality, and democratic distrust remained serious problems. Some Americans defined freedom primarily through markets, consumer choice, national strength, and protection from government overreach. Others emphasized social rights, protest, historical honesty, and protection from racial, gender, or economic exclusion. These conflicts also shaped public memory, as debates over monuments, curricula, and events such as Charlottesville revealed that the meaning of the American past had become part of the political present. The result was not the collapse of the idea of freedom but a struggle over which freedoms counted most and whose experience would define the national story. APUSH values this section because it invites synthesis, comparison, and complexity by balancing real gains in rights and living standards against enduring inequality and conflict.",
      causes: [
        "Long-term gains in wealth, life expectancy, education, and diversity changed the social landscape of the United States.",
        "Persistent inequality, racial injustice, and political polarization made many Americans question who actually enjoyed freedom in practice.",
        "Conflicts over history, monuments, and public memory turned the national past into a battleground for present-day politics."
      ],
      effects: [
        "Freedom became a contested concept used to defend both market individualism and broader claims to social justice and recognition.",
        "Public memory fights over monuments, curricula, and national symbols intensified culture-war politics.",
        "The early twenty-first century ended with Americans still committed to freedom as an ideal but deeply divided over its meaning."
      ],
      significance: "This section is especially useful for APUSH synthesis and complexity because it forces students to compare competing definitions of freedom across multiple periods of American history."
    }
  }
};

function normalizeText(value) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f\u00a0\u2028\u2029]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadChapterData(chapterNum) {
  const filePath = path.join(ROOT, `chapter${chapterNum}-data.js`);
  const code = fs.readFileSync(filePath, "utf8");
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(code, context);
  return context.window[`chapter${chapterNum}Data`];
}

function writeChapterData(data) {
  const outputPath = path.join(ROOT, `chapter${data.chapterNum}-data.js`);
  fs.writeFileSync(outputPath, `window.chapter${data.chapterNum}Data = ${JSON.stringify(data, null, 2)};\n`);
}

function ensureSentence(value) {
  const text = normalizeText(value);
  if (!text) {
    return "";
  }

  return /[.!?]"?$/.test(text) ? text : `${text}.`;
}

function splitSentences(value) {
  const protectedText = normalizeText(value)
    .replaceAll("U.S.", "__US__")
    .replaceAll("U.N.", "__UN__")
    .replaceAll("v.", "__V__")
    .replaceAll("Mr.", "__MR__")
    .replaceAll("Mrs.", "__MRS__")
    .replaceAll("Ms.", "__MS__")
    .replaceAll("Dr.", "__DR__");

  return protectedText
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence
      .replaceAll("__US__", "U.S.")
      .replaceAll("__UN__", "U.N.")
      .replaceAll("__V__", "v.")
      .replaceAll("__MR__", "Mr.")
      .replaceAll("__MRS__", "Mrs.")
      .replaceAll("__MS__", "Ms.")
      .replaceAll("__DR__", "Dr."))
    .map(normalizeText)
    .filter(Boolean);
}

function compactSentences(sentences) {
  const merged = [];
  const seen = new Set();

  sentences
    .map(ensureSentence)
    .filter(Boolean)
    .forEach((sentence) => {
      if (!sentence) {
        return;
      }

      if (merged.length) {
        const last = merged[merged.length - 1];
        const lastEndsShort = /\b(?:U\.S|U\.N|Mr|Mrs|Ms|Dr|St|Jr|Sr)\.$/.test(last);
        if (lastEndsShort) {
          merged[merged.length - 1] = ensureSentence(`${last.replace(/[.!?]$/, "")} ${sentence}`);
          return;
        }
      }

      const key = sentence.toLowerCase();
      if (seen.has(key)) {
        return;
      }

      seen.add(key);
      merged.push(sentence);
    });

  return merged;
}

function blockToSentences(block) {
  if (!block || typeof block !== "object") {
    return [];
  }

  switch (block.type) {
    case "fact":
      return [block.text];
    case "definition":
      return [
        `The term ${block.term} referred to ${normalizeText(block.definition).replace(/^[A-Z]/, (char) => char.toLowerCase())}.`,
        block.inContext
      ];
    case "stat":
      return [/[A-Za-z].*\s[A-Za-z]/.test(String(block.value || ""))
        ? `${block.value}${block.date ? ` (${block.date})` : ""}.`
        : `${block.label} reached ${block.value}${block.date ? ` in ${block.date}` : ""}.`];
    case "quote":
      return [
        `${block.attribution || "A source from the period"} declared, "${normalizeText(block.text).replace(/[.!?]+$/, "")}."`,
        block.context
      ];
    case "who":
      return compactSentences([
        `${block.name}${block.title ? `, ${block.title},` : ""} ${normalizeText((block.keyActions || []).slice(0, 1).join(" "))}`.trim(),
        (block.keyActions || []).slice(1, 2).join(" "),
        block.legacy || ""
      ]);
    case "chain":
      return (block.steps || []).map((step) => `${ensureSentence(step.event).replace(/[.!?]$/, "")} ${ensureSentence(step.result)}`);
    case "cluster":
      return (block.items || []).map((item) => `${item.name}: ${item.description}${item.date ? ` (${item.date})` : ""}`);
    case "comparison":
      return [
        `${block.itemA?.label} had several defining features: ${(block.itemA?.points || []).join(" ")}`,
        `By contrast, ${String(block.itemB?.label || "").toLowerCase()} had its own defining features: ${(block.itemB?.points || []).join(" ")}`,
        (block.sharedTraits || []).length ? `Despite those differences, both sides shared several traits: ${(block.sharedTraits || []).join(" ")}` : ""
      ];
    case "tension":
      return [
        `${block.sideA?.label} advanced several arguments: ${(block.sideA?.points || []).join(" ")}`,
        `By contrast, ${String(block.sideB?.label || "").toLowerCase()} insisted on a different set of claims: ${(block.sideB?.points || []).join(" ")}`,
        block.outcome
      ];
    default:
      return [];
  }
}

function deriveNarrativeFromStructuredSection(section) {
  const sentences = [];

  sentences.push(...splitSentences(section.overview || ""));

  (section.contentBlocks || []).forEach((block) => {
    sentences.push(...blockToSentences(block));
  });

  const merged = compactSentences(sentences);
  if (merged.length < 5) {
    merged.push(ensureSentence(section.apExamAngles?.[0] || ""));
    merged.push(ensureSentence(section.connections?.[0] || ""));
  }

  return compactSentences(merged).join(" ");
}

function buildKeyFiguresFromStructuredSection(section) {
  return (section.contentBlocks || [])
    .filter((block) => block.type === "who" && block.name)
    .map((block) => ({
      name: block.name,
      title: block.title || "",
      bio: compactSentences([
        `${block.name}${block.title ? ` served as ${block.title}` : ""}.`,
        ...(block.keyActions || []),
        block.legacy || ""
      ]).slice(0, 3).join(" "),
      significance: normalizeText(block.apSignificance || block.legacy || (block.keyActions || []).join(" ")),
      perspective: normalizeText(block.perspective || "")
    }));
}

function deriveCausesFromStructuredSection(section) {
  const chains = (section.contentBlocks || []).filter((block) => block.type === "chain" && Array.isArray(block.steps) && block.steps.length);
  if (chains.length) {
    return compactSentences(chains.flatMap((block) => block.steps.slice(0, Math.max(1, block.steps.length - 1)).map((step) => step.event))).slice(0, 3);
  }

  const fallback = (section.contentBlocks || [])
    .filter((block) => ["fact", "definition", "stat"].includes(block.type))
    .flatMap((block) => blockToSentences(block))
    .slice(0, 3);
  return compactSentences(fallback).slice(0, 3);
}

function deriveEffectsFromStructuredSection(section) {
  const chains = (section.contentBlocks || []).filter((block) => block.type === "chain" && Array.isArray(block.steps) && block.steps.length);
  if (chains.length) {
    return compactSentences(chains.flatMap((block) => block.steps.map((step) => step.result))).slice(-3);
  }

  const fallback = (section.contentBlocks || [])
    .filter((block) => ["fact", "cluster", "definition", "stat"].includes(block.type))
    .flatMap((block) => blockToSentences(block))
    .slice(-4);
  return compactSentences(fallback).slice(0, 3);
}

function deriveSignificanceFromStructuredSection(section) {
  return normalizeText(
    section.apExamAngles?.[0]
    || (section.contentBlocks || []).map((block) => block.apSignificance || block.apRelevance || "").find(Boolean)
    || ""
  );
}

function derivePrimarySourcesFromStructuredSection(section, chapterNum) {
  const derived = [];

  (section.contentBlocks || []).forEach((block) => {
    if (block.type === "quote" && block.attribution) {
      derived.push(block.attribution);
    }

    if (block.type === "cluster" && /primary source/i.test(String(block.label || ""))) {
      (block.items || []).forEach((item) => derived.push(item.description || item.name));
    }
  });

  const manual = {
    27: {
      "The Post-Cold War World": ["George H. W. Bush's 'new world order' rhetoric", "United Nations resolutions on Kuwait"],
      "Globalization and its Discontents": ["World Trade Organization protest materials, Seattle 1999", "NAFTA debates"],
      "Culture Wars": ["AIDS Memorial Quilt", "Proposition 187 campaign materials"],
      "Impeachment and the Election of 2000": ["Articles of impeachment against Bill Clinton", "Bush v. Gore"],
      "The Attacks of September 11": ["George W. Bush, address to Congress, September 20, 2001"],
      "The War on Terrorism": ["National Security Strategy of the United States, 2002", "Bush Doctrine rhetoric"],
      "The Aftermath of September 11 at Home": ["USA PATRIOT Act", "Guantanamo detention debates"],
      "An American Empire?": ["Iraq War protest materials", "Bush 'Mission Accomplished' appearance"]
    },
    28: {
      "The Winds of Change": ["Hurricane Katrina news coverage", "2004 and 2008 campaign rhetoric"],
      "The Great Recession": ["TARP debates", "Occupy Wall Street signs and statements"],
      "Obama in Office": ["Barack Obama inaugural address", "Affordable Care Act debates"],
      "The Obama Presidency": ["Obergefell v. Hodges", "Tea Party protest signs"],
      "President Trump": ["2016 campaign speeches", "Executive Order 13769 travel ban"],
      "Freedom in the Twenty-First Century": ["Charlottesville imagery", "Civil Rights Memorial public history materials"]
    }
  };

  return Array.from(new Set([
    ...derived.map(normalizeText).filter(Boolean),
    ...((manual[chapterNum] && manual[chapterNum][section.sectionTitle]) || [])
  ]));
}

function convertStructuredSections(data) {
  data.notes.sections = (data.notes?.sections || []).map((section) => {
    if (!Array.isArray(section.contentBlocks) || !section.contentBlocks.length) {
      return section;
    }

    const converted = {
      sectionTitle: section.sectionTitle,
      apThemes: section.apThemes || [],
      narrative: deriveNarrativeFromStructuredSection(section),
      causes: deriveCausesFromStructuredSection(section),
      effects: deriveEffectsFromStructuredSection(section),
      significance: deriveSignificanceFromStructuredSection(section),
      connections: deepClone(section.connections || []),
      keyFigures: buildKeyFiguresFromStructuredSection(section),
      primarySourceConnections: derivePrimarySourcesFromStructuredSection(section, data.chapterNum),
      sectionImages: deepClone(section.sectionImages || []),
      apExamAngles: deepClone(section.apExamAngles || [])
    };

    const override = MANUAL_SECTION_OVERRIDES?.[data.chapterNum]?.[section.sectionTitle];
    return override ? { ...converted, ...deepClone(override) } : converted;
  });
}

function buildOverallTimelineEvents(data) {
  const periodNumber = PERIOD_NUMBER[data.periodId] || null;
  const source = (data.periodTimelineEvents && data.periodTimelineEvents.length)
    ? data.periodTimelineEvents
    : (data.periodTimeline || data.chapterTimeline || []).filter((event) => event.apPriority).slice(0, 8);

  return source.slice(0, Math.max(5, Math.min(8, source.length))).map((event) => ({
    id: event.id,
    year: event.year,
    title: event.title,
    summary: normalizeText(event.summary || "").split(". ")[0].replace(/\.$/, "") + ".",
    period: periodNumber,
    significance: normalizeText(event.significance || event.essayRelevance || event.summary || ""),
    categories: deepClone(event.categories || []),
    apPriority: event.apPriority === true
  }));
}

function normalizeMcqs(data) {
  data.mcqQuestions = (data.mcqQuestions || []).map((question, index) => ({
    ...question,
    id: question.id || `mcq-${String(index + 1).padStart(3, "0")}`,
    stimulus: question.stimulus || question.stimulusText || question.stimulusCaption || null,
    explanation: {
      wrongA: null,
      ...deepClone(question.explanation || {})
    }
  }));
}

function normalizeFlashcards(data) {
  const periodNumber = PERIOD_NUMBER[data.periodId] || null;
  data.flashcards = (data.flashcards || []).map((card, index) => ({
    ...card,
    id: card.id || `fc-${String(index + 1).padStart(3, "0")}`,
    period: card.period || periodNumber,
    difficulty: card.difficulty || "Medium",
    apPriority: card.apPriority !== false
  }));
}

function normalizeTimelines(data) {
  if (!Array.isArray(data.periodTimeline) || !data.periodTimeline.length) {
    data.periodTimeline = deepClone(data.chapterTimeline || []);
  }

  if (!Array.isArray(data.chapterTimeline) || !data.chapterTimeline.length) {
    data.chapterTimeline = deepClone(data.periodTimeline || []);
  }
}

function normalizeChapterMeta(data) {
  if (data.chapterMeta?.dateRange) {
    data.chapterMeta.dateRange = String(data.chapterMeta.dateRange).replace(/(\d{4})-(\d{4})/, "$1-$2");
  }
}

function normalizeChapter(data) {
  const normalized = deepClone(data);
  normalizeChapterMeta(normalized);
  normalizeTimelines(normalized);
  convertStructuredSections(normalized);
  normalizeMcqs(normalized);
  normalizeFlashcards(normalized);
  normalized.overallTimelineEvents = buildOverallTimelineEvents(normalized);
  return normalized;
}

function main() {
  execFileSync(process.execPath, [path.join(ROOT, "tools", "regenerate-ch23-28-v22.js")], {
    cwd: ROOT,
    stdio: "inherit"
  });

  execFileSync(process.execPath, [path.join(ROOT, "tools", "generate-apush-chapters.js")], {
    cwd: ROOT,
    stdio: "inherit"
  });

  CHAPTERS.forEach((chapterNum) => {
    const data = normalizeChapter(loadChapterData(chapterNum));
    writeChapterData(data);
  });

  console.log(`Regenerated classic chapter data for ${CHAPTERS.join(", ")}`);
}

main();
