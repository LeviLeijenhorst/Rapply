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
"[project]/Coachscribe/website/over_ons/user-tag.svg (static in ecmascript, tag client)", ((__turbopack_context__) => {

__turbopack_context__.v("/_next/static/media/user-tag.6e9fc525.svg");}),
"[project]/Coachscribe/website/over_ons/user-tag.svg.mjs { IMAGE => \"[project]/Coachscribe/website/over_ons/user-tag.svg (static in ecmascript, tag client)\" } [app-client] (structured image object with data url, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$user$2d$tag$2e$svg__$28$static__in__ecmascript$2c$__tag__client$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/over_ons/user-tag.svg (static in ecmascript, tag client)");
;
const __TURBOPACK__default__export__ = {
    src: __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$user$2d$tag$2e$svg__$28$static__in__ecmascript$2c$__tag__client$29$__["default"],
    width: 24,
    height: 24,
    blurWidth: 0,
    blurHeight: 0
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Coachscribe/website/over_ons/people.svg (static in ecmascript, tag client)", ((__turbopack_context__) => {

__turbopack_context__.v("/_next/static/media/people.4f1d7388.svg");}),
"[project]/Coachscribe/website/over_ons/people.svg.mjs { IMAGE => \"[project]/Coachscribe/website/over_ons/people.svg (static in ecmascript, tag client)\" } [app-client] (structured image object with data url, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$people$2e$svg__$28$static__in__ecmascript$2c$__tag__client$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/over_ons/people.svg (static in ecmascript, tag client)");
;
const __TURBOPACK__default__export__ = {
    src: __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$people$2e$svg__$28$static__in__ecmascript$2c$__tag__client$29$__["default"],
    width: 24,
    height: 24,
    blurWidth: 0,
    blurHeight: 0
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Coachscribe/website/over_ons/medal-star.svg (static in ecmascript, tag client)", ((__turbopack_context__) => {

__turbopack_context__.v("/_next/static/media/medal-star.d3522d09.svg");}),
"[project]/Coachscribe/website/over_ons/medal-star.svg.mjs { IMAGE => \"[project]/Coachscribe/website/over_ons/medal-star.svg (static in ecmascript, tag client)\" } [app-client] (structured image object with data url, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$medal$2d$star$2e$svg__$28$static__in__ecmascript$2c$__tag__client$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/over_ons/medal-star.svg (static in ecmascript, tag client)");
;
const __TURBOPACK__default__export__ = {
    src: __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$medal$2d$star$2e$svg__$28$static__in__ecmascript$2c$__tag__client$29$__["default"],
    width: 24,
    height: 24,
    blurWidth: 0,
    blurHeight: 0
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Coachscribe/website/over_ons/magicpen.svg (static in ecmascript, tag client)", ((__turbopack_context__) => {

__turbopack_context__.v("/_next/static/media/magicpen.35e9abda.svg");}),
"[project]/Coachscribe/website/over_ons/magicpen.svg.mjs { IMAGE => \"[project]/Coachscribe/website/over_ons/magicpen.svg (static in ecmascript, tag client)\" } [app-client] (structured image object with data url, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$magicpen$2e$svg__$28$static__in__ecmascript$2c$__tag__client$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/over_ons/magicpen.svg (static in ecmascript, tag client)");
;
const __TURBOPACK__default__export__ = {
    src: __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$magicpen$2e$svg__$28$static__in__ecmascript$2c$__tag__client$29$__["default"],
    width: 24,
    height: 24,
    blurWidth: 0,
    blurHeight: 0
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Coachscribe/website/over_ons/sun.svg (static in ecmascript, tag client)", ((__turbopack_context__) => {

__turbopack_context__.v("/_next/static/media/sun.10a2bd80.svg");}),
"[project]/Coachscribe/website/over_ons/sun.svg.mjs { IMAGE => \"[project]/Coachscribe/website/over_ons/sun.svg (static in ecmascript, tag client)\" } [app-client] (structured image object with data url, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$sun$2e$svg__$28$static__in__ecmascript$2c$__tag__client$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/over_ons/sun.svg (static in ecmascript, tag client)");
;
const __TURBOPACK__default__export__ = {
    src: __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$sun$2e$svg__$28$static__in__ecmascript$2c$__tag__client$29$__["default"],
    width: 24,
    height: 24,
    blurWidth: 0,
    blurHeight: 0
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Coachscribe/website/over_ons/people-1.svg (static in ecmascript, tag client)", ((__turbopack_context__) => {

__turbopack_context__.v("/_next/static/media/people-1.1367f972.svg");}),
"[project]/Coachscribe/website/over_ons/people-1.svg.mjs { IMAGE => \"[project]/Coachscribe/website/over_ons/people-1.svg (static in ecmascript, tag client)\" } [app-client] (structured image object with data url, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$people$2d$1$2e$svg__$28$static__in__ecmascript$2c$__tag__client$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/over_ons/people-1.svg (static in ecmascript, tag client)");
;
const __TURBOPACK__default__export__ = {
    src: __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$people$2d$1$2e$svg__$28$static__in__ecmascript$2c$__tag__client$29$__["default"],
    width: 24,
    height: 24,
    blurWidth: 0,
    blurHeight: 0
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Coachscribe/website/components/over-ons/OverOnsValuesSection.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>OverOnsValuesSection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/image.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$components$2f$home$2f$SectionContainer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/components/home/SectionContainer.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$user$2d$tag$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$user$2d$tag$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__ = __turbopack_context__.i('[project]/Coachscribe/website/over_ons/user-tag.svg.mjs { IMAGE => "[project]/Coachscribe/website/over_ons/user-tag.svg (static in ecmascript, tag client)" } [app-client] (structured image object with data url, ecmascript)');
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$people$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$people$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__ = __turbopack_context__.i('[project]/Coachscribe/website/over_ons/people.svg.mjs { IMAGE => "[project]/Coachscribe/website/over_ons/people.svg (static in ecmascript, tag client)" } [app-client] (structured image object with data url, ecmascript)');
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$medal$2d$star$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$medal$2d$star$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__ = __turbopack_context__.i('[project]/Coachscribe/website/over_ons/medal-star.svg.mjs { IMAGE => "[project]/Coachscribe/website/over_ons/medal-star.svg (static in ecmascript, tag client)" } [app-client] (structured image object with data url, ecmascript)');
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$magicpen$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$magicpen$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__ = __turbopack_context__.i('[project]/Coachscribe/website/over_ons/magicpen.svg.mjs { IMAGE => "[project]/Coachscribe/website/over_ons/magicpen.svg (static in ecmascript, tag client)" } [app-client] (structured image object with data url, ecmascript)');
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$sun$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$sun$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__ = __turbopack_context__.i('[project]/Coachscribe/website/over_ons/sun.svg.mjs { IMAGE => "[project]/Coachscribe/website/over_ons/sun.svg (static in ecmascript, tag client)" } [app-client] (structured image object with data url, ecmascript)');
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$people$2d$1$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$people$2d$1$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__ = __turbopack_context__.i('[project]/Coachscribe/website/over_ons/people-1.svg.mjs { IMAGE => "[project]/Coachscribe/website/over_ons/people-1.svg (static in ecmascript, tag client)" } [app-client] (structured image object with data url, ecmascript)');
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
const values = [
    {
        title: "Mensgericht",
        description: "Technologie ondersteunt altijd de coach en de cliënt, zonder de menselijke connectie te vervangen.",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$user$2d$tag$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$user$2d$tag$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__["default"]
    },
    {
        title: "Samenwerking",
        description: "CoachScribe ontstaat niet in isolatie. We ontwikkelen samen met coaches, partners en elkaar.",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$people$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$people$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__["default"]
    },
    {
        title: "Kwaliteit",
        description: "Alles wat we bouwen is gericht op het verbeteren van de kwaliteit van coaching en het ondersteunen van elke sessie.",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$medal$2d$star$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$medal$2d$star$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__["default"]
    },
    {
        title: "Innovatie",
        description: "We testen en verbeteren continu, zodat CoachScribe beter aansluit bij de praktijk van coaches.",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$magicpen$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$magicpen$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__["default"]
    },
    {
        title: "Transparantie",
        description: "We zijn open over hoe CoachScribe werkt en hoe we omgaan met data, zodat coaches altijd weten waar ze aan toe zijn.",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$sun$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$sun$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__["default"]
    },
    {
        title: "Verbinding",
        description: "Onze tools helpen coaches sterker in contact te staan met hun cliënten en de relatie te verdiepen.",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$people$2d$1$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$people$2d$1$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__["default"]
    }
];
const VALUE_CARD_REVEAL_DURATION_MS = 420;
function OverOnsValuesSection() {
    _s();
    const valueCardsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [areValueCardsVisible, setAreValueCardsVisible] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "OverOnsValuesSection.useEffect": ()=>{
            const element = valueCardsRef.current;
            if (!element) return;
            if (("TURBOPACK compile-time value", "object") === "undefined" || !("IntersectionObserver" in window)) {
                setAreValueCardsVisible(true);
                return;
            }
            const observer = new IntersectionObserver({
                "OverOnsValuesSection.useEffect": ([entry])=>{
                    if (!entry.isIntersecting) return;
                    if (entry.intersectionRatio < 0.15) return;
                    setAreValueCardsVisible(true);
                    observer.disconnect();
                }
            }["OverOnsValuesSection.useEffect"], {
                threshold: [
                    0,
                    0.15,
                    1
                ]
            });
            observer.observe(element);
            return ({
                "OverOnsValuesSection.useEffect": ()=>observer.disconnect()
            })["OverOnsValuesSection.useEffect"];
        }
    }["OverOnsValuesSection.useEffect"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$components$2f$home$2f$SectionContainer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        className: "mt-[60px] bg-white bg-[linear-gradient(135deg,rgba(169,217,243,0.5)_0%,rgba(237,194,217,0.5)_100%)]",
        contentClassName: "pb-[60px] pt-[60px] md:pb-[60px] md:pt-[60px]",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex w-full flex-col gap-[40px]",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    className: "text-center font-[var(--font-catamaran)] text-[40px] font-medium leading-[120%] text-black",
                    children: [
                        "Onze ",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-[#BD0265]",
                            children: "kernwaarden"
                        }, void 0, false, {
                            fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsValuesSection.tsx",
                            lineNumber: 94,
                            columnNumber: 16
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsValuesSection.tsx",
                    lineNumber: 93,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    ref: valueCardsRef,
                    className: "grid w-full gap-6 md:grid-cols-2 xl:grid-cols-3",
                    children: values.map((value)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                            className: `flex w-full flex-col gap-3 rounded-xl bg-[#F8F9F9] p-8 ${areValueCardsVisible ? "translate-y-0" : "translate-y-[20px]"}`,
                            style: {
                                transitionProperty: "translate, transform",
                                transitionDuration: `${VALUE_CARD_REVEAL_DURATION_MS}ms, ${VALUE_CARD_REVEAL_DURATION_MS}ms`,
                                transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1), cubic-bezier(0.22,1,0.36,1)"
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "flex min-h-[24px] items-center gap-3 text-base font-semibold text-[#BD0265] md:text-xl",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            src: value.icon,
                                            alt: "",
                                            width: 20,
                                            height: 20,
                                            className: "h-5 w-5 shrink-0 object-contain"
                                        }, void 0, false, {
                                            fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsValuesSection.tsx",
                                            lineNumber: 111,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: value.title
                                        }, void 0, false, {
                                            fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsValuesSection.tsx",
                                            lineNumber: 118,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsValuesSection.tsx",
                                    lineNumber: 110,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-base font-normal leading-relaxed text-[#243747]",
                                    children: value.description
                                }, void 0, false, {
                                    fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsValuesSection.tsx",
                                    lineNumber: 120,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, value.title, true, {
                            fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsValuesSection.tsx",
                            lineNumber: 98,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsValuesSection.tsx",
                    lineNumber: 96,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsValuesSection.tsx",
            lineNumber: 92,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsValuesSection.tsx",
        lineNumber: 88,
        columnNumber: 5
    }, this);
}
_s(OverOnsValuesSection, "GJEjF1fUIB7OGz5e8MAwvqhSORY=");
_c = OverOnsValuesSection;
var _c;
__turbopack_context__.k.register(_c, "OverOnsValuesSection");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Coachscribe/website/components/BottomToast.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>BottomToast
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
"use client";
;
function BottomToast({ isVisible, message }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-6 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isVisible ? "translate-y-0 opacity-100" : "translate-y-[calc(100%+8rem)] opacity-0"}`,
        "aria-live": "polite",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "inline-flex h-12 items-center rounded-full bg-white px-6 text-center text-base font-bold text-[#1D0A00] shadow-[0_8px_20px_rgba(15,23,42,0.2)]",
            children: message
        }, void 0, false, {
            fileName: "[project]/Coachscribe/website/components/BottomToast.tsx",
            lineNumber: 18,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Coachscribe/website/components/BottomToast.tsx",
        lineNumber: 10,
        columnNumber: 5
    }, this);
}
_c = BottomToast;
var _c;
__turbopack_context__.k.register(_c, "BottomToast");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Coachscribe/website/lib/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getApiUrl",
    ()=>getApiUrl
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
const apiBaseUrl = String(("TURBOPACK compile-time value", "http://127.0.0.1:8787") || "").trim();
function getApiUrl(path) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    if (!apiBaseUrl) {
        throw new Error("NEXT_PUBLIC_COACHSCRIBE_API_BASE_URL ontbreekt.");
    }
    return `${apiBaseUrl.replace(/\/+$/, "")}${normalizedPath}`;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Coachscribe/website/over_ons/over_ons-beiden.png (static in ecmascript, tag client)", ((__turbopack_context__) => {

__turbopack_context__.v("/_next/static/media/over_ons-beiden.9f0eb0ba.png");}),
"[project]/Coachscribe/website/over_ons/over_ons-beiden.png.mjs { IMAGE => \"[project]/Coachscribe/website/over_ons/over_ons-beiden.png (static in ecmascript, tag client)\" } [app-client] (structured image object with data url, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$over_ons$2d$beiden$2e$png__$28$static__in__ecmascript$2c$__tag__client$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/over_ons/over_ons-beiden.png (static in ecmascript, tag client)");
;
const __TURBOPACK__default__export__ = {
    src: __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$over_ons$2d$beiden$2e$png__$28$static__in__ecmascript$2c$__tag__client$29$__["default"],
    width: 411,
    height: 273,
    blurWidth: 8,
    blurHeight: 5,
    blurDataURL: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAFCAYAAAB4ka1VAAAApElEQVR42gWASwvBcADA/x8LR3YiB66WkmQy5tVIK2NIeQyLRoqVR04eBw7cfar1kwgFA74UkUjEY0SlMJqSZ9RucvG2/L4PX6TlFOvlHHdkUc3INMoqE8tkst3wed8Q7srh9bxzPR3R6zUauk7O6GIuHFxvj/AOB67nM7vlDKOlMzDalLQK07lNdWwj0qrh55UyZiZJX5HpVQpoRRVraJPtOP4fcJJjMeGvOPAAAAAASUVORK5CYII="
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Coachscribe/website/over_ons/kom_in_contact-background.svg (static in ecmascript, tag client)", ((__turbopack_context__) => {

__turbopack_context__.v("/_next/static/media/kom_in_contact-background.4e4ede03.svg");}),
"[project]/Coachscribe/website/over_ons/kom_in_contact-background.svg.mjs { IMAGE => \"[project]/Coachscribe/website/over_ons/kom_in_contact-background.svg (static in ecmascript, tag client)\" } [app-client] (structured image object with data url, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$kom_in_contact$2d$background$2e$svg__$28$static__in__ecmascript$2c$__tag__client$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/over_ons/kom_in_contact-background.svg (static in ecmascript, tag client)");
;
const __TURBOPACK__default__export__ = {
    src: __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$kom_in_contact$2d$background$2e$svg__$28$static__in__ecmascript$2c$__tag__client$29$__["default"],
    width: 1147,
    height: 724,
    blurWidth: 0,
    blurHeight: 0
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Coachscribe/website/components/over-ons/OverOnsContactSection.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>OverOnsContactSection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/image.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$components$2f$home$2f$SectionContainer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/components/home/SectionContainer.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$components$2f$BottomToast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/components/BottomToast.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/lib/api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$over_ons$2d$beiden$2e$png$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$over_ons$2d$beiden$2e$png__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__ = __turbopack_context__.i('[project]/Coachscribe/website/over_ons/over_ons-beiden.png.mjs { IMAGE => "[project]/Coachscribe/website/over_ons/over_ons-beiden.png (static in ecmascript, tag client)" } [app-client] (structured image object with data url, ecmascript)');
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$kom_in_contact$2d$background$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$kom_in_contact$2d$background$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__ = __turbopack_context__.i('[project]/Coachscribe/website/over_ons/kom_in_contact-background.svg.mjs { IMAGE => "[project]/Coachscribe/website/over_ons/kom_in_contact-background.svg (static in ecmascript, tag client)" } [app-client] (structured image object with data url, ecmascript)');
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
const initialFormValues = {
    name: "",
    email: "",
    phone: "",
    message: ""
};
const inputClassName = "h-12 rounded-xl border border-white/60 bg-white/10 px-4 text-base font-normal text-white placeholder:text-white/70 outline-none transition-colors focus:border-white";
function OverOnsContactSection({ useRoundedContainer = true, useLightTheme = false }) {
    _s();
    const [formValues, setFormValues] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialFormValues);
    const [isSubmitting, setIsSubmitting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [toastMessage, setToastMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("Bericht verzonden! Je hoort snel van ons.");
    const [isToastVisible, setIsToastVisible] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "OverOnsContactSection.useEffect": ()=>{
            if (!isToastVisible) return;
            const timeout = window.setTimeout({
                "OverOnsContactSection.useEffect.timeout": ()=>setIsToastVisible(false)
            }["OverOnsContactSection.useEffect.timeout"], 2600);
            return ({
                "OverOnsContactSection.useEffect": ()=>window.clearTimeout(timeout)
            })["OverOnsContactSection.useEffect"];
        }
    }["OverOnsContactSection.useEffect"], [
        isToastVisible
    ]);
    const handleSubmit = async (event)=>{
        event.preventDefault();
        if (isSubmitting) return;
        const name = formValues.name.trim();
        const email = formValues.email.trim();
        const phone = formValues.phone.trim();
        const message = formValues.message.trim();
        try {
            setIsSubmitting(true);
            const response = await fetch((0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getApiUrl"])("/contact/request"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    message
                })
            });
            if (!response.ok) {
                throw new Error("Contactaanvraag verzenden mislukt.");
            }
            setFormValues(initialFormValues);
            setToastMessage("Bericht verzonden! Je hoort snel van ons.");
            setIsToastVisible(false);
            window.requestAnimationFrame(()=>setIsToastVisible(true));
        } catch  {
            setToastMessage("Verzenden mislukt. Probeer het opnieuw.");
            setIsToastVisible(false);
            window.requestAnimationFrame(()=>setIsToastVisible(true));
        } finally{
            setIsSubmitting(false);
        }
    };
    const titleClassName = useLightTheme ? "font-[var(--font-catamaran)] text-[36px] font-medium leading-[110%] text-[#1D0A00] md:text-[50px] xl:text-[64px]" : "font-[var(--font-catamaran)] text-[36px] font-medium leading-[110%] text-white md:text-[50px] xl:text-[64px]";
    const descriptionClassName = useLightTheme ? "mt-4 max-w-lg text-base font-normal leading-relaxed text-black/70" : "mt-4 max-w-lg text-base font-normal leading-relaxed text-white/90";
    const labelClassName = useLightTheme ? "text-sm font-normal text-[#1D0A00]" : "text-sm font-normal text-white";
    const fieldClassName = useLightTheme ? "h-12 rounded-xl border border-[#DDDDDD] bg-white px-4 text-base font-normal text-[#1D0A00] placeholder:text-black/50 outline-none transition-colors focus:border-[#BD0265]" : inputClassName;
    const textAreaClassName = useLightTheme ? "rounded-xl border border-[#DDDDDD] bg-white px-4 py-3 text-base font-normal text-[#1D0A00] placeholder:text-black/50 outline-none transition-colors focus:border-[#BD0265]" : "rounded-xl border border-white/60 bg-white/10 px-4 py-3 text-base font-normal text-white placeholder:text-white/70 outline-none transition-colors focus:border-white";
    const submitButtonClassName = useLightTheme ? "inline-flex h-12 cursor-pointer items-center gap-2 rounded-full border-2 border-[#BD0265] bg-[#BD0265] px-6 text-base font-semibold text-white transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#A00256] hover:bg-[#A00256]" : "inline-flex h-12 cursor-pointer items-center gap-2 rounded-full border border-white/60 bg-white/10 px-6 text-base font-normal text-white transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/20";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$components$2f$home$2f$SectionContainer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        className: "bg-[#F8F9F9]",
        contentClassName: "pb-[80px] pt-[80px] md:pb-[80px] md:pt-[80px]",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                id: "contact",
                className: `relative w-full overflow-hidden p-8 md:p-12 ${useLightTheme ? "bg-white shadow-[0_8px_20px_rgba(15,23,42,0.08)]" : ""} ${useRoundedContainer ? "rounded-[24px]" : ""}`,
                style: useLightTheme ? undefined : {
                    backgroundImage: `url(${__TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$kom_in_contact$2d$background$2e$svg$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$kom_in_contact$2d$background$2e$svg__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__["default"].src})`,
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "cover"
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid w-full gap-10 lg:grid-cols-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex h-full flex-col justify-center lg:pl-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: titleClassName,
                                    children: "Kom in contact"
                                }, void 0, false, {
                                    fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsContactSection.tsx",
                                    lineNumber: 136,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: descriptionClassName,
                                    children: [
                                        "Heb je een vraag, wil je input geven of ben je benieuwd wat wij",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                            fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsContactSection.tsx",
                                            lineNumber: 141,
                                            columnNumber: 15
                                        }, this),
                                        "voor jou kunnen betekenen? Neem contact met ons op!"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsContactSection.tsx",
                                    lineNumber: 139,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    src: __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$over_ons$2d$beiden$2e$png$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$Coachscribe$2f$website$2f$over_ons$2f$over_ons$2d$beiden$2e$png__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__["default"],
                                    alt: "CoachScribe team",
                                    className: "mt-6 h-auto w-full max-w-[320px] rounded-xl object-cover md:max-w-[380px] xl:max-w-[420px]"
                                }, void 0, false, {
                                    fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsContactSection.tsx",
                                    lineNumber: 144,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsContactSection.tsx",
                            lineNumber: 135,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                            className: "flex w-full flex-col gap-4 lg:pr-6",
                            onSubmit: handleSubmit,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "flex w-full flex-col gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: labelClassName,
                                            children: "Volledige naam*"
                                        }, void 0, false, {
                                            fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsContactSection.tsx",
                                            lineNumber: 152,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "text",
                                            name: "name",
                                            required: true,
                                            value: formValues.name,
                                            onChange: (event)=>setFormValues((previousValues)=>({
                                                        ...previousValues,
                                                        name: event.target.value
                                                    })),
                                            placeholder: "Jouw volledige naam",
                                            className: fieldClassName
                                        }, void 0, false, {
                                            fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsContactSection.tsx",
                                            lineNumber: 153,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsContactSection.tsx",
                                    lineNumber: 151,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "flex w-full flex-col gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: labelClassName,
                                            children: "Email*"
                                        }, void 0, false, {
                                            fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsContactSection.tsx",
                                            lineNumber: 169,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "email",
                                            name: "email",
                                            required: true,
                                            value: formValues.email,
                                            onChange: (event)=>setFormValues((previousValues)=>({
                                                        ...previousValues,
                                                        email: event.target.value
                                                    })),
                                            placeholder: "Jouw Email adres",
                                            className: fieldClassName
                                        }, void 0, false, {
                                            fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsContactSection.tsx",
                                            lineNumber: 170,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsContactSection.tsx",
                                    lineNumber: 168,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "flex w-full flex-col gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: labelClassName,
                                            children: "Nummer (optioneel)"
                                        }, void 0, false, {
                                            fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsContactSection.tsx",
                                            lineNumber: 186,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "tel",
                                            name: "phone",
                                            value: formValues.phone,
                                            onChange: (event)=>setFormValues((previousValues)=>({
                                                        ...previousValues,
                                                        phone: event.target.value
                                                    })),
                                            placeholder: "Jouw telefoonnummer",
                                            className: fieldClassName
                                        }, void 0, false, {
                                            fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsContactSection.tsx",
                                            lineNumber: 189,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsContactSection.tsx",
                                    lineNumber: 185,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "flex w-full flex-col gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: labelClassName,
                                            children: "Bericht*"
                                        }, void 0, false, {
                                            fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsContactSection.tsx",
                                            lineNumber: 204,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                            name: "message",
                                            rows: 5,
                                            required: true,
                                            value: formValues.message,
                                            onChange: (event)=>setFormValues((previousValues)=>({
                                                        ...previousValues,
                                                        message: event.target.value
                                                    })),
                                            placeholder: "Laat ons weten wat je denkt...",
                                            className: textAreaClassName
                                        }, void 0, false, {
                                            fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsContactSection.tsx",
                                            lineNumber: 205,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsContactSection.tsx",
                                    lineNumber: 203,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "pt-1",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "submit",
                                        disabled: isSubmitting,
                                        className: submitButtonClassName,
                                        children: isSubmitting ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            "aria-label": "Versturen",
                                            className: "h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
                                        }, void 0, false, {
                                            fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsContactSection.tsx",
                                            lineNumber: 227,
                                            columnNumber: 19
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: "Verstuur"
                                                }, void 0, false, {
                                                    fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsContactSection.tsx",
                                                    lineNumber: 233,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    "aria-hidden": "true",
                                                    children: "->"
                                                }, void 0, false, {
                                                    fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsContactSection.tsx",
                                                    lineNumber: 234,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true)
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsContactSection.tsx",
                                        lineNumber: 221,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsContactSection.tsx",
                                    lineNumber: 220,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsContactSection.tsx",
                            lineNumber: 150,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsContactSection.tsx",
                    lineNumber: 134,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsContactSection.tsx",
                lineNumber: 116,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$components$2f$BottomToast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                isVisible: isToastVisible,
                message: toastMessage
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsContactSection.tsx",
                lineNumber: 242,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Coachscribe/website/components/over-ons/OverOnsContactSection.tsx",
        lineNumber: 112,
        columnNumber: 5
    }, this);
}
_s(OverOnsContactSection, "db++qIxtFHbfqioEFVKLHnSHlzQ=");
_c = OverOnsContactSection;
var _c;
__turbopack_context__.k.register(_c, "OverOnsContactSection");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=Coachscribe_website_9c4ee947._.js.map