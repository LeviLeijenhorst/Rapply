(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/Coachscribe/website/components/home/SectionContainer.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SectionContainer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
;
function SectionContainer({ children, className, contentClassName }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: `w-full ${className ?? ""}`,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: `mx-auto w-full max-w-6xl p-6 md:p-10 ${contentClassName ?? ""}`,
            children: children
        }, void 0, false, {
            fileName: "[project]/Coachscribe/website/components/home/SectionContainer.tsx",
            lineNumber: 15,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Coachscribe/website/components/home/SectionContainer.tsx",
        lineNumber: 13,
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
        answer: "CoachScribe is geschikt voor alle professionals die gesprekken voeren met cliënten en daar gestructureerde verslagen van willen bijhouden. Het helpt coaches overzicht te houden, informatie veilig te bewaren en sneller terug te vinden wat belangrijk is uit sessies."
    },
    {
        question: "Kan CoachScribe worden gebruikt door loopbaancoaches?",
        answer: "Ja. Loopbaancoaches kunnen CoachScribe gebruiken om gesprekken met cliënten vast te leggen, verslagen te maken en belangrijke inzichten overzichtelijk bij te houden. Dit maakt het makkelijker om trajecten te volgen en opvolging te plannen."
    },
    {
        question: "Kan ik CoachScribe gebruiken als zelfstandig coach of alleen in een organisatie?",
        answer: "CoachScribe is geschikt voor zowel zelfstandige coaches als coaches die in een organisatie werken."
    },
    {
        question: "Is er een minimum aantal cliënten of sessies nodig om te beginnen?",
        answer: "Nee. Je kunt CoachScribe vanaf het eerste gesprek gebruiken, ongeacht het aantal cliënten of sessies. Het systeem werkt direct, waardoor je meteen overzicht krijgt en efficiënt notities en verslagen kunt bijhouden."
    },
    {
        question: "Kunnen onderwijscoaches of begeleiders CoachScribe gebruiken?",
        answer: "Ja. CoachScribe kan worden ingezet door onderwijscoaches, mentoren en begeleiders om gesprekken met studenten of leerlingen gestructureerd vast te leggen. Het biedt een veilig overzicht van sessies en maakt het eenvoudiger om belangrijke informatie terug te vinden en te gebruiken voor begeleiding."
    },
    {
        question: "Is CoachScribe geschikt voor nieuwe coaches zonder veel ervaring?",
        answer: "Ja. CoachScribe ondersteunt zowel ervaren als nieuwe coaches door structuur en overzicht te bieden bij sessies en verslaglegging. Het helpt nieuwe coaches om gespreksinformatie efficiënt te beheren en sneller vertrouwd te raken met het bijhouden van professionele verslagen."
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
                    className: "text-4xl font-semibold text-[#1D0A00] md:text-6xl",
                    children: "Veel gestelde vragen"
                }, void 0, false, {
                    fileName: "[project]/Coachscribe/website/components/coaches/CoachesFrequentlyAskedQuestionsSection.tsx",
                    lineNumber: 46,
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
                                            lineNumber: 70,
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
                                                        lineNumber: 86,
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
                                                        lineNumber: 93,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Coachscribe/website/components/coaches/CoachesFrequentlyAskedQuestionsSection.tsx",
                                                lineNumber: 79,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/Coachscribe/website/components/coaches/CoachesFrequentlyAskedQuestionsSection.tsx",
                                            lineNumber: 73,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Coachscribe/website/components/coaches/CoachesFrequentlyAskedQuestionsSection.tsx",
                                    lineNumber: 57,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    id: `faq-answer-${index}`,
                                    className: "grid overflow-hidden transition-[grid-template-rows,opacity] duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                                    style: {
                                        gridTemplateRows: isExpanded ? "1fr" : "0fr",
                                        opacity: isExpanded ? 1 : 0
                                    },
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "overflow-hidden pb-5 text-base font-normal leading-relaxed text-[#1D0A00]",
                                        children: questionItem.answer
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/coaches/CoachesFrequentlyAskedQuestionsSection.tsx",
                                        lineNumber: 111,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/Coachscribe/website/components/coaches/CoachesFrequentlyAskedQuestionsSection.tsx",
                                    lineNumber: 103,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, questionItem.question, true, {
                            fileName: "[project]/Coachscribe/website/components/coaches/CoachesFrequentlyAskedQuestionsSection.tsx",
                            lineNumber: 53,
                            columnNumber: 15
                        }, this);
                    })
                }, void 0, false, {
                    fileName: "[project]/Coachscribe/website/components/coaches/CoachesFrequentlyAskedQuestionsSection.tsx",
                    lineNumber: 49,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/Coachscribe/website/components/coaches/CoachesFrequentlyAskedQuestionsSection.tsx",
            lineNumber: 45,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Coachscribe/website/components/coaches/CoachesFrequentlyAskedQuestionsSection.tsx",
        lineNumber: 44,
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
"[project]/Coachscribe/website/coaches/vuesax/bold/key.svg (static in ecmascript, tag client)", ((__turbopack_context__) => {

__turbopack_context__.v("/_next/static/media/key.aa073710.svg");}),
"[project]/Coachscribe/website/coaches/vuesax/bold/key.svg.mjs { IMAGE => \"[project]/Coachscribe/website/coaches/vuesax/bold/key.svg (static in ecmascript, tag client)\" } [app-client] (structured image object with data url, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$coaches$2f$vuesax$2f$bold$2f$key$2e$svg__$28$static__in__ecmascript$2c$__tag__client$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/coaches/vuesax/bold/key.svg (static in ecmascript, tag client)");
;
const __TURBOPACK__default__export__ = {
    src: __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$coaches$2f$vuesax$2f$bold$2f$key$2e$svg__$28$static__in__ecmascript$2c$__tag__client$29$__["default"],
    width: 24,
    height: 24,
    blurWidth: 0,
    blurHeight: 0
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Coachscribe/website/veiligheid/shield-tick.svg (static in ecmascript, tag client)", ((__turbopack_context__) => {

__turbopack_context__.v("/_next/static/media/shield-tick.ab30a57a.svg");}),
"[project]/Coachscribe/website/veiligheid/shield-tick.svg.mjs { IMAGE => \"[project]/Coachscribe/website/veiligheid/shield-tick.svg (static in ecmascript, tag client)\" } [app-client] (structured image object with data url, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$veiligheid$2f$shield$2d$tick$2e$svg__$28$static__in__ecmascript$2c$__tag__client$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/veiligheid/shield-tick.svg (static in ecmascript, tag client)");
;
const __TURBOPACK__default__export__ = {
    src: __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$veiligheid$2f$shield$2d$tick$2e$svg__$28$static__in__ecmascript$2c$__tag__client$29$__["default"],
    width: 24,
    height: 24,
    blurWidth: 0,
    blurHeight: 0
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Coachscribe/website/veiligheid/shield-search.svg (static in ecmascript, tag client)", ((__turbopack_context__) => {

__turbopack_context__.v("/_next/static/media/shield-search.d8490d8e.svg");}),
"[project]/Coachscribe/website/veiligheid/shield-search.svg.mjs { IMAGE => \"[project]/Coachscribe/website/veiligheid/shield-search.svg (static in ecmascript, tag client)\" } [app-client] (structured image object with data url, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$veiligheid$2f$shield$2d$search$2e$svg__$28$static__in__ecmascript$2c$__tag__client$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/veiligheid/shield-search.svg (static in ecmascript, tag client)");
;
const __TURBOPACK__default__export__ = {
    src: __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$veiligheid$2f$shield$2d$search$2e$svg__$28$static__in__ecmascript$2c$__tag__client$29$__["default"],
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
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$coaches$2f$vuesax$2f$bold$2f$key$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$coaches$2f$vuesax$2f$bold$2f$key$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__ = __turbopack_context__.i('[project]/Coachscribe/website/coaches/vuesax/bold/key.svg.mjs { IMAGE => "[project]/Coachscribe/website/coaches/vuesax/bold/key.svg (static in ecmascript, tag client)" } [app-client] (structured image object with data url, ecmascript)');
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$veiligheid$2f$shield$2d$tick$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$veiligheid$2f$shield$2d$tick$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__ = __turbopack_context__.i('[project]/Coachscribe/website/veiligheid/shield-tick.svg.mjs { IMAGE => "[project]/Coachscribe/website/veiligheid/shield-tick.svg (static in ecmascript, tag client)" } [app-client] (structured image object with data url, ecmascript)');
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$veiligheid$2f$shield$2d$search$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$veiligheid$2f$shield$2d$search$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__ = __turbopack_context__.i('[project]/Coachscribe/website/veiligheid/shield-search.svg.mjs { IMAGE => "[project]/Coachscribe/website/veiligheid/shield-search.svg (static in ecmascript, tag client)" } [app-client] (structured image object with data url, ecmascript)');
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
;
;
;
const securityItems = [
    {
        title: "AVG-proof",
        description: "CoachScribe is AVG-proof ingericht. Opslag en verwerking van gegevens vinden uitsluitend plaats binnen de EU, volgens de geldende privacywetgeving.",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$home$2f$security$2d$safe$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$home$2f$security$2d$safe$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__["default"]
    },
    {
        title: "Versleuteld opgeslagen",
        description: "Alle gegevens zijn beveiligd met sterke encryptie, zowel tijdens verzending (in transit) als wanneer ze zijn opgeslagen\n(at rest).",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$home$2f$lock$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$home$2f$lock$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__["default"]
    },
    {
        title: "Jouw data blijft van jou",
        description: "Jouw data wordt nooit gebruikt om AI-modellen te trainen of te verbeteren. Daarnaast kan je op elk moment je data verwijderen, het is jouw data.",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$home$2f$security$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$home$2f$security$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__["default"]
    }
];
const SECURITY_CARD_REVEAL_DURATION_MS = 420;
function SecuritySection({ duplicateCards = false, showActionButton = true }) {
    _s();
    const securityCardsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [areSecurityCardsVisible, setAreSecurityCardsVisible] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const renderedSecurityItems = duplicateCards ? [
        ...securityItems,
        ...securityItems
    ] : securityItems;
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
        contentClassName: "md:pb-[60px]",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex w-full flex-col gap-8 md:pt-5",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex w-full flex-col items-center gap-3 text-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "font-[var(--font-catamaran)] text-[40px] font-medium leading-[120%] text-black",
                            children: [
                                "Ontworpen met ",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-[#BD0265]",
                                    children: "veiligheid op #1"
                                }, void 0, false, {
                                    fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                    lineNumber: 87,
                                    columnNumber: 27
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                            lineNumber: 86,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-base font-normal text-black/70 md:text-lg",
                            children: "Beschermde opslag, duidelijke regels en volledige controle over jouw data."
                        }, void 0, false, {
                            fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                            lineNumber: 89,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                    lineNumber: 85,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    ref: securityCardsRef,
                    className: `grid w-full md:grid-cols-3 ${securityGridGapClass}`,
                    children: renderedSecurityItems.map((securityItem, index)=>{
                        const title = duplicateCards && index === securityItems.length ? "tweestapsverificatie" : duplicateCards && index === securityItems.length + 1 ? "Europese bescherming" : securityItem.title;
                        const description = duplicateCards && index === securityItems.length ? "Inloggen verloopt via tweestapsverificatie. Naast je wachtwoord bevestig je elke login met een unieke e-mailcode zodat je account goed beveiligd is." : duplicateCards && index === securityItems.length + 1 ? "Alle gegevens blijven binnen Europa en vallen uitsluitend onder Europese privacywetgeving, zonder invloed van de Amerikaanse Cloud Act." : securityItem.description;
                        const iconSource = duplicateCards && index === 2 ? __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$veiligheid$2f$shield$2d$tick$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$veiligheid$2f$shield$2d$tick$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__["default"] : duplicateCards && index === securityItems.length ? __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$coaches$2f$vuesax$2f$bold$2f$key$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$coaches$2f$vuesax$2f$bold$2f$key$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__["default"] : duplicateCards && index === securityItems.length + 1 ? __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$home$2f$security$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$home$2f$security$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__["default"] : duplicateCards && index === securityItems.length + 2 ? __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$veiligheid$2f$shield$2d$search$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$veiligheid$2f$shield$2d$search$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__["default"] : securityItem.icon;
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `flex w-full flex-col gap-0 rounded-2xl bg-white p-6 pb-8 shadow-[0_8px_20px_rgba(15,23,42,0.08)] ${areSecurityCardsVisible ? "translate-y-0" : "translate-y-[20px]"}`,
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
                                            src: iconSource,
                                            alt: "",
                                            width: 24,
                                            height: 24
                                        }, void 0, false, {
                                            fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                            lineNumber: 137,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "font-[var(--font-catamaran)] text-[20px] font-bold text-[#BD0265]",
                                            children: title
                                        }, void 0, false, {
                                            fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                            lineNumber: 139,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                    lineNumber: 136,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "mt-3 ml-2 text-[16px] font-normal text-black/70",
                                    children: description
                                }, void 0, false, {
                                    fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                                    lineNumber: 144,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, `${securityItem.title}-${index}`, true, {
                            fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                            lineNumber: 124,
                            columnNumber: 15
                        }, this);
                    })
                }, void 0, false, {
                    fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                    lineNumber: 95,
                    columnNumber: 9
                }, this),
                showActionButton ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: `${securityButtonTopSpacingClass} flex w-full items-center justify-center ${areSecurityCardsVisible ? "translate-y-0" : "translate-y-[20px]"}`,
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
                        lineNumber: 163,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
                    lineNumber: 153,
                    columnNumber: 11
                }, this) : null
            ]
        }, void 0, true, {
            fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
            lineNumber: 83,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Coachscribe/website/components/home/SecuritySection.tsx",
        lineNumber: 78,
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
]);

//# sourceMappingURL=Coachscribe_website_a56adf93._.js.map