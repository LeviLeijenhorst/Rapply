(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/Coachscribe/website/components/RevealOnScroll.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>RevealOnScroll
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function RevealOnScroll({ children, className, threshold = 0.2, rootMargin = "0px", hiddenClassName = "translate-y-4 opacity-0", visibleClassName = "translate-y-0 opacity-100", minScrollY = 0 }) {
    _s();
    const [isVisible, setIsVisible] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "RevealOnScroll.useEffect": ()=>{
            const element = containerRef.current;
            if (!element) return;
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            if (!("IntersectionObserver" in window)) {
                setIsVisible(true);
                return;
            }
            const observer = new IntersectionObserver({
                "RevealOnScroll.useEffect": ([entry])=>{
                    if (!entry.isIntersecting) return;
                    if (("TURBOPACK compile-time value", "object") !== "undefined" && window.scrollY < minScrollY) {
                        return;
                    }
                    setIsVisible(true);
                    observer.disconnect();
                }
            }["RevealOnScroll.useEffect"], {
                threshold,
                rootMargin
            });
            observer.observe(element);
            return ({
                "RevealOnScroll.useEffect": ()=>observer.disconnect()
            })["RevealOnScroll.useEffect"];
        }
    }["RevealOnScroll.useEffect"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: containerRef,
        className: `transition-all duration-700 ease-out ${isVisible ? visibleClassName : hiddenClassName} ${className ?? ""}`,
        children: children
    }, void 0, false, {
        fileName: "[project]/Coachscribe/website/components/RevealOnScroll.tsx",
        lineNumber: 58,
        columnNumber: 5
    }, this);
}
_s(RevealOnScroll, "IJLfvxrb1c7Rge5M9+Yv0GNVd8M=");
_c = RevealOnScroll;
var _c;
__turbopack_context__.k.register(_c, "RevealOnScroll");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Coachscribe/website/components/home/SectionContainer.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SectionContainer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$components$2f$RevealOnScroll$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/components/RevealOnScroll.tsx [app-client] (ecmascript)");
;
;
function SectionContainer({ children, className, contentClassName, disableReveal = false }) {
    const sectionContent = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `mx-auto w-full max-w-6xl p-6 md:p-10 ${contentClassName ?? ""}`,
        children: children
    }, void 0, false, {
        fileName: "[project]/Coachscribe/website/components/home/SectionContainer.tsx",
        lineNumber: 17,
        columnNumber: 5
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: `w-full ${className ?? ""}`,
        children: disableReveal ? sectionContent : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$components$2f$RevealOnScroll$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
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
_c = SectionContainer;
var _c;
__turbopack_context__.k.register(_c, "SectionContainer");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Coachscribe/website/components/coaches/CoachesFrequentlyAskedQuestionsSection.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>CoachesFrequentlyAskedQuestionsSection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$components$2f$home$2f$SectionContainer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/components/home/SectionContainer.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const questions = [
    {
        question: "Voor welke coaches is CoachScribe geschikt?",
        answer: "CoachScribe is specifiek ontwikkeld voor loopbaan- en re-integratiecoaches. Het helpt je om sessies gestructureerd vast te leggen, clientinformatie veilig te bewaren en snel terug te vinden wat belangrijk is zodat jij je kunt focussen op de begeleiding zelf."
    },
    {
        question: "Kan CoachScribe worden gebruikt voor re-integratietrajecten?",
        answer: "Ja. CoachScribe ondersteunt re-integratiecoaches bij het vastleggen van gesprekken en het bijhouden van voortgang per client. Of je nu werkt aan een eerste of tweede spoor traject, CoachScribe helpt je om overzicht te bewaren en verslaglegging efficient te houden."
    },
    {
        question: "Ondersteunt CoachScribe verslaglegging voor UWV of werkgevers?",
        answer: "CoachScribe helpt je om sessieverslagen gestructureerd bij te houden. De gegenereerde verslagen kun je gebruiken als basis voor rapportages richting UWV, werkgevers of opdrachtgevers. Jij bepaalt altijd wat je deelt en wat je bewaart."
    },
    {
        question: "Is CoachScribe geschikt als ik werk met meerdere opdrachtgevers tegelijk?",
        answer: "Ja. CoachScribe is ontworpen voor coaches die meerdere clienten en trajecten tegelijk begeleiden. Je houdt per client een overzichtelijk dossier bij, ongeacht voor welke opdrachtgever of organisatie je werkt."
    },
    {
        question: "Kan ik CoachScribe gebruiken als zelfstandig loopbaancoach?",
        answer: "Ja. CoachScribe is geschikt voor zowel zelfstandige coaches als coaches die in dienst zijn van een organisatie of re-integratiebureau. Je kunt direct starten, zonder minimum aantal clienten of sessies."
    },
    {
        question: "Hoe zit het met de privacy van mijn clienten?",
        answer: "Privacy staat bij CoachScribe op de eerste plaats. Alle gegevens worden versleuteld opgeslagen en verwerkt binnen de Europese Unie, in lijn met de AVG. Jouw data wordt nooit gebruikt om AI-modellen te trainen, en jij bepaalt zelf wat je bewaart of verwijdert."
    }
];
function CoachesFrequentlyAskedQuestionsSection() {
    _s();
    const [expandedQuestion, setExpandedQuestion] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$components$2f$home$2f$SectionContainer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        className: "bg-[#F8F9F9]",
        contentClassName: "md:pt-20 md:pb-20",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            id: "faq",
            className: "flex w-full flex-col gap-8",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    className: "text-3xl font-semibold text-[#1D0A00] md:text-5xl xl:text-6xl",
                    children: "Veel gestelde vragen"
                }, void 0, false, {
                    fileName: "[project]/Coachscribe/website/components/coaches/CoachesFrequentlyAskedQuestionsSection.tsx",
                    lineNumber: 45,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-full border-y border-black/40",
                    children: questions.map((questionItem, index)=>{
                        const isExpanded = expandedQuestion === questionItem.question;
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: index === 0 ? "" : "border-t border-black/40",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    "aria-expanded": isExpanded,
                                    "aria-controls": `faq-answer-${index}`,
                                    onClick: ()=>setExpandedQuestion((previousQuestion)=>previousQuestion === questionItem.question ? null : questionItem.question),
                                    className: "flex w-full cursor-pointer items-center justify-between gap-6 py-5 text-left text-[#1D0A00] transition-colors hover:text-[#BD0265]",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-base font-semibold md:text-xl",
                                            children: questionItem.question
                                        }, void 0, false, {
                                            fileName: "[project]/Coachscribe/website/components/coaches/CoachesFrequentlyAskedQuestionsSection.tsx",
                                            lineNumber: 69,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            "aria-hidden": "true",
                                            className: `shrink-0 transition-transform duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isExpanded ? "rotate-45" : ""}`,
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                xmlns: "http://www.w3.org/2000/svg",
                                                width: "24",
                                                height: "24",
                                                viewBox: "0 0 24 24",
                                                fill: "none",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M6 12H18",
                                                        stroke: "#1D0A00",
                                                        strokeWidth: "2",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/coaches/CoachesFrequentlyAskedQuestionsSection.tsx",
                                                        lineNumber: 85,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M12 18V6",
                                                        stroke: "#1D0A00",
                                                        strokeWidth: "2",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/coaches/CoachesFrequentlyAskedQuestionsSection.tsx",
                                                        lineNumber: 92,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Coachscribe/website/components/coaches/CoachesFrequentlyAskedQuestionsSection.tsx",
                                                lineNumber: 78,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/Coachscribe/website/components/coaches/CoachesFrequentlyAskedQuestionsSection.tsx",
                                            lineNumber: 72,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Coachscribe/website/components/coaches/CoachesFrequentlyAskedQuestionsSection.tsx",
                                    lineNumber: 56,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    id: `faq-answer-${index}`,
                                    className: isExpanded ? "block" : "hidden",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "pb-5 text-base font-normal leading-relaxed text-[#1D0A00]",
                                        children: questionItem.answer
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/coaches/CoachesFrequentlyAskedQuestionsSection.tsx",
                                        lineNumber: 106,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/Coachscribe/website/components/coaches/CoachesFrequentlyAskedQuestionsSection.tsx",
                                    lineNumber: 102,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, questionItem.question, true, {
                            fileName: "[project]/Coachscribe/website/components/coaches/CoachesFrequentlyAskedQuestionsSection.tsx",
                            lineNumber: 52,
                            columnNumber: 15
                        }, this);
                    })
                }, void 0, false, {
                    fileName: "[project]/Coachscribe/website/components/coaches/CoachesFrequentlyAskedQuestionsSection.tsx",
                    lineNumber: 48,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/Coachscribe/website/components/coaches/CoachesFrequentlyAskedQuestionsSection.tsx",
            lineNumber: 44,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Coachscribe/website/components/coaches/CoachesFrequentlyAskedQuestionsSection.tsx",
        lineNumber: 43,
        columnNumber: 5
    }, this);
}
_s(CoachesFrequentlyAskedQuestionsSection, "NQv3Nx6Z0rI0zSTHtaXNrYSENqc=");
_c = CoachesFrequentlyAskedQuestionsSection;
var _c;
__turbopack_context__.k.register(_c, "CoachesFrequentlyAskedQuestionsSection");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Coachscribe/website/home/security-safe.svg (static in ecmascript, tag client)", ((__turbopack_context__) => {

__turbopack_context__.v("/_next/static/media/security-safe.ad553c63.svg");}),
"[project]/Coachscribe/website/home/security-safe.svg.mjs { IMAGE => \"[project]/Coachscribe/website/home/security-safe.svg (static in ecmascript, tag client)\" } [app-client] (structured image object with data url, ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Coachscribe/website/home/lock.svg (static in ecmascript, tag client)", ((__turbopack_context__) => {

__turbopack_context__.v("/_next/static/media/lock.a67fcf7a.svg");}),
"[project]/Coachscribe/website/home/lock.svg.mjs { IMAGE => \"[project]/Coachscribe/website/home/lock.svg (static in ecmascript, tag client)\" } [app-client] (structured image object with data url, ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Coachscribe/website/home/security.svg (static in ecmascript, tag client)", ((__turbopack_context__) => {

__turbopack_context__.v("/_next/static/media/security.de3b76e8.svg");}),
"[project]/Coachscribe/website/home/security.svg.mjs { IMAGE => \"[project]/Coachscribe/website/home/security.svg (static in ecmascript, tag client)\" } [app-client] (structured image object with data url, ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Coachscribe/website/components/home/SecuritySection.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SecuritySection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/image.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$components$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/components/Button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$components$2f$home$2f$SectionContainer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/components/home/SectionContainer.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$home$2f$security$2d$safe$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$home$2f$security$2d$safe$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__ = __turbopack_context__.i('[project]/Coachscribe/website/home/security-safe.svg.mjs { IMAGE => "[project]/Coachscribe/website/home/security-safe.svg (static in ecmascript, tag client)" } [app-client] (structured image object with data url, ecmascript)');
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$home$2f$lock$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$home$2f$lock$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__ = __turbopack_context__.i('[project]/Coachscribe/website/home/lock.svg.mjs { IMAGE => "[project]/Coachscribe/website/home/lock.svg (static in ecmascript, tag client)" } [app-client] (structured image object with data url, ecmascript)');
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$home$2f$security$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$home$2f$security$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__ = __turbopack_context__.i('[project]/Coachscribe/website/home/security.svg.mjs { IMAGE => "[project]/Coachscribe/website/home/security.svg (static in ecmascript, tag client)" } [app-client] (structured image object with data url, ecmascript)');
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
const securityItems = [
    {
        title: "Verwerking binnen Europa",
        description: "CoachScribe verwerkt en bewaart sessiegegevens binnen de Europese Unie. Zo sluiten opslag en verwerking aan op de AVG.",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$home$2f$security$2d$safe$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$home$2f$security$2d$safe$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__["default"]
    },
    {
        title: "Versleuteld van upload tot opslag",
        description: "Audio voor transcriptie wordt versleuteld verzonden. Transcripties, samenvattingen en notities blijven versleuteld opgeslagen.",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$home$2f$lock$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$home$2f$lock$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__["default"]
    },
    {
        title: "Jouw data blijft van jou",
        description: "Jouw data wordt niet gebruikt om AI-modellen te trainen. Jij bepaalt wat je bewaart en kunt je gegevens verwijderen wanneer jij wilt.",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$home$2f$security$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$home$2f$security$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__["default"]
    }
];
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
    _s();
    const securityCardsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [areSecurityCardsVisible, setAreSecurityCardsVisible] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const renderedSecurityItems = duplicateCards ? veiligheidDataFlowItems : securityItems;
    const securityGridGapClass = duplicateCards ? "gap-[30px]" : "gap-6";
    const securityButtonTopSpacingClass = duplicateCards ? "mt-[30px]" : "mt-2";
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SecuritySection.useEffect": ()=>{
            const element = securityCardsRef.current;
            if (!element) return;
            if (("TURBOPACK compile-time value", "object") === "undefined" || !("IntersectionObserver" in window)) {
                setAreSecurityCardsVisible(true);
                return;
            }
            const observer = new IntersectionObserver({
                "SecuritySection.useEffect": ([entry])=>{
                    if (!entry.isIntersecting) return;
                    if (entry.intersectionRatio < 0.15) return;
                    setAreSecurityCardsVisible(true);
                    observer.disconnect();
                }
            }["SecuritySection.useEffect"], {
                threshold: [
                    0,
                    0.15,
                    1
                ]
            });
            observer.observe(element);
            return ({
                "SecuritySection.useEffect": ()=>observer.disconnect()
            })["SecuritySection.useEffect"];
        }
    }["SecuritySection.useEffect"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$components$2f$home$2f$SectionContainer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        className: "bg-white bg-[linear-gradient(to_top_right,_rgba(184,212,255,0.25),_rgba(198,175,255,0.25))]",
        contentClassName: duplicateCards ? "pt-12 pb-14 md:pt-16 md:pb-20" : "md:pb-[60px]",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: `flex w-full flex-col ${duplicateCards ? "gap-12" : "gap-8 md:pt-5"}`,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex w-full flex-col items-center gap-3 text-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "font-[var(--font-catamaran)] text-[34px] font-medium leading-[120%] text-black md:text-[40px]",
                            children: duplicateCards ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    "Hoe CoachScribe",
                                    " ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-[#BD0265]",
                                        children: "met gegevens omgaat"
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                        lineNumber: 120,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    "Ontworpen met ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-[#BD0265]",
                                        children: "veiligheid op #1"
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                        lineNumber: 124,
                                        columnNumber: 31
                                    }, this)
                                ]
                            }, void 0, true)
                        }, void 0, false, {
                            fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                            lineNumber: 116,
                            columnNumber: 11
                        }, this),
                        duplicateCards ? null : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-base font-normal text-black/70 md:text-lg",
                            children: "Beschermde opslag, duidelijke regels en volledige controle over jouw data."
                        }, void 0, false, {
                            fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                            lineNumber: 129,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                    lineNumber: 115,
                    columnNumber: 9
                }, this),
                duplicateCards ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    ref: securityCardsRef,
                    className: `mx-auto w-full max-w-4xl ${disableAnimations || areSecurityCardsVisible ? "translate-y-0" : "translate-y-[20px]"}`,
                    style: {
                        transitionProperty: "translate, transform",
                        transitionDuration: `${SECURITY_CARD_REVEAL_DURATION_MS}ms, ${SECURITY_CARD_REVEAL_DURATION_MS}ms`,
                        transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1), cubic-bezier(0.22,1,0.36,1)"
                    },
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative pl-10 max-[500px]:pl-0 md:pl-12",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex w-full flex-col",
                            children: veiligheidDataFlowItems.map((securityItem, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "relative h-[196px] w-full md:h-[140px]",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: `absolute max-[500px]:hidden ${index === 2 ? "left-[-12px]" : "left-[-8px]"} ${index === 2 ? "top-[-2px] h-8 w-8" : "top-[2px] h-6 w-6"}`,
                                            "aria-hidden": "true",
                                            children: index === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                xmlns: "http://www.w3.org/2000/svg",
                                                width: "24",
                                                height: "24",
                                                viewBox: "0 0 24 24",
                                                fill: "none",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M7.99963 10.02V11.5C7.99963 13.71 9.78963 15.5 11.9996 15.5C14.2096 15.5 15.9996 13.71 15.9996 11.5V6C15.9996 3.79 14.2096 2 11.9996 2C9.78963 2 7.99963 3.79 7.99963 6",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 173,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M4.34961 9.6499V11.3499C4.34961 15.5699 7.77961 18.9999 11.9996 18.9999C16.2196 18.9999 19.6496 15.5699 19.6496 11.3499V9.6499",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 180,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M10.6096 6.43012C11.5096 6.10012 12.4896 6.10012 13.3896 6.43012",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 187,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M11.1996 8.55007C11.7296 8.41007 12.2796 8.41007 12.8096 8.55007",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 194,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M11.9996 19V22",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 201,
                                                        columnNumber: 27
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                lineNumber: 166,
                                                columnNumber: 25
                                            }, this) : index === 1 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                xmlns: "http://www.w3.org/2000/svg",
                                                width: "24",
                                                height: "24",
                                                viewBox: "0 0 24 24",
                                                fill: "none",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M19.7901 14.9301C17.7301 16.9801 14.7801 17.6101 12.1901 16.8001L7.48015 21.5001C7.14015 21.8501 6.47015 22.0601 5.99015 21.9901L3.81015 21.6901C3.09015 21.5901 2.42015 20.9101 2.31015 20.1901L2.01015 18.0101C1.94015 17.5301 2.17015 16.8601 2.50015 16.5201L7.20015 11.8201C6.40015 9.22007 7.02015 6.27007 9.08015 4.22007C12.0301 1.27007 16.8201 1.27007 19.7801 4.22007C22.7401 7.17007 22.7401 11.9801 19.7901 14.9301Z",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeMiterlimit: "10",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 217,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M6.89014 17.49L9.19014 19.79",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeMiterlimit: "10",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 225,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M14.5 11C15.3284 11 16 10.3284 16 9.5C16 8.67157 15.3284 8 14.5 8C13.6716 8 13 8.67157 13 9.5C13 10.3284 13.6716 11 14.5 11Z",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 233,
                                                        columnNumber: 27
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                lineNumber: 210,
                                                columnNumber: 25
                                            }, this) : index === 2 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                xmlns: "http://www.w3.org/2000/svg",
                                                width: "32",
                                                height: "32",
                                                viewBox: "0 0 512 512",
                                                fill: "none",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    fill: "#BD0265",
                                                    d: "M256 46.305l-9.404 19.054-21.03 3.056 15.217 14.832-3.592 20.945L256 94.305l18.81 9.888-3.593-20.945 15.217-14.832-21.03-3.057L256 46.304zM167.566 72.63l-9.404 19.056-21.03 3.056 15.218 14.832-3.592 20.946 18.808-9.89 18.81 9.89-3.593-20.946L198 94.742l-21.03-3.056-9.404-19.055zm176.868 0l-9.405 19.056L314 94.742l15.217 14.832-3.592 20.946 18.81-9.89 18.807 9.89-3.592-20.946 15.217-14.832-21.03-3.056-9.403-19.055zm-243.868 67.425l-9.404 19.054-21.03 3.056 15.218 14.832-3.592 20.945 18.808-9.888 18.81 9.888-3.593-20.945L131 162.166l-21.03-3.057-9.404-19.055zm310.868 0l-9.405 19.054-21.03 3.056 15.217 14.832-3.592 20.945 18.81-9.888 18.807 9.888-3.592-20.945 15.217-14.832-21.03-3.057-9.403-19.055zM76.566 228.55l-9.404 19.054-21.03 3.056 15.218 14.832-3.592 20.945 18.808-9.888 18.81 9.887-3.593-20.945L107 250.66l-21.03-3.056-9.404-19.055zm358.868 0l-9.405 19.054L405 250.66l15.217 14.832-3.592 20.945 18.81-9.888 18.807 9.887-3.592-20.945 15.217-14.832-21.03-3.056-9.403-19.055zm-334.868 89.897l-9.404 19.055-21.03 3.057 15.218 14.83-3.592 20.946 18.808-9.89 18.81 9.89-3.593-20.945L131 340.56l-21.03-3.058-9.404-19.055zm310.868 0l-9.405 19.055L381 340.56l15.217 14.83-3.592 20.946 18.81-9.89 18.807 9.89-3.592-20.945 15.217-14.83-21.03-3.058-9.403-19.055zm-243.868 65.746l-9.404 19.055-21.03 3.057 15.218 14.832-3.592 20.945 18.808-9.89 18.81 9.89-3.593-20.945L198 406.305l-21.03-3.057-9.404-19.055zm176.868 0l-9.405 19.055-21.03 3.057 15.217 14.832-3.592 20.945 18.81-9.89 18.807 9.89-3.592-20.945 15.217-14.832-21.03-3.057-9.403-19.055zm-88.61 23.614l-9.404 19.056-21.03 3.055 15.217 14.834-3.59 20.943.385-.203-.035.203L256 455.898l18.633 9.797-.035-.203.386.203-3.59-20.943 15.215-14.834-21.03-3.055-9.404-19.056-.176.355-.176-.355z"
                                                }, void 0, false, {
                                                    fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                    lineNumber: 249,
                                                    columnNumber: 27
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                lineNumber: 242,
                                                columnNumber: 25
                                            }, this) : index === 3 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                xmlns: "http://www.w3.org/2000/svg",
                                                width: "24",
                                                height: "24",
                                                viewBox: "0 0 24 24",
                                                fill: "none",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M19.32 10H4.69002C3.21002 10 2.01001 8.79002 2.01001 7.32002V4.69002C2.01001 3.21002 3.22002 2.01001 4.69002 2.01001H19.32C20.8 2.01001 22 3.22002 22 4.69002V7.32002C22 8.79002 20.79 10 19.32 10Z",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 262,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M19.32 22H4.69002C3.21002 22 2.01001 20.79 2.01001 19.32V16.69C2.01001 15.21 3.22002 14.01 4.69002 14.01H19.32C20.8 14.01 22 15.22 22 16.69V19.32C22 20.79 20.79 22 19.32 22Z",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 269,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M6 5V7",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 276,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M10 5V7",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 283,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M6 17V19",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 290,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M10 17V19",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 297,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M14 6H18",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 304,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M14 18H18",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 311,
                                                        columnNumber: 27
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                lineNumber: 255,
                                                columnNumber: 25
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                xmlns: "http://www.w3.org/2000/svg",
                                                width: "24",
                                                height: "24",
                                                viewBox: "0 0 24 24",
                                                fill: "none",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M21 5.97998C17.67 5.64998 14.32 5.47998 10.98 5.47998C9 5.47998 7.02 5.57998 5.04 5.77998L3 5.97998",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 327,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M8.5 4.97L8.72 3.66C8.88 2.71 9 2 10.69 2H13.31C15 2 15.13 2.75 15.28 3.67L15.5 4.97",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 334,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M18.8499 9.13989L18.1999 19.2099C18.0899 20.7799 17.9999 21.9999 15.2099 21.9999H8.7899C5.9999 21.9999 5.9099 20.7799 5.7999 19.2099L5.1499 9.13989",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 341,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M10.3301 16.5H13.6601",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 348,
                                                        columnNumber: 27
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M9.5 12.5H14.5",
                                                        stroke: "#BD0265",
                                                        strokeWidth: "1.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                        lineNumber: 355,
                                                        columnNumber: 27
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                lineNumber: 320,
                                                columnNumber: 25
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                            lineNumber: 157,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "relative flex w-full flex-col gap-2 pl-[106px] max-[500px]:pl-0",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    className: "font-[var(--font-catamaran)] text-[24px] font-bold text-[#BD0265]",
                                                    children: securityItem.title
                                                }, void 0, false, {
                                                    fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                    lineNumber: 366,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-[16px] font-normal text-black/70",
                                                    children: securityItem.description
                                                }, void 0, false, {
                                                    fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                                    lineNumber: 369,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                            lineNumber: 365,
                                            columnNumber: 21
                                        }, this),
                                        index < veiligheidDataFlowItems.length - 1 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "absolute left-[4px] top-[36px] h-[150px] w-px bg-[#BD0265] max-[500px]:hidden md:h-[94px]",
                                            "aria-hidden": "true"
                                        }, void 0, false, {
                                            fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                            lineNumber: 374,
                                            columnNumber: 23
                                        }, this) : null
                                    ]
                                }, `${securityItem.title}-${index}`, true, {
                                    fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                    lineNumber: 153,
                                    columnNumber: 19
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                            lineNumber: 151,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                        lineNumber: 150,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                    lineNumber: 136,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    ref: securityCardsRef,
                    className: `grid w-full md:grid-cols-3 ${securityGridGapClass}`,
                    children: securityItems.map((securityItem, index)=>{
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `flex w-full flex-col gap-0 rounded-2xl bg-white p-6 pb-8 shadow-[0_8px_20px_rgba(15,23,42,0.08)] ${disableAnimations || areSecurityCardsVisible ? "translate-y-0" : "translate-y-[20px]"}`,
                            style: {
                                transitionProperty: "translate, transform",
                                transitionDuration: `${SECURITY_CARD_REVEAL_DURATION_MS}ms, ${SECURITY_CARD_REVEAL_DURATION_MS}ms`,
                                transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1), cubic-bezier(0.22,1,0.36,1)"
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-2 ml-2 flex items-start gap-3 self-start",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            src: securityItem.icon,
                                            alt: "",
                                            width: 24,
                                            height: 24
                                        }, void 0, false, {
                                            fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                            lineNumber: 406,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "font-[var(--font-catamaran)] text-[20px] font-bold text-[#BD0265]",
                                            children: securityItem.title
                                        }, void 0, false, {
                                            fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                            lineNumber: 408,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                    lineNumber: 405,
                                    columnNumber: 19
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "mt-3 ml-2 text-[16px] font-normal text-black/70",
                                    children: securityItem.description
                                }, void 0, false, {
                                    fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                    lineNumber: 413,
                                    columnNumber: 19
                                }, this)
                            ]
                        }, `${securityItem.title}-${index}`, true, {
                            fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                            lineNumber: 391,
                            columnNumber: 17
                        }, this);
                    })
                }, void 0, false, {
                    fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                    lineNumber: 385,
                    columnNumber: 11
                }, this),
                showActionButton ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: `${securityButtonTopSpacingClass} flex w-full items-center justify-center ${disableAnimations || areSecurityCardsVisible ? "translate-y-0" : "translate-y-[20px]"}`,
                    style: {
                        transitionProperty: "translate, transform",
                        transitionDuration: `${SECURITY_CARD_REVEAL_DURATION_MS}ms, ${SECURITY_CARD_REVEAL_DURATION_MS}ms`,
                        transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1), cubic-bezier(0.22,1,0.36,1)"
                    },
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$components$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        label: "Meer informatie",
                        destination: "/veiligheid",
                        variant: "primary",
                        className: "font-normal"
                    }, void 0, false, {
                        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                        lineNumber: 435,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                    lineNumber: 423,
                    columnNumber: 11
                }, this) : null
            ]
        }, void 0, true, {
            fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
            lineNumber: 109,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
        lineNumber: 104,
        columnNumber: 5
    }, this);
}
_s(SecuritySection, "IjALALrwGXUuKrfyWbreo8iub6U=");
_c = SecuritySection;
var _c;
__turbopack_context__.k.register(_c, "SecuritySection");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Coachscribe/website/components/home/PricingSection.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PricingSection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$components$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/components/Button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/lib/api.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const ENTRA_ACCESS_TOKEN_KEY = "entra_access_token";
const APP_URL = "https://app.coachscribe.nl";
function formatEuroPrice(value) {
    return new Intl.NumberFormat("nl-NL", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}
function PricingSection(props) {
    _s();
    const [plans, setPlans] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [isVisible, setIsVisible] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [hoursSavedPerWeek, setHoursSavedPerWeek] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(4);
    const [averageSessionPrice, setAverageSessionPrice] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(150);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PricingSection.useEffect": ()=>{
            let isCancelled = false;
            async function load() {
                setIsLoading(true);
                try {
                    const plansResponse = await fetch((0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getApiUrl"])("/pricing/plans/public"), {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({})
                    });
                    if (!plansResponse.ok) {
                        throw new Error(`Pricing request failed: ${plansResponse.status}`);
                    }
                    const plansPayload = await plansResponse.json();
                    if (!isCancelled) {
                        setPlans(Array.isArray(plansPayload.items) ? plansPayload.items : []);
                    }
                } catch  {
                    if (!isCancelled) {
                        setPlans([]);
                    }
                }
                let accessToken = null;
                if ("TURBOPACK compile-time truthy", 1) {
                    try {
                        accessToken = window.sessionStorage.getItem(ENTRA_ACCESS_TOKEN_KEY);
                    } catch  {
                        accessToken = null;
                    }
                }
                if (!accessToken) {
                    if (!isCancelled) {
                        setIsVisible(true);
                        setIsLoading(false);
                    }
                    return;
                }
                try {
                    const visibilityResponse = await fetch((0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getApiUrl"])("/pricing/me-visibility"), {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${accessToken}`
                        },
                        body: JSON.stringify({})
                    });
                    if (!visibilityResponse.ok) {
                        throw new Error(`Visibility request failed: ${visibilityResponse.status}`);
                    }
                    const visibilityPayload = await visibilityResponse.json();
                    if (!isCancelled) {
                        setIsVisible(Boolean(visibilityPayload.canSeePricingPage));
                    }
                } catch  {
                    if (!isCancelled) {
                        setIsVisible(true);
                    }
                } finally{
                    if (!isCancelled) {
                        setIsLoading(false);
                    }
                }
            }
            void load();
            return ({
                "PricingSection.useEffect": ()=>{
                    isCancelled = true;
                }
            })["PricingSection.useEffect"];
        }
    }["PricingSection.useEffect"], []);
    const primaryPlan = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "PricingSection.useMemo[primaryPlan]": ()=>plans[0] ?? null
    }["PricingSection.useMemo[primaryPlan]"], [
        plans
    ]);
    const estimatedReportsPerMonth = primaryPlan ? Math.max(0, Math.floor(primaryPlan.minutesPerMonth / 60)) : 0;
    const savedHoursPerMonth = hoursSavedPerWeek * 4.33;
    const sessionDurationHours = 1;
    const estimatedSessionsPerMonth = Math.max(0, savedHoursPerMonth / sessionDurationHours);
    const monthlyRevenue = Math.max(0, estimatedSessionsPerMonth * averageSessionPrice);
    const monthlySubscriptionCost = primaryPlan?.monthlyPrice ?? 0;
    const monthlyNetProfit = monthlyRevenue - monthlySubscriptionCost;
    if (!isVisible) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "w-full py-12 md:py-16",
        "data-reveal-disabled": props.disableReveal ? "1" : "0",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mx-auto w-full max-w-[1320px] px-6 md:px-10",
            children: isLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex min-h-[470px] w-full items-center justify-center",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "h-10 w-10 animate-spin rounded-full border-4 border-[#BE0165]/25 border-t-[#BE0165]",
                    "aria-label": "Prijzen laden"
                }, void 0, false, {
                    fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                    lineNumber: 146,
                    columnNumber: 13
                }, this)
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 145,
                columnNumber: 11
            }, this) : !primaryPlan ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-[14px] leading-[20px] text-[rgba(38,52,63,0.8)]",
                children: "Er zijn nog geen abonnementen beschikbaar."
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 152,
                columnNumber: 11
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid w-full grid-cols-1 gap-4 xl:grid-cols-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex min-h-[420px] flex-col gap-5 rounded-2xl border border-[#E0E0E0] bg-[#FFFFFF] p-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center justify-between gap-3",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-[20px] font-semibold leading-6 text-[#1D0A00]",
                                                        children: "Tijdsbesparing per week (uren)"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                        lineNumber: 161,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "rounded-lg border border-[#E0E0E0] bg-[#FEFEFE] px-3 py-2 text-[14px] leading-[18px] text-[#1D0A00]",
                                                        children: [
                                                            hoursSavedPerWeek.toFixed(1).replace(".", ","),
                                                            " uur"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                        lineNumber: 164,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                lineNumber: 160,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "range",
                                                min: 0.3,
                                                max: 16,
                                                step: 0.1,
                                                value: hoursSavedPerWeek,
                                                onChange: (event)=>{
                                                    setHoursSavedPerWeek(Number(event.currentTarget.value));
                                                },
                                                className: "w-full cursor-pointer accent-[#BE0165]"
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                lineNumber: 168,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center justify-between text-[14px] leading-[18px] text-[rgba(38,52,63,0.6)]",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "0,3 uur"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                        lineNumber: 180,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "16 uur"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                        lineNumber: 181,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                lineNumber: 179,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-[14px] leading-5 text-[rgba(38,52,63,0.6)]",
                                                children: "Schat hoeveel uren per week je vrijspeelt doordat verslaglegging sneller gaat."
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                lineNumber: 183,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 159,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-[20px] font-semibold leading-6 text-[#1D0A00]",
                                                children: "Gemiddelde prijs per sessie (EUR)"
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                lineNumber: 189,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "text",
                                                inputMode: "numeric",
                                                value: String(averageSessionPrice),
                                                onChange: (event)=>{
                                                    const digitsOnly = event.currentTarget.value.replace(/[^\d]/g, "");
                                                    setAverageSessionPrice(digitsOnly ? Number(digitsOnly) : 0);
                                                },
                                                className: "w-full rounded-[10px] border border-[#E0E0E0] bg-[#FEFEFE] px-3 py-2.5 text-[14px] leading-[18px] text-[#1D0A00] outline-none",
                                                placeholder: "150"
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                lineNumber: 192,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 188,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                lineNumber: 158,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex min-h-[420px] flex-col gap-3 rounded-2xl border border-[#E0E0E0] bg-[#FFFFFF] p-6 text-[#1D0A00]",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-start justify-between gap-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "flex-1 text-[18px] font-semibold leading-6 text-[#1D0A00]",
                                                children: "Nieuwe sessies per maand"
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                lineNumber: 211,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-[22px] font-semibold leading-7 text-[#1D0A00]",
                                                children: estimatedSessionsPerMonth.toFixed(1).replace(".", ",")
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                lineNumber: 214,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 210,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-start justify-between gap-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "flex-1 text-[18px] font-semibold leading-6 text-[#1D0A00]",
                                                children: "Opbrengst per maand"
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                lineNumber: 219,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-[22px] font-semibold leading-7 text-[#1D0A00]",
                                                children: formatEuroPrice(monthlyRevenue)
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                lineNumber: 222,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 218,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-start justify-between gap-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "flex-1 text-[18px] font-semibold leading-6 text-[#1D0A00]",
                                                children: "Kosten CoachScribe"
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                lineNumber: 227,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-[22px] font-semibold leading-7 text-[#1D0A00]",
                                                children: formatEuroPrice(monthlySubscriptionCost)
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                lineNumber: 230,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 226,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "my-1 h-px bg-[#E0E0E0]"
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 234,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[26px] font-semibold leading-[30px] text-[#1D0A00]",
                                        children: "Netto opbrengst per maand"
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 235,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[42px] font-bold leading-[46px] text-[#BE0165]",
                                        children: formatEuroPrice(monthlyNetProfit)
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 238,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[20px] leading-6 text-[rgba(38,52,63,0.85)]",
                                        children: [
                                            "Dit is je extra opbrengst",
                                            " ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-semibold",
                                                children: "minus de kosten van CoachScribe."
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                lineNumber: 243,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 241,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                lineNumber: 209,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex min-h-[420px] flex-col gap-4 rounded-2xl border border-[#E0E0E0] bg-[#FEFEFE] p-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[16px] font-semibold leading-5 text-[#1D0A00]",
                                        children: primaryPlan.name
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 250,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-end gap-1.5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-[44px] font-bold leading-[48px] text-[#1D0A00]",
                                                children: formatEuroPrice(primaryPlan.monthlyPrice)
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                lineNumber: 254,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mb-2 text-[14px] leading-[18px] text-[#656565]",
                                                children: "/maand"
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                lineNumber: 257,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 253,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FeatureRow, {
                                                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(VerslagGenererenIcon, {
                                                    size: 22,
                                                    color: "#BE0165"
                                                }, void 0, false, {
                                                    fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                    lineNumber: 262,
                                                    columnNumber: 37
                                                }, void 0),
                                                children: [
                                                    estimatedReportsPerMonth,
                                                    " gespreksverslagen"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                lineNumber: 262,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FeatureRow, {
                                                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(HoursPerMonthIcon, {
                                                    size: 24,
                                                    color: "#BE0165"
                                                }, void 0, false, {
                                                    fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                    lineNumber: 265,
                                                    columnNumber: 37
                                                }, void 0),
                                                children: [
                                                    primaryPlan.minutesPerMonth,
                                                    " transcriptieminuten per maand"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                lineNumber: 265,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FeatureRow, {
                                                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CalendarCircleIcon, {
                                                    size: 24,
                                                    color: "#BE0165"
                                                }, void 0, false, {
                                                    fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 37
                                                }, void 0),
                                                children: "Uren tijdsbesparing per maand"
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                lineNumber: 268,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FeatureRow, {
                                                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StandaardVerslagIcon, {
                                                    size: 20,
                                                    color: "#BE0165"
                                                }, void 0, false, {
                                                    fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                    lineNumber: 271,
                                                    columnNumber: 37
                                                }, void 0),
                                                children: "Automatisch opgebouwde, consistente rapportages"
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                lineNumber: 271,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FeatureRow, {
                                                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SecuritySafeIcon, {
                                                    size: 22,
                                                    color: "#BE0165"
                                                }, void 0, false, {
                                                    fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                    lineNumber: 274,
                                                    columnNumber: 37
                                                }, void 0),
                                                children: "Veilige opslag binnen de EU"
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                lineNumber: 274,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FeatureRow, {
                                                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CoacheesIcon, {
                                                    size: 22,
                                                    color: "#BE0165"
                                                }, void 0, false, {
                                                    fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                    lineNumber: 277,
                                                    columnNumber: 37
                                                }, void 0),
                                                children: "Alle informatie over al je clienten op een plek"
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                lineNumber: 277,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 261,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-auto",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$components$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            label: "Probeer het uit",
                                            destination: APP_URL,
                                            variant: "primary",
                                            className: "h-[46px] w-full rounded-[14px] text-[16px] font-semibold",
                                            openInNewTab: true
                                        }, void 0, false, {
                                            fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                            lineNumber: 282,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 281,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                lineNumber: 249,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                        lineNumber: 157,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-3 flex w-full items-center justify-between gap-3",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-[12px] leading-4 text-[rgba(38,52,63,0.8)]",
                            children: "Gespreksverslagen worden berekend op basis van 60 minuten per gesprek."
                        }, void 0, false, {
                            fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                            lineNumber: 294,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                        lineNumber: 293,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true)
        }, void 0, false, {
            fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
            lineNumber: 143,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
        lineNumber: 139,
        columnNumber: 5
    }, this);
}
_s(PricingSection, "o7xfcuLwoA7haN3V/hR+aAB2BCA=");
_c = PricingSection;
function FeatureRow({ icon, children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex items-center gap-3 text-[14px] leading-[18px] text-[#656565]",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "flex h-6 w-6 items-center justify-center",
                children: icon
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 314,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: children
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 315,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
        lineNumber: 313,
        columnNumber: 5
    }, this);
}
_c1 = FeatureRow;
function VerslagGenererenIcon({ size = 24, color = "#171717" }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        "aria-hidden": "true",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M3.49994 20.5C4.32994 21.33 5.66994 21.33 6.49994 20.5L19.4999 7.5C20.3299 6.67 20.3299 5.33 19.4999 4.5C18.6699 3.67 17.3299 3.67 16.4999 4.5L3.49994 17.5C2.66994 18.33 2.66994 19.67 3.49994 20.5Z",
                stroke: color,
                strokeWidth: "1.5",
                strokeLinecap: "round",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 328,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M18.0098 8.99001L15.0098 5.99001",
                stroke: color,
                strokeWidth: "1.5",
                strokeLinecap: "round",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 335,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M8.5 2.44L10 2L9.56 3.5L10 5L8.5 4.56L7 5L7.44 3.5L7 2L8.5 2.44Z",
                stroke: color,
                strokeWidth: "1.5",
                strokeLinecap: "round",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 336,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M4.5 8.44L6 8L5.56 9.5L6 11L4.5 10.56L3 11L3.44 9.5L3 8L4.5 8.44Z",
                stroke: color,
                strokeWidth: "1.5",
                strokeLinecap: "round",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 337,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M19.5 13.44L21 13L20.56 14.5L21 16L19.5 15.56L18 16L18.44 14.5L18 13L19.5 13.44Z",
                stroke: color,
                strokeWidth: "1.5",
                strokeLinecap: "round",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 338,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
        lineNumber: 327,
        columnNumber: 5
    }, this);
}
_c2 = VerslagGenererenIcon;
function HoursPerMonthIcon({ color = "#BE0165", size = 24 }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        "aria-hidden": "true",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C17.51 22 22 17.51 22 12C22 6.49 17.51 2 12 2ZM16.35 15.57C16.21 15.81 15.96 15.94 15.7 15.94C15.57 15.94 15.44 15.91 15.32 15.83L12.22 13.98C11.45 13.52 10.88 12.51 10.88 11.62V7.52C10.88 7.11 11.22 6.77 11.63 6.77C12.04 6.77 12.38 7.11 12.38 7.52V11.62C12.38 11.98 12.68 12.51 12.99 12.69L16.09 14.54C16.45 14.75 16.57 15.21 16.35 15.57Z",
            fill: color
        }, void 0, false, {
            fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
            lineNumber: 346,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
        lineNumber: 345,
        columnNumber: 5
    }, this);
}
_c3 = HoursPerMonthIcon;
function CalendarCircleIcon({ size = 24, color = "#BE0165" }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        "aria-hidden": "true",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z",
                stroke: color,
                strokeWidth: "1.5",
                strokeMiterlimit: "10",
                strokeLinecap: "round",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 357,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M9.89014 5.82996V7.82996",
                stroke: color,
                strokeWidth: "1.5",
                strokeMiterlimit: "10",
                strokeLinecap: "round",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 365,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M14.1099 5.82996V7.82996",
                stroke: color,
                strokeWidth: "1.5",
                strokeMiterlimit: "10",
                strokeLinecap: "round",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 366,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M7.53003 10.14H16.47",
                stroke: color,
                strokeWidth: "1.5",
                strokeMiterlimit: "10",
                strokeLinecap: "round",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 367,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M13.5 17.6699H10.5C8 17.6699 6.5 15.8699 6.5 13.6699V10.6699C6.5 8.46992 8 6.66992 10.5 6.66992H13.5C16 6.66992 17.5 8.46992 17.5 10.6699V13.6699C17.5 15.8699 16 17.6699 13.5 17.6699Z",
                stroke: color,
                strokeWidth: "1.5",
                strokeMiterlimit: "10",
                strokeLinecap: "round",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 368,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
        lineNumber: 356,
        columnNumber: 5
    }, this);
}
_c4 = CalendarCircleIcon;
function StandaardVerslagIcon({ color = "#BE0165", size = 18 }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        width: size,
        height: size,
        viewBox: "0 0 18 18",
        fill: "none",
        "aria-hidden": "true",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M9 9.75H9.75",
                stroke: color,
                strokeLinecap: "round",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 383,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M5.25 9.75H7.0875",
                stroke: color,
                strokeLinecap: "round",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 384,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M5.25 12.75H8.25",
                stroke: color,
                strokeLinecap: "round",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 385,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M1.5 6.75C1.5 3 3 1.5 6.75 1.5H10.5",
                stroke: color,
                strokeLinecap: "round",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 386,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M16.5 7.5V11.25C16.5 15 15 16.5 11.25 16.5H6.75C3 16.5 1.5 15 1.5 11.25V9.735",
                stroke: color,
                strokeLinecap: "round",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 387,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M13.5 7.5C11.25 7.5 10.5 6.75 10.5 4.5V1.5L16.5 7.5",
                stroke: color,
                strokeLinecap: "round",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 393,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
        lineNumber: 382,
        columnNumber: 5
    }, this);
}
_c5 = StandaardVerslagIcon;
function SecuritySafeIcon({ color = "#BD0265", size = 24 }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        "aria-hidden": "true",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "M20.9098 11.1203V6.73031C20.9098 5.91031 20.2898 4.98031 19.5198 4.67031L13.9498 2.39031C12.6998 1.88031 11.2898 1.88031 10.0398 2.39031L4.46984 4.67031C3.70984 4.98031 3.08984 5.91031 3.08984 6.73031V11.1203C3.08984 16.0103 6.63984 20.5903 11.4898 21.9303C11.8198 22.0203 12.1798 22.0203 12.5098 21.9303C17.3598 20.5903 20.9098 16.0103 20.9098 11.1203ZM12.7498 12.8703V15.5003C12.7498 15.9103 12.4098 16.2503 11.9998 16.2503C11.5898 16.2503 11.2498 15.9103 11.2498 15.5003V12.8703C10.2398 12.5503 9.49984 11.6103 9.49984 10.5003C9.49984 9.12031 10.6198 8.00031 11.9998 8.00031C13.3798 8.00031 14.4998 9.12031 14.4998 10.5003C14.4998 11.6203 13.7598 12.5503 12.7498 12.8703Z",
            fill: color
        }, void 0, false, {
            fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
            lineNumber: 401,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
        lineNumber: 400,
        columnNumber: 5
    }, this);
}
_c6 = SecuritySafeIcon;
function CoacheesIcon({ color = "#BE0165", size = 24 }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        "aria-hidden": "true",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M18 7.16C17.94 7.15 17.87 7.15 17.81 7.16C16.43 7.11 15.33 5.98 15.33 4.58C15.33 3.15 16.48 2 17.91 2C19.34 2 20.49 3.16 20.49 4.58C20.48 5.98 19.38 7.11 18 7.16Z",
                stroke: color,
                strokeWidth: "1.5",
                strokeLinecap: "round",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 412,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M16.97 14.44C18.34 14.67 19.85 14.43 20.91 13.72C22.32 12.78 22.32 11.24 20.91 10.3C19.84 9.59001 18.31 9.35 16.94 9.59",
                stroke: color,
                strokeWidth: "1.5",
                strokeLinecap: "round",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 419,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M5.97 7.16C6.03 7.15 6.1 7.15 6.16 7.16C7.54 7.11 8.64 5.98 8.64 4.58C8.64 3.15 7.49 2 6.06 2C4.63 2 3.48 3.16 3.48 4.58C3.49 5.98 4.59 7.11 5.97 7.16Z",
                stroke: color,
                strokeWidth: "1.5",
                strokeLinecap: "round",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 426,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M7 14.44C5.63 14.67 4.12 14.43 3.06 13.72C1.65 12.78 1.65 11.24 3.06 10.3C4.13 9.59001 5.66 9.35 7.03 9.59",
                stroke: color,
                strokeWidth: "1.5",
                strokeLinecap: "round",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 433,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M12 14.63C11.94 14.62 11.87 14.62 11.81 14.63C10.43 14.58 9.33 13.45 9.33 12.05C9.33 10.62 10.48 9.47 11.91 9.47C13.34 9.47 14.49 10.63 14.49 12.05C14.48 13.45 13.38 14.59 12 14.63Z",
                stroke: color,
                strokeWidth: "1.5",
                strokeLinecap: "round",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 440,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M14.91 17.78C13.32 16.72 10.69 16.72 9.09 17.78C7.68 18.72 7.68 20.26 9.09 21.2C10.69 22.27 13.31 22.27 14.91 21.2",
                stroke: color,
                strokeWidth: "1.5",
                strokeLinecap: "round",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 447,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
        lineNumber: 411,
        columnNumber: 5
    }, this);
}
_c7 = CoacheesIcon;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7;
__turbopack_context__.k.register(_c, "PricingSection");
__turbopack_context__.k.register(_c1, "FeatureRow");
__turbopack_context__.k.register(_c2, "VerslagGenererenIcon");
__turbopack_context__.k.register(_c3, "HoursPerMonthIcon");
__turbopack_context__.k.register(_c4, "CalendarCircleIcon");
__turbopack_context__.k.register(_c5, "StandaardVerslagIcon");
__turbopack_context__.k.register(_c6, "SecuritySafeIcon");
__turbopack_context__.k.register(_c7, "CoacheesIcon");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=Coachscribe_website_9f1f8ee4._.js.map