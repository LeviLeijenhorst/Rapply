(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/lib/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getApiUrl",
    ()=>getApiUrl
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
const apiBaseUrl = String(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_COACHSCRIBE_API_BASE_URL || "").trim();
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
"[project]/components/WebsiteAnalyticsTracker.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>WebsiteAnalyticsTracker
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/api.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const MAX_BUFFER_SIZE = 150;
function getStorage() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        return window.localStorage;
    } catch  {
        return null;
    }
}
function readOrCreateStorageId(key) {
    const storage = getStorage();
    const existing = storage?.getItem(key);
    if (existing) return existing;
    const next = `${key}-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
    storage?.setItem(key, next);
    return next;
}
function readElementData(target) {
    if (!(target instanceof Element)) return {};
    const element = target;
    const text = String(element.textContent || "").trim().slice(0, 120);
    const href = element instanceof HTMLAnchorElement ? element.href : element.closest("a")?.getAttribute("href");
    return {
        tag: element.tagName.toLowerCase(),
        id: element.id || null,
        className: String(element.className || "").slice(0, 160) || null,
        role: element.getAttribute("role"),
        ariaLabel: element.getAttribute("aria-label"),
        text: text || null,
        href: href || null,
        testId: element.getAttribute("data-testid")
    };
}
async function postEvents(events) {
    if (events.length === 0) return;
    try {
        await fetch((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getApiUrl"])("/analytics/public/events"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                app: "website",
                events
            }),
            keepalive: true
        });
    } catch  {
    // Best effort analytics.
    }
}
function WebsiteAnalyticsTracker() {
    _s();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const eventBufferRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])([]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WebsiteAnalyticsTracker.useEffect": ()=>{
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            const anonymousId = readOrCreateStorageId("coachscribe_website_anon_id");
            const sessionId = readOrCreateStorageId("coachscribe_website_session_id");
            const queueEvent = {
                "WebsiteAnalyticsTracker.useEffect.queueEvent": (event)=>{
                    eventBufferRef.current.push({
                        ...event,
                        anonymousId,
                        sessionId,
                        occurredAt: new Date().toISOString()
                    });
                    if (eventBufferRef.current.length > MAX_BUFFER_SIZE) {
                        eventBufferRef.current.splice(0, eventBufferRef.current.length - MAX_BUFFER_SIZE);
                    }
                }
            }["WebsiteAnalyticsTracker.useEffect.queueEvent"];
            const flush = {
                "WebsiteAnalyticsTracker.useEffect.flush": async ()=>{
                    if (eventBufferRef.current.length === 0) return;
                    const events = [
                        ...eventBufferRef.current
                    ];
                    eventBufferRef.current = [];
                    await postEvents(events);
                }
            }["WebsiteAnalyticsTracker.useEffect.flush"];
            queueEvent({
                type: "visit",
                action: "page_open",
                path: window.location.pathname,
                metadata: {
                    source: "website"
                }
            });
            void flush();
            const flushIntervalId = window.setInterval({
                "WebsiteAnalyticsTracker.useEffect.flushIntervalId": ()=>{
                    void flush();
                }
            }["WebsiteAnalyticsTracker.useEffect.flushIntervalId"], 2000);
            const onBeforeUnload = {
                "WebsiteAnalyticsTracker.useEffect.onBeforeUnload": ()=>{
                    void flush();
                }
            }["WebsiteAnalyticsTracker.useEffect.onBeforeUnload"];
            const onClick = {
                "WebsiteAnalyticsTracker.useEffect.onClick": (event)=>{
                    queueEvent({
                        type: "click",
                        action: "user_click",
                        path: window.location.pathname,
                        metadata: readElementData(event.target)
                    });
                }
            }["WebsiteAnalyticsTracker.useEffect.onClick"];
            document.addEventListener("click", onClick, true);
            window.addEventListener("beforeunload", onBeforeUnload);
            return ({
                "WebsiteAnalyticsTracker.useEffect": ()=>{
                    document.removeEventListener("click", onClick, true);
                    window.removeEventListener("beforeunload", onBeforeUnload);
                    window.clearInterval(flushIntervalId);
                    void flush();
                }
            })["WebsiteAnalyticsTracker.useEffect"];
        }
    }["WebsiteAnalyticsTracker.useEffect"], [
        pathname
    ]);
    return null;
}
_s(WebsiteAnalyticsTracker, "o/YYKeMp67sVFO7GZbnkSjf5b0w=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"]
    ];
});
_c = WebsiteAnalyticsTracker;
var _c;
__turbopack_context__.k.register(_c, "WebsiteAnalyticsTracker");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/node_modules/next/navigation.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/client/components/navigation.js [app-client] (ecmascript)");
}),
]);

//# sourceMappingURL=_f9292c95._.js.map