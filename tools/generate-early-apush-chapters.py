import json
import re
from copy import deepcopy
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
OUT_PATH = ROOT / "data" / "chapters" / "chapters1-6-data.js"


THEME = {
    "nat": "American and National Identity",
    "pol": "Politics and Power",
    "wxt": "Work, Exchange, Technology",
    "cul": "Culture and Society",
    "mig": "Migration and Settlement",
    "geo": "Geography and Environment",
    "wor": "America in the World",
}

MCQ_STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "because", "before", "best", "broader", "by",
    "claim", "contributed", "development", "directly", "during", "evidence", "following", "for",
    "from", "historian", "historical", "in", "into", "is", "it", "its", "likely", "most", "not",
    "of", "on", "or", "significance", "studying", "support", "supported", "that", "the", "their",
    "them", "these", "they", "this", "those", "through", "to", "trend", "was", "were", "which",
    "while", "with", "would",
}


def image(chapter_num, image_id, ext, caption, description, themes, relevance=5, category="Primary Source", alt="", suggested_use=None):
    return {
        "imageId": image_id,
        "src": f"images/chapter{chapter_num}/{image_id}.{ext}",
        "alt": alt,
        "caption": caption,
        "relevanceScore": relevance,
        "apCategory": category,
        "description": description,
        "apThemes": themes,
        "period": None,
        "suggestedUse": suggested_use or ["notes", "mcq-stimulus", "saq-stimulus", "flashcard"],
    }


def normalize_copy(value):
    return " ".join(str(value or "").split()).strip()


def split_sentences(value):
    return [normalize_copy(part) for part in re.split(r"(?<=[.!?])\s+", normalize_copy(value)) if normalize_copy(part)]


def sanitize_learning_copy(value):
    text = normalize_copy(value)
    text = re.sub(r"Link this event to a larger APUSH theme\.", "This event connects to a broader historical pattern.", text, flags=re.I)
    text = re.sub(r"Connect this event to a broader APUSH theme\.", "This event connects to a broader historical pattern.", text, flags=re.I)
    text = re.sub(r"\bAPUSH\b", "this chapter", text, flags=re.I)
    text = re.sub(r"\bAP exam\b", "this chapter", text, flags=re.I)
    text = re.sub(r"\bAP-relevant\b", "historically important", text, flags=re.I)
    text = re.sub(r"\bAP relevance\b", "historical relevance", text, flags=re.I)
    if text and text[0].islower():
        text = text[0].upper() + text[1:]
    return normalize_copy(text)


def dedupe_sentences(*values):
    seen = set()
    output = []
    for value in values:
        for sentence in split_sentences(value):
            cleaned = sanitize_learning_copy(sentence)
            key = re.sub(r"[“”‘’]", "", cleaned).rstrip(".,;:!?").lower()
            if not key or key in seen:
                continue
            seen.add(key)
            output.append(cleaned)
    return output


def build_vocab_definition(definition, context):
    sentences = [sentence for sentence in dedupe_sentences(definition, context) if len(sentence) >= 28]
    if not sentences:
        return normalize_copy(definition)
    return " ".join(sentences[:3])


def build_vocab_context(context):
    for sentence in dedupe_sentences(context):
        if len(sentence) >= 24 and not re.match(r"^(?:this event|this term|this image)\s+(?:connects|fits|helps)\s+to\b", sentence, flags=re.I):
            return sentence
    return ""


def vocab(term, definition, context, ap_relevance):
    return {
        "term": term,
        "definition": build_vocab_definition(definition, context),
        "context": build_vocab_context(context),
        "apRelevance": ap_relevance,
    }


def figure(name, title, bio, significance, perspective, image_id=None):
    return {
        "name": name,
        "title": title,
        "bio": bio,
        "significance": significance,
        "perspective": perspective,
        "imageId": image_id,
    }


def note_section(title, themes, narrative, causes, effects, significance, connections, key_figures=None, primary_sources=None, section_images=None):
    return {
        "sectionTitle": title,
        "apThemes": themes,
        "narrative": narrative,
        "causes": causes,
        "effects": effects,
        "significance": significance,
        "connections": connections,
        "keyFigures": key_figures or [],
        "primarySourceConnections": primary_sources or [],
        "sectionImages": section_images or [],
    }


def event(chapter_id, period_id, event_id, year, title, summary, full_description, categories, ap_themes, key_figures, causes, effects, connected_event_ids=None, significance="Medium", ap_priority=False, essay_relevance="", misconception="", month=None, image_id=None):
    return {
        "id": event_id,
        "chapterId": chapter_id,
        "periodId": period_id,
        "year": year,
        "month": month,
        "title": title,
        "summary": summary,
        "fullDescription": full_description,
        "categories": categories,
        "apThemes": ap_themes,
        "keyFigures": key_figures,
        "causes": causes,
        "effects": effects,
        "connectedEventIds": connected_event_ids or [],
        "significance": significance,
        "apPriority": ap_priority,
        "essayRelevance": essay_relevance,
        "commonMisconception": misconception,
        "imageId": image_id,
    }


def overall_event(event_id, year, title, summary, period_num, significance, categories, ap_priority=True):
    return {
        "id": event_id,
        "year": year,
        "title": title,
        "summary": summary,
        "period": period_num,
        "significance": significance,
        "categories": categories,
        "apPriority": ap_priority,
    }


def fact(topic, correct, theme, explanation, wrong=None, skill="Causation"):
    default_wrong = [
        "It shows that colonial leaders rejected all forms of market exchange and overseas trade.",
        "It proves that political conflict disappeared once imperial governments issued formal laws.",
        "It indicates that broad equality already existed for all groups in early America.",
    ]
    return {
        "topic": topic,
        "correct": correct,
        "wrong": wrong or default_wrong,
        "theme": theme,
        "explanation": explanation,
        "skill": skill,
    }


def rotate_options(correct, wrong, index):
    letters = ["A", "B", "C", "D"]
    slot = index % 4
    ordered = [None, None, None, None]
    ordered[slot] = correct
    wrong_items = list(wrong[:3])
    wrong_idx = 0
    for pos in range(4):
        if ordered[pos] is None:
            ordered[pos] = wrong_items[wrong_idx]
            wrong_idx += 1
    options = {letters[pos]: ordered[pos] for pos in range(4)}
    return options, letters[slot]


def normalize_mcq_text(value):
    return " ".join(str(value or "").split()).strip()


def normalize_mcq_key(value):
    return normalize_mcq_text(value).rstrip(".,;:!?").lower()


def extract_mcq_keywords(*values):
    text = " ".join(normalize_mcq_text(value).lower() for value in values)
    tokens = re.findall(r"[a-z][a-z'-]{2,}", text)
    return {token for token in tokens if token not in MCQ_STOP_WORDS}


def shared_keyword_count(left, right):
    return len(left & right)


def needs_mcq_distractor_repair(facts):
    counts = {}
    for item in facts:
        for wrong in item.get("wrong", []):
            key = normalize_mcq_key(wrong)
            if key:
                counts[key] = counts.get(key, 0) + 1

    threshold = max(6, int(len(facts) * 0.6))
    overused = [count for count in counts.values() if count >= threshold]
    return len(overused) >= 3


def generate_mcq_distractors(item, question_text, facts, reuse_counts):
    prompt_keywords = extract_mcq_keywords(item["topic"], item["correct"], question_text, item["explanation"])
    correct_keywords = extract_mcq_keywords(item["correct"])
    candidates = []

    for candidate in facts:
        if candidate["correct"] == item["correct"] or candidate["topic"] == item["topic"]:
            continue

        candidate_keywords = extract_mcq_keywords(candidate["topic"], candidate["correct"], candidate["explanation"])
        overlap_prompt = shared_keyword_count(prompt_keywords, candidate_keywords)
        overlap_correct = shared_keyword_count(correct_keywords, candidate_keywords)
        if overlap_correct >= 4:
            continue

        score = 0
        if candidate["theme"] == item["theme"]:
            score += 14
        if candidate.get("skill") == item.get("skill"):
            score += 7
        score += overlap_prompt * 4
        score += min(overlap_correct, 2)

        length_ratio = len(candidate["correct"]) / max(len(item["correct"]), 1)
        if 0.65 <= length_ratio <= 1.6:
            score += 2

        score -= reuse_counts.get(candidate["correct"], 0) * 3
        candidates.append((score, candidate["correct"]))

    candidates.sort(key=lambda entry: (-entry[0], reuse_counts.get(entry[1], 0), entry[1]))
    selected = []
    for _, text in candidates:
        if text in selected:
            continue
        selected.append(text)
        reuse_counts[text] = reuse_counts.get(text, 0) + 1
        if len(selected) == 3:
            break

    if len(selected) < 3:
        fallback = sorted(
            {candidate["correct"] for candidate in facts if candidate["correct"] != item["correct"]} - set(selected),
            key=lambda text: (reuse_counts.get(text, 0), text),
        )
        while len(selected) < 3 and fallback:
            text = fallback.pop(0)
            selected.append(text)
            reuse_counts[text] = reuse_counts.get(text, 0) + 1

    return selected


def build_mcqs(spec):
    questions = []
    images = spec["images"]
    texts = spec["textStimuli"]
    facts = spec["mcqFacts"]
    auto_distractors = needs_mcq_distractor_repair(facts)
    reuse_counts = {}
    for index in range(20):
        item = facts[index % len(facts)]
        difficulty = "Easy" if index < 6 else "Medium" if index < 14 else "Hard"
        use_image = index < 4 and images
        use_text = 4 <= index < 8 and texts
        stem_variant = index % 4
        if stem_variant == 0:
            question_text = f"The historical development associated with {item['topic']} most directly contributed to which of the following?"
        elif stem_variant == 1:
            question_text = f"Which claim would be best supported by evidence about {item['topic']}?"
        elif stem_variant == 2:
            question_text = f"A historian studying {item['topic']} would most likely connect it to which broader trend?"
        else:
            question_text = f"Which development best explains the APUSH significance of {item['topic']}?"
        wrong_answers = generate_mcq_distractors(item, question_text, facts, reuse_counts) if auto_distractors else item["wrong"]
        options, correct_letter = rotate_options(item["correct"], wrong_answers, index)
        image = images[index % len(images)] if use_image else None
        text = texts[(index - 4) % len(texts)] if use_text else None
        questions.append(
            {
                "id": f"mcq-{index + 1:03d}",
                "difficulty": difficulty,
                "apSkill": item["skill"],
                "stimulus": None if use_image else (text["text"] if use_text else None),
                "stimulusText": text["text"] if use_text else None,
                "stimulusCaption": image["caption"] if use_image else (text["caption"] if use_text else ""),
                "stimulusType": "image" if use_image else ("quote" if use_text else None),
                "stimulusImageId": image["imageId"] if use_image else None,
                "question": question_text,
                "options": options,
                "correctAnswer": correct_letter,
                "explanation": {
                    "correct": item["explanation"],
                    "wrongA": None,
                    "wrongB": None,
                    "wrongC": None,
                    "wrongD": None,
                },
                "topicTag": item["topic"],
                "apTheme": item["theme"],
            }
        )
    return questions


def flatten_figures(sections):
    figures = []
    seen = set()
    for section in sections:
        for item in section.get("keyFigures", []):
            if item["name"] in seen:
                continue
            seen.add(item["name"])
            figures.append(item)
    return figures


def build_flashcards(spec):
    cards = []
    card_id = 1

    def add(card_type, front, back, hint, period, difficulty="Medium", ap_priority=True, image_id=None):
        nonlocal card_id
        cards.append(
            {
                "id": f"fc-{card_id:03d}",
                "type": card_type,
                "front": front,
                "back": back,
                "hint": hint,
                "period": period,
                "difficulty": difficulty,
                "apPriority": ap_priority,
                "imageId": image_id,
            }
        )
        card_id += 1

    for term in spec["vocabulary"]:
        add("Term", term["term"], term["definition"], term["context"], spec["periodNumber"], "Easy", True)

    for fig in flatten_figures(spec["notes"]["sections"]):
        add("Person", fig["name"], f"{fig['title']}: {fig['bio']} {fig['significance']}", fig["perspective"], spec["periodNumber"], "Medium", True, fig.get("imageId"))

    for ev in spec["periodTimeline"][:12]:
        add("Event", ev["title"], f"{ev['year']}: {ev['summary']} {ev['essayRelevance']}", ev["commonMisconception"] or "Connect this event to a broader APUSH theme.", spec["periodNumber"], "Medium" if ev["apPriority"] else "Easy", ev["apPriority"], ev.get("imageId"))

    for item in spec.get("conceptCards", []):
        add(item["type"], item["front"], item["back"], item["hint"], spec["periodNumber"], item.get("difficulty", "Hard"), item.get("apPriority", True))

    for img in [item for item in spec["images"] if item["relevanceScore"] >= 4]:
        add("Concept", "What does this image show and why does it matter?", img["description"], img["caption"], spec["periodNumber"], "Medium", True, img["imageId"])

    timeline = spec["periodTimeline"]
    while len(cards) < 40:
        ev = timeline[(len(cards) - len(spec["vocabulary"])) % len(timeline)]
        add(
            "Cause-Effect",
            f"What caused and resulted from {ev['title']}?",
            f"Causes included {', '.join(ev['causes'])}. Effects included {', '.join(ev['effects'])}.",
            ev["essayRelevance"] or "Connect the event to a broader pattern of change.",
            spec["periodNumber"],
            "Medium",
            ev["apPriority"],
            ev.get("imageId"),
        )

    return cards


def build_period_events(spec):
    output = []
    for ev in spec["periodTimeline"]:
        if not ev["apPriority"]:
            continue
        output.append(
            {
                "id": ev["id"],
                "chapterId": spec["chapterId"],
                "periodId": spec["periodId"],
                "year": ev["year"],
                "title": ev["title"],
                "summary": ev["summary"].split(". ")[0].rstrip(".") + ".",
                "categories": ev["categories"],
                "apPriority": True,
                "significance": ev["essayRelevance"] or ev["summary"],
                "imageId": ev.get("imageId"),
            }
        )
    return output[:6]


def build_chapter(spec):
    data = {
        "chapterId": spec["chapterId"],
        "chapterNum": spec["chapterNum"],
        "periodId": spec["periodId"],
        "chapterOrder": spec["chapterOrder"],
        "images": deepcopy(spec["images"]),
        "chapterMeta": deepcopy(spec["chapterMeta"]),
        "notes": deepcopy(spec["notes"]),
        "chapterTimeline": deepcopy(spec["periodTimeline"]),
        "periodTimeline": deepcopy(spec["periodTimeline"]),
        "periodTimelineEvents": build_period_events(spec),
        "overallTimelineEvents": deepcopy(spec["overallTimelineEvents"]),
        "vocabulary": deepcopy(spec["vocabulary"]),
        "mcqQuestions": build_mcqs(spec),
        "essayPractice": deepcopy(spec["essayPractice"]),
        "flashcards": build_flashcards(spec),
    }
    for img in data["images"]:
        img["period"] = spec["periodId"]
    return data


chapter_specs = []


chapter_specs.append(
    {
        "chapterId": "chapter1",
        "chapterNum": 1,
        "chapterOrder": 1,
        "periodId": "p1",
        "periodNumber": 1,
        "chapterMeta": {
            "period": "Period 1",
            "periodId": "p1",
            "dateRange": "1491-1607",
            "apExamWeight": "4-6%",
            "chapterTitle": "A New World",
            "chapterSubtitle": "Native diversity, Atlantic contact, and the creation of new empires",
            "bigPictureThemes": [THEME["geo"], THEME["wor"], THEME["nat"], THEME["cul"]],
            "oneLineSummary": "Before and after 1492, the Americas were shaped by diverse Native societies, expanding Atlantic contact, and the violent creation of Spanish, French, and Dutch empires that transformed the entire hemisphere.",
            "periodContext": "Period 1 begins before sustained English settlement by emphasizing that the Americas were already old, complex, and interconnected worlds. APUSH treats 1492 as a turning point, but not as a beginning from nothing; the major task is to explain how Native societies, European expansion, African labor systems, and imperial competition collided after contact.",
            "examTips": [
                "AP questions often test the Columbian Exchange as both biological catastrophe and engine of global connection, so explain gains and losses together.",
                "Do not flatten Native Americans into one culture; the exam rewards regional diversity in economies, social systems, and ideas of freedom.",
                "Spanish conquest, French commerce, and Dutch trade are best compared as different imperial models rather than a single European pattern.",
            ],
        },
        "images": [
            image(1, "ch01map01", "png", "The first Americans migrated over long periods and along multiple routes into the Western Hemisphere.", "This map matters because it centers the Americas before European contact and reminds students that Native history begins thousands of years before Columbus.", [THEME["geo"], THEME["mig"]], category="Map"),
            image(1, "ch01ph02", "jpg", "Cahokia shows that large, urban Native societies existed in North America long before European arrival.", "The image is AP-important because it disrupts the misconception that pre-contact North America lacked cities, hierarchy, or political complexity.", [THEME["geo"], THEME["nat"]], category="Reconstruction"),
            image(1, "ch01map02", "png", "Native ways of life varied dramatically by region, climate, and resource base.", "This map is useful because it helps explain why Native societies developed different economies, family structures, and political systems.", [THEME["geo"], THEME["cul"]], category="Map"),
            image(1, "ch01map04", "png", "The voyages of discovery map shows how 1492 fit into a larger wave of Atlantic exploration and imperial rivalry.", "This is one of the best visuals for showing that Columbus was part of a broader competitive struggle among European powers.", [THEME["wor"], THEME["geo"]], category="Map"),
            image(1, "ch01ph16", "jpg", "The smallpox image captures the deadliest side of the Columbian Exchange: epidemic disease in Native communities.", "The image is highly significant because disease did more than any single battle to destabilize Native societies after contact.", [THEME["wor"], THEME["cul"]], category="Drawing"),
            image(1, "ch01map05", "png", "Spanish conquests and explorations turned the New World into a vast imperial space linked to Europe and Asia.", "This map is essential for tracing how quickly Spain built a far-reaching empire from Mexico through South America and into North America.", [THEME["wor"], THEME["geo"]], category="Map"),
            image(1, "ch01ph23", "jpg", "Depictions of Spanish brutality fed the Black Legend and shaped later imperial propaganda.", "This image matters because it connects conquest, violence, and the ways rival empires justified their own colonization projects.", [THEME["wor"], THEME["nat"]], category="Engraving"),
            image(1, "ch01map06", "png", "French and Dutch colonies developed along very different lines from the Spanish empire.", "This map is useful because it helps students compare extraction, settlement, and alliance-based imperial strategies.", [THEME["wor"], THEME["geo"]], category="Map"),
        ],
        "notes": {
            "historicalContext": {
                "overview": "Long before Europeans crossed the Atlantic, the Americas were home to millions of people living in hundreds of societies. Those societies adapted to very different environments, from the Mississippi Valley to the Southwest to the Atlantic coast, and they developed their own economies, spiritual systems, and political traditions. By the late fifteenth century, Europeans were expanding into Atlantic exploration for trade, wealth, and geopolitical advantage, while West African societies were already linked to regional and trans-Saharan commerce. When sustained contact began after 1492, it brought not one event but an ongoing exchange of goods, disease, labor systems, and empires that reordered the world.",
                "precedingCauses": [
                    "Migration into the Americas over thousands of years produced diverse Native societies before European arrival.",
                    "Agriculture, especially maize cultivation, supported permanent settlement and regional specialization in many Native communities.",
                    "European states sought ocean routes to Asia because land-based trade was costly and politically unstable.",
                    "Atlantic exploration depended on maritime technology, imperial rivalry, religious ambition, and the search for wealth.",
                    "West African kingdoms and trading networks were already part of a sophisticated regional economy before Atlantic contact intensified.",
                ],
                "geographicContext": "Geography shaped everything in Period 1. Glaciation, climate zones, river valleys, coastlines, and grasslands encouraged different Native economies and settlement patterns, while Atlantic and Pacific routes connected the Americas to global empires after 1492. Control of islands, river systems, and mineral-rich regions determined which imperial projects became most profitable.",
                "contextImage": {"imageId": "ch01map01", "displayCaption": "APUSH begins with migration, environment, and Native development, not with European arrival."},
            },
            "sections": [
                note_section(
                    "The First Americans and Regional Native Diversity",
                    [THEME["geo"], THEME["mig"], THEME["cul"]],
                    "The peopling of the Americas took place over thousands of years, most likely through migrations from Asia across or around Beringia. By 1491, Native peoples had created highly varied societies rather than a single culture. Some, like the Mississippians at Cahokia, built urban centers and tribute systems, while others in the Southwest developed settled agricultural communities tied to irrigation and trade. In the East, many peoples balanced farming, hunting, and diplomacy within flexible village structures. The most important AP point is that environment did not simply limit Native life; Native communities adapted to it in creative and regionally distinct ways.",
                    ["Long-term migration into the hemisphere", "Adaptation to different climates and food sources", "Development of agriculture, especially maize"],
                    ["Regional specialization in Native economies and politics", "Large differences in settlement density and social structure", "Complex societies existed before European contact"],
                    "This section matters because APUSH often asks students to explain Native diversity before 1492 and to reject the myth that the Americas were empty or undeveloped.",
                    ["Connects to later Native resistance because regional strength shaped colonial encounters.", "Provides context for comparisons between settled and seminomadic peoples in later periods."],
                    key_figures=[figure("The builders of Cahokia", "Mississippian urban society", "Mississippian peoples created one of the largest urban centers north of Mexico, with mounds, trade, and political hierarchy. Cahokia demonstrates that large-scale Native political organization existed in North America before European settlement.", "APUSH cares because Cahokia disrupts stereotypes about pre-contact North America and shows the importance of agriculture, trade, and urban life.", "They represented a complex Native urban civilization shaped by the Mississippi River valley.", "ch01ph02")],
                    primary_sources=["Archaeological evidence from Cahokia and Chaco Canyon", "Maps of Native regional cultures before contact"],
                    section_images=[{"imageId": "ch01ph02", "displayCaption": "Cahokia makes clear that North America included large urban Native centers before European colonization."}, {"imageId": "ch01map02", "placement": "after-key-figures", "displayCaption": "Native North America was environmentally and culturally diverse, which is why colonization unfolded differently across regions."}],
                ),
                note_section(
                    "Native Ideas of Freedom and Social Order",
                    [THEME["nat"], THEME["cul"], THEME["geo"]],
                    "Many Europeans described Native peoples as unusually free, but they often misunderstood what they were seeing. Native societies typically did not organize liberty around individual landownership in the European style, yet they had their own expectations about kinship, autonomy, obligation, and authority. In some communities, women exercised substantial agricultural or family power, and political authority often worked through persuasion rather than rigid coercion. Europeans who equated civilization with monarchy, fixed law, and hierarchy often concluded that Native peoples were too free or insufficiently disciplined. APUSH likes this theme because it shows that freedom is historically defined, not universal in meaning.",
                    ["European comparison between Native and European social structures", "Different conceptions of authority, labor, and property", "Missionaries' and traders' attempts to translate Native life into European categories"],
                    ["Europeans labeled Native peoples barbaric or disorderly", "Native resistance to enslavement and domination intensified", "Cross-cultural misunderstanding shaped colonization from the start"],
                    "This section matters because it helps explain why Europeans and Native peoples clashed not just over land but over the meaning of order, authority, and liberty itself.",
                    ["Foreshadows later conflicts over land, assimilation, and sovereignty in every later period.", "Connects to later American claims that freedom belonged especially to white property holders."],
                    key_figures=[figure("Giovanni da Verrazzano", "Italian explorer in French service", "Verrazzano described Indians as living in absolute freedom, showing how early Europeans often defined Native life by contrast with their own hierarchies.", "His observations matter because AP questions often test how Europeans interpreted Native societies through their own political assumptions.", "He represented an early European outsider trying to classify Native life in Atlantic imperial terms.")],
                    primary_sources=["Missionary and explorer accounts of Native societies", "Catawba and other Native maps or diplomatic records"],
                    section_images=[{"imageId": "ch01map02", "displayCaption": "Regional Native diversity shaped different forms of social organization and freedom."}],
                ),
                note_section(
                    "Europe, Africa, and the Atlantic Expansion",
                    [THEME["wor"], THEME["geo"], THEME["wxt"]],
                    "Columbus's voyage mattered because Europe was already turning outward in search of wealth, trade, and strategic advantage. Portuguese and Spanish navigators used improvements in ships and navigation to explore the Atlantic and African coasts, while competition over Asian luxury goods made sea routes attractive. Meanwhile, West African societies were politically and economically complex, participating in trade networks that predated the Atlantic slave trade. Europeans entered the Atlantic world seeking gold, silver, spices, converts, and geopolitical leverage over rivals. The period is best understood not as isolated discovery but as the globalization of older commercial and imperial ambitions.",
                    ["Competition for trade with Asia", "Growth of centralized monarchies in Iberia", "Advances in maritime technology and navigation"],
                    ["Atlantic exploration accelerated", "Europeans forged stronger ties to African coasts", "Imperial rivalry became global in scale"],
                    "This section matters because APUSH often links American colonization to larger global processes, not just to local colonial settlement.",
                    ["Connects to mercantilism and imperial rivalry in Period 2.", "Foreshadows the Atlantic slave system and later imperial wars."],
                    key_figures=[
                        figure("Zheng He", "Chinese admiral", "Zheng He led large Indian Ocean voyages in the early fifteenth century, demonstrating that Europe did not hold a monopoly on maritime capability. His expeditions help historians frame European expansion comparatively.", "He is useful because APUSH can reward contextualization that places European exploration alongside broader global developments.", "He represented a non-European imperial and maritime tradition."),
                        figure("Prince Henry the Navigator", "Portuguese patron of exploration", "Portuguese exploration down the African coast reflected both state support and economic ambition. Prince Henry symbolizes the institutional backing behind Atlantic expansion.", "He matters because the Atlantic world emerged through deliberate state and commercial investment.", "He represented Iberian maritime ambition and imperial strategy."),
                    ],
                    primary_sources=["Maps of the Old World and early Atlantic routes", "Travel accounts describing African trade and maritime exploration"],
                    section_images=[{"imageId": "ch01map04", "displayCaption": "The Atlantic crossings of the late fifteenth century were part of a larger struggle for trade and empire."}],
                ),
                note_section(
                    "Columbus, Contact, and the Columbian Exchange",
                    [THEME["wor"], THEME["cul"], THEME["wxt"]],
                    "Columbus's 1492 voyage created sustained contact between the Eastern and Western Hemispheres. That contact set off the Columbian Exchange, the movement of crops, animals, microbes, and people across the Atlantic. Maize and potatoes helped feed population growth in Europe and beyond, while horses, cattle, and wheat reshaped many American environments. The most devastating transfer was disease, because smallpox and other infections ravaged Native populations with catastrophic speed. Period 1 questions often turn on this double reality: global interconnection increased, but Native societies paid the greatest immediate price.",
                    ["Atlantic voyages initiated sustained hemispheric contact", "European colonization began on Caribbean islands", "Biological isolation had left Native peoples vulnerable to Eurasian disease"],
                    ["Massive Native depopulation", "Environmental transformation in both hemispheres", "New global trade in foodstuffs, animals, and labor systems"],
                    "The Columbian Exchange is one of the central concepts in Period 1 because it explains both the growth of global integration and the destruction of Native populations.",
                    ["Links to later plantation systems that depended on New World crops and Atlantic labor.", "Foreshadows the demographic and economic transformations of later colonial societies."],
                    key_figures=[figure("Christopher Columbus", "Genoese navigator sailing for Spain", "Columbus did not discover an empty world, but his 1492 voyage created sustained contact between Europe and the Americas. His reports spread quickly and encouraged wider Atlantic expansion.", "He matters because APUSH treats 1492 as a global turning point rather than a simple moment of heroic discovery.", "He represented Iberian imperial ambition, Christian expansion, and the search for wealth.")],
                    primary_sources=["Columbus's first letter from the Caribbean", "Illustrations of smallpox and early contact"],
                    section_images=[{"imageId": "ch01ph16", "displayCaption": "Disease was the deadliest consequence of contact, often doing more damage than warfare."}],
                ),
                note_section(
                    "Spanish Conquest and the Making of New Spain",
                    [THEME["wor"], THEME["pol"], THEME["cul"]],
                    "Spain built the most powerful early empire in the Americas through conquest, extraction, missionization, and administration. Hernan Cortes overthrew the Aztec Empire, and later conquistadors expanded Spanish rule into other rich and populous regions. Spanish officials and missionaries created institutions such as the encomienda and mission system that exploited Native labor while claiming to Christianize Native peoples. The empire became highly mixed, producing mestizo societies and complex caste hierarchies rather than simple settler majorities. Spanish colonization brought massive wealth to the crown, but it also generated brutality, debate, and the Black Legend among rival Europeans.",
                    ["Spanish military alliances and technology during conquest", "Desire for precious metals, labor, and imperial power", "Catholic missionary goals and royal administration"],
                    ["Large Spanish colonial state centered in Mexico City", "Forced labor and demographic collapse in Native communities", "Growth of racial mixing and caste categories in Spanish America"],
                    "This section matters because APUSH uses Spain as the earliest major imperial model in the Americas and as a comparison point for English colonization later on.",
                    ["Connects to later borderlands history in the Southwest and Florida.", "Provides context for later English anti-Spanish propaganda and imperial rivalry."],
                    key_figures=[
                        figure("Hernan Cortes", "Spanish conquistador", "Cortes conquered the Aztec Empire with Native allies, firearms, steel, and political opportunism. His victory became a model of how conquest and alliance could quickly destabilize powerful states.", "He matters because he demonstrates how conquest worked and why Spanish expansion was so rapid.", "He represented Spanish imperial violence and opportunism."),
                        figure("Bartolome de Las Casas", "Spanish priest and critic of conquest brutality", "Las Casas condemned Spanish abuses against Native peoples and pressed for more humane treatment. His writings fed the Black Legend and forced moral debates within the empire.", "He matters because APUSH often uses him to show that conquest generated criticism even inside Spain.", "He represented Catholic reform critique within the Spanish empire."),
                    ],
                    primary_sources=["Las Casas on the destruction of the Indies", "Huexotzinco and Tlaxcala codices", "Spanish colonial legal debates over Native status"],
                    section_images=[{"imageId": "ch01map05", "displayCaption": "Spanish expansion was continental in scale and quickly tied the Americas to Europe and Asia."}, {"imageId": "ch01ph23", "placement": "after-key-figures", "displayCaption": "Images of Spanish brutality became part of the Black Legend and shaped later imperial competition."}],
                ),
                note_section(
                    "French and Dutch Colonization",
                    [THEME["wor"], THEME["wxt"], THEME["geo"]],
                    "French and Dutch colonization developed differently from Spain's because both empires relied more heavily on trade networks and alliances than on dense settler conquest. New France centered on the fur trade and built partnerships with Native peoples along the St. Lawrence, Great Lakes, and Mississippi corridors. New Netherland became a commercial outpost connected to Atlantic trade and marked by ethnic and religious diversity. Both empires remained less populous than Spain or later English colonies, but they mattered enormously because they linked North America to wider imperial rivalry. Their presence shaped diplomacy, commerce, and future conflict across the continent.",
                    ["Rival European powers wanted access to American wealth and trade", "French interest in furs and interior waterways", "Dutch strength in commerce and shipping"],
                    ["Alliance-based imperial systems expanded in North America", "Imperial rivalry intensified among European powers", "Later English colonization developed in a contested continental setting"],
                    "This section matters because APUSH often compares the French, Dutch, and Spanish imperial systems to show that colonization took multiple forms in the Americas.",
                    ["Foreshadows later French-English and Anglo-Dutch rivalry in Period 2.", "Helps explain why the interior of North America remained contested well after first contact."],
                    key_figures=[
                        figure("Samuel de Champlain", "Founder of Quebec", "Champlain helped establish a French empire organized around trade, alliance, and strategic waterways rather than dense agricultural settlement. His diplomacy with Native peoples shaped the future of New France.", "He matters because he represents the French imperial model in North America.", "He represented alliance-based imperial expansion tied to commerce."),
                        figure("Peter Stuyvesant", "Director general of New Netherland", "Stuyvesant governed New Netherland during the period when the Dutch colony remained a commercial crossroads with a diverse population. His administration reveals the economic priorities and limits of Dutch colonization.", "He matters because APUSH often uses New Netherland as evidence of pluralism and commercial empire.", "He represented Dutch mercantile colonial government."),
                    ],
                    primary_sources=["Champlain's voyage accounts", "Maps of New France and New Netherland", "Dutch West India Company records"],
                    section_images=[{"imageId": "ch01map06", "displayCaption": "French and Dutch colonies followed trade routes and Native alliances rather than Spain's large conquest model."}],
                ),
            ],
            "overarchingAnalysis": {
                "continuity": "Across Period 1, Native peoples remained central actors even as disease, conquest, and trade destabilized many societies. Geography continued to shape settlement, exchange, and conflict, and imperial expansion remained tied to labor extraction and hierarchy.",
                "change": "The biggest change by 1607 was the creation of a permanently interconnected Atlantic world. European empires, African slave trading, missionary projects, epidemic disease, and transoceanic exchange had transformed the Americas from regionally distinct worlds into zones of global imperial competition.",
                "complexity": "The best complexity point is that contact was simultaneously an exchange, a conquest, and a reordering of global power. It brought crops, animals, and commerce that reshaped the world, but those same connections rested on Native depopulation, coercion, and racialized empire building.",
                "comparisonAngles": [
                    "Compare Spanish conquest and governance to French and Dutch trade-centered empire building.",
                    "Compare Native ideas of freedom and property to European assumptions about hierarchy, labor, and landownership.",
                    "Compare the Columbian Exchange in the Americas with its demographic and economic effects in Europe and Africa.",
                ],
            },
        },
        "periodTimeline": [
            event("chapter1", "p1", "chapter1-cahokia-peaks", 1200, "Cahokia Reaches Its Height", "Cahokia grew into the largest urban center north of Mexico before European arrival. Its scale demonstrates that North America included complex Native political and religious life long before colonization.", "Centered near present-day St. Louis, Cahokia flourished through agriculture, trade, and political hierarchy. Its large mounds and dense population reveal urban planning and organized labor. Cahokia declined before Columbus's voyage, but its legacy remains essential to understanding Native complexity. Historians use it to challenge myths that North America lacked advanced societies before European contact.", ["Social", "Cultural"], [THEME["cul"], THEME["geo"]], ["Mississippian peoples"], ["Maize agriculture", "Regional trade networks"], ["Urban Native political development", "Evidence of pre-contact complexity"], ["chapter1-tenochtitlan-founded"], "Medium", False, "Useful contextualization for essays on Native societies before contact.", "Students often focus on Mesoamerica and forget that large North American urban centers also existed.", image_id="ch01ph02"),
            event("chapter1", "p1", "chapter1-tenochtitlan-founded", 1325, "Founding of Tenochtitlan", "The Mexica founded Tenochtitlan, which later became the capital of the Aztec Empire. Its rise helps explain why Spanish conquest targeted already powerful and wealthy Native states.", "Built on islands in Lake Texcoco, Tenochtitlan became one of the world's great cities. Its markets, temples, tribute system, and engineering impressed later Spanish observers. The city's growth shows that political centralization and urbanism were major features of the pre-contact Americas. Its eventual conquest in 1521 became a defining moment in Spanish empire building.", ["Political", "Cultural"], [THEME["pol"], THEME["geo"]], ["Mexica"], ["Expansion of Mexica power"], ["Creation of Aztec imperial capital", "Target for Spanish conquest"], ["chapter1-cortes-invades-mexico", "chapter1-fall-of-tenochtitlan"], "Medium", False, "Useful for contextualizing Spanish conquest of the Aztec Empire.", "The Aztecs were not a primitive society awaiting Europeans; they ruled a major imperial city.", image_id="ch01map05"),
            event("chapter1", "p1", "chapter1-zheng-he-voyages", 1405, "Zheng He Begins His Voyages", "Chinese admiral Zheng He launched major Indian Ocean expeditions before Columbus's Atlantic crossing. The voyages provide global context for Europe's later expansion.", "Zheng He's fleets were larger than contemporary European fleets and projected imperial prestige across the Indian Ocean. His voyages demonstrate that maritime ambition was not unique to Europe. APUSH uses this comparison to avoid Eurocentric narratives about exploration. The contrast also helps explain why European states, not China, built the Atlantic empires that later shaped North America.", ["Diplomatic", "Cultural"], [THEME["wor"]], ["Zheng He"], ["Chinese imperial expansion"], ["Global maritime comparison", "Context for later European exploration"], [], "Low", False, "Helpful contextualization in essays on European exploration.", "Students often assume Europeans were the only early modern explorers with large oceanic ambitions."),
            event("chapter1", "p1", "chapter1-columbus-lands", 1492, "Columbus Reaches the Caribbean", "Christopher Columbus reached the Caribbean in 1492 and initiated sustained contact between Europe and the Americas. That contact began the long process of conquest, colonization, and biological exchange.", "Sailing for Spain, Columbus crossed the Atlantic after stopping in the Canary Islands. He reached islands in the Caribbean and believed he had found a route to Asia. His reports spread rapidly through print culture and encouraged further exploration. The voyage was a turning point not because it created the Americas, but because it connected hemispheres that had long been separate. Its consequences were global and often catastrophic for Native peoples.", ["Diplomatic", "Cultural"], [THEME["wor"], THEME["cul"]], ["Christopher Columbus"], ["Atlantic exploration", "Spanish imperial ambition"], ["Columbian Exchange", "European colonization in the Americas"], ["chapter1-treaty-of-tordesillas", "chapter1-cortes-invades-mexico"], "High", True, "Core evidence for any Period 1 essay on contact, exchange, or conquest.", "1492 was not the 'discovery' of an empty continent.", image_id="ch01map04"),
            event("chapter1", "p1", "chapter1-treaty-of-tordesillas", 1494, "Treaty of Tordesillas", "Spain and Portugal divided much of the non-European world between them in the Treaty of Tordesillas. The agreement shows how quickly Atlantic exploration became imperial competition.", "Brokered with papal support, the treaty drew a line that shaped later Portuguese claims in Brazil and Spanish dominance elsewhere in the Americas. It reflected the confidence of Iberian monarchies and the weakness of non-Iberian rivals at the time. The treaty also shows how European powers claimed lands they had not fully explored or controlled. Imperial competition in the Americas was international from the beginning.", ["Diplomatic", "Political"], [THEME["wor"], THEME["pol"]], ["Spanish crown", "Portuguese crown"], ["Columbus's voyage", "Iberian rivalry"], ["Imperial division of claims", "Portuguese foothold in Brazil"], ["chapter1-columbus-lands"], "Medium", True, "Useful for linking exploration to imperial diplomacy.", "The treaty divided claims among Europeans, not control over peoples already living there."),
            event("chapter1", "p1", "chapter1-cabot-voyage", 1497, "John Cabot Reaches Newfoundland", "John Cabot's voyage for England extended Atlantic exploration beyond Iberian powers. It later helped English colonizers justify claims in North America.", "Cabot reached Newfoundland only a few years after Columbus. His voyage did not produce immediate English colonization, but it became an important legal and historical basis for later English imperial claims. Fishermen from several European nations soon entered northern Atlantic waters. The voyage demonstrates that Atlantic competition widened quickly after 1492.", ["Diplomatic"], [THEME["wor"]], ["John Cabot"], ["Success of Columbus's voyage", "English interest in Atlantic routes"], ["Broader European rivalry in North America", "Later English claims"], [], "Medium", False, "Helpful for explaining later English claims to North American territory.", "England did not colonize North America immediately after Cabot's voyage."),
            event("chapter1", "p1", "chapter1-america-named", 1507, "Waldseemuller Uses the Name America", "A 1507 world map labeled the new hemisphere 'America.' The naming reflected how quickly Europeans began mentally absorbing the Western Hemisphere into global geography.", "Martin Waldseemuller's map was the first to depict the full Western Hemisphere and to use the name America. Naming mattered because maps turned exploratory reports into shared imperial knowledge. The spread of cartography helped Europeans imagine and compete for lands across the Atlantic. Period 1 is partly about how information became empire.", ["Cultural", "Diplomatic"], [THEME["wor"], THEME["cul"]], ["Martin Waldseemuller"], ["Rapid diffusion of exploration reports"], ["Shared European geographic awareness", "Imperial planning"], [], "Low", False, "Useful contextual evidence in essays on exploration and empire.", "Naming the hemisphere did not mean Europeans controlled most of it.", image_id="ch01map04"),
            event("chapter1", "p1", "chapter1-cortes-invades-mexico", 1519, "Cortes Invades Mexico", "Hernan Cortes entered Mexico in 1519 and launched the campaign that toppled the Aztec Empire. His advance depended on Native alliances as much as on Spanish arms.", "Cortes exploited divisions among Indigenous groups hostile to Aztec rule. Steel weapons, horses, and firearms gave the Spaniards advantages, but disease and Native political conflict mattered just as much. His campaign shows that conquest was not a simple battle between Europe and a unified Native America. It was a violent imperial struggle shaped by alliance, opportunism, and epidemic disaster.", ["Military", "Political"], [THEME["wor"], THEME["pol"]], ["Hernan Cortes"], ["Spanish desire for wealth", "Existing tensions within Mesoamerica"], ["Aztec Empire destabilized", "Spanish imperial state expanded"], ["chapter1-fall-of-tenochtitlan"], "High", True, "Strong evidence for essays on conquest and the mechanics of empire.", "Spanish military technology alone does not explain the conquest.", image_id="ch01map05"),
            event("chapter1", "p1", "chapter1-fall-of-tenochtitlan", 1521, "Fall of Tenochtitlan", "Spanish and allied Native forces captured Tenochtitlan in 1521. The conquest marked the foundation of New Spain and a major shift in Atlantic power.", "After siege, hunger, disease, and military assault, the Aztec capital fell to Cortes and his allies. Spain built Mexico City on the ruins of Tenochtitlan. Control of the region gave Spain access to vast labor, tribute, and mineral wealth. The conquest also accelerated missionary activity and colonial restructuring in the Americas.", ["Military", "Political"], [THEME["wor"], THEME["pol"]], ["Hernan Cortes"], ["Cortes's invasion", "Disease and Native alliances"], ["Creation of New Spain", "Massive imperial wealth for Spain"], ["chapter1-pizarro-conquers-inca"], "High", True, "A defining APUSH event for the Spanish conquest model.", "The conquest did not mean immediate or total Spanish control of every Native people in the hemisphere.", image_id="ch01map05"),
            event("chapter1", "p1", "chapter1-pizarro-conquers-inca", 1532, "Pizarro Captures Atahualpa", "Francisco Pizarro's capture of the Inca ruler Atahualpa extended the Spanish conquest model into South America. The event reinforced Spain's dominance in the New World.", "Pizarro seized Atahualpa during a moment of internal Inca division, using surprise and violence to gain control. As in Mexico, European conquest depended on local political fractures and epidemic disease as much as technology. The fall of the Inca Empire expanded Spain's access to silver and labor. These conquests shifted the center of global precious-metal production to the Americas.", ["Military", "Economic"], [THEME["wor"], THEME["wxt"]], ["Francisco Pizarro"], ["Spanish expansion after Mexico", "Search for wealth in the Americas"], ["Further growth of Spanish empire", "Greater silver extraction"], [], "Medium", True, "Useful comparative evidence for essays on Spanish conquest.", "The Spanish did not conquer unified, stable Native states with force alone."),
            event("chapter1", "p1", "chapter1-cartier-st-lawrence", 1534, "Jacques Cartier Explores the St. Lawrence", "French exploration of the St. Lawrence valley laid the groundwork for New France. It signaled that France would compete for influence in North America.", "Cartier's voyage identified a major river corridor into the interior of North America. Although France did not immediately build a dense settler empire there, the route later became central to New France. Exploration in the north focused less on conquest of dense populations and more on trade and alliance. That difference shaped the later French colonial model.", ["Diplomatic"], [THEME["wor"], THEME["geo"]], ["Jacques Cartier"], ["French imperial competition"], ["Basis for later New France", "Trade-oriented northern empire"], [], "Medium", False, "Helpful for comparison between imperial systems."),
            event("chapter1", "p1", "chapter1-new-laws", 1542, "Spain Issues the New Laws", "The Spanish crown attempted to limit abuses of Native labor through the New Laws of 1542. The legislation showed that conquest generated moral and political controversy within Spain itself.", "Critics such as Bartolome de Las Casas pressured the Spanish monarchy to respond to reports of cruelty in the Americas. The New Laws aimed to reduce the worst abuses of encomienda labor, though enforcement remained uneven. The episode reveals that imperial expansion sparked debates over justice, sovereignty, and Native humanity. It is useful for showing that empires could criticize themselves without ending exploitation.", ["Political", "Social"], [THEME["pol"], THEME["cul"]], ["Bartolome de Las Casas"], ["Reports of conquest brutality"], ["Imperial reform debates", "Continued tension over Native labor"], [], "Medium", False, "Useful complexity evidence in essays on Spanish empire.", "The New Laws did not end exploitation in Spanish America."),
            event("chapter1", "p1", "chapter1-st-augustine-founded", 1565, "St. Augustine Founded", "Spain founded St. Augustine in 1565, creating the first permanent European settlement in what is now the United States. The settlement reflects Spain's northern imperial reach.", "St. Augustine served military and imperial goals in Florida and the broader Southeast. It protected Spanish shipping routes and extended Catholic and royal claims into North America. The settlement shows that Spanish presence in what became the United States predated English Jamestown by decades. It also reminds students that North American colonization was multinational from the beginning.", ["Political", "Diplomatic"], [THEME["wor"], THEME["geo"]], ["Spanish colonists"], ["Spanish imperial defense and mission goals"], ["Permanent Spanish settlement in Florida", "Earlier European foothold than Jamestown"], [], "High", True, "Excellent contextual evidence for Spanish North America.", "Jamestown was the first permanent English settlement, not the first permanent European settlement in what became the United States."),
            event("chapter1", "p1", "chapter1-armada-defeated", 1588, "Spanish Armada Defeated", "England's defeat of the Spanish Armada weakened Spanish invincibility and encouraged future English Atlantic ambition. The event helped shift the balance of imperial confidence.", "The failed Spanish Armada campaign became a major symbol of English Protestant and naval identity. Although Spain remained powerful, England gained confidence in challenging Iberian power overseas. The defeat also fed an ideology that linked English liberty and Protestantism to imperial expansion. Later English colonization drew heavily on that moment of self-definition.", ["Military", "Diplomatic"], [THEME["wor"], THEME["nat"]], ["Elizabeth I"], ["Anglo-Spanish rivalry"], ["Greater English imperial confidence", "Stronger anti-Spanish identity"], ["chapter2-jamestown-founded"], "Medium", False, "Useful context for the transition from Iberian dominance to broader imperial competition.", "The defeat of the Armada did not immediately make England the dominant empire in the Americas.", image_id="ch01map06"),
            event("chapter1", "p1", "chapter1-onate-new-mexico", 1598, "Juan de Onate Enters New Mexico", "Juan de Onate established Spanish authority in New Mexico at the end of the sixteenth century. His campaigns expanded the northern frontier of the Spanish empire.", "Onate claimed territory, imposed Spanish rule, and used violence against Native peoples in the region. New Mexico became part of Spain's broader borderlands empire, dependent on missions and military outposts more than on massive settler numbers. The region later became a site of both cultural mixing and Native resistance. Period 1 therefore closes with Spanish power extended but still unstable in the North American interior.", ["Military", "Political"], [THEME["wor"], THEME["geo"]], ["Juan de Onate"], ["Spanish desire to expand northward"], ["Creation of New Mexico colony", "Long-term borderlands conflict"], [], "Medium", False, "Useful bridge from early conquest to later borderlands conflict."),
        ],
        "overallTimelineEvents": [
            overall_event("chapter1-columbus-lands", 1492, "Columbus Reaches the Caribbean", "Sustained Atlantic contact between Europe and the Americas begins.", 1, "This belongs on the master APUSH timeline because it marks the start of the Columbian Exchange and the hemispheric transformations that shaped every later period.", ["Diplomatic"]),
            overall_event("chapter1-fall-of-tenochtitlan", 1521, "Fall of Tenochtitlan", "Spain defeats the Aztec capital and establishes New Spain.", 1, "This event belongs on the master timeline because it captures the conquest model that defined Spain's early empire in the Americas.", ["Military"]),
            overall_event("chapter1-new-laws", 1542, "Spanish New Laws", "Spain attempts to curb some abuses of Native labor.", 1, "This event matters because it shows that conquest immediately generated debates over labor, morality, and Native status.", ["Political"]),
            overall_event("chapter1-st-augustine-founded", 1565, "St. Augustine Founded", "Spain establishes the first permanent European settlement in what is now the United States.", 1, "This belongs on the master timeline because it reminds students that English America was not the first European America.", ["Political"]),
            overall_event("chapter1-armada-defeated", 1588, "Spanish Armada Defeated", "England's victory over the Armada boosts Protestant and imperial confidence.", 1, "This event helps explain why the balance of Atlantic empire later widened beyond Iberian control.", ["Military"]),
        ],
        "vocabulary": [
            vocab("Beringia", "The land bridge region linking Asia and North America during the Ice Age, used in the dominant migration theory for the first Americans.", "APUSH uses Beringia to explain the deep prehistory of the Americas before European contact.", "It appears in contextualization and comparison questions about Native origins and migration."),
            vocab("maize", "Corn, the crop that spread widely in the Americas and supported population growth, settlement, and social complexity.", "Maize agriculture helped sustain societies such as the Mississippians and many Eastern Woodlands communities.", "The exam often uses maize as evidence of Native adaptation and agricultural development."),
            vocab("Cahokia", "A major Mississippian urban center near present-day St. Louis that flourished before European arrival.", "Cahokia shows that complex Native political and ceremonial life existed in North America before colonization.", "It is strong evidence against the claim that pre-contact North America lacked cities or hierarchy."),
            vocab("Columbian Exchange", "The transfer of crops, animals, microbes, people, and ideas between the Eastern and Western Hemispheres after 1492.", "The Columbian Exchange brought horses and wheat to the Americas and maize and potatoes to Europe, but also epidemic disease to Native peoples.", "It is one of the most important APUSH concepts in Period 1."),
            vocab("caravel", "A fast, maneuverable ship used by Iberian explorers in Atlantic voyages.", "Improved ships like the caravel made long-distance maritime exploration more practical.", "It matters as evidence for the technological side of Atlantic expansion."),
            vocab("conquistador", "A Spanish conqueror who seized Native states and peoples in the Americas.", "Cortes and Pizarro are the most famous conquistadors of the early Spanish empire.", "The term appears in questions about conquest, empire, and labor systems."),
            vocab("encomienda", "A Spanish labor system granting colonists the right to demand labor or tribute from Native communities.", "The encomienda linked conquest to coerced labor in Spanish America.", "The AP exam uses it to connect Spanish empire to exploitation and missionary justifications."),
            vocab("mestizo", "A person of mixed Spanish and Native American ancestry in colonial Spanish America.", "Mestizo populations grew as Spanish colonization created racially mixed societies.", "It helps explain caste hierarchies and racial mixing in the Spanish empire."),
            vocab("Black Legend", "An image of Spain as uniquely cruel and tyrannical, promoted by rival European powers.", "Critics used Spanish brutality toward Native peoples to justify anti-Spanish politics and imperial rivalry.", "This term is useful for comparing imperial propaganda and self-justification."),
            vocab("mission system", "A network of Catholic religious settlements meant to convert Native peoples and extend imperial control.", "Spanish missions in places such as Florida and the Southwest combined religion, labor discipline, and colonization.", "The exam uses missions to connect empire, religion, and Native resistance."),
            vocab("New Spain", "Spain's colonial empire centered in Mexico and extending across much of the Americas.", "After the conquest of the Aztecs, Mexico City became the administrative center of New Spain.", "It is central to APUSH comparison of Spanish and British colonial models."),
            vocab("Treaty of Tordesillas", "The 1494 agreement by which Spain and Portugal divided much of the non-European world between them.", "The treaty helped shape Portuguese claims in Brazil and Spanish dominance elsewhere in the Americas.", "Useful for essays linking exploration to imperial diplomacy."),
            vocab("Tenochtitlan", "The capital city of the Aztec Empire, conquered by Spain in 1521.", "Its fall marked a turning point in the creation of New Spain.", "A common AP reference point for Spanish conquest."),
            vocab("New France", "The French colonial empire in North America organized heavily around trade, alliance, and river systems.", "Quebec and the Mississippi corridor became major centers of French activity.", "The term appears in comparison questions about imperial systems."),
            vocab("New Netherland", "The Dutch colony centered on the Hudson River and New Amsterdam.", "New Netherland reflected a commercial and ethnically diverse imperial model.", "Useful for showing that colonization was multinational and trade-centered as well as settler-based."),
            vocab("mercantilism", "The theory that government should regulate trade to strengthen national power and accumulate wealth.", "While more important in later chapters, mercantilist thinking already shaped imperial rivalry in the Atlantic world.", "It appears often in AP questions about empire and trade."),
            vocab("smallpox", "A highly contagious Eurasian disease that devastated Native populations after contact.", "Smallpox is one of the clearest symbols of the biological side of the Columbian Exchange.", "It is frequently used in Period 1 causation questions."),
            vocab("Asiento", "A contract granting a nation or company the right to supply enslaved Africans to Spanish colonies.", "The asiento linked Spanish colonial labor demand to the Atlantic slave trade.", "Useful for explaining how European empires competed for slave-trade profits."),
            vocab("Olaudah Equiano", "An African-born writer whose later autobiography exposed the cruelty of Atlantic slavery.", "Although most relevant in Chapter 4, Equiano's life helps connect African experience to Atlantic imperial systems created after contact.", "His narrative often appears in APUSH as a primary source about slavery and empire."),
            vocab("Atlantic World", "The interconnected system linking Europe, Africa, and the Americas through trade, migration, warfare, and empire.", "Period 1 is the beginning of a genuinely Atlantic history for North America.", "This broad concept is useful in LEQs and contextualization."),
        ],
        "essayPractice": {
            "saq": [
                {
                    "id": "saq-001",
                    "prompt": "Answer a, b, and c. a) Briefly explain one way Native societies in North America differed from one another before 1492. b) Briefly explain one way European contact changed Native societies after 1492. c) Briefly explain one reason historians reject the idea that Columbus 'discovered' America.",
                    "partA": "Briefly explain one way Native societies in North America differed from one another before 1492.",
                    "partB": "Briefly explain one way European contact changed Native societies after 1492.",
                    "partC": "Briefly explain one reason historians reject the idea that Columbus 'discovered' America.",
                    "scoringGuidance": {
                        "partA": "A full-credit response must identify a clear regional difference such as urban Mississippian life, Pueblo agriculture, or mobile Plains adaptation.",
                        "partB": "A full-credit response must explain a specific change such as epidemic disease, horse culture, imperial warfare, or missionization.",
                        "partC": "A full-credit response must state that millions already lived in the Americas and that the term 'discovery' erases Native history."
                    },
                    "sampleAnswers": {
                        "partA": "Native societies differed because some, like the Mississippians, built large urban centers such as Cahokia, while others organized smaller village-based farming or hunting communities shaped by different environments.",
                        "partB": "European contact changed Native societies by introducing epidemic diseases such as smallpox, which caused massive depopulation and weakened many communities.",
                        "partC": "Historians reject the idea that Columbus discovered America because the Americas had long been inhabited by diverse peoples with their own societies, economies, and political traditions."
                    }
                },
                {
                    "id": "saq-002",
                    "prompt": "Answer a, b, and c. a) Briefly explain one way Spanish colonization differed from French or Dutch colonization in the Americas. b) Briefly explain one effect of the Columbian Exchange on Europe. c) Briefly explain one effect of the Columbian Exchange on Native Americans.",
                    "partA": "Briefly explain one way Spanish colonization differed from French or Dutch colonization in the Americas.",
                    "partB": "Briefly explain one effect of the Columbian Exchange on Europe.",
                    "partC": "Briefly explain one effect of the Columbian Exchange on Native Americans.",
                    "scoringGuidance": {
                        "partA": "A full-credit answer must identify a real difference such as Spain's conquest and labor systems versus French trade alliances or Dutch commerce.",
                        "partB": "A full-credit answer must explain a specific European effect such as new food crops increasing population or imperial wealth increasing.",
                        "partC": "A full-credit answer must explain a Native effect such as disease, ecological change, warfare, or incorporation into imperial labor systems."
                    },
                    "sampleAnswers": {
                        "partA": "Spanish colonization relied heavily on conquest and coerced Native labor systems like encomienda, while French colonization depended more on trade and alliance in the interior.",
                        "partB": "The Columbian Exchange affected Europe by introducing crops such as potatoes and maize that helped support population growth.",
                        "partC": "The Columbian Exchange affected Native Americans by spreading diseases such as smallpox, which caused catastrophic death rates."
                    }
                },
            ],
            "leq": [
                {
                    "id": "leq-001",
                    "prompt": "Evaluate the extent to which the Columbian Exchange transformed societies in the Americas in the period from 1491 to 1607.",
                    "recommendedArgument": "Continuity and Change Over Time",
                    "thesisExamples": [
                        "The Columbian Exchange transformed societies in the Americas to a very great extent because epidemic disease, new animals, and imperial labor systems reshaped demography, environment, and power; however, Native peoples remained active historical actors and adapted in regionally different ways rather than disappearing from history.",
                        "Although some Native political and cultural traditions persisted, the Columbian Exchange marked a major turning point in the Americas by linking the hemisphere to global trade, accelerating conquest, and causing demographic collapse among Native communities."
                    ],
                    "outlineScaffold": {
                        "contextualization": "Set up the diversity of Native societies before sustained European contact and the Atlantic ambitions of Iberian monarchies.",
                        "bodyParagraph1": {"claim": "Disease transformed Native demography and power.", "evidence": ["smallpox", "population collapse in Caribbean and Mesoamerica"], "analysis": "Explain how disease weakened communities and changed the balance of conquest."},
                        "bodyParagraph2": {"claim": "The exchange reshaped environments and economies.", "evidence": ["horses", "wheat and cattle", "maize and potatoes"], "analysis": "Show reciprocal change in both hemispheres, but keep the focus on the Americas."},
                        "bodyParagraph3": {"claim": "The exchange accelerated empire and coerced labor systems.", "evidence": ["Spanish colonization", "encomienda", "mission system"], "analysis": "Connect biological exchange to conquest, extraction, and imperial rule."},
                        "complexity": "Earn complexity by noting both transformation and Native adaptation, showing that exchange did not erase all continuity."
                    },
                    "scoringRubric": {
                        "thesis": "1 point - make a defensible argument about how extensively the Columbian Exchange transformed the Americas.",
                        "contextualization": "1 point - situate the prompt in the pre-contact diversity of Native societies and the rise of Atlantic exploration.",
                        "evidence": "2 points - use specific evidence such as disease, crops, animals, or labor systems.",
                        "analysis": "2 points - explain change over time and the relationship between exchange and conquest.",
                        "complexity": "1 point - explain both transformation and continuity or weigh benefits against catastrophic costs."
                    }
                },
                {
                    "id": "leq-002",
                    "prompt": "Evaluate the extent to which European colonization in the Americas from 1492 to 1607 was driven more by economic motives than by religious or political motives.",
                    "recommendedArgument": "Causation",
                    "thesisExamples": [
                        "European colonization was driven mostly by economic motives such as trade, bullion, and labor extraction, but those goals were inseparable from political rivalry among monarchies and religious ambitions to spread Christianity and legitimate empire.",
                        "Although religion and state rivalry mattered, the strongest engine of early colonization was the search for wealth, as seen in Spanish conquest, Atlantic trade, and European efforts to control profitable routes and resources."
                    ],
                    "outlineScaffold": {
                        "contextualization": "Begin with the search for trade routes to Asia, the rise of centralized states, and Atlantic technological advances.",
                        "bodyParagraph1": {"claim": "Economic goals were central to exploration and conquest.", "evidence": ["gold and silver", "trade routes", "forced Native labor"], "analysis": "Show how wealth extraction structured imperial behavior."},
                        "bodyParagraph2": {"claim": "Political rivalry among European states also drove colonization.", "evidence": ["Treaty of Tordesillas", "French and Dutch rivalry", "Spanish Armada"], "analysis": "Explain why empire was tied to national power."},
                        "bodyParagraph3": {"claim": "Religion helped justify and organize imperial rule.", "evidence": ["missions", "Catholic conversion", "anti-Catholic English identity"], "analysis": "Show that religion was not secondary propaganda only; it shaped colonial institutions."},
                        "complexity": "Earn sophistication by arguing that wealth, power, and religion reinforced one another instead of acting separately."
                    },
                    "scoringRubric": {
                        "thesis": "1 point - argue the relative importance of economic motives.",
                        "contextualization": "1 point - set up the Atlantic and European background before 1492.",
                        "evidence": "2 points - use precise examples from Spanish conquest and rival empires.",
                        "analysis": "2 points - explain causation and relative significance.",
                        "complexity": "1 point - show overlap among economic, political, and religious motives."
                    }
                },
            ],
            "dbq": [
                {
                    "id": "dbq-001",
                    "prompt": "Evaluate the extent to which contact between Europeans and Native Americans transformed the Americas in the period from 1491 to 1607.",
                    "documents": [
                        {"docNumber": 1, "title": "Columbus describes the Caribbean", "source": "Christopher Columbus, letter, 1493", "excerpt": "The people of these islands are generous and open, and they possess many things desirable to Christians. With fifty men we could subjugate them all and make them do whatever we wish.", "happ": {"historicalSituation": "Columbus wrote after first contact in the Caribbean.", "audience": "He addressed Spanish patrons and supporters of further voyages.", "purpose": "He wanted to justify continued exploration and colonization.", "pointOfView": "As an imperial navigator, Columbus viewed Native peoples through the lens of conquest and utility."}},
                        {"docNumber": 2, "title": "A Native person suffering from smallpox", "source": "Drawing from around 1700 depicting the earlier epidemic shock of contact", "excerpt": "The image presents an Indigenous victim marked by disease, reminding viewers that exchange carried death as well as commerce. Such epidemics spread far beyond the first landing sites.", "happ": {"historicalSituation": "European diseases spread rapidly through Native communities after contact.", "audience": "Later viewers used such images to represent the devastation of epidemics.", "purpose": "The image illustrates the biological consequences of contact.", "pointOfView": "The perspective highlights Native suffering rather than imperial triumph."}},
                        {"docNumber": 3, "title": "Bartolome de Las Casas condemns conquest violence", "source": "Las Casas, account of Spanish conquest abuses, 1542", "excerpt": "The Christians, with their horses and swords and pikes, began to carry out massacres and strange cruelties against them. They laid waste and destroyed many kingdoms and vast lands.", "happ": {"historicalSituation": "Debates over the treatment of Native peoples intensified inside the Spanish empire.", "audience": "Las Casas wrote for royal and religious readers who could influence policy.", "purpose": "He aimed to expose abuses and press for reform.", "pointOfView": "As a priest, he judged conquest through moral and religious standards."}},
                        {"docNumber": 4, "title": "Map of Spanish conquests and explorations", "source": "Historical map of early Spanish expansion", "excerpt": "The map traces Spanish movement from the Caribbean through Mexico, South America, and the northern borderlands. It makes clear that conquest created an imperial space on a continental scale.", "happ": {"historicalSituation": "Spain rapidly built the largest early empire in the Americas.", "audience": "The map serves historians and students analyzing imperial expansion.", "purpose": "It visually summarizes the scope of conquest and rule.", "pointOfView": "Maps emphasize scale and territorial claim in ways that can obscure local Native resistance."}},
                        {"docNumber": 5, "title": "French and Dutch colonial map", "source": "Historical map of New France and New Netherland", "excerpt": "The map shows French settlements following river systems and Dutch settlements clustering around commercial nodes. It suggests that not all empires relied on the same colonial model.", "happ": {"historicalSituation": "By the early seventeenth century, multiple European powers had entered North America.", "audience": "Students use the map to compare imperial systems.", "purpose": "It highlights trade-based colonization and imperial rivalry.", "pointOfView": "Cartographic comparison helps show difference but can simplify Native agency."}}
                    ],
                    "thesisExample": "From 1491 to 1607, contact transformed the Americas to a very great extent by devastating Native populations through disease, building powerful European empires through conquest and labor coercion, and tying the hemisphere to global exchange; however, the form of transformation varied because Spanish conquest differed from French and Dutch trade-centered colonization and Native peoples remained active participants in the process.",
                    "outlineScaffold": {
                        "contextualization": "Explain Native diversity before 1492 and the Atlantic ambitions of Iberian monarchies.",
                        "bodyParagraph1": {"claim": "Disease and biological exchange transformed Native societies.", "documentsUsed": [1, 2], "outsideEvidence": "smallpox and demographic collapse", "happ": "Use the purpose of Columbus's letter and the historical situation of epidemic disease."},
                        "bodyParagraph2": {"claim": "Spanish conquest and labor systems transformed the Americas politically and economically.", "documentsUsed": [3, 4], "outsideEvidence": "encomienda or mission system", "happ": "Use Las Casas's point of view to analyze criticism within empire."},
                        "bodyParagraph3": {"claim": "Transformation took different imperial forms across the hemisphere.", "documentsUsed": [5], "outsideEvidence": "fur trade or New Netherland's commercial focus", "happ": "Use maps to compare imperial models and discuss their limits."},
                        "complexity": "Show that contact created global integration and catastrophic local destruction at the same time."
                    }
                }
            ],
        },
        "mcqFacts": [
            fact("Cahokia", "Large Native urban and ceremonial centers existed in North America before European contact.", THEME["cul"], "Cahokia is important because it proves that complex Native political and economic systems existed long before 1492."),
            fact("Native regional diversity", "Native peoples developed different economies and social structures in response to varied environments.", THEME["geo"], "Regional diversity is central to Period 1 because geography shaped Native life before Europeans arrived."),
            fact("Native ideas of freedom", "Many Native societies valued autonomy and kin-based obligation rather than European-style property hierarchy.", THEME["nat"], "This topic matters because APUSH often compares Native and European definitions of freedom and order."),
            fact("Atlantic exploration", "European expansion grew from competition for trade, wealth, and imperial advantage, not simple curiosity alone.", THEME["wor"], "Exploration must be explained as part of broader state and commercial rivalry."),
            fact("the Columbian Exchange", "Sustained contact moved crops, animals, microbes, and people between hemispheres and transformed both worlds.", THEME["wor"], "The Columbian Exchange is one of the most important turning points in Period 1."),
            fact("smallpox epidemics", "Disease devastated Native populations and often reshaped the balance of conquest more than direct combat did.", THEME["cul"], "Disease is one of the strongest causal explanations for the scale of Native demographic collapse."),
            fact("Spanish conquest", "Spanish empire expanded through violence, Native alliances, missionary projects, and coerced labor systems.", THEME["pol"], "Conquest in APUSH is never just about battlefield technology."),
            fact("the encomienda", "Spanish colonization linked conquest to coerced Native labor and tribute extraction.", THEME["pol"], "Encomienda is central to understanding the political economy of New Spain."),
            fact("Las Casas", "Critics inside Spain condemned conquest abuses even while empire continued.", THEME["cul"], "Las Casas is important because he introduces moral debate and historical complexity into Spanish colonization."),
            fact("mestizo societies", "Spanish America developed racially mixed populations and caste hierarchies rather than simple settler majorities.", THEME["nat"], "This helps explain why the Spanish empire developed differently from later English colonies."),
            fact("the Black Legend", "Rival Europeans used Spanish cruelty to attack Spain and justify their own imperial ambitions.", THEME["wor"], "The Black Legend shows how propaganda and empire were linked."),
            fact("New France", "French colonization relied heavily on trade and Native alliances in the interior of North America.", THEME["wor"], "French empire is best understood through fur trading networks and diplomacy."),
            fact("New Netherland", "Dutch colonization emphasized commerce, shipping, and ethnic diversity.", THEME["wxt"], "The Dutch model shows that colonization could be trade-centered rather than conquest-centered."),
            fact("Treaty of Tordesillas", "European empires claimed and divided lands they had not fully explored or controlled.", THEME["pol"], "The treaty shows how quickly exploration turned into imperial diplomacy."),
            fact("Christopher Columbus", "Columbus's 1492 voyage created sustained contact but did not 'discover' an empty continent.", THEME["wor"], "This explanation is essential because APUSH rejects triumphalist discovery narratives."),
            fact("Samuel de Champlain", "Champlain symbolizes the French strategy of alliance, trade, and waterway empire building.", THEME["wor"], "He is significant because New France developed differently from New Spain."),
            fact("the Atlantic World", "After 1492, Europe, Africa, and the Americas became connected through exchange, migration, warfare, and empire.", THEME["wor"], "The Atlantic World is a useful umbrella concept for Period 1."),
            fact("mission systems", "Catholic missions were religious institutions but also tools of labor discipline and imperial control.", THEME["cul"], "Missions connect religion to empire in Period 1."),
            fact("John Cabot's voyage", "Non-Iberian powers quickly joined Atlantic exploration after Spain's initial breakthroughs.", THEME["wor"], "Cabot matters because English claims to North America emerged early, even before durable colonization."),
            fact("St. Augustine", "Spanish colonization in what is now the United States predated permanent English settlement.", THEME["wor"], "This fact prevents students from treating English America as the whole story of early colonization."),
        ],
        "textStimuli": [
            {"text": "The Iroquois held such absolute notions of liberty that they allow of no kind of superiority of one over another.", "caption": "European observation of Native freedom"},
            {"text": "With fifty men we could subjugate them all and make them do whatever we wish.", "caption": "Columbus on Caribbean peoples"},
            {"text": "The Christians began to carry out massacres and strange cruelties against them.", "caption": "Las Casas on Spanish conquest"},
            {"text": "The causes of faction and disorder lie not in liberty alone but in the claims of empire and profit.", "caption": "Contextualized summary of early imperial rivalry"},
        ],
        "conceptCards": [
            {"type": "Concept", "front": "Why is 1492 a turning point in APUSH?", "back": "Because it began sustained hemispheric contact that produced conquest, disease, empire, and global exchange. It is a turning point, but not the beginning of American history.", "hint": "Turning point, not starting point.", "difficulty": "Hard"},
            {"type": "Cause-Effect", "front": "Why did Europeans expand into the Atlantic?", "back": "Trade with Asia, competition among states, improved navigation, missionary goals, and the search for wealth all pushed Atlantic exploration forward.", "hint": "Think trade, empire, religion, technology.", "difficulty": "Medium"},
            {"type": "Document", "front": "Black Legend", "back": "The Black Legend was the portrayal of Spain as especially cruel and tyrannical in the Americas. Rival empires used it to attack Spain and justify their own colonial projects.", "hint": "Imperial propaganda matters.", "difficulty": "Medium"},
            {"type": "Comparison", "front": "Spanish empire vs. French empire", "back": "Spain built large conquest states and labor systems; France depended more on trade, sparse settlement, and Native alliance networks. The contrast is a classic APUSH comparison.", "hint": "Conquest versus commerce.", "difficulty": "Hard"},
        ],
    }
)


chapter_specs.append(
    {
        "chapterId": "chapter2",
        "chapterNum": 2,
        "chapterOrder": 2,
        "periodId": "p2",
        "periodNumber": 2,
        "chapterMeta": {
            "period": "Period 2",
            "periodId": "p2",
            "dateRange": "1607-1754",
            "apExamWeight": "6-8%",
            "chapterTitle": "Beginnings of English America, 1607-1660",
            "chapterSubtitle": "England's colonies, labor systems, and the competing meanings of liberty",
            "bigPictureThemes": [THEME["mig"], THEME["pol"], THEME["cul"], THEME["wxt"]],
            "oneLineSummary": "English colonization created very different regional societies in the Chesapeake and New England, but both depended on aggressive land claims, labor coercion, and political ideas about liberty that excluded many people.",
            "periodContext": "Period 2 begins when the English established durable colonies in North America and started building settler societies that would eventually outlast their rivals. APUSH asks students to explain not only why the English came, but also why colonies within the same empire developed such different labor systems, religious cultures, and political expectations.",
            "examTips": [
                "Always compare Chesapeake and New England by cause, not just by description: profit and dispersed tobacco agriculture produced one model, while Puritan migration and town settlement produced another.",
                "Do not describe indentured servitude and slavery as interchangeable; in this chapter, the labor system is still in transition and race has not yet fully hardened into the eighteenth-century slave regime.",
                "AP questions often connect English ideas of rights and self-government to colonial institutions such as the House of Burgesses, the Mayflower Compact, and Puritan covenants.",
            ],
        },
        "images": [
            image(2, "ch02ph06", "jpg", "English expansion into the Atlantic grew out of political conflict, religious rivalry, and colonial experiments already visible in Ireland.", "This image matters because it reminds students that English colonization in America was shaped by earlier English efforts to conquer, settle, and control other peoples.", [THEME["wor"], THEME["pol"]], category="Engraving"),
            image(2, "ch02map01", "png", "The Chesapeake map shows how geography, rivers, and scattered settlement shaped early Virginia and Maryland.", "This map is AP-important because the region's river networks and fertile land made tobacco exports possible while also weakening town life and centralized control.", [THEME["geo"], THEME["mig"]], category="Map"),
            image(2, "ch02ph10", "jpg", "The Jamestown image captures the fragility of the first permanent English colony in North America.", "It is a strong visual for disease, hunger, conflict, and the improvised character of early English settlement.", [THEME["mig"], THEME["pol"]], category="Reconstruction"),
            image(2, "ch02ph11", "jpg", "Tobacco labor transformed the Chesapeake into an export economy built on land hunger and bound labor.", "This image is useful because it connects agricultural profit to indentured servitude, inequality, and expansion onto Native land.", [THEME["wxt"], THEME["mig"]], category="Painting"),
            image(2, "ch02ph13", "png", "Encounters between English settlers and Powhatan peoples shaped survival, diplomacy, and violence in early Virginia.", "The image matters because English America was created through Native alliance and Native resistance, not through isolation from Native peoples.", [THEME["wor"], THEME["cul"]], category="Illustration"),
            image(2, "ch02map02", "png", "New England's clustered settlements reflected migration by families, religious purpose, and town-centered life.", "The map helps students see why New England developed stronger local institutions, tighter communities, and a different labor system from the Chesapeake.", [THEME["geo"], THEME["mig"]], category="Map"),
            image(2, "ch02ph22", "jpg", "Puritan leaders imagined Massachusetts as a disciplined covenanted society with collective religious purpose.", "This image is important because it anchors the idea of a 'city upon a hill' and the close relationship between church membership and political authority.", [THEME["cul"], THEME["pol"]], category="Portrait"),
            image(2, "ch02ph24", "jpg", "Roger Williams and other dissenters exposed the limits of Puritan religious uniformity.", "The image is useful because it pushes students beyond the myth that New England simply stood for liberty; it also practiced coercion and exclusion.", [THEME["cul"], THEME["pol"]], category="Portrait"),
            image(2, "ch02ph30", "jpg", "The English Civil War era tied colonial debates over authority to larger Atlantic struggles over rights and sovereignty.", "This visual matters because colonial political language did not emerge in isolation; it grew out of upheaval inside England itself.", [THEME["pol"], THEME["wor"]], category="Engraving"),
        ],
        "notes": {
            "historicalContext": {
                "overview": "By the early seventeenth century, Spain had already built the strongest early American empire, but England was ready to compete. Population growth, enclosure, economic dislocation, anti-Catholic rivalry, and ambitions for trade all pushed English leaders toward overseas expansion. North America offered land, strategic advantage, and the possibility of profitable commodities, but early settlement was unstable and often deadly. The colonies that survived did so by adapting to local geography, extracting labor, and creating institutions that mixed dependency on England with growing habits of self-rule.",
                "precedingCauses": [
                    "The defeat of the Spanish Armada increased English confidence in challenging Iberian Atlantic power.",
                    "Joint-stock investment allowed colonization to be organized through chartered companies rather than by the crown alone.",
                    "English social and economic change, including enclosure and population pressure, pushed many people to seek opportunity abroad.",
                    "Religious conflict in England encouraged some migrants to imagine colonies as places for reforming society.",
                    "Native polities in the Chesapeake and New England already controlled the lands the English hoped to settle.",
                ],
                "geographicContext": "The Chesapeake's warm climate, long growing season, and navigable rivers favored tobacco and dispersed plantations, while New England's rocky soil, colder climate, and harbors encouraged mixed farming, trade, and compact towns. Geography did not determine everything, but it made some labor systems, migration patterns, and political institutions more likely than others.",
                "contextImage": {"imageId": "ch02map01", "displayCaption": "The contrasting geography of the Chesapeake and New England helps explain why English America did not develop in one uniform pattern."},
            },
            "sections": [
                note_section(
                    "England, Ireland, and the Atlantic Push",
                    [THEME["wor"], THEME["pol"], THEME["mig"]],
                    "English colonization grew out of domestic instability as much as overseas curiosity. Sixteenth- and seventeenth-century England faced poverty, population growth, religious conflict, and sharp competition with Catholic Spain. English leaders also brought to America techniques already tested in Ireland, where conquest, plantation settlement, and claims of cultural superiority shaped imperial thinking. Colonization promised raw materials, markets, strategic outposts, and a way to weaken Spanish power. The early English Atlantic world therefore began with a mix of commercial calculation, Protestant identity, and political ambition. APUSH cares about this because it explains why English settlement was aggressive from the start and why colonists carried English assumptions about land, labor, and rights with them.",
                    ["English rivalry with Spain", "Domestic social dislocation and poverty", "State and commercial interest in Atlantic expansion"],
                    ["Chartered colonies emerged", "English empire adopted settler and plantation strategies", "Colonists transplanted English conflicts into America"],
                    "This section matters because it places English America inside a larger imperial project and connects colonization to English political culture rather than treating settlement as accidental.",
                    ["Connects to Period 1 comparisons between Spanish, French, Dutch, and English imperial models.", "Foreshadows later colonial arguments that English rights belonged to settlers overseas as well as subjects at home."],
                    key_figures=[
                        figure("Sir Humphrey Gilbert", "Early English colonization advocate", "Gilbert argued that England needed colonies for strategic and economic reasons. He helped define the language of English imperial expansion before durable settlement took hold.", "He matters because he represents the early fusion of commerce, conquest, and Protestant empire.", "He represented English settler colonial ambition."),
                        figure("Walter Raleigh", "Courtier and colonization promoter", "Raleigh backed failed efforts such as Roanoke, but those projects still mattered because they kept English attention fixed on North America. They also linked colonization to elite patronage and anti-Spanish strategy.", "APUSH cares because failed colonies still shaped the mentality behind Jamestown.", "He represented aristocratic promotion of Atlantic empire."),
                    ],
                    primary_sources=["Richard Hakluyt's promotional writings", "English propaganda contrasting Protestant and Catholic empires"],
                    section_images=[{"imageId": "ch02ph06", "displayCaption": "English colonization in America built on methods of plantation and conquest already visible closer to home."}],
                ),
                note_section(
                    "Jamestown and the Chesapeake Tobacco Economy",
                    [THEME["wxt"], THEME["mig"], THEME["pol"]],
                    "Jamestown survived only after years of crisis. The Virginia Company hoped for quick wealth, but colonists encountered starvation, disease, poor leadership, and uneasy dependence on Powhatan peoples. John Smith's discipline and Native trade helped keep the colony alive temporarily, but the real turning point came when John Rolfe made tobacco cultivation profitable. Tobacco tied Virginia to Atlantic markets, encouraged rapid demand for land, and created a scattered plantation society that was difficult to govern. As colonists pushed outward, violence with Native communities intensified. The Chesapeake therefore became profitable, but profit produced instability as well as growth.",
                    ["Virginia Company investment", "English search for valuable export commodities", "Powhatan control of surrounding land and trade"],
                    ["Tobacco boom transformed Virginia", "Settlement spread along rivers", "Conflicts with Native peoples escalated"],
                    "This section is central to APUSH because it explains how an initially failing colony became sustainable and why economic success in the Chesapeake depended on expansion and coercion.",
                    ["Connects to later plantation slavery because tobacco created the labor-hungry export model.", "Prepares students for Bacon's Rebellion and later racial slavery by showing how inequality first grew in the Chesapeake."],
                    key_figures=[
                        figure("John Smith", "Leader at Jamestown", "Smith imposed discipline during Jamestown's earliest years and negotiated with Powhatan communities. His actions did not solve Virginia's problems permanently, but they helped the colony survive its weakest phase.", "He matters because APUSH often treats him as a symbol of the colony's fragile beginnings rather than its long-term success.", "He represented hardline survival and military discipline in the early Chesapeake.", "ch02ph10"),
                        figure("John Rolfe", "Planter and tobacco pioneer", "Rolfe cultivated a strain of tobacco that sold successfully in European markets. His crop made Virginia economically viable and reshaped settlement patterns across the Chesapeake.", "He matters because tobacco, more than gold or silver, explains the survival of English America in Virginia.", "He represented the turn toward export agriculture and land-intensive profit."),
                        figure("Powhatan", "Leader of the Powhatan Confederacy", "Powhatan oversaw a powerful Native confederacy that initially constrained and negotiated with the English. His world shaped whether Jamestown lived or died.", "He matters because the English did not enter empty land; they entered Native political space.", "He represented Native sovereignty and strategic diplomacy in early Virginia.", "ch02ph13"),
                    ],
                    primary_sources=["John Smith's accounts of Virginia", "Virginia Company promotional materials"],
                    section_images=[
                        {"imageId": "ch02ph10", "displayCaption": "Jamestown's survival was uncertain for years before tobacco made the colony profitable."},
                        {"imageId": "ch02ph11", "placement": "after-key-figures", "displayCaption": "Tobacco changed the Chesapeake from a survival outpost into an expanding plantation colony."},
                    ],
                ),
                note_section(
                    "Indentured Servitude, 1619, and Chesapeake Labor",
                    [THEME["wxt"], THEME["nat"], THEME["mig"]],
                    "The Chesapeake needed workers long before a fully racialized slave system was in place. Planters first relied heavily on indentured servants, Europeans who traded years of labor for passage to America. This system fit a high-mortality society because masters did not initially expect workers to live long enough to become major competitors. The year 1619 became significant because Virginia gained the House of Burgesses at the same moment the first recorded Africans arrived in the colony. At this stage, the labor system was still fluid, but the combination of tobacco expansion, bound labor, and political self-government would shape the region permanently. Students need to see 1619 as a foundational turning point in both representative government and labor coercion.",
                    ["Labor shortages in tobacco colonies", "High demand for workers and land", "Company and planter reliance on migration and unfree labor"],
                    ["Indentured servitude expanded rapidly", "African labor entered English America", "Representative political institutions took root in Virginia"],
                    "This section matters because APUSH frequently asks students to explain how liberty for some colonists developed alongside unfreedom for others.",
                    ["Connects directly to Chapter 3 on the hardening of racial slavery.", "Foreshadows later tensions between elite planters and landless laborers."],
                    key_figures=[
                        figure("Virginia planters", "Colonial elite", "Planters demanded cheap labor and access to land, which pushed the Chesapeake toward both bound labor and representative institutions that protected property.", "They matter because the region's political culture served economic priorities from the start.", "They represented the interests of landholding colonial elites."),
                    ],
                    primary_sources=["Records of the House of Burgesses", "Indenture contracts", "Early Virginia legal records on African labor"],
                    section_images=[{"imageId": "ch02ph11", "displayCaption": "Chesapeake prosperity rested on bound labor years before slavery became fully codified in law."}],
                ),
                note_section(
                    "Puritan Migration and the New England Way",
                    [THEME["cul"], THEME["mig"], THEME["pol"]],
                    "New England was founded for different reasons and therefore developed differently. Puritans migrated in family groups rather than as isolated male laborers, and they wanted to build a godly commonwealth that would reform English Protestantism by example. John Winthrop's idea of a 'city upon a hill' captured both the confidence and the pressure of this project. Town-centered settlement, higher life expectancy, and more balanced sex ratios produced stable communities, schools, and local governments. Church membership and civic power overlapped closely, although not everyone was included equally. New England society was more cohesive than the Chesapeake, but that cohesion depended on discipline and conformity rather than broad modern-style liberty.",
                    ["Puritan dissatisfaction with the Church of England", "Migration during the political and religious tensions of the 1630s", "Family-based settlement patterns"],
                    ["Compact towns and local institutions developed", "Religious ideals shaped political participation", "New England became demographically more stable than the Chesapeake"],
                    "This section matters because comparison questions often ask students to explain why New England and the Chesapeake diverged despite belonging to the same empire.",
                    ["Connects to the Great Awakening in Chapter 4 because New England's religious culture later fractured from within.", "Links to later American exceptionalist language through Winthrop's famous sermon."],
                    key_figures=[
                        figure("John Winthrop", "Governor of Massachusetts Bay", "Winthrop helped lead the Puritan migration and articulated the ideal of a covenanted community watched by God and by the world. His vision shaped both New England's sense of purpose and its pressure for conformity.", "He matters because he is the clearest APUSH figure for understanding Puritan social order.", "He represented elite Puritan leadership and communal religious discipline.", "ch02ph22"),
                    ],
                    primary_sources=["John Winthrop, 'A Modell of Christian Charity'", "The Mayflower Compact", "New England town records"],
                    section_images=[
                        {"imageId": "ch02map02", "displayCaption": "New England's clustered settlements reflected family migration, communal religion, and town government."},
                        {"imageId": "ch02ph22", "placement": "after-key-figures", "displayCaption": "Puritan leaders imagined liberty as the freedom to live within a godly moral order, not outside it."},
                    ],
                ),
                note_section(
                    "Dissent, Native War, and the Limits of Puritan Unity",
                    [THEME["cul"], THEME["pol"], THEME["wor"]],
                    "Puritan New England was never as unanimous as its leaders hoped. Roger Williams attacked the idea that magistrates should enforce religion and argued that colonists had no right to seize Native land without fair purchase. Anne Hutchinson challenged clerical authority by claiming that grace came through direct spiritual experience rather than through ministers' discipline. At the same time, the Pequot War showed how quickly English settlement could turn into exterminatory violence against Native peoples. These conflicts reveal that New England liberty depended on exclusion: dissenters could be banished, and Native communities could be treated as obstacles rather than neighbors. This is a major APUSH theme because it complicates any simple story of colonial freedom.",
                    ["Religious disagreement inside Puritan communities", "Expansion onto Native land", "Tension between communal discipline and personal conscience"],
                    ["Rhode Island emerged as a haven for dissent", "The Pequot War deepened English-Native hostility", "Puritan claims to moral unity weakened"],
                    "This section matters because students are often tempted to equate New England with liberty; the AP exam rewards answers that show liberty and coercion developing together.",
                    ["Connects to later traditions of religious toleration and church-state separation.", "Foreshadows future Native wars and colonial expansion across New England."],
                    key_figures=[
                        figure("Roger Williams", "Founder of Rhode Island", "Williams argued for religious liberty, separation of church and state, and fair dealing with Native peoples. Banished from Massachusetts, he built Rhode Island as a more tolerant alternative.", "He matters because he represents one of the earliest and clearest colonial arguments for liberty of conscience.", "He represented radical religious dissent and separation of church and state.", "ch02ph24"),
                        figure("Anne Hutchinson", "Puritan dissenter", "Hutchinson criticized the colony's ministers and challenged male religious authority. Her trial exposed how gender and theology could both threaten Puritan hierarchy.", "She matters because APUSH often uses her case to show the boundaries of acceptable speech in colonial New England.", "She represented religious dissent and a challenge to clerical authority."),
                    ],
                    primary_sources=["Roger Williams, 'The Bloudy Tenent of Persecution'", "Anne Hutchinson trial transcript"],
                    section_images=[{"imageId": "ch02ph24", "displayCaption": "Dissenters like Roger Williams exposed how tightly political power and religious conformity were linked in Massachusetts."}],
                ),
                note_section(
                    "English Civil War, Colonial Rights, and Political Change",
                    [THEME["pol"], THEME["wor"], THEME["nat"]],
                    "Colonial politics cannot be separated from English politics. The English Civil War, the execution of Charles I, Puritan rule under Oliver Cromwell, and the Restoration all affected colonial government, trade, and ideas about authority. Maryland's Toleration Act showed that religious conflict could produce pragmatic compromise, even if that compromise remained incomplete. Colonists increasingly believed that as English subjects they possessed customary rights, local assemblies, and some say over taxation and law. Those expectations did not yet amount to independence, but they laid the groundwork for later resistance. Chapter 2 therefore ends with English America still dependent on the mother country, yet already developing local political habits that would matter enormously later.",
                    ["Civil war and revolution in England", "Conflicts over church governance and royal power", "Colonial demand for local autonomy"],
                    ["Assemblies gained legitimacy", "Religious toleration expanded unevenly", "Colonists tied liberty to the rights of English subjects"],
                    "This section matters because the roots of American revolutionary ideology lie partly in seventeenth-century English constitutional struggles.",
                    ["Connects directly to the Glorious Revolution in Chapter 3.", "Foreshadows colonial claims in the 1760s and 1770s that taxation and arbitrary power violated inherited English liberties."],
                    key_figures=[
                        figure("Oliver Cromwell", "Leader of the English Commonwealth", "Cromwell's rule showed that the English monarchy was not untouchable and that political upheaval could reshape the empire. His period in power affected trade rules, religion, and colonial administration.", "He matters because colonial political culture grew up inside an Atlantic world of constitutional crisis.", "He represented militant Puritan republicanism in England."),
                        figure("Cecilius Calvert, Lord Baltimore", "Proprietor of Maryland", "The Calverts created Maryland as a proprietary colony and a refuge for English Catholics, though conflict with Protestants remained intense. Maryland became an early test case for limited religious toleration in the English Atlantic.", "He matters because Maryland shows that religious policy in English America was pragmatic, contested, and tied to power.", "He represented proprietary rule and Catholic minority interests in the English empire."),
                    ],
                    primary_sources=["Maryland Toleration Act", "English Bill of Rights antecedents in Civil War pamphlets"],
                    section_images=[{"imageId": "ch02ph30", "displayCaption": "Colonial notions of rights and representation were shaped by the larger English struggle over sovereignty."}],
                ),
            ],
            "overarchingAnalysis": {
                "continuity": "Colonization continued to depend on Native dispossession, imperial rivalry, and the belief that some groups had the right to rule others. Even when colonies spoke the language of liberty, that liberty remained limited by class, gender, religion, and labor status.",
                "change": "By 1660, the English had moved from fragile coastal footholds to durable regional societies with distinct economies, labor systems, churches, and political institutions. The colonies were no longer speculative experiments; they were becoming permanent parts of the Atlantic world.",
                "complexity": "A strong complexity point comes from showing that English America expanded liberty and unfreedom at the same time. Colonists created assemblies, covenants, and arguments for conscience, but they also built societies on conquest, exclusion, and bound labor.",
                "comparisonAngles": [
                    "Compare the Chesapeake and New England in terms of labor systems, settlement patterns, religion, and family life.",
                    "Compare English settlement in North America with Spanish colonization in Period 1, especially around labor, religion, and Native relations.",
                ],
            },
        },
        "periodTimeline": [
            event("chapter2", "p2", "chapter2-virginia-company-charter", 1606, "Virginia Company Charter", "The English crown chartered the Virginia Company in 1606 to finance settlement in North America. The charter launched England's first durable colonial project in the Chesapeake.", "The Virginia Company was a joint-stock enterprise that sought profit, strategic leverage, and imperial expansion. Investors hoped to find valuable commodities and weaken Spain's hold on the Americas. The charter shows that English colonization was commercial and political from the beginning. It also demonstrates that private investment and royal authority worked together in building empire. Jamestown would be the charter's first major test. The colony's fortunes would shape later English settlement.", ["Political", "Economic"], [THEME["wor"], THEME["wxt"]], ["Virginia Company"], ["English imperial rivalry", "Joint-stock investment"], ["Jamestown established", "Commercial colonization accelerated"], ["chapter2-jamestown-founded"], "Medium", False, "Useful context for essays about why the English colonized North America.", "Jamestown was not simply a crown colony at the start.", image_id="ch02map01"),
            event("chapter2", "p2", "chapter2-jamestown-founded", 1607, "Jamestown Founded", "Jamestown became the first permanent English settlement in North America in 1607. Its survival marked the beginning of long-term English colonization.", "English settlers founded Jamestown along the James River in 1607. The colony nearly collapsed because many settlers expected quick wealth rather than agricultural labor, and disease and hunger were severe. Powhatan diplomacy and trade often kept the colony alive during its most desperate years. Jamestown mattered because, unlike Roanoke, it endured long enough to anchor a lasting English presence. Its early instability also revealed how dependent colonists were on Native peoples and local geography. Later tobacco production would finally make the colony profitable.", ["Political", "Migration"], [THEME["mig"], THEME["pol"]], ["John Smith", "Powhatan"], ["Virginia Company colonization", "English imperial ambition"], ["Permanent English foothold established", "Future Chesapeake expansion"], ["chapter2-tobacco-boom", "chapter2-1619-turning-point"], "High", True, "A foundational APUSH event for Period 2 context and causation.", "Jamestown survived, but only after years of failure and dependence.", image_id="ch02ph10"),
            event("chapter2", "p2", "chapter2-tobacco-boom", 1612, "Tobacco Cultivation Takes Off", "John Rolfe's tobacco cultivation made Virginia profitable after 1612. Tobacco transformed the Chesapeake into a labor-hungry export colony.", "The discovery that a marketable strain of tobacco could be grown in Virginia changed the colony's future. European demand for tobacco was immense, and Chesapeake planters rushed to clear land and expand production. Tobacco exports tied Virginia more tightly to Atlantic trade and made settlement economically viable. It also created constant pressure for workers and new land. As settlement spread, conflict with Native communities intensified. The tobacco boom made prosperity possible, but it also made inequality and instability deeper.", ["Economic"], [THEME["wxt"], THEME["mig"]], ["John Rolfe"], ["Need for profitable exports", "Atlantic demand for tobacco"], ["Chesapeake economy boomed", "Labor demand surged"], ["chapter2-1619-turning-point"], "High", True, "Strong evidence for causation essays about colonial regional development.", "Jamestown survived because of tobacco profits, not because gold was found.", image_id="ch02ph11"),
            event("chapter2", "p2", "chapter2-1619-turning-point", 1619, "House of Burgesses and First Recorded Africans", "Virginia established the House of Burgesses in 1619, and the first recorded Africans arrived that same year. The event symbolizes the linked growth of self-government and labor coercion.", "The year 1619 carried two major developments in Virginia. Colonists gained an elected assembly, the House of Burgesses, which gave local elites a voice in lawmaking. The same year, Africans were brought to the colony, signaling the beginning of African labor in English North America. Although slavery was not yet fully codified, the labor system was moving toward greater coercion. APUSH treats 1619 as significant because liberty for some colonists developed alongside unfreedom for others. The event became one of the defining contradictions of English America.", ["Political", "Social"], [THEME["pol"], THEME["nat"]], ["Virginia burgesses"], ["Need for local governance", "Labor demand in tobacco economy"], ["Representative assembly established", "African labor introduced"], ["chapter3-virginia-partus-law", "chapter3-slave-code-1705"], "High", True, "One of the most AP-critical dates in early colonial history.", "1619 did not instantly create a fully developed racial slave system, but it did mark a crucial beginning.", image_id="ch02ph11"),
            event("chapter2", "p2", "chapter2-mayflower-compact", 1620, "Mayflower Compact and Plymouth Settlement", "Pilgrims founded Plymouth in 1620 and created the Mayflower Compact. The agreement became an early example of self-government by covenant.", "Separatist migrants later called Pilgrims landed in New England outside the boundaries of their original patent. To preserve order, male heads of household agreed to the Mayflower Compact before disembarking. The document did not create democracy in a modern sense, but it did express the idea that legitimate government could rest on mutual agreement. Plymouth remained smaller than Massachusetts Bay, yet its founding became symbolically important. APUSH uses the Compact as evidence of consent-based political culture in colonial New England. It also shows how religion and governance were intertwined.", ["Political", "Cultural"], [THEME["pol"], THEME["cul"]], ["Pilgrims"], ["Religious dissent", "Need for orderly self-rule"], ["Plymouth established", "Covenantal self-government modeled"], ["chapter2-massachusetts-charter"], "High", True, "Common evidence for colonial self-government and covenant ideas.", "The Mayflower Compact was not a declaration of independence or universal democracy.", image_id="ch02map02"),
            event("chapter2", "p2", "chapter2-powhatan-uprising", 1622, "Powhatan Uprising", "Powhatan forces attacked English settlements in 1622, killing hundreds of colonists. The uprising intensified the cycle of expansion and retaliatory war in Virginia.", "As English tobacco settlement spread outward, Powhatan communities faced mounting pressure on land and food supplies. In 1622, coordinated attacks killed roughly a quarter of the English population in Virginia. The violence shocked colonists and hardened English attitudes toward Native peoples. English leaders responded with harsher warfare and greater determination to dominate the region. The uprising reveals that Native peoples remained powerful actors capable of organized resistance. It also showed that coexistence on English terms was increasingly unlikely.", ["Military", "Political"], [THEME["wor"], THEME["mig"]], ["Powhatan Confederacy"], ["English expansion onto Native land"], ["War intensified in Virginia", "English attitudes toward Native peoples hardened"], [], "Medium", False, "Useful evidence for Native resistance in Chesapeake colonization.", "Native peoples were not passive victims of colonial expansion.", image_id="ch02ph13"),
            event("chapter2", "p2", "chapter2-virginia-royal-colony", 1624, "Virginia Becomes a Royal Colony", "The crown dissolved the Virginia Company in 1624 and made Virginia a royal colony. The move reflected both the colony's troubles and its growing importance.", "After years of mismanagement and high mortality, the Virginia Company lost its charter. The English crown took direct control of Virginia in 1624. Royal status did not eliminate the House of Burgesses, so local self-government survived under imperial oversight. This combination of crown authority and local assembly became typical of later English colonial practice. The shift also showed that failed private management could give way to more stable imperial administration. Virginia's future was now tied directly to the English state.", ["Political"], [THEME["pol"], THEME["wor"]], ["James I"], ["Virginia Company's failures"], ["Direct crown oversight increased", "Colonial assemblies endured"], [], "Medium", False, "Useful for explaining how imperial oversight and self-government coexisted.", "Royal colony status did not erase local political participation.", image_id="ch02map01"),
            event("chapter2", "p2", "chapter2-massachusetts-charter", 1629, "Massachusetts Bay Receives Charter", "The Massachusetts Bay Company received a royal charter in 1629. It provided the legal basis for the major Puritan migration to New England.", "Puritan investors secured a charter for Massachusetts Bay during a period of religious tension in England. Unlike Virginia's early settlement, Massachusetts attracted families, ministers, and leaders who wanted to build a reformed Christian society. The charter gave them unusual freedom to transplant corporate governance into New England. This allowed colonial leaders to exercise authority with relatively little direct supervision at first. The charter therefore helped produce both Puritan self-rule and Puritan orthodoxy. It prepared the way for the Great Migration of the 1630s.", ["Political", "Migration"], [THEME["mig"], THEME["pol"]], ["John Winthrop"], ["Puritan discontent in England"], ["Massachusetts Bay organized", "Large-scale migration encouraged"], ["chapter2-great-migration"], "Medium", False, "Important for explaining why Massachusetts differed from the Chesapeake.", image_id="ch02map02"),
            event("chapter2", "p2", "chapter2-great-migration", 1630, "Great Puritan Migration", "Thousands of Puritans migrated to New England in the 1630s under leaders such as John Winthrop. Their migration created a more stable, family-based colonial society.", "Beginning in 1630, waves of Puritans crossed the Atlantic and established settlements around Massachusetts Bay. Unlike the mostly male Chesapeake pattern, these migrants often came in families and expected to remain permanently. Their communities built churches, schools, and town governments around shared religious assumptions. The migration gave New England a distinctive demographic and political profile. It also fostered a sense that the colony served as a moral example to England and the wider world. APUSH uses this migration to explain regional divergence inside English America.", ["Migration", "Cultural"], [THEME["mig"], THEME["cul"]], ["John Winthrop"], ["Religious conflict in England", "Puritan desire to build a godly society"], ["Town-centered New England developed", "Family migration stabilized the region"], ["chapter2-roger-williams-rhode-island"], "High", True, "Essential comparison evidence for Chesapeake versus New England essays.", "New England was not settled primarily by profit-seeking single men.", image_id="ch02ph22"),
            event("chapter2", "p2", "chapter2-maryland-founded", 1634, "Maryland Founded", "Maryland was founded in 1634 as a proprietary colony under the Calvert family. It became an important test case for religion, property, and politics in English America.", "Cecilius Calvert, Lord Baltimore, founded Maryland partly as a refuge for English Catholics and partly as a profitable colony. Like Virginia, Maryland relied on tobacco and eventually developed a plantation economy. But its religious mix made politics more volatile, since Protestant majorities often distrusted Catholic leadership. Maryland's development demonstrates that colonies could resemble one another economically while differing sharply in religious politics. It also shows how proprietary rule fit within the broader English imperial system. The colony would later pass a limited act of toleration to preserve social peace.", ["Political", "Migration"], [THEME["pol"], THEME["cul"]], ["Lord Baltimore"], ["Catholic minority insecurity in England", "Desire for proprietary profit"], ["New proprietary colony created", "Religious conflict institutionalized"], ["chapter2-maryland-toleration-act"], "Medium", False, "Useful evidence for religious diversity in English America."),
            event("chapter2", "p2", "chapter2-roger-williams-rhode-island", 1636, "Roger Williams Founds Rhode Island", "Roger Williams founded Rhode Island in 1636 after his banishment from Massachusetts. The colony became a landmark for religious liberty and church-state separation.", "Williams argued that civil government should not control religion and that colonists should purchase Native land rather than simply claim it. Massachusetts authorities considered his ideas dangerously subversive and expelled him. He then founded Providence and helped create Rhode Island. The colony welcomed dissenters and became known for broader freedom of conscience. In APUSH, Rhode Island matters because it demonstrates that even in the seventeenth century some colonists defended a wider definition of liberty than Puritan leaders did. Williams's ideas later echoed in American traditions of religious liberty.", ["Political", "Cultural"], [THEME["cul"], THEME["pol"]], ["Roger Williams"], ["Puritan intolerance of dissent"], ["Rhode Island created", "Religious toleration expanded"], [], "High", False, "Excellent evidence for essays on religion and liberty.", "Rhode Island's freedom of conscience developed because dissenters were excluded elsewhere.", image_id="ch02ph24"),
            event("chapter2", "p2", "chapter2-pequot-war", 1637, "Pequot War", "The Pequot War of 1637 was one of the earliest large-scale wars between New England colonists and Native peoples. The conflict showed how brutally English settlement could expand.", "Tensions over trade, alliance, and territory escalated into full war between New England colonists, their Native allies, and the Pequots. English forces and allied Native warriors destroyed the Pequot fort at Mystic and killed many of its inhabitants. The massacre revealed the violent underside of Puritan expansion. It also strengthened English confidence that God favored their colonial mission. For APUSH, the war demonstrates that New England liberty coexisted with conquest and ethnic violence. Native power in southern New England was not erased, but it was badly shaken.", ["Military"], [THEME["wor"], THEME["pol"]], ["Pequot leaders", "English colonists"], ["Competition over land and trade"], ["Pequot power broken", "English expansion accelerated"], ["chapter3-king-philips-war"], "High", True, "Strong evidence for Native-colonial conflict in New England.", "The conflict was not a simple defensive response by colonists; it also enabled expansion.", image_id="ch02map02"),
            event("chapter2", "p2", "chapter2-anne-hutchinson-banished", 1638, "Anne Hutchinson Banished", "Anne Hutchinson was banished from Massachusetts after challenging colonial ministers and magistrates. Her case exposed the gendered limits of Puritan authority.", "Hutchinson held meetings in which she criticized ministers and emphasized personal revelation over clerical mediation. Massachusetts leaders feared that her ideas threatened both church order and civil order. She was tried, condemned, and banished in 1638. The controversy revealed deep anxiety about dissent, charisma, and women's public speech in Puritan society. It also showed that New England political liberty depended on theological boundaries that leaders enforced aggressively. APUSH uses Hutchinson to complicate romantic images of colonial self-government.", ["Political", "Cultural"], [THEME["cul"], THEME["pol"]], ["Anne Hutchinson"], ["Puritan insistence on religious conformity"], ["Massachusetts dissent suppressed", "Limits of liberty exposed"], [], "Medium", False, "Helpful evidence for gender, religion, and authority in colonial history."),
            event("chapter2", "p2", "chapter2-english-civil-war", 1642, "English Civil War Begins", "Civil war erupted in England in 1642 between supporters of Parliament and the king. The conflict shaped politics and ideas across the English Atlantic.", "Disputes over taxation, religion, and sovereignty pushed England into civil war in 1642. Colonists followed the struggle closely because they still identified as English subjects and depended on English institutions. The war unsettled imperial administration but also widened debates about rights and representation. Different colonies responded in different ways depending on local interests and religious alignments. The event matters in APUSH because later American political language about tyranny and liberty grew partly out of these English struggles. Colonial society remained provincial, but it was never politically isolated.", ["Political", "Military"], [THEME["pol"], THEME["wor"]], ["Charles I", "Parliament"], ["Conflict over religion and royal power"], ["Atlantic political debate intensified", "Colonial rights language deepened"], ["chapter3-glorious-revolution"], "Medium", False, "Useful context for the development of political ideas in English America.", image_id="ch02ph30"),
            event("chapter2", "p2", "chapter2-maryland-toleration-act", 1649, "Maryland Toleration Act", "Maryland passed the Toleration Act in 1649 to protect Trinitarian Christians from persecution. The act showed both the possibilities and the limits of religious toleration.", "Maryland's Catholic proprietors needed some legal peace in a colony with many Protestant settlers. The Toleration Act granted protection to Christians who accepted the Trinity, but it did not create broad modern religious liberty. It remained exclusionary toward non-Christians and atheists and could be reversed by political conflict. Even so, the law was notable because it recognized the impracticality of strict religious monopoly in a diverse colony. APUSH uses it as evidence that toleration in English America often emerged from conflict and necessity rather than pure idealism. The act also highlights the difference between toleration and equality.", ["Political", "Cultural"], [THEME["cul"], THEME["pol"]], ["Maryland assembly"], ["Religious conflict in proprietary Maryland"], ["Limited toleration codified", "Religious compromise became part of colonial politics"], [], "Medium", False, "Useful nuance for essays on religious liberty."),
            event("chapter2", "p2", "chapter2-restoration", 1660, "Restoration of Charles II", "The monarchy was restored in England in 1660 under Charles II. Restoration politics helped usher in a new phase of imperial management and colonial expansion.", "After years of republican rule, Charles II returned to the throne in 1660. The Restoration reasserted monarchy but did not erase the memory of civil war and revolution. English leaders now pursued a more systematic imperial policy through commerce, navigation laws, and new colonies. For North America, the Restoration marked a shift from early survival colonies to a more coordinated empire. Colonial assemblies still mattered, but imperial oversight would become more ambitious. APUSH often uses 1660 as a transition point into the later seventeenth-century world of empire and regulation.", ["Political"], [THEME["pol"], THEME["wor"]], ["Charles II"], ["End of English Commonwealth"], ["Imperial reorganization intensified", "New colonies and regulations followed"], ["chapter3-navigation-act-1660"], "Medium", False, "Good transition into Chapter 3 themes.", image_id="ch02ph30"),
        ],
        "overallTimelineEvents": [
            overall_event("chapter2-jamestown-founded", 1607, "Jamestown Founded", "The first permanent English settlement anchors the beginning of durable English America.", 2, "This event belongs on the master APUSH timeline because it begins the long English colonial project that shaped most later American institutions.", ["Political"]),
            overall_event("chapter2-1619-turning-point", 1619, "House of Burgesses and First Recorded Africans", "Virginia links representative government and African labor in one foundational year.", 2, "This is a master timeline event because it captures the central contradiction of colonial America: self-government expanding alongside unfreedom.", ["Political", "Social"]),
            overall_event("chapter2-mayflower-compact", 1620, "Mayflower Compact", "Plymouth settlers use covenant language to create local self-government.", 2, "The Compact belongs on the master timeline because it became a lasting symbol of consent-based government in English America.", ["Political"]),
            overall_event("chapter2-great-migration", 1630, "Great Puritan Migration", "Puritan family migration creates a distinctive New England society.", 2, "This event matters because it explains one of the sharpest regional contrasts in colonial America.", ["Migration"]),
            overall_event("chapter2-roger-williams-rhode-island", 1636, "Rhode Island Founded", "Roger Williams establishes a colony associated with wider liberty of conscience.", 2, "This belongs on the master timeline because it marks an early, influential experiment in religious toleration.", ["Political"]),
        ],
        "vocabulary": [
            vocab("joint-stock company", "A business organization in which investors pooled capital and shared risk, often used to finance colonization.", "The Virginia Company used the joint-stock model to fund Jamestown.", "It appears in APUSH questions about how English colonization differed from direct crown conquest."),
            vocab("charter", "A formal grant from the crown authorizing a colony or company and defining its powers.", "Massachusetts Bay and Virginia both relied on royal charters to justify settlement.", "Charters often appear in questions about colonial governance and imperial authority."),
            vocab("Virginia Company", "The English joint-stock company that founded Jamestown.", "Its failure led Virginia to become a royal colony in 1624.", "It is useful for explaining the commercial origins of English America."),
            vocab("Jamestown", "The first permanent English settlement in North America, founded in 1607 in Virginia.", "Jamestown survived long enough to anchor the Chesapeake colonies.", "It is a foundational Period 2 reference point."),
            vocab("Powhatan Confederacy", "A Native political alliance in the Chesapeake that confronted and negotiated with the English settlers of Virginia.", "Powhatan power shaped whether Jamestown survived its earliest years.", "The exam uses it to emphasize Native agency in English colonization."),
            vocab("tobacco", "The cash crop that made Virginia and Maryland profitable and drove Chesapeake expansion.", "Tobacco required large amounts of land and labor, intensifying inequality and conflict.", "It is central to causation questions about the Chesapeake."),
            vocab("headright system", "A system that granted land to colonists or sponsors for paying for passage to the colonies.", "The headright system encouraged migration and helped create a land-hungry planter class in Virginia.", "It often appears in questions about class development and labor."),
            vocab("indentured servant", "A migrant who agreed to labor for a set number of years in exchange for passage to America.", "Indentured servants formed a major part of the early Chesapeake labor force.", "The AP exam often uses indentured servitude to explain labor before slavery fully hardened."),
            vocab("House of Burgesses", "The elected assembly established in Virginia in 1619.", "It gave local elites a role in making colonial law.", "It is a major APUSH example of early representative self-government."),
            vocab("Mayflower Compact", "An agreement signed by Plymouth settlers in 1620 to create government by consent.", "The Compact reflected covenant ideas and practical self-rule.", "It appears frequently in questions about colonial political culture."),
            vocab("Puritan", "An English Protestant who wanted to further reform the Church of England.", "Puritans founded Massachusetts Bay and shaped New England's religious and political culture.", "The term is central to questions about migration, society, and religion."),
            vocab("Great Migration", "The large migration of Puritans to New England in the 1630s.", "Family migration gave New England greater stability than the Chesapeake.", "It is key comparison evidence for regional colonial development."),
            vocab("covenant theology", "The Puritan belief that communities were bound to God by mutual obligations.", "This belief shaped both church life and political expectations in New England.", "Useful for explaining why religion and government overlapped in Massachusetts."),
            vocab("city upon a hill", "John Winthrop's phrase describing the exemplary role Puritans hoped New England would play.", "The phrase captured both Puritan confidence and the moral pressure they felt.", "It is a common AP reference in essays about American identity."),
            vocab("Roger Williams", "Puritan dissenter who founded Rhode Island and argued for liberty of conscience and church-state separation.", "Williams believed civil government should not enforce religion.", "He appears directly in APUSH questions about religious freedom."),
            vocab("Anne Hutchinson", "Puritan dissenter banished from Massachusetts after challenging ministers and magistrates.", "Her trial showed how gender and dissent threatened Puritan order.", "She is often used in questions about the limits of colonial liberty."),
            vocab("Pequot War", "A 1637 war between New England colonists and the Pequots that ended in catastrophic violence against the Pequot people.", "The war exposed the military and expansionist side of Puritan settlement.", "It is important evidence for Native-colonial conflict."),
            vocab("proprietary colony", "A colony granted by the crown to an individual or family with governing authority.", "Maryland was a proprietary colony under the Calverts.", "The term appears in questions comparing colonial governance structures."),
            vocab("Maryland Toleration Act", "A 1649 law protecting Trinitarian Christians from persecution in Maryland.", "It offered limited religious toleration in a religiously divided colony.", "Useful for distinguishing toleration from full equality."),
            vocab("royal colony", "A colony directly controlled by the crown rather than by a company or proprietor.", "Virginia became a royal colony in 1624.", "It matters in APUSH questions about imperial supervision and colonial autonomy."),
        ],
        "essayPractice": {
            "saq": [
                {
                    "id": "saq-001",
                    "prompt": "Answer a, b, and c. a) Briefly explain one major difference between the development of the Chesapeake colonies and the development of New England before 1660. b) Briefly explain one factor that caused that difference. c) Briefly explain one effect that the difference had on colonial society.",
                    "partA": "Briefly explain one major difference between the development of the Chesapeake colonies and the development of New England before 1660.",
                    "partB": "Briefly explain one factor that caused that difference.",
                    "partC": "Briefly explain one effect that the difference had on colonial society.",
                    "scoringGuidance": {
                        "partA": "A full-credit answer must identify a clear difference such as labor systems, town structure, migration pattern, or religion.",
                        "partB": "A full-credit answer must explain a real cause such as tobacco profitability, Puritan migration, climate, mortality, or family settlement.",
                        "partC": "A full-credit answer must explain an effect such as stronger local institutions in New England or greater inequality and labor coercion in the Chesapeake."
                    },
                    "sampleAnswers": {
                        "partA": "One major difference was that the Chesapeake developed around dispersed tobacco plantations, while New England developed around compact towns and family farming.",
                        "partB": "That difference was caused in part by the profitability of tobacco in the Chesapeake, which rewarded scattered riverfront plantations and created a heavy demand for labor.",
                        "partC": "One effect was that New England built stronger town governments and schools, while the Chesapeake developed greater social inequality and dependence on bound labor."
                    }
                },
                {
                    "id": "saq-002",
                    "prompt": "Answer a, b, and c. a) Briefly explain one reason Puritan leaders valued religious conformity in Massachusetts. b) Briefly explain one way dissenters challenged Puritan authority. c) Briefly explain one broader significance of those disputes for later American history.",
                    "partA": "Briefly explain one reason Puritan leaders valued religious conformity in Massachusetts.",
                    "partB": "Briefly explain one way dissenters challenged Puritan authority.",
                    "partC": "Briefly explain one broader significance of those disputes for later American history.",
                    "scoringGuidance": {
                        "partA": "A full-credit answer must explain why leaders believed communal religious unity was essential to the colony's mission and order.",
                        "partB": "A full-credit answer must identify a concrete example such as Roger Williams's church-state separation or Anne Hutchinson's criticism of ministers.",
                        "partC": "A full-credit answer must connect the disputes to later traditions of religious toleration, individual conscience, or church-state separation."
                    },
                    "sampleAnswers": {
                        "partA": "Puritan leaders valued religious conformity because they believed Massachusetts had a covenant with God and that religious disorder would threaten the whole community.",
                        "partB": "Roger Williams challenged Puritan authority by arguing that government had no right to enforce religion and that Native land had to be fairly purchased.",
                        "partC": "These disputes mattered because they helped lay the groundwork for later American arguments in favor of liberty of conscience and separation of church and state."
                    }
                },
            ],
            "leq": [
                {
                    "id": "leq-001",
                    "prompt": "Evaluate the extent to which economic motives shaped the development of the English colonies in North America from 1607 to 1660.",
                    "recommendedArgument": "Causation",
                    "thesisExamples": [
                        "Economic motives shaped the development of English colonies to a great extent because profit from tobacco, access to land, and labor demand determined the growth of the Chesapeake; however, religion and political conflict mattered more in New England, where migrants sought to build a godly society rather than simply extract wealth.",
                        "Although religion and imperial rivalry also influenced colonization, economic motives were the most powerful force in early English America because they determined settlement patterns, labor systems, and conflict over land, especially in the Chesapeake."
                    ],
                    "outlineScaffold": {
                        "contextualization": "Set up English rivalry with Spain, joint-stock colonization, and the failures of earlier English settlement attempts.",
                        "bodyParagraph1": {"claim": "Profit motives dominated the Chesapeake.", "evidence": ["Jamestown", "tobacco", "headright system"], "analysis": "Explain how the search for export wealth structured settlement and labor."},
                        "bodyParagraph2": {"claim": "Religion mattered more in New England, though economics still mattered.", "evidence": ["Great Migration", "John Winthrop", "town settlement"], "analysis": "Show the limits of a profit-only explanation."},
                        "bodyParagraph3": {"claim": "Both regions used land and labor coercively.", "evidence": ["Powhatan conflict", "Pequot War", "indentured servitude"], "analysis": "Connect economic expansion to Native dispossession and bound labor."},
                        "complexity": "Earn complexity by weighing regional differences rather than treating all English colonies as driven by one motive alone."
                    },
                    "scoringRubric": {
                        "thesis": "1 point - make a defensible claim about the relative importance of economic motives.",
                        "contextualization": "1 point - situate the prompt in the rise of English Atlantic expansion.",
                        "evidence": "2 points - use specific evidence such as tobacco, Puritan migration, or labor systems.",
                        "analysis": "2 points - explain causation and relative significance across regions.",
                        "complexity": "1 point - show that different colonies developed for different combinations of reasons."
                    }
                },
                {
                    "id": "leq-002",
                    "prompt": "Evaluate the extent to which the English colonies in the Chesapeake and New England developed differently in the period from 1607 to 1660.",
                    "recommendedArgument": "Comparison",
                    "thesisExamples": [
                        "The Chesapeake and New England developed very differently from 1607 to 1660 because geography, migration patterns, and founding motives produced distinct labor systems, social structures, and political cultures; however, both regions still depended on Native dispossession and claimed the rights of English subjects.",
                        "Although both colonial regions remained part of the English empire, they diverged sharply in economy and society: the Chesapeake became a plantation zone built on tobacco and bound labor, while New England became a family-centered, town-based religious commonwealth."
                    ],
                    "outlineScaffold": {
                        "contextualization": "Begin with England's broader Atlantic ambitions and the early failure of rapid-profit colonization.",
                        "bodyParagraph1": {"claim": "The Chesapeake developed around export agriculture and labor scarcity.", "evidence": ["tobacco", "indentured servitude", "House of Burgesses"], "analysis": "Explain how profit and mortality shaped the region."},
                        "bodyParagraph2": {"claim": "New England developed around communal religion and family settlement.", "evidence": ["Great Migration", "city upon a hill", "towns"], "analysis": "Explain how Puritan ideals structured society and politics."},
                        "bodyParagraph3": {"claim": "The colonies still shared major continuities.", "evidence": ["Pequot War", "Native land seizure", "English rights"], "analysis": "Show both difference and similarity for sophistication."},
                        "complexity": "Earn the sophistication point by arguing that the regions differed deeply while still sharing imperial and settler-colonial foundations."
                    },
                    "scoringRubric": {
                        "thesis": "1 point - clearly compare the two regions.",
                        "contextualization": "1 point - place both regions in the context of English colonization.",
                        "evidence": "2 points - provide specific regional evidence.",
                        "analysis": "2 points - use comparison reasoning consistently.",
                        "complexity": "1 point - explain both divergence and shared patterns."
                    }
                },
            ],
            "dbq": [
                {
                    "id": "dbq-001",
                    "prompt": "Evaluate the extent to which the English colonies in North America developed ideas of liberty in the period from 1607 to 1660.",
                    "documents": [
                        {"docNumber": 1, "title": "Promoter of colonization appeals for settlement", "source": "English colonization advocate, early seventeenth century", "excerpt": "Our plantations abroad shall enlarge the dominions of the crown, provide a market for our wares, and employ those who now burden the realm at home. In this enterprise, England gains both wealth and strength.", "happ": {"historicalSituation": "English promoters justified colonization during rivalry with Spain and domestic social strain.", "audience": "The intended audience included investors and crown officials.", "purpose": "The author wanted support and funding for colonization.", "pointOfView": "As a promoter, the writer stressed opportunity and omitted the costs to Native peoples and laborers."}},
                        {"docNumber": 2, "title": "Mayflower Compact", "source": "Plymouth colonists, 1620", "excerpt": "We covenant and combine ourselves together into a civil body politic, for our better ordering and preservation, and by virtue hereof enact such just and equal laws as shall be thought most meet and convenient for the general good.", "happ": {"historicalSituation": "The Pilgrims landed outside their original patent and needed a basis for self-rule.", "audience": "The document was written for the signers within the colony.", "purpose": "It created political legitimacy and social order.", "pointOfView": "The signers linked government to consent, but only among a limited group of male settlers."}},
                        {"docNumber": 3, "title": "John Winthrop on liberty", "source": "John Winthrop, speech on liberty, 1645", "excerpt": "There is a liberty of corrupt nature, which is inconsistent with authority, and there is a civil or federal liberty, which is maintained in a way of subjection to authority. This liberty is the proper end of authority.", "happ": {"historicalSituation": "Puritan leaders defended disciplined communal order against dissent and disorder.", "audience": "Winthrop addressed fellow colonists in Massachusetts.", "purpose": "He wanted to define liberty in a way that preserved elite and religious control.", "pointOfView": "As a Puritan governor, Winthrop favored ordered liberty rather than individual autonomy."}},
                        {"docNumber": 4, "title": "Roger Williams on conscience", "source": "Roger Williams, 1644", "excerpt": "An enforced uniformity of religion throughout a nation or civil state confounds the civil and religious and denies that liberty of conscience which ought to belong to every soul.", "happ": {"historicalSituation": "Williams wrote after banishment from Massachusetts and the founding of Rhode Island.", "audience": "He addressed English readers and colonial observers debating religion and government.", "purpose": "He aimed to defend toleration and the separation of civil power from church power.", "pointOfView": "As a dissenter, Williams saw persecution where Massachusetts leaders saw order."}},
                        {"docNumber": 5, "title": "Virginia law and colonial labor", "source": "Virginia records on servitude and labor, seventeenth century", "excerpt": "The planter's estate is maintained by servants whose labor in the fields yields the crop upon which the colony's welfare depends. The increase of laborers is therefore the increase of the country's wealth.", "happ": {"historicalSituation": "Chesapeake prosperity depended on labor-intensive tobacco agriculture.", "audience": "The implied audience included colonial officials and planters.", "purpose": "The record justified labor control as necessary for the colony's economy.", "pointOfView": "The document reflects elite priorities and treats laborers as economic instruments rather than equal members of the polity."}}
                    ],
                    "thesisExample": "From 1607 to 1660, the English colonies developed important ideas of liberty through assemblies, covenants, and arguments for conscience, but those ideas were highly limited because colonial freedom generally served property-holding settlers while laborers, dissenters, and Native peoples faced coercion and exclusion.",
                    "outlineScaffold": {
                        "contextualization": "Explain the rise of English colonization, rivalry with Spain, and the founding of Jamestown and Plymouth.",
                        "bodyParagraph1": {"claim": "Some colonists developed traditions of self-government and consent.", "documentsUsed": [2, 3], "outsideEvidence": "House of Burgesses", "happ": "Use the purpose of the Compact and Winthrop's point of view to show different meanings of liberty."},
                        "bodyParagraph2": {"claim": "Dissenters pushed for a broader idea of liberty of conscience.", "documentsUsed": [4], "outsideEvidence": "Rhode Island", "happ": "Use Williams's historical situation to show how repression created arguments for toleration."},
                        "bodyParagraph3": {"claim": "Colonial liberty existed alongside coercion and inequality.", "documentsUsed": [1, 5], "outsideEvidence": "indentured servitude or Pequot War", "happ": "Use promoter rhetoric and labor records to expose who benefited from colonial freedom."},
                        "complexity": "Earn complexity by comparing ordered Puritan liberty, planter self-government, and radical liberty of conscience instead of using one definition of freedom."
                    }
                }
            ],
        },
        "mcqFacts": [
            fact("Jamestown", "The colony survived because tobacco and Native interaction mattered more than dreams of quick gold.", THEME["wxt"], "Jamestown's importance lies in how an unstable outpost became a permanent colony through export agriculture and coercive expansion."),
            fact("the Virginia Company", "English colonization in North America began as a commercial and imperial venture backed by chartered investment.", THEME["wor"], "Private capital and state ambition worked together in early English colonization."),
            fact("the tobacco boom", "Tobacco created a land-hungry, labor-intensive plantation economy in the Chesapeake.", THEME["wxt"], "This explains why the Chesapeake developed so differently from New England."),
            fact("1619 in Virginia", "Representative government and African labor both took root in Virginia in the same foundational year.", THEME["pol"], "The year 1619 shows the coexistence of self-government and unfreedom."),
            fact("indentured servitude", "Early Chesapeake labor depended heavily on bound European migrants before slavery hardened fully in law.", THEME["wxt"], "Indentured labor helps explain class tension and the transition toward racial slavery."),
            fact("the House of Burgesses", "Colonial elites expected a voice in local lawmaking while remaining loyal to the crown.", THEME["pol"], "The Burgesses are an early example of English rights transplanted overseas."),
            fact("the Mayflower Compact", "Government by consent in New England was tied to covenant and communal order, not universal democracy.", THEME["pol"], "The Compact matters because it shows a limited but influential form of self-rule."),
            fact("Puritan migration", "Family migration and religious purpose gave New England a more stable social structure than the Chesapeake.", THEME["mig"], "Regional comparison is one of the core AP skills for this chapter."),
            fact("John Winthrop", "Puritan leaders defined liberty as moral discipline within a covenanted community.", THEME["cul"], "Winthrop helps students understand that liberty had different meanings in colonial America."),
            fact("Roger Williams", "Arguments for liberty of conscience emerged partly because colonies punished dissent.", THEME["cul"], "Williams is significant because toleration often grew from conflict, not consensus."),
            fact("Anne Hutchinson", "Puritan authorities saw dissenting women and direct spiritual claims as threats to social order.", THEME["cul"], "Hutchinson shows how gender and theology shaped the limits of speech."),
            fact("the Pequot War", "New England settlement expanded through organized violence against Native peoples as well as through piety and town building.", THEME["wor"], "The war complicates any idealized picture of Puritan liberty."),
            fact("Maryland", "English colonies could share plantation economics while differing sharply in religion and governance.", THEME["pol"], "Maryland is useful because it combines proprietary rule, tobacco, and religious conflict."),
            fact("the Maryland Toleration Act", "Colonial toleration often protected only limited groups and was rooted in political necessity.", THEME["cul"], "The act is important because toleration did not mean full equality."),
            fact("English Civil War", "Colonial ideas about rights and sovereignty were shaped by upheaval in England itself.", THEME["pol"], "The colonies were part of an Atlantic political world, not isolated settlements."),
            fact("the Great Migration", "New England grew through family settlement and town life rather than through a single export staple.", THEME["mig"], "This is the clearest explanation for why New England looked different socially and politically."),
            fact("Powhatan diplomacy", "Native peoples remained powerful actors who could sustain, negotiate with, or attack English settlements.", THEME["wor"], "Students should avoid treating colonization as a one-sided English process."),
            fact("royal colonies", "Imperial oversight could increase without eliminating colonial assemblies.", THEME["pol"], "The English empire often mixed local autonomy with metropolitan control."),
            fact("headright system", "Land policy encouraged migration while strengthening elite control over territory and labor.", THEME["mig"], "The headright system links land expansion to social inequality."),
            fact("ordered liberty", "Many colonists believed freedom meant living under godly or lawful authority rather than escaping authority altogether.", THEME["nat"], "This helps explain why colonial liberty could coexist with coercion."),
        ],
        "textStimuli": [
            {"text": "We shall be as a city upon a hill. The eyes of all people are upon us.", "caption": "John Winthrop on Puritan mission"},
            {"text": "We covenant and combine ourselves together into a civil body politic.", "caption": "Mayflower Compact"},
            {"text": "An enforced uniformity of religion throughout a nation or civil state denies liberty of conscience.", "caption": "Roger Williams on toleration"},
            {"text": "There is a liberty of corrupt nature, and there is a civil liberty, maintained in subjection to authority.", "caption": "Winthrop's ordered liberty"},
        ],
        "conceptCards": [
            {"type": "Comparison", "front": "Chesapeake vs. New England", "back": "The Chesapeake developed around tobacco, bound labor, and dispersed plantations, while New England developed around family migration, towns, and Puritan religious institutions. APUSH loves this comparison because it explains regional diversity inside one empire.", "hint": "Profit versus covenant, plantations versus towns.", "difficulty": "Hard"},
            {"type": "Concept", "front": "Why is 1619 so important?", "back": "In Virginia, 1619 marks both the House of Burgesses and the arrival of the first recorded Africans. It captures the long-running contradiction between self-government and unfreedom.", "hint": "Liberty and coercion start together.", "difficulty": "Medium"},
            {"type": "Document", "front": "Ordered liberty", "back": "Puritan leaders like John Winthrop argued that true liberty meant freedom within moral and lawful authority. That definition helps explain why New England valued discipline and punished dissent.", "hint": "Liberty did not always mean autonomy.", "difficulty": "Medium"},
            {"type": "Cause-Effect", "front": "What made Jamestown survive?", "back": "Jamestown survived because colonists adapted to local conditions, relied on Native exchange and discipline in the short term, and then found a profitable staple crop in tobacco. The crop then drove labor demand and expansion.", "hint": "Survival first, tobacco second.", "difficulty": "Medium"},
        ],
    }
)


chapter_specs.append(
    {
        "chapterId": "chapter3",
        "chapterNum": 3,
        "chapterOrder": 3,
        "periodId": "p2",
        "periodNumber": 2,
        "chapterMeta": {
            "period": "Period 2",
            "periodId": "p2",
            "dateRange": "1607-1754",
            "apExamWeight": "6-8%",
            "chapterTitle": "Creating Anglo-America, 1660-1750",
            "chapterSubtitle": "Empire, inequality, racial slavery, and the remaking of English America",
            "bigPictureThemes": [THEME["pol"], THEME["wxt"], THEME["cul"], THEME["wor"]],
            "oneLineSummary": "After 1660, English America became more populous, commercially integrated, and politically complex, but that growth rested increasingly on racial slavery, imperial regulation, and violent struggles over land and authority.",
            "periodContext": "By 1660 the English had permanent colonies, but they had not yet created a coherent Anglo-American world. Chapter 3 tracks how restoration politics, economic growth, migration, Native wars, and the hardening of slavery transformed scattered settlements into a larger colonial system that still remained unstable and contested.",
            "examTips": [
                "AP questions often treat Bacon's Rebellion and King Philip's War as evidence of instability in colonial society, not as isolated frontier episodes.",
                "Be precise about the rise of slavery: the exam rewards answers that explain how law, labor demand, and elite fear pushed colonies from servitude toward hereditary racial slavery.",
                "The Glorious Revolution matters in APUSH because it linked colonial resistance to later arguments about English rights and arbitrary power.",
            ],
        },
        "images": [
            image(3, "ch03co01", "jpg", "A growing Atlantic world connected English colonies more tightly to migration, commerce, and imperial rivalry after 1660.", "This chapter opener matters because it captures the sense that colonial America was no longer marginal. It had become part of a larger Anglo-Atlantic system of trade, labor, and state power.", [THEME["wor"], THEME["wxt"]], category="Painting"),
            image(3, "ch03map01", "png", "The map of colonial expansion shows how English settlements spread and diversified after the Restoration.", "This map is important because population growth and new colonies changed the political balance of English America.", [THEME["mig"], THEME["geo"]], category="Map"),
            image(3, "ch03map02", "png", "Atlantic trade routes linked New England, the Chesapeake, the Caribbean, Europe, and Africa into one imperial economy.", "The map is AP-important because it makes mercantilism, the slave trade, and regional specialization visible in one frame.", [THEME["wor"], THEME["wxt"]], category="Map"),
            image(3, "ch03ph03", "jpg", "Colonial port towns and markets reflected widening commercial growth and social differentiation.", "This image matters because it shows that colonial prosperity did not produce equality. Commerce deepened class divisions as well as opportunity.", [THEME["wxt"], THEME["cul"]], category="Painting"),
            image(3, "ch03ph08", "jpg", "Plantation labor in the late seventeenth century increasingly depended on enslaved Africans rather than temporary servants.", "The image is significant because it visualizes the transition toward hereditary racial slavery in English America.", [THEME["wxt"], THEME["nat"]], category="Engraving"),
            image(3, "ch03ph09", "jpg", "Conflict on the colonial frontier revealed the instability of English expansion into Native lands.", "This visual is useful because both Native resistance and settler unrest became central to seventeenth-century crisis.", [THEME["wor"], THEME["pol"]], category="Illustration"),
            image(3, "ch03ph10", "jpg", "William Penn and the Quaker experiment represented a more pluralistic colonial model than Puritan New England or the Chesapeake.", "The image matters because Pennsylvania shows that English America could grow through toleration, immigration, and commercial planning as well as through plantation agriculture.", [THEME["cul"], THEME["mig"]], category="Portrait"),
            image(3, "ch03ph11", "png", "The Salem witchcraft image captures the fear, disorder, and social stress of the late seventeenth century.", "It is a strong AP visual because Salem is best understood as part of broader instability, not as a bizarre isolated incident.", [THEME["cul"], THEME["pol"]], category="Illustration"),
            image(3, "ch03ph12", "png", "Colonial protests against imperial overreach drew on the language of English rights after 1688.", "This image matters because it previews a political tradition that later fed the American Revolution.", [THEME["pol"], THEME["nat"]], category="Political Cartoon"),
        ],
        "notes": {
            "historicalContext": {
                "overview": "The Restoration of Charles II in 1660 marked the start of a more systematic English empire. Colonies that had begun as fragile experiments now became sites of rapid migration, expanding trade, and state-building. At the same time, Native wars, class conflict, and the transition to racial slavery revealed how unstable colonial growth could be. By 1750, English America looked larger and wealthier, but it also rested on sharper hierarchies of race, class, and imperial power.",
                "precedingCauses": [
                    "Earlier settlement in Virginia and New England had already established durable English footholds.",
                    "Civil war and Restoration politics in England pushed leaders toward stronger commercial regulation of empire.",
                    "Tobacco and Atlantic trade created incentives for migration, new colonies, and more labor.",
                    "Native communities continued to resist colonial expansion across New England, the backcountry, and the borderlands.",
                    "Early African labor in colonies such as Virginia created a foundation for later legal codification of slavery.",
                ],
                "geographicContext": "Growth after 1660 depended on geography: river valleys favored export crops, harbors fueled commerce, and frontier zones became flashpoints for violence. The Atlantic seaboard tied the mainland to Caribbean plantation wealth, while interior lands drew settlers into repeated conflict with Native peoples.",
                "contextImage": {"imageId": "ch03map01", "displayCaption": "After 1660, English America expanded in territory, population, and diversity, but that growth created new strains."},
            },
            "sections": [
                note_section(
                    "Restoration Growth and the Expansion of English America",
                    [THEME["mig"], THEME["wxt"], THEME["pol"]],
                    "After 1660, English America grew quickly in both people and territory. New proprietary colonies such as Carolina and Pennsylvania joined older settlements, while migration from England, Scotland, Ireland, Germany, and Africa made the colonial population more diverse. Port towns became more important as commerce expanded and as regional specialization deepened. New England supplied ships, fish, and small manufactures; the Chesapeake exported tobacco; the lower South built plantation agriculture; and the middle colonies combined grain farming with commercial growth. This expanding colonial world looked increasingly prosperous, but prosperity was unevenly distributed. Growth therefore created Anglo-America, yet it also intensified hierarchy and competition.",
                    ["Restoration policy encouraged colonization", "Atlantic markets rewarded colonial specialization", "Migration to North America increased"],
                    ["Population surged", "New colonies diversified English America", "Class and regional differences sharpened"],
                    "This section matters because APUSH often asks students to explain how a scattered set of colonies became a more integrated British Atlantic system.",
                    ["Connects to Chapter 2 by showing how early settlements matured into a larger imperial network.", "Foreshadows Chapter 4 because growth made slavery and imperial rivalry even more central."],
                    key_figures=[
                        figure("Charles II", "Restoration monarch", "Charles II restored the monarchy in 1660 and oversaw the granting of new colonies and stronger imperial regulation. His reign marked the transition from improvised colonization to a more coherent empire.", "He matters because APUSH uses the Restoration as a turning point in colonial administration.", "He represented restored monarchical power and imperial expansion."),
                        figure("William Penn", "Founder of Pennsylvania", "Penn founded Pennsylvania as a Quaker colony that welcomed immigrants and promoted relative religious pluralism. His colony became one of the fastest-growing and most commercially important in English America.", "He matters because Pennsylvania shows a different colonial path from Puritan Massachusetts or plantation Virginia.", "He represented Quaker toleration, proprietary rule, and planned colonization.", "ch03ph10"),
                    ],
                    primary_sources=["Colonial charters", "Immigration and shipping records", "Promotional literature for Carolina and Pennsylvania"],
                    section_images=[
                        {"imageId": "ch03map01", "displayCaption": "English America after 1660 was larger, denser, and more regionally specialized than the first-generation colonies."},
                        {"imageId": "ch03ph10", "placement": "after-key-figures", "displayCaption": "Pennsylvania symbolized a more pluralistic and commercially ambitious phase of colonial growth."},
                    ],
                ),
                note_section(
                    "Social Classes, Consumer Growth, and Colonial Inequality",
                    [THEME["wxt"], THEME["cul"], THEME["nat"]],
                    "Colonial population growth did not erase hierarchy; it made hierarchy more visible. Wealthy merchants and planters accumulated land, credit, and political power, while small farmers, artisans, servants, and the poor lived with greater insecurity. Consumer goods from Britain became more available, which made the colonies look more prosperous but also encouraged debt and dependence on imperial trade. Family structures, gender expectations, and labor roles still varied by region, yet social class mattered everywhere. Colonial elites often described their success as evidence of liberty and improvement, but many ordinary colonists experienced limited opportunity. APUSH rewards students who explain that colonial prosperity and colonial inequality expanded together.",
                    ["Commercial expansion increased wealth", "Atlantic imports widened consumer access", "Land ownership and credit remained unequal"],
                    ["Elites consolidated power", "Debt and dependence grew", "Class tensions sharpened inside colonial society"],
                    "This section matters because the exam often treats colonial society as dynamic but unequal rather than uniformly prosperous or democratic.",
                    ["Connects to Bacon's Rebellion because inequality could become politically explosive.", "Foreshadows eighteenth-century consumer politics and critiques of corruption."],
                    key_figures=[
                        figure("Colonial merchants", "Urban commercial elite", "Merchants in port cities connected the colonies to Atlantic markets and credit networks. They benefited greatly from trade growth but also tied colonial prosperity to British commerce.", "They matter because they show how colonial wealth depended on empire rather than existing outside it.", "They represented urban commercial power in the Atlantic world."),
                    ],
                    primary_sources=["Probate inventories", "Advertisements for imported goods", "Tax and debt records"],
                    section_images=[{"imageId": "ch03ph03", "displayCaption": "Commercial growth made colonial society wealthier overall, but it also deepened visible class divisions."}],
                ),
                note_section(
                    "From Servitude to Racial Slavery",
                    [THEME["wxt"], THEME["nat"], THEME["wor"]],
                    "The most important structural change of the late seventeenth century was the hardening of racial slavery. Chesapeake planters had long used indentured servants, but high mortality declined, servants lived long enough to compete for land, and elite planters feared unrest from a growing class of poor free men. At the same time, the Atlantic slave trade made African labor more available. Legislatures increasingly defined Black status as inheritable and permanent, especially through laws such as partus sequitur ventrem and later slave codes. Slavery thus became not just a labor system but a racial order built into law. This is a core APUSH theme because later American freedom developed atop this foundation of legally enforced unfreedom.",
                    ["Planters needed stable labor supplies", "Declining mortality made indentured servants more costly to control long term", "Atlantic slave trade expanded access to enslaved laborers"],
                    ["Hereditary racial slavery deepened", "Blackness became legally tied to bondage", "Colonial elites built a more stable but more brutal labor order"],
                    "This section matters because APUSH frequently asks students to explain why racial slavery intensified in the late seventeenth century rather than assuming it existed fully formed from the start.",
                    ["Builds directly on Chapter 2's discussion of 1619 and early labor fluidity.", "Prepares Chapter 4's discussion of mature plantation slavery and Atlantic empire."],
                    key_figures=[
                        figure("Virginia lawmakers", "Colonial legislators", "Virginia's assembly helped convert slavery from practice into law by defining status through race, inheritance, and permanence. Legal change was central to the creation of slavery as a system.", "They matter because the rise of slavery was not only economic; it was political and legal.", "They represented planter power and the legal construction of racial hierarchy."),
                    ],
                    primary_sources=["Virginia law codes", "Runaway ads", "Slave-sale records"],
                    section_images=[{"imageId": "ch03ph08", "displayCaption": "By the late seventeenth century, plantation labor was increasingly organized around hereditary racial slavery."}],
                ),
                note_section(
                    "Native Wars, Bacon's Rebellion, and Colonial Crisis",
                    [THEME["wor"], THEME["pol"], THEME["mig"]],
                    "Growth brought crisis as colonists pushed into Native lands and as poor settlers challenged elites. King Philip's War devastated New England and demonstrated how powerful Native resistance could be when colonists pressed too far into Indigenous territory. Bacon's Rebellion in Virginia, though different in cause, also exposed instability by showing that landless or frustrated colonists could turn against their own governors. In both cases, authorities faced the consequences of expansion. Colonial elites learned that frontier violence, land scarcity, and labor tensions threatened social order. APUSH often pairs these events because together they show that English America was far from stable in the late seventeenth century.",
                    ["Expansion onto Native land", "Class resentment and land hunger in frontier regions", "Weak or contested colonial authority"],
                    ["Native populations suffered severe losses", "Elite fear of disorder increased", "Planters turned more decisively toward racial slavery"],
                    "This section matters because the exam often treats war with Native peoples and rebellion by colonists as linked signs of instability in the growing colonies.",
                    ["Connects to Chapter 2's Pequot War and Chesapeake inequality.", "Foreshadows later frontier conflict and elite efforts to manage poor whites through race."],
                    key_figures=[
                        figure("Metacom", "Wampanoag leader also called King Philip", "Metacom led a broad Native resistance to New England expansion in the 1670s. The war bearing his English name became one of the bloodiest conflicts per capita in colonial American history.", "He matters because Native resistance remained central to colonial development long after first contact.", "He represented Indigenous defense of land and autonomy."),
                        figure("Nathaniel Bacon", "Virginia rebel leader", "Bacon led frontier settlers against Governor William Berkeley in 1676, attacking both Native peoples and the colonial elite. The rebellion showed how volatile Chesapeake society had become.", "He matters because APUSH uses his rebellion to explain class tension and the shift toward slavery.", "He represented angry frontier settlers and anti-elite unrest."),
                    ],
                    primary_sources=["Declarations from Bacon's Rebellion", "Accounts of King Philip's War"],
                    section_images=[{"imageId": "ch03ph09", "displayCaption": "Violence on the frontier exposed how expansion could destabilize both Native communities and English colonial governments."}],
                ),
                note_section(
                    "Mercantilism, Empire, and the Navigation System",
                    [THEME["wxt"], THEME["pol"], THEME["wor"]],
                    "English leaders did not want a loose collection of colonies; they wanted a profitable empire. Mercantilist thinking held that trade should enrich the mother country and strengthen national power, so Parliament passed Navigation Acts to channel colonial commerce through English ships and ports. In practice, enforcement was uneven, but the principle mattered: the colonies were expected to serve imperial needs. The seizure of New Netherland and the creation of additional colonies reflected the same logic of strategic and commercial expansion. Colonists often accepted imperial trade rules when enforcement was light, yet they still expected room for local autonomy. This tension between empire and self-rule would become a major APUSH pattern.",
                    ["Restoration governments sought stronger control of trade", "War and rivalry with Dutch and other empires", "Colonial commerce had become too valuable to ignore"],
                    ["Navigation system structured imperial commerce", "English control over Atlantic trade increased", "Future conflict over enforcement and rights became more likely"],
                    "This section matters because APUSH repeatedly returns to mercantilism as the background for later colonial resistance.",
                    ["Connects to Chapter 5 because imperial trade regulation after 1763 drew on older assumptions.", "Links to the Dutch and French competition introduced in Period 1."],
                    key_figures=[
                        figure("English mercantilists", "Imperial policymakers", "Mercantilists argued that colonial trade should enrich England and support national power. Their logic shaped the Navigation Acts and later imperial institutions.", "They matter because colonial economic life was always tied to state strategy, not just private exchange.", "They represented state-centered commercial empire."),
                    ],
                    primary_sources=["Navigation Acts", "Customs records", "Imperial correspondence on trade"],
                    section_images=[{"imageId": "ch03map02", "displayCaption": "Mercantilist empire linked the mainland colonies to the Caribbean, Africa, and Britain through tightly managed trade routes."}],
                ),
                note_section(
                    "The Glorious Revolution, Pluralism, and the Salem Moment",
                    [THEME["pol"], THEME["cul"], THEME["nat"]],
                    "The Glorious Revolution of 1688 echoed across the Atlantic and confirmed that English subjects could resist arbitrary rule. Colonists overthrew unpopular imperial officials, especially where the Dominion of New England had tried to centralize power. The resulting political culture mixed loyalty to England with a sharper sense of colonial rights. At the same time, the colonies became more religiously and ethnically diverse, especially in places like Pennsylvania and New York. Salem's witchcraft crisis in 1692 exposed how fear, war, gender tensions, and political uncertainty could still destabilize local communities. The late seventeenth century therefore ended with both greater pluralism and deep anxiety about social order.",
                    ["Imperial centralization under James II", "Religious and political conflict in England", "Demographic and cultural diversification in the colonies"],
                    ["Dominion of New England collapsed", "Colonial rights talk deepened", "Pluralism expanded while fear and disorder remained visible"],
                    "This section matters because the AP exam often uses the Glorious Revolution and Salem to show that colonial political culture was maturing but still unsettled.",
                    ["Directly foreshadows the revolutionary language of the eighteenth century.", "Connects to Chapter 4's growth of the public sphere and debates over liberty."],
                    key_figures=[
                        figure("Edmund Andros", "Governor of the Dominion of New England", "Andros became a symbol of imperial overreach because he tried to centralize authority and limit local self-government. Colonists overthrew him after the Glorious Revolution.", "He matters because students need a concrete example of arbitrary power before the 1760s.", "He represented centralized imperial authority."),
                    ],
                    primary_sources=["English Bill of Rights", "Colonial declarations against Andros", "Salem court records"],
                    section_images=[
                        {"imageId": "ch03ph12", "displayCaption": "After 1688, colonists increasingly described resistance to arbitrary authority in the language of English rights."},
                        {"imageId": "ch03ph11", "placement": "after-key-figures", "displayCaption": "Salem reflected fear and disorder in a colony already strained by war, politics, and social tension."},
                    ],
                ),
            ],
            "overarchingAnalysis": {
                "continuity": "Colonial growth continued to depend on Native dispossession, Atlantic trade, and unequal access to power. Even as colonies became more populous and politically experienced, freedom still remained highly restricted by race, status, gender, and empire.",
                "change": "Between 1660 and 1750, English America shifted from loosely connected settlements into a larger Anglo-American society tied together by commerce, law, migration, and imperial policy. The most fundamental change was the consolidation of racial slavery as a durable social and economic order.",
                "complexity": "A strong complexity point comes from arguing that greater colonial liberty for English settlers was built through tighter imperial integration and harsher racial hierarchy, not in opposition to them at first. Colonial rights and colonial unfreedom grew together.",
                "comparisonAngles": [
                    "Compare the labor transition in the Chesapeake to the more family-based and commercial development of New England and the middle colonies.",
                    "Compare the Glorious Revolution's impact in the colonies to later colonial resistance after 1763 in terms of rights language and imperial power.",
                ],
            },
        },
        "periodTimeline": [
            event("chapter3", "p2", "chapter3-navigation-act-1660", 1660, "Navigation Act of 1660", "Parliament passed a Navigation Act in 1660 to channel colonial trade through English ships and markets. The law marked the start of a more systematic mercantilist empire.", "The Navigation Act required that many goods move in English or colonial ships and that certain products flow through English channels. It reflected the mercantilist belief that colonies existed to strengthen the mother country's wealth and power. Enforcement remained inconsistent, but the act established an enduring imperial principle. Colonial merchants adapted to the system while also looking for ways around it. The law therefore structured commerce without fully eliminating local initiative. It became an important background for later disputes over trade and sovereignty.", ["Economic", "Political"], [THEME["wxt"], THEME["pol"]], ["Parliament"], ["Restoration imperial policy", "Mercantilist theory"], ["Imperial trade regulation intensified", "Colonial commerce tied more tightly to England"], ["chapter5-sugar-act"], "High", True, "Essential context for later imperial taxation and regulation.", "Navigation Acts were not always strictly enforced, but they still mattered politically and economically.", image_id="ch03map02"),
            event("chapter3", "p2", "chapter3-virginia-partus-law", 1662, "Virginia Adopts Partus Sequitur Ventrem", "Virginia law in 1662 declared that a child's status followed that of the mother. The statute helped make slavery hereditary and racial.", "The doctrine of partus sequitur ventrem broke from English common-law assumptions about inherited status. By tying the condition of children to enslaved mothers, lawmakers protected masters' property interests and expanded the future labor force. The law made race and reproduction central to the system of bondage. It illustrates how slavery hardened through deliberate legal decisions. APUSH often uses this statute to show that racial slavery was constructed in law rather than simply inherited from custom. It was a crucial step toward a permanent slave society.", ["Political", "Social"], [THEME["pol"], THEME["nat"]], ["Virginia assembly"], ["Elite demand for stable labor", "Growth of African bondage"], ["Slavery became more hereditary", "Racial hierarchy deepened"], ["chapter3-slave-code-1705"], "Medium", False, "Strong evidence for legal codification of slavery."),
            event("chapter3", "p2", "chapter3-carolina-charter", 1663, "Carolina Charter", "Charles II granted the Carolina colony in 1663 to a group of proprietors. Carolina extended plantation agriculture and hierarchical social ideas into the southern mainland.", "The Carolina charter created a vast proprietary colony in the South. Its founders envisioned a hierarchical society tied closely to Atlantic commerce and, increasingly, to slavery. Settlers and investors looked to Barbados as a model for plantation development. Over time, rice and indigo production made the region economically distinctive. The colony's creation also intensified Native displacement and imperial competition in the Southeast. Carolina became a bridge between mainland English America and the Caribbean slave system.", ["Political", "Economic"], [THEME["wxt"], THEME["wor"]], ["Charles II"], ["Restoration grants", "Demand for plantation expansion"], ["New southern colony established", "Slave-based plantation model spread"], [], "Medium", False, "Useful evidence for the spread of plantation slavery and empire."),
            event("chapter3", "p2", "chapter3-new-netherland-seized", 1664, "England Seizes New Netherland", "The English seized New Netherland from the Dutch in 1664 and renamed it New York. The conquest strengthened English control of the Atlantic coast.", "English forces took New Netherland with relatively little bloodshed in 1664. The capture gave England a strategic corridor between New England and the Chesapeake. It also added a commercially important and ethnically diverse colony to the empire. New York retained many Dutch influences even after English conquest, reminding students that Anglo-America was never culturally uniform. The seizure reflected intense imperial rivalry in the Atlantic. It also showed that empire could expand through diplomacy and force as well as settlement.", ["Diplomatic", "Political"], [THEME["wor"], THEME["pol"]], ["James, Duke of York"], ["Anglo-Dutch rivalry"], ["English coastal control expanded", "New York joined the empire"], [], "High", True, "Useful for showing how English America became territorially integrated.", image_id="ch03map01"),
            event("chapter3", "p2", "chapter3-king-philips-war", 1675, "King Philip's War", "King Philip's War erupted in New England in 1675 between Native peoples and English colonists. It became one of the bloodiest conflicts in early American history.", "Metacom, called King Philip by the English, led a broad Native resistance to colonial expansion in New England. The war devastated towns, killed large numbers of people on both sides, and shattered earlier patterns of limited coexistence. English victory came at enormous cost but left Native communities in southern New England badly weakened. Colonists interpreted the result as proof of their right to expand. The war deepened racial hostility and land hunger. APUSH uses it to show that Native resistance remained powerful and that settlement carried constant military consequences.", ["Military"], [THEME["wor"], THEME["mig"]], ["Metacom"], ["Colonial expansion", "Pressure on Native land and autonomy"], ["Native power in southern New England weakened", "English expansion accelerated"], [], "High", True, "A major APUSH event for Native resistance and colonial instability.", "The war was not a minor local skirmish; it transformed New England society.", image_id="ch03ph09"),
            event("chapter3", "p2", "chapter3-bacons-rebellion", 1676, "Bacon's Rebellion", "Nathaniel Bacon led armed Virginia settlers against Governor Berkeley in 1676. The rebellion exposed sharp class tensions in the Chesapeake.", "Frontier settlers wanted more aggressive war against Native peoples and resented Berkeley's policies and the power of the planter elite. Bacon gathered supporters, attacked Native communities, and eventually burned Jamestown. Although the rebellion collapsed after Bacon's death, it terrified Virginia's elite. Planters increasingly turned toward African slavery as a labor system they believed would be more controllable than large numbers of restless servants. The rebellion therefore mattered not only as a political crisis but as a turning point in labor history. APUSH frequently uses it to connect class tension to the rise of racial slavery.", ["Political", "Military"], [THEME["pol"], THEME["wxt"]], ["Nathaniel Bacon", "William Berkeley"], ["Frontier land conflict", "Class resentment against planter elite"], ["Elite fear increased", "Shift toward racial slavery accelerated"], ["chapter3-slave-code-1705"], "High", True, "Core evidence for causation essays on class conflict and slavery.", "The rebellion was not democratic in a modern egalitarian sense; it also targeted Native peoples.", image_id="ch03ph09"),
            event("chapter3", "p2", "chapter3-pueblo-revolt", 1680, "Pueblo Revolt", "Pueblo peoples revolted against Spanish rule in 1680 and temporarily drove the Spanish out of New Mexico. The revolt showed that Native resistance remained potent across North America, not just in English colonies.", "Led by Popé, Pueblo communities rose against Spanish missions, labor demands, and cultural repression. They killed priests and colonists and forced the Spanish to retreat for more than a decade. The revolt was one of the most successful Indigenous uprisings in North American colonial history. Although it took place in the Spanish borderlands, it matters in APUSH because it highlights the continent-wide struggle over Native autonomy. It also reminds students that English America developed alongside other empires and other Native wars. Native power remained a defining force across the continent.", ["Military"], [THEME["wor"], THEME["cul"]], ["Popé"], ["Spanish mission coercion", "Native defense of culture and autonomy"], ["Spanish control temporarily collapsed", "Native resistance gained historic significance"], [], "Medium", False, "Useful comparative evidence about Native resistance across empires."),
            event("chapter3", "p2", "chapter3-pennsylvania-charter", 1681, "Pennsylvania Chartered", "William Penn received Pennsylvania in 1681 and launched a fast-growing Quaker colony. Pennsylvania became a center of migration, commerce, and relative religious pluralism.", "Pennsylvania was founded partly to repay a debt owed to William Penn's father and partly to create a colony shaped by Quaker principles. Penn promoted fairer dealings with Native peoples than many other colonies, though conflict would still grow over time. The colony attracted immigrants from multiple regions of Europe and quickly developed a strong commercial economy. Its diversity set it apart from more homogeneous colonies such as early Massachusetts. Pennsylvania became a powerful example of how pluralism could coexist with prosperity. It broadened the meaning of what English America could look like.", ["Political", "Migration"], [THEME["mig"], THEME["cul"]], ["William Penn"], ["Proprietary grant", "Quaker vision and migration"], ["Religious diversity expanded", "Middle colony growth accelerated"], [], "High", True, "Important for essays comparing regional colonial societies.", image_id="ch03ph10"),
            event("chapter3", "p2", "chapter3-dominion-new-england", 1686, "Dominion of New England Created", "James II created the Dominion of New England in 1686 to centralize imperial administration. Colonists saw the Dominion as a threat to local self-government.", "The Dominion placed several northern colonies under one governor, Edmund Andros. Officials restricted town meetings, challenged land titles, and tightened imperial oversight. These moves alarmed colonists who believed they possessed customary rights as English subjects. The Dominion revealed that England could try to rule the colonies more directly than before. Its unpopularity made its later collapse politically significant. APUSH uses the Dominion as a seventeenth-century example of colonial resistance to arbitrary power.", ["Political"], [THEME["pol"]], ["Edmund Andros", "James II"], ["Imperial centralization"], ["Colonial resentment grew", "Dominion became a symbol of arbitrary power"], ["chapter3-glorious-revolution"], "Medium", False, "Useful lead-in to the Glorious Revolution."),
            event("chapter3", "p2", "chapter3-glorious-revolution", 1688, "Glorious Revolution", "The Glorious Revolution overthrew James II in 1688 and replaced him with William and Mary. The event reshaped colonial politics by affirming the rights of English subjects against arbitrary rule.", "Many English elites feared James II's Catholicism and centralizing policies, so they invited William of Orange to intervene. James fled, and Parliament established a new constitutional settlement. Colonists celebrated the revolution and used it to justify overthrowing imperial officials such as Andros. The event reinforced the idea that kings were not above law and that subjects possessed rights. In the colonial world, that belief would have a long afterlife. APUSH frequently treats 1688 as an important prehistory of American revolutionary thought.", ["Political"], [THEME["pol"], THEME["nat"]], ["William III", "Mary II"], ["Fear of Catholic absolutism", "Resistance to James II"], ["Dominion collapsed", "Rights language intensified in colonies"], ["chapter5-stamp-act"], "High", True, "Crucial context for colonial ideas about rights and resistance.", image_id="ch03ph12"),
            event("chapter3", "p2", "chapter3-colonial-rebellions-1689", 1689, "Colonial Revolts After 1688", "Colonists in several places rose against imperial officials after the Glorious Revolution. These revolts showed that Atlantic political change could quickly produce colonial resistance.", "After news of the Glorious Revolution reached America, colonists moved against leaders associated with James II's regime. In Boston, Edmund Andros was arrested. In New York, Jacob Leisler led a rebellion in the name of Protestant rule and English rights. These uprisings were local and often divisive, but they shared a language of resisting illegitimate authority. The events demonstrate that colonists already believed imperial power had limits. They also reveal how fractured colonial politics could be beneath shared rhetoric.", ["Political"], [THEME["pol"], THEME["wor"]], ["Jacob Leisler", "Edmund Andros"], ["News of the Glorious Revolution", "Resentment of centralized rule"], ["Imperial officials overthrown", "Colonial rights claims strengthened"], [], "Medium", False, "Good supporting evidence for colonial political development."),
            event("chapter3", "p2", "chapter3-salem-witch-trials", 1692, "Salem Witch Trials", "The Salem witch trials erupted in Massachusetts in 1692 and exposed deep fear and instability in New England. The trials remain a symbol of how anxiety could overwhelm due process.", "Accusations of witchcraft in Salem spread rapidly through a community already strained by war, political uncertainty, and social conflict. Dozens were convicted and twenty people were executed before elite opinion turned against the proceedings. The episode damaged confidence in supernatural prosecutions and eventually became an object lesson in legal caution. Salem matters in APUSH not because it was typical of all colonial life, but because it reveals the tensions beneath Puritan society at the end of the seventeenth century. It also shows that New England's communal ideal was weakening. Fear and authority could still combine destructively.", ["Social", "Political"], [THEME["cul"], THEME["pol"]], ["Salem magistrates"], ["Social tension", "War fear", "Religious anxiety"], ["Disillusionment with witchcraft prosecutions", "Puritan authority weakened"], [], "Medium", False, "Useful complexity evidence about New England society.", image_id="ch03ph11"),
            event("chapter3", "p2", "chapter3-board-of-trade", 1696, "Board of Trade Created", "England created the Board of Trade in 1696 to improve imperial administration. The move reflected a stronger commitment to supervising colonial commerce and governance.", "By the 1690s, English officials believed the empire needed more regular oversight. The Board of Trade gathered information, advised on appointments, and monitored colonial compliance with imperial law. It did not eliminate colonial autonomy, but it signaled that the era of loose early settlement was ending. Colonies were becoming too valuable and too populous to ignore. The Board therefore represents the slow tightening of imperial organization before the eighteenth century. It helps explain why later conflicts emerged from long-standing patterns rather than sudden innovation.", ["Political", "Economic"], [THEME["pol"], THEME["wxt"]], ["Board of Trade"], ["Need for stronger imperial oversight"], ["Administration grew more regular", "Colonies were monitored more closely"], [], "Medium", False, "Useful context for long-term imperial centralization."),
            event("chapter3", "p2", "chapter3-slave-code-1705", 1705, "Virginia Slave Code of 1705", "Virginia's 1705 slave code consolidated laws that defined slavery as a permanent racial institution. The code confirmed the legal foundation of a slave society.", "By 1705, Virginia lawmakers had produced a comprehensive slave code that sharply distinguished enslaved Africans and their descendants from white colonists. The code restricted movement, protected masters' authority, and encoded racial difference into law. It represented the culmination of trends that had been developing since the mid-seventeenth century. The code made slavery more secure for elites and more devastating for the enslaved. APUSH uses it as strong evidence that racial hierarchy was made and maintained by law. Colonial liberty for whites now rested more clearly on Black unfreedom.", ["Political", "Social"], [THEME["pol"], THEME["nat"]], ["Virginia assembly"], ["Earlier slavery laws", "Elite desire for labor control"], ["Slave society hardened", "Racial legal hierarchy entrenched"], [], "High", True, "One of the clearest APUSH examples of codified racial slavery.", image_id="ch03ph08"),
            event("chapter3", "p2", "chapter3-georgia-founded", 1732, "Georgia Founded", "Georgia was founded in 1732 as the last of the thirteen colonies. Its creation reflected the continuing expansion and strategic ambition of the British mainland empire.", "James Oglethorpe and other founders imagined Georgia as a buffer against Spanish Florida and as a place for social reform and opportunity. Although early rules limited slavery and large estates, those restrictions later weakened. Georgia's founding shows that colonial expansion continued well into the eighteenth century. It also reveals how strategic and philanthropic goals could mix with imperial ambition. The colony completed the chain of mainland British settlements along the Atlantic seaboard. By this point, Anglo-America had become a broad and increasingly interconnected world.", ["Political", "Migration"], [THEME["mig"], THEME["wor"]], ["James Oglethorpe"], ["Strategic fear of Spain", "Continuing colonial expansion"], ["Thirteenth colony added", "Southern imperial frontier strengthened"], [], "Medium", False, "Helpful endpoint for the territorial growth of British mainland colonies."),
        ],
        "overallTimelineEvents": [
            overall_event("chapter3-navigation-act-1660", 1660, "Navigation Act of 1660", "England begins a more systematic mercantilist regulation of colonial trade.", 2, "This belongs on the master timeline because it sets the economic framework for later imperial-colonial conflict.", ["Economic"]),
            overall_event("chapter3-king-philips-war", 1675, "King Philip's War", "A devastating Native-colonial war reshapes power in New England.", 2, "This event belongs on the master timeline because it captures the violence of colonial expansion and the scale of Native resistance.", ["Military"]),
            overall_event("chapter3-bacons-rebellion", 1676, "Bacon's Rebellion", "Frontier revolt in Virginia exposes class tension and helps accelerate the turn toward slavery.", 2, "It matters because it links politics, class, land conflict, and labor-system change in one event.", ["Political"]),
            overall_event("chapter3-glorious-revolution", 1688, "Glorious Revolution", "Colonial politics absorb a major English constitutional revolution.", 2, "This belongs on the master timeline because it shaped colonial rights language long before 1776.", ["Political"]),
            overall_event("chapter3-slave-code-1705", 1705, "Virginia Slave Code", "Virginia codifies a durable racial slave system in law.", 2, "This is a master timeline event because it marks the legal consolidation of racial slavery in colonial America.", ["Social", "Political"]),
        ],
        "vocabulary": [
            vocab("Restoration", "The return of the monarchy in England in 1660 under Charles II.", "The Restoration ushered in a more organized phase of imperial management and colonial expansion.", "It appears in contextualization questions about late seventeenth-century empire."),
            vocab("Navigation Acts", "A series of English laws regulating colonial trade to benefit the mother country.", "The Navigation Acts tied colonial commerce more tightly to English ships and markets.", "They are core evidence for mercantilism and later colonial grievances."),
            vocab("mercantilism", "The economic theory that colonies should enrich and strengthen the mother country through regulated trade.", "English policymakers used mercantilist ideas to justify trade laws and imperial oversight.", "The concept appears constantly in APUSH questions about empire."),
            vocab("proprietary colony", "A colony granted to an individual or group with broad authority to govern it.", "Carolina and Pennsylvania were important proprietary colonies after the Restoration.", "It helps explain how colonial governance varied within the English empire."),
            vocab("partus sequitur ventrem", "The legal rule that a child's status followed that of the mother.", "Virginia used this doctrine to make slavery hereditary.", "This term is highly relevant in questions about the legal construction of racial slavery."),
            vocab("chattel slavery", "A system in which enslaved people were treated as movable property for life.", "By the late seventeenth century, English colonies increasingly moved toward chattel slavery.", "It is central to understanding the growth of plantation society."),
            vocab("slave code", "A body of laws defining the status of enslaved people and protecting masters' power.", "Virginia's 1705 slave code formalized racial slavery in law.", "Slave codes are essential APUSH evidence for race-based hierarchy."),
            vocab("Bacon's Rebellion", "A 1676 uprising in Virginia led by Nathaniel Bacon against Governor Berkeley and Native peoples.", "The rebellion exposed class tensions in the Chesapeake.", "It often appears in causation questions about the transition to slavery."),
            vocab("King Philip's War", "A 1675-1676 war between Native peoples and New England colonists led by Metacom.", "The war devastated New England and weakened Native power in the region.", "It is a major APUSH example of Native resistance."),
            vocab("Pueblo Revolt", "A 1680 uprising by Pueblo peoples against Spanish rule in New Mexico.", "The revolt showed the strength of Indigenous resistance beyond English America.", "It is useful comparative evidence for Native resistance across empires."),
            vocab("William Penn", "Quaker founder of Pennsylvania.", "Pennsylvania grew rapidly through migration, commerce, and relative religious pluralism.", "Penn often appears in questions about middle-colony diversity and toleration."),
            vocab("Quaker", "A member of the Religious Society of Friends, a Protestant group emphasizing inner light and pacifism.", "Quaker beliefs shaped Pennsylvania's early political culture.", "Quakers are relevant in questions about dissent and toleration."),
            vocab("holy experiment", "William Penn's vision of Pennsylvania as a colony based on Quaker principles and toleration.", "Pennsylvania's early development reflected the idea of a holy experiment.", "It helps explain the distinctiveness of the middle colonies."),
            vocab("Dominion of New England", "A short-lived centralized administrative union imposed by James II over several northern colonies.", "Colonists resented the Dominion as an attack on local self-government.", "It is a key precursor to later resistance to centralized imperial authority."),
            vocab("Glorious Revolution", "The 1688 overthrow of James II and installation of William and Mary.", "Colonists used the revolution to justify resistance to unpopular imperial officials.", "It is a major APUSH turning point in colonial political culture."),
            vocab("English Bill of Rights", "The 1689 document limiting royal power and affirming certain rights of English subjects.", "Its ideas shaped colonial understandings of lawful government.", "It is important in essays connecting English political traditions to American resistance."),
            vocab("Leisler's Rebellion", "A revolt in New York after the Glorious Revolution led by Jacob Leisler.", "The uprising reflected both rights language and deep local factionalism.", "It is useful supporting evidence for Atlantic political conflict."),
            vocab("salutary neglect", "The loose enforcement of trade regulations in the colonies for much of the early eighteenth century.", "Although regulation existed, colonists often experienced broad practical autonomy.", "The term helps explain why stricter control after 1763 triggered such resentment."),
            vocab("Salem witch trials", "The 1692 prosecutions for witchcraft in Massachusetts.", "Salem exposed fear, social tension, and instability in Puritan New England.", "It appears in APUSH as evidence of late seventeenth-century colonial anxiety."),
            vocab("Board of Trade", "An English administrative body created in 1696 to supervise colonial affairs.", "The Board of Trade represented more regular imperial oversight.", "It helps explain the long-term development of British imperial administration."),
        ],
        "essayPractice": {
            "saq": [
                {
                    "id": "saq-001",
                    "prompt": "Answer a, b, and c. a) Briefly explain one similarity between Bacon's Rebellion and King Philip's War. b) Briefly explain one difference between Bacon's Rebellion and King Philip's War. c) Briefly explain one long-term effect of either event on colonial development.",
                    "partA": "Briefly explain one similarity between Bacon's Rebellion and King Philip's War.",
                    "partB": "Briefly explain one difference between Bacon's Rebellion and King Philip's War.",
                    "partC": "Briefly explain one long-term effect of either event on colonial development.",
                    "scoringGuidance": {
                        "partA": "A full-credit answer must identify a real similarity such as connection to frontier expansion, land conflict, or colonial instability.",
                        "partB": "A full-credit answer must explain that one was Native resistance to colonization while the other was a rebellion by colonists against colonial elites.",
                        "partC": "A full-credit answer must explain a concrete long-term effect such as the weakening of Native power in New England or the acceleration of racial slavery in Virginia."
                    },
                    "sampleAnswers": {
                        "partA": "One similarity is that both Bacon's Rebellion and King Philip's War grew out of colonial expansion into Native lands and revealed how unstable the frontier had become.",
                        "partB": "A major difference is that King Philip's War was led by Native peoples resisting colonization, while Bacon's Rebellion was led by English colonists angry at the Virginia elite.",
                        "partC": "One long-term effect of Bacon's Rebellion was that Virginia planters increasingly turned toward enslaved African labor instead of relying so heavily on indentured servants."
                    }
                },
                {
                    "id": "saq-002",
                    "prompt": "Answer a, b, and c. a) Briefly explain one reason slavery expanded in English North America after 1660. b) Briefly explain one role that colonial law played in that expansion. c) Briefly explain one broader consequence of that expansion for colonial society.",
                    "partA": "Briefly explain one reason slavery expanded in English North America after 1660.",
                    "partB": "Briefly explain one role that colonial law played in that expansion.",
                    "partC": "Briefly explain one broader consequence of that expansion for colonial society.",
                    "scoringGuidance": {
                        "partA": "A full-credit response must explain a specific cause such as labor demand, declining reliance on indentured servants, or access to the slave trade.",
                        "partB": "A full-credit response must name a legal development such as partus sequitur ventrem or the 1705 slave code and explain its effect.",
                        "partC": "A full-credit response must explain a broad consequence such as the deepening of racial hierarchy or the emergence of a more stable plantation elite."
                    },
                    "sampleAnswers": {
                        "partA": "Slavery expanded after 1660 because planters wanted a more permanent and controllable labor force than indentured servants provided.",
                        "partB": "Colonial law encouraged slavery by making it hereditary through measures like partus sequitur ventrem, which tied a child's status to the enslaved mother.",
                        "partC": "A broader consequence was that colonial society became more sharply divided by race, with freedom increasingly associated with whiteness."
                    }
                },
            ],
            "leq": [
                {
                    "id": "leq-001",
                    "prompt": "Evaluate the extent to which labor systems in the English colonies changed in the period from 1607 to 1750.",
                    "recommendedArgument": "Continuity and Change Over Time",
                    "thesisExamples": [
                        "Labor systems in the English colonies changed significantly from 1607 to 1750 because the Chesapeake and lower South moved from heavy reliance on indentured servitude toward hereditary racial slavery; however, bound labor and coercion remained constant, showing that colonial prosperity consistently depended on controlling workers.",
                        "Although English colonists always depended on unequal labor relations, the most important change between 1607 and 1750 was the legal and racial consolidation of slavery, which reshaped economy, politics, and ideas of freedom."
                    ],
                    "outlineScaffold": {
                        "contextualization": "Begin with Jamestown, tobacco, and early reliance on indentured servants in the Chesapeake.",
                        "bodyParagraph1": {"claim": "Early colonies depended heavily on indentured labor.", "evidence": ["headright system", "indentured servants", "tobacco demand"], "analysis": "Explain why servitude initially fit early colonial conditions."},
                        "bodyParagraph2": {"claim": "After 1660, colonial elites turned increasingly to slavery.", "evidence": ["partus sequitur ventrem", "Atlantic slave trade", "Virginia slave code"], "analysis": "Show how law and economics pushed the change."},
                        "bodyParagraph3": {"claim": "Coercion remained a constant even as the form changed.", "evidence": ["servitude contracts", "slave codes", "plantation labor"], "analysis": "Use continuity as well as change for stronger analysis."},
                        "complexity": "Earn complexity by explaining that liberty for some colonists expanded while labor coercion deepened for others."
                    },
                    "scoringRubric": {
                        "thesis": "1 point - argue how much labor systems changed over time.",
                        "contextualization": "1 point - situate the prompt in early colonial labor shortages and settlement.",
                        "evidence": "2 points - use specific evidence from both early and late colonial periods.",
                        "analysis": "2 points - demonstrate continuity and change over time.",
                        "complexity": "1 point - connect labor change to race, class, and colonial freedom."
                    }
                },
                {
                    "id": "leq-002",
                    "prompt": "Evaluate the extent to which the Glorious Revolution changed political life in the English colonies from 1688 to 1750.",
                    "recommendedArgument": "Causation",
                    "thesisExamples": [
                        "The Glorious Revolution changed political life in the English colonies to a significant extent because it encouraged colonists to overthrow unpopular officials and defend the rights of English subjects; however, it did not eliminate imperial authority, and most colonists still saw themselves as loyal members of the British Empire.",
                        "Although colonial assemblies and local politics had developed before 1688, the Glorious Revolution gave them a new language of lawful resistance that later became central to American political identity."
                    ],
                    "outlineScaffold": {
                        "contextualization": "Set up the Dominion of New England and James II's centralizing rule before 1688.",
                        "bodyParagraph1": {"claim": "The revolution delegitimized arbitrary imperial rule.", "evidence": ["Andros", "colonial uprisings", "English Bill of Rights"], "analysis": "Show how colonists applied English constitutional ideas to local politics."},
                        "bodyParagraph2": {"claim": "Colonists became more confident in assemblies and local autonomy.", "evidence": ["collapse of Dominion", "colonial rights language"], "analysis": "Explain what changed in political expectations."},
                        "bodyParagraph3": {"claim": "The revolution had limits.", "evidence": ["continued imperial membership", "Board of Trade", "Navigation Acts"], "analysis": "Show that resistance coexisted with continued imperial integration."},
                        "complexity": "Earn sophistication by arguing that the Glorious Revolution both encouraged resistance and stabilized a constitutional empire the colonies still valued."
                    },
                    "scoringRubric": {
                        "thesis": "1 point - make a defensible claim about the revolution's impact.",
                        "contextualization": "1 point - explain the political crisis under James II.",
                        "evidence": "2 points - use specific examples from the Dominion, colonial revolts, and imperial policy.",
                        "analysis": "2 points - explain causation and limits.",
                        "complexity": "1 point - show both change and continuity in the colonial relationship to empire."
                    }
                },
            ],
            "dbq": [
                {
                    "id": "dbq-001",
                    "prompt": "Evaluate the extent to which the English colonies changed between 1660 and 1750.",
                    "documents": [
                        {"docNumber": 1, "title": "Parliament regulates trade", "source": "Navigation Act language, 1660", "excerpt": "For the increase of shipping and encouragement of the navigation of this nation, no commodities of the growth or manufacture of Asia, Africa, or America shall be imported into England except in vessels belonging to English subjects.", "happ": {"historicalSituation": "After the Restoration, England sought tighter control over colonial commerce.", "audience": "The law addressed merchants, shipowners, and customs officials across the empire.", "purpose": "It was designed to channel trade into English hands and strengthen imperial power.", "pointOfView": "As an act of Parliament, it reflects the imperial state's priorities rather than colonial convenience."}},
                        {"docNumber": 2, "title": "Bacon attacks Governor Berkeley", "source": "Nathaniel Bacon, declaration, 1676", "excerpt": "We complain that the governor hath protected the Indians and neglected the grievances of the people, while honest men on the frontier suffer loss, danger, and poverty.", "happ": {"historicalSituation": "Frontier settlers in Virginia rebelled amid land conflict and class tension.", "audience": "Bacon addressed supporters and potential recruits.", "purpose": "He wanted to justify rebellion and rally broader support against the colonial government.", "pointOfView": "Bacon spoke for angry colonists, not for Native peoples or the governor."}},
                        {"docNumber": 3, "title": "Virginia law on slavery", "source": "Virginia legal code, early eighteenth century", "excerpt": "All servants imported and brought into this country who were not Christians in their native country shall be accounted and be slaves. Such slaves shall be held to be real estate.", "happ": {"historicalSituation": "Colonial assemblies codified racial slavery as plantation economies expanded.", "audience": "The law targeted judges, masters, and colonial officials.", "purpose": "It defined property rights and social order in a slave society.", "pointOfView": "The code reflects elite planter priorities and treats enslaved people as property."}},
                        {"docNumber": 4, "title": "William Penn promotes Pennsylvania", "source": "Pennsylvania promotional writing, late seventeenth century", "excerpt": "There we may establish a free colony for all those who confess and acknowledge the one Almighty God, and men of industry shall find room to prosper without persecution.", "happ": {"historicalSituation": "Penn sought migrants for his new colony and promoted toleration and opportunity.", "audience": "The intended audience included dissenters and migrants in Europe.", "purpose": "Penn wanted settlers and investment for Pennsylvania.", "pointOfView": "As a proprietor, Penn highlighted liberty and opportunity while minimizing the colony's future conflicts."}},
                        {"docNumber": 5, "title": "Salem testimony", "source": "Massachusetts witchcraft proceedings, 1692", "excerpt": "The afflicted declare that they are tormented by specters and cries, and the court receives these accusations with grave concern for the safety of the whole community.", "happ": {"historicalSituation": "Witchcraft panic spread through Massachusetts amid political and social anxiety.", "audience": "The testimony was directed to magistrates and the local public.", "purpose": "It sought conviction and explanation for perceived disorder.", "pointOfView": "The source reflects fear and the assumptions of a community under stress, not reliable proof of supernatural events."}}
                    ],
                    "thesisExample": "Between 1660 and 1750, the English colonies changed significantly by becoming more tightly integrated into imperial trade, more socially diverse, and far more committed to racial slavery; however, the colonies remained unstable because growth continued to produce conflict over land, authority, and the meaning of liberty.",
                    "outlineScaffold": {
                        "contextualization": "Explain the earlier foundations of English America in Jamestown and New England before 1660.",
                        "bodyParagraph1": {"claim": "The colonies became more tightly linked to empire and Atlantic commerce.", "documentsUsed": [1, 4], "outsideEvidence": "New Netherland/New York or Board of Trade", "happ": "Use the purpose of the Navigation Act and Penn's promotional bias."},
                        "bodyParagraph2": {"claim": "Growth also sharpened conflict and hierarchy.", "documentsUsed": [2, 3], "outsideEvidence": "King Philip's War or slave code of 1705", "happ": "Use Bacon's point of view and the legal purpose of slave codes."},
                        "bodyParagraph3": {"claim": "Cultural and political instability persisted despite growth.", "documentsUsed": [5], "outsideEvidence": "Dominion of New England or Glorious Revolution", "happ": "Use Salem's historical situation to connect panic to broader instability."},
                        "complexity": "Earn complexity by arguing that colonial growth brought greater prosperity and greater coercion at the same time."
                    }
                }
            ],
        },
        "mcqFacts": [
            fact("the Navigation Acts", "England tried to channel colonial trade into a mercantilist empire that strengthened the mother country.", THEME["wxt"], "Trade regulation is essential context for later imperial conflict."),
            fact("Restoration colonization", "After 1660, English America expanded through new colonies, migration, and stronger imperial management.", THEME["mig"], "The Restoration marks a shift from fragile settlements to a broader colonial system."),
            fact("Pennsylvania", "Pennsylvania grew rapidly through immigration, commerce, and relative religious pluralism.", THEME["cul"], "The middle colonies complicate simple Chesapeake-versus-New England comparisons."),
            fact("colonial inequality", "Commercial growth increased wealth but also deepened class divisions and dependence on credit.", THEME["wxt"], "Prosperity and inequality expanded together in colonial society."),
            fact("partus sequitur ventrem", "Colonial law made slavery hereditary by tying a child's status to the mother.", THEME["pol"], "This fact shows that racial slavery was built through law."),
            fact("the slave trade", "Access to enslaved African labor helped colonies shift away from heavy dependence on indentured servitude.", THEME["wor"], "Atlantic systems shaped mainland labor and race."),
            fact("racial slavery", "By the late seventeenth century, slavery had become more permanent, hereditary, and racially defined.", THEME["nat"], "This is one of the most important long-term developments in colonial history."),
            fact("Bacon's Rebellion", "Class tension and frontier anger in Virginia helped push elites toward a more racialized labor system.", THEME["pol"], "Bacon's Rebellion links politics, land conflict, and slavery."),
            fact("King Philip's War", "Native resistance remained powerful and made New England expansion violent and costly.", THEME["wor"], "The war shows that settlement was a contested process."),
            fact("the Pueblo Revolt", "Native resistance to European empires was a continent-wide pattern, not just an English story.", THEME["wor"], "Comparative evidence strengthens APUSH essays."),
            fact("William Penn", "Penn represented a more pluralistic and commercially dynamic colonial model.", THEME["cul"], "Pennsylvania is a key comparison case in Period 2."),
            fact("the Dominion of New England", "Imperial centralization could provoke colonial claims that English rights were being violated.", THEME["pol"], "This is a vital precursor to later resistance."),
            fact("the Glorious Revolution", "Colonists believed that subjects could resist arbitrary rulers while remaining loyal to the English constitution.", THEME["nat"], "The event shaped colonial political thought long before independence."),
            fact("Salem", "The Salem crisis reflected fear, political instability, and social strain rather than timeless Puritan superstition alone.", THEME["cul"], "Context matters more than treating Salem as a curiosity."),
            fact("the Board of Trade", "England increased administrative oversight as colonies became more valuable and populous.", THEME["pol"], "Imperial organization deepened gradually over time."),
            fact("New York", "The former Dutch colony showed that English America was ethnically and commercially diverse.", THEME["mig"], "English America absorbed other imperial worlds rather than replacing them instantly."),
            fact("Georgia", "Colonial expansion continued well into the eighteenth century for strategic as well as economic reasons.", THEME["wor"], "The map of British America was not fixed early on."),
            fact("consumer society", "Imported goods and market exchange reshaped colonial life while tying prosperity to British commerce.", THEME["wxt"], "Consumer growth helps explain both wealth and dependency."),
            fact("rights of Englishmen", "Colonists increasingly described local autonomy and due process as inherited English rights.", THEME["pol"], "This language later became crucial in the Revolution."),
            fact("Anglo-America", "By 1750, English colonies formed a larger Atlantic society shaped by empire, migration, slavery, and trade.", THEME["wor"], "This chapter explains how the colonies became a coherent but unequal system."),
        ],
        "textStimuli": [
            {"text": "For the increase of shipping and encouragement of navigation, colonial goods shall move in English vessels.", "caption": "Mercantilist trade regulation"},
            {"text": "We complain that the governor hath protected the Indians and neglected the grievances of the people.", "caption": "Nathaniel Bacon's complaint"},
            {"text": "An enforced uniformity is no part of true civil government, and conscience must not be oppressed.", "caption": "Colonial pluralism and dissent"},
            {"text": "All servants brought into this country who were not Christians in their native country shall be accounted slaves.", "caption": "Colonial slave law"},
        ],
        "conceptCards": [
            {"type": "Cause-Effect", "front": "Why did the colonies move toward racial slavery?", "back": "Colonial elites wanted a more permanent labor force, feared disorder from freed servants, and had greater access to the Atlantic slave trade. Law then made slavery hereditary and racial.", "hint": "Economics, fear, law.", "difficulty": "Hard"},
            {"type": "Comparison", "front": "Bacon's Rebellion vs. King Philip's War", "back": "Bacon's Rebellion was a revolt by colonists against colonial elites and Native peoples; King Philip's War was a Native war of resistance against colonists. APUSH pairs them because both reveal instability created by expansion.", "hint": "One settler revolt, one Native resistance.", "difficulty": "Medium"},
            {"type": "Concept", "front": "Why does the Glorious Revolution matter in APUSH?", "back": "It taught colonists that rulers could be resisted when they violated constitutional rights. That idea became part of later American arguments against British authority.", "hint": "Rights before independence.", "difficulty": "Medium"},
            {"type": "Document", "front": "Mercantilism", "back": "Mercantilism was the theory that colonies should benefit the mother country through regulated trade. In practice, it justified the Navigation Acts and greater imperial supervision.", "hint": "Trade serves empire.", "difficulty": "Easy"},
        ],
    }
)


chapter_specs.append(
    {
        "chapterId": "chapter4",
        "chapterNum": 4,
        "chapterOrder": 4,
        "periodId": "p2",
        "periodNumber": 2,
        "chapterMeta": {
            "period": "Period 2",
            "periodId": "p2",
            "dateRange": "1607-1754",
            "apExamWeight": "6-8%",
            "chapterTitle": "Slavery, Freedom, and the Struggle for Empire, to 1763",
            "chapterSubtitle": "British liberty, plantation slavery, revival, and imperial war",
            "bigPictureThemes": [THEME["wor"], THEME["wxt"], THEME["cul"], THEME["pol"]],
            "oneLineSummary": "By the mid-eighteenth century, British colonists celebrated liberty and self-government more confidently than before, but that freedom rested on a booming Atlantic economy powered increasingly by slavery and challenged by escalating imperial war.",
            "periodContext": "Chapter 4 shows the mature British colonial world that emerged before the Revolution. The colonies were richer, more interconnected, and more self-confident, yet they were also more dependent on slavery, more shaped by popular print and religious revival, and more exposed to imperial competition with France and Native peoples.",
            "examTips": [
                "APUSH often asks students to explain the contradiction between British colonists' language of liberty and the expansion of plantation slavery.",
                "The Great Awakening should be treated as both a religious movement and a political-cultural movement that challenged authority and widened public participation.",
                "The Seven Years' War matters not only for military history but because it set up the imperial reforms that caused the American Revolution.",
            ],
        },
        "images": [
            image(4, "ch04co01", "jpg", "British North America before the Revolution looked prosperous, connected, and increasingly self-confident.", "This opening image matters because the mature colonial world was not just a backdrop to independence. It had its own social tensions, political practices, and economic contradictions.", [THEME["cul"], THEME["wxt"]], category="Painting"),
            image(4, "ch04map01", "png", "The Atlantic trade map shows how mainland colonies, the Caribbean, Europe, and Africa formed one imperial economy.", "This map is AP-important because it ties slavery, commerce, and empire into a single system rather than treating them separately.", [THEME["wor"], THEME["wxt"]], category="Map"),
            image(4, "ch04map02", "png", "The geography of plantation regions reveals where enslaved labor became most central to colonial wealth.", "This map matters because slavery was not evenly distributed across the colonies, even though its profits shaped the whole empire.", [THEME["geo"], THEME["wxt"]], category="Map"),
            image(4, "ch04ph06", "jpg", "A visual of plantation labor underscores how British freedom rested heavily on enslaved work.", "The image is significant because it makes the labor system behind Atlantic prosperity visible.", [THEME["wxt"], THEME["nat"]], category="Engraving"),
            image(4, "ch04ph09", "png", "Slave resistance and surveillance were constant features of colonial plantation societies.", "This image helps students connect slavery to fear, discipline, and resistance rather than to passive labor alone.", [THEME["nat"], THEME["pol"]], category="Illustration"),
            image(4, "ch04ph18", "jpg", "Print culture and the public sphere widened political discussion in the colonies.", "This image is useful because newspapers, taverns, and pamphlets helped ordinary colonists engage politics more actively.", [THEME["cul"], THEME["pol"]], category="Engraving"),
            image(4, "ch04ph20", "jpg", "The Great Awakening brought mass preaching, emotional religion, and challenges to established authority.", "The visual matters because revival religion changed how ordinary colonists imagined truth, authority, and participation.", [THEME["cul"], THEME["nat"]], category="Painting"),
            image(4, "ch04ph21", "jpg", "George Whitefield embodied the transatlantic scale of evangelical revival.", "This image matters because Whitefield turned revival into a mass public event linking scattered colonies.", [THEME["cul"], THEME["wor"]], category="Portrait"),
            image(4, "ch04map03", "png", "Imperial rivalry in North America placed British colonists, French settlements, and Native polities in constant tension.", "This map is essential for understanding why the Ohio Valley became the flashpoint for war in the 1750s.", [THEME["wor"], THEME["geo"]], category="Map"),
            image(4, "ch04ph31", "jpg", "The war for empire in North America was fought over space, trade, and political control as much as battlefield glory.", "This image matters because it helps students see the Seven Years' War as a continental and imperial struggle.", [THEME["wor"], THEME["pol"]], category="Battle Scene"),
            image(4, "ch04map04", "png", "The 1763 map of territorial change reveals how victory over France created new imperial problems for Britain.", "This map is one of the most important visuals in the chapter because it links military victory directly to the colonial crisis after 1763.", [THEME["wor"], THEME["pol"]], category="Map"),
        ],
        "notes": {
            "historicalContext": {
                "overview": "By the early eighteenth century, Britain's mainland colonies had become more populous, commercially active, and politically experienced. Colonists often celebrated themselves as unusually free because they had elected assemblies, broad access to land for white settlers, and a relatively loose imperial administration under salutary neglect. Yet the same empire grew richer through Atlantic trade, plantation expansion, and the buying and selling of enslaved Africans. Colonial life also became more participatory through newspapers, taverns, and revival religion, even as imperial rivalry with France moved the colonies toward war.",
                "precedingCauses": [
                    "Restoration growth had created a larger and more regionally specialized Anglo-American world.",
                    "Slave laws and Atlantic trade had already pushed colonies toward more fully developed plantation systems.",
                    "Colonists had become accustomed to local assemblies and light enforcement of many imperial regulations.",
                    "Religious pluralism and commercialization were weakening older forms of uniform authority.",
                    "French, British, Spanish, and Native claims still overlapped across North America.",
                ],
                "geographicContext": "The plantation zones of the Chesapeake, Carolinas, and Caribbean tied coastal lowlands to slave labor and Atlantic exports, while port cities such as Boston, New York, Philadelphia, and Charleston became commercial and cultural hubs. The Appalachian backcountry and Ohio Valley became strategic frontier zones where empire, settlement, and Native power collided.",
                "contextImage": {"imageId": "ch04map01", "displayCaption": "The eighteenth-century colonies were part of a dense Atlantic system of trade, labor, and imperial rivalry."},
            },
            "sections": [
                note_section(
                    "British Liberty and Colonial Self-Government",
                    [THEME["pol"], THEME["nat"], THEME["cul"]],
                    "Many colonists in the early eighteenth century believed they enjoyed the rights of freeborn English subjects more fully than people in Britain itself. They voted in local elections at relatively high rates, paid lower taxes, and often faced weaker aristocratic constraints. Colonial assemblies handled much local governance, and salutary neglect allowed colonists to feel both loyal and self-directed. At the same time, this language of liberty was selective: it applied most strongly to white men and often depended on the subordination of others. The chapter's title matters here because colonial freedom and colonial slavery expanded side by side. APUSH loves this contradiction because it explains why colonists could later denounce tyranny while still tolerating severe inequality.",
                    ["Long colonial experience with assemblies", "Loose enforcement of imperial supervision", "Strong identification with English constitutional rights"],
                    ["Colonial political confidence increased", "Assemblies and local elites gained influence", "Freedom became tied more tightly to whiteness and property"],
                    "This section matters because it defines the political culture that later made resistance to Britain so powerful.",
                    ["Connects to the rights language shaped by the Glorious Revolution in Chapter 3.", "Foreshadows the imperial crisis after 1763 when colonists believed Britain was violating long-standing liberties."],
                    key_figures=[
                        figure("Colonial assemblymen", "Local political elite", "Assembly leaders taxed, legislated, and bargained with royal officials while claiming to defend the rights of English subjects. Their experience made colonies politically mature before the Revolution.", "They matter because the Revolution did not arise in a political vacuum; colonists were already practiced in self-government.", "They represented colonial elite leadership inside the British Empire."),
                    ],
                    primary_sources=["Pamphlets on the rights of Englishmen", "Assembly petitions and resolves"],
                    section_images=[{"imageId": "ch04co01", "displayCaption": "By the eighteenth century, colonists thought of liberty as part of everyday political life, not just a distant English inheritance."}],
                ),
                note_section(
                    "Slavery and the Atlantic Economy",
                    [THEME["wxt"], THEME["wor"], THEME["nat"]],
                    "The mainland colonies cannot be understood apart from slavery. Plantation wealth in the Chesapeake and lower South depended on enslaved labor, while northern merchants, shipbuilders, and consumers also profited from the Atlantic slave economy. Rice, tobacco, indigo, and Caribbean sugar all linked British America to an imperial marketplace shaped by coercion. By the eighteenth century, slavery was no longer a peripheral labor arrangement but a central institution of British colonial life. Colonists who praised liberty often ignored the fact that their prosperity was tied to human bondage. This is one of the deepest APUSH contradictions and one of the most testable themes in the period.",
                    ["Expansion of Atlantic commerce", "Demand for plantation crops", "Mature legal systems of racial slavery"],
                    ["Slave populations grew", "Colonial prosperity deepened", "Racial hierarchy became more entrenched"],
                    "This section matters because APUSH repeatedly asks students to explain how slavery shaped not only the South but the whole British Atlantic world.",
                    ["Builds directly on Chapter 3's legal codification of slavery.", "Foreshadows Chapter 6's tension between revolutionary ideals and slavery."],
                    key_figures=[
                        figure("South Carolina planters", "Plantation elite", "Lowcountry planters built a wealthy rice-based economy that depended heavily on enslaved African labor and transatlantic trade. Their wealth represented one of the clearest links between freedom for elites and bondage for workers.", "They matter because the lower South developed one of the most slave-dependent societies in British North America.", "They represented slaveholding economic power."),
                    ],
                    primary_sources=["Slave sale advertisements", "Shipping manifests", "Plantation account books"],
                    section_images=[
                        {"imageId": "ch04map02", "displayCaption": "Slavery was regionally concentrated, but its profits circulated through the whole British Atlantic economy."},
                        {"imageId": "ch04ph06", "placement": "after-key-figures", "displayCaption": "Plantation wealth depended on labor systems that colonial political rhetoric often concealed."},
                    ],
                ),
                note_section(
                    "Slave Culture and Slave Resistance",
                    [THEME["nat"], THEME["cul"], THEME["pol"]],
                    "Enslaved Africans did not simply endure slavery; they built communities, preserved cultural practices, and resisted in ways both open and hidden. In regions such as South Carolina and Georgia, dense Black populations and connections to West African rice cultures shaped language, work patterns, and family life. Resistance took many forms, including sabotage, running away, preserving kinship networks, and occasional rebellion. The Stono Rebellion made white fear explicit and led to harsher surveillance. APUSH cares about this because slave resistance shows enslaved people as historical actors and because white definitions of freedom were sharpened by fear of Black autonomy.",
                    ["Harsh plantation discipline", "Enslaved Africans' determination to preserve family and culture", "Opportunities created by demographic concentration and frontier space"],
                    ["Distinct African-American cultures emerged", "Masters intensified repression", "Fear of rebellion became central to slave society"],
                    "This section matters because the AP exam rewards answers that treat enslaved people as agents rather than as passive victims.",
                    ["Connects to Chapter 6's discussion of slavery and the Revolution.", "Prepares later periods in which Black resistance, autonomy, and abolition became even more visible."],
                    key_figures=[
                        figure("Stono rebels", "Enslaved insurgents in South Carolina", "Participants in the Stono Rebellion attempted to win freedom by marching southward in 1739. Their revolt exposed both the desperation and the determination of enslaved people in the British colonies.", "They matter because they force students to see resistance as a constant part of slave society.", "They represented enslaved resistance to bondage."),
                    ],
                    primary_sources=["South Carolina slave patrol laws", "Accounts of the Stono Rebellion", "Runaway advertisements"],
                    section_images=[{"imageId": "ch04ph09", "displayCaption": "Slave societies lived with constant fear that bondage could be resisted or overturned."}],
                ),
                note_section(
                    "The Public Sphere and Colonial Politics",
                    [THEME["cul"], THEME["pol"], THEME["wxt"]],
                    "As colonial society became more literate and commercial, politics moved into newspapers, coffeehouses, taverns, and pamphlets. The public sphere widened beyond formal officeholders, allowing more ordinary white colonists to debate government, corruption, and rights. The John Peter Zenger case became famous because it suggested that criticism of officials could be compatible with liberty. Print culture also linked far-apart colonies by circulating arguments and common grievances. This mattered for APUSH because a more active public sphere made later resistance to Britain easier to organize and imagine. Political culture was becoming more participatory long before independence.",
                    ["Growth of towns, printing, and literacy", "Commercial exchange of news and ideas", "Colonial conflict with governors and imperial officials"],
                    ["Public opinion became more important", "Criticism of authority widened", "Intercolonial political consciousness strengthened"],
                    "This section matters because the Revolution required not only grievances but also the cultural tools to spread and organize them.",
                    ["Connects to the Great Awakening because both widened participation and challenged old authority.", "Foreshadows the pamphlet politics of the 1760s and 1770s."],
                    key_figures=[
                        figure("John Peter Zenger", "New York printer", "Zenger was acquitted in a 1735 libel trial after printing criticism of New York's royal governor. The case became symbolic of a freer press, even if its legal meaning was narrower than later memory suggested.", "He matters because APUSH uses the case to track the growth of colonial political culture.", "He represented the expanding world of print and opposition politics."),
                        figure("Benjamin Franklin", "Printer and public intellectual", "Franklin helped make print culture, civic association, and practical Enlightenment values central to colonial life. His career linked commerce, ideas, and public engagement.", "He matters because he embodies the broadening public sphere of the eighteenth-century colonies.", "He represented practical Enlightenment thought and urban civic culture."),
                    ],
                    primary_sources=["Zenger trial arguments", "Colonial newspaper essays", "Political cartoons and broadsides"],
                    section_images=[{"imageId": "ch04ph18", "displayCaption": "The public sphere turned colonial politics into something discussed in print and conversation, not just in assemblies."}],
                ),
                note_section(
                    "The Great Awakening and the Challenge to Authority",
                    [THEME["cul"], THEME["nat"], THEME["pol"]],
                    "The Great Awakening was a series of religious revivals that swept through the colonies in the 1730s and 1740s. Revival preachers such as Jonathan Edwards and George Whitefield emphasized emotional conversion, personal experience, and the need for spiritual rebirth. The movement divided congregations into New Lights and Old Lights and weakened the authority of established ministers. It also encouraged ordinary people, including women and the less powerful, to believe that truth and salvation did not depend entirely on traditional hierarchy. The Great Awakening was therefore both religious and social. APUSH frequently tests it as an early movement of democratization and shared intercolonial experience.",
                    ["Religious formalism in established churches", "Transatlantic evangelical preaching", "Desire for emotional and personal faith"],
                    ["Churches split", "Ordinary people challenged old authority", "Intercolonial common experience deepened"],
                    "This section matters because the Great Awakening helped create habits of mass participation and skepticism toward established authority that later fed political movements.",
                    ["Connects to the public sphere and later revolutionary mobilization.", "Can be compared with the Enlightenment as two different ways colonists questioned inherited authority."],
                    key_figures=[
                        figure("Jonathan Edwards", "New England revivalist minister", "Edwards preached the necessity of conversion and became one of the best-known theological voices of the Great Awakening. His sermons captured the emotional intensity of revival religion.", "He matters because APUSH often uses him to represent the theological side of the Awakening.", "He represented evangelical Calvinism."),
                        figure("George Whitefield", "Itinerant evangelical preacher", "Whitefield traveled through the colonies drawing enormous crowds and turning revival into a transatlantic public event. His tours created a sense of shared colonial experience that crossed regional lines.", "He matters because he shows how mass culture and revival religion reinforced one another.", "He represented charismatic evangelical populism.", "ch04ph21"),
                    ],
                    primary_sources=["Jonathan Edwards, 'Sinners in the Hands of an Angry God'", "Whitefield sermons and travel accounts"],
                    section_images=[
                        {"imageId": "ch04ph20", "displayCaption": "Revival meetings made religion emotional, public, and participatory in new ways."},
                        {"imageId": "ch04ph21", "placement": "after-key-figures", "displayCaption": "Whitefield linked distant colonies into one revival culture through celebrity preaching."},
                    ],
                ),
                note_section(
                    "Imperial Rivalries and the Seven Years' War",
                    [THEME["wor"], THEME["pol"], THEME["geo"]],
                    "The French and Indian War, part of the wider Seven Years' War, transformed the balance of power in North America. Conflict centered on the Ohio Valley, where British land hunger, French imperial claims, and Native political autonomy collided. Early British defeats such as Braddock's disaster exposed colonial weakness, but William Pitt's later strategy helped Britain win a global conflict against France. The 1763 Treaty of Paris removed France from mainland North America east of the Mississippi. Yet victory created new problems: Britain faced huge debt, larger territories to police, and intensified Native resistance such as Pontiac's Rebellion. This is one of the single most important turning points in APUSH because it led directly into the imperial crisis that produced the Revolution.",
                    ["Anglo-French rivalry", "Competition for the Ohio Valley", "Native efforts to preserve autonomy and balance of power"],
                    ["Britain won an enlarged empire", "France lost most mainland holdings", "Imperial debt and frontier conflict set up post-1763 reforms"],
                    "This section matters because the Revolution cannot be understood without the consequences of British victory in 1763.",
                    ["Links directly to Chapter 5 and the postwar imperial crisis.", "Builds on the long theme of empire and Native resistance from earlier chapters."],
                    key_figures=[
                        figure("William Pitt", "British war leader", "Pitt directed Britain's wartime strategy and committed major resources to defeating France. His leadership helped turn a faltering war into imperial victory.", "He matters because British success in North America was not inevitable and depended on state capacity.", "He represented aggressive imperial mobilization."),
                        figure("Pontiac", "Ottawa leader", "Pontiac became associated with the Native uprising that followed Britain's victory in 1763. The rebellion showed that removing France did not remove Native power or Native resistance.", "He matters because 1763 was not simply a story of British triumph; it also produced immediate Native challenge.", "He represented Indigenous resistance to British postwar expansion."),
                    ],
                    primary_sources=["Albany Plan of Union", "Join, or Die cartoon", "Treaty of Paris terms", "Pontiac's speeches and British proclamations"],
                    section_images=[
                        {"imageId": "ch04map03", "displayCaption": "The Ohio Valley became the key fault line where French, British, and Native interests collided."},
                        {"imageId": "ch04ph31", "placement": "after-key-figures", "displayCaption": "The Seven Years' War was a struggle over empire, not just a series of colonial skirmishes."},
                        {"imageId": "ch04map04", "placement": "after-significance", "displayCaption": "The 1763 settlement made Britain stronger on paper but far more vulnerable politically."},
                    ],
                ),
            ],
            "overarchingAnalysis": {
                "continuity": "Colonial claims to freedom still coexisted with coercion, Native dispossession, and racial hierarchy. The empire remained a system in which liberty was real for some colonists but systematically denied to others.",
                "change": "By 1763, British America was richer, more populous, and more culturally interconnected than ever before. The biggest change was that imperial victory created a new political problem: colonists expected freedom inside an empire that was now preparing to govern them more aggressively.",
                "complexity": "A strong complexity point argues that the eighteenth-century colonies became more democratic in participation while also becoming more unequal in race and labor. Greater public life did not mean broader equality.",
                "comparisonAngles": [
                    "Compare the Great Awakening and the Enlightenment as two distinct but overlapping challenges to established authority.",
                    "Compare the freedom of white colonists with the bondage of enslaved Africans to explain the central paradox of British North America.",
                ],
            },
        },
        "periodTimeline": [
            event("chapter4", "p2", "chapter4-treaty-of-utrecht", 1713, "Treaty of Utrecht", "The Treaty of Utrecht ended Queen Anne's War in 1713 and expanded British imperial advantages. It also granted Britain greater access to the Atlantic slave trade.", "The treaty transferred important territories such as Acadia from France to Britain and gave Britain the asiento, the right to sell enslaved Africans in Spanish America. These gains strengthened Britain's imperial and commercial position. The treaty demonstrates that diplomacy and slavery were tightly linked in imperial competition. It also reveals how global war affected North American development. Britain's colonial future rested not only on settlement but also on trade and maritime power. For APUSH, Utrecht is a useful starting point for Britain's eighteenth-century ascent.", ["Diplomatic", "Economic"], [THEME["wor"], THEME["wxt"]], ["British diplomats"], ["War with France and Spain"], ["British imperial position strengthened", "Slave-trade profits increased"], [], "Medium", False, "Helpful context for British imperial growth."),
            event("chapter4", "p2", "chapter4-molasses-act", 1733, "Molasses Act", "Parliament passed the Molasses Act in 1733 to protect British West Indian planters. The law revealed how imperial trade policy could generate colonial smuggling and resentment.", "New England merchants imported molasses from French Caribbean islands because it was cheaper than British alternatives. Parliament imposed duties to channel trade toward British sugar colonies. In practice, many colonists smuggled or evaded the law, a sign of salutary neglect and colonial resistance to burdensome regulation. The act mattered because it showed that imperial trade restrictions and colonial economic habits were already in tension before the Revolution. Later reforms after 1763 would try to enforce such rules more seriously. The law therefore previews future conflict.", ["Economic", "Political"], [THEME["wxt"], THEME["pol"]], ["Parliament"], ["Mercantilist protection of British West Indies"], ["Smuggling increased", "Colonists grew used to lax enforcement"], ["chapter5-sugar-act"], "Medium", False, "Useful background for later taxation disputes."),
            event("chapter4", "p2", "chapter4-zenger-trial", 1735, "Zenger Trial", "John Peter Zenger was acquitted of seditious libel in 1735 after criticizing New York's royal governor. The case became a symbol of a freer colonial press.", "Zenger's newspaper published attacks on Governor William Cosby, leading the government to charge him with seditious libel. His lawyers argued that truthful criticism of officials should not be punished. The jury acquitted him, and the verdict was widely celebrated in the colonies. Although the legal precedent was narrower than later memory suggested, the political symbolism was enormous. Colonists increasingly believed that public criticism of power could be legitimate. The case became a landmark in the growth of the colonial public sphere.", ["Political", "Cultural"], [THEME["pol"], THEME["cul"]], ["John Peter Zenger"], ["Growth of print culture", "Conflict with royal authority"], ["Free-press ideals gained prestige", "Public political debate widened"], [], "High", True, "A frequent APUSH example of the expanding colonial public sphere.", image_id="ch04ph18"),
            event("chapter4", "p2", "chapter4-stono-rebellion", 1739, "Stono Rebellion", "Enslaved people in South Carolina launched the Stono Rebellion in 1739. The uprising exposed the violence and instability of slave society.", "A group of enslaved Africans seized weapons and marched south in hopes of reaching Spanish Florida, where freedom had been promised to some fugitives. White colonists crushed the revolt, but the rebellion terrified slaveholders throughout the region. Legislatures responded with stricter slave codes and surveillance. Stono matters in APUSH because it proves that enslaved people resisted bondage actively and that plantation liberty for whites rested on fear and repression. It also shows the international dimensions of slavery, since Spanish policy helped shape the rebels' hopes. Slave resistance remained a constant possibility in the British colonies.", ["Military", "Social"], [THEME["nat"], THEME["pol"]], ["Stono rebels"], ["Harsh plantation slavery", "Hope of escape to Spanish Florida"], ["Repression intensified", "Fear of rebellion deepened"], [], "High", True, "One of the most important APUSH examples of slave resistance.", image_id="ch04ph09"),
            event("chapter4", "p2", "chapter4-negro-act", 1740, "South Carolina Negro Act", "South Carolina passed a stricter slave code in 1740 after the Stono Rebellion. The law reinforced surveillance and control in a fearful slave society.", "The Negro Act limited enslaved people's movement, assembly, literacy, and economic activity. Lawmakers believed that only tighter discipline could prevent further rebellion. The act illustrates how resistance by the enslaved shaped white policy. It also shows that legal repression intensified as the slave population grew. APUSH uses such laws to show that slavery was a political system of control as much as an economic system of labor. The code deepened the contradiction between liberty and bondage in British America.", ["Political", "Social"], [THEME["pol"], THEME["nat"]], ["South Carolina assembly"], ["Stono Rebellion", "Planter fear"], ["Surveillance increased", "Slave society hardened"], [], "Medium", False, "Good supporting evidence for the political structure of slavery."),
            event("chapter4", "p2", "chapter4-whitefield-tour", 1740, "George Whitefield's Revival Tour", "George Whitefield's preaching tours in the 1740s helped spread the Great Awakening across the colonies. His celebrity transformed revival into a mass public movement.", "Whitefield traveled from colony to colony preaching outdoors to enormous crowds. His dramatic style and emphasis on personal conversion attracted people across regional lines. The revivals helped ordinary colonists imagine themselves as part of a larger shared experience. They also undermined the authority of some established ministers and churches. Whitefield's popularity depended on print, travel, and public enthusiasm as much as theology. For APUSH, his tours show how religion and mass culture combined in the eighteenth-century colonies.", ["Cultural"], [THEME["cul"], THEME["wor"]], ["George Whitefield"], ["Evangelical preaching", "Colonial print and travel networks"], ["Great Awakening spread", "Intercolonial identity strengthened"], [], "High", True, "A central APUSH event for revival, culture, and democratization.", image_id="ch04ph21"),
            event("chapter4", "p2", "chapter4-sinners-sermon", 1741, "Edwards Preaches 'Sinners in the Hands of an Angry God'", "Jonathan Edwards delivered one of the most famous Great Awakening sermons in 1741. The sermon captured the emotional and urgent style of revival religion.", "Edwards's sermon emphasized human sinfulness, divine judgment, and the need for immediate conversion. It spread far beyond its original audience through print and memory. The sermon illustrates the intense emotional force of revival preaching and the challenge it posed to formal religion. It also reminds students that the Great Awakening was deeply theological, not just socially democratic. Edwards mattered because he gave the movement intellectual and spiritual seriousness. His sermon remains a standard APUSH primary source.", ["Cultural"], [THEME["cul"]], ["Jonathan Edwards"], ["Religious revival culture"], ["Evangelical religion gained influence", "Church divisions deepened"], [], "Medium", False, "A classic primary-source anchor for the Great Awakening."),
            event("chapter4", "p2", "chapter4-albany-congress", 1754, "Albany Congress", "Colonial leaders met at Albany in 1754 to discuss defense and Native diplomacy. The congress revealed both the need for coordination and the limits of colonial unity.", "Representatives from several colonies gathered in Albany as British officials worried about French expansion and Native alliances. Benjamin Franklin proposed the Albany Plan of Union, which would have created a more coordinated colonial structure. The plan was rejected by both colonial assemblies and imperial authorities. Even so, the congress mattered because it demonstrated that intercolonial cooperation was becoming thinkable. It also highlighted the importance of Native diplomacy in imperial conflict. APUSH often uses Albany as a precursor to later colonial union.", ["Political", "Diplomatic"], [THEME["pol"], THEME["wor"]], ["Benjamin Franklin"], ["French threat in the Ohio Valley", "Need for Native alliances"], ["Union debated but rejected", "Colonial cooperation gained precedent"], [], "High", True, "Important evidence for pre-Revolutionary intercolonial thinking.", image_id="ch04map03"),
            event("chapter4", "p2", "chapter4-join-or-die", 1754, "Franklin Publishes 'Join, or Die'", "Benjamin Franklin published the 'Join, or Die' cartoon in 1754 to encourage colonial unity. The image became one of the most famous political cartoons in American history.", "The segmented snake cartoon urged colonies to cooperate in the face of French and Native power. It was simple, memorable, and easily circulated. The cartoon matters because it shows how print culture could shape political imagination before the Revolution. It also reminds students that calls for unity first emerged within an imperial and wartime framework, not only in a movement for independence. Visual propaganda had become a powerful colonial tool. Franklin's cartoon remains a classic APUSH document.", ["Political", "Cultural"], [THEME["pol"], THEME["cul"]], ["Benjamin Franklin"], ["Need for colonial coordination"], ["Shared political imagery spread", "Union rhetoric became more familiar"], [], "Medium", False, "Useful supplementary evidence for colonial unity and print culture."),
            event("chapter4", "p2", "chapter4-french-indian-war-begins", 1754, "French and Indian War Begins", "Conflict in the Ohio Valley sparked the French and Indian War in 1754. The war would grow into a global struggle between Britain and France.", "British colonists and land speculators wanted access to the Ohio Valley, while France sought to preserve its imperial connections from Canada to Louisiana. Native peoples also fought to defend their own interests and maintain balance. Early fighting, including George Washington's first campaigns, escalated the conflict. The war mattered because it forced Britain to mobilize colonial resources on a larger scale than ever before. It also intensified colonial expectations about land and security. The conflict would become the decisive imperial war of the eighteenth century.", ["Military", "Diplomatic"], [THEME["wor"], THEME["geo"]], ["George Washington"], ["Imperial rivalry in the Ohio Valley"], ["Global war expanded", "Colonial military cooperation increased"], ["chapter4-treaty-of-paris-1763"], "High", True, "A major turning point linking colonial empire to the Revolution.", image_id="ch04map03"),
            event("chapter4", "p2", "chapter4-braddock-defeat", 1755, "Braddock's Defeat", "British General Edward Braddock suffered a major defeat in 1755 near Fort Duquesne. The loss exposed British vulnerability in North American warfare.", "Braddock marched with regular troops and colonial forces toward Fort Duquesne but was ambushed by French and Native fighters. The defeat demonstrated that European-style military assumptions did not transfer easily to North American terrain. It also intensified colonial insecurity and anger. George Washington's survival in the campaign elevated his early reputation. For APUSH, the defeat illustrates the serious military stakes of the imperial contest. Britain would need new leadership and strategy to win.", ["Military"], [THEME["wor"], THEME["geo"]], ["Edward Braddock", "George Washington"], ["British attempt to seize Fort Duquesne"], ["British strategy reassessed", "Colonial alarm increased"], [], "Medium", False, "Good evidence for the difficulties of frontier warfare."),
            event("chapter4", "p2", "chapter4-seven-years-war", 1756, "Seven Years' War Begins", "In 1756 the conflict widened into the global Seven Years' War. North America became one theater in a much larger imperial struggle.", "Once Britain and France formally declared war, the North American fighting became part of a worldwide contest stretching across Europe, the Caribbean, Africa, and Asia. The war tested Britain's fiscal and naval strength as well as colonial loyalty. It also revealed how North American conflict could reshape global geopolitics. Colonial experience in the war expanded expectations for land, autonomy, and military recognition. APUSH often uses the Seven Years' War to show that colonial America was deeply embedded in world history. The war's scale makes its consequences impossible to treat as merely local.", ["Military", "Diplomatic"], [THEME["wor"]], ["Britain", "France"], ["Escalation of imperial rivalry"], ["Conflict globalized", "British imperial mobilization deepened"], [], "Medium", False, "Useful context for understanding why 1763 mattered so much."),
            event("chapter4", "p2", "chapter4-quebec-captured", 1759, "British Capture Quebec", "Britain captured Quebec in 1759, a decisive victory against New France. The battle signaled that France was losing its mainland North American empire.", "British forces under James Wolfe defeated the French near Quebec after a daring campaign. The victory weakened French control over Canada and transformed the strategic balance of the war. Although fighting continued, Quebec became the symbolic turning point of British success. Colonists interpreted the victory as proof of British imperial strength. It also raised the question of what would happen if France no longer threatened the colonies from the north. APUSH often treats 1759 as the beginning of the end for French mainland power in North America.", ["Military"], [THEME["wor"]], ["James Wolfe"], ["British strategic offensive"], ["French position collapsed", "British victory became likely"], [], "Medium", False, "Useful military turning point in the war.", image_id="ch04ph31"),
            event("chapter4", "p2", "chapter4-treaty-of-paris-1763", 1763, "Treaty of Paris", "The 1763 Treaty of Paris ended the Seven Years' War and gave Britain a vast North American empire. Victory transformed Britain's relationship with its colonies.", "The treaty forced France to surrender Canada and its claims east of the Mississippi River, while Spain gained Louisiana from France and ceded Florida to Britain. Britain emerged as the dominant imperial power in eastern North America. Yet the victory came with a huge national debt and enormous new territories to manage. Colonists celebrated the defeat of France but also expected access to western lands. The treaty therefore created the conditions for future imperial friction rather than simple harmony. It is one of the key turning points leading into the Revolution.", ["Diplomatic"], [THEME["wor"], THEME["pol"]], ["British diplomats"], ["British wartime victories"], ["British empire enlarged", "Debt and administrative pressures increased"], ["chapter5-proclamation-1763", "chapter5-sugar-act"], "High", True, "One of the most important APUSH turning points before the Revolution.", image_id="ch04map04"),
            event("chapter4", "p2", "chapter4-pontiacs-rebellion", 1763, "Pontiac's Rebellion", "Native leaders launched a major uprising against British rule in the Great Lakes and Ohio Valley in 1763. The rebellion showed that imperial victory over France did not end Native resistance.", "After France's defeat, British officials reduced gifts and altered diplomatic patterns with Native nations. Many Native leaders feared a more aggressive British settler empire and coordinated attacks on forts and settlements. Pontiac became the best-known figure associated with the uprising. The rebellion reminded Britain that Native diplomacy and force still mattered greatly in North America. It also influenced the Proclamation of 1763. APUSH uses Pontiac's Rebellion to show that 1763 was a moment of Native power as well as British triumph.", ["Military", "Diplomatic"], [THEME["wor"], THEME["pol"]], ["Pontiac"], ["British postwar policies", "Native defense of land and autonomy"], ["Frontier violence intensified", "Britain reconsidered western settlement"], ["chapter5-proclamation-1763"], "Medium", False, "Vital evidence for Native agency after the Seven Years' War."),
            event("chapter4", "p2", "chapter4-proclamation-1763", 1763, "Proclamation of 1763", "Britain issued the Proclamation of 1763 to limit settlement west of the Appalachians. The policy angered colonists who expected land after the war.", "Trying to stabilize the frontier after Pontiac's Rebellion, British officials drew a line along the Appalachian Mountains and restricted colonial settlement beyond it. The policy aimed to reduce conflict and control the costs of empire. Many colonists ignored or resented the line because they believed victory had earned them western opportunity. The Proclamation therefore revealed a widening gap between imperial priorities and colonial expectations. It did not cause the Revolution by itself, but it became an early sign that British victory would constrain rather than simply reward colonists. APUSH often treats it as the first major postwar imperial measure to provoke resentment.", ["Political", "Geographic"], [THEME["pol"], THEME["geo"]], ["George III"], ["Pontiac's Rebellion", "Cost of frontier defense"], ["Western resentment increased", "Imperial-colonial tension deepened"], ["chapter5-sugar-act"], "High", True, "A key bridge between the Seven Years' War and the imperial crisis.", image_id="ch04map04"),
        ],
        "overallTimelineEvents": [
            overall_event("chapter4-zenger-trial", 1735, "Zenger Trial", "The colonies celebrate a symbolic victory for a freer press and public criticism of power.", 2, "This belongs on the master timeline because it marks the growth of the colonial public sphere and political culture.", ["Political"]),
            overall_event("chapter4-stono-rebellion", 1739, "Stono Rebellion", "Enslaved resistance reveals the instability and violence of slave society.", 2, "This event belongs on the master timeline because it shows enslaved people as active historical actors and the coercive foundations of colonial wealth.", ["Social", "Military"]),
            overall_event("chapter4-whitefield-tour", 1740, "Great Awakening Spreads", "George Whitefield's tours turn revival into an intercolonial movement.", 2, "This matters because the Great Awakening challenged authority and widened participation across the colonies.", ["Cultural"]),
            overall_event("chapter4-french-indian-war-begins", 1754, "French and Indian War Begins", "Imperial conflict in the Ohio Valley launches the decisive war for North America.", 2, "This is a master timeline event because the war's consequences directly set up the American Revolution.", ["Military"]),
            overall_event("chapter4-treaty-of-paris-1763", 1763, "Treaty of Paris", "Britain wins a huge empire but inherits debt and new political problems.", 2, "It belongs on the master timeline because it marks the turning point from colonial war to imperial crisis.", ["Diplomatic"]),
        ],
        "vocabulary": [
            vocab("salutary neglect", "Britain's long period of relatively loose enforcement of trade regulations and colonial oversight.", "Many colonists became used to broad practical autonomy under salutary neglect.", "It frequently appears in APUSH explanations for why post-1763 reforms felt so intrusive."),
            vocab("rights of Englishmen", "The traditional rights colonists believed they possessed as English subjects, including jury trials and representative institutions.", "Colonists used this language to defend assemblies and criticize arbitrary authority.", "This concept is essential to APUSH political analysis before the Revolution."),
            vocab("middle passage", "The transatlantic voyage that carried enslaved Africans to the Americas under brutal conditions.", "The middle passage linked African captivity to plantation labor in British America.", "It appears in questions about slavery and the Atlantic world."),
            vocab("triangular trade", "The broad Atlantic exchange linking Europe, Africa, the Caribbean, and North America through goods, labor, and shipping.", "Northern merchants and southern planters both benefited from triangular trade patterns.", "It is useful shorthand in APUSH for the integration of empire and slavery."),
            vocab("asiento", "The contract granting the right to supply enslaved Africans to Spanish America.", "Britain gained the asiento in 1713, strengthening its role in the slave trade.", "This term ties diplomacy directly to slavery and empire."),
            vocab("consumer revolution", "The growth in access to imported goods and market participation in the eighteenth-century colonies.", "Colonists bought more British goods, which broadened comfort but also increased debt and dependence.", "It helps explain why colonial prosperity and imperial connection deepened together."),
            vocab("public sphere", "The realm of public discussion shaped by print, taverns, coffeehouses, and political debate.", "The colonial public sphere made criticism of authority more visible and participatory.", "The term appears in questions about political culture and resistance."),
            vocab("John Peter Zenger", "New York printer acquitted in a famous 1735 libel case.", "Zenger's acquittal became symbolic of the growth of press freedom in the colonies.", "He is a common APUSH figure in questions on the public sphere."),
            vocab("Great Awakening", "A series of religious revivals in the colonies during the 1730s and 1740s.", "The Great Awakening challenged established churches and widened participation in religious life.", "It is one of the most frequently tested cultural developments of Period 2."),
            vocab("Jonathan Edwards", "Revivalist minister whose sermon 'Sinners in the Hands of an Angry God' became a classic expression of the Great Awakening.", "Edwards represented the theological intensity of revival religion.", "He often appears in APUSH stimulus questions."),
            vocab("George Whitefield", "Evangelical preacher whose tours spread revival across the colonies.", "Whitefield turned religion into a mass public experience linking the colonies together.", "He is central to APUSH explanations of the Great Awakening's reach."),
            vocab("Old Lights", "Colonists who opposed or distrusted the emotional style of the Great Awakening.", "Old Lights defended established churches and traditional clerical authority.", "The term helps explain divisions caused by revival."),
            vocab("New Lights", "Supporters of the Great Awakening who embraced revival preaching and personal conversion.", "New Lights challenged older religious hierarchies and often supported evangelical ministers.", "The term appears in comparison questions about colonial religion."),
            vocab("Enlightenment", "A movement emphasizing reason, science, and the ability of humans to understand and improve society.", "Colonial thinkers such as Franklin reflected Enlightenment influences in practical and civic ways.", "It is often compared with the Great Awakening in APUSH essays."),
            vocab("deism", "A religious outlook shaped by Enlightenment reason that viewed God as a creator whose laws could be understood through nature and reason.", "Some educated colonists were influenced by deist ideas even while revivals spread among others.", "It is useful for comparing intellectual trends in the eighteenth century."),
            vocab("Stono Rebellion", "A 1739 slave uprising in South Carolina.", "Stono revealed the resistance of enslaved people and the insecurity of slave society.", "It is a major APUSH event and vocabulary term."),
            vocab("Albany Plan of Union", "Benjamin Franklin's 1754 proposal for coordinated colonial defense and administration.", "The colonies rejected the Albany Plan, but it became an important precedent for later union.", "It appears in APUSH questions about pre-Revolutionary cooperation."),
            vocab("French and Indian War", "The North American theater of the Seven Years' War between Britain and France, beginning in 1754.", "The war determined who would dominate North America east of the Mississippi.", "It is one of the most important events in pre-Revolutionary APUSH."),
            vocab("Pontiac's Rebellion", "A Native uprising against British power in 1763 after the defeat of France.", "The rebellion showed that Native resistance remained central after British victory.", "It is essential for understanding why Britain issued the Proclamation of 1763."),
            vocab("Proclamation of 1763", "A British policy restricting colonial settlement west of the Appalachian Mountains.", "Many colonists saw the proclamation as an unjust limit on the fruits of victory.", "It is a critical bridge term linking the Seven Years' War to the Revolution."),
        ],
        "essayPractice": {
            "saq": [
                {
                    "id": "saq-001",
                    "prompt": "Answer a, b, and c. a) Briefly explain one way the Great Awakening challenged established authority in the colonies. b) Briefly explain one way the Enlightenment influenced colonial society. c) Briefly explain one significant difference between the Great Awakening and the Enlightenment in the colonies.",
                    "partA": "Briefly explain one way the Great Awakening challenged established authority in the colonies.",
                    "partB": "Briefly explain one way the Enlightenment influenced colonial society.",
                    "partC": "Briefly explain one significant difference between the Great Awakening and the Enlightenment in the colonies.",
                    "scoringGuidance": {
                        "partA": "A full-credit answer must explain how revival religion challenged established clergy or encouraged ordinary participation.",
                        "partB": "A full-credit answer must explain a concrete Enlightenment influence such as scientific inquiry, print culture, civic improvement, or rational religion.",
                        "partC": "A full-credit answer must distinguish revival's emotional religious emphasis from the Enlightenment's stress on reason."
                    },
                    "sampleAnswers": {
                        "partA": "The Great Awakening challenged authority by encouraging ordinary colonists to judge ministers by their personal experience of conversion rather than simply by church office.",
                        "partB": "The Enlightenment influenced colonial society by encouraging people such as Benjamin Franklin to value reason, scientific investigation, and practical civic improvement.",
                        "partC": "A key difference was that the Great Awakening emphasized emotional religious rebirth, while the Enlightenment emphasized reason and observation."
                    }
                },
                {
                    "id": "saq-002",
                    "prompt": "Answer a, b, and c. a) Briefly explain one reason slavery expanded in the British colonies during the eighteenth century. b) Briefly explain one way enslaved people resisted slavery. c) Briefly explain one consequence of slave resistance for colonial law or society.",
                    "partA": "Briefly explain one reason slavery expanded in the British colonies during the eighteenth century.",
                    "partB": "Briefly explain one way enslaved people resisted slavery.",
                    "partC": "Briefly explain one consequence of slave resistance for colonial law or society.",
                    "scoringGuidance": {
                        "partA": "A full-credit answer must explain a real cause such as plantation crop demand or Atlantic trade growth.",
                        "partB": "A full-credit answer must identify a concrete form of resistance such as running away, sabotage, preserving family ties, or rebellion.",
                        "partC": "A full-credit answer must explain a consequence such as stricter slave codes or intensified white fear and surveillance."
                    },
                    "sampleAnswers": {
                        "partA": "Slavery expanded because planters needed large labor forces to produce profitable export crops such as tobacco, rice, and indigo for Atlantic markets.",
                        "partB": "Enslaved people resisted by rebelling openly, as in the Stono Rebellion, or by running away, sabotaging work, and preserving kinship networks.",
                        "partC": "One consequence was that colonial legislatures passed stricter slave laws and surveillance systems to prevent future uprisings."
                    }
                },
            ],
            "leq": [
                {
                    "id": "leq-001",
                    "prompt": "Evaluate the extent to which slavery shaped the development of British North America in the period from 1700 to 1763.",
                    "recommendedArgument": "Causation",
                    "thesisExamples": [
                        "Slavery shaped the development of British North America to a very great extent because plantation labor fueled export wealth, structured regional identities, and hardened racial hierarchy; however, its influence extended beyond the South since northern merchants, consumers, and imperial officials also profited from the slave economy.",
                        "Although colonists often celebrated liberty and self-government, the development of British North America from 1700 to 1763 was deeply shaped by slavery, which powered the Atlantic economy and defined the limits of freedom."
                    ],
                    "outlineScaffold": {
                        "contextualization": "Explain the late seventeenth-century codification of racial slavery and the growth of Atlantic commerce.",
                        "bodyParagraph1": {"claim": "Slavery drove plantation prosperity.", "evidence": ["rice", "tobacco", "indigo", "plantation labor"], "analysis": "Show how crop profits depended on enslaved labor."},
                        "bodyParagraph2": {"claim": "Slavery shaped politics and race.", "evidence": ["slave codes", "Stono Rebellion", "white fear"], "analysis": "Explain how law and repression structured colonial society."},
                        "bodyParagraph3": {"claim": "Slavery influenced the whole empire, not only the plantation South.", "evidence": ["Atlantic trade", "northern merchants", "asiento"], "analysis": "Expand the argument beyond a narrow regional frame."},
                        "complexity": "Earn complexity by showing that colonists' growing language of liberty depended materially on slavery."
                    },
                    "scoringRubric": {
                        "thesis": "1 point - make a defensible claim about slavery's extent of influence.",
                        "contextualization": "1 point - establish the transition from earlier labor systems to mature plantation slavery.",
                        "evidence": "2 points - use specific economic, political, and social evidence.",
                        "analysis": "2 points - explain causation and scope across regions.",
                        "complexity": "1 point - show how freedom and slavery developed together."
                    }
                },
                {
                    "id": "leq-002",
                    "prompt": "Evaluate the extent to which the Great Awakening transformed colonial society in the period from 1730 to 1763.",
                    "recommendedArgument": "Continuity and Change Over Time",
                    "thesisExamples": [
                        "The Great Awakening transformed colonial society to a significant extent by weakening established churches, encouraging ordinary participation, and creating a shared intercolonial experience; however, older hierarchies and denominations survived, so the movement altered rather than replaced colonial religious life.",
                        "Although colonial society retained social inequality and established institutions, the Great Awakening marked an important change because it encouraged colonists to question authority and made mass public movements more plausible."
                    ],
                    "outlineScaffold": {
                        "contextualization": "Begin with established churches, expanding print culture, and the wider Atlantic world of ideas.",
                        "bodyParagraph1": {"claim": "Revival challenged established religious authority.", "evidence": ["Jonathan Edwards", "George Whitefield", "New Lights vs. Old Lights"], "analysis": "Explain how emotional conversion undermined clerical monopoly."},
                        "bodyParagraph2": {"claim": "The movement widened participation and connection.", "evidence": ["mass preaching", "print culture", "intercolonial audiences"], "analysis": "Show how revival created a broader shared experience."},
                        "bodyParagraph3": {"claim": "The transformation had limits.", "evidence": ["survival of established churches", "continued hierarchy"], "analysis": "Use continuity to refine the argument."},
                        "complexity": "Earn sophistication by comparing the Great Awakening to the Enlightenment as another challenge to authority, but from a different direction."
                    },
                    "scoringRubric": {
                        "thesis": "1 point - make a defensible argument about the Awakening's impact.",
                        "contextualization": "1 point - situate the movement in colonial religious and intellectual life.",
                        "evidence": "2 points - use specific revival figures and outcomes.",
                        "analysis": "2 points - demonstrate change over time and limits.",
                        "complexity": "1 point - compare revival with other trends or weigh change against continuity."
                    }
                },
            ],
            "dbq": [
                {
                    "id": "dbq-001",
                    "prompt": "Evaluate the extent to which ideas of freedom expanded in the British colonies in the period from 1700 to 1763.",
                    "documents": [
                        {"docNumber": 1, "title": "Colonial writer on English liberty", "source": "British American political essay, early eighteenth century", "excerpt": "The inhabitants of these colonies, being Englishmen, are entitled to the rights and privileges of English subjects, and no governor may lawfully trample those liberties for his own will.", "happ": {"historicalSituation": "Colonists increasingly defended assemblies and local rights within the empire.", "audience": "The intended audience included politically engaged colonial readers.", "purpose": "The author wanted to defend colonial constitutional liberties.", "pointOfView": "The writer spoke from the perspective of colonists who claimed rights while ignoring excluded groups."}},
                        {"docNumber": 2, "title": "Zenger defense", "source": "Andrew Hamilton at the Zenger trial, 1735", "excerpt": "It is not the cause of one poor printer, nor of New York alone, but the cause of liberty itself, for the liberty both of exposing and opposing arbitrary power by speaking and writing truth.", "happ": {"historicalSituation": "The Zenger case emerged from conflict with a royal governor and a growing print culture.", "audience": "Hamilton addressed the jury and a wider public interested in political liberty.", "purpose": "He wanted acquittal and a broader defense of criticism of power.", "pointOfView": "As a defense lawyer, he framed the case as a fight against arbitrary rule."}},
                        {"docNumber": 3, "title": "George Whitefield on conversion", "source": "Whitefield sermon, 1740s", "excerpt": "You must be born again, and no outward forms of religion will save you. The poorest hearer may come to Christ as surely as the greatest man in the colony.", "happ": {"historicalSituation": "Revival preachers challenged established churches during the Great Awakening.", "audience": "The audience was mass colonial crowds and printed readers.", "purpose": "Whitefield sought conversion and spiritual renewal.", "pointOfView": "As an evangelical itinerant, he emphasized inward experience over traditional authority."}},
                        {"docNumber": 4, "title": "South Carolina slave law", "source": "Colonial statute after slave unrest", "excerpt": "No slave shall leave the plantation without written leave, nor shall any slave assemble in numbers, carry arms, or learn to write without the permission of the master.", "happ": {"historicalSituation": "Slaveholders tightened control after resistance and amid fear of rebellion.", "audience": "The law was aimed at magistrates, planters, and slave patrols.", "purpose": "Its purpose was to preserve racial order and prevent resistance.", "pointOfView": "The statute reflects the priorities of a slaveholding elite, not any universal notion of liberty."}},
                        {"docNumber": 5, "title": "Albany Plan cartoon and discussion", "source": "Benjamin Franklin and colonial union debates, 1754", "excerpt": "It is proposed that the colonies may be joined for their common defense, for if they remain divided they may all be undone. Union alone can preserve their liberties and safety.", "happ": {"historicalSituation": "Imperial war and Native diplomacy pushed colonists to consider greater cooperation.", "audience": "The intended audience included colonial readers and political leaders.", "purpose": "The author wanted to encourage cooperation among the colonies.", "pointOfView": "Franklin saw union as a practical necessity and as a way to defend British colonial interests."}}
                    ],
                    "thesisExample": "Between 1700 and 1763, ideas of freedom expanded in the British colonies through a broader public sphere, greater participation in political debate, and revival movements that challenged authority; however, those ideas remained sharply limited because enslaved Africans, Native peoples, and many women were excluded from the liberties colonists increasingly celebrated.",
                    "outlineScaffold": {
                        "contextualization": "Explain the growth of colonial assemblies, commercial society, and rights language after the Glorious Revolution.",
                        "bodyParagraph1": {"claim": "Political debate and the public sphere widened colonial freedom for many white colonists.", "documentsUsed": [1, 2], "outsideEvidence": "newspapers or assemblies", "happ": "Use the audience and purpose of political writing and Zenger's defense."},
                        "bodyParagraph2": {"claim": "Religious revival expanded challenges to established authority.", "documentsUsed": [3], "outsideEvidence": "Great Awakening or New Lights", "happ": "Use Whitefield's purpose and point of view."},
                        "bodyParagraph3": {"claim": "Freedom remained limited and exclusionary.", "documentsUsed": [4, 5], "outsideEvidence": "Stono Rebellion or slavery", "happ": "Use slave law to expose the boundaries of liberty and Albany debate to show who was included in political freedom."},
                        "complexity": "Earn complexity by arguing that colonial freedom expanded most clearly for white men while becoming more sharply denied to enslaved people and Native peoples."
                    }
                }
            ],
        },
        "mcqFacts": [
            fact("British liberty in the colonies", "Many colonists believed they enjoyed broad self-government and the rights of Englishmen within the empire.", THEME["pol"], "Colonial political confidence before 1763 is essential context for later resistance."),
            fact("salutary neglect", "Loose imperial enforcement allowed colonies to grow accustomed to local autonomy and practical self-direction.", THEME["pol"], "This explains why postwar reforms felt like a sudden break."),
            fact("the Atlantic economy", "The mainland colonies were deeply tied to a wider imperial system linking Africa, the Caribbean, Europe, and North America.", THEME["wor"], "The colonies were part of an Atlantic world, not isolated provincial societies."),
            fact("plantation slavery", "Colonial prosperity in the South depended heavily on enslaved African labor.", THEME["wxt"], "Slavery is central, not peripheral, to the eighteenth-century colonies."),
            fact("northern complicity in slavery", "Northern merchants and consumers also benefited from the Atlantic slave economy even when slavery was regionally concentrated.", THEME["wxt"], "This fact prevents students from treating slavery as only a southern story."),
            fact("slave resistance", "Enslaved people resisted through rebellion, flight, sabotage, and the preservation of family and culture.", THEME["nat"], "Resistance demonstrates enslaved agency and helps explain harsher slave law."),
            fact("Stono Rebellion", "Open rebellion by enslaved people intensified white fear and surveillance in South Carolina.", THEME["pol"], "Stono is a major example of the political consequences of resistance."),
            fact("the public sphere", "Newspapers, taverns, and pamphlets expanded colonial political discussion beyond officeholders.", THEME["cul"], "The public sphere helped create the culture of later resistance."),
            fact("the Zenger trial", "The Zenger case symbolized the legitimacy of criticizing arbitrary power in print.", THEME["pol"], "It is a classic APUSH example of the widening colonial public sphere."),
            fact("Benjamin Franklin", "Franklin embodied the combination of print culture, civic improvement, and practical Enlightenment thought.", THEME["cul"], "He is a key bridge figure between ideas and public life."),
            fact("the Great Awakening", "Revival religion challenged established churches and encouraged ordinary people to question authority.", THEME["cul"], "The Awakening is often tested as an early movement of democratization."),
            fact("George Whitefield", "Whitefield's tours turned revival into a mass intercolonial event.", THEME["wor"], "He is essential for understanding the scale of the Great Awakening."),
            fact("Jonathan Edwards", "Edwards represented the emotional and theological power of revival preaching.", THEME["cul"], "His sermons are common APUSH primary-source material."),
            fact("the Enlightenment", "Reason, science, and civic improvement shaped elite and urban colonial culture.", THEME["cul"], "The Enlightenment is often compared with the Great Awakening."),
            fact("the Albany Congress", "Colonial leaders began discussing union and shared defense before the Revolution.", THEME["pol"], "Albany is an important prehistory of intercolonial cooperation."),
            fact("the French and Indian War", "The war grew from imperial rivalry in the Ohio Valley and became a global struggle.", THEME["wor"], "This is the major turning point that leads into the imperial crisis."),
            fact("the Treaty of Paris of 1763", "British victory removed France from mainland North America but created new imperial burdens and expectations.", THEME["wor"], "The treaty is a core turning point between colonial war and revolutionary crisis."),
            fact("Pontiac's Rebellion", "Native leaders resisted British postwar power and forced the empire to reconsider westward settlement.", THEME["wor"], "Native resistance still shaped imperial policy after British victory."),
            fact("the Proclamation of 1763", "Britain limited westward settlement to control costs and conflict, angering colonists who wanted land.", THEME["geo"], "The proclamation is a direct bridge to the Revolution."),
            fact("freedom and slavery", "Colonial liberty expanded for many white colonists even as slavery deepened and racial hierarchy hardened.", THEME["nat"], "This contradiction is one of the most important interpretive themes in APUSH."),
        ],
        "textStimuli": [
            {"text": "It is not the cause of one poor printer, but the cause of liberty itself, of exposing arbitrary power by speaking and writing truth.", "caption": "Zenger defense"},
            {"text": "You must be born again, and the poorest hearer may come to Christ as surely as the greatest man in the colony.", "caption": "Whitefield and revival equality"},
            {"text": "No slave shall leave the plantation without written leave, nor assemble in numbers, nor carry arms.", "caption": "Slave control law"},
            {"text": "Union alone can preserve our liberties and our safety in the face of a common danger.", "caption": "Albany and colonial union"},
        ],
        "conceptCards": [
            {"type": "Comparison", "front": "Great Awakening vs. Enlightenment", "back": "The Great Awakening challenged authority through emotional revival and personal conversion, while the Enlightenment challenged authority through reason, science, and skepticism of tradition. APUSH often asks students to compare both movements as different routes to questioning hierarchy.", "hint": "Emotion versus reason, but both challenge authority.", "difficulty": "Hard"},
            {"type": "Concept", "front": "Why does 1763 matter so much?", "back": "Britain won the Seven Years' War in 1763, but victory brought debt, Native resistance, and the need for tighter imperial control. Those consequences pushed the empire toward the crisis that became the American Revolution.", "hint": "Victory creates problems.", "difficulty": "Medium"},
            {"type": "Cause-Effect", "front": "Why did the Great Awakening matter politically?", "back": "Revival religion taught colonists to challenge established authority, participate emotionally in public events, and think in intercolonial terms. Those habits later made mass political mobilization easier.", "hint": "Religious movement, political consequences.", "difficulty": "Medium"},
            {"type": "Document", "front": "Stono Rebellion", "back": "The Stono Rebellion was a 1739 uprising by enslaved people in South Carolina. It mattered because it showed enslaved resistance and led to harsher slave laws and surveillance.", "hint": "Resistance changes law.", "difficulty": "Easy"},
        ],
    }
)


chapter_specs.append(
    {
        "chapterId": "chapter5",
        "chapterNum": 5,
        "chapterOrder": 5,
        "periodId": "p3",
        "periodNumber": 3,
        "chapterMeta": {
            "period": "Period 3",
            "periodId": "p3",
            "dateRange": "1754-1800",
            "apExamWeight": "10-17%",
            "chapterTitle": "The American Revolution, 1763-1783",
            "chapterSubtitle": "Imperial reform, resistance, independence, and war",
            "bigPictureThemes": [THEME["pol"], THEME["nat"], THEME["wor"], THEME["cul"]],
            "oneLineSummary": "The American Revolution emerged when British attempts to tighten imperial control after 1763 collided with colonial ideas of rights, political participation, and continental ambition, turning a dispute within the empire into a war for independence.",
            "periodContext": "Period 3 begins with the Seven Years' War, which transformed the empire Britain ruled and the expectations its colonists held. Chapter 5 tracks the movement from protest to independence by showing how taxation, western policy, popular mobilization, and wartime diplomacy turned colonists from aggrieved subjects into revolutionaries.",
            "examTips": [
                "AP questions often ask whether the Revolution was caused more by ideology or by imperial reform; strong answers explain how those two forces interacted.",
                "Do not jump from the Stamp Act to independence. The exam rewards chronology: resistance escalated through repeated crises and only gradually became revolutionary.",
                "Saratoga and the French alliance are often more historically important than individual battlefield details because they explain why the colonies actually won.",
            ],
        },
        "images": [
            image(5, "ch05co01", "jpg", "The imperial crisis after 1763 became a mass political struggle rather than a narrow legal dispute.", "This opening image matters because the Revolution developed through public action, crowd politics, and popular persuasion as well as elite theory.", [THEME["pol"], THEME["cul"]], category="Painting"),
            image(5, "ch05ph05", "jpg", "Resistance to the Stamp Act showed colonists learning to organize boycotts, petitions, and street protest.", "The image is important because it captures how imperial taxation became a colonial political education.", [THEME["pol"], THEME["wxt"]], category="Political Cartoon"),
            image(5, "ch05ph07", "jpg", "Crowd actions such as the destruction of stamped paper or effigies turned constitutional grievance into popular resistance.", "This visual matters because the Revolution was not only debated in pamphlets; it was enacted in streets, ports, and public rituals.", [THEME["cul"], THEME["pol"]], category="Engraving"),
            image(5, "ch05ph14", "jpg", "The destruction of tea symbolized the refusal to accept Parliament's authority to tax and regulate without colonial consent.", "This image is AP-important because the Boston Tea Party became the clearest visual of direct action against imperial rule.", [THEME["pol"], THEME["wxt"]], category="Engraving"),
            image(5, "ch05ph15", "png", "Thomas Paine's Common Sense made independence understandable and urgent to a mass audience.", "The image matters because Paine turned abstract grievances into a broad popular argument for complete separation.", [THEME["cul"], THEME["nat"]], category="Pamphlet"),
            image(5, "ch05map01", "png", "The map of the imperial crisis and early war shows where protest, occupation, and fighting concentrated in British America.", "This map helps students connect resistance to specific places such as Boston, Philadelphia, New York, and the middle colonies.", [THEME["geo"], THEME["pol"]], category="Map"),
            image(5, "ch05map02", "png", "The Revolutionary War map reveals why the conflict was continental and international rather than a series of isolated local battles.", "This image matters because APUSH often tests strategy, alliance, and geography rather than battlefield memorization alone.", [THEME["wor"], THEME["geo"]], category="Map"),
            image(5, "ch05ph19", "jpg", "The Declaration of Independence transformed resistance into a claim of sovereignty grounded in natural rights.", "The image is useful because it marks the shift from protest against policy to the creation of a new nation.", [THEME["nat"], THEME["pol"]], category="Painting"),
            image(5, "ch05ph24", "jpg", "Yorktown symbolized the military and diplomatic success that made independence real.", "This image matters because battlefield victory depended on French aid and imperial overextension, not on colonial force alone.", [THEME["wor"], THEME["pol"]], category="Battle Scene"),
            image(5, "ch05map03", "png", "The peace settlement map shows how American independence also remade the continent's political geography.", "This map is important because the Revolution ended not just with recognition of independence but with vast western claims that shaped the new republic.", [THEME["geo"], THEME["wor"]], category="Map"),
        ],
        "notes": {
            "historicalContext": {
                "overview": "The British triumph in 1763 left Parliament with new debts, larger territories, and stronger reasons to supervise the colonies more closely. Colonists, however, expected security, western land, and continued self-government after helping win the war. The resulting conflict was not immediate independence but a long argument over taxation, sovereignty, and the meaning of representation. Over two decades, repeated crises radicalized colonial politics until resistance to particular acts became a struggle over who had the right to rule America at all.",
                "precedingCauses": [
                    "The Seven Years' War removed France from most of mainland North America and transformed imperial geography.",
                    "Britain's war debt encouraged efforts to raise revenue and tighten colonial administration.",
                    "Colonists were accustomed to assemblies, salutary neglect, and the language of the rights of Englishmen.",
                    "Print culture, revival religion, and crowd politics had already widened political participation in the colonies.",
                    "The Proclamation of 1763 signaled that imperial victory might limit rather than reward colonial ambition.",
                ],
                "geographicContext": "The Revolution was shaped by Atlantic ports, imperial trade routes, frontier land hunger, and regional differences among New England, the middle colonies, and the South. Geography also mattered militarily because control of cities, river systems, and the Atlantic coast influenced both strategy and foreign aid.",
                "contextImage": {"imageId": "ch05map01", "displayCaption": "The Revolution unfolded across seaports, backcountry settlements, and an Atlantic world of trade and war."},
            },
            "sections": [
                note_section(
                    "The Crisis Begins: Revenue, Representation, and Protest",
                    [THEME["pol"], THEME["nat"], THEME["wxt"]],
                    "Britain's first postwar reforms triggered colonial alarm because they threatened established habits of autonomy. The Sugar Act aimed to raise revenue more efficiently, while the Stamp Act placed a direct internal tax on printed materials used widely in colonial life. Colonists did not object simply because they disliked taxes; they objected because they believed taxation without representation violated the rights of English subjects. Protests took many forms, including petitions, mob action, nonimportation, and the Stamp Act Congress. British officials often underestimated how much political culture in the colonies had already matured. The crisis mattered because it taught colonists to coordinate resistance across regions and social classes.",
                    ["British debt after the Seven Years' War", "Parliament's belief that colonists should help pay imperial costs", "Colonial expectations of self-taxation through assemblies"],
                    ["Intercolonial resistance grew", "Popular protest radicalized politics", "Britain learned that reform would meet organized opposition"],
                    "This section matters because it marks the shift from local grievance to a broad imperial constitutional conflict.",
                    ["Connects to earlier mercantilist regulation, but the new issue was enforcement and revenue rather than trade theory alone.", "Foreshadows later debates over sovereignty and independence."],
                    key_figures=[
                        figure("George Grenville", "British prime minister", "Grenville promoted postwar revenue measures such as the Sugar Act and Stamp Act. He believed the colonies should help pay for their own defense within the empire.", "He matters because imperial reform after 1763 was not random; it reflected real British fiscal and administrative concerns.", "He represented the British imperial reform perspective."),
                        figure("Samuel Adams", "Massachusetts resistance leader", "Adams helped mobilize opposition in Boston and linked local protest to wider arguments about constitutional rights. He became one of the most visible popular leaders of resistance.", "He matters because the Revolution depended on sustained political organization as much as on battlefield leadership.", "He represented radical colonial opposition."),
                    ],
                    primary_sources=["Stamp Act Congress declarations", "Virginia Resolves", "Nonimportation agreements"],
                    section_images=[
                        {"imageId": "ch05ph05", "displayCaption": "Resistance to the Stamp Act turned legal theory into organized political action."},
                        {"imageId": "ch05ph07", "placement": "after-key-figures", "displayCaption": "Street protest and crowd politics became essential parts of the imperial debate."},
                    ],
                ),
                note_section(
                    "From Townshend to Tea: Escalation of the Imperial Crisis",
                    [THEME["pol"], THEME["cul"], THEME["wxt"]],
                    "Repeal of the Stamp Act did not resolve the underlying issue because Parliament immediately asserted the Declaratory Act's claim to legislate for the colonies 'in all cases whatsoever.' Townshend duties, customs enforcement, the quartering of troops, and the Boston Massacre all deepened mistrust. The Tea Act then created an especially potent symbol by combining cheap tea with a constitutional trap: buying the tea would concede Parliament's taxing authority. The Boston Tea Party answered that trap with dramatic defiance, and Britain's Coercive Acts answered in turn with punishment. Each cycle narrowed the space for compromise. By 1774, many colonists feared not just taxation but a deliberate British project to destroy self-government in America.",
                    ["Parliament's continued claim of authority", "Colonial suspicion of standing armies and customs enforcement", "Imperial determination to discipline Massachusetts"],
                    ["Boston became the center of crisis", "Colonial solidarity widened", "Moderate resistance moved closer to rebellion"],
                    "This section matters because the Road to Revolution was a process of repeated escalation, not a single spark.",
                    ["Connects to the growth of the public sphere and political symbolism discussed in Chapter 4.", "Prepares the move from resistance to continental organization."],
                    key_figures=[
                        figure("John Hancock", "Merchant and patriot leader", "Hancock's wealth, smuggling connections, and public prominence made him a major figure in colonial resistance. He helped demonstrate how merchants and popular protest could align.", "He matters because imperial enforcement threatened economic interests as well as constitutional principles.", "He represented merchant patriotism and urban protest."),
                    ],
                    primary_sources=["Declaratory Act", "Townshend Acts", "Boston Massacre engravings", "Coercive Acts"],
                    section_images=[{"imageId": "ch05ph14", "displayCaption": "The Boston Tea Party was a turning point because it rejected Parliament's authority in action, not only in words."}],
                ),
                note_section(
                    "Continental Resistance and the Debate Over Independence",
                    [THEME["pol"], THEME["nat"], THEME["cul"]],
                    "The First Continental Congress showed that colonial leaders were now prepared to coordinate formally across imperial boundaries, but most still hoped for restoration rather than separation. Fighting at Lexington and Concord, however, made neutrality harder to sustain. The Second Continental Congress took on the powers of national government even while many delegates still spoke the language of reconciliation. Thomas Paine's Common Sense changed the political landscape by arguing that monarchy itself was absurd and that independence was both necessary and natural. The debate shifted from whether Parliament had exceeded its authority to whether any distant power should rule America. This was the crucial ideological transition of 1775 and 1776.",
                    ["British coercion after the Tea Party", "Intercolonial cooperation through the Continental Congresses", "Outbreak of fighting in Massachusetts"],
                    ["Continental institutions gained authority", "Support for independence grew rapidly", "Monarchy itself became a target of criticism"],
                    "This section matters because APUSH often asks how protest within the empire became a movement for full independence.",
                    ["Connects to Enlightenment and rights language from earlier chapters.", "Prepares the Declaration of Independence as both a political and ideological document."],
                    key_figures=[
                        figure("Thomas Paine", "Pamphleteer and radical writer", "Paine's Common Sense sold widely and made the case for independence in direct, accessible language. He attacked monarchy and urged ordinary colonists to imagine a republican future.", "He matters because he translated elite ideas into mass political persuasion.", "He represented radical democratic nationalism.", "ch05ph15"),
                        figure("John Adams", "Delegate and independence advocate", "Adams pushed Congress toward stronger resistance, supported independence, and later helped shape diplomacy and constitutional thought. He represented the determined patriot side of the continental debate.", "He matters because independence required persistent leadership inside Congress, not only events outside it.", "He represented committed revolutionary republicanism."),
                    ],
                    primary_sources=["Olive Branch Petition", "Common Sense", "Proceedings of the Continental Congress"],
                    section_images=[
                        {"imageId": "ch05ph15", "displayCaption": "Common Sense convinced many colonists that independence was politically possible and morally necessary."},
                        {"imageId": "ch05map01", "placement": "after-key-figures", "displayCaption": "Resistance became continental as protests, congresses, and fighting spread beyond Boston."},
                    ],
                ),
                note_section(
                    "The Declaration and Revolutionary Ideology",
                    [THEME["nat"], THEME["pol"], THEME["cul"]],
                    "The Declaration of Independence was more than a break-up letter to the king. It grounded American sovereignty in natural rights, popular consent, and the right of revolution against tyrannical government. Thomas Jefferson's language drew on Enlightenment ideas and older British political traditions, but the document also served immediate practical purposes by justifying alliance and war. At the same time, its universal claims created long-term contradictions because they did not match the actual status of women, enslaved people, Native peoples, or many poor men. APUSH often asks students to connect the Declaration both to revolutionary ideology and to the unfinished struggle over equality in later periods. It was a statement of principles with consequences far beyond 1776.",
                    ["Need to justify separation", "Growth of support for independence", "Influence of natural-rights theory and colonial grievance"],
                    ["United States claimed sovereignty", "Universal language of rights entered national politics", "Future reform movements gained a powerful reference point"],
                    "This section matters because the Declaration became the most enduring articulation of American political ideals, even when reality contradicted those ideals.",
                    ["Connects to Chapter 6, where the Revolution's promises are tested against slavery, gender inequality, and limited democracy.", "Echoes earlier colonial language of rights while radicalizing it into a doctrine of independence."],
                    key_figures=[
                        figure("Thomas Jefferson", "Principal drafter of the Declaration", "Jefferson drafted the Declaration's most famous language about equality, rights, and government by consent. His words became central to American political identity.", "He matters because APUSH treats the Declaration as both an ideological milestone and a document of contradiction.", "He represented Enlightenment-influenced republicanism."),
                    ],
                    primary_sources=["Declaration of Independence"],
                    section_images=[{"imageId": "ch05ph19", "displayCaption": "The Declaration transformed colonial resistance into a public claim that a new nation already existed."}],
                ),
                note_section(
                    "Securing Independence: War, Strategy, and Alliance",
                    [THEME["wor"], THEME["pol"], THEME["geo"]],
                    "Winning independence was far harder than declaring it. Britain had stronger finances, a larger navy, and the ability to seize major cities, while the Americans faced shortages, inflation, weak central coordination, and deep internal division. George Washington's greatest strength was often strategic endurance: keeping the Continental Army alive long enough for Britain's costs to rise and colonial resistance to survive. The Saratoga victory mattered enormously because it convinced France to enter the war formally in 1778. French money, arms, naval power, and eventually troops turned a colonial rebellion into an international war Britain could no longer contain easily. This is one of the most important APUSH causation chains in the entire period.",
                    ["British determination to discipline the colonies", "American willingness to sustain a long war", "Need for foreign alliance to offset British strength"],
                    ["Continental Army survived", "France entered the war", "The Revolution became global and more winnable"],
                    "This section matters because military history on the AP exam usually matters most when it explains diplomatic turning points and the outcome of the war.",
                    ["Connects to imperial rivalry themes from Chapter 4.", "Foreshadows the diplomatic challenges of the early republic after independence."],
                    key_figures=[
                        figure("George Washington", "Commander of the Continental Army", "Washington held the Continental Army together through defeats, shortages, and strategic retreat. His leadership made survival possible until foreign aid and British exhaustion shifted the balance.", "He matters because independence required political endurance as much as battlefield brilliance.", "He represented revolutionary leadership and republican military discipline."),
                        figure("Benjamin Franklin", "Diplomat in France", "Franklin secured French support by convincing the French monarchy that the American cause was viable and useful. His diplomacy was as important as many battlefield victories.", "He matters because Saratoga only mattered fully once it produced alliance and resources.", "He represented pragmatic revolutionary diplomacy."),
                    ],
                    primary_sources=["Saratoga accounts", "Treaty of Alliance with France", "Washington's wartime letters"],
                    section_images=[{"imageId": "ch05map02", "displayCaption": "The war was continental and Atlantic at once, and its outcome depended heavily on alliance and geography."}],
                ),
                note_section(
                    "Yorktown, Peace, and the Meaning of Victory",
                    [THEME["wor"], THEME["pol"], THEME["geo"]],
                    "Yorktown in 1781 did not end all fighting immediately, but it destroyed Britain's political will to continue the war on the same scale. The Franco-American siege forced Cornwallis's surrender and confirmed that French naval support was decisive. The 1783 Treaty of Paris recognized American independence and granted the United States expansive boundaries to the Mississippi River. Yet the peace settlement did not solve everything: loyalists remained vulnerable, Native allies of Britain faced a more aggressive United States, and the new nation inherited huge internal challenges. Revolutionary victory therefore combined real geopolitical success with unresolved domestic contradictions. APUSH uses this ending to connect military triumph to the difficult work of nation-building.",
                    ["French alliance", "British overextension", "Successful American strategy of persistence"],
                    ["British war effort collapsed politically", "Independence recognized", "Vast western claims opened new conflicts"],
                    "This section matters because the Revolution ended by changing continental geography and imperial relationships, not just by transferring sovereignty.",
                    ["Links forward to Chapter 7 on the problems of the Confederation and the founding of a new government.", "Connects to Chapter 6 because the meaning of victory inside society remained contested."],
                    key_figures=[
                        figure("Comte de Rochambeau", "French general", "Rochambeau coordinated closely with Washington in the campaign that led to Yorktown. His role highlights the multinational character of American victory.", "He matters because APUSH often rewards students who remember that the Revolution was not won alone.", "He represented allied French military support."),
                        figure("Cornwallis", "British general at Yorktown", "Cornwallis commanded British forces trapped at Yorktown in 1781. His surrender became the symbolic military climax of the Revolution.", "He matters because Yorktown represented the failure of Britain's southern strategy.", "He represented British military commitment and ultimate strategic frustration."),
                    ],
                    primary_sources=["Treaty of Paris of 1783", "Yorktown surrender accounts"],
                    section_images=[
                        {"imageId": "ch05ph24", "displayCaption": "Yorktown symbolized how alliance, strategy, and imperial overreach made victory possible."},
                        {"imageId": "ch05map03", "placement": "after-significance", "displayCaption": "The peace settlement made the new United States geographically ambitious from the start."},
                    ],
                ),
            ],
            "overarchingAnalysis": {
                "continuity": "Colonists continued to use older British constitutional language even as they moved toward independence, and the Revolution still depended on exclusions rooted in class, race, gender, and Native dispossession. Empire changed form, but the struggle over who counted in the new polity remained unresolved.",
                "change": "The central change of 1763-1783 was the transformation of British colonists from imperial subjects into citizens of an independent republic. By the end of the war, sovereignty, diplomacy, and continental claims had all shifted dramatically.",
                "complexity": "A strong complexity point argues that the Revolution was both conservative and radical: conservative in defending inherited rights and local autonomy, but radical in rejecting monarchy and creating a republic based on popular sovereignty.",
                "comparisonAngles": [
                    "Compare the imperial crisis after 1763 with earlier colonial resistance after the Glorious Revolution in terms of rights language and escalating stakes.",
                    "Compare the ideology of the American Revolution to its social realities, especially regarding slavery and women in Chapter 6.",
                ],
            },
        },
        "periodTimeline": [
            event("chapter5", "p3", "chapter5-proclamation-1763", 1763, "Proclamation of 1763", "Britain restricted colonial settlement west of the Appalachians in 1763. The policy frustrated colonists who expected western land after victory over France.", "After Pontiac's Rebellion, British officials tried to stabilize the frontier and cut defense costs by restricting settlement west of the Appalachian line. The policy reflected imperial priorities of order and finance rather than colonial desires for expansion. Many colonists saw the proclamation as an unjust limitation on the fruits of victory. It therefore helped create the first sense that the postwar empire might constrain rather than reward them. The measure was hard to enforce, but politically it mattered. It marked an early widening gap between British and colonial expectations.", ["Political", "Geographic"], [THEME["pol"], THEME["geo"]], ["George III"], ["Pontiac's Rebellion", "Imperial need for frontier stability"], ["Colonial resentment increased", "Westward tension intensified"], ["chapter5-sugar-act"], "Medium", False, "Important starting context for the imperial crisis.", image_id="ch05map01"),
            event("chapter5", "p3", "chapter5-sugar-act", 1764, "Sugar Act", "Parliament passed the Sugar Act in 1764 to raise revenue and tighten customs enforcement. The act signaled a more intrusive postwar empire.", "The Sugar Act lowered the nominal duty on molasses but strengthened enforcement and vice-admiralty courts. British officials wanted revenue and compliance, not merely paper regulations ignored under salutary neglect. Colonists worried about both economic effects and constitutional implications. If Parliament could raise revenue for imperial purposes without colonial consent, local autonomy seemed endangered. The law therefore mattered more as a precedent than as an unbearable financial burden by itself. It taught colonists that post-1763 policy would be different in kind, not just degree.", ["Economic", "Political"], [THEME["wxt"], THEME["pol"]], ["George Grenville"], ["Postwar debt", "Desire for tighter imperial enforcement"], ["Revenue debate intensified", "Colonists grew wary of Parliament's intentions"], ["chapter5-stamp-act"], "Medium", False, "Useful for causation questions on the start of the imperial crisis."),
            event("chapter5", "p3", "chapter5-stamp-act", 1765, "Stamp Act", "The Stamp Act of 1765 imposed a direct tax on printed materials in the colonies. Colonial resistance turned the act into a major constitutional crisis.", "Unlike trade duties, the Stamp Act touched daily legal and commercial life throughout the colonies. Colonists argued that only their own elected assemblies could tax them. The law triggered petitions, pamphlets, boycotts, and crowd action led by groups such as the Sons of Liberty. Resistance was intense enough that the act became extremely difficult to enforce. The episode mattered because it transformed grievance into intercolonial mobilization. For APUSH, the Stamp Act is one of the clearest turning points from complaint to organized resistance.", ["Political", "Economic"], [THEME["pol"], THEME["nat"]], ["George Grenville", "Samuel Adams"], ["British revenue needs", "Parliamentary assertion of authority"], ["Colonial protest exploded", "Intercolonial cooperation expanded"], ["chapter5-stamp-act-congress"], "High", True, "One of the most important APUSH events in the coming of the Revolution.", image_id="ch05ph05"),
            event("chapter5", "p3", "chapter5-stamp-act-congress", 1765, "Stamp Act Congress", "Delegates from nine colonies met in 1765 to coordinate opposition to the Stamp Act. The congress was an early step toward continental political cooperation.", "Representatives gathered in New York and issued declarations affirming loyalty to the crown while denying Parliament's authority to tax the colonies internally. The meeting did not yet call for independence. It did, however, establish a precedent for intercolonial coordination and collective political language. The congress helped transform local protest into something broader and more durable. It also showed that colonial leaders were capable of formal cooperation when imperial pressure mounted. APUSH often treats it as a precursor to the Continental Congresses.", ["Political"], [THEME["pol"]], ["Colonial delegates"], ["Stamp Act crisis"], ["Continental coordination deepened", "Shared constitutional argument emerged"], [], "Medium", False, "Useful for tracing the growth of intercolonial unity."),
            event("chapter5", "p3", "chapter5-declaratory-act", 1766, "Stamp Act Repealed and Declaratory Act Passed", "Parliament repealed the Stamp Act in 1766 but simultaneously asserted its full authority to legislate for the colonies. The underlying constitutional conflict therefore remained unresolved.", "Merchants hurt by colonial boycotts helped push repeal of the Stamp Act. Yet Parliament did not want repeal to look like surrender, so it passed the Declaratory Act claiming authority over the colonies in all cases whatsoever. Colonists celebrated repeal but paid less attention to the broader assertion of sovereignty. In hindsight, the compromise was unstable because each side believed its principles remained intact. Britain believed it had preserved supremacy. Colonists believed resistance had worked. The contradiction would soon reappear.", ["Political"], [THEME["pol"]], ["Parliament"], ["Colonial resistance and British merchant pressure"], ["Immediate crisis eased", "Constitutional dispute persisted"], ["chapter5-townshend-acts"], "Medium", False, "Important evidence that repeal did not mean resolution."),
            event("chapter5", "p3", "chapter5-townshend-acts", 1767, "Townshend Acts", "Parliament imposed new duties and strengthened customs enforcement through the Townshend Acts in 1767. The measures reignited colonial resistance.", "Charles Townshend believed external duties on imported goods would be more acceptable than the Stamp Act. Instead, colonists saw the new duties as another effort to raise revenue without consent. Nonimportation movements revived, customs tensions increased, and British troops entered Boston. Colonial resistance became more disciplined and more ideological. The acts also broadened the social base of protest because consumers, merchants, and urban crowds all became involved. APUSH uses the Townshend crisis to show how quickly old constitutional wounds reopened.", ["Political", "Economic"], [THEME["pol"], THEME["wxt"]], ["Charles Townshend"], ["Declaratory sovereignty claim", "Need for imperial revenue"], ["Boycotts returned", "Military occupation increased tension"], ["chapter5-boston-massacre"], "Medium", False, "Useful for explaining escalation after the Stamp Act."),
            event("chapter5", "p3", "chapter5-boston-massacre", 1770, "Boston Massacre", "British soldiers killed five colonists in Boston in 1770 after a tense confrontation. Patriots turned the incident into powerful anti-British propaganda.", "Tensions in occupied Boston had been rising for months amid customs enforcement, unemployment, and political hostility. When a crowd confronted British soldiers, the soldiers fired into the crowd, killing five people including Crispus Attucks. Patriot leaders such as Paul Revere and Samuel Adams publicized the event as evidence of British tyranny. The Massacre mattered because political meaning exceeded the number of deaths. It sharpened fear of standing armies and imperial coercion. The event became one of the Revolution's most famous symbols.", ["Political", "Social"], [THEME["pol"], THEME["cul"]], ["Crispus Attucks", "Samuel Adams"], ["Townshend tensions", "British troops in Boston"], ["Anti-British sentiment intensified", "Patriot propaganda gained force"], [], "Medium", False, "Common APUSH evidence for propaganda and occupation politics."),
            event("chapter5", "p3", "chapter5-boston-tea-party", 1773, "Boston Tea Party", "Boston patriots destroyed East India Company tea in 1773 to reject Parliament's taxing authority. The event pushed Britain toward punishment and the colonies toward solidarity.", "The Tea Act actually lowered the price of tea, but patriots saw it as a trap designed to secure acceptance of parliamentary taxation. In December 1773, men disguised as Indians dumped tea into Boston Harbor. The action was dramatic, illegal, and highly symbolic. Britain responded with the Coercive Acts, especially targeting Massachusetts. The Tea Party mattered because it made compromise harder and convinced many British leaders that colonial disorder required discipline. It also became one of the most iconic moments of direct resistance in American memory.", ["Political", "Economic"], [THEME["pol"], THEME["nat"]], ["Sons of Liberty"], ["Tea Act", "Refusal to concede Parliament's authority"], ["Coercive Acts followed", "Colonial solidarity widened"], ["chapter5-first-continental-congress"], "High", True, "A classic APUSH turning point from resistance to crisis.", image_id="ch05ph14"),
            event("chapter5", "p3", "chapter5-first-continental-congress", 1774, "First Continental Congress", "Delegates from twelve colonies met in 1774 to coordinate resistance to the Coercive Acts. The congress marked a major step toward continental political unity.", "The congress gathered in Philadelphia and debated how far resistance should go. Most delegates still hoped for reconciliation, but they also endorsed a strong boycott and a rights-based protest against imperial overreach. The meeting mattered because it created a colonial body that could speak and act beyond any single assembly. It also forged working relationships among leaders from different regions. Even without declaring independence, the congress began to function as an alternative political center. APUSH often treats it as a crucial institutional bridge from protest to revolution.", ["Political"], [THEME["pol"], THEME["nat"]], ["Patrick Henry", "John Adams"], ["Coercive Acts", "Need for intercolonial response"], ["Continental organization deepened", "Boycott pressure increased"], ["chapter5-lexington-concord"], "Medium", False, "Important precursor to continental government."),
            event("chapter5", "p3", "chapter5-lexington-concord", 1775, "Lexington and Concord", "Fighting at Lexington and Concord in April 1775 began the Revolutionary War. Armed conflict made reconciliation far more difficult.", "British troops marched to seize colonial military supplies and possibly arrest patriot leaders. At Lexington and then Concord, militia resistance turned a coercive expedition into open war. The 'shot heard round the world' was historically small in scale but enormous in political consequence. Once blood had been shed, compromise became harder for moderates to defend. Militia from across New England then surrounded Boston. The war had begun before formal independence was declared.", ["Military"], [THEME["pol"], THEME["geo"]], ["British regulars", "Massachusetts militia"], ["Rising military preparation", "British attempt to enforce authority"], ["Open war began", "Continental mobilization accelerated"], ["chapter5-common-sense", "chapter5-declaration-independence"], "High", True, "One of the clearest APUSH turning points from protest to war.", image_id="ch05map01"),
            event("chapter5", "p3", "chapter5-second-continental-congress", 1775, "Second Continental Congress", "The Second Continental Congress met in 1775 and began acting as a national government. It organized the war effort even while still debating independence.", "Delegates appointed George Washington commander of the Continental Army and managed supplies, diplomacy, and political communication. At the same time, many members still sent the Olive Branch Petition in hope of reconciliation. The congress therefore embodied the transitional nature of 1775: war had begun, but independence was not yet unanimous. Its importance lies in institution-building. Colonists were learning to govern together before they formally announced separation. That experience would matter in every later phase of the Revolution.", ["Political"], [THEME["pol"]], ["George Washington", "John Dickinson"], ["Outbreak of war", "Need for coordinated leadership"], ["Continental institutions expanded", "Path toward national government opened"], [], "Medium", False, "Good evidence for the gradual creation of national authority."),
            event("chapter5", "p3", "chapter5-common-sense", 1776, "Common Sense Published", "Thomas Paine's Common Sense appeared in 1776 and powerfully argued for independence. The pamphlet helped turn anti-British anger into support for republican separation.", "Paine rejected monarchy as absurd and corrupt and argued that an island should not rule a continent. He wrote in clear language aimed at ordinary readers rather than only elites. Common Sense sold widely and shifted the tone of public debate. It mattered because it transformed independence from a radical possibility into a plausible mass position. The pamphlet also helped move criticism away from Parliament alone and toward the institution of monarchy itself. APUSH often uses it to explain how ideology spread beyond legislatures.", ["Cultural", "Political"], [THEME["cul"], THEME["nat"]], ["Thomas Paine"], ["War had begun", "Failure of reconciliation"], ["Support for independence surged", "Monarchy lost legitimacy"], ["chapter5-declaration-independence"], "High", True, "A major APUSH document for explaining the ideological move to independence.", image_id="ch05ph15"),
            event("chapter5", "p3", "chapter5-declaration-independence", 1776, "Declaration of Independence", "Congress adopted the Declaration of Independence on July 4, 1776. The document announced American sovereignty and justified revolution through natural-rights theory.", "The Declaration listed grievances against George III, asserted that governments derive power from the consent of the governed, and proclaimed that the colonies were free and independent states. Jefferson's language drew from Enlightenment thought and the tradition of resistance to tyranny. The document sought both domestic unity and foreign legitimacy. It mattered immediately because it turned rebellion into a war between states. It mattered long term because its universal claims became a powerful resource for later reformers. The Declaration is one of the foundational texts of American political identity.", ["Political"], [THEME["nat"], THEME["pol"]], ["Thomas Jefferson", "Continental Congress"], ["Support for independence", "Need to justify separation"], ["United States claimed sovereignty", "Natural-rights language became national creed"], ["chapter6-virginia-declaration-rights"], "High", True, "One of the most important documents in all of APUSH.", image_id="ch05ph19"),
            event("chapter5", "p3", "chapter5-saratoga", 1777, "Battle of Saratoga", "American victory at Saratoga in 1777 convinced France that the revolutionaries might actually win. The battle became the diplomatic turning point of the war.", "British strategy in 1777 aimed to isolate New England, but General Burgoyne's army was trapped and forced to surrender at Saratoga. The American victory was militarily important, but its greatest significance was diplomatic. France now saw the American cause as a worthwhile investment against Britain. The result was the 1778 Treaty of Alliance. APUSH often emphasizes Saratoga because it explains why a weak rebellion gained the resources needed to survive. Without France, the path to victory would have been far more difficult.", ["Military", "Diplomatic"], [THEME["wor"], THEME["pol"]], ["Horatio Gates", "John Burgoyne", "Benjamin Franklin"], ["British strategic miscalculation", "American resistance in the North"], ["French alliance became possible", "War globalized"], ["chapter5-french-alliance"], "High", True, "A decisive APUSH causation event because it led to foreign alliance.", image_id="ch05map02"),
            event("chapter5", "p3", "chapter5-french-alliance", 1778, "Treaty of Alliance with France", "France formally allied with the United States in 1778. The alliance transformed the Revolution into an international war and gave the Americans critical support.", "French aid had already been flowing quietly, but the formal alliance committed France openly against Britain. The Americans gained military supplies, loans, naval assistance, and international legitimacy. The alliance also meant Britain now had to fight on a broader global stage. French intervention greatly improved the chances of American victory. APUSH emphasizes the alliance because it shows that ideological commitment alone did not win independence. War and diplomacy were inseparable.", ["Diplomatic"], [THEME["wor"]], ["Benjamin Franklin", "Louis XVI"], ["Saratoga victory", "French desire to weaken Britain"], ["American war effort strengthened", "Conflict became global"], ["chapter5-yorktown"], "Medium", False, "Essential supporting evidence for how the colonies won the war."),
            event("chapter5", "p3", "chapter5-yorktown", 1781, "Yorktown", "Combined American and French forces trapped Cornwallis at Yorktown in 1781 and forced his surrender. The victory broke Britain's will to continue the war on the same terms.", "Washington, Rochambeau, and the French fleet coordinated to isolate British forces in Virginia. Cornwallis's surrender did not instantly end all fighting, but it destroyed support in Britain for continuing a costly war. Yorktown mattered because it showed the decisive value of alliance, naval power, and strategic coordination. The battle was the military climax of the Revolution. It also elevated the political urgency of peace negotiations. For APUSH, Yorktown is the strongest battlefield endpoint of the war.", ["Military"], [THEME["wor"], THEME["pol"]], ["George Washington", "Cornwallis", "Rochambeau"], ["French alliance", "British southern strategy overextension"], ["British political support for war collapsed", "Peace negotiations intensified"], ["chapter5-treaty-paris-1783"], "High", True, "A major APUSH culmination event for the Revolutionary War.", image_id="ch05ph24"),
            event("chapter5", "p3", "chapter5-treaty-paris-1783", 1783, "Treaty of Paris", "The Treaty of Paris of 1783 recognized American independence and granted the United States expansive western boundaries. The treaty confirmed that the colonies had become a sovereign republic.", "American diplomats negotiated directly with Britain and secured surprisingly generous territorial terms extending to the Mississippi River. The treaty recognized the new nation's independence but left many questions unresolved, including the fate of loyalists and Britain's continued presence at western forts. Native peoples were excluded from the negotiations despite being deeply affected by the outcome. The peace settlement therefore brought both triumph and future conflict. APUSH treats the treaty as the geopolitical conclusion of the Revolution and the beginning of the next chapter's nation-building challenges. Independence was secured, but not stabilized.", ["Diplomatic"], [THEME["wor"], THEME["geo"]], ["John Jay", "Benjamin Franklin", "John Adams"], ["Yorktown", "British willingness to negotiate"], ["Independence recognized", "Continental expansion promised new conflict"], ["chapter7-shayss-rebellion"], "Medium", False, "Important endpoint and bridge to the Confederation era.", image_id="ch05map03"),
        ],
        "overallTimelineEvents": [
            overall_event("chapter5-stamp-act", 1765, "Stamp Act", "Direct parliamentary taxation turns postwar tension into a colony-wide constitutional crisis.", 3, "This belongs on the master timeline because it marks the first major burst of coordinated resistance to British imperial reform.", ["Political"]),
            overall_event("chapter5-boston-tea-party", 1773, "Boston Tea Party", "Colonial direct action pushes the crisis into a new and more punitive phase.", 3, "It matters because it triggered the Coercive Acts and widened colonial solidarity.", ["Political"]),
            overall_event("chapter5-lexington-concord", 1775, "Lexington and Concord", "Open fighting begins between Britain and the colonies.", 3, "This is a master timeline event because it marks the move from protest to war.", ["Military"]),
            overall_event("chapter5-declaration-independence", 1776, "Declaration of Independence", "The colonies announce sovereignty based on natural rights and consent.", 3, "This belongs on the master timeline because it defines the ideological core of the American Revolution.", ["Political"]),
            overall_event("chapter5-yorktown", 1781, "Yorktown", "Franco-American victory forces the British war effort toward collapse and peace.", 3, "It matters because it is the decisive military climax of the Revolution.", ["Military"]),
        ],
        "vocabulary": [
            vocab("Sugar Act", "A 1764 law that aimed to raise revenue and tighten customs enforcement in the colonies.", "Colonists saw the Sugar Act as an alarming sign that Britain would enforce imperial rules more aggressively.", "It often appears in APUSH as the first major postwar revenue act."),
            vocab("Stamp Act", "A 1765 tax on printed materials in the colonies.", "The Stamp Act produced protests that turned constitutional grievance into intercolonial resistance.", "It is one of the most important APUSH laws of the pre-Revolutionary era."),
            vocab("virtual representation", "The British argument that Parliament represented all subjects in the empire whether they voted for members or not.", "Colonists rejected virtual representation and insisted on their own assemblies' taxing authority.", "The term appears frequently in causation questions about the Revolution."),
            vocab("Sons of Liberty", "A resistance group that organized protests against British taxation and imperial measures.", "The Sons of Liberty helped mobilize both crowd action and political messaging.", "They are common APUSH evidence for popular protest."),
            vocab("Stamp Act Congress", "The 1765 meeting of delegates from nine colonies to coordinate opposition to the Stamp Act.", "The congress helped create a shared colonial constitutional argument.", "It is important for tracing the growth of intercolonial cooperation."),
            vocab("Declaratory Act", "A 1766 act asserting Parliament's authority to legislate for the colonies in all cases whatsoever.", "Although the Stamp Act was repealed, the Declaratory Act kept the sovereignty conflict alive.", "It helps explain why repeal did not settle the crisis."),
            vocab("Townshend Acts", "A set of 1767 duties and enforcement measures that reignited colonial resistance.", "The Townshend Acts led to renewed boycotts and military tension in Boston.", "They are a standard APUSH step in the Road to Revolution."),
            vocab("Boston Massacre", "The 1770 killing of five colonists by British soldiers in Boston.", "Patriot propaganda turned the Boston Massacre into a symbol of British tyranny.", "This term often appears in stimulus-based questions."),
            vocab("Tea Act", "A 1773 law aiding the East India Company while preserving Parliament's right to tax tea in the colonies.", "Cheap tea did not calm colonists because the constitutional principle still mattered.", "It is important background for the Boston Tea Party."),
            vocab("Boston Tea Party", "The 1773 destruction of East India Company tea by Boston patriots.", "The Tea Party triggered the Coercive Acts and intensified the imperial crisis.", "It is one of the most iconic APUSH events before independence."),
            vocab("Coercive Acts", "The punitive British laws passed after the Boston Tea Party, known in the colonies as the Intolerable Acts.", "The Coercive Acts convinced many colonists that British power threatened all colonial self-government.", "They are central to explanations of intercolonial unity."),
            vocab("First Continental Congress", "The 1774 colonial meeting that coordinated resistance to British policy.", "It marked a major step toward continental political cooperation.", "It is crucial in APUSH for tracing the development of national institutions."),
            vocab("minutemen", "Colonial militia members expected to be ready to fight on short notice.", "Minutemen were central to the opening clashes at Lexington and Concord.", "The term appears in questions about the outbreak of the war."),
            vocab("Common Sense", "Thomas Paine's 1776 pamphlet arguing for independence and attacking monarchy.", "Common Sense pushed many colonists toward supporting full separation from Britain.", "It is a key APUSH document for the ideological move to independence."),
            vocab("Declaration of Independence", "The 1776 document announcing American sovereignty and justifying revolution through natural rights and popular consent.", "The Declaration turned resistance into a claim of national independence.", "It is one of the most important texts in APUSH."),
            vocab("natural rights", "The Enlightenment idea that people possess fundamental rights such as life, liberty, and property or the pursuit of happiness.", "Natural-rights language gave the Revolution universal ideological force.", "It frequently appears in questions on revolutionary thought."),
            vocab("republicanism", "The political belief that government should be based on virtue, representation, and the common good rather than monarchy.", "Revolutionary leaders increasingly imagined the United States as a republic rather than a monarchy.", "Republicanism is a key APUSH concept across Period 3."),
            vocab("loyalist", "An American colonist who remained loyal to Britain during the Revolution.", "Loyalists remind students that the colonies were deeply divided during the war.", "The term often appears in questions on wartime society."),
            vocab("patriot", "An American who supported resistance and eventually independence from Britain.", "Patriots ranged from moderate critics of policy to committed revolutionaries.", "The term helps identify political alignments in the Revolution."),
            vocab("Saratoga", "The 1777 American victory that helped convince France to ally with the United States.", "Saratoga was the war's major diplomatic turning point.", "It is a standard APUSH battle because of its strategic consequences."),
            vocab("Treaty of Alliance", "The 1778 agreement between France and the United States.", "French aid transformed the Revolution into a winnable international war.", "The alliance is crucial evidence for explaining American victory."),
            vocab("Yorktown", "The 1781 British surrender that marked the military climax of the Revolution.", "Yorktown showed the importance of French naval and military assistance.", "It is one of the core APUSH endpoints of the war."),
            vocab("Treaty of Paris 1783", "The peace agreement recognizing American independence and granting territory to the Mississippi River.", "The treaty ended the war formally and gave the United States expansive western claims.", "It is a major APUSH endpoint and bridge to the Confederation era."),
        ],
        "essayPractice": {
            "saq": [
                {
                    "id": "saq-001",
                    "prompt": "Answer a, b, and c. a) Briefly explain one reason many colonists objected to the Stamp Act. b) Briefly explain one way colonists resisted the Stamp Act. c) Briefly explain one broader significance of the Stamp Act crisis.",
                    "partA": "Briefly explain one reason many colonists objected to the Stamp Act.",
                    "partB": "Briefly explain one way colonists resisted the Stamp Act.",
                    "partC": "Briefly explain one broader significance of the Stamp Act crisis.",
                    "scoringGuidance": {
                        "partA": "A full-credit answer must explain the constitutional issue of taxation without consent or representation.",
                        "partB": "A full-credit answer must identify a real form of resistance such as petitions, boycotts, mob action, or the Stamp Act Congress.",
                        "partC": "A full-credit answer must explain a broader effect such as intercolonial unity or the growth of organized resistance."
                    },
                    "sampleAnswers": {
                        "partA": "Many colonists objected to the Stamp Act because they believed only their own assemblies, not Parliament, had the right to tax them directly.",
                        "partB": "Colonists resisted by organizing boycotts of British goods and by forming groups such as the Sons of Liberty that intimidated stamp distributors.",
                        "partC": "The crisis was significant because it taught colonists to coordinate resistance across colonial boundaries and turned protest into a broader constitutional movement."
                    }
                },
                {
                    "id": "saq-002",
                    "prompt": "Answer a, b, and c. a) Briefly explain one reason Common Sense was important in 1776. b) Briefly explain one major idea in the Declaration of Independence. c) Briefly explain one way the Revolutionary War became an international conflict.",
                    "partA": "Briefly explain one reason Common Sense was important in 1776.",
                    "partB": "Briefly explain one major idea in the Declaration of Independence.",
                    "partC": "Briefly explain one way the Revolutionary War became an international conflict.",
                    "scoringGuidance": {
                        "partA": "A full-credit answer must explain that Paine helped popularize the case for full independence rather than mere protest.",
                        "partB": "A full-credit answer must explain an idea such as natural rights, consent of the governed, or the right of revolution.",
                        "partC": "A full-credit answer must identify foreign aid or alliance, especially France after Saratoga."
                    },
                    "sampleAnswers": {
                        "partA": "Common Sense was important because it persuaded many ordinary colonists that monarchy was illegitimate and that independence was both necessary and realistic.",
                        "partB": "One major idea in the Declaration was that governments derive their just powers from the consent of the governed and may be overthrown if they become tyrannical.",
                        "partC": "The war became international when France formally allied with the United States after Saratoga and provided ships, troops, loans, and diplomatic support."
                    }
                },
            ],
            "leq": [
                {
                    "id": "leq-001",
                    "prompt": "Evaluate the extent to which British imperial reforms after 1763 caused the American Revolution.",
                    "recommendedArgument": "Causation",
                    "thesisExamples": [
                        "British imperial reforms after 1763 caused the American Revolution to a great extent because they challenged colonial habits of self-government, imposed new taxes and enforcement, and restricted western expansion; however, those reforms became revolutionary only because colonists already possessed a political culture shaped by rights talk, popular protest, and local autonomy.",
                        "Although colonial ideology mattered deeply, the most immediate cause of the American Revolution was Britain's post-1763 effort to raise revenue and centralize authority, which convinced many colonists that the empire threatened their liberties."
                    ],
                    "outlineScaffold": {
                        "contextualization": "Begin with the Seven Years' War, the Treaty of Paris, and Britain's postwar debt and enlarged empire.",
                        "bodyParagraph1": {"claim": "Postwar reforms triggered constitutional conflict.", "evidence": ["Sugar Act", "Stamp Act", "Declaratory Act"], "analysis": "Explain why colonists saw these policies as violations of self-taxation and rights."},
                        "bodyParagraph2": {"claim": "Escalating imperial enforcement radicalized colonial politics.", "evidence": ["Townshend Acts", "Boston Tea Party", "Coercive Acts"], "analysis": "Show how repeated crises hardened resistance."},
                        "bodyParagraph3": {"claim": "Reforms alone were not enough without colonial political culture.", "evidence": ["Sons of Liberty", "Continental Congress", "Common Sense"], "analysis": "Explain how ideology and organization turned grievance into revolution."},
                        "complexity": "Earn complexity by weighing imperial policy against long-standing colonial traditions and showing they worked together."
                    },
                    "scoringRubric": {
                        "thesis": "1 point - make a defensible claim about the role of reforms after 1763.",
                        "contextualization": "1 point - establish the postwar imperial situation.",
                        "evidence": "2 points - use specific laws, protests, and institutions.",
                        "analysis": "2 points - explain causation and relative importance.",
                        "complexity": "1 point - show how British actions interacted with colonial political culture."
                    }
                },
                {
                    "id": "leq-002",
                    "prompt": "Evaluate the extent to which the American colonists achieved victory in the Revolutionary War because of foreign assistance.",
                    "recommendedArgument": "Causation",
                    "thesisExamples": [
                        "Foreign assistance was crucial to American victory because French money, arms, troops, and naval power made Yorktown and long-term survival possible; however, that aid mattered only because the Continental Army endured, colonial resistance remained politically viable, and British strategy repeatedly failed.",
                        "Although patriot commitment and Washington's leadership were important, the Revolution was won largely because Saratoga brought France openly into the war and turned a colonial rebellion into a global conflict Britain could not easily sustain."
                    ],
                    "outlineScaffold": {
                        "contextualization": "Set up the imbalance between British power and the colonies in 1775 and 1776.",
                        "bodyParagraph1": {"claim": "Colonial endurance kept the war alive long enough for alliance.", "evidence": ["Washington", "Trenton", "winter survival"], "analysis": "Show why immediate defeat did not occur."},
                        "bodyParagraph2": {"claim": "Saratoga and the French alliance changed the war decisively.", "evidence": ["Saratoga", "Treaty of Alliance", "French supplies"], "analysis": "Explain the diplomatic turning point."},
                        "bodyParagraph3": {"claim": "Foreign naval and military support helped produce final victory.", "evidence": ["Rochambeau", "French fleet", "Yorktown"], "analysis": "Demonstrate why Yorktown depended on allied strength."},
                        "complexity": "Earn sophistication by explaining that foreign assistance was necessary but not independently sufficient."
                    },
                    "scoringRubric": {
                        "thesis": "1 point - argue the relative importance of foreign assistance.",
                        "contextualization": "1 point - explain the military imbalance at the war's start.",
                        "evidence": "2 points - use specific military and diplomatic examples.",
                        "analysis": "2 points - explain causation and relative importance.",
                        "complexity": "1 point - weigh alliance against domestic endurance and British mistakes."
                    }
                },
            ],
            "dbq": [
                {
                    "id": "dbq-001",
                    "prompt": "Evaluate the extent to which colonial resistance to British policy became revolutionary in the period from 1763 to 1776.",
                    "documents": [
                        {"docNumber": 1, "title": "Colonial protest against taxation", "source": "Colonial pamphlet, 1765", "excerpt": "If taxes be laid upon us by a body in which we are not represented, then the distinction between freedom and slavery is at an end, for property may be taken without our consent.", "happ": {"historicalSituation": "The Stamp Act crisis focused attention on Parliament's taxing authority.", "audience": "The audience included colonial readers engaged in political protest.", "purpose": "The author wanted to rally resistance by framing taxation as a constitutional threat.", "pointOfView": "The writer spoke from the perspective of a colonist claiming English rights, not from that of Parliament or excluded groups."}},
                        {"docNumber": 2, "title": "British defense of authority", "source": "Member of Parliament, 1766", "excerpt": "The colonies are subordinate to the legislature of Great Britain, and that supreme legislature must govern every part of the empire in all cases whatsoever.", "happ": {"historicalSituation": "Parliament sought to preserve its sovereignty even while repealing unpopular measures.", "audience": "The intended audience was Parliament and the wider British political nation.", "purpose": "The speaker wanted to defend imperial supremacy.", "pointOfView": "As a British lawmaker, the speaker prioritized imperial sovereignty over colonial consent."}},
                        {"docNumber": 3, "title": "Tea destroyed in Boston Harbor", "source": "Account of the Boston Tea Party, 1773", "excerpt": "The inhabitants, resolved not to submit to the principle of parliamentary taxation, cast the tea into the sea rather than permit its landing, declaring that no duty could be paid without surrendering liberty.", "happ": {"historicalSituation": "The Tea Act revived colonial fear that buying taxed tea would concede Parliament's authority.", "audience": "The account addressed readers evaluating the legitimacy of direct action.", "purpose": "It aimed to justify the Tea Party as principled resistance.", "pointOfView": "The author framed crowd action as defense of liberty rather than as criminal destruction."}},
                        {"docNumber": 4, "title": "Thomas Paine attacks monarchy", "source": "Common Sense, 1776", "excerpt": "There is something exceedingly ridiculous in the composition of monarchy; an island should not rule a continent, and government by kings is a form altogether unworthy of a free people.", "happ": {"historicalSituation": "Open war had begun, but independence was still debated in early 1776.", "audience": "Paine wrote for a broad colonial readership, not only elites.", "purpose": "He wanted to push colonists from resistance to support for independence.", "pointOfView": "As a radical pamphleteer, Paine attacked monarchy itself, not simply bad policy."}},
                        {"docNumber": 5, "title": "Declaration of Independence", "source": "Continental Congress, 1776", "excerpt": "We hold these truths to be self-evident, that all men are created equal, that they are endowed with certain unalienable Rights, and that governments derive their just powers from the consent of the governed.", "happ": {"historicalSituation": "Congress needed to justify separation and claim legitimacy as independent states.", "audience": "The audience included colonists, foreign governments, and the wider world.", "purpose": "The document announced sovereignty and explained the reasons for revolution.", "pointOfView": "Congress framed the conflict in universal terms, even though many groups remained excluded from political equality."}}
                    ],
                    "thesisExample": "From 1763 to 1776, colonial resistance became revolutionary to a great extent because repeated imperial reforms convinced many colonists that Parliament threatened their rights, while war and persuasive writings such as Common Sense shifted the debate from protest against policy to rejection of monarchy and support for independence.",
                    "outlineScaffold": {
                        "contextualization": "Explain the Seven Years' War, postwar debt, and colonial expectations after 1763.",
                        "bodyParagraph1": {"claim": "Resistance began as a constitutional defense of rights within the empire.", "documentsUsed": [1, 2], "outsideEvidence": "Stamp Act Congress", "happ": "Use the differing points of view of colonial pamphleteers and Parliament."},
                        "bodyParagraph2": {"claim": "Direct action and coercion radicalized colonial politics.", "documentsUsed": [3], "outsideEvidence": "Coercive Acts or First Continental Congress", "happ": "Use the purpose of the Tea Party account to show the logic of resistance."},
                        "bodyParagraph3": {"claim": "By 1776 the movement had become fully revolutionary.", "documentsUsed": [4, 5], "outsideEvidence": "Lexington and Concord", "happ": "Use Paine's audience and the Declaration's purpose to explain the shift to independence."},
                        "complexity": "Earn complexity by showing that resistance was gradual: many colonists wanted restored rights before they wanted a new nation."
                    }
                }
            ],
        },
        "mcqFacts": [
            fact("post-1763 imperial reform", "British efforts to raise revenue and tighten control challenged colonial expectations of self-government.", THEME["pol"], "The Revolution grew from the collision between imperial reform and colonial political culture."),
            fact("the Stamp Act", "Direct internal taxation triggered the strongest early burst of intercolonial resistance.", THEME["pol"], "The Stamp Act is a core turning point in the road to revolution."),
            fact("taxation without representation", "Colonists objected less to taxes in the abstract than to taxation imposed without their own consent through local assemblies.", THEME["nat"], "This constitutional logic is central to APUSH explanations of resistance."),
            fact("the Sons of Liberty", "Popular groups transformed protest into organized public action through intimidation, symbolism, and crowd politics.", THEME["cul"], "The Revolution was not only an elite paper debate."),
            fact("the Declaratory Act", "Britain's repeal of one tax did not end the larger sovereignty dispute.", THEME["pol"], "This helps explain why conflict kept returning."),
            fact("the Townshend Acts", "New duties and stronger enforcement revived boycotts and tension in the colonies.", THEME["wxt"], "The crisis escalated through repeated British efforts to assert authority."),
            fact("the Boston Massacre", "Patriot leaders used the shooting in Boston as propaganda against standing armies and imperial coercion.", THEME["cul"], "Political meaning mattered more than casualty count."),
            fact("the Tea Act", "Cheap tea could still provoke resistance when colonists believed a principle of taxation was at stake.", THEME["wxt"], "Economic self-interest alone cannot explain the crisis."),
            fact("the Boston Tea Party", "Direct action against tea made compromise harder and triggered punitive British measures.", THEME["pol"], "The Tea Party is a major turning point toward united resistance."),
            fact("the Continental Congress", "Colonial leaders created new intercolonial institutions before they created a new nation.", THEME["pol"], "Institutional cooperation is a key APUSH theme."),
            fact("Lexington and Concord", "Open warfare made reconciliation much harder and accelerated the move toward independence.", THEME["pol"], "The Revolution was already a war before it became a declaration."),
            fact("Common Sense", "Paine popularized the case for independence by attacking monarchy itself.", THEME["cul"], "Ideas mattered when they reached mass audiences."),
            fact("the Declaration of Independence", "The Declaration grounded American sovereignty in natural rights and consent of the governed.", THEME["nat"], "It remains a foundational ideological document in APUSH."),
            fact("George Washington", "Washington's greatest strategic contribution was often preserving the army and the cause rather than winning constant victories.", THEME["pol"], "Endurance was essential to revolutionary success."),
            fact("Saratoga", "Saratoga mattered most because it made the French alliance possible.", THEME["wor"], "Battle significance is usually diplomatic significance on APUSH."),
            fact("the French alliance", "Foreign aid transformed the American cause from a rebellion into an international war Britain struggled to sustain.", THEME["wor"], "American victory cannot be explained without diplomacy."),
            fact("Yorktown", "Yorktown depended heavily on French naval and military support as well as American persistence.", THEME["wor"], "The battle is proof that alliance and strategy mattered together."),
            fact("loyalists", "The Revolution divided the colonial population and was never supported identically by everyone.", THEME["nat"], "Internal division adds complexity to revolutionary narratives."),
            fact("the Treaty of Paris of 1783", "Peace brought independence and huge western claims but left many domestic and Native issues unresolved.", THEME["geo"], "Winning sovereignty did not solve nation-building problems."),
            fact("republicanism", "The Revolution replaced monarchy with a political language centered on virtue, consent, and the common good.", THEME["nat"], "Republicanism links war, ideology, and later constitutional debates."),
        ],
        "textStimuli": [
            {"text": "If taxes be laid upon us by a body in which we are not represented, then the distinction between freedom and slavery is at an end.", "caption": "Colonial argument against parliamentary taxation"},
            {"text": "An island should not rule a continent, and monarchy is unworthy of a free people.", "caption": "Thomas Paine on independence"},
            {"text": "We hold these truths to be self-evident, that all men are created equal.", "caption": "Declaration of Independence"},
            {"text": "The colonies are subordinate to the legislature of Great Britain in all cases whatsoever.", "caption": "Parliamentary sovereignty"},
        ],
        "conceptCards": [
            {"type": "Concept", "front": "Why did the Revolution happen after 1763, not before?", "back": "Because British victory produced new debt, new territorial issues, and new efforts to enforce imperial authority. Those reforms collided with colonial habits of self-government and rights language already developed in earlier decades.", "hint": "War victory changes the empire.", "difficulty": "Hard"},
            {"type": "Comparison", "front": "Stamp Act vs. Tea Act", "back": "The Stamp Act triggered the first broad constitutional crisis over direct taxation, while the Tea Act showed that even a cheaper product could provoke resistance when principle and sovereignty were at stake.", "hint": "Different taxes, same authority issue.", "difficulty": "Medium"},
            {"type": "Cause-Effect", "front": "Why was Saratoga so important?", "back": "Saratoga's greatest significance was diplomatic. It convinced France that the Americans might win and helped secure the alliance that made long-term victory possible.", "hint": "Battle leads to alliance.", "difficulty": "Easy"},
            {"type": "Document", "front": "Common Sense", "back": "Thomas Paine's 1776 pamphlet argued that monarchy was absurd and that independence was both necessary and achievable. It helped move public opinion from resistance to separation.", "hint": "Pamphlet for the masses.", "difficulty": "Easy"},
        ],
    }
)


chapter_specs.append(
    {
        "chapterId": "chapter6",
        "chapterNum": 6,
        "chapterOrder": 6,
        "periodId": "p3",
        "periodNumber": 3,
        "chapterMeta": {
            "period": "Period 3",
            "periodId": "p3",
            "dateRange": "1754-1800",
            "apExamWeight": "10-17%",
            "chapterTitle": "The Revolution Within",
            "chapterSubtitle": "Democratization, toleration, limits of liberty, and slavery in the Revolutionary era",
            "bigPictureThemes": [THEME["nat"], THEME["cul"], THEME["pol"], THEME["wxt"]],
            "oneLineSummary": "The American Revolution expanded political participation and challenged old hierarchies, but its promises of liberty remained sharply limited by gender, race, property, and slavery.",
            "periodContext": "Chapter 6 shifts from the military struggle for independence to the social and political transformations triggered by the Revolutionary era. APUSH treats this internal revolution as essential because the meaning of independence depends on what actually changed within American society and what stayed unequal despite revolutionary language.",
            "examTips": [
                "When APUSH asks about the Revolution's effects, do not stop with independence. Discuss democratization, religion, women's roles, slavery, and the limits of equality.",
                "A strong answer on this chapter usually argues both change and continuity: more participation for white men, but severe limits for women, Native peoples, and most African Americans.",
                "The exam often links revolutionary ideology to later reform by asking how universal rights language created long-term pressure even when immediate change was incomplete.",
            ],
        },
        "images": [
            image(6, "ch06co01", "jpg", "The internal Revolution reshaped politics, religion, labor, and social expectations beyond the battlefield.", "This opening image matters because it frames the Revolution as a social transformation, not just a war for independence.", [THEME["nat"], THEME["cul"]], category="Painting"),
            image(6, "ch06ph01", "png", "New state constitutions and declarations of rights reflected efforts to translate revolution into government.", "This image is useful because it makes clear that independence required rethinking sovereignty, citizenship, and authority inside the states.", [THEME["pol"], THEME["nat"]], category="Broadside"),
            image(6, "ch06ph04", "png", "Women's political language expanded during the Revolution even though formal equality remained limited.", "The image matters because women acted politically through boycotts, petitions, and arguments about republican virtue.", [THEME["cul"], THEME["nat"]], category="Broadside"),
            image(6, "ch06ph12", "jpg", "Religious freedom and the weakening of establishment became major consequences of the Revolutionary era.", "This image is important because the Revolution loosened old church-state ties and widened room for conscience.", [THEME["cul"], THEME["pol"]], category="Engraving"),
            image(6, "ch06map01", "png", "The map of gradual emancipation shows that slavery and freedom changed unevenly across the new republic.", "This is one of the most AP-important visuals in the chapter because it shows how northern and southern paths diverged after independence.", [THEME["geo"], THEME["nat"]], category="Map"),
            image(6, "ch06ph14", "jpg", "African Americans used revolutionary language to demand freedom and expose the hypocrisy of slavery.", "The image matters because Black petitions and wartime claims reveal that enslaved and free African Americans were active participants in the Revolution's meaning.", [THEME["nat"], THEME["pol"]], category="Document"),
            image(6, "ch06ph16", "png", "Daughters of Liberty and wartime household labor made women's political contribution visible.", "This image is useful because it connects spinning, sacrifice, and consumption politics to women's public role.", [THEME["cul"], THEME["wxt"]], category="Illustration"),
            image(6, "ch06ph20", "jpg", "The Revolution's promises did not extend equally to Native peoples, loyalists, or the poor.", "This visual matters because it helps frame the Revolution as partial and exclusionary rather than universally liberating.", [THEME["nat"], THEME["pol"]], category="Painting"),
            image(6, "ch06ph25", "jpg", "The era's arguments about family, education, and virtue helped shape the idea later called republican motherhood.", "This image matters because women gained ideological importance even when they lacked equal legal rights.", [THEME["cul"], THEME["nat"]], category="Painting"),
        ],
        "notes": {
            "historicalContext": {
                "overview": "Independence did not automatically answer what freedom would mean inside the new United States. The collapse of monarchy, the rhetoric of equality, wartime mobilization, and the creation of state governments all invited Americans to rethink political authority, social hierarchy, religion, labor, and slavery. Some groups won meaningful gains, especially many white men who saw deference decline and participation expand. At the same time, revolutionary change exposed rather than resolved the contradictions of a society still shaped by slavery, patriarchy, Native dispossession, and inequality.",
                "precedingCauses": [
                    "The Declaration of Independence and revolutionary ideology made sweeping claims about rights and consent.",
                    "Wartime mobilization involved ordinary men, women, and African Americans in new political and economic roles.",
                    "State constitutions had to replace royal authority with new frameworks of republican government.",
                    "Revival religion, Enlightenment thought, and earlier public-sphere growth had already weakened some traditional hierarchies.",
                    "Slavery and unequal property relations remained deeply embedded at the moment of independence.",
                ],
                "geographicContext": "Revolutionary change varied regionally. Northern states moved more quickly toward disestablishment and gradual emancipation, while the plantation South preserved slavery more fully even as it adopted republican language. Frontier regions and Native homelands experienced the Revolution largely as territorial threat and intensified dispossession.",
                "contextImage": {"imageId": "ch06map01", "displayCaption": "The internal Revolution did not unfold evenly: freedom widened along different lines in different parts of the new nation."},
            },
            "sections": [
                note_section(
                    "Democratizing Freedom",
                    [THEME["nat"], THEME["pol"], THEME["cul"]],
                    "The Revolution weakened older systems of deference and made politics seem more open to ordinary white men. State constitutions reduced some aristocratic features, and the language of popular sovereignty suggested that legitimate authority came from the people rather than from dynasty. Property requirements did not disappear everywhere, but political participation broadened in important ways. Americans increasingly celebrated the self-made citizen rather than inherited rank. Yet democratization was uneven and selective, applying most fully to white men while leaving others outside the political nation. APUSH often treats this as the central social change of the Revolutionary era: more democracy, but not broad equality.",
                    ["Collapse of monarchy and hereditary privilege", "Revolutionary rhetoric about popular sovereignty", "State constitution-making"],
                    ["Political participation widened for many white men", "Old deference declined", "Ideas of citizenship shifted toward popular rule"],
                    "This section matters because it explains why the Revolution is often described as democratizing even when its limits remained severe.",
                    ["Connects to later Jacksonian democracy, which pushed some of these trends further for white men.", "Links back to colonial rights language but radicalizes it from subjecthood to citizenship."],
                    key_figures=[
                        figure("Thomas Paine", "Radical democratic writer", "Paine's attacks on monarchy and inherited privilege did not end in 1776. His broader political language helped legitimize a more democratic and anti-aristocratic culture in the new republic.", "He matters because revolutionary ideology kept shaping domestic politics after independence.", "He represented popular democratic republicanism."),
                    ],
                    primary_sources=["State constitutions", "Pennsylvania Constitution of 1776", "Virginia Declaration of Rights"],
                    section_images=[{"imageId": "ch06ph01", "displayCaption": "Revolution required Americans to rebuild authority from the state level upward."}],
                ),
                note_section(
                    "Toward Religious Toleration",
                    [THEME["cul"], THEME["pol"], THEME["nat"]],
                    "The Revolutionary era accelerated the weakening of established churches and the growth of religious liberty. If government was based on consent and natural rights, many Americans asked why the state should support one church over others. Dissenting Protestants, especially Baptists and other evangelicals, often supported disestablishment because it freed them from old elites. Leaders such as Jefferson and Madison translated these pressures into arguments for liberty of conscience and separation between civil power and religious authority. The Virginia Statute for Religious Freedom became the clearest legislative statement of this shift. APUSH prizes this development because it shows that the Revolution transformed not only political sovereignty but also the relationship between church and state.",
                    ["Revolutionary attacks on privilege and compulsion", "Support from dissenting religious groups", "Enlightenment and evangelical arguments for liberty of conscience"],
                    ["Established churches weakened", "Disestablishment spread", "Religious freedom became a core republican value"],
                    "This section matters because religious liberty became one of the Revolution's most durable and transferable achievements.",
                    ["Connects to Roger Williams and earlier colonial dissent, but now the principle spread more widely.", "Foreshadows the First Amendment and broader national protections for free exercise."],
                    key_figures=[
                        figure("Thomas Jefferson", "Advocate of religious freedom", "Jefferson drafted the Virginia Statute for Religious Freedom, which rejected state coercion in matters of faith. He argued that civil rights did not depend on religious belief.", "He matters because this statute became one of the strongest foundations of American church-state separation.", "He represented Enlightenment republicanism and liberty of conscience."),
                        figure("James Madison", "Political ally of disestablishment", "Madison opposed government support for religion and helped block religious assessments in Virginia. His arguments linked liberty of conscience to republican government.", "He matters because APUSH often pairs him with Jefferson in building religious freedom into early American political thought.", "He represented constitutional republicanism and religious liberty."),
                    ],
                    primary_sources=["Virginia Statute for Religious Freedom", "Madison's Memorial and Remonstrance Against Religious Assessments"],
                    section_images=[{"imageId": "ch06ph12", "displayCaption": "The Revolution encouraged Americans to detach legitimate government from inherited church privilege."}],
                ),
                note_section(
                    "Defining Economic Freedom",
                    [THEME["wxt"], THEME["nat"], THEME["pol"]],
                    "Revolutionary Americans also debated what economic freedom should mean. Many criticized old privileges such as entail and primogeniture, which kept property concentrated in elite families, and some states moved to reduce or abolish them. At the same time, independence did not produce economic equality. Market exchange, debt, wartime inflation, and inequality remained powerful realities. Some Americans imagined freedom as the chance to compete without aristocratic restraint, while others worried that true liberty required some protection for ordinary farmers and laborers. APUSH often uses this theme to show that the Revolution created a more fluid society without eliminating class tension or economic dependence.",
                    ["Attack on hereditary privilege", "Republican belief in independent property holders", "Wartime economic dislocation and debt"],
                    ["Older legal supports for aristocratic property weakened", "Market competition expanded", "Class conflict remained unresolved"],
                    "This section matters because the Revolution changed how Americans thought about economic opportunity even when it failed to create broad equality.",
                    ["Connects to the Confederation crises of the 1780s and Shays's Rebellion in Chapter 7.", "Prepares later debates over capitalism, debt, and democracy in the early republic."],
                    key_figures=[
                        figure("Small freeholders", "Idealized republican citizens", "Many revolutionaries imagined that liberty required a broad class of independent landholders able to participate in politics without depending on patrons. This ideal shaped debates over property and economic privilege.", "They matter because republican political thought rested heavily on social assumptions about independence and property.", "They represented the agrarian ideal of republican citizenship."),
                    ],
                    primary_sources=["State laws ending primogeniture and entail", "Wartime price-control debates", "Economic pamphlets of the 1780s"],
                    section_images=[{"imageId": "ch06co01", "displayCaption": "The Revolution widened economic aspiration, but it did not remove the pressures of debt, market instability, or class inequality."}],
                ),
                note_section(
                    "Daughters of Liberty and Women's Revolutionary Roles",
                    [THEME["cul"], THEME["nat"], THEME["wxt"]],
                    "Women did not gain equal political rights from the Revolution, but the era expanded their public significance. During the imperial crisis and the war, women organized boycotts, produced homespun goods, managed farms and shops, followed armies, and framed sacrifice as patriotic duty. Abigail Adams's plea to 'remember the ladies' captured the moment when revolutionary language invited women to question their subordinate status, even if immediate legal change remained limited. Out of this period came the idea later called republican motherhood, which assigned women the civic role of raising virtuous citizens. That idea did not create equality, but it did tie female education and national politics together more closely than before. APUSH often asks students to explain this mixed outcome: visibility and ideological importance without full rights.",
                    ["Boycotts and household production during the crisis", "Wartime necessity", "Revolutionary rhetoric about virtue and citizenship"],
                    ["Women's political consciousness expanded", "Female education gained stronger justification", "Republican motherhood took shape"],
                    "This section matters because it shows how the Revolution altered gender expectations without fully overturning patriarchy.",
                    ["Connects to earlier household-based political resistance in the colonial era.", "Foreshadows nineteenth-century women's rights arguments that drew on Revolutionary language."],
                    key_figures=[
                        figure("Abigail Adams", "Political commentator and revolutionary-era observer", "Abigail Adams urged her husband to 'remember the ladies' and wrote insightfully about politics, law, and gender. Her correspondence reveals both the possibilities and frustrations of women's revolutionary consciousness.", "She matters because APUSH frequently uses her words to show the limits of Revolutionary equality.", "She represented elite female political awareness in the Revolutionary era."),
                    ],
                    primary_sources=["Abigail Adams correspondence", "Homespun and boycott records", "Women petitioners' letters"],
                    section_images=[
                        {"imageId": "ch06ph16", "displayCaption": "Household production became a visible form of political resistance and patriotic labor."},
                        {"imageId": "ch06ph25", "placement": "after-key-figures", "displayCaption": "Republican motherhood gave women ideological importance without granting equal citizenship."},
                    ],
                ),
                note_section(
                    "The Limits of Liberty",
                    [THEME["nat"], THEME["pol"], THEME["wor"]],
                    "The Revolution's universal language did not mean universal inclusion. Loyalists lost property, Native peoples often found the new republic more threatening than the British Empire, and propertyless or dependent people still faced limits on power. The new states and later federal policy tied political belonging closely to whiteness, especially as naturalization law privileged 'free white persons.' Native nations that had hoped to preserve autonomy through imperial balance now confronted a republic eager for western land. APUSH rewards students who emphasize that revolutionary liberty was real, but also bounded. The new nation expanded freedom unevenly and often by excluding others from the political community.",
                    ["Revolutionary state-building", "Continuing land hunger", "Persistence of racial and property-based exclusion"],
                    ["Loyalists were marginalized", "Native dispossession intensified", "Citizenship became more sharply defined"],
                    "This section matters because the best APUSH answers do not romanticize the Revolution as universally liberating.",
                    ["Connects to the Proclamation line disputes and western expansion from Chapter 5.", "Foreshadows the early republic's continuing Native conflict and citizenship restrictions."],
                    key_figures=[
                        figure("Native nations of the Ohio Valley", "Communities confronting the new republic", "Many Native nations had hoped British limits on western settlement would preserve a buffer against colonial expansion. American victory instead accelerated pressure on their lands.", "They matter because the Revolution often meant loss rather than liberation outside the settler political community.", "They represented Indigenous sovereignty and the limits of revolutionary inclusion."),
                    ],
                    primary_sources=["Loyalist claims records", "Native diplomatic speeches", "Naturalization Act of 1790"],
                    section_images=[{"imageId": "ch06ph20", "displayCaption": "The Revolution created winners and losers, and many of the losers were outside the new republic's definition of the people."}],
                ),
                note_section(
                    "Slavery and the Revolution",
                    [THEME["nat"], THEME["pol"], THEME["wor"]],
                    "No contradiction in the Revolutionary era was greater than slavery. Revolutionary rhetoric encouraged enslaved people and free Black Americans to demand freedom, petition for rights, and seize wartime opportunities for liberation. Lord Dunmore's Proclamation and later British offers of freedom to military laborers or soldiers pushed many enslaved people to act strategically in search of liberty. Northern states moved toward gradual emancipation, and some slaveholders manumitted enslaved people in the upper South. Yet slavery survived and even hardened in the lower South, and the new nation's political institutions protected slaveholding interests. APUSH repeatedly returns to this subject because the Revolution both weakened slavery's legitimacy and preserved its power.",
                    ["Universal rights language", "Wartime disruption and British emancipation offers", "Economic and regional differences between North and South"],
                    ["Gradual emancipation spread in parts of the North", "Black activism and petitions increased", "Slavery endured and remained politically protected"],
                    "This section matters because it captures the Revolution's deepest contradiction and creates a bridge to every later national conflict over slavery and freedom.",
                    ["Connects back to Chapter 4's paradox of liberty and bondage in the colonial era.", "Foreshadows the Constitution's compromises and the sectional conflicts of the nineteenth century."],
                    key_figures=[
                        figure("Lord Dunmore", "Royal governor of Virginia", "Dunmore offered freedom to enslaved men who fled rebel masters and joined the British cause. His proclamation exposed patriot claims to liberty as deeply compromised by slavery.", "He matters because wartime emancipation often came first from imperial conflict rather than patriot principle.", "He represented British wartime strategy and the destabilization of slavery."),
                        figure("Prince Hall", "Black abolitionist and community leader", "Prince Hall used Revolutionary language to demand freedom and civil rights for African Americans in Massachusetts. He represents how Black activism pushed the Revolution's ideals toward broader meaning.", "He matters because African Americans were not passive observers of Revolutionary ideology; they fought over its meaning.", "He represented Black petitioning, abolitionism, and claims to citizenship."),
                    ],
                    primary_sources=["Lord Dunmore's Proclamation", "Black freedom petitions", "Pennsylvania gradual abolition law"],
                    section_images=[
                        {"imageId": "ch06map01", "displayCaption": "Emancipation proceeded unevenly, creating a sharp regional divide in the new republic."},
                        {"imageId": "ch06ph14", "placement": "after-key-figures", "displayCaption": "African Americans used the Revolution's own language to expose the hypocrisy of slavery."},
                    ],
                ),
            ],
            "overarchingAnalysis": {
                "continuity": "Despite revolutionary rhetoric, hierarchy persisted through slavery, patriarchy, Native dispossession, and unequal access to property and citizenship. Freedom widened, but it still rested on exclusions that shaped the early republic.",
                "change": "The major change of the Revolutionary era was the democratization of political culture for many white men and the spread of new ideas about popular sovereignty, religious liberty, and rights. Americans no longer thought of themselves primarily as subjects of a king but as members of a republic built on consent.",
                "complexity": "A strong complexity point argues that the Revolution was transformative precisely because it was incomplete. Its promises outran its immediate achievements, creating a language later generations could use against the inequalities the founding generation preserved.",
                "comparisonAngles": [
                    "Compare the Revolution's impact on white men's politics, women's civic role, and African Americans' struggle for freedom.",
                    "Compare the northern movement toward gradual emancipation with the continued strength of slavery in the South.",
                ],
            },
        },
        "periodTimeline": [
            event("chapter6", "p3", "chapter6-dunmore-proclamation", 1775, "Lord Dunmore's Proclamation", "Virginia's royal governor offered freedom to enslaved men who fled rebel masters and joined the British cause in 1775. The proclamation exposed the contradiction between patriot liberty and slaveholding society.", "Facing rebellion, Lord Dunmore sought to weaken Virginia patriots by drawing enslaved people to the British side. His proclamation did not free all enslaved people, but it had enormous symbolic power. Thousands of African Americans weighed war as an opportunity for liberty, and many fled. The measure terrified slaveholders and sharpened the meaning of the conflict in the South. It also showed that emancipation in the Revolutionary era was often driven by military strategy. APUSH treats it as a defining moment in the relationship between war and slavery.", ["Political", "Military"], [THEME["pol"], THEME["nat"]], ["Lord Dunmore"], ["British need for military support", "Patriot slaveholding society"], ["Black flight increased", "Slaveholders feared broader emancipation"], [], "High", True, "Essential evidence for slavery and the Revolution.", image_id="ch06ph14"),
            event("chapter6", "p3", "chapter6-virginia-declaration-rights", 1776, "Virginia Declaration of Rights", "Virginia adopted a declaration of rights in 1776 that articulated popular sovereignty and civil liberties. The document became a model for later state and national rights language.", "Written principally by George Mason, the declaration insisted that all men were by nature equally free and independent and that government was founded on the people's authority. It helped legitimize the idea that republican governments should formally recognize rights. The declaration also influenced later state constitutions and eventually the federal Bill of Rights. Yet its principles existed alongside slavery and property limits. That tension makes it especially valuable in APUSH. It represents both revolutionary change and revolutionary incompleteness.", ["Political"], [THEME["nat"], THEME["pol"]], ["George Mason"], ["Need for new republican legitimacy"], ["Rights language spread", "State constitution-making gained ideological clarity"], [], "High", True, "A major early Revolutionary statement of rights.", image_id="ch06ph01"),
            event("chapter6", "p3", "chapter6-remember-the-ladies", 1776, "Abigail Adams Urges 'Remember the Ladies'", "Abigail Adams asked her husband in 1776 to 'remember the ladies' when forming new laws. Her appeal became one of the most famous reminders of the limits of Revolutionary equality.", "Writing during the break with Britain, Abigail Adams warned that women would not quietly accept unlimited male authority forever. Her comments did not produce immediate legal equality, but they captured the way revolutionary language invited women to question old hierarchies. The letter matters because it shows that debates over rights quickly expanded beyond the original authors of independence. It also reveals how the Revolution opened space for critique even when reform lagged. APUSH often uses the letter as evidence of gender limits within Revolutionary change. It is one of the clearest primary-source windows into women's political consciousness.", ["Cultural", "Political"], [THEME["cul"], THEME["nat"]], ["Abigail Adams"], ["Revolutionary rights language", "State-building after independence"], ["Women's claims gained visibility", "Gender limits of the Revolution became clearer"], [], "Medium", False, "Classic APUSH evidence for women's responses to Revolutionary ideology.", image_id="ch06ph04"),
            event("chapter6", "p3", "chapter6-pennsylvania-constitution", 1776, "Pennsylvania Constitution of 1776", "Pennsylvania adopted one of the most democratic state constitutions of the era in 1776. The constitution reflected Revolutionary suspicion of concentrated power.", "Pennsylvania's constitution created a unicameral legislature and broader political participation than many older colonial arrangements had allowed. Supporters believed the people could and should watch government closely. Critics feared excessive democracy and weak checks on power. The document matters because state constitutions became laboratories for Revolutionary political thought. Pennsylvania in particular showed how far some revolutionaries wanted to push democratization. APUSH uses it to demonstrate that political experimentation began at the state level.", ["Political"], [THEME["pol"], THEME["nat"]], ["Pennsylvania radicals"], ["Collapse of royal authority", "Popular sovereignty"], ["State-level democratization expanded", "Debate over balanced government intensified"], [], "Medium", False, "Useful example of Revolutionary constitutional experimentation."),
            event("chapter6", "p3", "chapter6-new-jersey-voting", 1776, "New Jersey Constitution Expands Voting Ambiguously", "New Jersey's 1776 constitution used language that allowed some property-owning women to vote. The exception was unusual and temporary, but historically significant.", "Because the constitution referred to 'inhabitants' rather than explicitly to men, some propertied women and free Black men voted in New Jersey elections for a time. The practice was limited and later reversed, but it reveals how unsettled the boundaries of citizenship could be during the Revolutionary era. The event matters because it prevents students from treating gender exclusion as completely fixed and uncontested. Even short-lived exceptions reveal the broader pressure of Revolutionary ideology. APUSH can use New Jersey as evidence of both experimentation and limit. The opening narrowed again in the early nineteenth century.", ["Political"], [THEME["nat"], THEME["pol"]], ["New Jersey voters"], ["State constitution-making", "Ambiguity in suffrage language"], ["Some women voted temporarily", "Later backlash narrowed participation"], [], "Medium", False, "Helpful complexity evidence for gender and citizenship."),
            event("chapter6", "p3", "chapter6-vermont-constitution", 1777, "Vermont Constitution", "Vermont's 1777 constitution included one of the earliest bans on adult slavery in North America. The measure reflected the antislavery implications of Revolutionary ideology.", "Although Vermont was not yet one of the original states, its constitution became notable for banning adult slavery and emphasizing broad male political rights. Enforcement and lived reality were imperfect, but the document still mattered symbolically. It demonstrated that some revolutionary governments were willing to push rights language into law. APUSH uses examples like Vermont to show that antislavery outcomes, however limited, were part of the Revolutionary era. It also underscores regional variation. The Revolution opened multiple futures, not just one.", ["Political", "Social"], [THEME["nat"], THEME["pol"]], ["Vermont framers"], ["Revolutionary ideology", "Local political experimentation"], ["Antislavery precedent expanded", "Rights language gained legal force"], [], "Medium", False, "Useful for showing early antislavery experimentation."),
            event("chapter6", "p3", "chapter6-pennsylvania-gradual-abolition", 1780, "Pennsylvania Gradual Abolition Act", "Pennsylvania passed the first gradual abolition law in 1780. The act marked a major turning point in the relationship between independence and slavery.", "The law did not free all enslaved people immediately, but it committed the state to ending slavery over time by freeing future generations under specified conditions. Pennsylvania's act became a model for other northern states. It showed that Revolutionary ideals could translate into antislavery legislation, though only slowly and incompletely. The measure matters because it reveals both progress and limit: emancipation began, but freedom was delayed and conditional. APUSH often uses Pennsylvania as the clearest northern example of Revolutionary antislavery change. It set the new republic on a path of sectional divergence.", ["Political", "Social"], [THEME["nat"], THEME["pol"]], ["Pennsylvania legislators"], ["Revolutionary ideology", "Quaker and abolitionist pressure"], ["Gradual emancipation began", "North-South divide sharpened"], [], "High", True, "One of the most important antislavery measures of the Revolutionary era.", image_id="ch06map01"),
            event("chapter6", "p3", "chapter6-massachusetts-constitution", 1780, "Massachusetts Constitution", "Massachusetts adopted a constitution in 1780 whose equality language helped undermine slavery in court. The constitution became one of the era's strongest statements of rights.", "The Massachusetts Constitution declared that all men are born free and equal. In the following years, enslaved people and their advocates used that language in legal challenges such as the Quock Walker cases. Slavery then weakened dramatically in the state. The constitution matters because it shows how general rights language could have concrete legal consequences. It also reminds students that the path from principle to practice often ran through courts as well as legislatures. APUSH can use Massachusetts as an example of Revolutionary ideology pressing beyond its authors' intentions.", ["Political"], [THEME["nat"], THEME["pol"]], ["Massachusetts judges"], ["Revolutionary rights language"], ["Slavery weakened in Massachusetts", "Rights claims gained judicial force"], [], "Medium", False, "Important supporting evidence for northern emancipation."),
            event("chapter6", "p3", "chapter6-virginia-manumission", 1782, "Virginia Manumission Act", "Virginia eased the process of private manumission in 1782. The change encouraged some slaveholders to free enslaved people in the early Revolutionary era.", "The act reflected a moment when Revolutionary ideology made some white Virginians more willing to question slavery's morality. Manumissions rose in the 1780s, especially in the Upper South. Yet the broader slave system remained intact and later grew stronger again. The event matters because it captures the temporary antislavery opening of the Revolutionary years in places that did not abolish slavery. APUSH values this nuance because southern slavery was neither untouched nor fundamentally overturned at independence. Change was real but limited.", ["Political", "Social"], [THEME["nat"], THEME["pol"]], ["Virginia legislators"], ["Revolutionary antislavery sentiment"], ["Private manumissions increased", "Upper South antislavery moment emerged"], [], "Medium", False, "Useful complexity evidence for southern reactions to revolutionary ideals."),
            event("chapter6", "p3", "chapter6-new-york-manumission-society", 1784, "New York Manumission Society Founded", "Abolition-minded reformers founded the New York Manumission Society in 1784. The group reflected the growth of organized antislavery activism in the North.", "The society included prominent New Yorkers who wanted to limit or end slavery while often supporting gradual and cautious methods. It petitioned, advocated reform, and created institutions such as schools for Black children. The society matters because it shows that antislavery could become organized civic activism in the new republic. At the same time, its caution reveals the limits of white reform politics. APUSH can use it to connect Revolutionary ideology to early abolitionism. It is an important bridge to later reform movements.", ["Social", "Political"], [THEME["nat"], THEME["cul"]], ["New York reformers"], ["Revolutionary rights language", "Northern unease with slavery"], ["Organized abolitionism expanded", "Gradualist reform politics developed"], [], "Medium", False, "Good evidence for the institutional growth of abolitionism."),
            event("chapter6", "p3", "chapter6-madison-remonstrance", 1785, "Madison's Memorial and Remonstrance", "James Madison argued in 1785 against a proposed tax to support religion in Virginia. His essay became a major defense of liberty of conscience.", "Many Virginians wanted some form of public financial support for Christianity, but Madison insisted that religion was a matter of personal conviction beyond legitimate civil compulsion. His Memorial and Remonstrance linked freedom of conscience to republican government. The document mobilized opposition to religious assessment and helped prepare the way for Jefferson's statute. It mattered because religious liberty triumphed not automatically but through political argument and coalition-building. APUSH uses it to show that the Revolution transformed church-state relations through active debate. The essay is a major primary source for religious toleration.", ["Political", "Cultural"], [THEME["pol"], THEME["cul"]], ["James Madison"], ["Debate over state support for religion"], ["Assessment defeated", "Disestablishment advanced"], [], "Medium", False, "Important lead-in to the Virginia Statute."),
            event("chapter6", "p3", "chapter6-virginia-statute", 1786, "Virginia Statute for Religious Freedom", "Virginia enacted the Statute for Religious Freedom in 1786. The law rejected state coercion in religion and became a landmark of American liberty.", "Jefferson's statute declared that civil rights did not depend on religious belief and that no one should be forced to support a church. The act completed Virginia's move away from an established Anglican order. Its language became one of the strongest statements of liberty of conscience in the new republic. The statute mattered because it made religious freedom a practical legal principle, not just a wartime slogan. It also influenced later national protections for free exercise and non-establishment. APUSH treats it as one of the Revolution's most lasting domestic achievements.", ["Political"], [THEME["cul"], THEME["pol"]], ["Thomas Jefferson", "James Madison"], ["Disestablishment campaigns", "Revolutionary liberty arguments"], ["Church-state separation advanced", "Religious freedom became entrenched principle"], [], "High", True, "One of the clearest Revolutionary-era achievements in civil liberty.", image_id="ch06ph12"),
            event("chapter6", "p3", "chapter6-northwest-ordinance", 1787, "Northwest Ordinance", "Congress organized the Old Northwest in 1787 and prohibited slavery there. The ordinance linked republican expansion to sectional consequence.", "The Northwest Ordinance created a process for territorial government and eventual statehood in lands north of the Ohio River. It also banned slavery in the territory, drawing a major line in the political geography of the early republic. The law mattered because it combined orderly expansion with a powerful, if limited, antislavery precedent. It revealed that the Revolution's meanings were being written into western policy. APUSH often uses the ordinance as both a Confederation success and an early sign of future sectional division. It belongs to the internal Revolution because it defined freedom spatially as well as politically.", ["Political", "Geographic"], [THEME["geo"], THEME["nat"]], ["Confederation Congress"], ["Need to organize western lands", "Revolutionary commitment to republican expansion"], ["Territorial process established", "Sectional division over slavery sharpened"], ["chapter7-northwest-ordinance"], "High", True, "A crucial bridge between Revolutionary ideology and the early republic.", image_id="ch06map01"),
            event("chapter6", "p3", "chapter6-constitutional-slavery-compromises", 1787, "Constitutional Compromises over Slavery", "The Constitution of 1787 protected slavery through compromises such as the Three-Fifths Clause and the fugitive slave provision. The new republic preserved slavery while claiming liberty.", "Delegates at the Constitutional Convention confronted slavery not by abolishing it but by bargaining over representation, taxation, and the return of escaped enslaved people. The resulting compromises strengthened slaveholding interests within the new political order. These decisions mattered because they revealed how deeply slavery was embedded in the nation's founding institutions. The Revolution had weakened slavery's moral legitimacy for some Americans, but the Constitution still protected it materially and politically. APUSH often uses these clauses as the clearest proof of the founding era's contradiction. They shaped the nation's future conflicts profoundly.", ["Political"], [THEME["pol"], THEME["nat"]], ["Constitutional Convention delegates"], ["Need for union", "Conflict between antislavery and slaveholding states"], ["Slavery gained constitutional protection", "Future sectional conflict deepened"], ["chapter7-constitutional-convention-opens"], "High", True, "One of the deepest contradictions in early American history.", image_id="ch06ph20"),
            event("chapter6", "p3", "chapter6-naturalization-act", 1790, "Naturalization Act of 1790", "The first federal naturalization law limited citizenship to 'free white persons.' The act made racial exclusion part of the new republic's national framework.", "The law established a process for becoming a citizen but restricted eligibility by race. It mattered because it shows that the new nation defined political belonging in explicitly racial terms. Even as Americans celebrated universal rights language, the state drew legal boundaries around who counted. The act therefore belongs in Chapter 6's theme of limited liberty. APUSH can use it to show how the Revolutionary era expanded freedom while narrowing citizenship. It set a long-lasting precedent in American law.", ["Political"], [THEME["nat"], THEME["pol"]], ["First Congress"], ["Need to define national citizenship"], ["Racial boundaries of citizenship hardened", "Republican liberty remained exclusionary"], [], "Medium", False, "Strong evidence for the limits of Revolutionary inclusion."),
        ],
        "overallTimelineEvents": [
            overall_event("chapter6-virginia-declaration-rights", 1776, "Virginia Declaration of Rights", "A major Revolutionary statement of rights and popular sovereignty appears at the state level.", 3, "This belongs on the master timeline because it helped define rights language for the Revolutionary era.", ["Political"]),
            overall_event("chapter6-pennsylvania-gradual-abolition", 1780, "Pennsylvania Gradual Abolition Act", "The first state-level gradual emancipation law marks a turning point in the Revolutionary debate over slavery.", 3, "It matters because it shows the Revolution's real but incomplete antislavery consequences.", ["Social", "Political"]),
            overall_event("chapter6-virginia-statute", 1786, "Virginia Statute for Religious Freedom", "Virginia establishes one of the strongest early American protections for liberty of conscience.", 3, "This belongs on the master timeline because it is one of the Revolution's most durable achievements in civil liberty.", ["Political"]),
            overall_event("chapter6-northwest-ordinance", 1787, "Northwest Ordinance", "Congress organizes western settlement and bans slavery north of the Ohio River.", 3, "It matters because it ties republican expansion to early sectional consequences.", ["Political", "Geographic"]),
            overall_event("chapter6-constitutional-slavery-compromises", 1787, "Constitutional Slavery Compromises", "The founding political order protects slavery even while claiming liberty.", 3, "This event belongs on the master timeline because it captures the central contradiction of the Revolutionary founding.", ["Political"]),
        ],
        "vocabulary": [
            vocab("popular sovereignty", "The principle that legitimate government rests on the authority of the people.", "Revolutionary constitutions increasingly treated political power as flowing upward from the people rather than downward from a monarch.", "It is a central APUSH concept in Period 3."),
            vocab("republic", "A form of government in which power is exercised by representatives of the people rather than by a monarch.", "Americans redefined themselves as citizens of a republic after independence.", "The term appears constantly in questions about the Revolution's political meaning."),
            vocab("deference", "The older habit of granting automatic respect and authority to social superiors.", "The Revolution weakened deference by encouraging more ordinary white men to engage politics directly.", "Useful for explaining democratization in the Revolutionary era."),
            vocab("Virginia Declaration of Rights", "A 1776 statement of rights and popular sovereignty adopted in Virginia.", "The declaration influenced later state constitutions and the federal Bill of Rights.", "It is major APUSH evidence for Revolutionary rights language."),
            vocab("state constitution", "A written plan of government adopted by an individual state after independence.", "State constitutions became laboratories of revolutionary political experimentation.", "The AP exam often asks about differences among state constitutions and their significance."),
            vocab("disestablishment", "The removal of official government support for a specific church.", "Revolutionary politics accelerated disestablishment, especially in Virginia.", "It is important in questions about religion and the Revolution."),
            vocab("Virginia Statute for Religious Freedom", "A 1786 law ending coercion in matters of religion and protecting liberty of conscience.", "Jefferson's statute became a landmark of American church-state separation.", "This statute is a high-value APUSH term."),
            vocab("republican motherhood", "The idea that women should be educated to raise virtuous republican citizens.", "The concept expanded women's ideological importance without giving them full political rights.", "It often appears in questions about women and the Revolution."),
            vocab("coverture", "The legal doctrine under which a married woman's legal identity was largely absorbed into her husband's.", "Coverture survived the Revolution, showing the limits of women's equality.", "Useful for explaining continuity in gender relations."),
            vocab("Daughters of Liberty", "Women who supported resistance through boycotts, homespun production, and political participation.", "Women's domestic labor became a visible part of revolutionary politics.", "This term appears in APUSH discussions of women's public role."),
            vocab("manumission", "The freeing of an enslaved person by an individual owner or legal process.", "Manumissions increased in some places during the early Revolutionary era, especially in the Upper South.", "The term helps explain limited antislavery change."),
            vocab("gradual emancipation", "A legal process ending slavery over time rather than immediately.", "Pennsylvania and other northern states adopted gradual emancipation laws after the Revolution.", "This concept is central to understanding regional divergence after independence."),
            vocab("Lord Dunmore's Proclamation", "A 1775 British offer of freedom to enslaved men who fled rebel masters and joined the British cause.", "The proclamation linked war to emancipation and exposed patriot contradictions.", "It is a major APUSH term in slavery and the Revolution."),
            vocab("abolition society", "An organization dedicated to ending slavery, often gradually, through petition and reform.", "Groups such as the New York Manumission Society reflected the rise of organized antislavery activism.", "These societies are useful evidence for early reform movements."),
            vocab("primogeniture", "The inheritance custom giving the eldest son priority in inheriting family land or estate.", "Revolutionary-era reforms weakened primogeniture as Americans criticized inherited privilege.", "It helps explain how the Revolution changed social and economic ideals."),
            vocab("entail", "A legal rule preventing the sale or division of inherited family estates.", "Many revolutionaries attacked entail as a relic of aristocratic society.", "This term appears in discussions of economic freedom and anti-aristocratic reform."),
            vocab("Northwest Ordinance", "A 1787 law organizing the Old Northwest and banning slavery there.", "The ordinance linked western expansion to statehood and antislavery geography.", "It is one of the most important APUSH terms of the Confederation era."),
            vocab("Three-Fifths Compromise", "The constitutional formula counting three-fifths of the enslaved population for representation and taxation.", "The compromise strengthened slaveholding political power in the new republic.", "It is a foundational APUSH term for the limits of Revolutionary freedom."),
            vocab("Naturalization Act of 1790", "The first federal law defining who could become a U.S. citizen, limited to free white persons.", "The law made racial exclusion part of the nation's legal framework.", "It is useful evidence for the limits of Revolutionary inclusion."),
            vocab("freedom petitions", "Appeals by African Americans using Revolutionary language to demand emancipation or equal rights.", "Black petitioners pushed the new republic to confront its own ideals.", "These petitions are important primary-source evidence in APUSH."),
        ],
        "essayPractice": {
            "saq": [
                {
                    "id": "saq-001",
                    "prompt": "Answer a, b, and c. a) Briefly explain one way the American Revolution democratized politics. b) Briefly explain one limit on that democratization. c) Briefly explain one broader significance of this tension for later U.S. history.",
                    "partA": "Briefly explain one way the American Revolution democratized politics.",
                    "partB": "Briefly explain one limit on that democratization.",
                    "partC": "Briefly explain one broader significance of this tension for later U.S. history.",
                    "scoringGuidance": {
                        "partA": "A full-credit answer must explain a concrete democratic change such as broader participation for white men, popular sovereignty, or state constitutional reform.",
                        "partB": "A full-credit answer must identify a real limit such as continued exclusion of women, enslaved people, Native peoples, or many propertyless people.",
                        "partC": "A full-credit answer must connect the tension to later democratic expansion or later reform movements."
                    },
                    "sampleAnswers": {
                        "partA": "The Revolution democratized politics by weakening deference and making government seem more accountable to ordinary white male citizens through state constitutions and popular sovereignty.",
                        "partB": "A major limit was that women, enslaved African Americans, and most Native peoples remained outside the full political nation despite the rhetoric of equality.",
                        "partC": "This tension mattered because later groups used Revolutionary ideals to demand broader democracy and civil rights in the nineteenth century and beyond."
                    }
                },
                {
                    "id": "saq-002",
                    "prompt": "Answer a, b, and c. a) Briefly explain one way the Revolution affected slavery. b) Briefly explain one way the Revolution affected women's roles. c) Briefly explain one important difference between those two effects.",
                    "partA": "Briefly explain one way the Revolution affected slavery.",
                    "partB": "Briefly explain one way the Revolution affected women's roles.",
                    "partC": "Briefly explain one important difference between those two effects.",
                    "scoringGuidance": {
                        "partA": "A full-credit answer must explain a concrete development such as gradual emancipation, Black petitions, or British wartime emancipation offers.",
                        "partB": "A full-credit answer must explain a development such as boycotts, republican motherhood, or Abigail Adams's critique.",
                        "partC": "A full-credit answer must explain that the effects were uneven and often symbolic or limited rather than fully equalizing."
                    },
                    "sampleAnswers": {
                        "partA": "The Revolution affected slavery by encouraging gradual emancipation in some northern states and by giving enslaved people new wartime opportunities to seek freedom.",
                        "partB": "The Revolution affected women's roles by making their homespun labor, political sacrifice, and educational role as republican mothers more publicly valued.",
                        "partC": "A key difference is that northern antislavery laws created some concrete legal change, while women's political importance usually grew more in ideology than in equal legal rights."
                    }
                },
            ],
            "leq": [
                {
                    "id": "leq-001",
                    "prompt": "Evaluate the extent to which the American Revolution changed ideas about equality and freedom in the United States from 1775 to 1800.",
                    "recommendedArgument": "Continuity and Change Over Time",
                    "thesisExamples": [
                        "The American Revolution changed ideas about equality and freedom to a significant extent by promoting popular sovereignty, religious liberty, and broader participation for white men; however, these changes were limited because slavery, patriarchy, racial exclusion, and Native dispossession remained deeply embedded in the new republic.",
                        "Although the Revolution did not create universal equality, it transformed American political thought by making rights and consent central public ideals, which later reformers could use against the exclusions the founding generation preserved."
                    ],
                    "outlineScaffold": {
                        "contextualization": "Set up colonial rights language, the Declaration of Independence, and the wartime struggle for independence.",
                        "bodyParagraph1": {"claim": "The Revolution democratized politics for many white men.", "evidence": ["state constitutions", "popular sovereignty", "decline of deference"], "analysis": "Explain how political culture became more participatory."},
                        "bodyParagraph2": {"claim": "The Revolution expanded religious liberty and civic discourse.", "evidence": ["Virginia Statute for Religious Freedom", "Madison", "disestablishment"], "analysis": "Show a concrete institutional change in liberty."},
                        "bodyParagraph3": {"claim": "Equality remained sharply limited.", "evidence": ["slavery", "Naturalization Act of 1790", "republican motherhood"], "analysis": "Use continuity and contradiction to deepen the argument."},
                        "complexity": "Earn sophistication by arguing that the Revolution mattered because its universal language outran its immediate practice."
                    },
                    "scoringRubric": {
                        "thesis": "1 point - make a defensible claim about the extent of change in ideas of equality and freedom.",
                        "contextualization": "1 point - situate the prompt in the Revolutionary struggle and earlier colonial rights traditions.",
                        "evidence": "2 points - use specific examples from politics, religion, gender, and slavery.",
                        "analysis": "2 points - demonstrate continuity and change over time.",
                        "complexity": "1 point - explain why incomplete change still mattered historically."
                    }
                },
                {
                    "id": "leq-002",
                    "prompt": "Evaluate the extent to which the American Revolution undermined slavery in the period from 1775 to 1800.",
                    "recommendedArgument": "Causation",
                    "thesisExamples": [
                        "The American Revolution undermined slavery only partly because its rights language inspired Black activism, northern gradual emancipation, and some southern manumission; however, the new republic also protected slavery politically and allowed it to remain central to the South.",
                        "Although the Revolution weakened slavery's moral legitimacy and produced important antislavery change in the North, it did not fundamentally destroy slavery because regional economics and constitutional compromise preserved the institution."
                    ],
                    "outlineScaffold": {
                        "contextualization": "Begin with the central role of slavery in the colonial Atlantic economy before independence.",
                        "bodyParagraph1": {"claim": "Revolutionary ideas opened antislavery opportunities.", "evidence": ["Dunmore's Proclamation", "Black petitions", "Pennsylvania gradual abolition"], "analysis": "Explain how the war and ideology destabilized slavery."},
                        "bodyParagraph2": {"claim": "Some legal and social change occurred.", "evidence": ["Massachusetts cases", "Virginia manumission", "abolition societies"], "analysis": "Show the Revolution's real but uneven antislavery effects."},
                        "bodyParagraph3": {"claim": "Slavery survived and gained new protection.", "evidence": ["Three-Fifths Compromise", "southern slavery", "racial citizenship limits"], "analysis": "Explain why the Revolution did not end slavery nationally."},
                        "complexity": "Earn sophistication by distinguishing between slavery's legitimacy being weakened and slavery itself being destroyed."
                    },
                    "scoringRubric": {
                        "thesis": "1 point - argue the extent to which slavery was undermined.",
                        "contextualization": "1 point - establish slavery's role before the Revolution.",
                        "evidence": "2 points - use specific northern and southern examples.",
                        "analysis": "2 points - explain both the causes of change and the limits of change.",
                        "complexity": "1 point - show how the Revolution could simultaneously challenge and preserve slavery."
                    }
                },
            ],
            "dbq": [
                {
                    "id": "dbq-001",
                    "prompt": "Evaluate the extent to which the American Revolution expanded freedom in the period from 1775 to 1800.",
                    "documents": [
                        {"docNumber": 1, "title": "Declaration of rights and sovereignty", "source": "State rights declaration, 1776", "excerpt": "All men are by nature equally free and independent, and have certain inherent rights, namely the enjoyment of life and liberty, with the means of acquiring and possessing property.", "happ": {"historicalSituation": "States needed to replace royal authority with republican legitimacy during the Revolution.", "audience": "The intended audience included citizens and lawmakers in the new states.", "purpose": "The document aimed to define the principles of legitimate republican government.", "pointOfView": "Its authors spoke in universal terms while still living in a society marked by slavery and exclusion."}},
                        {"docNumber": 2, "title": "Abigail Adams to John Adams", "source": "Private letter, 1776", "excerpt": "I desire you would remember the ladies, and be more generous and favorable to them than your ancestors. Do not put such unlimited power into the hands of the husbands.", "happ": {"historicalSituation": "Women observed the creation of new governments during the break with Britain.", "audience": "Abigail Adams wrote directly to her husband, a leading patriot and statesman.", "purpose": "She wanted to influence lawmaking and expose the gap between Revolutionary ideals and women's subordination.", "pointOfView": "As an elite woman excluded from formal politics, she used intimate correspondence to press a political point."}},
                        {"docNumber": 3, "title": "James Madison against religious assessment", "source": "Memorial and Remonstrance, 1785", "excerpt": "The religion of every man must be left to the conviction and conscience of every man, and it is the right of every man to exercise it as these may dictate.", "happ": {"historicalSituation": "Virginians debated whether government should support religion financially after the Revolution.", "audience": "Madison addressed legislators and the broader Virginia public.", "purpose": "He sought to defeat religious assessment and defend liberty of conscience.", "pointOfView": "Madison linked religious liberty directly to republican principle and feared civil power in religion."}},
                        {"docNumber": 4, "title": "African American petition for liberty", "source": "Black petitioners in Massachusetts, Revolutionary era", "excerpt": "We have in common with all other men a natural and unalienable right to that freedom which the great Parent of the Universe hath bestowed equally on all mankind.", "happ": {"historicalSituation": "African Americans used Revolutionary language to challenge slavery and racial exclusion.", "audience": "The petition addressed state lawmakers and the public.", "purpose": "Its authors wanted emancipation and recognition of their rights.", "pointOfView": "As people denied freedom, the petitioners revealed the gap between revolutionary principle and American practice."}},
                        {"docNumber": 5, "title": "Naturalization law", "source": "Congressional act, 1790", "excerpt": "Any alien, being a free white person, may be admitted to become a citizen of the United States after the time and conditions prescribed by this act.", "happ": {"historicalSituation": "The new republic had to define national citizenship in federal law.", "audience": "The act addressed courts, immigrants, and national officials.", "purpose": "It established a legal process for naturalization.", "pointOfView": "The law reflects how national freedom could expand while remaining racially exclusive."}}
                    ],
                    "thesisExample": "The American Revolution expanded freedom to a significant extent by promoting popular sovereignty, religious liberty, and broader political participation for many white Americans, but it did not create universal freedom because women, African Americans, Native peoples, and nonwhite immigrants continued to face major exclusions in the new republic.",
                    "outlineScaffold": {
                        "contextualization": "Explain the Declaration of Independence, the Revolutionary War, and the problem of building republican governments after breaking with Britain.",
                        "bodyParagraph1": {"claim": "The Revolution expanded political freedom and rights language.", "documentsUsed": [1], "outsideEvidence": "state constitutions or decline of deference", "happ": "Use the purpose and point of view of state rights declarations."},
                        "bodyParagraph2": {"claim": "The Revolution also widened liberty in religion and public debate.", "documentsUsed": [2, 3], "outsideEvidence": "Virginia Statute for Religious Freedom", "happ": "Use Abigail Adams's perspective and Madison's purpose."},
                        "bodyParagraph3": {"claim": "Freedom remained sharply limited by race and gender.", "documentsUsed": [4, 5], "outsideEvidence": "gradual emancipation or republican motherhood", "happ": "Use Black petitioners' perspective and the naturalization law's purpose to show exclusion."},
                        "complexity": "Earn complexity by arguing that the Revolution's greatest power may have been creating universal language that later exposed its own limits."
                    }
                }
            ],
        },
        "mcqFacts": [
            fact("popular sovereignty", "Revolutionary politics made government seem more accountable to the people rather than to inherited rulers.", THEME["nat"], "The internal Revolution changed how Americans imagined legitimate authority."),
            fact("state constitutions", "The states became laboratories for new ideas about rights, representation, and institutional design.", THEME["pol"], "Much of the Revolution's domestic change happened first at the state level."),
            fact("decline of deference", "Ordinary white men increasingly expected a more active role in politics after the Revolution.", THEME["cul"], "Democratization did not mean equality for all, but it did weaken old hierarchies."),
            fact("religious toleration", "The Revolution accelerated attacks on established churches and support for liberty of conscience.", THEME["cul"], "Religious freedom is one of the Revolution's most durable domestic achievements."),
            fact("Virginia Statute for Religious Freedom", "Jefferson's statute made liberty of conscience a concrete legal principle.", THEME["pol"], "It is high-value APUSH evidence for church-state change."),
            fact("economic freedom", "Revolutionary Americans attacked hereditary privilege while still tolerating inequality and debt.", THEME["wxt"], "The Revolution changed social ideals more fully than economic outcomes."),
            fact("Daughters of Liberty", "Women's domestic labor and boycotts became visible forms of political participation.", THEME["cul"], "The Revolution expanded women's civic role without granting equal rights."),
            fact("republican motherhood", "Women gained ideological importance as educators of virtuous citizens in the new republic.", THEME["nat"], "This concept captures both change and limit in women's status."),
            fact("Abigail Adams", "Women used Revolutionary language to challenge male authority even when reform remained limited.", THEME["cul"], "Abigail Adams is a classic APUSH voice for the gender limits of the Revolution."),
            fact("the limits of liberty", "Revolutionary freedom was constrained by race, gender, property, and western expansion.", THEME["nat"], "The best APUSH answers always note exclusion as well as expansion."),
            fact("Lord Dunmore's Proclamation", "British wartime emancipation offers made slavery a central issue in the Revolution itself.", THEME["wor"], "Freedom during the Revolution often emerged from war, not only from patriot ideology."),
            fact("Black petitions", "African Americans actively used Revolutionary ideals to demand liberty and rights.", THEME["nat"], "This shows Black political agency in the Revolutionary era."),
            fact("gradual emancipation", "Northern states moved unevenly toward ending slavery after independence.", THEME["pol"], "This created an early sectional divide over slavery."),
            fact("Virginia manumission", "The Revolutionary era briefly increased private manumission in parts of the Upper South.", THEME["nat"], "Southern slavery was challenged morally in the 1780s even though it survived."),
            fact("the Northwest Ordinance", "Western policy linked republican expansion to a sectional boundary over slavery.", THEME["geo"], "The Revolution's consequences were written onto the map."),
            fact("constitutional protection of slavery", "The new national order preserved slavery through political compromise.", THEME["pol"], "The founding era both challenged and protected slavery."),
            fact("Naturalization Act of 1790", "Citizenship in the new republic was legally tied to whiteness.", THEME["nat"], "Revolutionary freedom did not mean universal inclusion."),
            fact("loyalists and Native peoples", "Many groups experienced the Revolution as dispossession or exclusion rather than liberation.", THEME["wor"], "The Revolution created winners and losers."),
            fact("primogeniture and entail", "Attacks on inherited privilege reflected a broader anti-aristocratic spirit in the new republic.", THEME["wxt"], "Social ideals changed even when economic inequality remained."),
            fact("the Revolution within", "The most important domestic effect of the Revolution was not perfect equality but a new political language that later reformers could use.", THEME["nat"], "The Revolution mattered because its principles exceeded its immediate practice."),
        ],
        "textStimuli": [
            {"text": "I desire you would remember the ladies, and be more generous and favorable to them than your ancestors.", "caption": "Abigail Adams on women's status"},
            {"text": "The religion of every man must be left to the conviction and conscience of every man.", "caption": "Madison on liberty of conscience"},
            {"text": "We have in common with all other men a natural and unalienable right to that freedom bestowed equally on all mankind.", "caption": "Black petitioners claim Revolutionary rights"},
            {"text": "Any alien, being a free white person, may be admitted to become a citizen of the United States.", "caption": "Naturalization and racial exclusion"},
        ],
        "conceptCards": [
            {"type": "Comparison", "front": "Revolutionary change vs. Revolutionary limits", "back": "The Revolution expanded popular sovereignty, religious freedom, and political participation for many white men, but it preserved slavery, patriarchy, racial citizenship limits, and Native dispossession. That tension is the core of Chapter 6.", "hint": "More democracy, not universal equality.", "difficulty": "Hard"},
            {"type": "Concept", "front": "Why is Chapter 6 called 'The Revolution Within'?", "back": "Because the Revolutionary era changed American society internally through politics, religion, gender roles, and slavery debates, not only through war against Britain. It asks what independence meant inside the new republic.", "hint": "Social revolution, not just military revolution.", "difficulty": "Medium"},
            {"type": "Cause-Effect", "front": "How did the Revolution affect slavery?", "back": "It weakened slavery's moral legitimacy, encouraged Black petitions and gradual emancipation in the North, and increased some manumissions. But it also preserved slavery constitutionally and regionally, especially in the South.", "hint": "Undermined morally, preserved politically.", "difficulty": "Medium"},
            {"type": "Document", "front": "Republican motherhood", "back": "Republican motherhood was the idea that women should cultivate virtue in sons and citizens for the republic. It increased women's ideological importance without granting equal political rights.", "hint": "Civic importance without equality.", "difficulty": "Easy"},
        ],
    }
)


def main():
    chapters = [build_chapter(spec) for spec in chapter_specs]
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUT_PATH.open("w", encoding="utf-8", newline="\n") as handle:
        for spec, chapter in zip(chapter_specs, chapters):
            handle.write(f"window.chapter{spec['chapterNum']}Data = JSON.parse(String.raw`")
            json.dump(chapter, handle, indent=2, ensure_ascii=True)
            handle.write("`);\n\n")


if __name__ == "__main__":
    main()
