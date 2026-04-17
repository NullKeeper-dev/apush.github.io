const chapter22ImagePath = (imageId) => `images/chapter22/${imageId}.jpg`;

const chapter22Image = (
  imageId,
  alt,
  caption,
  description,
  apThemes,
  apCategory = "Photograph"
) => ({
  imageId,
  src: chapter22ImagePath(imageId),
  alt,
  caption,
  relevanceScore: 5,
  apCategory,
  description,
  apThemes,
  period: "p7",
  suggestedUse: ["notes", "mcq-stimulus", "saq-stimulus", "flashcard"]
});

const chapter22Images = [
  chapter22Image(
    "chapter22-img-001",
    "The immensely popular Office of War Information poster reproducing Norman Rockwell’s paintings of The Four Freedoms",
    "The immensely popular Office of War Information poster reproducing Norman Rockwell’s paintings of the Four Freedoms, President Franklin D. Roosevelt’s shorthand for American purposes in World War II.",
    "This Office of War Information poster turned Roosevelt’s Four Freedoms into a mass visual language for the war effort. It matters for APUSH because it shows how the federal government sold intervention as a defense of democracy and economic security.",
    ["America in the World", "Politics and Power", "Culture and Society"],
    "Illustration"
  ),
  chapter22Image(
    "chapter22-img-002",
    "In a 1940 cartoon, war clouds engulf Europe, while Uncle Sam observes that the Atlantic Ocean no longer seems to shield the United States from involvement",
    "In a 1940 cartoon, war clouds engulf Europe, while Uncle Sam observes that the Atlantic Ocean no longer seems to shield the United States from involvement.",
    "This cartoon captures the collapse of the old belief that oceans could protect the United States from European war. It is historically significant because it visualizes the shift from strict neutrality toward aid and eventual intervention.",
    ["America in the World", "Politics and Power"],
    "Political Cartoon"
  ),
  chapter22Image(
    "chapter22-img-003",
    "Two damaged battleships with smoke coming out of them.",
    "The battleships West Virginia and Tennessee in flames during the Japanese attack on Pearl Harbor. Both were repaired and later took part in the Pacific war.",
    "The photograph shows the destruction at Pearl Harbor that brought the United States directly into World War II. For APUSH, it marks the decisive break between prewar debate over intervention and full-scale mobilization for global war.",
    ["America in the World", "Politics and Power"]
  ),
  chapter22Image(
    "chapter22-img-004",
    "Fumiko Hayashida waiting for removal with 13-month old daughter, both wear tags",
    "Fumiko Hayashida holds her thirteen-month-old daughter while waiting for relocation to an internment camp. Both wear baggage tags, as if they were pieces of luggage.",
    "This image became one of the most recognizable photographs of Japanese-American internment. It is essential for APUSH because it reveals how wartime claims about freedom coexisted with racial exclusion, forced removal, and suspended civil liberties.",
    ["American and National Identity", "Politics and Power", "Culture and Society"]
  ),
  chapter22Image(
    "chapter22-img-005",
    "A photograph of black servicemen in Brooklyn, New York, flashing the “Double V” sign, symbolizing the dual battle against Nazism abroad and racism at home.",
    "Black servicemen in Brooklyn, New York, flash the “Double V” sign, symbolizing the dual battle against Nazism abroad and racism at home.",
    "The Double V photograph links wartime military service to demands for racial justice within the United States. It is historically significant because it shows how black Americans used the war to challenge segregation, discrimination, and second-class citizenship.",
    ["Politics and Power", "American and National Identity", "Culture and Society"]
  ),
  chapter22Image(
    "chapter22-img-006",
    "1945 photograph documenting remains of elementary school auditorium in Hiroshima after atomic bomb",
    "After the dropping of the atomic bomb on Hiroshima, this classified survey photograph showed the remains of an elementary school.",
    "The Hiroshima photograph records the physical destruction and civilian impact of atomic warfare. For APUSH, it anchors discussion of the bomb decision, total war, and the beginning of the atomic age in which American global power expanded dramatically.",
    ["America in the World", "Politics and Power", "Geography and Environment"]
  )
];

const chapter22Mcq = (config) => ({
  ...config,
  explanation: { correct: config.explanation },
  options: {
    A: config.options[0],
    B: config.options[1],
    C: config.options[2],
    D: config.options[3]
  }
});

const chapter22Flashcard = (id, type, front, back, hint, extra = {}) => ({
  id,
  type,
  front,
  back,
  hint,
  chapterId: "chapter22",
  periodId: "p7",
  ...extra
});

const chapter22McqQuestions = [
  chapter22Mcq({
    id: "chapter22-mcq-001",
    difficulty: "Easy",
    apSkill: "Contextualization",
    apTheme: "America in the World",
    question: "The Good Neighbor Policy most directly reflected which broader interwar development?",
    options: [
      "A desire to avoid the interventionist pattern associated with earlier U.S. policy in Latin America",
      "An effort to annex new Caribbean territories before World War II",
      "A plan to replace European empires with direct American colonial rule",
      "A rejection of all trade with Latin American nations"
    ],
    correctAnswer: "A",
    explanation: "The Good Neighbor Policy emphasized nonintervention and cooperation instead of direct occupation."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-002",
    difficulty: "Easy",
    apSkill: "Causation",
    apTheme: "Politics and Power",
    question: "The Neutrality Acts of the 1930s were passed primarily because many Americans believed that",
    options: [
      "the federal government should promote colonial independence in Asia",
      "entry into World War I had been encouraged by financiers and munitions makers",
      "the Soviet Union posed the greatest immediate military threat to the Western Hemisphere",
      "collective security through the League of Nations had worked well"
    ],
    correctAnswer: "B",
    explanation: "Many supporters of neutrality accepted the argument that profiteers and bankers had helped pull the nation into World War I."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-003",
    difficulty: "Easy",
    apSkill: "Comparison",
    apTheme: "America in the World",
    question: "Compared with most isolationists, Franklin D. Roosevelt in the late 1930s was more likely to believe that",
    options: [
      "Axis expansion threatened long-term American security",
      "all foreign wars were equally irrelevant to the United States",
      "Congress should immediately declare war on Germany in 1938",
      "the Atlantic Ocean guaranteed American safety"
    ],
    correctAnswer: "A",
    explanation: "Roosevelt increasingly saw fascist expansion as a direct danger to American interests."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-004",
    difficulty: "Easy",
    apSkill: "Contextualization",
    apTheme: "Politics and Power",
    question: "The first peacetime draft in American history, enacted in 1940, best demonstrates that",
    options: [
      "Congress had already fully abandoned neutrality legislation",
      "the United States was preparing for possible war before Pearl Harbor",
      "the nation had formally joined the Allied alliance before 1941",
      "most Americans wanted immediate combat in Europe"
    ],
    correctAnswer: "B",
    explanation: "The draft reflected growing preparedness even while the nation remained formally outside the war."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-005",
    difficulty: "Easy",
    apSkill: "Argumentation",
    apTheme: "America in the World",
    stimulusType: "text",
    stimulusText: "“In the future days, which we seek to make secure, we look forward to a world founded upon four essential human freedoms.”",
    stimulusCaption: "Franklin D. Roosevelt, State of the Union, 1941",
    question: "The quoted goal most directly supported Roosevelt’s argument for",
    options: [
      "ending all New Deal reforms during wartime",
      "a universalist justification for aiding nations fighting fascism",
      "a return to strict isolation from European affairs",
      "limiting freedom to political rights alone"
    ],
    correctAnswer: "B",
    explanation: "Roosevelt used the Four Freedoms to justify intervention as a defense of universal democratic ideals."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-006",
    difficulty: "Easy",
    apSkill: "Causation",
    apTheme: "America in the World",
    question: "Lend-Lease represented a turning point because it",
    options: [
      "required the immediate deployment of American combat troops to Europe",
      "allowed the United States to aid Allied nations while still remaining formally at peace",
      "ended all congressional resistance to intervention",
      "forced Britain to surrender its empire in exchange for military aid"
    ],
    correctAnswer: "B",
    explanation: "Lend-Lease made the United States an active supplier to the Allies before formal entry into the war."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-007",
    difficulty: "Easy",
    apSkill: "Argumentation",
    apTheme: "Culture and Society",
    stimulusType: "image",
    stimulusImageId: "chapter22-img-001",
    stimulusCaption: "Office of War Information poster based on Norman Rockwell’s Four Freedoms",
    question: "The image is best understood as evidence that World War II propaganda often",
    options: [
      "treated freedom as a universal cause worth defending through intervention",
      "rejected Roosevelt’s language as too idealistic for wartime use",
      "focused mainly on criticizing labor unions",
      "promoted isolation from the rest of the world"
    ],
    correctAnswer: "A",
    explanation: "The poster transformed Roosevelt’s Four Freedoms into a mass democratic justification for the war effort."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-008",
    difficulty: "Easy",
    apSkill: "Comparison",
    apTheme: "America in the World",
    stimulusType: "image",
    stimulusImageId: "chapter22-img-002",
    stimulusCaption: "1940 political cartoon about shrinking Atlantic protection",
    question: "The cartoon most directly suggests that by 1940 many Americans had begun to doubt",
    options: [
      "that the United States could produce enough weapons for war",
      "that the Atlantic Ocean was sufficient protection from European conflict",
      "that democracy and capitalism were compatible",
      "that Japan posed a threat in the Pacific"
    ],
    correctAnswer: "B",
    explanation: "The cartoon’s point is that oceans no longer guaranteed safety from global conflict."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-009",
    difficulty: "Easy",
    apSkill: "Contextualization",
    apTheme: "America in the World",
    stimulusType: "image",
    stimulusImageId: "chapter22-img-003",
    stimulusCaption: "Battleships burning during the attack on Pearl Harbor",
    question: "The event shown in the photograph had which immediate consequence?",
    options: [
      "It convinced Congress to repeal the GI Bill",
      "It brought the United States directly into World War II",
      "It led Roosevelt to withdraw support from Britain",
      "It persuaded the Supreme Court to strike down wartime exclusions"
    ],
    correctAnswer: "B",
    explanation: "Pearl Harbor triggered the U.S. declaration of war and full entry into World War II."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-010",
    difficulty: "Easy",
    apSkill: "Causation",
    apTheme: "Work, Exchange, Technology",
    question: "A major reason wartime unemployment disappeared was that",
    options: [
      "the government sharply reduced industrial production",
      "military service and defense contracts created enormous demand for labor",
      "New Deal relief agencies replaced all private employers",
      "Congress eliminated the use of labor unions"
    ],
    correctAnswer: "B",
    explanation: "The war created millions of military and civilian jobs tied to mobilization."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-011",
    difficulty: "Easy",
    apSkill: "Causation",
    apTheme: "Migration and Settlement",
    question: "The wartime migration of millions of Americans to new military bases and industrial centers most directly contributed to",
    options: [
      "the long-term growth of the South and West",
      "the immediate collapse of urban manufacturing",
      "a return to rural self-sufficiency",
      "the end of all racial tension in northern cities"
    ],
    correctAnswer: "A",
    explanation: "Wartime investment and migration accelerated the economic rise of the South and West."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-012",
    difficulty: "Easy",
    apSkill: "Comparison",
    apTheme: "America in the World",
    stimulusType: "text",
    stimulusText: "“They desire no territorial changes that do not accord with the freely expressed wishes of the peoples concerned.”",
    stimulusCaption: "Atlantic Charter, 1941",
    question: "The statement most clearly reflected which wartime ideal?",
    options: [
      "Self-determination as part of the Allied cause",
      "A defense of formal European colonial empires",
      "A promise to avoid international organizations after the war",
      "An argument that the war should remain limited to Europe"
    ],
    correctAnswer: "A",
    explanation: "The Atlantic Charter language emphasized self-determination and consent."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-013",
    difficulty: "Medium",
    apSkill: "Causation",
    apTheme: "Politics and Power",
    question: "The War Production Board and the Office of Price Administration are best understood as evidence that during World War II",
    options: [
      "the federal government took a much larger role in directing economic life",
      "the New Deal state was dismantled in favor of laissez-faire policies",
      "private corporations lost all influence over national policy",
      "the United States avoided centralized wartime planning"
    ],
    correctAnswer: "A",
    explanation: "Both agencies show how wartime mobilization expanded federal authority over production and prices."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-014",
    difficulty: "Medium",
    apSkill: "Comparison",
    apTheme: "Work, Exchange, Technology",
    question: "Unlike many New Deal liberals, defenders of the “Fifth Freedom” emphasized",
    options: [
      "collective ownership of industry",
      "free enterprise and consumer choice as the essence of liberty",
      "racial integration as the primary wartime goal",
      "strict neutrality in global affairs"
    ],
    correctAnswer: "B",
    explanation: "The “Fifth Freedom” ad campaign defined freedom in market and consumer terms."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-015",
    difficulty: "Medium",
    apSkill: "Continuity and Change Over Time",
    apTheme: "Culture and Society",
    question: "Women’s wartime work most clearly illustrates which pattern?",
    options: [
      "World War II permanently eliminated traditional gender expectations",
      "Wartime needs expanded women’s employment, but many leaders still treated those gains as temporary",
      "Women were excluded from all defense industries",
      "Federal propaganda discouraged women from wage labor"
    ],
    correctAnswer: "B",
    explanation: "The war brought many women into new jobs while preserving strong expectations of postwar domesticity."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-016",
    difficulty: "Medium",
    apSkill: "Causation",
    apTheme: "Migration and Settlement",
    question: "The bracero program was created primarily to",
    options: [
      "reduce the power of labor unions by outlawing strikes",
      "supply labor for wartime sectors facing worker shortages",
      "encourage Mexican American assimilation through military service",
      "replace Japanese American farmers after internment with European refugees"
    ],
    correctAnswer: "B",
    explanation: "The program addressed labor shortages by bringing Mexican workers into the United States."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-017",
    difficulty: "Medium",
    apSkill: "Argumentation",
    apTheme: "Culture and Society",
    question: "The zoot suit riots most strongly undermine which interpretation of the wartime home front?",
    options: [
      "That wartime rhetoric erased ethnic and racial prejudice",
      "That labor shortages encouraged migration",
      "That wartime production increased urban tensions",
      "That military service influenced civilian culture"
    ],
    correctAnswer: "A",
    explanation: "The riots reveal that discrimination and racial conflict persisted despite patriotic language."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-018",
    difficulty: "Medium",
    apSkill: "Argumentation",
    apTheme: "American and National Identity",
    stimulusType: "image",
    stimulusImageId: "chapter22-img-004",
    stimulusCaption: "Fumiko Hayashida awaiting relocation to an internment camp",
    question: "The photograph is most useful as evidence for the argument that World War II",
    options: [
      "ended all racial exclusions inside the United States",
      "expanded federal welfare programs for all citizens equally",
      "exposed the contradiction between democratic ideals and racialized state policy",
      "produced no meaningful change in the meaning of citizenship"
    ],
    correctAnswer: "C",
    explanation: "Internment is a prime example of wartime freedom rhetoric colliding with racial exclusion."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-019",
    difficulty: "Medium",
    apSkill: "Causation",
    apTheme: "Politics and Power",
    question: "Japanese-American internment differed from the treatment of most German and Italian Americans because",
    options: [
      "the federal government considered all Axis-descended groups equally dangerous",
      "wartime fear interacted with a long history of anti-Asian racism on the West Coast",
      "Japanese Americans had openly declared loyalty to Japan in large numbers",
      "the Supreme Court had already ruled exclusion unconstitutional"
    ],
    correctAnswer: "B",
    explanation: "Racial prejudice strongly shaped policy toward Japanese Americans in ways not applied equally to other Axis-descended groups."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-020",
    difficulty: "Medium",
    apSkill: "Comparison",
    apTheme: "American and National Identity",
    stimulusType: "image",
    stimulusImageId: "chapter22-img-005",
    stimulusCaption: "Black servicemen flashing the Double V sign",
    question: "The image best represents the wartime argument that",
    options: [
      "service in the armed forces should remain separate from civil rights claims",
      "victory over fascism abroad should be matched by victory over racism at home",
      "African Americans should postpone demands for equality until after the war",
      "the New Deal had already solved the problem of segregation"
    ],
    correctAnswer: "B",
    explanation: "The Double V campaign linked wartime service to demands for racial justice."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-021",
    difficulty: "Medium",
    apSkill: "Causation",
    apTheme: "Politics and Power",
    question: "Executive Order 8802 was issued largely because",
    options: [
      "Congress voluntarily integrated the military before activists demanded it",
      "A. Philip Randolph threatened a March on Washington to protest discrimination in defense work",
      "the Supreme Court ordered Roosevelt to desegregate wartime industry",
      "labor unions unanimously demanded federal civil rights action"
    ],
    correctAnswer: "B",
    explanation: "Randolph’s threatened march forced Roosevelt to respond to discrimination in defense employment."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-022",
    difficulty: "Medium",
    apSkill: "Comparison",
    apTheme: "Culture and Society",
    question: "Gunnar Myrdal’s An American Dilemma most directly argued that",
    options: [
      "segregation was fully compatible with American democratic ideals",
      "racial inequality contradicted the nation’s own stated principles",
      "wartime migration made civil rights reform impossible",
      "scientific racism remained a persuasive explanation for inequality"
    ],
    correctAnswer: "B",
    explanation: "Myrdal highlighted the contradiction between democratic ideals and racial discrimination."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-023",
    difficulty: "Medium",
    apSkill: "Argumentation",
    apTheme: "Politics and Power",
    stimulusType: "text",
    stimulusText: "“We loyal Negro-American citizens demand the right to work and fight for our country.”",
    stimulusCaption: "Wartime black protest rhetoric",
    question: "The statement would most directly support which development?",
    options: [
      "The creation of the Fair Employment Practices Commission",
      "The repeal of the GI Bill",
      "The internment of Japanese Americans",
      "The return to strict neutrality after 1941"
    ],
    correctAnswer: "A",
    explanation: "The pressure of black activists demanding equal access to defense work helped produce EO 8802 and the FEPC."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-024",
    difficulty: "Medium",
    apSkill: "Comparison",
    apTheme: "Work, Exchange, Technology",
    question: "Compared with World War I, World War II more strongly encouraged many Americans to associate freedom with",
    options: [
      "economic security and mass consumption as well as formal liberties",
      "the end of federal involvement in economic life",
      "a rejection of all international institutions",
      "the collapse of industrial unionism"
    ],
    correctAnswer: "A",
    explanation: "The chapter stresses freedom from want, full employment, and abundance as wartime meanings of liberty."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-025",
    difficulty: "Medium",
    apSkill: "Contextualization",
    apTheme: "Work, Exchange, Technology",
    question: "The GI Bill contributed most directly to which postwar development?",
    options: [
      "Rapid growth in higher education and homeownership",
      "The repeal of the Neutrality Acts",
      "An immediate end to racial discrimination in housing",
      "The disappearance of federal influence over the economy"
    ],
    correctAnswer: "A",
    explanation: "The GI Bill helped millions of veterans attend college and buy homes."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-026",
    difficulty: "Medium",
    apSkill: "Causation",
    apTheme: "America in the World",
    question: "Bretton Woods was designed in part to prevent a recurrence of",
    options: [
      "the economic instability associated with the Great Depression",
      "the neutrality debates of the 1930s",
      "the direct election of senators",
      "the military draft"
    ],
    correctAnswer: "A",
    explanation: "Postwar planners wanted a stable international economy to avoid another depression."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-027",
    difficulty: "Medium",
    apSkill: "Argumentation",
    apTheme: "America in the World",
    question: "The founding of the United Nations reflected Roosevelt’s belief that",
    options: [
      "lasting peace required some form of collective international organization",
      "the United States should return to isolation after victory",
      "imperial powers should ignore all colonial demands",
      "economic planning was incompatible with diplomacy"
    ],
    correctAnswer: "A",
    explanation: "Roosevelt favored a postwar order built around international cooperation and collective security."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-028",
    difficulty: "Medium",
    apSkill: "Argumentation",
    apTheme: "Politics and Power",
    stimulusType: "text",
    stimulusText: "“True individual freedom cannot exist without economic security and independence.”",
    stimulusCaption: "Franklin D. Roosevelt, 1944",
    question: "The statement most directly supported",
    options: [
      "Roosevelt’s argument for an Economic Bill of Rights",
      "Hayek’s argument against state planning",
      "the Supreme Court’s ruling in Korematsu",
      "the America First Committee’s opposition to intervention"
    ],
    correctAnswer: "A",
    explanation: "Roosevelt used that logic to argue that liberty required material security, not only formal rights."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-029",
    difficulty: "Medium",
    apSkill: "Comparison",
    apTheme: "Culture and Society",
    question: "Which statement best describes the relationship between wartime propaganda and gender roles?",
    options: [
      "Propaganda consistently rejected the family as a model of freedom",
      "Propaganda encouraged women’s work while still presenting male-headed families as the norm",
      "Propaganda portrayed domestic life as incompatible with patriotism",
      "Propaganda argued that postwar gender roles would be identical to wartime work roles"
    ],
    correctAnswer: "B",
    explanation: "The chapter emphasizes that women entered new jobs while propaganda still idealized traditional family order."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-030",
    difficulty: "Medium",
    apSkill: "Comparison",
    apTheme: "Work, Exchange, Technology",
    question: "The no-strike pledge adopted by major labor organizations during the war most directly reflected",
    options: [
      "a belief that wartime production took priority over ordinary labor conflict",
      "the permanent collapse of industrial unionism",
      "the abolition of collective bargaining by the Supreme Court",
      "an end to labor’s influence in national politics"
    ],
    correctAnswer: "A",
    explanation: "Unions accepted the pledge because defeating the Axis and sustaining production were presented as overriding priorities."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-031",
    difficulty: "Medium",
    apSkill: "Continuity and Change Over Time",
    apTheme: "American and National Identity",
    question: "One major continuity from the prewar era into World War II was",
    options: [
      "the complete absence of racial segregation in national institutions",
      "the persistence of racial hierarchy even amid wartime change",
      "the refusal of the federal government to regulate the economy",
      "the collapse of American nationalism"
    ],
    correctAnswer: "B",
    explanation: "The war changed many things, but racial hierarchy remained powerful and visible."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-032",
    difficulty: "Medium",
    apSkill: "Comparison",
    apTheme: "Culture and Society",
    question: "Which development best explains why many Americans came to see World War II as a “people’s war”?",
    options: [
      "The federal government ended all propaganda efforts",
      "Mobilization reached into everyday life through rationing, work, migration, and military service",
      "Only elites experienced wartime economic change",
      "Congress sharply reduced federal power during the conflict"
    ],
    correctAnswer: "B",
    explanation: "The war touched ordinary Americans directly through work, movement, consumption, and service."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-033",
    difficulty: "Hard",
    apSkill: "Argumentation",
    apTheme: "America in the World",
    stimulusType: "image",
    stimulusImageId: "chapter22-img-006",
    stimulusCaption: "Hiroshima after the atomic bomb",
    question: "The photograph is best used to support the claim that World War II",
    options: [
      "reduced civilian suffering compared with earlier wars",
      "blurred the line between military targets and civilian destruction",
      "ended debate over the ethics of bombing",
      "had little effect on postwar diplomacy"
    ],
    correctAnswer: "B",
    explanation: "Hiroshima illustrates how total war and atomic weapons made civilians central to wartime destruction."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-034",
    difficulty: "Hard",
    apSkill: "Causation",
    apTheme: "Politics and Power",
    question: "One reason many conservatives were alarmed by wartime planning was that they believed it might",
    options: [
      "produce full employment too quickly",
      "threaten liberty by expanding centralized state power",
      "weaken corporate profits during the war",
      "encourage the United States to join the Axis"
    ],
    correctAnswer: "B",
    explanation: "Critics such as Hayek feared that planning could become a path to coercive government."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-035",
    difficulty: "Hard",
    apSkill: "Comparison",
    apTheme: "Culture and Society",
    question: "Which of the following best explains why World War II is often remembered as the “Good War” even though the chapter complicates that label?",
    options: [
      "The United States faced no domestic conflict during the war",
      "The war combined clear anti-fascist goals with unresolved conflicts over race, gender, and liberty",
      "Americans rejected freedom rhetoric as unrealistic",
      "The federal government refused to shape public memory of the war"
    ],
    correctAnswer: "B",
    explanation: "The chapter acknowledges the compelling anti-fascist cause while stressing domestic contradictions."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-036",
    difficulty: "Hard",
    apSkill: "Causation",
    apTheme: "Migration and Settlement",
    question: "The second Great Migration most directly strengthened the early civil rights movement by",
    options: [
      "moving many African Americans away from politics and into isolated rural communities",
      "creating new urban communities with greater access to labor organizing and political leverage",
      "ending job discrimination in the defense industry",
      "convincing black leaders to stop criticizing segregation during the war"
    ],
    correctAnswer: "B",
    explanation: "Migration concentrated African Americans in places where labor, voting power, and activism could grow."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-037",
    difficulty: "Hard",
    apSkill: "Comparison",
    apTheme: "Politics and Power",
    question: "Executive Order 8802 and Executive Order 9066 together most clearly illustrate that World War II",
    options: [
      "extended federal power in ways that could both widen and narrow freedom",
      "ended debates over the proper scope of executive authority",
      "made race irrelevant to federal policy",
      "replaced courts with military rule in all domestic matters"
    ],
    correctAnswer: "A",
    explanation: "One order opened limited opportunities against discrimination while the other sanctioned exclusion and confinement."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-038",
    difficulty: "Hard",
    apSkill: "Contextualization",
    apTheme: "Geography and Environment",
    question: "The wartime concentration of military and industrial facilities in the South and West most directly foreshadowed",
    options: [
      "the rise of the Sunbelt in the postwar decades",
      "the collapse of suburban growth after 1945",
      "the end of military spending as a driver of regional development",
      "the return of the nation’s population to New England textile towns"
    ],
    correctAnswer: "A",
    explanation: "Wartime bases, plants, and migration helped launch the long postwar rise of the Sunbelt."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-039",
    difficulty: "Hard",
    apSkill: "Argumentation",
    apTheme: "American and National Identity",
    stimulusType: "text",
    stimulusText: "“Victory abroad and victory at home.”",
    stimulusCaption: "Double V campaign slogan",
    question: "The slogan most directly challenged the idea that",
    options: [
      "military service should be linked to claims for racial equality",
      "the fight against fascism had no implications for domestic segregation",
      "black Americans supported the Axis powers",
      "wartime labor shortages encouraged migration"
    ],
    correctAnswer: "B",
    explanation: "The Double V slogan insisted that anti-fascism abroad was inseparable from the fight against racism at home."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-040",
    difficulty: "Hard",
    apSkill: "Comparison",
    apTheme: "America in the World",
    question: "A major difference between the Atlantic Charter and the actual postwar world was that",
    options: [
      "the Charter rejected self-government, while the postwar order embraced it fully",
      "the Charter raised hopes for self-determination that colonial powers often did not immediately fulfill",
      "the Charter focused only on domestic reform within the United States",
      "the postwar world eliminated great-power diplomacy"
    ],
    correctAnswer: "B",
    explanation: "The chapter stresses the gap between the Charter’s language and the limited reality of decolonization in 1945."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-041",
    difficulty: "Hard",
    apSkill: "Argumentation",
    apTheme: "Culture and Society",
    stimulusType: "image",
    stimulusImageId: "chapter22-img-001",
    stimulusCaption: "Four Freedoms poster",
    question: "The poster would be least useful as evidence for which claim?",
    options: [
      "The federal government relied on culture and imagery to build support for the war",
      "Wartime leaders presented the conflict as a defense of democratic values",
      "Wartime propaganda automatically resolved racial inequality inside the United States",
      "Popular art helped translate presidential rhetoric into everyday political language"
    ],
    correctAnswer: "C",
    explanation: "The poster promoted ideals, but it did not by itself solve domestic inequalities."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-042",
    difficulty: "Hard",
    apSkill: "Causation",
    apTheme: "Politics and Power",
    question: "Why did black wartime activism have more leverage than similar demands had often possessed in the 1920s?",
    options: [
      "Because wartime labor needs and anti-fascist rhetoric made discrimination more politically vulnerable",
      "Because the South voluntarily repealed segregation laws during the war",
      "Because the Supreme Court immediately outlawed all forms of racial segregation",
      "Because African Americans stopped using protest and relied only on courts"
    ],
    correctAnswer: "A",
    explanation: "Labor demand and freedom rhetoric gave activists stronger political leverage during the war."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-043",
    difficulty: "Hard",
    apSkill: "Continuity and Change Over Time",
    apTheme: "Culture and Society",
    question: "Which statement best captures continuity in American society during World War II?",
    options: [
      "Wartime service completely erased racial hierarchy",
      "Traditional assumptions about family and gender remained powerful even amid major labor changes",
      "All Americans gained equal access to housing and education benefits",
      "The federal government withdrew from economic life once the war began"
    ],
    correctAnswer: "B",
    explanation: "The war changed work patterns but preserved many older assumptions about gender and family."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-044",
    difficulty: "Hard",
    apSkill: "Comparison",
    apTheme: "Work, Exchange, Technology",
    question: "The Manhattan Project differed from most earlier federal scientific efforts because it",
    options: [
      "had little connection to military goals",
      "combined massive federal spending, scientific expertise, and secrecy to produce a decisive weapon",
      "was funded mainly by local governments",
      "ended before the United States entered the war"
    ],
    correctAnswer: "B",
    explanation: "The Manhattan Project was a huge secret federal-scientific effort directed toward military use."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-045",
    difficulty: "Hard",
    apSkill: "Argumentation",
    apTheme: "Politics and Power",
    stimulusType: "text",
    stimulusText: "Central planning, even when well intended, may threaten liberty.",
    stimulusCaption: "Paraphrase of Hayek’s argument, 1944",
    question: "A reader who agreed with Friedrich Hayek’s The Road to Serfdom would most likely criticize Roosevelt’s wartime and postwar proposals because they",
    options: [
      "gave too little power to private enterprise and risked excessive planning",
      "did not expand the welfare state enough",
      "failed to support any military mobilization",
      "placed too much trust in local governments rather than Washington"
    ],
    correctAnswer: "A",
    explanation: "Hayek warned that broad planning could endanger liberty and market society."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-046",
    difficulty: "Hard",
    apSkill: "Contextualization",
    apTheme: "America in the World",
    question: "The wartime alliance between the United States and the Soviet Union is best described as",
    options: [
      "an ideologically consistent partnership with few tensions",
      "a strategic necessity against fascism that did not erase major political differences",
      "a temporary arrangement opposed by Roosevelt from the start",
      "a sign that the United States had abandoned capitalism"
    ],
    correctAnswer: "B",
    explanation: "The alliance was driven by military necessity despite deep ideological disagreement."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-047",
    difficulty: "Hard",
    apSkill: "Comparison",
    apTheme: "America in the World",
    stimulusType: "image",
    stimulusImageId: "chapter22-img-002",
    stimulusCaption: "1940 cartoon on Atlantic vulnerability",
    question: "The cartoon’s message most closely parallels which later wartime development?",
    options: [
      "The belief that European war could be quarantined permanently",
      "The argument behind Lend-Lease that events overseas directly affected American security",
      "The decision to intern Japanese Americans on the West Coast",
      "The passage of the GI Bill for returning veterans"
    ],
    correctAnswer: "B",
    explanation: "Both the cartoon and Lend-Lease reflect the belief that the United States could not safely remain detached from events abroad."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-048",
    difficulty: "Hard",
    apSkill: "Argumentation",
    apTheme: "American and National Identity",
    question: "Which claim about the home front would the chapter most strongly support?",
    options: [
      "Wartime mobilization produced only consensus and no serious social tension",
      "The war expanded opportunity for many groups while intensifying conflicts over who counted as fully American",
      "Federal economic planning failed to increase production",
      "Civil rights activism had little connection to wartime conditions"
    ],
    correctAnswer: "B",
    explanation: "The chapter repeatedly shows expansion and exclusion operating at the same time."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-049",
    difficulty: "Hard",
    apSkill: "Comparison",
    apTheme: "Politics and Power",
    question: "One important similarity between the Four Freedoms and the Economic Bill of Rights is that both",
    options: [
      "defined freedom in ways that included material security, not just formal political rights",
      "argued for immediate isolation from world affairs",
      "rejected any federal role in shaping economic life",
      "were written by Hayek as critiques of the New Deal"
    ],
    correctAnswer: "A",
    explanation: "Both formulations expanded liberty to include protection from want and insecurity."
  }),
  chapter22Mcq({
    id: "chapter22-mcq-050",
    difficulty: "Hard",
    apSkill: "Argumentation",
    apTheme: "Politics and Power",
    question: "Which statement best captures the chapter’s overall interpretation of the United States in World War II?",
    options: [
      "The war was purely a foreign military event with little domestic significance",
      "The war ended the New Deal and restored minimal government",
      "The war simultaneously expanded American power, widened some freedoms, and exposed deep contradictions in democracy",
      "The war had fewer long-term consequences than World War I"
    ],
    correctAnswer: "C",
    explanation: "The chapter presents World War II as transformative but deeply contradictory in both global and domestic terms."
  })
];

const chapter22Flashcards = [
  chapter22Flashcard("chapter22-fc-001", "Term", "Four Freedoms", "Roosevelt’s four freedoms were freedom of speech, freedom of worship, freedom from want, and freedom from fear. They gave World War II a moral and ideological purpose.", "Think ideology plus security."),
  chapter22Flashcard("chapter22-fc-002", "Term", "Good Neighbor Policy", "Roosevelt’s Good Neighbor Policy emphasized nonintervention in Latin America rather than direct military occupation. It marked a diplomatic shift before World War II.", "Neighbor, not occupier."),
  chapter22Flashcard("chapter22-fc-003", "Term", "Neutrality Acts", "The Neutrality Acts were 1930s laws meant to keep the United States out of another foreign war by restricting aid to belligerents.", "Law before Lend-Lease."),
  chapter22Flashcard("chapter22-fc-004", "Term", "Lend-Lease Act", "Lend-Lease let the United States send war supplies to Allied nations without immediate payment. It made the nation the arsenal of democracy before formal entry into the war.", "Aid before war."),
  chapter22Flashcard("chapter22-fc-005", "Term", "Atlantic Charter", "The Atlantic Charter was a 1941 statement of Allied principles including self-determination, no territorial aggrandizement, and postwar peace. It raised hopes that empire would give way to freedom.", "Promises bigger than practice."),
  chapter22Flashcard("chapter22-fc-006", "Term", "War Production Board", "The War Production Board coordinated industrial conversion and wartime priorities. It symbolized the managed wartime economy.", "Factory command center."),
  chapter22Flashcard("chapter22-fc-007", "Term", "Office of War Information", "The Office of War Information coordinated wartime propaganda and public messaging. It helped shape how Americans understood freedom and sacrifice.", "Government storytelling office."),
  chapter22Flashcard("chapter22-fc-008", "Term", "bracero program", "The bracero program brought Mexican workers into the United States during the war to fill labor shortages. It changed wartime migration and labor patterns.", "Labor shortage solution."),
  chapter22Flashcard("chapter22-fc-009", "Term", "Japanese-American internment", "Internment was the forced removal and confinement of Japanese Americans during World War II. It is one of the clearest examples of the limits of wartime freedom.", "Freedom denied at home."),
  chapter22Flashcard("chapter22-fc-010", "Term", "Korematsu v. United States", "Korematsu was the 1944 Supreme Court case that upheld Japanese-American exclusion. It showed judicial deference to wartime executive power.", "Security over liberty case."),
  chapter22Flashcard("chapter22-fc-011", "Term", "double-V", "The Double V campaign demanded victory over fascism abroad and racism at home. It tied military service to black civil rights claims.", "Two victories, one demand."),
  chapter22Flashcard("chapter22-fc-012", "Term", "GI Bill of Rights", "The GI Bill gave veterans education, housing, and economic benefits. It helped create the postwar middle class while still operating within unequal systems.", "Service into suburbia."),
  chapter22Flashcard("chapter22-fc-013", "Term", "Manhattan Project", "The Manhattan Project was the secret federal scientific effort that built the atomic bomb. It led directly to the bombings of Hiroshima and Nagasaki.", "Science plus secrecy."),
  chapter22Flashcard("chapter22-fc-014", "Term", "Bretton Woods conference", "Bretton Woods planned the postwar financial order and created institutions such as the IMF and World Bank. It placed the United States at the center of global finance.", "Money order for the American Century."),
  chapter22Flashcard("chapter22-fc-015", "Term", "United Nations", "The United Nations was created in 1945 to promote peace and collective security. It reflected Roosevelt’s belief in a postwar international order.", "League replacement with U.S. backing."),
  chapter22Flashcard("chapter22-fc-016", "Person", "Franklin D. Roosevelt", "Roosevelt led the United States from depression into World War II and framed the conflict through the Four Freedoms. He also guided the nation away from neutrality before Pearl Harbor.", "Intervention plus freedom rhetoric."),
  chapter22Flashcard("chapter22-fc-017", "Person", "A. Philip Randolph", "Randolph was a black labor leader whose threatened March on Washington helped force Executive Order 8802 and the FEPC.", "Pressure created FEPC."),
  chapter22Flashcard("chapter22-fc-018", "Person", "Harry S. Truman", "Truman inherited the presidency in April 1945, oversaw the war’s final phase against Japan, and approved use of atomic bombs. He entered office as the postwar world was forming.", "April 1945 transition."),
  chapter22Flashcard("chapter22-fc-019", "Person", "Gunnar Myrdal", "Myrdal wrote An American Dilemma, which argued that segregation contradicted American democratic ideals. His work gave civil rights advocates a major interpretive framework.", "Democracy versus racism."),
  chapter22Flashcard("chapter22-fc-020", "Person", "Fred Korematsu", "Korematsu challenged wartime exclusion orders and lost in the Supreme Court in 1944. His case became a symbol of civil liberties failure during wartime.", "Name tied to exclusion."),
  chapter22Flashcard("chapter22-fc-021", "Event", "Pearl Harbor", "Japan’s attack on Pearl Harbor on December 7, 1941 brought the United States directly into World War II and ended the intervention debate.", "December 7 turning point."),
  chapter22Flashcard("chapter22-fc-022", "Event", "Battle of Midway", "Midway was a major 1942 naval victory that shifted momentum in the Pacific. It marked a turning point against Japan.", "Pacific turning point."),
  chapter22Flashcard("chapter22-fc-023", "Event", "Executive Order 8802", "Executive Order 8802 banned discrimination in defense jobs and created the FEPC. It marked a limited but important federal civil rights action.", "Civil rights through wartime pressure."),
  chapter22Flashcard("chapter22-fc-024", "Event", "Executive Order 9066", "Executive Order 9066 enabled the removal of Japanese Americans from the West Coast. It became a key symbol of wartime repression.", "Security panic plus racism."),
  chapter22Flashcard("chapter22-fc-025", "Event", "Atomic bombings of Hiroshima and Nagasaki", "The atomic bombings forced Japan’s surrender and began the atomic age. They remain central to debates over military necessity and morality.", "War’s end, new danger."),
  chapter22Flashcard("chapter22-fc-026", "Concept", "arsenal of democracy", "The phrase described the idea that American industrial power should supply the fight against fascism even before direct entry into war.", "Factories as weapons."),
  chapter22Flashcard("chapter22-fc-027", "Concept", "freedom from want", "Freedom from want expanded liberty to include material security and social welfare, not just civil liberties.", "Not just rights, but security."),
  chapter22Flashcard("chapter22-fc-028", "Concept", "The Fifth Freedom", "The Fifth Freedom was a business-backed claim that true liberty meant free enterprise and consumer choice. It competed with New Deal definitions of freedom.", "Market version of freedom."),
  chapter22Flashcard("chapter22-fc-029", "Concept", "American Century", "The American Century was the idea that U.S. power would shape the postwar world. It captured the chapter’s global dimension.", "Global leadership slogan."),
  chapter22Flashcard("chapter22-fc-030", "Document", "Atlantic Charter", "The Atlantic Charter set out wartime principles such as self-determination and postwar peace. It inspired anti-colonial hopes but was only partially fulfilled.", "Promises bigger than practice."),
  chapter22Flashcard("chapter22-fc-031", "Document", "Economic Bill of Rights", "Roosevelt’s Economic Bill of Rights argued that real freedom required jobs, housing, health care, and security. It extended New Deal ideas into the postwar future.", "New Deal freedom extended."),
  chapter22Flashcard("chapter22-fc-032", "Cause-Effect", "How did Pearl Harbor change U.S. policy?", "Pearl Harbor ended the intervention debate and triggered full-scale war mobilization at home and abroad.", "Attack to total war."),
  chapter22Flashcard("chapter22-fc-033", "Cause-Effect", "How did wartime migration affect civil rights?", "Migration to defense centers created new black political leverage, community networks, and racial tension that strengthened civil rights activism.", "Migration changed power."),
  chapter22Flashcard("chapter22-fc-034", "Cause-Effect", "How did World War II shape the postwar economy?", "Through the GI Bill, Sunbelt growth, and Bretton Woods, the war laid foundations for postwar prosperity and global economic leadership.", "Victory shaped prosperity."),
  chapter22Flashcard("chapter22-fc-035", "Visual", "What does this image show and why is it significant?", "It shows the Four Freedoms poster that popularized Roosevelt’s wartime ideals. The image is significant because it turned intervention into a moral defense of democracy and economic security.", "Rockwell made ideology visible.", { imageId: "chapter22-img-001" }),
  chapter22Flashcard("chapter22-fc-036", "Visual", "What does this image show and why is it significant?", "It shows a cartoon arguing that the Atlantic no longer protected the United States from European war. It is significant because it captures the collapse of classic isolationist assumptions.", "Ocean as shrinking barrier.", { imageId: "chapter22-img-002" }),
  chapter22Flashcard("chapter22-fc-037", "Visual", "What does this image show and why is it significant?", "It shows Pearl Harbor under attack. The image matters because it symbolizes the moment the United States entered World War II and embraced full mobilization.", "Smoke ends the debate.", { imageId: "chapter22-img-003" }),
  chapter22Flashcard("chapter22-fc-038", "Visual", "What does this image show and why is it significant?", "It shows Fumiko Hayashida and her child awaiting internment. The image matters because it captures the racialized limits of wartime freedom and citizenship.", "Tags like luggage.", { imageId: "chapter22-img-004" }),
  chapter22Flashcard("chapter22-fc-039", "Visual", "What does this image show and why is it significant?", "It shows black servicemen flashing the Double V sign. The image is significant because it connects wartime service to the demand for racial equality at home.", "Two victories, one claim.", { imageId: "chapter22-img-005" }),
  chapter22Flashcard("chapter22-fc-040", "Visual", "What does this image show and why is it significant?", "It shows Hiroshima after the atomic bomb. The image is significant because it reveals the civilian destruction of total war and the opening of the atomic age.", "War ends, atomic age begins.", { imageId: "chapter22-img-006" })
];

const chapter22Figure = (name, title, bio, significance, perspective, imageId = null) => ({
  name,
  title,
  bio,
  significance,
  perspective,
  imageId
});

const chapter22SectionImage = (imageId, displayCaption, placement = "after-paragraph") => ({
  imageId,
  placement,
  displayCaption
});

const chapter22NotesSections = [
  {
    sectionTitle: "From Neutrality to Intervention",
    apThemes: ["America in the World", "Politics and Power", "American and National Identity"],
    narrative: "In the 1930s many Americans interpreted World War I as a warning against foreign entanglements, so neutrality had deep political support. Yet Japanese expansion in Asia and Nazi aggression in Europe steadily weakened the idea that the United States could remain detached from world events. Franklin D. Roosevelt moved carefully because public opinion remained divided, but measures such as rearmament, the draft, and Lend-Lease pushed the nation closer to the Allied side. The Four Freedoms speech and the Atlantic Charter reframed intervention as a defense of democratic ideals rather than a repeat of 1917. By late 1941 the United States had not formally declared war, but neutrality had already been hollowed out by policy, propaganda, and strategic commitment.",
    causes: [
      "Memories of World War I and the Nye hearings encouraged isolationism.",
      "Axis expansion in Manchuria, China, and Europe made global war harder to avoid."
    ],
    effects: [
      "The federal government increased military preparedness before formal entry into the war.",
      "Roosevelt created an ideological case for involvement through the Four Freedoms and Atlantic Charter."
    ],
    significance: "This section matters because APUSH questions often ask students to trace how the United States moved from neutrality to undeclared support for the Allies.",
    connections: [
      "Links to Wilsonian internationalism earlier in Period 7 and Cold War global commitments in Period 8."
    ],
    sectionImages: [
      chapter22SectionImage("chapter22-img-001", "Rockwell’s Four Freedoms poster turned Roosevelt’s language into wartime mass culture."),
      chapter22SectionImage("chapter22-img-002", "The cartoon shows why many Americans stopped believing the Atlantic Ocean guaranteed safety.", "after-causes")
    ],
    keyFigures: [
      chapter22Figure(
        "Franklin D. Roosevelt",
        "President of the United States",
        "Roosevelt guided the nation from depression-era reform into wartime mobilization. Before Pearl Harbor, he used speeches and policy shifts to move public opinion toward aid for the Allies.",
        "He linked intervention to democratic ideals and expanded presidential leadership in foreign policy.",
        "Internationalist New Dealer committed to anti-fascist intervention."
      )
    ],
    primarySourceConnections: [
      "Franklin D. Roosevelt’s Four Freedoms address (1941)",
      "Atlantic Charter (1941)"
    ]
  },
  {
    sectionTitle: "Pearl Harbor and the Global War",
    apThemes: ["America in the World", "Politics and Power", "Work, Exchange, Technology"],
    narrative: "The Japanese attack on Pearl Harbor ended the political debate over intervention by bringing the United States openly into World War II. American leaders then fought two connected wars, one against Japan in the Pacific and one against Germany and Italy in Europe, while coordinating strategy with Britain and the Soviet Union. Industrial production, naval power, and scientific capacity became central to victory, making the conflict a test of economic strength as much as military courage. Battles such as Midway and D-Day showed how American resources could be translated into global force over time. The war also confirmed that the United States would emerge not as a temporary participant in world affairs but as a permanent superpower.",
    causes: [
      "Japanese imperial expansion and American embargo pressure escalated tensions in the Pacific.",
      "German victories in Europe made Allied survival depend on outside assistance and eventually direct American action."
    ],
    effects: [
      "War production ended mass unemployment and expanded federal coordination of the economy.",
      "The United States became deeply entangled in global alliances and postwar planning."
    ],
    significance: "APUSH often tests how Pearl Harbor transformed both public opinion and the scale of federal mobilization.",
    connections: [
      "Prefigures the military-industrial state of the Cold War and later interventionism."
    ],
    sectionImages: [
      chapter22SectionImage("chapter22-img-003", "Pearl Harbor became the visual shorthand for the end of American nonintervention.")
    ],
    keyFigures: [
      chapter22Figure(
        "Winston Churchill",
        "Prime Minister of Great Britain",
        "Churchill worked closely with Roosevelt to sustain Britain and plan Allied strategy. His partnership with Roosevelt helped define the Grand Alliance and the Atlantic Charter vision.",
        "He shaped the diplomatic and military coordination that made Allied victory possible.",
        "British anti-Nazi wartime leader."
      ),
      chapter22Figure(
        "Joseph Stalin",
        "Leader of the Soviet Union",
        "Stalin commanded the Eastern Front, where Nazi Germany suffered enormous losses. American cooperation with Stalin reflected wartime necessity rather than ideological agreement.",
        "His role explains both Allied victory and later Cold War tension.",
        "Communist leader allied temporarily with the United States against fascism."
      )
    ],
    primarySourceConnections: [
      "Pearl Harbor address to Congress (1941)",
      "Atlantic Charter (1941)"
    ]
  },
  {
    sectionTitle: "Mobilizing the Home Front",
    apThemes: ["Work, Exchange, Technology", "Politics and Power", "Culture and Society"],
    narrative: "World War II turned the federal government into the central organizer of production, labor allocation, prices, and propaganda. Agencies such as the War Production Board, War Manpower Commission, and Office of Price Administration managed the conversion from depression economy to war economy. Large corporations benefited from federal contracts and new plants, while unions accepted a no-strike pledge and gained members as employment surged. Wartime production tied freedom to abundance, employment, and social security, but business leaders also tried to redefine freedom as the preservation of free enterprise. The home front therefore mixed expanded state power, corporate growth, and mass democratic participation rather than fitting neatly into either laissez-faire or welfare-state categories.",
    causes: [
      "The scale of global war required unprecedented production and manpower coordination.",
      "The failure of the interwar economy made full employment politically attractive."
    ],
    effects: [
      "Federal authority over prices, labor, and industrial priorities expanded sharply.",
      "The wartime boom redistributed population and investment toward the South and West."
    ],
    significance: "This material is central to APUSH questions about the relationship between war, economic growth, and the modern state.",
    connections: [
      "Builds on New Deal experimentation and feeds into postwar Sunbelt growth."
    ],
    sectionImages: [],
    keyFigures: [
      chapter22Figure(
        "Norman Rockwell",
        "Illustrator",
        "Rockwell’s paintings of the Four Freedoms helped transform Roosevelt’s abstract language into familiar wartime images. His work became a bridge between federal propaganda and mass culture.",
        "He shows how visual culture helped define the meaning of wartime freedom.",
        "Popular artist translating national ideals into everyday imagery."
      )
    ],
    primarySourceConnections: [
      "Office of War Information propaganda",
      "FDR’s Economic Bill of Rights speech (1944)"
    ]
  },
  {
    sectionTitle: "Freedom, Race, and Social Conflict",
    apThemes: ["American and National Identity", "Culture and Society", "Politics and Power"],
    narrative: "The language of the Four Freedoms encouraged many Americans to connect victory abroad with reform at home, but war also exposed deep inequalities. Mexican American communities confronted discrimination, the bracero program brought new labor migration, and Native people entered wartime industries and military service in large numbers. Black Americans pressed hardest on the contradiction between anti-fascist rhetoric and segregation, using A. Philip Randolph’s pressure campaign, the FEPC, CORE, and the Double V movement to demand meaningful change. Women found new wage work and public visibility, yet wartime propaganda still celebrated the patriarchal family and treated many gains as temporary. The result was not a completed democratic revolution but a widening of expectations that would feed later civil rights, feminist, and labor struggles.",
    causes: [
      "Mass mobilization created labor shortages and new migration.",
      "Wartime rhetoric made older systems of hierarchy easier to challenge publicly."
    ],
    effects: [
      "Civil rights activism gained new organizational strength and federal leverage.",
      "Social tensions produced conflicts such as the zoot suit riots and the Detroit race riot."
    ],
    significance: "This section matters because AP exam questions often ask students to evaluate how far World War II changed social relations inside the United States.",
    connections: [
      "Sets up the postwar civil rights movement and later debates over gender roles and citizenship."
    ],
    sectionImages: [
      chapter22SectionImage("chapter22-img-005", "The Double V sign turned wartime service into a demand for racial democracy at home.")
    ],
    keyFigures: [
      chapter22Figure(
        "A. Philip Randolph",
        "Labor and civil rights leader",
        "Randolph threatened a March on Washington to protest discrimination in defense jobs. Roosevelt responded with Executive Order 8802, which created the Fair Employment Practices Commission.",
        "He showed how black activism could force federal action even before the modern civil rights movement.",
        "Black labor activist demanding federal intervention against discrimination."
      ),
      chapter22Figure(
        "Gunnar Myrdal",
        "Social scientist",
        "Myrdal’s book An American Dilemma argued that segregation contradicted the nation’s stated democratic ideals. His work gave reformers a widely cited framework for linking racism to national hypocrisy.",
        "He helped define segregation as a moral and political problem rather than merely a local custom.",
        "External critic of American racism using liberal social science."
      )
    ],
    primarySourceConnections: [
      "Executive Order 8802 (1941)",
      "Double V campaign materials"
    ]
  },
  {
    sectionTitle: "Japanese-American Internment and the Limits of Liberty",
    apThemes: ["American and National Identity", "Politics and Power", "Migration and Settlement"],
    narrative: "Japanese-American internment most clearly revealed the limits of wartime freedom. After Pearl Harbor, military and civilian officials cast Japanese ancestry as a security threat even though no comparable mass removal targeted German or Italian Americans. Executive Order 9066 uprooted more than 100,000 people, most of them American citizens, from the Pacific Coast and confined them in camps. The Supreme Court’s Korematsu decision upheld removal, showing how wartime emergency could narrow constitutional protections when race and national security were fused. Internment became one of the chapter’s clearest examples of how inclusion expanded for some Americans while exclusion deepened for others.",
    causes: [
      "Anti-Asian racism on the West Coast shaped how wartime fear was interpreted.",
      "Pearl Harbor created political space for sweeping executive and military action."
    ],
    effects: [
      "Japanese Americans lost homes, businesses, and freedom of movement.",
      "Later generations treated internment as evidence of the danger of racialized wartime policy."
    ],
    significance: "Internment frequently appears in APUSH prompts about civil liberties, wartime power, and the boundaries of citizenship.",
    connections: [
      "Can be compared with earlier nativism in the 1920s and later national security controversies."
    ],
    sectionImages: [
      chapter22SectionImage("chapter22-img-004", "The Hayashida photograph personalizes the human cost of internment.")
    ],
    keyFigures: [
      chapter22Figure(
        "Fred Korematsu",
        "Japanese-American civil liberties challenger",
        "Korematsu resisted wartime exclusion and brought one of the most famous civil liberties cases of the era. Although he lost in 1944, his case became a lasting symbol of unconstitutional wartime overreach.",
        "He represents judicial deference to wartime power and the later critique of that deference.",
        "Citizen challenging racialized state power."
      )
    ],
    primarySourceConnections: [
      "Executive Order 9066 (1942)",
      "Korematsu v. United States (1944)"
    ]
  },
  {
    sectionTitle: "Postwar Freedom, the Atomic Age, and Global Leadership",
    apThemes: ["America in the World", "Politics and Power", "Work, Exchange, Technology"],
    narrative: "As victory approached, Americans argued over what kind of freedom the war should secure in peacetime. Some New Dealers envisioned full employment, social welfare, and an Economic Bill of Rights, while conservatives warned that planning could slide toward collectivism, a fear popularized by The Road to Serfdom. At the same time American leaders designed a postwar order through Bretton Woods, the United Nations, and great-power summit diplomacy. Truman’s decision to use atomic bombs on Hiroshima and Nagasaki ended the war against Japan but also opened the atomic age and raised enduring moral and strategic questions. By 1945 the United States stood at the center of the world economy and the emerging international order, yet peace arrived alongside new tensions with the Soviet Union and unresolved debates over empire, race, and social democracy.",
    causes: [
      "Allied leaders expected American power to shape the postwar settlement.",
      "Wartime mobilization encouraged competing visions of what economic security and freedom should mean."
    ],
    effects: [
      "The United States helped construct institutions for postwar finance and diplomacy.",
      "Atomic warfare intensified the scale of American power and the stakes of future conflict."
    ],
    significance: "This section is vital for connecting World War II to the Cold War and to debates over the postwar welfare state.",
    connections: [
      "Transitions directly into Period 8 themes of containment, prosperity, and ideological conflict."
    ],
    sectionImages: [
      chapter22SectionImage("chapter22-img-006", "Hiroshima made the destructive capacity of the atomic age impossible to ignore.")
    ],
    keyFigures: [
      chapter22Figure(
        "Harry S. Truman",
        "President of the United States",
        "Truman inherited the presidency after Roosevelt’s death in April 1945 and made the final wartime decisions against Japan. He also entered office as relations with the Soviet Union were worsening.",
        "He bridged the end of World War II and the start of the Cold War.",
        "Cold War-era liberal internationalist shaped by wartime necessity."
      ),
      chapter22Figure(
        "Friedrich Hayek",
        "Political economist",
        "Hayek warned in The Road to Serfdom that excessive state planning could threaten liberty. His work gave wartime and postwar conservatives a powerful language for defending markets and limiting the welfare state.",
        "He represents the ideological challenge to New Deal and wartime visions of managed capitalism.",
        "Free-market critic of collectivist planning."
      )
    ],
    primarySourceConnections: [
      "Franklin D. Roosevelt’s Economic Bill of Rights speech (1944)",
      "United Nations Charter (1945)"
    ]
  }
];

const chapter22TimelineEvent = (
  id,
  year,
  title,
  summary,
  fullDescription,
  categories,
  apThemes,
  keyFigures,
  causes,
  effects,
  significance,
  imageId = null,
  month = null,
  connectedEventIds = []
) => ({
  id,
  chapterId: "chapter22",
  periodId: "p7",
  year,
  month,
  title,
  summary,
  fullDescription,
  categories,
  apThemes,
  keyFigures,
  causes,
  effects,
  connectedEventIds,
  significance,
  apPriority: true,
  imageId
});

const chapter22PeriodTimeline = [
  chapter22TimelineEvent(
    "chapter22-four-freedoms-speech",
    1941,
    "Four Freedoms speech",
    "Roosevelt broadened the wartime meaning of freedom to include both civil liberties and economic security.",
    "Roosevelt’s 1941 State of the Union speech named freedom of speech, freedom of worship, freedom from want, and freedom from fear as universal goals. He used the language to justify aid to countries fighting fascism and widened the meaning of liberty beyond simple noninterference.",
    ["Political"],
    ["Politics and Power", "America in the World"],
    ["Franklin D. Roosevelt"],
    ["Need to build support for intervention", "Growing threat from Axis powers"],
    ["Provided a moral vocabulary for the war effort", "Expanded the meaning of freedom beyond simple political rights"],
    "High",
    "chapter22-img-001",
    1
  ),
  chapter22TimelineEvent(
    "chapter22-pearl-harbor",
    1941,
    "Attack on Pearl Harbor",
    "Pearl Harbor pulled the United States into World War II and ended the intervention debate.",
    "On December 7, 1941, Japanese aircraft attacked Pearl Harbor in Hawaii. The attack killed more than two thousand Americans, unified public opinion behind the war, and triggered full military and economic mobilization.",
    ["Military"],
    ["America in the World", "Politics and Power"],
    ["Franklin D. Roosevelt"],
    ["Japanese expansionism", "Escalating U.S.-Japanese tensions over empire and embargoes"],
    ["United States formally entered World War II", "Triggered full military and economic mobilization"],
    "High",
    "chapter22-img-003",
    12
  ),
  chapter22TimelineEvent(
    "chapter22-executive-order-8802",
    1941,
    "Executive Order 8802",
    "Roosevelt created the FEPC under pressure from black activists demanding equal access to defense jobs.",
    "Roosevelt issued Executive Order 8802 after A. Philip Randolph threatened a March on Washington. The order banned discrimination in defense industries and created the Fair Employment Practices Commission, marking limited but important federal civil rights action.",
    ["Political"],
    ["Politics and Power", "American and National Identity"],
    ["A. Philip Randolph", "Franklin D. Roosevelt"],
    ["Discrimination in defense employment", "Threat of a March on Washington"],
    ["Created the FEPC", "Gave civil rights activists a precedent for later federal action"],
    "High",
    null,
    6
  ),
  chapter22TimelineEvent(
    "chapter22-executive-order-9066",
    1942,
    "Executive Order 9066",
    "The federal government authorized the removal and confinement of Japanese Americans from the West Coast.",
    "Executive Order 9066 cleared the way for the removal and confinement of Japanese Americans during World War II. It revealed the racialized limits of wartime civil liberties and became one of the era’s starkest contradictions to freedom rhetoric.",
    ["Political"],
    ["American and National Identity", "Politics and Power"],
    ["Franklin D. Roosevelt"],
    ["Pearl Harbor panic", "Longstanding racial prejudice against Japanese Americans"],
    ["Mass forced removal and camp confinement", "Later criticism of wartime constitutional failures"],
    "High",
    "chapter22-img-004",
    2
  ),
  chapter22TimelineEvent(
    "chapter22-gi-bill",
    1944,
    "GI Bill of Rights",
    "The GI Bill linked wartime service to education, housing, and the making of the postwar middle class.",
    "The GI Bill provided veterans with educational, housing, and unemployment benefits. It tied wartime service to postwar economic opportunity and helped create modern middle-class America, even though discrimination limited equal access in practice.",
    ["Economic"],
    ["Work, Exchange, Technology", "Politics and Power"],
    [],
    ["Need to manage demobilization", "Desire to avoid postwar unemployment and unrest"],
    ["Expanded higher education and homeownership", "Strengthened the postwar middle class while reproducing inequalities"],
    "High"
  ),
  chapter22TimelineEvent(
    "chapter22-bretton-woods",
    1944,
    "Bretton Woods conference",
    "The Allies created a postwar financial framework centered on American power.",
    "At Bretton Woods in 1944, Allied leaders designed a postwar international economic system that led to the IMF and World Bank. The conference placed the United States at the center of global finance and reflected the lesson that depression could threaten peace.",
    ["Diplomatic"],
    ["America in the World", "Work, Exchange, Technology"],
    [],
    ["Desire to avoid another global depression", "Expectation of major American postwar influence"],
    ["Created institutions for global finance", "Reinforced U.S. leadership in the postwar economy"],
    "High",
    null,
    7
  ),
  chapter22TimelineEvent(
    "chapter22-atomic-bombs-on-japan",
    1945,
    "Atomic bombings of Hiroshima and Nagasaki",
    "The bombings forced Japan’s surrender and ushered in the atomic age.",
    "In August 1945 the United States dropped atomic bombs on Hiroshima and Nagasaki. The bombings ended the war against Japan, opened the atomic age, and transformed postwar diplomacy, military strategy, and debates over morality in war.",
    ["Military"],
    ["America in the World", "Work, Exchange, Technology"],
    ["Harry S. Truman"],
    ["Desire to force Japanese surrender", "Availability of atomic weapons through the Manhattan Project"],
    ["Ended the war with Japan", "Began the atomic age and intensified postwar strategic tension"],
    "High",
    "chapter22-img-006",
    8
  )
];

const chapter22Vocab = (term, definition, context, apRelevance = "Yes.") => ({
  term,
  definition,
  context,
  apRelevance
});

const chapter22Vocabulary = [
  chapter22Vocab("Four Freedoms", "Roosevelt’s 1941 formulation of freedom of speech, freedom of worship, freedom from want, and freedom from fear.", "The chapter uses the Four Freedoms to show how wartime ideology expanded the language of liberty.", "Yes. It often appears in questions about wartime ideology, propaganda, and the meaning of freedom."),
  chapter22Vocab("Good Neighbor Policy", "A 1930s policy of nonintervention and cooperation toward Latin America.", "The chapter shows that Roosevelt paired hemispheric nonintervention with growing concern over Axis influence.", "Yes. It helps explain U.S. diplomacy before World War II and contrasts with later interventionism."),
  chapter22Vocab("isolationism", "A preference for avoiding political and military involvement in foreign wars and alliances.", "Isolationism shaped the Neutrality Acts and the pre-Pearl Harbor political climate.", "Yes. It is central to questions about the road from neutrality to war."),
  chapter22Vocab("Neutrality Acts", "Laws passed in the 1930s to keep the United States out of foreign wars by restricting trade and aid to belligerents.", "The chapter presents them as a legal expression of interwar disillusionment.", "Yes. They are common evidence in APUSH essays on the 1930s."),
  chapter22Vocab("Lend-Lease Act", "A 1941 law letting the United States supply Allied nations with war materials without immediate payment.", "Lend-Lease made the United States the arsenal of democracy before official entry into the war.", "Yes. It is often used to show how neutrality eroded before Pearl Harbor."),
  chapter22Vocab("Atlantic Charter", "A 1941 statement of principles by Roosevelt and Churchill outlining Allied war aims and postwar hopes.", "The chapter links it to self-determination, economic cooperation, and later postwar contradictions.", "Yes. It is useful for essays about wartime ideals and decolonization."),
  chapter22Vocab("Axis powers", "The alliance of Germany, Italy, and Japan during World War II.", "The chapter frames American policy as increasingly focused on stopping Axis expansion.", "Yes. It provides essential context for nearly every World War II question."),
  chapter22Vocab("D-Day", "The Allied invasion of Nazi-occupied France on June 6, 1944.", "The chapter uses D-Day to show the scale of Allied coordination and delayed second-front strategy.", "Yes. It often appears in timeline and war strategy questions."),
  chapter22Vocab("Holocaust", "The Nazi campaign of genocide against Jews and other targeted groups during World War II.", "Liberated camp images in the chapter show the human cost of total war and fascism.", "Yes. It appears in questions about the moral stakes of World War II."),
  chapter22Vocab("GI Bill of Rights", "A 1944 law providing veterans with education, housing, and economic benefits.", "The chapter uses it to connect wartime service to the making of postwar America.", "Yes. It appears in questions on postwar prosperity and inequality."),
  chapter22Vocab("bracero program", "A wartime labor agreement that brought Mexican workers into the United States for agricultural and other jobs.", "The chapter connects the program to labor shortages and changing migration patterns.", "Yes. It appears in questions about wartime labor and Mexican American history."),
  chapter22Vocab("zoot suit riots", "1943 attacks in Los Angeles targeting Mexican American youths associated with zoot-suit style.", "The chapter uses the riots to show the racial tensions of the wartime home front.", "Yes. They are useful evidence about limits of wartime unity."),
  chapter22Vocab("Japanese-American internment", "The forced removal and confinement of Japanese Americans during World War II.", "The chapter presents internment as the clearest example of the era’s limits on liberty.", "Yes. It is frequently used in FRQs about civil liberties."),
  chapter22Vocab("Korematsu v. United States", "The 1944 Supreme Court case upholding Japanese-American exclusion.", "The chapter treats the case as a symbol of wartime judicial deference.", "Yes. It is a major constitutional example for APUSH."),
  chapter22Vocab("second Great Migration", "The wartime movement of large numbers of African Americans from the rural South to urban and western defense centers.", "The chapter links this migration to labor demand, new activism, and racial conflict.", "Yes. It supports essays on civil rights and demographic change."),
  chapter22Vocab("double-V", "A wartime black campaign calling for victory over fascism abroad and racism at home.", "The chapter presents it as a powerful expression of wartime black citizenship claims.", "Yes. It is strong evidence for questions on wartime civil rights."),
  chapter22Vocab("V-E Day", "Victory in Europe Day, marking Nazi Germany’s surrender in May 1945.", "The chapter treats V-E Day as a major milestone even though the Pacific war still continued.", "Yes. It is useful for chronology and the war’s final phase."),
  chapter22Vocab("Manhattan Project", "The secret wartime research effort that developed the atomic bomb.", "The chapter uses the project to explain Truman’s options in 1945 and the opening of the atomic age.", "Yes. It is essential context for questions on the war’s end and the postwar world."),
  chapter22Vocab("Yalta conference", "A 1945 meeting of Roosevelt, Churchill, and Stalin to discuss the postwar settlement.", "The chapter highlights Yalta as both an act of cooperation and a source of later Cold War conflict.", "Yes. It is useful for essays linking World War II to the Cold War."),
  chapter22Vocab("Bretton Woods conference", "The 1944 meeting that planned postwar international financial institutions such as the IMF and World Bank.", "The chapter presents it as a sign of American leadership in the coming global economy.", "Yes. It supports questions about the American Century and postwar order.")
];

const chapter22EssayPractice = {
  saq: [
    {
      id: "chapter22-saq-001",
      chapterId: "chapter22",
      stimulusType: "image",
      stimulusImageId: "chapter22-img-001",
      stimulusCaption: "Office of War Information poster based on Norman Rockwell’s Four Freedoms",
      prompt: "Answer all parts of the question that follows. Refer to the image as needed.",
      partA: "Describe ONE idea about World War II that the image was designed to communicate to Americans.",
      partB: "Explain ONE way the image reflected changes in United States foreign policy between 1937 and 1941.",
      partC: "Explain ONE limitation of the image as evidence for actual freedom in the United States during the war.",
      scoringGuidance: {
        partA: "Identify that the image presented the war as a defense of democratic freedom or universal rights.",
        partB: "Explain a move from neutrality toward intervention, such as Lend-Lease, the draft, or the Four Freedoms speech.",
        partC: "Explain that propaganda ideals coexisted with segregation, internment, or gender limits."
      }
    },
    {
      id: "chapter22-saq-002",
      chapterId: "chapter22",
      stimulusType: "text",
      stimulusText: "“They desire no territorial changes that do not accord with the freely expressed wishes of the peoples concerned.”",
      stimulusCaption: "Atlantic Charter, 1941",
      prompt: "Answer all parts of the question that follows. Refer to the excerpt as needed.",
      partA: "Describe ONE goal of the Allied war effort reflected in the excerpt.",
      partB: "Explain ONE reason the excerpt appealed to colonized peoples around the world.",
      partC: "Explain ONE reason the promises in the excerpt were only partially fulfilled after the war.",
      scoringGuidance: {
        partA: "Identify self-determination, anti-aggression, or democratic consent.",
        partB: "Explain that colonized peoples read the language as support for independence.",
        partC: "Explain that imperial powers often kept control or interpreted self-government selectively."
      }
    },
    {
      id: "chapter22-saq-003",
      chapterId: "chapter22",
      stimulusType: "none",
      prompt: "Answer all parts of the question that follows.",
      partA: "Describe ONE reason many Americans supported isolationism in the 1930s.",
      partB: "Explain ONE development between 1939 and 1941 that weakened isolationism.",
      partC: "Explain ONE way American policy before Pearl Harbor still differed from full wartime intervention.",
      scoringGuidance: {
        partA: "Explain World War I disillusionment, the Nye hearings, or fear of entanglement.",
        partB: "Explain Lend-Lease, the draft, or Axis military expansion.",
        partC: "Explain that the United States had not yet declared war or deployed full combat forces."
      }
    },
    {
      id: "chapter22-saq-004",
      chapterId: "chapter22",
      stimulusType: "image",
      stimulusImageId: "chapter22-img-004",
      stimulusCaption: "Fumiko Hayashida awaiting relocation to an internment camp",
      prompt: "Answer all parts of the question that follows. Refer to the image as needed.",
      partA: "Describe ONE historical development that led to the scene shown in the image.",
      partB: "Explain ONE reason the policy shown in the image is considered a major wartime contradiction.",
      partC: "Explain ONE argument used at the time to justify the policy shown in the image.",
      scoringGuidance: {
        partA: "Explain Pearl Harbor and Executive Order 9066.",
        partB: "Explain the conflict between freedom rhetoric and racialized exclusion of citizens.",
        partC: "Explain that officials invoked military necessity and security fears."
      }
    },
    {
      id: "chapter22-saq-005",
      chapterId: "chapter22",
      stimulusType: "text",
      stimulusText: "“We loyal Negro-American citizens demand the right to work and fight for our country.”",
      stimulusCaption: "Wartime black protest rhetoric",
      prompt: "Answer all parts of the question that follows. Refer to the excerpt as needed.",
      partA: "Describe ONE grievance expressed in the excerpt.",
      partB: "Explain ONE federal response to the pressure reflected in the excerpt.",
      partC: "Explain ONE limit of that federal response.",
      scoringGuidance: {
        partA: "Identify exclusion from defense jobs or unequal citizenship.",
        partB: "Identify Executive Order 8802 and the FEPC.",
        partC: "Explain weak enforcement or continued segregation."
      }
    },
    {
      id: "chapter22-saq-006",
      chapterId: "chapter22",
      stimulusType: "none",
      prompt: "Answer all parts of the question that follows.",
      partA: "Describe ONE way World War II changed women’s lives.",
      partB: "Explain ONE reason those changes did not fully overturn traditional gender roles.",
      partC: "Explain ONE way wartime propaganda reflected that tension.",
      scoringGuidance: {
        partA: "Describe new defense work or military-related service opportunities.",
        partB: "Explain expectations of postwar domesticity or male breadwinner norms.",
        partC: "Explain that propaganda mixed Rosie imagery with family-centered ideals."
      }
    },
    {
      id: "chapter22-saq-007",
      chapterId: "chapter22",
      stimulusType: "image",
      stimulusImageId: "chapter22-img-005",
      stimulusCaption: "Black servicemen flashing the Double V sign",
      prompt: "Answer all parts of the question that follows. Refer to the image as needed.",
      partA: "Describe ONE idea communicated by the symbol shown in the image.",
      partB: "Explain ONE wartime experience that made the symbol especially powerful for African Americans.",
      partC: "Explain ONE later historical movement that built on the same logic as the symbol.",
      scoringGuidance: {
        partA: "Identify victory over fascism abroad and racism at home.",
        partB: "Explain segregation in the military, defense work discrimination, or migration and protest.",
        partC: "Explain the postwar civil rights movement."
      }
    },
    {
      id: "chapter22-saq-008",
      chapterId: "chapter22",
      stimulusType: "text",
      stimulusText: "“True individual freedom cannot exist without economic security and independence.”",
      stimulusCaption: "Franklin D. Roosevelt, 1944",
      prompt: "Answer all parts of the question that follows. Refer to the excerpt as needed.",
      partA: "Describe ONE argument Roosevelt was making in the excerpt.",
      partB: "Explain ONE wartime experience that helped make this argument persuasive to many Americans.",
      partC: "Explain ONE criticism of this argument from wartime or postwar conservatives.",
      scoringGuidance: {
        partA: "Explain that liberty required material security as well as formal rights.",
        partB: "Explain full employment or federal wartime planning.",
        partC: "Explain Hayek-style fears of excessive planning or threats to free enterprise."
      }
    },
    {
      id: "chapter22-saq-009",
      chapterId: "chapter22",
      stimulusType: "none",
      prompt: "Answer all parts of the question that follows.",
      partA: "Describe ONE reason Truman decided to use atomic bombs against Japan.",
      partB: "Explain ONE argument historians have made against that decision.",
      partC: "Explain ONE broader consequence of the decision beyond Japan’s surrender.",
      scoringGuidance: {
        partA: "Explain the desire to force surrender quickly or avoid invasion.",
        partB: "Explain moral criticism or claims that Japan was already near defeat.",
        partC: "Explain the atomic age or heightened postwar tension with the Soviet Union."
      }
    },
    {
      id: "chapter22-saq-010",
      chapterId: "chapter22",
      stimulusType: "none",
      prompt: "Answer all parts of the question that follows.",
      partA: "Describe ONE way World War II strengthened the power of the federal government.",
      partB: "Explain ONE way the war strengthened the global position of the United States.",
      partC: "Explain ONE reason those gains in power did not produce complete domestic equality.",
      scoringGuidance: {
        partA: "Explain wartime planning agencies, mobilization, or executive orders.",
        partB: "Explain Bretton Woods, the United Nations, or military victory.",
        partC: "Explain segregation, internment, or unequal access to benefits."
      }
    }
  ],
  leq: [
    {
      id: "chapter22-leq-001",
      chapterId: "chapter22",
      prompt: "Evaluate the extent to which the United States abandoned isolationism in the period 1935 to 1941.",
      recommendedArgument: "Continuity and Change Over Time",
      thesisExamples: [
        "Although many Americans remained isolationist until Pearl Harbor, the United States substantially abandoned strict isolationism between 1935 and 1941 through rearmament, Lend-Lease, and ideological commitments such as the Four Freedoms and Atlantic Charter.",
        "The United States did not move directly from isolation to war; rather, Roosevelt incrementally hollowed out neutrality while still respecting enough public skepticism to avoid full intervention until Japan’s attack on Pearl Harbor."
      ],
      outlineScaffold: {
        contextualization: "Set the stage with World War I disillusionment, the Nye hearings, and the Neutrality Acts.",
        bodyParagraph1: { claim: "Isolationism remained powerful in the mid-1930s.", evidence: ["Neutrality Acts", "America First sentiment"] },
        bodyParagraph2: { claim: "Axis aggression pushed Roosevelt toward active support for the Allies before formal entry into the war.", evidence: ["Peacetime draft", "Lend-Lease Act"] },
        bodyParagraph3: { claim: "By 1941 American leaders had reframed foreign policy as a defense of democratic ideals and national security.", evidence: ["Four Freedoms speech", "Atlantic Charter"] },
        complexity: "A sophistication point can come from explaining that neutrality eroded unevenly: public opinion, law, and policy changed at different speeds."
      }
    },
    {
      id: "chapter22-leq-002",
      chapterId: "chapter22",
      prompt: "Evaluate the extent to which World War II expanded freedom in the United States from 1941 to 1945.",
      recommendedArgument: "Argumentation",
      thesisExamples: [
        "World War II expanded freedom for many Americans by creating full employment, enlarging federal responsibility, and energizing black civil rights activism, but those gains were sharply limited by segregation, gender hierarchy, and Japanese-American internment.",
        "The war broadened the language and expectation of freedom more than it secured freedom equally, because democratic rhetoric and material gains coexisted with coercion, racial exclusion, and unequal access to opportunity."
      ],
      outlineScaffold: {
        contextualization: "Begin with the New Deal, Depression insecurity, and prewar patterns of segregation and gender hierarchy.",
        bodyParagraph1: { claim: "Freedom expanded through work, mobility, and a stronger federal state.", evidence: ["Wartime employment boom", "Executive Order 8802"] },
        bodyParagraph2: { claim: "Many groups used wartime rhetoric to press new claims on the nation.", evidence: ["Double V campaign", "CORE"] },
        bodyParagraph3: { claim: "Wartime freedom had clear limits and exclusions.", evidence: ["Japanese-American internment", "Korematsu v. United States"] },
        complexity: "Earn complexity by arguing that the war changed the meaning of freedom more dramatically than it changed the equal distribution of freedom."
      }
    }
  ],
  dbq: [
    {
      id: "chapter22-dbq-001",
      chapterId: "chapter22",
      prompt: "Evaluate the extent to which the rhetoric of freedom during World War II transformed the United States at home and abroad in the period 1941 to 1945.",
      documents: [
        {
          docNumber: 1,
          docType: "text",
          title: "Four Freedoms speech excerpt",
          source: "Franklin D. Roosevelt, 1941",
          excerpt: "Roosevelt declared that the future should be founded on freedom of speech, freedom of worship, freedom from want, and freedom from fear. He presented those freedoms as universal rather than merely American. The language justified aid to nations resisting fascism and broadened the meaning of liberty.",
          happ: {
            historicalSituation: "The speech came as Roosevelt was seeking support for greater involvement before Pearl Harbor.",
            audience: "The primary audience was the American public and Congress.",
            purpose: "Roosevelt wanted to justify preparedness and aid by framing the crisis as moral as well as strategic.",
            pointOfView: "As president, Roosevelt emphasized ideals that could unite interventionists, New Dealers, and anti-fascists."
          }
        },
        {
          docNumber: 2,
          docType: "image",
          title: "Atlantic vulnerability cartoon",
          source: "American political cartoon, 1940",
          imageId: "chapter22-img-002",
          excerpt: "The cartoon shows war clouds covering Europe while Uncle Sam realizes that the Atlantic no longer guarantees safety. The visual argues that distance is no longer a reliable shield.",
          happ: {
            historicalSituation: "It appeared while debate over intervention was intensifying but before formal entry into the war.",
            audience: "The intended audience was the American reading public.",
            purpose: "The cartoon aimed to weaken confidence in isolationist assumptions.",
            pointOfView: "The artist adopted an interventionist perspective that treated overseas war as a domestic security issue."
          }
        },
        {
          docNumber: 3,
          docType: "text",
          title: "Executive Order 8802",
          source: "Franklin D. Roosevelt, 1941",
          excerpt: "The order declared that there shall be no discrimination in defense industries or government because of race, creed, color, or national origin. It also created the Fair Employment Practices Commission to investigate complaints. The language linked wartime mobilization to limited federal civil rights enforcement.",
          happ: {
            historicalSituation: "The order followed black protest against discrimination in defense jobs.",
            audience: "It addressed federal agencies, employers, and the broader public.",
            purpose: "Roosevelt wanted to prevent a protest crisis while maintaining wartime production.",
            pointOfView: "The document reflects a pragmatic executive willing to act partially under activist pressure."
          }
        },
        {
          docNumber: 4,
          docType: "image",
          title: "Fumiko Hayashida awaiting internment",
          source: "Seattle Post-Intelligencer photographer, 1942",
          imageId: "chapter22-img-004",
          excerpt: "The photograph shows a Japanese-American mother and child wearing tags while waiting to be sent to an internment camp. The image captures forced relocation as an everyday human experience rather than an abstract policy.",
          happ: {
            historicalSituation: "The image came after Pearl Harbor and Executive Order 9066.",
            audience: "It was created for newspaper readers and later became a public symbol of internment.",
            purpose: "The immediate purpose was journalistic documentation, though the image later carried broader moral force.",
            pointOfView: "As a photographed civilian subject, Hayashida’s image reveals the human cost of policy rather than an official justification for it."
          }
        },
        {
          docNumber: 5,
          docType: "image",
          title: "Double V photograph",
          source: "Brooklyn, wartime United States",
          imageId: "chapter22-img-005",
          excerpt: "Black servicemen flash the Double V sign to demand victory over fascism abroad and racism at home. The image ties military service directly to claims for equal citizenship.",
          happ: {
            historicalSituation: "The photograph emerged during a period of segregation, migration, and wartime civil rights activism.",
            audience: "It spoke to black communities, patriotic Americans, and critics of segregation.",
            purpose: "The image aimed to visualize the contradiction between democratic war aims and domestic inequality.",
            pointOfView: "The servicemen’s perspective is that black patriotism strengthens, rather than weakens, the demand for equality."
          }
        }
      ],
      thesisExample: "Although World War II rhetoric transformed American politics by legitimizing intervention, energizing civil rights claims, and expanding ideas of economic citizenship, that same rhetoric remained deeply contradictory because internment and segregation showed that freedom was distributed unequally.",
      outlineScaffold: {
        contextualization: "Begin with the Depression, the Neutrality Acts, and the limited meaning of freedom before 1941.",
        bodyParagraph1: { claim: "Freedom rhetoric justified a larger American role in the world.", documentsUsed: [1, 2], outsideEvidence: "Lend-Lease Act" },
        bodyParagraph2: { claim: "Wartime freedom language helped enlarge civil rights claims.", documentsUsed: [3, 5], outsideEvidence: "CORE or the GI Bill" },
        bodyParagraph3: { claim: "The same era exposed major limits on American freedom.", documentsUsed: [4], outsideEvidence: "Korematsu v. United States" },
        complexity: "A sophistication point can come from arguing that the war changed the language of freedom more quickly than it changed the equal distribution of freedom."
      }
    }
  ]
};

window.chapter22Data = {
  chapterId: "chapter22",
  chapterNum: 22,
  periodId: "p7",
  chapterOrder: 22,
  images: chapter22Images,
  chapterMeta: {
    period: "Period 7",
    periodId: "p7",
    dateRange: "1890–1945",
    apExamWeight: "17–23%",
    chapterTitle: "Fighting for the Four Freedoms: World War II, 1941–1945",
    chapterSubtitle: "Safe for Democracy in a Total War Age",
    bigPictureThemes: [
      "The United States moved from neutrality to global leadership.",
      "Wartime mobilization fused freedom rhetoric with state power and industrial growth.",
      "World War II widened some freedoms while exposing deep racial and civic inequalities."
    ],
    oneLineSummary: "World War II made the United States a global superpower while redefining freedom in expansive but unequal ways at home and abroad.",
    examTips: [
      "Trace the shift from neutrality to intervention with the Neutrality Acts, Lend-Lease, the Four Freedoms, and Pearl Harbor together.",
      "Treat the home front as contradictory: wartime opportunity and federal growth coexisted with segregation, internment, and gender limits.",
      "Connect wartime ideals to postwar change through the GI Bill, Bretton Woods, the United Nations, and the atomic bomb."
    ]
  },
  notes: {
    historicalContext: {
      overview: "The United States entered the late 1930s still shaped by depression, New Deal reform, and deep disillusionment with World War I. Many Americans wanted to avoid another foreign war, but aggression in Europe and Asia steadily made neutrality harder to sustain. By 1941 Roosevelt was recasting American security and American ideals as inseparable from the fate of the wider world.",
      precedingCauses: [
        "World War I disillusionment and the Nye hearings",
        "The Great Depression and New Deal expansion of federal power",
        "Japanese aggression in Asia",
        "Nazi expansion in Europe",
        "Debates over isolationism and intervention"
      ],
      geographicContext: "Geography mattered twice over: oceans initially encouraged faith in isolation, but air power and naval war made distance feel less protective. Within the United States, wartime plants, bases, and migration shifted economic growth toward the South and West.",
      contextImage: {
        imageId: "chapter22-img-001",
        displayCaption: "The Four Freedoms poster captures the moral language Roosevelt used to move Americans toward intervention."
      }
    },
    sections: chapter22NotesSections,
    overarchingAnalysis: {
      continuity: "Racial hierarchy, gender hierarchy, and suspicion of outsiders remained powerful even during a war fought in the name of democracy.",
      change: "The United States emerged from the war with a far larger federal state, a permanent global role, and a broader public understanding of freedom.",
      complexity: "The most important complexity is that World War II expanded the language and expectation of freedom faster than it expanded the equal distribution of freedom.",
      comparisonAngles: [
        "Compare World War II mobilization with World War I mobilization and note the greater role of economic security in wartime ideology.",
        "Compare wartime black activism with the larger postwar civil rights movement to show continuity in goals but change in scale and leverage."
      ]
    }
  },
  periodTimeline: chapter22PeriodTimeline,
  vocabulary: chapter22Vocabulary,
  essayPractice: chapter22EssayPractice,
  mcqQuestions: chapter22McqQuestions,
  flashcards: chapter22Flashcards
};
