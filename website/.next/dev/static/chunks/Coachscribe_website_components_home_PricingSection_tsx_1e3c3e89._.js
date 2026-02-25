(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
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
    const eurSavedWeek = hoursSavedWeek * inputs.hourlyRate * (inputs.newSessionsPercentage / 100);
    const eurSavedMonth = eurSavedWeek * 4.33;
    const eurSavedYear = eurSavedWeek * inputs.weeksPerYear;
    const netMonth = eurSavedMonth - inputs.subscriptionMonthly;
    return {
        currentHoursWeek,
        toolHoursWeek,
        hoursSavedWeek,
        eurSavedWeek,
        eurSavedMonth,
        eurSavedYear,
        netMonth
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
function PricingSection(props) {
    _s1();
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [isVisible, setIsVisible] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [hourlyRate, setHourlyRate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(75);
    const [sessionsPerWeek, setSessionsPerWeek] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(10);
    const [currentMinutes, setCurrentMinutes] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(20);
    const [newSessionsPercentage, setNewSessionsPercentage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(50);
    const [subscriptionMonthly, setSubscriptionMonthly] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(29);
    const toolMinutes = 8;
    const weeksPerYear = 46;
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
                weeksPerYear,
                newSessionsPercentage
            })
    }["PricingSection.useMemo[roi]"], [
        hourlyRate,
        sessionsPerWeek,
        currentMinutes,
        subscriptionMonthly,
        newSessionsPercentage
    ]);
    const animatedHoursSavedWeek = useAnimatedNumber(roi.hoursSavedWeek);
    const animatedSavedMonth = useAnimatedNumber(roi.eurSavedMonth);
    const animatedSavedYear = useAnimatedNumber(roi.eurSavedYear);
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
                    "aria-label": "Calculator laden"
                }, void 0, false, {
                    fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                    lineNumber: 253,
                    columnNumber: 13
                }, this)
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 252,
                columnNumber: 11
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 gap-6 lg:grid-cols-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-2xl border border-[#E0E0E0] bg-white p-6 md:p-7",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-[24px] font-semibold leading-[30px] text-[#1D0A00] md:text-[26px] md:leading-[32px]",
                                children: "ROI calculator"
                            }, void 0, false, {
                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                lineNumber: 261,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-2 text-[14px] leading-5 text-[rgba(38,52,63,0.78)] md:text-[15px] md:leading-6",
                                children: "Bereken hoeveel tijd en omzet je potentieel vrijspeelt met CoachScribe."
                            }, void 0, false, {
                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                lineNumber: 264,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-5 space-y-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(RangeWithInput, {
                                        id: "hourlyRate",
                                        label: "Uurtarief (EUR)",
                                        min: 20,
                                        max: 250,
                                        step: 1,
                                        value: hourlyRate,
                                        onChange: setHourlyRate,
                                        unit: "EUR"
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 269,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(RangeWithInput, {
                                        id: "sessionsPerWeek",
                                        label: "Sessies per week",
                                        min: 1,
                                        max: 40,
                                        step: 1,
                                        value: sessionsPerWeek,
                                        onChange: setSessionsPerWeek,
                                        unit: "sessies"
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 279,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(RangeWithInput, {
                                        id: "currentMinutes",
                                        label: "Minuten verslaglegging per sessie (nu)",
                                        min: 5,
                                        max: 90,
                                        step: 1,
                                        value: currentMinutes,
                                        onChange: setCurrentMinutes,
                                        unit: "min"
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 289,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(RangeWithInput, {
                                        id: "newSessionsPercentage",
                                        label: "In welk deel van je bespaarde tijd help je nieuwe mensen?",
                                        min: 0,
                                        max: 100,
                                        step: 1,
                                        value: newSessionsPercentage,
                                        onChange: setNewSessionsPercentage,
                                        unit: "%"
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 299,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                lineNumber: 268,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                        lineNumber: 260,
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
                                        lineNumber: 314,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MetricCard, {
                                        label: "Besparing per maand",
                                        value: formatEuro(animatedSavedMonth)
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 318,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MetricCard, {
                                        label: "Besparing per jaar",
                                        value: formatEuro(animatedSavedYear)
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 322,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                lineNumber: 313,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-4 rounded-xl border border-[#E6E6E6] bg-white p-4 text-[#1D0A00]",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[13px] leading-5 text-[rgba(38,52,63,0.72)]",
                                        children: "Netto besparing per maand"
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 329,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-1 text-[28px] font-semibold leading-8 text-[#1D0A00]",
                                        children: [
                                            `${formatEuro(animatedSavedMonth)} - `,
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "relative inline-block pr-2",
                                                children: [
                                                    formatEuro(subscriptionMonthly),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "absolute -right-0 top-0 text-[10px] leading-none",
                                                        children: "*"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                        lineNumber: 336,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                                lineNumber: 334,
                                                columnNumber: 19
                                            }, this),
                                            ` = ${formatEuro(animatedNetMonth)}`
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                        lineNumber: 332,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                lineNumber: 328,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-2 text-[12px] leading-4 text-[rgba(38,52,63,0.65)]",
                                children: "Een CoachScribe abonnement kost 85 euro per maand."
                            }, void 0, false, {
                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                lineNumber: 341,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-6",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$components$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    label: "Probeer het uit",
                                    destination: APP_URL,
                                    variant: "primary",
                                    className: "h-[46px] w-full rounded-[14px] text-[16px] font-semibold",
                                    openInNewTab: true
                                }, void 0, false, {
                                    fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                    lineNumber: 346,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                                lineNumber: 345,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                        lineNumber: 312,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 259,
                columnNumber: 11
            }, this)
        }, void 0, false, {
            fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
            lineNumber: 250,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
        lineNumber: 242,
        columnNumber: 5
    }, this);
}
_s1(PricingSection, "xfJ1NnKgTxJUUCD+7dDvFLLUs4U=", false, function() {
    return [
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
                lineNumber: 370,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "mt-1 text-[28px] font-semibold leading-8 text-[#1D0A00]",
                children: value
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 371,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
        lineNumber: 369,
        columnNumber: 5
    }, this);
}
_c1 = MetricCard;
function RangeWithInput(props) {
    const { id, label, min, max, step, value, onChange, unit } = props;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-1.5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                htmlFor: `${id}-input`,
                className: "text-[13px] font-medium leading-5 text-[#1D0A00] md:text-[14px] md:leading-5",
                children: label
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 392,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex w-[50%] max-w-[150px] items-center gap-1.5",
                children: [
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
                        className: "w-full rounded-lg border border-[#D8D8D8] bg-white px-2.5 py-1.5 text-right text-[13px] leading-5 text-[#1D0A00] outline-none"
                    }, void 0, false, {
                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                        lineNumber: 399,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-[11px] leading-4 text-[rgba(29,10,0,0.65)] md:text-[12px]",
                        children: unit
                    }, void 0, false, {
                        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                        lineNumber: 413,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
                lineNumber: 398,
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
                lineNumber: 417,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Coachscribe/website/components/home/PricingSection.tsx",
        lineNumber: 391,
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

//# sourceMappingURL=Coachscribe_website_components_home_PricingSection_tsx_1e3c3e89._.js.map