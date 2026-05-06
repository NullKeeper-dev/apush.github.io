window.presidentsReviewData = {
  scopeNote: "This guide focuses on completed presidencies so the review stays tied to finished historical records.",
  structureNote: "Grover Cleveland appears once but is labeled 22nd & 24th because he served nonconsecutive terms.",
  eras: [
    {
      key: "founding",
      label: "Founding and Early Republic",
      range: "1789-1829",
      summary: "The early presidents built the federal government, argued over the Constitution's meaning, and set the first foreign-policy and party precedents."
    },
    {
      key: "jacksonian",
      label: "Jacksonian America and Sectional Crisis",
      range: "1829-1861",
      summary: "Mass politics, westward expansion, market upheaval, and the slavery question reshaped the presidency before the Civil War."
    },
    {
      key: "reconstruction",
      label: "Civil War and Reconstruction",
      range: "1861-1877",
      summary: "These administrations fought the Civil War, ended slavery, and struggled over what freedom and reunion would mean after the war."
    },
    {
      key: "gilded-age",
      label: "Gilded Age and Imperial Turn",
      range: "1877-1901",
      summary: "Presidents in this era dealt with industrial capitalism, patronage reform, labor conflict, and the first major move toward overseas empire."
    },
    {
      key: "progressive",
      label: "Progressive Era through World War II",
      range: "1901-1945",
      summary: "The presidency became more activist through regulation, war leadership, and finally the New Deal state and World War II mobilization."
    },
    {
      key: "cold-war",
      label: "Cold War Liberalism and Crisis",
      range: "1945-1981",
      summary: "Containment, civil rights, Vietnam, and economic strain defined the presidency from Truman through Carter."
    },
    {
      key: "modern",
      label: "Conservative Turn and Contemporary America",
      range: "1981-2025",
      summary: "Recent presidents are best reviewed through conservatism, globalization, the War on Terror, polarization, and renewed federal industrial policy."
    }
  ],
  presidents: [
    {
      order: 1,
      id: "george-washington",
      numberLabel: "1st",
      name: "George Washington",
      years: "1789-1797",
      party: "Independent",
      era: "founding",
      periods: ["P3"],
      themes: ["Founding", "Federal Power", "Neutrality"],
      summary: "Washington proved that the new Constitution could produce a stable national government.",
      review: [
        "Set core precedents for the cabinet, executive authority, and the two-term norm.",
        "Suppressed the Whiskey Rebellion and proclaimed neutrality, showing that federal power was real."
      ]
    },
    {
      order: 2,
      id: "john-adams",
      numberLabel: "2nd",
      name: "John Adams",
      years: "1797-1801",
      party: "Federalist",
      era: "founding",
      periods: ["P3"],
      themes: ["Federalists", "Civil Liberties", "Foreign Policy"],
      summary: "Adams's presidency showed how fragile the early republic remained in war scares and partisan conflict.",
      review: [
        "The XYZ Affair and Quasi-War with France sharpened foreign-policy divisions.",
        "The Alien and Sedition Acts and the Election of 1800 made civil liberties and peaceful transfer central APUSH themes."
      ]
    },
    {
      order: 3,
      id: "thomas-jefferson",
      numberLabel: "3rd",
      name: "Thomas Jefferson",
      years: "1801-1809",
      party: "Democratic-Republican",
      era: "founding",
      periods: ["P3", "P4"],
      themes: ["Expansion", "Republicanism", "Judicial Review"],
      summary: "Jefferson expanded the nation while testing whether limited-government ideals could survive executive action.",
      review: [
        "The Louisiana Purchase doubled U.S. territory and stretched strict-construction logic.",
        "Marbury v. Madison and the Embargo Crisis defined judicial review and the limits of economic coercion."
      ]
    },
    {
      order: 4,
      id: "james-madison",
      numberLabel: "4th",
      name: "James Madison",
      years: "1809-1817",
      party: "Democratic-Republican",
      era: "founding",
      periods: ["P4"],
      themes: ["War of 1812", "Nationalism", "Party Politics"],
      summary: "Madison's presidency is remembered mainly for the War of 1812 and the nationalism that followed it.",
      review: [
        "The War of 1812 tested the republic against Britain and exposed military and financial weakness.",
        "Postwar nationalism and the decline of the Federalists helped reshape politics for the next generation."
      ]
    },
    {
      order: 5,
      id: "james-monroe",
      numberLabel: "5th",
      name: "James Monroe",
      years: "1817-1825",
      party: "Democratic-Republican",
      era: "founding",
      periods: ["P4"],
      themes: ["Monroe Doctrine", "Sectionalism", "Nationalism"],
      summary: "Monroe oversaw the so-called Era of Good Feelings, but sectional tensions were already visible beneath it.",
      review: [
        "The Missouri Compromise showed that slavery's expansion was becoming a national crisis.",
        "The Monroe Doctrine warned Europe against new colonization in the Western Hemisphere."
      ]
    },
    {
      order: 6,
      id: "john-quincy-adams",
      numberLabel: "6th",
      name: "John Quincy Adams",
      years: "1825-1829",
      party: "Democratic-Republican",
      era: "founding",
      periods: ["P4"],
      themes: ["Election of 1824", "Internal Improvements", "Party Realignment"],
      summary: "Adams's short presidency mattered less for policy than for the political backlash it triggered.",
      review: [
        "The Election of 1824 and the 'corrupt bargain' accelerated realignment into Jacksonian democracy.",
        "His support for internal improvements and national planning let opponents cast him as elitist."
      ]
    },
    {
      order: 7,
      id: "andrew-jackson",
      numberLabel: "7th",
      name: "Andrew Jackson",
      years: "1829-1837",
      party: "Democrat",
      era: "jacksonian",
      periods: ["P4"],
      themes: ["Jacksonian Democracy", "Indian Removal", "Bank War"],
      summary: "Jackson made the presidency more openly popular and partisan while deepening democratic exclusion.",
      review: [
        "Expanded white male democracy and built a stronger party-centered executive branch.",
        "Indian Removal, the nullification crisis, and the Bank War made his presidency central to APUSH debates over power and democracy."
      ]
    },
    {
      order: 8,
      id: "martin-van-buren",
      numberLabel: "8th",
      name: "Martin Van Buren",
      years: "1837-1841",
      party: "Democrat",
      era: "jacksonian",
      periods: ["P4"],
      themes: ["Panic of 1837", "Party System", "Limited Government"],
      summary: "Van Buren is most important as the president who had to absorb the fallout from Jacksonian finance and expansion.",
      review: [
        "The Panic of 1837 exposed how unstable the market revolution could be.",
        "He relied on party organization and the independent treasury instead of broad federal relief."
      ]
    },
    {
      order: 9,
      id: "william-henry-harrison",
      numberLabel: "9th",
      name: "William Henry Harrison",
      years: "1841",
      party: "Whig",
      era: "jacksonian",
      periods: ["P4"],
      themes: ["Whigs", "Succession", "Executive Power"],
      summary: "Harrison's presidency was brief, but its constitutional consequences mattered.",
      review: [
        "His one-month term became important because it immediately tested presidential succession.",
        "His death in office opened the door for Tyler to claim the full powers of the presidency."
      ]
    },
    {
      order: 10,
      id: "john-tyler",
      numberLabel: "10th",
      name: "John Tyler",
      years: "1841-1845",
      party: "Whig",
      era: "jacksonian",
      periods: ["P4"],
      themes: ["Texas", "Succession", "Sectionalism"],
      summary: "Tyler broke with the Whigs but mattered historically because of succession and Texas.",
      review: [
        "Established the precedent that a vice president becomes the full president, not just an acting one.",
        "Helped secure Texas annexation, intensifying the expansion-and-slavery debate."
      ]
    },
    {
      order: 11,
      id: "james-k-polk",
      numberLabel: "11th",
      name: "James K. Polk",
      years: "1845-1849",
      party: "Democrat",
      era: "jacksonian",
      periods: ["P4"],
      themes: ["Manifest Destiny", "Mexican-American War", "Territorial Expansion"],
      summary: "Polk delivered the most aggressive program of Manifest Destiny in U.S. history.",
      review: [
        "He oversaw Texas annexation, the Oregon settlement, and victory in the Mexican-American War.",
        "The huge territorial gains reopened the question of whether slavery would expand westward."
      ]
    },
    {
      order: 12,
      id: "zachary-taylor",
      numberLabel: "12th",
      name: "Zachary Taylor",
      years: "1849-1850",
      party: "Whig",
      era: "jacksonian",
      periods: ["P5"],
      themes: ["Sectional Crisis", "Mexican Cession", "Compromise"],
      summary: "Taylor's presidency was short, but it landed in the middle of the post-Mexican War sectional crisis.",
      review: [
        "He took office while Congress battled over slavery in the Mexican Cession.",
        "His resistance to sectional compromise and sudden death cleared the way for the Compromise of 1850."
      ]
    },
    {
      order: 13,
      id: "millard-fillmore",
      numberLabel: "13th",
      name: "Millard Fillmore",
      years: "1850-1853",
      party: "Whig",
      era: "jacksonian",
      periods: ["P5"],
      themes: ["Compromise of 1850", "Fugitive Slave Act", "Sectionalism"],
      summary: "Fillmore is remembered mainly for backing the Compromise of 1850.",
      review: [
        "He signed the Compromise of 1850 and enforced the Fugitive Slave Act.",
        "His administration showed how compromise could calm conflict briefly while deepening sectional anger."
      ]
    },
    {
      order: 14,
      id: "franklin-pierce",
      numberLabel: "14th",
      name: "Franklin Pierce",
      years: "1853-1857",
      party: "Democrat",
      era: "jacksonian",
      periods: ["P5"],
      themes: ["Kansas-Nebraska Act", "Bleeding Kansas", "Party Collapse"],
      summary: "Pierce helped turn sectional conflict into open violence.",
      review: [
        "The Kansas-Nebraska Act repealed the Missouri Compromise line and promoted popular sovereignty.",
        "Bleeding Kansas and the collapse of the Whigs pushed the nation closer to civil war."
      ]
    },
    {
      order: 15,
      id: "james-buchanan",
      numberLabel: "15th",
      name: "James Buchanan",
      years: "1857-1861",
      party: "Democrat",
      era: "jacksonian",
      periods: ["P5"],
      themes: ["Dred Scott", "Secession", "Sectional Crisis"],
      summary: "Buchanan is mostly reviewed as the failed president of the final prewar crisis.",
      review: [
        "His presidency overlapped with Dred Scott, the Lecompton controversy, and worsening sectional distrust.",
        "His weak response to secession left Lincoln to inherit a collapsing Union."
      ]
    },
    {
      order: 16,
      id: "abraham-lincoln",
      numberLabel: "16th",
      name: "Abraham Lincoln",
      years: "1861-1865",
      party: "Republican",
      era: "reconstruction",
      periods: ["P5"],
      themes: ["Civil War", "Emancipation", "Union"],
      summary: "Lincoln preserved the Union and transformed the meaning of the war and of freedom.",
      review: [
        "He led the North through the Civil War and expanded presidential war powers.",
        "The Emancipation Proclamation and support for the 13th Amendment tied Union victory to slavery's destruction."
      ]
    },
    {
      order: 17,
      id: "andrew-johnson",
      numberLabel: "17th",
      name: "Andrew Johnson",
      years: "1865-1869",
      party: "Democrat",
      era: "reconstruction",
      periods: ["P5", "P6"],
      themes: ["Reconstruction", "Impeachment", "Freedpeople"],
      summary: "Johnson became the key obstacle to congressional Reconstruction.",
      review: [
        "He favored a lenient Reconstruction and opposed strong federal protections for freedpeople.",
        "His clashes with Radical Republicans produced impeachment and a constitutional showdown over Reconstruction."
      ]
    },
    {
      order: 18,
      id: "ulysses-s-grant",
      numberLabel: "18th",
      name: "Ulysses S. Grant",
      years: "1869-1877",
      party: "Republican",
      era: "reconstruction",
      periods: ["P6"],
      themes: ["Reconstruction", "Civil Rights", "Corruption"],
      summary: "Grant represented both the high-water mark and the political fragility of Reconstruction.",
      review: [
        "He used federal power against the Ku Klux Klan and backed enforcement of black voting rights.",
        "Scandals and the Panic of 1873 weakened Republican reform energy even as civil-rights goals remained unfinished."
      ]
    },
    {
      order: 19,
      id: "rutherford-b-hayes",
      numberLabel: "19th",
      name: "Rutherford B. Hayes",
      years: "1877-1881",
      party: "Republican",
      era: "gilded-age",
      periods: ["P6"],
      themes: ["Compromise of 1877", "End of Reconstruction", "Redeemers"],
      summary: "Hayes matters most because his election settlement ended Reconstruction.",
      review: [
        "The Compromise of 1877 effectively ended sustained federal protection for black southerners.",
        "Withdrawal of troops opened the way for Redeemer rule and later Jim Crow segregation."
      ]
    },
    {
      order: 20,
      id: "james-a-garfield",
      numberLabel: "20th",
      name: "James A. Garfield",
      years: "1881",
      party: "Republican",
      era: "gilded-age",
      periods: ["P6"],
      themes: ["Patronage", "Civil Service Reform", "Spoils System"],
      summary: "Garfield's presidency was short, but his assassination changed Gilded Age politics.",
      review: [
        "His murder by a disappointed office seeker dramatized the dangers of patronage politics.",
        "That shock built support for the civil service reforms that followed under Arthur."
      ]
    },
    {
      order: 21,
      id: "chester-a-arthur",
      numberLabel: "21st",
      name: "Chester A. Arthur",
      years: "1881-1885",
      party: "Republican",
      era: "gilded-age",
      periods: ["P6"],
      themes: ["Pendleton Act", "Nativism", "Civil Service"],
      summary: "Arthur unexpectedly became one of the presidents who weakened the spoils system.",
      review: [
        "He signed the Pendleton Civil Service Act, a major step away from patronage.",
        "His years also reflected Gilded Age nativism through the Chinese Exclusion Act."
      ]
    },
    {
      order: 22,
      id: "grover-cleveland",
      numberLabel: "22nd & 24th",
      name: "Grover Cleveland",
      years: "1885-1889, 1893-1897",
      party: "Democrat",
      era: "gilded-age",
      periods: ["P6", "P7"],
      themes: ["Limited Government", "Labor Conflict", "Panic of 1893"],
      summary: "Cleveland is the only president with nonconsecutive terms and a classic symbol of limited-government conservatism.",
      review: [
        "His administrations are tied to the ICC, veto-heavy limited-government politics, and labor unrest.",
        "The Panic of 1893 and the Pullman Strike made the limits of laissez-faire painfully visible."
      ]
    },
    {
      order: 23,
      id: "benjamin-harrison",
      numberLabel: "23rd",
      name: "Benjamin Harrison",
      years: "1889-1893",
      party: "Republican",
      era: "gilded-age",
      periods: ["P6", "P7"],
      themes: ["Tariffs", "Antitrust", "Silver"],
      summary: "Harrison's presidency captured the activist but business-friendly side of late Gilded Age Republicanism.",
      review: [
        "The McKinley Tariff, Sherman Antitrust Act, and Sherman Silver Purchase Act all came under his administration.",
        "His years highlight how federal policy could expand while still favoring industrial and financial interests."
      ]
    },
    {
      order: 25,
      id: "william-mckinley",
      numberLabel: "25th",
      name: "William McKinley",
      years: "1897-1901",
      party: "Republican",
      era: "gilded-age",
      periods: ["P7"],
      themes: ["Imperialism", "Spanish-American War", "Industrial Power"],
      summary: "McKinley links late Gilded Age prosperity to the United States' move toward overseas empire.",
      review: [
        "Victory in the Spanish-American War and annexations in the Pacific made the U.S. an imperial power.",
        "His administration tied protectionism, industrial growth, and assertive foreign policy together."
      ]
    },
    {
      order: 26,
      id: "theodore-roosevelt",
      numberLabel: "26th",
      name: "Theodore Roosevelt",
      years: "1901-1909",
      party: "Republican",
      era: "progressive",
      periods: ["P7"],
      themes: ["Progressivism", "Trust-Busting", "Big Stick"],
      summary: "Theodore Roosevelt made the presidency more energetic, reform-minded, and globally assertive.",
      review: [
        "The Square Deal expanded federal regulation of trusts, food safety, and railroads.",
        "Conservation, the Panama Canal, and Big Stick diplomacy made his presidency a turning point in executive activism."
      ]
    },
    {
      order: 27,
      id: "william-howard-taft",
      numberLabel: "27th",
      name: "William Howard Taft",
      years: "1909-1913",
      party: "Republican",
      era: "progressive",
      periods: ["P7"],
      themes: ["Dollar Diplomacy", "Trust-Busting", "Election of 1912"],
      summary: "Taft was more conservative in style than Roosevelt, but still important to Progressive-era politics.",
      review: [
        "He continued trust-busting and pursued Dollar Diplomacy abroad.",
        "His split with Roosevelt divided Republicans and helped hand the Election of 1912 to Wilson."
      ]
    },
    {
      order: 28,
      id: "woodrow-wilson",
      numberLabel: "28th",
      name: "Woodrow Wilson",
      years: "1913-1921",
      party: "Democrat",
      era: "progressive",
      periods: ["P7"],
      themes: ["New Freedom", "World War I", "League of Nations"],
      summary: "Wilson fused reform, war mobilization, and moralistic foreign policy in ways APUSH tests repeatedly.",
      review: [
        "His New Freedom produced tariff reform, the Federal Reserve, and the Clayton Antitrust Act.",
        "He led the U.S. through World War I and championed the League of Nations while segregating federal offices."
      ]
    },
    {
      order: 29,
      id: "warren-g-harding",
      numberLabel: "29th",
      name: "Warren G. Harding",
      years: "1921-1923",
      party: "Republican",
      era: "progressive",
      periods: ["P7"],
      themes: ["Normalcy", "Scandal", "Pro-Business Politics"],
      summary: "Harding symbolized the conservative and business-friendly turn of the 1920s.",
      review: [
        "He promised a 'return to normalcy' after war and reform politics.",
        "Teapot Dome and related scandals became shorthand for corruption in 1920s Republican government."
      ]
    },
    {
      order: 30,
      id: "calvin-coolidge",
      numberLabel: "30th",
      name: "Calvin Coolidge",
      years: "1923-1929",
      party: "Republican",
      era: "progressive",
      periods: ["P7"],
      themes: ["Laissez-Faire", "Consumer Culture", "Tax Cuts"],
      summary: "Coolidge embodied the limited-government, pro-business mood of the 1920s.",
      review: [
        "His presidency fit the decade's laissez-faire politics, tax cuts, and light regulation.",
        "He is a useful symbol for the culture and economy that preceded the Great Depression."
      ]
    },
    {
      order: 31,
      id: "herbert-hoover",
      numberLabel: "31st",
      name: "Herbert Hoover",
      years: "1929-1933",
      party: "Republican",
      era: "progressive",
      periods: ["P7"],
      themes: ["Great Depression", "Voluntarism", "Bonus Army"],
      summary: "Hoover became the face of limited-government failure during the Great Depression.",
      review: [
        "He preferred voluntarism and cautious intervention rather than massive direct federal relief.",
        "The Bonus Army crisis and deepening unemployment discredited old assumptions about government and markets."
      ]
    },
    {
      order: 32,
      id: "franklin-d-roosevelt",
      numberLabel: "32nd",
      name: "Franklin D. Roosevelt",
      years: "1933-1945",
      party: "Democrat",
      era: "progressive",
      periods: ["P7"],
      themes: ["New Deal", "World War II", "Modern Liberalism"],
      summary: "FDR permanently expanded expectations for what the federal government and presidency should do.",
      review: [
        "New Deal programs reshaped relief, labor policy, banking, and the regulatory state.",
        "World War II mobilization and his four-term presidency made him the defining executive of the modern era."
      ]
    },
    {
      order: 33,
      id: "harry-s-truman",
      numberLabel: "33rd",
      name: "Harry S. Truman",
      years: "1945-1953",
      party: "Democrat",
      era: "cold-war",
      periods: ["P8"],
      themes: ["Containment", "Korean War", "Civil Rights"],
      summary: "Truman's presidency marks the start of the Cold War national-security state.",
      review: [
        "The Truman Doctrine, Marshall Plan, and NATO launched containment.",
        "He desegregated the armed forces and entered the Korean War without a formal declaration of war."
      ]
    },
    {
      order: 34,
      id: "dwight-d-eisenhower",
      numberLabel: "34th",
      name: "Dwight D. Eisenhower",
      years: "1953-1961",
      party: "Republican",
      era: "cold-war",
      periods: ["P8"],
      themes: ["Interstate Highways", "Containment", "Moderate Conservatism"],
      summary: "Eisenhower blended Cold War strength with moderate domestic conservatism.",
      review: [
        "He backed the interstate highway system and practiced 'Modern Republicanism' rather than dismantling the New Deal.",
        "His years connect the domino theory, covert Cold War action, and limited but real federal civil-rights enforcement at Little Rock."
      ]
    },
    {
      order: 35,
      id: "john-f-kennedy",
      numberLabel: "35th",
      name: "John F. Kennedy",
      years: "1961-1963",
      party: "Democrat",
      era: "cold-war",
      periods: ["P8"],
      themes: ["New Frontier", "Cuban Missile Crisis", "Civil Rights"],
      summary: "Kennedy's presidency is short but highly testable because it joined Cold War danger with reform-era optimism.",
      review: [
        "The New Frontier, the space race, and the Cuban Missile Crisis define his administration.",
        "His late civil-rights push helped set up the legislation passed after his assassination."
      ]
    },
    {
      order: 36,
      id: "lyndon-b-johnson",
      numberLabel: "36th",
      name: "Lyndon B. Johnson",
      years: "1963-1969",
      party: "Democrat",
      era: "cold-war",
      periods: ["P8"],
      themes: ["Great Society", "Civil Rights", "Vietnam"],
      summary: "LBJ represents both the peak of postwar liberal reform and the fracture caused by Vietnam.",
      review: [
        "The Great Society created Medicare, Medicaid, and major anti-poverty programs while expanding civil rights.",
        "Escalation in Vietnam damaged trust in government and split the liberal coalition."
      ]
    },
    {
      order: 37,
      id: "richard-nixon",
      numberLabel: "37th",
      name: "Richard Nixon",
      years: "1969-1974",
      party: "Republican",
      era: "cold-war",
      periods: ["P8"],
      themes: ["Detente", "Watergate", "Southern Strategy"],
      summary: "Nixon's presidency is crucial because it combined major diplomatic breakthroughs with deep constitutional scandal.",
      review: [
        "Opening relations with China and pursuing detente reshaped Cold War diplomacy.",
        "Watergate, the southern strategy, and executive abuses made his administration central to trust-in-government questions."
      ]
    },
    {
      order: 38,
      id: "gerald-ford",
      numberLabel: "38th",
      name: "Gerald Ford",
      years: "1974-1977",
      party: "Republican",
      era: "cold-war",
      periods: ["P8"],
      themes: ["Watergate Aftermath", "Stagflation", "Trust"],
      summary: "Ford mostly matters as the caretaker president of the post-Watergate moment.",
      review: [
        "His pardon of Nixon hurt public trust even as he tried to stabilize government after scandal.",
        "Stagflation and limited presidential leverage defined his short administration."
      ]
    },
    {
      order: 39,
      id: "jimmy-carter",
      numberLabel: "39th",
      name: "Jimmy Carter",
      years: "1977-1981",
      party: "Democrat",
      era: "cold-war",
      periods: ["P8", "P9"],
      themes: ["Human Rights", "Energy Crisis", "Iran Hostage Crisis"],
      summary: "Carter's presidency sits at the hinge between postwar liberalism and the conservative turn.",
      review: [
        "Camp David and a human-rights emphasis shaped his foreign policy reputation.",
        "Energy shortages, stagflation, and the Iran hostage crisis fed the conservative backlash of 1980."
      ]
    },
    {
      order: 40,
      id: "ronald-reagan",
      numberLabel: "40th",
      name: "Ronald Reagan",
      years: "1981-1989",
      party: "Republican",
      era: "modern",
      periods: ["P9"],
      themes: ["Conservatism", "Reaganomics", "Late Cold War"],
      summary: "Reagan became the defining symbol of modern conservatism in economics, politics, and Cold War rhetoric.",
      review: [
        "Reaganomics, tax cuts, deregulation, and the PATCO strike challenged the New Deal order.",
        "Military buildup and hard anticommunist rhetoric shaped the late Cold War, even before later negotiations with Gorbachev."
      ]
    },
    {
      order: 41,
      id: "george-h-w-bush",
      numberLabel: "41st",
      name: "George H. W. Bush",
      years: "1989-1993",
      party: "Republican",
      era: "modern",
      periods: ["P9"],
      themes: ["End of Cold War", "Gulf War", "Post-Reagan Politics"],
      summary: "Bush presided over a major foreign-policy transition but struggled to build a durable domestic coalition.",
      review: [
        "He managed the end of the Cold War and led the Gulf War coalition after Iraq invaded Kuwait.",
        "Recession and the broken 'no new taxes' pledge showed the limits of post-Reagan conservatism."
      ]
    },
    {
      order: 42,
      id: "bill-clinton",
      numberLabel: "42nd",
      name: "Bill Clinton",
      years: "1993-2001",
      party: "Democrat",
      era: "modern",
      periods: ["P9"],
      themes: ["New Democrats", "Globalization", "Impeachment"],
      summary: "Clinton represented the centrist 'New Democrat' response to the Reagan era.",
      review: [
        "Welfare reform, deficit politics, and triangulation defined his domestic style.",
        "NAFTA, impeachment, and the dot-com boom made his years a key case study in 1990s globalization and polarization."
      ]
    },
    {
      order: 43,
      id: "george-w-bush",
      numberLabel: "43rd",
      name: "George W. Bush",
      years: "2001-2009",
      party: "Republican",
      era: "modern",
      periods: ["P9"],
      themes: ["9/11", "War on Terror", "Executive Power"],
      summary: "Bush's presidency is defined by 9/11 and the remaking of U.S. security policy.",
      review: [
        "The War on Terror led to the invasions of Afghanistan and Iraq and broader debates over surveillance and executive power.",
        "His administration also ended amid criticism over Katrina and the Great Recession."
      ]
    },
    {
      order: 44,
      id: "barack-obama",
      numberLabel: "44th",
      name: "Barack Obama",
      years: "2009-2017",
      party: "Democrat",
      era: "modern",
      periods: ["P9"],
      themes: ["Affordable Care Act", "Great Recession", "Polarization"],
      summary: "Obama's presidency focused on recovery from economic crisis while intensifying modern partisan polarization.",
      review: [
        "The stimulus, financial rescue efforts, and Affordable Care Act expanded the federal response to recession and inequality.",
        "His years are also tied to DACA, the bin Laden raid, and new debates over race, policing, and executive action."
      ]
    },
    {
      order: 45,
      id: "donald-trump",
      numberLabel: "45th",
      name: "Donald Trump",
      years: "2017-2021",
      party: "Republican",
      era: "modern",
      periods: ["P9"],
      themes: ["Populism", "Immigration", "Polarization"],
      summary: "Trump's first term reshaped Republican politics through populism, nationalism, and intense institutional conflict.",
      review: [
        "Tax cuts, immigration restriction, and a populist style created a new conservative coalition.",
        "Two impeachments, the COVID-19 crisis, and the January 6 attack made his presidency central to debates about democratic norms."
      ]
    },
    {
      order: 46,
      id: "joe-biden",
      numberLabel: "46th",
      name: "Joe Biden",
      years: "2021-2025",
      party: "Democrat",
      era: "modern",
      periods: ["P9"],
      themes: ["Industrial Policy", "Infrastructure", "Post-Pandemic Politics"],
      summary: "Biden's term is most significant for large-scale federal investment and a renewed industrial-policy approach.",
      review: [
        "The American Rescue Plan, infrastructure law, CHIPS Act, and Inflation Reduction Act expanded federal investment and industrial policy.",
        "Afghanistan withdrawal, inflation politics, and support for Ukraine shaped the global and domestic context of his term."
      ]
    }
  ]
};
