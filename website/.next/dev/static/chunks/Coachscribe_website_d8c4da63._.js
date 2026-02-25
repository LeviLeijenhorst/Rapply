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
        contentClassName: duplicateCards ? "pt-12 pb-12 md:pt-16 md:pb-16" : "md:pb-[60px]",
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
"[project]/Coachscribe/website/components/home/FrequentlyAskedQuestionsSection.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>FrequentlyAskedQuestionsSection
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
        question: "Wat is CoachScribe?",
        answer: "CoachScribe is een AI-ondersteunde tool voor coaches om gesprekken eenvoudig op te nemen, automatisch te laten samenvatten en overzichtelijke, bruikbare rapportages te maken. Het helpt je om minder tijd kwijt te zijn aan administratie, terwijl je wel grip houdt op de inhoud, nuance en context van al je sessies."
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
        answer: "CoachScribe is specifiek ontwikkeld voor loopbaan- en re-integratieprofessionals die werken met meerdere clienten en trajecten. Het helpt je om sessies gestructureerd vast te leggen, voortgang bij te houden en verslaglegging richting opdrachtgevers of UWV eenvoudiger te maken."
    },
    {
        question: "Is CoachScribe een vervanging voor een menselijke coach?",
        answer: "Nee. CoachScribe ondersteunt coaches met automatisering van taken zoals notities maken en verslaglegging, maar vervangt nooit het menselijke oordeel, de contextbegrip of de relatie tussen coach en client."
    },
    {
        question: "Kan ik niet gewoon ChatGPT gebruiken?",
        answer: "Nee. ChatGPT is een algemene AI en beschikt niet over de functionaliteit voor sessie opname, gestructureerde verslaglegging of AVG-proof beheer van clientgegevens, waardoor het niet geschikt is voor dit soort toepassingen. Daarnaast is CoachScribe ontworpen speciaal voor coaches en kan het dus een stuk gerichter te werk gaan."
    }
];
function FrequentlyAskedQuestionsSection() {
    _s();
    const [expandedQuestion, setExpandedQuestion] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$components$2f$home$2f$SectionContainer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        className: "bg-[#F8F9F9]",
        contentClassName: "md:pt-20 md:pb-20",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex w-full flex-col gap-8",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    className: "text-3xl font-semibold text-[#1D0A00] md:text-5xl xl:text-6xl",
                    children: "Veel gestelde vragen"
                }, void 0, false, {
                    fileName: "[project]/Coachscribe/website/components/home/FrequentlyAskedQuestionsSection.tsx",
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
                                            fileName: "[project]/Coachscribe/website/components/home/FrequentlyAskedQuestionsSection.tsx",
                                            lineNumber: 69,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            "aria-hidden": "true",
                                            className: `shrink-0 ${isExpanded ? "rotate-45" : ""}`,
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
                                                        fileName: "[project]/Coachscribe/website/components/home/FrequentlyAskedQuestionsSection.tsx",
                                                        lineNumber: 83,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M12 18V6",
                                                        stroke: "#1D0A00",
                                                        strokeWidth: "2",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/FrequentlyAskedQuestionsSection.tsx",
                                                        lineNumber: 90,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Coachscribe/website/components/home/FrequentlyAskedQuestionsSection.tsx",
                                                lineNumber: 76,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/Coachscribe/website/components/home/FrequentlyAskedQuestionsSection.tsx",
                                            lineNumber: 72,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Coachscribe/website/components/home/FrequentlyAskedQuestionsSection.tsx",
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
                                        fileName: "[project]/Coachscribe/website/components/home/FrequentlyAskedQuestionsSection.tsx",
                                        lineNumber: 104,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/Coachscribe/website/components/home/FrequentlyAskedQuestionsSection.tsx",
                                    lineNumber: 100,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, questionItem.question, true, {
                            fileName: "[project]/Coachscribe/website/components/home/FrequentlyAskedQuestionsSection.tsx",
                            lineNumber: 52,
                            columnNumber: 15
                        }, this);
                    })
                }, void 0, false, {
                    fileName: "[project]/Coachscribe/website/components/home/FrequentlyAskedQuestionsSection.tsx",
                    lineNumber: 48,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/Coachscribe/website/components/home/FrequentlyAskedQuestionsSection.tsx",
            lineNumber: 44,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Coachscribe/website/components/home/FrequentlyAskedQuestionsSection.tsx",
        lineNumber: 43,
        columnNumber: 5
    }, this);
}
_s(FrequentlyAskedQuestionsSection, "NQv3Nx6Z0rI0zSTHtaXNrYSENqc=");
_c = FrequentlyAskedQuestionsSection;
var _c;
__turbopack_context__.k.register(_c, "FrequentlyAskedQuestionsSection");
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
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
const ENTRA_ACCESS_TOKEN_KEY = "entra_access_token";
const APP_URL = "https://app.coachscribe.nl";
function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
}
function toNumber(value) {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
}
function calculateRoi(inputs) {
    const currentHoursWeek = inputs.sessionsPerWeek * inputs.currentMinutes / 60;
    const toolHoursWeek = inputs.sessionsPerWeek * inputs.toolMinutes / 60;
    const hoursSavedWeek = Math.max(0, currentHoursWeek - toolHoursWeek);
    const eurSavedWeek = hoursSavedWeek * inputs.hourlyRate;
    const eurSavedMonth = eurSavedWeek * 4.33;
    const eurSavedYear = eurSavedWeek * inputs.weeksPerYear;
    const netMonth = eurSavedMonth - inputs.subscriptionMonthly;
    const breakEvenDays = eurSavedWeek > 0 ? inputs.subscriptionMonthly / eurSavedWeek * 7 : null;
    return {
        currentHoursWeek,
        toolHoursWeek,
        hoursSavedWeek,
        eurSavedWeek,
        eurSavedMonth,
        eurSavedYear,
        netMonth,
        breakEvenDays
    };
}
function useAnimatedNumber(target, durationMs = 450) {
    _s();
    const [value, setValue] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(target);
    const valueRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(target);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useAnimatedNumber.useEffect": ()=>{
            valueRef.current = value;
        }
    }["useAnimatedNumber.useEffect"], [
        value
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useAnimatedNumber.useEffect": ()=>{
            let frameId = 0;
            const start = performance.now();
            const from = valueRef.current;
            const tick = {
                "useAnimatedNumber.useEffect.tick": (now)=>{
                    const progress = Math.min(1, (now - start) / durationMs);
                    const eased = 1 - (1 - progress) * (1 - progress);
                    setValue(from + (target - from) * eased);
                    if (progress < 1) {
                        frameId = requestAnimationFrame(tick);
                    }
                }
            }["useAnimatedNumber.useEffect.tick"];
            frameId = requestAnimationFrame(tick);
            return ({
                "useAnimatedNumber.useEffect": ()=>cancelAnimationFrame(frameId)
            })["useAnimatedNumber.useEffect"];
        }
    }["useAnimatedNumber.useEffect"], [
        target,
        durationMs
    ]);
    return value;
}
_s(useAnimatedNumber, "Lh0Wqg5oBUDN7PuxfpYbwJhmel0=");
function formatEuro(value) {
    return new Intl.NumberFormat("nl-NL", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0
    }).format(value);
}
function formatBreakEven(value) {
    if (value == null || !Number.isFinite(value) || value <= 0) {
        return "-";
    }
    if (value >= 7) {
        return `${(value / 7).toFixed(1).replace(".", ",")} weken`;
    }
    return `${value.toFixed(1).replace(".", ",")} dagen`;
}
function PricingSection(props) {
    _s1();
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [isVisible, setIsVisible] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [suggestedSubscriptionPrice, setSuggestedSubscriptionPrice] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(29);
    const [hourlyRate, setHourlyRate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(75);
    const [sessionsPerWeek, setSessionsPerWeek] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(10);
    const [currentMinutes, setCurrentMinutes] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(20);
    const [toolMinutes, setToolMinutes] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(8);
    const [subscriptionMonthly, setSubscriptionMonthly] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(29);
    const [weeksPerYear, setWeeksPerYear] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(46);
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
                    if (plansResponse.ok) {
                        const plansPayload = await plansResponse.json();
                        const primaryPlan = Array.isArray(plansPayload.items) ? plansPayload.items[0] : null;
                        if (!isCancelled && primaryPlan?.monthlyPrice != null) {
                            const resolvedPrice = clamp(primaryPlan.monthlyPrice, 0, 200);
                            setSuggestedSubscriptionPrice(resolvedPrice);
                            setSubscriptionMonthly(resolvedPrice);
                        }
                    }
                } catch  {
                // Fallback to default subscription price.
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
    const roi = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "PricingSection.useMemo[roi]": ()=>calculateRoi({
                hourlyRate,
                sessionsPerWeek,
                currentMinutes,
                toolMinutes,
                subscriptionMonthly,
                weeksPerYear
            })
    }["PricingSection.useMemo[roi]"], [
        hourlyRate,
        sessionsPerWeek,
        currentMinutes,
        toolMinutes,
        subscriptionMonthly,
        weeksPerYear
    ]);
    const animatedHoursSavedWeek = useAnimatedNumber(roi.hoursSavedWeek);
    const animatedSavedMonth = useAnimatedNumber(roi.eurSavedMonth);
    const animatedSavedYear = useAnimatedNumber(roi.eurSavedYear);
    const animatedBreakEvenDays = useAnimatedNumber(roi.breakEvenDays ?? 0);
    const animatedNetMonth = useAnimatedNumber(roi.netMonth);
    if (!isVisible) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: `w-full ${props.isStandalonePage ? "pt-6 pb-12 md:pt-10 md:pb-16" : "py-12 md:py-16"}`,
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
                    lineNumber: 267,
                    columnNumber: 13
                }, this)
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 266,
                columnNumber: 11
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 gap-6 lg:grid-cols-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-2xl border border-[#E0E0E0] bg-white p-6 md:p-7",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-[28px] font-semibold leading-[34px] text-[#1D0A00]",
                                children: "ROI calculator"
                            }, void 0, false, {
                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                lineNumber: 275,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-2 text-[15px] leading-6 text-[rgba(38,52,63,0.78)]",
                                children: "Bereken hoeveel tijd en omzet je potentieel vrijspeelt met CoachScribe."
                            }, void 0, false, {
                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                lineNumber: 278,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-6 space-y-5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(RangeWithInput, {
                                        id: "hourlyRate",
                                        label: "Uurtarief (EUR)",
                                        min: 20,
                                        max: 250,
                                        step: 1,
                                        value: hourlyRate,
                                        onChange: setHourlyRate
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 283,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(RangeWithInput, {
                                        id: "sessionsPerWeek",
                                        label: "Sessies per week",
                                        min: 1,
                                        max: 40,
                                        step: 1,
                                        value: sessionsPerWeek,
                                        onChange: setSessionsPerWeek
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 292,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(RangeWithInput, {
                                        id: "currentMinutes",
                                        label: "Minuten verslaglegging per sessie (nu)",
                                        min: 5,
                                        max: 90,
                                        step: 1,
                                        value: currentMinutes,
                                        onChange: setCurrentMinutes
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 301,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                lineNumber: 282,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("details", {
                                className: "mt-6 rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] p-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("summary", {
                                        className: "cursor-pointer text-[15px] font-medium leading-6 text-[#1D0A00]",
                                        children: "Geavanceerde instellingen"
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 313,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-4 space-y-5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(RangeWithInput, {
                                                id: "toolMinutes",
                                                label: "Minuten per sessie met CoachScribe",
                                                min: 1,
                                                max: 30,
                                                step: 1,
                                                value: toolMinutes,
                                                onChange: setToolMinutes
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                lineNumber: 317,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(RangeWithInput, {
                                                id: "subscriptionMonthly",
                                                label: "Abonnementskosten per maand (EUR)",
                                                min: 0,
                                                max: 200,
                                                step: 1,
                                                value: subscriptionMonthly,
                                                onChange: setSubscriptionMonthly,
                                                helper: `Suggestie op basis van prijs: ${formatEuro(suggestedSubscriptionPrice)}`
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                lineNumber: 326,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(RangeWithInput, {
                                                id: "weeksPerYear",
                                                label: "Actieve weken per jaar",
                                                min: 30,
                                                max: 52,
                                                step: 1,
                                                value: weeksPerYear,
                                                onChange: setWeeksPerYear
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                lineNumber: 336,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 316,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                lineNumber: 312,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("details", {
                                className: "mt-4 rounded-xl border border-[#EAEAEA] bg-white p-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("summary", {
                                        className: "cursor-pointer text-[14px] font-medium leading-5 text-[#1D0A00]",
                                        children: "Hoe we dit berekenen"
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 349,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-3 text-[14px] leading-6 text-[rgba(38,52,63,0.78)]",
                                        children: "We berekenen eerst je huidige rapportagetijd per week en je tijd met CoachScribe. Het verschil is je wekelijkse tijdbesparing. Die vermenigvuldigen we met je uurtarief voor wekelijkse besparing in euro, daarna naar maand (x 4,33) en jaar (x actieve weken per jaar). Netto per maand is maandbesparing minus abonnementskosten. Break-even is na hoeveel dagen de maandkosten zijn terugverdiend op basis van je wekelijkse besparing."
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 352,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                lineNumber: 348,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-4 text-[12px] leading-5 text-[rgba(38,52,63,0.72)]",
                                children: "Indicatie op basis van jouw invoer; werkelijke besparing kan varieren."
                            }, void 0, false, {
                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                lineNumber: 363,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                        lineNumber: 274,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-2xl border border-[#E0E0E0] bg-[#FEFEFE] p-6 md:p-7",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-1 gap-4 sm:grid-cols-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MetricCard, {
                                        label: "Uren bespaard per week",
                                        value: `${animatedHoursSavedWeek.toFixed(1).replace(".", ",")} uur`
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 370,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MetricCard, {
                                        label: "Besparing per maand",
                                        value: formatEuro(animatedSavedMonth)
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 374,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MetricCard, {
                                        label: "Besparing per jaar",
                                        value: formatEuro(animatedSavedYear)
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 378,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MetricCard, {
                                        label: "Break-even",
                                        value: formatBreakEven(roi.breakEvenDays == null ? null : animatedBreakEvenDays)
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 382,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                lineNumber: 369,
                                columnNumber: 15
                            }, this),
                            subscriptionMonthly > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-4 rounded-xl border border-[#F0D8E6] bg-[#FFF7FB] p-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[13px] leading-5 text-[rgba(38,52,63,0.72)]",
                                        children: "Netto voordeel per maand"
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 390,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-1 text-[30px] font-semibold leading-9 text-[#BE0165]",
                                        children: formatEuro(animatedNetMonth)
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 393,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                lineNumber: 389,
                                columnNumber: 17
                            }, this) : null,
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-6",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$components$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    label: "Probeer het gratis",
                                    destination: APP_URL,
                                    variant: "primary",
                                    className: "h-[46px] w-full rounded-[14px] text-[16px] font-semibold",
                                    openInNewTab: true
                                }, void 0, false, {
                                    fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                    lineNumber: 400,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                lineNumber: 399,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                        lineNumber: 368,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 273,
                columnNumber: 11
            }, this)
        }, void 0, false, {
            fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
            lineNumber: 264,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
        lineNumber: 256,
        columnNumber: 5
    }, this);
}
_s1(PricingSection, "+T661cArdhO/6zzGvTSWx3QpoVw=", false, function() {
    return [
        useAnimatedNumber,
        useAnimatedNumber,
        useAnimatedNumber,
        useAnimatedNumber,
        useAnimatedNumber
    ];
});
_c = PricingSection;
function MetricCard({ label, value }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "rounded-xl border border-[#E6E6E6] bg-white p-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-[13px] leading-5 text-[rgba(38,52,63,0.72)]",
                children: label
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 424,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "mt-1 text-[28px] font-semibold leading-8 text-[#1D0A00]",
                children: value
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 425,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
        lineNumber: 423,
        columnNumber: 5
    }, this);
}
_c1 = MetricCard;
function RangeWithInput(props) {
    const { id, label, min, max, step, value, onChange, helper } = props;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-end justify-between gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        htmlFor: `${id}-input`,
                        className: "text-[15px] font-medium leading-6 text-[#1D0A00]",
                        children: label
                    }, void 0, false, {
                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                        lineNumber: 447,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        id: `${id}-input`,
                        type: "number",
                        inputMode: "decimal",
                        min: min,
                        max: max,
                        step: step,
                        value: value,
                        onChange: (event)=>{
                            const nextValue = clamp(toNumber(event.currentTarget.value), min, max);
                            onChange(nextValue);
                        },
                        className: "w-[120px] rounded-lg border border-[#D8D8D8] bg-white px-3 py-2 text-right text-[14px] leading-5 text-[#1D0A00] outline-none"
                    }, void 0, false, {
                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                        lineNumber: 450,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 446,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                id: `${id}-range`,
                type: "range",
                min: min,
                max: max,
                step: step,
                value: value,
                "aria-label": label,
                "aria-valuemin": min,
                "aria-valuemax": max,
                "aria-valuenow": value,
                onChange: (event)=>onChange(clamp(toNumber(event.currentTarget.value), min, max)),
                className: "w-full cursor-pointer accent-[#BE0165]"
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 465,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between text-[12px] leading-4 text-[rgba(38,52,63,0.6)]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: min
                    }, void 0, false, {
                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                        lineNumber: 480,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: max
                    }, void 0, false, {
                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                        lineNumber: 481,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 479,
                columnNumber: 7
            }, this),
            helper ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-[12px] leading-4 text-[rgba(38,52,63,0.65)]",
                children: helper
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 484,
                columnNumber: 9
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
        lineNumber: 445,
        columnNumber: 5
    }, this);
}
_c2 = RangeWithInput;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "PricingSection");
__turbopack_context__.k.register(_c1, "MetricCard");
__turbopack_context__.k.register(_c2, "RangeWithInput");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=Coachscribe_website_d8c4da63._.js.map