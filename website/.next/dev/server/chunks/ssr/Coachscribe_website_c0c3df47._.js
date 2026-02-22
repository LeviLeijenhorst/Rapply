module.exports = [
"[project]/Coachscribe/website/components/RevealOnScroll.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>RevealOnScroll
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
function RevealOnScroll({ children, className, threshold = 0.2, rootMargin = "0px", hiddenClassName = "translate-y-4 opacity-0", visibleClassName = "translate-y-0 opacity-100", minScrollY = 0 }) {
    const [isVisible, setIsVisible] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const element = containerRef.current;
        if (!element) return;
        if ("TURBOPACK compile-time truthy", 1) {
            setIsVisible(true);
            return;
        }
        //TURBOPACK unreachable
        ;
        const observer = undefined;
    }, []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: containerRef,
        className: `transition-all duration-700 ease-out ${isVisible ? visibleClassName : hiddenClassName} ${className ?? ""}`,
        children: children
    }, void 0, false, {
        fileName: "[project]/Coachscribe/website/components/RevealOnScroll.tsx",
        lineNumber: 58,
        columnNumber: 5
    }, this);
}
}),
"[project]/Coachscribe/website/components/home/SectionContainer.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SectionContainer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$components$2f$RevealOnScroll$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/components/RevealOnScroll.tsx [app-ssr] (ecmascript)");
;
;
function SectionContainer({ children, className, contentClassName, disableReveal = false }) {
    const sectionContent = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `mx-auto w-full max-w-6xl p-6 md:p-10 ${contentClassName ?? ""}`,
        children: children
    }, void 0, false, {
        fileName: "[project]/Coachscribe/website/components/home/SectionContainer.tsx",
        lineNumber: 17,
        columnNumber: 5
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: `w-full ${className ?? ""}`,
        children: disableReveal ? sectionContent : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$components$2f$RevealOnScroll$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
            threshold: 0.14,
            rootMargin: "0px 0px -8% 0px",
            hiddenClassName: "translate-y-2 opacity-0",
            visibleClassName: "translate-y-0 opacity-100",
            className: "motion-reduce:translate-y-0 motion-reduce:opacity-100",
            children: sectionContent
        }, void 0, false, {
            fileName: "[project]/Coachscribe/website/components/home/SectionContainer.tsx",
            lineNumber: 31,
            columnNumber: 9
        }, this)
    }, void 0, false, {
        fileName: "[project]/Coachscribe/website/components/home/SectionContainer.tsx",
        lineNumber: 27,
        columnNumber: 5
    }, this);
}
}),
"[project]/Coachscribe/website/content/siteCopy/coaches/copy.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "coachesCopy",
    ()=>coachesCopy
]);
const coachesCopy = {
    home: {
        heroTitleLine1: "Betere coaching begint bij",
        heroTitleLine2: "volledige aandacht",
        subheadline: "CoachScribe helpt coaches bij verslaglegging van hun sessies en het bewaren van overzicht. Gesprekken worden veilig vastgelegd en georganiseerd, zodat jij je volledig kan focussen op de client.",
        primaryCta: "Probeer gratis",
        secondaryCta: "Hoe Het Werkt",
        features: [
            {
                title: "Leg je sessie vast",
                description: "Zet de opname aan en focus je volledig op jouw client. CoachScribe neemt het gehele gesprek veilig op terwijl jij je bezig houdt met waar je goed in bent; mensen helpen.\n\nCoachScript is gebouwd voor maximale focus."
            },
            {
                title: "Kies jouw workflow",
                description: "Er zijn meerdere templates inbegrepen die je kan gebruiken zodat de sessie wordt vastgelegd zoals jij dat wil. Gebruik je liever je eigen template? geen probleem!\n\nOntworpen om aan te sluiten op jouw workflow."
            },
            {
                title: "Beheer de sessie",
                description: "Lees het automatische verslag en pas aan waar nodig, stel snelle vragen aan de slimme AI-Chat, maak notities en lees of luister specifieke momenten terug uit het gesprek.\n\nOverzichtelijk, simpel en alles op een plek."
            },
            {
                title: "Deel in jouw huisstijl",
                description: "Deel verslagen direct met je coachee, in jouw eigen huisstijl. Voeg je logo en praktijkkleur toe, zodat elke PDF direct herkenbaar en professioneel oogt.\n\nGemaakt met oog op coach en coachee."
            }
        ],
        availabilityTitleLine1: "Binnenkort ook",
        availabilityTitleLine2: "op Android en iOS",
        availabilityTextLine1: "Gebruik CoachScribe op je laptop, tablet of telefoon.",
        availabilityTextLine2: "Alles blijft gesynchroniseerd.",
        faqTitle: "Veel gestelde vragen",
        faqItems: [
            {
                question: "Wat is CoachScribe?",
                answer: "CoachScribe is een AI-ondersteunde tool voor coaches om gesprekken eenvoudig op te nemen, automatisch te laten samenvatten en overzichtelijke verslagen te maken. Het helpt je om minder tijd kwijt te zijn aan administratie, terwijl je wel grip houdt op inhoud, nuance en context."
            },
            {
                question: "Is CoachScribe veilig?",
                answer: "Ja. CoachScribe is veilig ingericht met sterke technische en organisatorische maatregelen om jouw gegevens te beschermen. Alle data wordt versleuteld opgeslagen en verwerkt binnen de Europese Unie, in overeenstemming met de AVG. Jouw gegevens worden niet gebruikt om AI-modellen te trainen en alleen bewaard zolang dat functioneel nodig is."
            },
            {
                question: "Worden er AI modellen getraind met mijn informatie?",
                answer: "Nee. Jouw gegevens worden niet gebruikt om AI-modellen te trainen of te verbeteren. Ze worden uitsluitend verwerkt om de functionaliteiten van CoachScribe voor jou uit te voeren."
            },
            {
                question: "Voor wie is CoachScribe bedoeld?",
                answer: "CoachScribe is bedoeld voor coaches en begeleiders die werken met gesprekken en daar gestructureerde, heldere verslagen van willen maken. Denk aan coaches in het onderwijs, zorg, loopbaanbegeleiding en persoonlijke ontwikkeling."
            },
            {
                question: "Is CoachScribe een vervanging voor een menselijke coach?",
                answer: "Nee. CoachScribe ondersteunt coaches met automatisering van taken zoals notities maken en verslaglegging, maar vervangt nooit het menselijke oordeel, de contextbegrip of de relatie tussen coach en client."
            },
            {
                question: "Kan ik niet gewoon ChatGPT gebruiken?",
                answer: "Nee. ChatGPT is een algemene AI en beschikt niet over de functionaliteit voor sessie opname, gestructureerde verslaglegging of AVG-proof beheer van clientgegevens, waardoor het niet geschikt is voor dit soort toepassingen. Daarnaast is CoachScribe ontworpen speciaal voor coaches en kan het dus een stuk gerichter te werk gaan."
            }
        ]
    },
    shared: {
        securityTitlePrefix: "Ontworpen met",
        securityTitleHighlight: "veiligheid op #1",
        securitySubtitle: "Beschermde opslag, duidelijke regels en volledige controle over jouw data.",
        securityCards: [
            {
                title: "Verwerking binnen Europa",
                description: "CoachScribe verwerkt en bewaart sessiegegevens binnen de Europese Unie. Zo sluiten opslag en verwerking aan op de AVG."
            },
            {
                title: "Versleuteld van upload tot opslag",
                description: "Audio voor transcriptie wordt versleuteld verzonden. Transcripties, samenvattingen en notities blijven versleuteld opgeslagen."
            },
            {
                title: "Jouw data blijft van jou",
                description: "Jouw data wordt niet gebruikt om publieke AI-modellen te trainen. Jij bepaalt wat je bewaart en kunt je gegevens verwijderen wanneer jij wilt."
            }
        ],
        sectionForProfessionalsTitlePrefix: "Voor coaches,",
        sectionForProfessionalsTitleHighlight: "door coaches",
        sectionForProfessionalsParagraphs: [
            "CoachScribe is ontstaan uit tientallen gesprekken met professionals in het werkveld. Door te onderzoeken welke functies echt waardevol zijn, hebben we een product ontwikkeld dat volledig aansluit bij de behoeften van coaches.",
            "We blijven continu in contact met coaches om het product te verbeteren en verder te ontwikkelen.",
            "Wil je meedenken of input geven? Neem contact met ons op!"
        ],
        sectionForProfessionalsCta: "Contact",
        footerMicrocopyLine1: "CoachScribe neemt sessies op van coaches",
        footerMicrocopyLine2: "en zet deze om in praktische verslagen die",
        footerMicrocopyLine3: "aansluiten op de behoefte van de coach."
    },
    product: {
        heroTitleLine1: "Ervaar rust",
        heroTitleLine2: "met onze features",
        heroSubtext: "CoachScribe neemt het noteren van gesprekken en verslaggeving uit handen. Jij behoudt de volledige controle, wij helpen je met de details, en het overzicht.",
        heroCta: "Probeer gratis",
        impactItems: [
            {
                title: "Overzicht",
                description: "Alle sessies en context komen samen op een plek, per client en per traject. Zo behoud je overzicht, ook wanneer je meerdere clienten en gesprekken tegelijk begeleidt."
            },
            {
                title: "Tijd",
                description: "CoachScribe legt gesprekken automatisch vast in duidelijke verslagen, waardoor je een hoop tijd bespaart met de voorbereiding en verslaglegging."
            },
            {
                title: "Kwaliteit",
                description: "Alle context blijft bewaard, waardoor je coaching consistenter en scherper wordt. Je ziet sneller patronen en kunt gerichter begeleiden."
            },
            {
                title: "Focus",
                description: "Doordat je niets hoeft te noteren of te onthouden, blijf je aandacht volledig bij het gesprek. Je luistert scherper en reageert bewuster in het moment."
            },
            {
                title: "Connectie",
                description: "Wanneer je alle details van je coachee kent, voelt die zich vertrouwd en kan jij door afwezigheid van notities de connectie verdiepen."
            },
            {
                title: "Rust",
                description: "CoachScribe neemt het mentale werk rondom je sessies uit handen. Je hoeft niets te onthouden of te reconstrueren. Dat geeft ruimte in je hoofd en rust tussen sessies."
            }
        ],
        faqTitle: "Veel gestelde vragen",
        faqItems: [
            {
                question: "Kan ik templates gebruiken voor mijn verslagen?",
                answer: "Ja. Je kunt vooraf ingestelde templates gebruiken om snel gestructureerde verslagen te maken. Zo hoef je niet telkens vanaf nul te beginnen en houd je verslagen consistent en overzichtelijk. Zit er geen template tussen die bij jouw workflow past? Geen probleem, het is ook mogelijk om je eigen templates te maken."
            },
            {
                question: "Kan ik mijn huisstijl toevoegen aan verslagen?",
                answer: "Ja. Je kunt je eigen logo en praktijk kleur toevoegen, zodat elk verslag direct herkenbaar is en professioneel oogt. Zo blijft de uitstraling consistent en duidelijk voor jou en je clienten."
            },
            {
                question: "Is er een app voor CoachScribe?",
                answer: "Binnenkort. Naar verwachting zal deze halverwege maart op de AppStore en PlayStore uit worden gebracht."
            },
            {
                question: "Kan ik verslagen delen met clienten?",
                answer: "Ja. Je kunt verslagen eenvoudig delen met clienten of collega's, en ze worden gedeeld in jouw huisstijl met logo en praktijkkleur, zodat alles herkenbaar en professioneel blijft."
            },
            {
                question: "Kan ik zelf notities maken?",
                answer: "Ja. Je kunt altijd zelf notities toevoegen bij een sessie, zodat belangrijke informatie niet verloren gaat en je later snel terug kunt vinden wat er besproken is."
            },
            {
                question: "Kan ik specifieke momenten in sessies terugluisteren?",
                answer: "Ja. De audio wordt veilig opgeslagen en je kunt in de transcriptie klikken op elk moment van de sessie en direct de audio terugluisteren, zodat je gemakkelijk belangrijke stukken opnieuw kunt horen."
            }
        ]
    },
    coaches: {
        heroTitleLine1: "Is CoachScribe",
        heroTitleLine2: "iets voor jou?",
        heroSubtext: "Ben jij een coach en ervaar je mentale druk door het bijhouden van sessies en clienten? Ben je teveel tijd kwijt aan voorbereiding en naslagwerk? Wellicht dat wij jou kunnen helpen :)",
        heroCta: "Probeer gratis",
        typesSectionTitle: "Coach: een breed begrip",
        types: [
            {
                title: "Loopbaancoach",
                description: "Een loopbaancoach begeleidt mensen bij vragen over werk, richting en persoonlijke ontwikkeling, vaak over meerdere gesprekken en trajecten heen."
            },
            {
                title: "Lifecoach",
                description: "Een lifecoach helpt mensen bij persoonlijke vraagstukken en begeleidt hen in het creeren van meer balans, richting en bewustzijn in het dagelijks leven."
            },
            {
                title: "Businesscoach",
                description: "Een business coach begeleidt professionals en ondernemers bij professionele ontwikkeling, besluitvorming en het realiseren van zakelijke doelen."
            },
            {
                title: "Budgetcoach",
                description: "Een budgetcoach helpt mensen grip te krijgen op hun financien door inzicht te creeren in inkomsten, uitgaven en financiele keuzes."
            },
            {
                title: "Leadershipcoach",
                description: "Een leadership coach begeleidt professionals in het ontwikkelen van effectief leiderschap, zelfinzicht en impact binnen hun rol en organisatie."
            },
            {
                title: "Studentencoach",
                description: "Een studentencoach ondersteunt studenten bij studie, planning en ontwikkeling, zodat zij hun doelen beter kunnen bereiken en uitdagingen effectief aanpakken."
            },
            {
                title: "Mentalhealthcoach",
                description: "Een mental health coach begeleidt mensen bij hun mentale welzijn, helpt bij het omgaan met stress en emoties, en ondersteunt hen in het versterken van veerkracht en balans."
            },
            {
                title: "Jongerencoach",
                description: "Een jongerencoach ondersteunt jongeren bij persoonlijke ontwikkeling, keuzes en uitdagingen, zodat zij sterker, bewuster en veerkrachtiger in het leven staan."
            },
            {
                title: "Nog veel meer",
                description: "Het coachingsveld is rijk en gevarieerd, met nog talloze coaches die elk op hun eigen manier impact maken en waarde toevoegen aan het traject van hun clienten."
            }
        ],
        workflowTitlePrefix: "Jouw",
        workflowTitleHighlight: "werkwijze",
        workflowParagraphs: [
            "Elke coach heeft een eigen werkwijze. Daarom werkt CoachScribe met templates die zijn afgestemd op verschillende coachingsvormen, zoals loopbaan-, life-, budget- en studentencoaching.",
            "Deze templates zijn ontwikkeld in samenwerking met coaches, zodat ze aansluiten op hoe gesprekken echt verlopen.",
            "Mocht er niets tussen zitten? Geen probleem. Ontwerp gemakkelijk je eigen template die precies aansluit op jouw unieke manier van verslaglegging."
        ],
        faqTitle: "Veel gestelde vragen",
        faqItems: [
            {
                question: "Voor welke coaches is CoachScribe geschikt?",
                answer: "CoachScribe is geschikt voor alle professionals die gesprekken voeren met clienten en daar gestructureerde verslagen van willen bijhouden. Het helpt coaches overzicht te houden, informatie veilig te bewaren en sneller terug te vinden wat belangrijk is uit sessies."
            },
            {
                question: "Kan CoachScribe worden gebruikt door loopbaancoaches?",
                answer: "Ja. Loopbaancoaches kunnen CoachScribe gebruiken om gesprekken met clienten vast te leggen, verslagen te maken en belangrijke inzichten overzichtelijk bij te houden. Dit maakt het makkelijker om trajecten te volgen en opvolging te plannen."
            },
            {
                question: "Kan ik CoachScribe gebruiken als zelfstandig coach of alleen in een organisatie?",
                answer: "CoachScribe is geschikt voor zowel zelfstandige coaches als coaches die in een organisatie werken."
            },
            {
                question: "Is er een minimum aantal clienten of sessies nodig om te beginnen?",
                answer: "Nee. Je kunt CoachScribe vanaf het eerste gesprek gebruiken, ongeacht het aantal clienten of sessies. Het systeem werkt direct, waardoor je meteen overzicht krijgt en efficient notities en verslagen kunt bijhouden."
            },
            {
                question: "Kunnen onderwijscoaches of begeleiders CoachScribe gebruiken?",
                answer: "Ja. CoachScribe kan worden ingezet door onderwijscoaches, mentoren en begeleiders om gesprekken met studenten of leerlingen gestructureerd vast te leggen. Het biedt een veilig overzicht van sessies en maakt het eenvoudiger om belangrijke informatie terug te vinden en te gebruiken voor begeleiding."
            },
            {
                question: "Is CoachScribe geschikt voor nieuwe coaches zonder veel ervaring?",
                answer: "Ja. CoachScribe ondersteunt zowel ervaren als nieuwe coaches door structuur en overzicht te bieden bij sessies en verslaglegging. Het helpt nieuwe coaches om gespreksinformatie efficient te beheren en sneller vertrouwd te raken met het bijhouden van professionele verslagen."
            }
        ]
    },
    overOns: {
        heroTitleMain: "Aangenaam ",
        heroTitleAccent: ":)",
        heroSubtext: "Wij geloven dat goede coaching begint bij rust, focus en aandacht. Coaches doen intens en betekenisvol werk en wij willen hen ondersteunen met tools die ruimte geven om echt aanwezig te zijn.",
        heroCta: "Contact",
        values: [
            {
                title: "Mensgericht",
                description: "Technologie ondersteunt altijd de coach en de client, zonder de menselijke connectie te vervangen."
            },
            {
                title: "Samenwerking",
                description: "CoachScribe ontstaat niet in isolatie. We ontwikkelen samen met coaches, partners en elkaar."
            },
            {
                title: "Kwaliteit",
                description: "Alles wat we bouwen is gericht op het verbeteren van de kwaliteit van coaching en het ondersteunen van elke sessie."
            },
            {
                title: "Innovatie",
                description: "We testen en verbeteren continu, zodat CoachScribe beter aansluit bij de praktijk van coaches."
            },
            {
                title: "Transparantie",
                description: "We zijn open over hoe CoachScribe werkt en hoe we omgaan met data, zodat coaches altijd weten waar ze aan toe zijn."
            },
            {
                title: "Verbinding",
                description: "Onze tools helpen coaches sterker in contact te staan met hun clienten en de relatie te verdiepen."
            }
        ],
        founders: [
            {
                name: "Levi Leijenhorst",
                description: [
                    "Levi heeft een achtergrond in toegepaste-psychologie en tijdens zijn stage als studentencoach is het idee voor CoachScribe ontstaan.",
                    "Levi is technisch aangelegd en heeft zichzelf leren coderen als hobby, deze hobby is ondertussen flink uit de hand gelopen en hij is verantwoordelijk over de gehele technische kant van CoachScribe, de veiligheid en alles wat hiermee te maken heeft.",
                    "Daarnaast voert Levi regelmatig feedback- en salesgesprekken met coaches, is nauw betrokken bij het design en gebruikerservaring en is een gepassioneerde ondernemer."
                ]
            },
            {
                name: "Jonas Kroon",
                description: [
                    "Jonas is een oude jeugdvriend van Levi. Ook hij heeft toegepaste-psychologie gestudeerd en herkende de problemen die Levi omschreef. Toen Jonas het idee voor CoachScribe hoorde was hij gelijk verkocht.",
                    "Jonas is creatief en strategisch ingesteld. Hij neemt het design, de gebruikerservaring en marketing voor zijn rekening en houdt zich bezig met alles aan de voorkant van CoachScribe.",
                    "Ook Jonas voert regelmatig feedback- en salesgesprekken met coaches, is constant opzoek naar ruimte voor verbetering en een gepassioneerde ondernemer."
                ]
            }
        ],
        contactHeading: "Kom in contact",
        contactText: "Heb je een vraag, wil je input geven of ben je benieuwd wat wij voor jou kunnen betekenen? Neem contact met ons op!"
    }
};
}),
"[project]/Coachscribe/website/content/siteCopy/loopbaan-en-reintegratieprofessionals/copy.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "loopbaanEnReintegratieprofessionalsCopy",
    ()=>loopbaanEnReintegratieprofessionalsCopy
]);
const sharedFaqItems = [
    {
        question: "Voor wie is CoachScribe bedoeld?",
        answer: "Voor loopbaan- en re-integratieprofessionals die gesprekken willen vastleggen en daar consistente rapportages en dossiernotities van willen maken."
    },
    {
        question: "Is CoachScribe geschikt voor Poortwachter-rapportages?",
        answer: "CoachScribe ondersteunt verslaglegging en structuur voor o.a. Plan van Aanpak, evaluaties en (tweede spoor) rapportages. Je houdt altijd zelf de eindcontrole op inhoud en formulering."
    },
    {
        question: "Hoe zit het met AVG en privacy?",
        answer: "Privacy is een uitgangspunt: EU-verwerking, versleuteling en duidelijke afspraken over data. Je bepaalt zelf wat je opslaat of verwijdert."
    },
    {
        question: "Worden AI-modellen getraind met mijn informatie?",
        answer: "Nee. Jouw data wordt niet gebruikt om publieke AI-modellen te trainen."
    },
    {
        question: "Kan ik mijn eigen template gebruiken?",
        answer: "Ja. Je kunt werken met standaard templates of je eigen format aanhouden zodat de output aansluit op jouw werkwijze."
    },
    {
        question: "Kan ik rapportages delen met client of werkgever?",
        answer: "Ja. Je kunt rapportages exporteren als PDF en delen wanneer dat past binnen jouw proces en afspraken."
    }
];
const loopbaanEnReintegratieprofessionalsCopy = {
    home: {
        heroTitleLine1: "Betere begeleiding begint bij",
        heroTitleLine2: "betrouwbare verslaglegging",
        subheadline: "CoachScribe helpt loopbaan- en re-integratieprofessionals gesprekken vastleggen, structureren en omzetten naar professionele rapportages - met privacy en controle als uitgangspunt.",
        primaryCta: "Probeer gratis",
        secondaryCta: "Bekijk hoe het werkt",
        features: [
            {
                title: "Leg je gesprek vast",
                description: "Neem gesprekken op en maak direct een gespreksverslag als basis voor je dossier. Minder losse notities, meer overzicht."
            },
            {
                title: "Kies je rapportage-workflow",
                description: "Werk met vaste formats zoals Plan van Aanpak, (eerstejaars)evaluatie, tweede spoor en eindrapportage - of pas je eigen template toe."
            },
            {
                title: "Beheer je dossier",
                description: "Bewaar sessies, verslagen en notities per client. Vind informatie snel terug en houd je voortgang consistent."
            },
            {
                title: "Deel professioneel",
                description: "Deel rapportages als PDF in jouw huisstijl. Duidelijk voor werkgever, werknemer en ketenpartners."
            }
        ],
        availabilityTitleLine1: "Binnenkort ook",
        availabilityTitleLine2: "op Android en iOS",
        availabilityTextLine1: "Gebruik CoachScribe op laptop, tablet en telefoon.",
        availabilityTextLine2: "Alles blijft gesynchroniseerd.",
        faqTitle: "Veelgestelde vragen",
        faqItems: [
            ...sharedFaqItems
        ]
    },
    shared: {
        securityTitlePrefix: "Ontworpen met",
        securityTitleHighlight: "privacy en compliance als basis",
        securitySubtitle: "EU-verwerking, versleuteling en heldere controle over jouw data.",
        securityCards: [
            {
                title: "Verwerking binnen Europa",
                description: "Gegevens worden verwerkt en opgeslagen binnen de Europese Unie. Zo sluit je beter aan op AVG-eisen."
            },
            {
                title: "Versleuteld van upload tot opslag",
                description: "Audio en rapportages worden versleuteld verwerkt en opgeslagen. Minder risico bij gevoelige trajectinformatie."
            },
            {
                title: "Jouw dossier blijft van jou",
                description: "Jij bepaalt wat je bewaart en wat je verwijdert. Geen training van publieke AI-modellen op jouw data."
            }
        ],
        sectionForProfessionalsTitlePrefix: "Voor professionals,",
        sectionForProfessionalsTitleHighlight: "gebouwd met de praktijk",
        sectionForProfessionalsParagraphs: [
            "We ontwikkelen CoachScribe samen met professionals die dagelijks moeten rapporteren.",
            "Zo sluiten templates en output aan op echte trajecten.",
            "Wil je meedenken of input geven? Neem contact met ons op!"
        ],
        sectionForProfessionalsCta: "Contact",
        footerMicrocopyLine1: "CoachScribe helpt bij professionele verslaglegging en dossieropbouw voor loopbaan- en re-integratietrajecten.",
        footerMicrocopyLine2: "",
        footerMicrocopyLine3: ""
    },
    product: {
        heroTitleLine1: "Rust in je dossier.",
        heroTitleLine2: "Snel naar een professioneel rapport.",
        heroSubtext: "Zet gesprekken om naar gestructureerde verslagen en rapportages die passen bij jouw trajecten en templates.",
        heroCta: "Probeer gratis",
        impactItems: [
            {
                title: "Overzicht",
                description: "Houd dossieropbouw strak per client en traject, zonder losse documenten."
            },
            {
                title: "Tijd",
                description: "Minder handmatig uitwerken, sneller van gesprek naar rapportage."
            },
            {
                title: "Kwaliteit",
                description: "Consistente structuur en taal, zodat je rapportages professioneler ogen."
            },
            {
                title: "Zekerheid",
                description: "Privacy en controle als basis, met EU-verwerking en versleuteling."
            },
            {
                title: "Samenwerking",
                description: "Maak output die begrijpelijk is voor werkgever, werknemer en ketenpartners."
            },
            {
                title: "Rust",
                description: "Minder administratie-stress, meer aandacht voor het traject."
            }
        ],
        faqTitle: "Veelgestelde vragen",
        faqItems: [
            ...sharedFaqItems
        ]
    },
    coaches: {
        heroTitleLine1: "Is CoachScribe",
        heroTitleLine2: "iets voor jou?",
        heroSubtext: "Ben je loopbaan- of re-integratieprofessional en wil je sneller, consistenter en AVG-bewust rapporteren? CoachScribe helpt je van gesprek naar dossier en rapportage.",
        heroCta: "Probeer gratis",
        typesSectionTitle: "Professionals: een breed werkveld",
        types: [
            {
                title: "Loopbaanbegeleiding",
                description: "Leg loopbaangesprekken vast en maak duidelijke samenvattingen en actiepunten per client."
            },
            {
                title: "Re-integratie (1e spoor)",
                description: "Ondersteun dossieropbouw met gespreksverslagen, evaluaties en afspraken richting werkgever en werknemer."
            },
            {
                title: "Tweede spoor",
                description: "Werk gestructureerd aan rapportages met voortgang, resultaten en onderbouwing."
            },
            {
                title: "Jobcoaching",
                description: "Maak overzichtelijke notities en rapportages rond werkbehoud, begeleiding en interventies."
            },
            {
                title: "Mobiliteit & outplacement",
                description: "Van intake tot trajectafronding: consistent vastleggen en professioneel communiceren."
            },
            {
                title: "Arbeidsdeskundig samenwerken",
                description: "Documenteer observaties en bevindingen helder als input voor ketenpartners (met jouw eindcontrole)."
            },
            {
                title: "Praktijk- en casemanagement",
                description: "Alles per dossier bij elkaar, minder zoeken, minder dubbel werk."
            },
            {
                title: "Nog veel meer",
                description: "Werk je in een aangrenzend veld met veel gesprekken en verslaglegging? Dan sluit CoachScribe waarschijnlijk ook aan."
            },
            {
                title: "Nog veel meer",
                description: "Werk je in een aangrenzend veld met veel gesprekken en verslaglegging? Dan sluit CoachScribe waarschijnlijk ook aan."
            }
        ],
        workflowTitlePrefix: "Jouw",
        workflowTitleHighlight: "werkwijze",
        workflowParagraphs: [
            "Elke professional heeft een eigen werkwijze. Daarom werkt CoachScribe met templates die zijn afgestemd op rapportages zoals Plan van Aanpak, evaluaties en tweede spoor.",
            "Deze templates zijn ontwikkeld in samenwerking met professionals, zodat ze aansluiten op hoe trajecten in de praktijk verlopen.",
            "Mocht er niets tussen zitten? Geen probleem. Ontwerp gemakkelijk je eigen template die precies aansluit op jouw manier van verslaglegging en dossieropbouw."
        ],
        faqTitle: "Veelgestelde vragen",
        faqItems: [
            ...sharedFaqItems
        ]
    },
    overOns: {
        heroTitleMain: "Aangenaam ",
        heroTitleAccent: ":)",
        heroSubtext: "CoachScribe is gebouwd voor professionals die met gevoelige trajectinformatie werken. Ons doel: betrouwbare verslaglegging en rapportages, met privacy en controle als uitgangspunt.",
        heroCta: "Contact",
        values: [
            {
                title: "Mensgericht",
                description: "Administratie ondersteunt het traject - het vervangt nooit de menselijke begeleiding."
            },
            {
                title: "Samenwerking",
                description: "We bouwen samen met professionals en partners aan wat in de praktijk echt werkt."
            },
            {
                title: "Kwaliteit",
                description: "Heldere structuur en consistente output, zodat rapportages professioneel en bruikbaar blijven."
            },
            {
                title: "Innovatie",
                description: "We verbeteren continu, met focus op tijdwinst zonder concessies aan privacy."
            },
            {
                title: "Transparantie",
                description: "Duidelijke keuzes over verwerking, opslag en controle. Geen verrassingen."
            },
            {
                title: "Vertrouwen",
                description: "Beveiliging en zorgvuldigheid staan centraal bij alles wat we bouwen."
            }
        ],
        founders: [
            {
                name: "Levi Leijenhorst",
                description: [
                    "Levi richt zich op product en techniek binnen CoachScribe. Hij werkt aan veilige verwerking, betrouwbare verslaglegging en een workflow die past bij de praktijk van loopbaan- en re-integratieprofessionals. Daarnaast spreekt hij regelmatig gebruikers om scherp te blijven op wat er echt nodig is."
                ]
            },
            {
                name: "Jonas Kroon",
                description: [
                    "Jonas richt zich op design, gebruikservaring en positionering. Hij zorgt dat CoachScribe simpel blijft in gebruik, maar professioneel in output - van templates tot export in huisstijl. Ook hij haalt continu feedback op bij professionals om het product te verbeteren."
                ]
            }
        ],
        contactHeading: "Kom in contact",
        contactText: "Wil je zien hoe CoachScribe past binnen jouw rapportage- en dossierproces? Laat een bericht achter, dan nemen we contact met je op."
    }
};
}),
"[project]/Coachscribe/website/content/siteCopy/index.ts [app-ssr] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "siteCopy",
    ()=>siteCopy
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$content$2f$siteCopy$2f$coaches$2f$copy$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/content/siteCopy/coaches/copy.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$content$2f$siteCopy$2f$loopbaan$2d$en$2d$reintegratieprofessionals$2f$copy$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/content/siteCopy/loopbaan-en-reintegratieprofessionals/copy.ts [app-ssr] (ecmascript)");
;
;
;
const siteCopy = __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$content$2f$siteCopy$2f$loopbaan$2d$en$2d$reintegratieprofessionals$2f$copy$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["loopbaanEnReintegratieprofessionalsCopy"];
}),
"[project]/Coachscribe/website/home/security-safe.svg (static in ecmascript, tag client)", ((__turbopack_context__) => {

__turbopack_context__.v("/_next/static/media/security-safe.ad553c63.svg");}),
"[project]/Coachscribe/website/home/security-safe.svg.mjs { IMAGE => \"[project]/Coachscribe/website/home/security-safe.svg (static in ecmascript, tag client)\" } [app-ssr] (structured image object with data url, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$home$2f$security$2d$safe$2e$svg__$28$static__in__ecmascript$2c$__tag__client$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/home/security-safe.svg (static in ecmascript, tag client)");
;
const __TURBOPACK__default__export__ = {
    src: __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$home$2f$security$2d$safe$2e$svg__$28$static__in__ecmascript$2c$__tag__client$29$__["default"],
    width: 24,
    height: 24,
    blurWidth: 0,
    blurHeight: 0
};
}),
"[project]/Coachscribe/website/home/lock.svg (static in ecmascript, tag client)", ((__turbopack_context__) => {

__turbopack_context__.v("/_next/static/media/lock.a67fcf7a.svg");}),
"[project]/Coachscribe/website/home/lock.svg.mjs { IMAGE => \"[project]/Coachscribe/website/home/lock.svg (static in ecmascript, tag client)\" } [app-ssr] (structured image object with data url, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$home$2f$lock$2e$svg__$28$static__in__ecmascript$2c$__tag__client$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/home/lock.svg (static in ecmascript, tag client)");
;
const __TURBOPACK__default__export__ = {
    src: __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$home$2f$lock$2e$svg__$28$static__in__ecmascript$2c$__tag__client$29$__["default"],
    width: 24,
    height: 24,
    blurWidth: 0,
    blurHeight: 0
};
}),
"[project]/Coachscribe/website/home/security.svg (static in ecmascript, tag client)", ((__turbopack_context__) => {

__turbopack_context__.v("/_next/static/media/security.de3b76e8.svg");}),
"[project]/Coachscribe/website/home/security.svg.mjs { IMAGE => \"[project]/Coachscribe/website/home/security.svg (static in ecmascript, tag client)\" } [app-ssr] (structured image object with data url, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$home$2f$security$2e$svg__$28$static__in__ecmascript$2c$__tag__client$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/home/security.svg (static in ecmascript, tag client)");
;
const __TURBOPACK__default__export__ = {
    src: __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$home$2f$security$2e$svg__$28$static__in__ecmascript$2c$__tag__client$29$__["default"],
    width: 24,
    height: 24,
    blurWidth: 0,
    blurHeight: 0
};
}),
"[project]/Coachscribe/website/components/home/SecuritySection.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SecuritySection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/image.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$components$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/components/Button.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$components$2f$home$2f$SectionContainer$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/components/home/SectionContainer.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$content$2f$siteCopy$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Coachscribe/website/content/siteCopy/index.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$home$2f$security$2d$safe$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$home$2f$security$2d$safe$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$ssr$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__ = __turbopack_context__.i('[project]/Coachscribe/website/home/security-safe.svg.mjs { IMAGE => "[project]/Coachscribe/website/home/security-safe.svg (static in ecmascript, tag client)" } [app-ssr] (structured image object with data url, ecmascript)');
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$home$2f$lock$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$home$2f$lock$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$ssr$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__ = __turbopack_context__.i('[project]/Coachscribe/website/home/lock.svg.mjs { IMAGE => "[project]/Coachscribe/website/home/lock.svg (static in ecmascript, tag client)" } [app-ssr] (structured image object with data url, ecmascript)');
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$home$2f$security$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$home$2f$security$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$ssr$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__ = __turbopack_context__.i('[project]/Coachscribe/website/home/security.svg.mjs { IMAGE => "[project]/Coachscribe/website/home/security.svg (static in ecmascript, tag client)" } [app-ssr] (structured image object with data url, ecmascript)');
"use client";
;
;
;
;
;
;
;
;
;
const securityItems = __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$content$2f$siteCopy$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["siteCopy"].shared.securityCards.map((card, index)=>({
        ...card,
        icon: index === 0 ? __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$home$2f$security$2d$safe$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$home$2f$security$2d$safe$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$ssr$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__["default"] : index === 1 ? __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$home$2f$lock$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$home$2f$lock$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$ssr$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__["default"] : __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$home$2f$security$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$home$2f$security$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$ssr$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__["default"]
    }));
const veiligheidDataFlowItems = [
    {
        title: "Opname",
        description: "Gesprekken worden lokaal opgenomen en versleuteld voordat zij verder worden verwerkt. Onversleutelde audio wordt niet permanent opgeslagen op het apparaat."
    },
    {
        title: "Versleutelde overdracht",
        description: "Audio wordt versleuteld verzonden naar onze verwerkingsomgeving."
    },
    {
        title: "Verwerking binnen de Europese Unie",
        description: "Transcriptie en AI-functionaliteiten draaien binnen de Europese Unie."
    },
    {
        title: "Dubbele versleuteling tijdens opslag",
        description: "Gegevens worden versleuteld opgeslagen. Naast de standaardversleuteling in de cloud passen wij aanvullende versleuteling toe."
    },
    {
        title: "Verwijdering",
        description: "Gebruikers kunnen sessies en gegevens verwijderen."
    }
];
const SECURITY_CARD_REVEAL_DURATION_MS = 420;
function SecuritySection({ duplicateCards = false, showActionButton = true, disableAnimations = false }) {
    const securityCardsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [areSecurityCardsVisible, setAreSecurityCardsVisible] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const securityGridGapClass = duplicateCards ? "gap-[30px]" : "gap-6";
    const securityButtonTopSpacingClass = duplicateCards ? "mt-[30px]" : "mt-2";
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const element = securityCardsRef.current;
        if (!element) return;
        if (("TURBOPACK compile-time value", "undefined") === "undefined" || !("IntersectionObserver" in window)) {
            setAreSecurityCardsVisible(true);
            return;
        }
        //TURBOPACK unreachable
        ;
        const observer = undefined;
    }, []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$components$2f$home$2f$SectionContainer$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
        className: "bg-white bg-[linear-gradient(to_top_right,_rgba(184,212,255,0.25),_rgba(198,175,255,0.25))]",
        contentClassName: duplicateCards ? "pt-12 pb-14 md:pt-16 md:pb-20" : "md:pb-[60px]",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: `flex w-full flex-col ${duplicateCards ? "gap-12" : "gap-8 md:pt-5"}`,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex w-full flex-col items-center gap-3 text-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "font-[var(--font-catamaran)] text-[34px] font-medium leading-[120%] text-black md:text-[40px]",
                            children: duplicateCards ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    "Hoe CoachScribe",
                                    " ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-[#BD0265]",
                                        children: "met gegevens omgaat"
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                        lineNumber: 102,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$content$2f$siteCopy$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["siteCopy"].shared.securityTitlePrefix,
                                    " ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-[#BD0265]",
                                        children: __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$content$2f$siteCopy$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["siteCopy"].shared.securityTitleHighlight
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                        lineNumber: 107,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true)
                        }, void 0, false, {
                            fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                            lineNumber: 98,
                            columnNumber: 11
                        }, this),
                        duplicateCards ? null : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-base font-normal text-black/70 md:text-lg",
                            children: __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$content$2f$siteCopy$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["siteCopy"].shared.securitySubtitle
                        }, void 0, false, {
                            fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                            lineNumber: 112,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                    lineNumber: 97,
                    columnNumber: 9
                }, this),
                duplicateCards ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    ref: securityCardsRef,
                    className: `mx-auto w-full max-w-4xl ${disableAnimations || areSecurityCardsVisible ? "translate-y-0" : "translate-y-[20px]"}`,
                    style: {
                        transitionProperty: "translate, transform",
                        transitionDuration: `${SECURITY_CARD_REVEAL_DURATION_MS}ms, ${SECURITY_CARD_REVEAL_DURATION_MS}ms`,
                        transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1), cubic-bezier(0.22,1,0.36,1)"
                    },
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative pl-10 max-[500px]:pl-0 md:pl-12",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex w-full flex-col",
                            children: veiligheidDataFlowItems.map((securityItem, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "relative h-[196px] w-full md:h-[140px]",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: `absolute max-[500px]:hidden ${index === 2 ? "left-[-12px]" : "left-[-8px]"} ${index === 2 ? "top-[-2px] h-8 w-8" : "top-[2px] h-6 w-6"}`,
                                            "aria-hidden": "true",
                                            children: index === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                xmlns: "http://www.w3.org/2000/svg",
                                                width: "24",
                                                height: "24",
                                                viewBox: "0 0 24 24",
                                                fill: "none",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M7.99963 10.02V11.5C7.99963 13.71 9.78963 15.5 11.9996 15.5C14.2096 15.5 15.9996 13.71 15.9996 11.5V6C15.9996 3.79 14.2096 2 11.9996 2C9.78963 2 7.99963 3.79 7.99963 6",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 156,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M4.34961 9.6499V11.3499C4.34961 15.5699 7.77961 18.9999 11.9996 18.9999C16.2196 18.9999 19.6496 15.5699 19.6496 11.3499V9.6499",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 163,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M10.6096 6.43012C11.5096 6.10012 12.4896 6.10012 13.3896 6.43012",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 170,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M11.1996 8.55007C11.7296 8.41007 12.2796 8.41007 12.8096 8.55007",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 177,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M11.9996 19V22",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 184,
                                                        columnNumber: 27
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                lineNumber: 149,
                                                columnNumber: 25
                                            }, this) : index === 1 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                xmlns: "http://www.w3.org/2000/svg",
                                                width: "24",
                                                height: "24",
                                                viewBox: "0 0 24 24",
                                                fill: "none",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M19.7901 14.9301C17.7301 16.9801 14.7801 17.6101 12.1901 16.8001L7.48015 21.5001C7.14015 21.8501 6.47015 22.0601 5.99015 21.9901L3.81015 21.6901C3.09015 21.5901 2.42015 20.9101 2.31015 20.1901L2.01015 18.0101C1.94015 17.5301 2.17015 16.8601 2.50015 16.5201L7.20015 11.8201C6.40015 9.22007 7.02015 6.27007 9.08015 4.22007C12.0301 1.27007 16.8201 1.27007 19.7801 4.22007C22.7401 7.17007 22.7401 11.9801 19.7901 14.9301Z",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeMiterlimit: "10",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 200,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M6.89014 17.49L9.19014 19.79",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeMiterlimit: "10",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 208,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M14.5 11C15.3284 11 16 10.3284 16 9.5C16 8.67157 15.3284 8 14.5 8C13.6716 8 13 8.67157 13 9.5C13 10.3284 13.6716 11 14.5 11Z",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 216,
                                                        columnNumber: 27
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                lineNumber: 193,
                                                columnNumber: 25
                                            }, this) : index === 2 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                xmlns: "http://www.w3.org/2000/svg",
                                                width: "32",
                                                height: "32",
                                                viewBox: "0 0 512 512",
                                                fill: "none",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    fill: "#BD0265",
                                                    d: "M256 46.305l-9.404 19.054-21.03 3.056 15.217 14.832-3.592 20.945L256 94.305l18.81 9.888-3.593-20.945 15.217-14.832-21.03-3.057L256 46.304zM167.566 72.63l-9.404 19.056-21.03 3.056 15.218 14.832-3.592 20.946 18.808-9.89 18.81 9.89-3.593-20.946L198 94.742l-21.03-3.056-9.404-19.055zm176.868 0l-9.405 19.056L314 94.742l15.217 14.832-3.592 20.946 18.81-9.89 18.807 9.89-3.592-20.946 15.217-14.832-21.03-3.056-9.403-19.055zm-243.868 67.425l-9.404 19.054-21.03 3.056 15.218 14.832-3.592 20.945 18.808-9.888 18.81 9.888-3.593-20.945L131 162.166l-21.03-3.057-9.404-19.055zm310.868 0l-9.405 19.054-21.03 3.056 15.217 14.832-3.592 20.945 18.81-9.888 18.807 9.888-3.592-20.945 15.217-14.832-21.03-3.057-9.403-19.055zM76.566 228.55l-9.404 19.054-21.03 3.056 15.218 14.832-3.592 20.945 18.808-9.888 18.81 9.887-3.593-20.945L107 250.66l-21.03-3.056-9.404-19.055zm358.868 0l-9.405 19.054L405 250.66l15.217 14.832-3.592 20.945 18.81-9.888 18.807 9.887-3.592-20.945 15.217-14.832-21.03-3.056-9.403-19.055zm-334.868 89.897l-9.404 19.055-21.03 3.057 15.218 14.83-3.592 20.946 18.808-9.89 18.81 9.89-3.593-20.945L131 340.56l-21.03-3.058-9.404-19.055zm310.868 0l-9.405 19.055L381 340.56l15.217 14.83-3.592 20.946 18.81-9.89 18.807 9.89-3.592-20.945 15.217-14.83-21.03-3.058-9.403-19.055zm-243.868 65.746l-9.404 19.055-21.03 3.057 15.218 14.832-3.592 20.945 18.808-9.89 18.81 9.89-3.593-20.945L198 406.305l-21.03-3.057-9.404-19.055zm176.868 0l-9.405 19.055-21.03 3.057 15.217 14.832-3.592 20.945 18.81-9.89 18.807 9.89-3.592-20.945 15.217-14.832-21.03-3.057-9.403-19.055zm-88.61 23.614l-9.404 19.056-21.03 3.055 15.217 14.834-3.59 20.943.385-.203-.035.203L256 455.898l18.633 9.797-.035-.203.386.203-3.59-20.943 15.215-14.834-21.03-3.055-9.404-19.056-.176.355-.176-.355z"
                                                }, void 0, false, {
                                                    fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                    lineNumber: 232,
                                                    columnNumber: 27
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                lineNumber: 225,
                                                columnNumber: 25
                                            }, this) : index === 3 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                xmlns: "http://www.w3.org/2000/svg",
                                                width: "24",
                                                height: "24",
                                                viewBox: "0 0 24 24",
                                                fill: "none",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M19.32 10H4.69002C3.21002 10 2.01001 8.79002 2.01001 7.32002V4.69002C2.01001 3.21002 3.22002 2.01001 4.69002 2.01001H19.32C20.8 2.01001 22 3.22002 22 4.69002V7.32002C22 8.79002 20.79 10 19.32 10Z",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 245,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M19.32 22H4.69002C3.21002 22 2.01001 20.79 2.01001 19.32V16.69C2.01001 15.21 3.22002 14.01 4.69002 14.01H19.32C20.8 14.01 22 15.22 22 16.69V19.32C22 20.79 20.79 22 19.32 22Z",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 252,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M6 5V7",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 259,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M10 5V7",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 266,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M6 17V19",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 273,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M10 17V19",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 280,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M14 6H18",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 287,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M14 18H18",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 294,
                                                        columnNumber: 27
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                lineNumber: 238,
                                                columnNumber: 25
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                xmlns: "http://www.w3.org/2000/svg",
                                                width: "24",
                                                height: "24",
                                                viewBox: "0 0 24 24",
                                                fill: "none",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M21 5.97998C17.67 5.64998 14.32 5.47998 10.98 5.47998C9 5.47998 7.02 5.57998 5.04 5.77998L3 5.97998",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 310,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M8.5 4.97L8.72 3.66C8.88 2.71 9 2 10.69 2H13.31C15 2 15.13 2.75 15.28 3.67L15.5 4.97",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 317,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M18.8499 9.13989L18.1999 19.2099C18.0899 20.7799 17.9999 21.9999 15.2099 21.9999H8.7899C5.9999 21.9999 5.9099 20.7799 5.7999 19.2099L5.1499 9.13989",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 324,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M10.3301 16.5H13.6601",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 331,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M9.5 12.5H14.5",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 338,
                                                        columnNumber: 27
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                lineNumber: 303,
                                                columnNumber: 25
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                            lineNumber: 140,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "relative flex w-full flex-col gap-2 pl-[106px] max-[500px]:pl-0",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    className: "font-[var(--font-catamaran)] text-[24px] font-bold text-[#BD0265]",
                                                    children: securityItem.title
                                                }, void 0, false, {
                                                    fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                    lineNumber: 349,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-[16px] font-normal text-black/70",
                                                    children: securityItem.description
                                                }, void 0, false, {
                                                    fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                    lineNumber: 352,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                            lineNumber: 348,
                                            columnNumber: 21
                                        }, this),
                                        index < veiligheidDataFlowItems.length - 1 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "absolute left-[4px] top-[36px] h-[150px] w-px bg-[#BD0265] max-[500px]:hidden md:h-[94px]",
                                            "aria-hidden": "true"
                                        }, void 0, false, {
                                            fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                            lineNumber: 357,
                                            columnNumber: 23
                                        }, this) : null
                                    ]
                                }, `${securityItem.title}-${index}`, true, {
                                    fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                    lineNumber: 136,
                                    columnNumber: 19
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                            lineNumber: 134,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                        lineNumber: 133,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                    lineNumber: 119,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    ref: securityCardsRef,
                    className: `grid w-full md:grid-cols-3 ${securityGridGapClass}`,
                    children: securityItems.map((securityItem, index)=>{
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `flex w-full flex-col gap-0 rounded-2xl bg-white p-6 pb-8 shadow-[0_8px_20px_rgba(15,23,42,0.08)] ${disableAnimations || areSecurityCardsVisible ? "translate-y-0" : "translate-y-[20px]"}`,
                            style: {
                                transitionProperty: "translate, transform",
                                transitionDuration: `${SECURITY_CARD_REVEAL_DURATION_MS}ms, ${SECURITY_CARD_REVEAL_DURATION_MS}ms`,
                                transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1), cubic-bezier(0.22,1,0.36,1)"
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-2 ml-2 flex items-start gap-3 self-start",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                            src: securityItem.icon,
                                            alt: "",
                                            width: 24,
                                            height: 24
                                        }, void 0, false, {
                                            fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                            lineNumber: 389,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "font-[var(--font-catamaran)] text-[20px] font-bold text-[#BD0265]",
                                            children: securityItem.title
                                        }, void 0, false, {
                                            fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                            lineNumber: 391,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                    lineNumber: 388,
                                    columnNumber: 19
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "mt-3 ml-2 text-[16px] font-normal text-black/70",
                                    children: securityItem.description
                                }, void 0, false, {
                                    fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                    lineNumber: 396,
                                    columnNumber: 19
                                }, this)
                            ]
                        }, `${securityItem.title}-${index}`, true, {
                            fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                            lineNumber: 374,
                            columnNumber: 17
                        }, this);
                    })
                }, void 0, false, {
                    fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                    lineNumber: 368,
                    columnNumber: 11
                }, this),
                showActionButton ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: `${securityButtonTopSpacingClass} flex w-full items-center justify-center ${disableAnimations || areSecurityCardsVisible ? "translate-y-0" : "translate-y-[20px]"}`,
                    style: {
                        transitionProperty: "translate, transform",
                        transitionDuration: `${SECURITY_CARD_REVEAL_DURATION_MS}ms, ${SECURITY_CARD_REVEAL_DURATION_MS}ms`,
                        transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1), cubic-bezier(0.22,1,0.36,1)"
                    },
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$components$2f$Button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        label: "Meer informatie",
                        destination: "/veiligheid",
                        variant: "primary",
                        className: "font-normal"
                    }, void 0, false, {
                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                        lineNumber: 418,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                    lineNumber: 406,
                    columnNumber: 11
                }, this) : null
            ]
        }, void 0, true, {
            fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
            lineNumber: 91,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
        lineNumber: 86,
        columnNumber: 5
    }, this);
}
}),
"[project]/Coachscribe/website/components/home/FrequentlyAskedQuestionsSection.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>FrequentlyAskedQuestionsSection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$components$2f$home$2f$SectionContainer$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/components/home/SectionContainer.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$content$2f$siteCopy$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Coachscribe/website/content/siteCopy/index.ts [app-ssr] (ecmascript) <locals>");
"use client";
;
;
;
;
function FrequentlyAskedQuestionsSection() {
    const [expandedQuestion, setExpandedQuestion] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const homeCopy = __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$content$2f$siteCopy$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["siteCopy"].home;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$components$2f$home$2f$SectionContainer$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
        className: "bg-[#F8F9F9]",
        contentClassName: "md:pt-20 md:pb-20",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex w-full flex-col gap-8",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    className: "text-3xl font-semibold text-[#1D0A00] md:text-5xl xl:text-6xl",
                    children: homeCopy.faqTitle
                }, void 0, false, {
                    fileName: "[project]/Coachscribe/website/components/home/FrequentlyAskedQuestionsSection.tsx",
                    lineNumber: 14,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-full border-y border-black/40",
                    children: homeCopy.faqItems.map((questionItem, index)=>{
                        const isExpanded = expandedQuestion === questionItem.question;
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: index === 0 ? "" : "border-t border-black/40",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    "aria-expanded": isExpanded,
                                    "aria-controls": `faq-answer-${index}`,
                                    onClick: ()=>setExpandedQuestion((previousQuestion)=>previousQuestion === questionItem.question ? null : questionItem.question),
                                    className: "flex w-full cursor-pointer items-center justify-between gap-6 py-5 text-left text-[#1D0A00] transition-colors hover:text-[#BD0265]",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-base font-semibold md:text-xl",
                                            children: questionItem.question
                                        }, void 0, false, {
                                            fileName: "[project]/Coachscribe/website/components/home/FrequentlyAskedQuestionsSection.tsx",
                                            lineNumber: 38,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            "aria-hidden": "true",
                                            className: `shrink-0 ${isExpanded ? "rotate-45" : ""}`,
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                xmlns: "http://www.w3.org/2000/svg",
                                                width: "24",
                                                height: "24",
                                                viewBox: "0 0 24 24",
                                                fill: "none",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M6 12H18",
                                                        stroke: "#1D0A00",
                                                        strokeWidth: "2",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/FrequentlyAskedQuestionsSection.tsx",
                                                        lineNumber: 52,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M12 18V6",
                                                        stroke: "#1D0A00",
                                                        strokeWidth: "2",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/FrequentlyAskedQuestionsSection.tsx",
                                                        lineNumber: 59,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Coachscribe/website/components/home/FrequentlyAskedQuestionsSection.tsx",
                                                lineNumber: 45,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/Coachscribe/website/components/home/FrequentlyAskedQuestionsSection.tsx",
                                            lineNumber: 41,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Coachscribe/website/components/home/FrequentlyAskedQuestionsSection.tsx",
                                    lineNumber: 25,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    id: `faq-answer-${index}`,
                                    className: isExpanded ? "block" : "hidden",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "pb-5 text-base font-normal leading-relaxed text-[#1D0A00]",
                                        children: questionItem.answer
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/home/FrequentlyAskedQuestionsSection.tsx",
                                        lineNumber: 73,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/Coachscribe/website/components/home/FrequentlyAskedQuestionsSection.tsx",
                                    lineNumber: 69,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, questionItem.question, true, {
                            fileName: "[project]/Coachscribe/website/components/home/FrequentlyAskedQuestionsSection.tsx",
                            lineNumber: 21,
                            columnNumber: 15
                        }, this);
                    })
                }, void 0, false, {
                    fileName: "[project]/Coachscribe/website/components/home/FrequentlyAskedQuestionsSection.tsx",
                    lineNumber: 17,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/Coachscribe/website/components/home/FrequentlyAskedQuestionsSection.tsx",
            lineNumber: 13,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Coachscribe/website/components/home/FrequentlyAskedQuestionsSection.tsx",
        lineNumber: 12,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=Coachscribe_website_c0c3df47._.js.map