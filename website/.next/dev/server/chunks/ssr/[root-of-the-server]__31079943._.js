module.exports = [
"[project]/Coachscribe/website/app/favicon.ico.mjs { IMAGE => \"[project]/Coachscribe/website/app/favicon.ico (static in ecmascript, tag client)\" } [app-rsc] (structured image object, ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/Coachscribe/website/app/favicon.ico.mjs { IMAGE => \"[project]/Coachscribe/website/app/favicon.ico (static in ecmascript, tag client)\" } [app-rsc] (structured image object, ecmascript)"));
}),
"[project]/Coachscribe/website/app/icon.svg.mjs { IMAGE => \"[project]/Coachscribe/website/app/icon.svg (static in ecmascript, tag client)\" } [app-rsc] (structured image object, ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/Coachscribe/website/app/icon.svg.mjs { IMAGE => \"[project]/Coachscribe/website/app/icon.svg (static in ecmascript, tag client)\" } [app-rsc] (structured image object, ecmascript)"));
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/Coachscribe/website/app/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/Coachscribe/website/app/layout.tsx [app-rsc] (ecmascript)"));
}),
"[project]/Coachscribe/website/app/(site)/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/Coachscribe/website/app/(site)/layout.tsx [app-rsc] (ecmascript)"));
}),
"[project]/Coachscribe/website/components/legal/LegalDocumentPage.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LegalDocumentPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
;
function slugify(value) {
    return value.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60);
}
function parseMarkdown(markdown) {
    const normalized = markdown.replace(/\r/g, "");
    const lines = normalized.split("\n");
    const hasStructuredMarkdown = lines.some((line)=>{
        const trimmedLine = line.trim();
        return /^#{1,6}\s+/.test(trimmedLine) || /^-\s+/.test(trimmedLine) || trimmedLine === "---";
    });
    if (!hasStructuredMarkdown) {
        const plainLines = lines.map((line)=>line.trim()).filter(Boolean);
        const blocks = [];
        let blockIndex = 0;
        let pendingListItems = [];
        let expectsListItems = false;
        const flushPendingList = ()=>{
            if (pendingListItems.length === 0) return;
            blocks.push({
                type: "list",
                id: `l-${blockIndex++}`,
                items: [
                    ...pendingListItems
                ]
            });
            pendingListItems = [];
        };
        const isLikelyHeading = (value)=>value.length <= 70 && !/[.:;!?]$/.test(value);
        plainLines.forEach((line, index)=>{
            const isHeading = index === 0 || isLikelyHeading(line);
            if (isHeading) {
                flushPendingList();
                blocks.push({
                    type: "heading",
                    id: `h-${slugify(line)}-${blockIndex++}`,
                    level: index === 0 ? 2 : 3,
                    text: line
                });
                expectsListItems = false;
                return;
            }
            if (expectsListItems && line.length <= 140) {
                pendingListItems.push(line);
                return;
            }
            flushPendingList();
            blocks.push({
                type: "paragraph",
                id: `p-${blockIndex++}`,
                text: line
            });
            expectsListItems = line.endsWith(":");
        });
        flushPendingList();
        return blocks;
    }
    const blocks = [];
    let paragraphLines = [];
    let listLines = [];
    let blockIndex = 0;
    const flushParagraph = ()=>{
        if (paragraphLines.length === 0) return;
        blocks.push({
            type: "paragraph",
            id: `p-${blockIndex++}`,
            text: paragraphLines.join("\n").trim()
        });
        paragraphLines = [];
    };
    const flushList = ()=>{
        if (listLines.length === 0) return;
        blocks.push({
            type: "list",
            id: `l-${blockIndex++}`,
            items: [
                ...listLines
            ]
        });
        listLines = [];
    };
    for (const line of lines){
        const trimmedLine = line.trim();
        if (trimmedLine.length === 0) {
            flushParagraph();
            flushList();
            continue;
        }
        if (trimmedLine === "---") {
            flushParagraph();
            flushList();
            blocks.push({
                type: "divider",
                id: `d-${blockIndex++}`
            });
            continue;
        }
        const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            flushParagraph();
            flushList();
            const level = headingMatch[1].length;
            const text = headingMatch[2].trim();
            blocks.push({
                type: "heading",
                id: `h-${slugify(text)}-${blockIndex++}`,
                level,
                text
            });
            continue;
        }
        const bulletMatch = trimmedLine.match(/^-\s+(.+)$/);
        if (bulletMatch) {
            flushParagraph();
            listLines.push(bulletMatch[1].trim());
            continue;
        }
        flushList();
        paragraphLines.push(trimmedLine);
    }
    flushParagraph();
    flushList();
    return blocks;
}
function repairMojibake(value) {
    if (!/[ÃÂâ]/.test(value)) return value;
    try {
        const bytes = Uint8Array.from(value, (character)=>character.charCodeAt(0));
        return new TextDecoder("utf-8").decode(bytes);
    } catch  {
        return value;
    }
}
function renderInline(text, keyPrefix) {
    const normalizedText = repairMojibake(text);
    const segments = normalizedText.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
    return segments.map((segment, index)=>{
        const key = `${keyPrefix}-${index}`;
        if (segment.startsWith("**") && segment.endsWith("**")) {
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                children: segment.slice(2, -2)
            }, key, false, {
                fileName: "[project]/Coachscribe/website/components/legal/LegalDocumentPage.tsx",
                lineNumber: 200,
                columnNumber: 14
            }, this);
        }
        if (segment.startsWith("`") && segment.endsWith("`")) {
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                className: "rounded bg-[#EEF0FF] px-1.5 py-0.5 text-[0.95em] text-[#243747]",
                children: segment.slice(1, -1)
            }, key, false, {
                fileName: "[project]/Coachscribe/website/components/legal/LegalDocumentPage.tsx",
                lineNumber: 204,
                columnNumber: 9
            }, this);
        }
        const lineSegments = segment.split("\n");
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            children: lineSegments.map((lineSegment, lineIndex)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    children: [
                        lineSegment,
                        lineIndex < lineSegments.length - 1 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                            fileName: "[project]/Coachscribe/website/components/legal/LegalDocumentPage.tsx",
                            lineNumber: 218,
                            columnNumber: 52
                        }, this) : null
                    ]
                }, `${key}-line-${lineIndex}`, true, {
                    fileName: "[project]/Coachscribe/website/components/legal/LegalDocumentPage.tsx",
                    lineNumber: 216,
                    columnNumber: 11
                }, this))
        }, key, false, {
            fileName: "[project]/Coachscribe/website/components/legal/LegalDocumentPage.tsx",
            lineNumber: 214,
            columnNumber: 7
        }, this);
    });
}
function LegalDocumentPage({ title, subtitle, markdown }) {
    const blocks = parseMarkdown(markdown);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "w-full bg-white",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mx-auto w-full max-w-6xl p-6 py-12 md:p-10 md:py-16",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mx-auto flex w-full max-w-4xl flex-col gap-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-4xl font-semibold text-[#1D0A00] md:text-5xl",
                                children: title
                            }, void 0, false, {
                                fileName: "[project]/Coachscribe/website/components/legal/LegalDocumentPage.tsx",
                                lineNumber: 238,
                                columnNumber: 11
                            }, this),
                            subtitle ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-base font-normal text-black/70 md:text-lg",
                                children: subtitle
                            }, void 0, false, {
                                fileName: "[project]/Coachscribe/website/components/legal/LegalDocumentPage.tsx",
                                lineNumber: 242,
                                columnNumber: 13
                            }, this) : null
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Coachscribe/website/components/legal/LegalDocumentPage.tsx",
                        lineNumber: 237,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: "rounded-2xl border border-black/10 bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.06)] md:p-8",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col gap-5 text-base font-normal leading-relaxed text-[#1D0A00]",
                            children: blocks.map((block)=>{
                                if (block.type === "divider") {
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("hr", {
                                        className: "border-black/10"
                                    }, block.id, false, {
                                        fileName: "[project]/Coachscribe/website/components/legal/LegalDocumentPage.tsx",
                                        lineNumber: 251,
                                        columnNumber: 24
                                    }, this);
                                }
                                if (block.type === "heading") {
                                    const classNameByLevel = {
                                        1: "text-2xl font-semibold text-[#1D0A00]",
                                        2: "text-xl font-semibold text-[#1D0A00]",
                                        3: "text-lg font-semibold text-[#1D0A00]",
                                        4: "text-base font-semibold text-[#1D0A00]",
                                        5: "text-base font-semibold text-[#1D0A00]",
                                        6: "text-base font-semibold text-[#1D0A00]"
                                    };
                                    const headingLevel = Math.min(block.level + 1, 6);
                                    if (headingLevel === 2) {
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            id: block.id,
                                            className: classNameByLevel[block.level],
                                            children: renderInline(block.text, block.id)
                                        }, block.id, false, {
                                            fileName: "[project]/Coachscribe/website/components/legal/LegalDocumentPage.tsx",
                                            lineNumber: 266,
                                            columnNumber: 21
                                        }, this);
                                    }
                                    if (headingLevel === 3) {
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            id: block.id,
                                            className: classNameByLevel[block.level],
                                            children: renderInline(block.text, block.id)
                                        }, block.id, false, {
                                            fileName: "[project]/Coachscribe/website/components/legal/LegalDocumentPage.tsx",
                                            lineNumber: 273,
                                            columnNumber: 21
                                        }, this);
                                    }
                                    if (headingLevel === 4) {
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                            id: block.id,
                                            className: classNameByLevel[block.level],
                                            children: renderInline(block.text, block.id)
                                        }, block.id, false, {
                                            fileName: "[project]/Coachscribe/website/components/legal/LegalDocumentPage.tsx",
                                            lineNumber: 280,
                                            columnNumber: 21
                                        }, this);
                                    }
                                    if (headingLevel === 5) {
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h5", {
                                            id: block.id,
                                            className: classNameByLevel[block.level],
                                            children: renderInline(block.text, block.id)
                                        }, block.id, false, {
                                            fileName: "[project]/Coachscribe/website/components/legal/LegalDocumentPage.tsx",
                                            lineNumber: 287,
                                            columnNumber: 21
                                        }, this);
                                    }
                                    if (headingLevel === 6) {
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h6", {
                                            id: block.id,
                                            className: classNameByLevel[block.level],
                                            children: renderInline(block.text, block.id)
                                        }, block.id, false, {
                                            fileName: "[project]/Coachscribe/website/components/legal/LegalDocumentPage.tsx",
                                            lineNumber: 294,
                                            columnNumber: 21
                                        }, this);
                                    }
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        id: block.id,
                                        className: classNameByLevel[block.level],
                                        children: renderInline(block.text, block.id)
                                    }, block.id, false, {
                                        fileName: "[project]/Coachscribe/website/components/legal/LegalDocumentPage.tsx",
                                        lineNumber: 300,
                                        columnNumber: 19
                                    }, this);
                                }
                                if (block.type === "list") {
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                        className: "list-disc pl-6",
                                        children: block.items.map((item, itemIndex)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: renderInline(item, `${block.id}-${itemIndex}`)
                                            }, `${block.id}-${itemIndex}`, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/LegalDocumentPage.tsx",
                                                lineNumber: 310,
                                                columnNumber: 23
                                            }, this))
                                    }, block.id, false, {
                                        fileName: "[project]/Coachscribe/website/components/legal/LegalDocumentPage.tsx",
                                        lineNumber: 308,
                                        columnNumber: 19
                                    }, this);
                                }
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    children: renderInline(block.text, block.id)
                                }, block.id, false, {
                                    fileName: "[project]/Coachscribe/website/components/legal/LegalDocumentPage.tsx",
                                    lineNumber: 319,
                                    columnNumber: 17
                                }, this);
                            })
                        }, void 0, false, {
                            fileName: "[project]/Coachscribe/website/components/legal/LegalDocumentPage.tsx",
                            lineNumber: 248,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Coachscribe/website/components/legal/LegalDocumentPage.tsx",
                        lineNumber: 247,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Coachscribe/website/components/legal/LegalDocumentPage.tsx",
                lineNumber: 236,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/Coachscribe/website/components/legal/LegalDocumentPage.tsx",
            lineNumber: 235,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Coachscribe/website/components/legal/LegalDocumentPage.tsx",
        lineNumber: 234,
        columnNumber: 5
    }, this);
}
}),
"[project]/Coachscribe/website/documentation/legal/legalContent.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "legalContent",
    ()=>legalContent
]);
const legalContent = {
    privacybeleid: `## Privacyverklaring CoachScribe

Deze privacyverklaring legt uit welke persoonsgegevens JNL Solutions verwerkt wanneer je CoachScribe gebruikt, waarom dat gebeurt, met wie gegevens worden gedeeld en welke rechten je hebt.

JNL Solutions, gevestigd aan Stationsplein 26, 6512 AB, Nijmegen, is verantwoordelijk voor de verwerking van persoonsgegevens zoals beschreven in deze privacyverklaring.

## Contactgegevens

- Website: https://www.coachscribe.nl
- Adres: Stationsplein 26, 6512 AB, Nijmegen
- Telefoon: +31 6 221 68 360
- E-mail: contact@coachscribe.nl

## Rollen en verantwoordelijkheid

- Jij als coach bent verwerkingsverantwoordelijke voor de inhoud die je in CoachScribe verwerkt.
- CoachScribe (JNL Solutions) is verwerker en verwerkt gegevens alleen in jouw opdracht om de dienst te leveren.
- Jij blijft verantwoordelijk voor het rechtmatig vastleggen van gesprekken en het hebben van een geldige rechtsgrond.

## Hoe data door CoachScribe stroomt

- Opname gebeurt lokaal op jouw apparaat.
- Voor transcriptie wordt audio versleuteld verstuurd via een tijdelijk uploadmechanisme.
- Tijdelijke audio-uploads voor transcriptie worden na verwerking verwijderd.
- Transcripties, samenvattingen, notities en sessie-inhoud worden versleuteld opgeslagen.
- Jij bepaalt welke inhoud je toevoegt en wanneer je gegevens verwijdert.

## Welke persoonsgegevens wij verwerken

### Account- en authenticatiegegevens

Wij gebruiken Microsoft Entra voor authenticatie. Daarbij verwerken wij:

- Jouw unieke gebruikers-id
- Je voornaam
- Je achternaam
- Je e-mailadres

### Inhoud die je zelf toevoegt

Wij verwerken gegevens die je zelf toevoegt of laat genereren, zoals:

- Namen van coachees
- Sessietitels
- Transcripties
- Verslagen
- Notities
- Chatberichten binnen de snelle-vragenfunctionaliteit

In deze inhoud kunnen persoonsgegevens voorkomen en, afhankelijk van wat je bespreekt, ook bijzondere persoonsgegevens zoals gezondheidsgegevens.

### Technische en beveiligingsgegevens

Wij verwerken technische gegevens die nodig zijn voor beveiliging en werking, zoals:

- IP-adres (onder andere voor beveiliging en rate limiting)
- Technische loggegevens (zoals foutmeldingen en diagnostiek)

Wij gebruiken geen tracking-, marketing- of analytics-tools.

### Communicatiegegevens

Als je contact met ons opneemt verwerken wij de gegevens die je verstrekt, zoals:

- Je e-mailadres
- Je naam (indien opgegeven)
- De inhoud van je bericht

## Gevoelige gegevens en toestemming

CoachScribe kan worden gebruikt in situaties waarin gevoelige onderwerpen worden besproken. Daardoor kan de inhoud bijzondere persoonsgegevens bevatten, zoals gegevens over de gezondheid van een coachee.

Voordat je audio opneemt of uploadt, moet je bevestigen dat je expliciete toestemming hebt van je coachee.

Onder expliciete toestemming verstaan wij een vrij gegeven, specifieke, geinformeerde en ondubbelzinnige wilsuiting conform de AVG.

Op https://www.coachscribe.nl/toestemming-vragen leggen wij uit hoe je toestemming kunt vragen.

## Doeleinden van de verwerking

Wij verwerken persoonsgegevens om:

- Accounts te beheren en authenticatie mogelijk te maken
- Transcriptie, samenvatting, notities en chatfunctionaliteit te leveren
- Betalingen en abonnementen af te handelen
- Beveiliging, stabiliteit en foutopsporing uit te voeren
- Te voldoen aan wettelijke verplichtingen

## Grondslagen (AVG)

Wij verwerken persoonsgegevens op basis van:

- Uitvoering van de overeenkomst
- Gerechtvaardigd belang (zoals beveiliging en misbruikpreventie)
- Wettelijke verplichting

Wanneer er bijzondere persoonsgegevens in de inhoud voorkomen, hangt de rechtmatigheid mede af van jouw eigen verantwoordelijkheid en rechtsgrond.

## AI-verwerking en modelgebruik

- AI-verwerking gebeurt binnen enterprise-omgevingen die wij voor CoachScribe hebben ingericht.
- Gegevens uit CoachScribe worden niet door ons verkocht.
- Gegevens uit CoachScribe worden niet door ons gebruikt om publieke AI-modellen te trainen.
- Verwerking van inhoud gebeurt uitsluitend voor de door jou gevraagde functionaliteit.

## Verwerking binnen de EU en doorgifte

- Patiënt- en sessie-inhoud (zoals audio, transcripties, samenvattingen en notities) wordt verwerkt en opgeslagen binnen door ons gebruikte Azure-regio's in de EU.
- Onze huidige primaire regio's zijn West Europe, Belgium Central en Sweden Central.
- Voor bepaalde account-, authenticatie- of abonnementsfunctionaliteit gebruiken wij externe partijen. Daardoor kan beperkte metadata buiten de EU worden verwerkt, afhankelijk van die partij.
- Waar nodig treffen wij passende contractuele en organisatorische waarborgen.

## Delen met derden en subverwerkers

Wij delen persoonsgegevens alleen met partijen die nodig zijn om CoachScribe te laten functioneren.

Belangrijke categorieën:

- Cloud hosting en opslag (EU)
- AI-verwerking binnen onze enterprise-inrichting
- Authenticatie (Microsoft Entra)
- Abonnementsbeheer en aankoopstatus (RevenueCat)

Een actuele lijst van subverwerkers is op aanvraag beschikbaar.

## Bewaartermijnen

- Accountgegevens: zolang je account actief is
- Inhoud (transcripties, verslagen, notities en sessiegegevens): totdat je deze verwijdert of je account verwijdert
- Tijdelijke audio-uploads voor transcriptie: verwijderd na verwerking
- Supportberichten: zolang nodig voor afhandeling

Bij verwijdering van je account worden bijbehorende gegevens verwijderd, tenzij een wettelijke verplichting anders vereist.

## Beveiliging

Wij nemen passende technische en organisatorische maatregelen om persoonsgegevens te beveiligen tegen verlies, misbruik en onbevoegde toegang.

Belangrijke maatregelen zijn onder meer:

- End-to-end-versleuteling voor opgeslagen inhoud
- Beveiligde verbindingen (HTTPS)
- Toegangsbeperking tot systemen
- Rate limiting en misbruikdetectie

Bij vermoedens van een beveiligingsincident kun je contact opnemen via contact@coachscribe.nl.

## Geautomatiseerde besluitvorming

CoachScribe gebruikt geen geautomatiseerde besluitvorming of profilering die rechtsgevolgen heeft of je significant treft.

## Cookies

CoachScribe gebruikt geen tracking-, marketing- of analytics-cookies. Eventuele cookies zijn uitsluitend functioneel en technisch noodzakelijk.

## Jouw rechten

Je hebt onder de AVG het recht om:

- Je persoonsgegevens in te zien
- Je persoonsgegevens te laten corrigeren
- Je persoonsgegevens te laten verwijderen
- De verwerking te laten beperken
- Bezwaar te maken tegen bepaalde verwerkingen

Je kunt een verzoek sturen naar contact@coachscribe.nl. Wij reageren binnen een maand.

Je hebt ook het recht om een klacht in te dienen bij de Autoriteit Persoonsgegevens via www.autoriteitpersoonsgegevens.nl.

## Leeftijdsgrens

CoachScribe is niet bedoeld voor personen jonger dan 16 jaar. Wij verzamelen niet bewust persoonsgegevens van personen jonger dan 16 jaar.

## Wijzigingen

Wij kunnen deze privacyverklaring wijzigen. De meest actuele versie is beschikbaar via onze website.`,
    gebruikersovereenkomst: "### Gebruikersovereenkomst CoachScribe\r\n\r\nDeze gebruikersovereenkomst beschrijft de afspraken tussen jou en JNL Solutions over het gebruik van CoachScribe.\r\n\r\nDoor CoachScribe te gebruiken ga je akkoord met deze gebruikersovereenkomst.\r\n\r\n---\r\n\r\n### 1. Wie zijn wij\r\n\r\nCoachScribe is een dienst van **JNL Solutions**, gevestigd aan Stationsplein 26, 6512 AB, Nijmegen.\r\n\r\nContact:\r\n- Website: `https://www.coachscribe.nl`\r\n- E-mail: contact@coachscribe.nl\r\n- Telefoon: +31 6 221 68 360\r\n\r\n---\r\n\r\n### 2. Voor wie is CoachScribe bedoeld\r\n\r\nCoachScribe is bedoeld voor personen van **16 jaar en ouder**.\r\n\r\nAls je CoachScribe gebruikt voor gesprekken met andere personen, dan ben jij verantwoordelijk voor het rechtmatig opnemen van die gesprekken en voor het informeren van gesprekspartners.\r\n\r\n---\r\n\r\n### 3. Wat CoachScribe doet\r\n\r\nCoachScribe helpt je om gesprekken vast te leggen en te verwerken. Afhankelijk van wat je gebruikt kan CoachScribe onder andere:\r\n- audio verwerken voor transcriptie;\r\n- transcripties tonen en opslaan;\r\n- samenvattingen genereren;\r\n- notities en geschreven rapporten opslaan;\r\n- een chatfunctie bieden die context kan gebruiken uit transcripties en jouw chatinvoer.\r\n\r\nCoachScribe is een hulpmiddel. Het is niet bedoeld voor medisch advies, diagnose of behandeling.\r\n\r\n---\r\n\r\n### 4. Account en inloggen\r\n\r\nJe logt in via **Microsoft Entra**. Je bent zelf verantwoordelijk voor:\r\n- het veilig houden van je apparaat en account;\r\n- het direct contact opnemen als je denkt dat iemand anders toegang heeft tot je account.\r\n\r\nWij kunnen de toegang beperken of blokkeren als wij misbruik vermoeden of als dit nodig is voor beveiliging.\r\n\r\n---\r\n\r\n### 5. Jouw inhoud en jouw verantwoordelijkheid\r\n\r\nIn CoachScribe kun je inhoud opslaan zoals transcripties, samenvattingen, notities, chatberichten en coachee-gegevens. Jij bepaalt zelf welke inhoud je toevoegt.\r\n\r\nJij belooft dat:\r\n- je geen inhoud toevoegt waarvoor je geen recht of toestemming hebt;\r\n- je geen wetten of rechten van anderen schendt;\r\n- je geen misleidende, schadelijke of onrechtmatige inhoud gebruikt.\r\n\r\nAls je gevoelige informatie verwerkt, zoals gezondheidsinformatie, dan ben jij verantwoordelijk voor het doel en de rechtmatige grondslag om dat te mogen doen.\r\n\r\n---\r\n\r\n### 6. Beveiliging en versleuteling van audio-uploads\r\n\r\nCoachScribe is ontworpen om zorgvuldig met gegevens om te gaan.\r\n\r\nBij transcriptie kan audio als **versleutelde upload** worden verwerkt. Uploadlinks zijn tijdelijk. De tijdelijke versleutelde upload wordt in principe verwijderd nadat de verwerking klaar is.\r\n\r\nJe begrijpt dat geen enkele online dienst 100% veilig kan worden gemaakt. Wij nemen wel passende maatregelen om de dienst te beveiligen.\r\n\r\n---\r\n\r\n### 7. Externe dienstverleners\r\n\r\nOm CoachScribe te laten werken gebruiken wij dienstverleners, bijvoorbeeld voor:\r\n- authenticatie;\r\n- hosting en opslag;\r\n- transcriptie, samenvattingen en chatfunctionaliteit;\r\n- abonnementen en aankopen.\r\n\r\nWelke dienstverleners precies worden ingezet kan afhangen van de configuratie van CoachScribe.\r\n\r\nMeer uitleg over gegevensverwerking vind je in onze privacyverklaring.\r\n\r\n---\r\n\r\n### 8. Abonnementen, betalingen en aankopen\r\n\r\nCoachScribe kan betaalde functies hebben, bijvoorbeeld via een abonnement of extra aankopen.\r\n\r\nBetalingen kunnen verlopen via app stores en via een dienst voor abonnementstatus en aankoopinformatie. Als een app store jouw betaling verwerkt, dan gelden ook de voorwaarden van die app store.\r\n\r\nAls je een abonnement opzegt, dan blijft het abonnement meestal actief tot het einde van de betaalperiode, afhankelijk van de regels van de betaalprovider.\r\n\r\n---\r\n\r\n### 9. Beschikbaarheid en wijzigingen\r\n\r\nWij doen ons best om CoachScribe beschikbaar en stabiel te houden. Soms is er onderhoud of is er een storing.\r\n\r\nWij mogen CoachScribe wijzigen, verbeteren of (gedeeltelijk) stoppen. Als een wijziging grote impact heeft, proberen wij dit op tijd te communiceren.\r\n\r\n---\r\n\r\n### 10. Redelijk gebruik\r\n\r\nOm de dienst veilig en bruikbaar te houden kunnen wij beperkingen toepassen, zoals rate limiting. Je mag de dienst niet gebruiken om:\r\n- systemen te overbelasten of te verstoren;\r\n- beveiligingsmaatregelen te omzeilen;\r\n- ongeautoriseerde toegang te proberen te krijgen.\r\n\r\n---\r\n\r\n### 11. Intellectueel eigendom\r\n\r\nCoachScribe, de software en de vormgeving zijn van JNL Solutions of van onze licentiegevers.\r\n\r\nJij blijft eigenaar van de inhoud die jij invoert of opslaat. Je geeft ons wel toestemming om die inhoud te verwerken, voor zover dat nodig is om CoachScribe aan jou te leveren.\r\n\r\n---\r\n\r\n### 12. Verwijderen van gegevens en account\r\n\r\nJe kunt in CoachScribe gegevens verwijderen. Je kunt ook je account verwijderen. Na het verwijderen van je account worden de bijbehorende gegevens verwijderd, tenzij wij bepaalde gegevens langer moeten bewaren omdat de wet dat verplicht.\r\n\r\n---\r\n\r\n### 13. Aansprakelijkheid\r\n\r\nWij willen CoachScribe zo goed mogelijk leveren, maar wij kunnen niet garanderen dat:\r\n- transcripties of samenvattingen altijd volledig of foutloos zijn;\r\n- de dienst altijd beschikbaar is;\r\n- de dienst altijd geschikt is voor jouw specifieke situatie.\r\n\r\nVoor zover de wet dat toestaat is onze aansprakelijkheid beperkt tot directe schade en tot het bedrag dat je in de laatste 12 maanden voor CoachScribe hebt betaald. Als je niets hebt betaald, dan is onze aansprakelijkheid beperkt tot een redelijk bedrag.\r\n\r\nWij zijn niet aansprakelijk voor indirecte schade, zoals gemiste omzet, gemiste kansen of gevolgschade, voor zover de wet dat toestaat.\r\n\r\n---\r\n\r\n### 14. Beëindiging\r\n\r\nJe mag stoppen met CoachScribe wanneer je wilt.\r\n\r\nWij mogen het gebruik van CoachScribe opschorten of beëindigen als:\r\n- je deze gebruikersovereenkomst schendt;\r\n- dit nodig is om misbruik of schade te voorkomen;\r\n- wij de dienst beëindigen.\r\n\r\n---\r\n\r\n### 15. Klachten en contact\r\n\r\nHeb je een vraag of klacht, mail dan naar contact@coachscribe.nl. Wij proberen altijd samen tot een oplossing te komen.\r\n\r\n---\r\n\r\n### 16. Toepasselijk recht\r\n\r\nOp deze gebruikersovereenkomst is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter in Nederland.\r\n\r\n---\r\n\r\n### 17. Wijzigingen van deze gebruikersovereenkomst\r\n\r\nWij kunnen deze gebruikersovereenkomst aanpassen. De meest actuele versie is beschikbaar via onze website.\r\n\r\n",
    verwerkersovereenkomst: `### VERWERKERSOVEREENKOMST COACHSCRIBE

Deze verwerkersovereenkomst ("Overeenkomst") maakt integraal onderdeel uit van de overeenkomst inzake het gebruik van CoachScribe tussen Partijen.

Partijen leggen hierin vast op welke wijze persoonsgegevens worden verwerkt en beveiligd overeenkomstig artikel 28 van de Algemene verordening gegevensbescherming (AVG).

### 1. Partijen

#### 1.1 Verwerkingsverantwoordelijke

Naam organisatie: [NAAM KLANT]  
Adres: [ADRES KLANT]  
Postcode en plaats: [POSTCODE EN PLAATS KLANT]  
Land: [LAND KLANT]  
Contactpersoon: [NAAM CONTACTPERSOON]  
E-mail: [E-MAIL]

Hierna: "Verwerkingsverantwoordelijke".

#### 1.2 Verwerker

Naam: JNL Solutions  
Handelend onder de naam: CoachScribe  
Adres: Stationsplein 26  
6512 AB Nijmegen  
Nederland  
E-mail: contact@coachscribe.nl

Website: https://www.coachscribe.nl

Hierna: "Verwerker".

Verwerkingsverantwoordelijke en Verwerker worden gezamenlijk aangeduid als "Partijen".

### 2. Definities

Begrippen als "persoonsgegevens", "verwerken", "betrokkene", "verwerkingsverantwoordelijke" en "verwerker" hebben de betekenis zoals daaraan gegeven in de AVG.

Waar in deze Overeenkomst begrippen niet nader zijn gedefinieerd, geldt de betekenis zoals opgenomen in de AVG.

### 3. Onderwerp en duur

#### 3.1 Onderwerp

Verwerker verwerkt persoonsgegevens ten behoeve van Verwerkingsverantwoordelijke in het kader van het leveren van CoachScribe, zoals nader omschreven in Bijlage 1.

#### 3.2 Duur

Deze Overeenkomst treedt in werking op [INGANGSDATUM] en geldt zolang Verwerker persoonsgegevens verwerkt in het kader van CoachScribe.

### 4. Aard en doel van de verwerking

Verwerker verwerkt persoonsgegevens uitsluitend:

- ten behoeve van het leveren van CoachScribe;
- overeenkomstig deze Overeenkomst;
- op basis van gedocumenteerde instructies van Verwerkingsverantwoordelijke.

Indien Verwerker op grond van een wettelijke verplichting persoonsgegevens anders moet verwerken, stelt Verwerker Verwerkingsverantwoordelijke daarvan vooraf in kennis, tenzij dit wettelijk verboden is.

### 5. Vertrouwelijkheid

Verwerker waarborgt dat personen die onder zijn verantwoordelijkheid handelen en toegang hebben tot persoonsgegevens:

- gehouden zijn tot geheimhouding;
- uitsluitend toegang hebben voor zover noodzakelijk voor de uitvoering van hun werkzaamheden.

### 6. Beveiliging

#### 6.1 Passende maatregelen

Verwerker treft passende technische en organisatorische maatregelen overeenkomstig artikel 32 AVG, rekening houdend met:

- de stand van de techniek;
- de uitvoeringskosten;
- de aard, omvang, context en doeleinden van de verwerking;
- de risico's voor betrokkenen.

De maatregelen zijn nader beschreven in Bijlage 2.

#### 6.2 Logging van inhoud

Verwerker hanteert als uitgangspunt dat inhoudelijke gegevens (zoals transcripties, audio, encryptiesleutels en toegangstokens) niet in logbestanden worden opgenomen, tenzij dit noodzakelijk is voor het analyseren en oplossen van een concreet beveiligingsincident.

### 7. Subverwerkers

#### 7.1 Algemene toestemming

Verwerkingsverantwoordelijke verleent algemene schriftelijke toestemming voor het inschakelen van subverwerkers zoals opgenomen in Bijlage 3.

#### 7.2 Wijzigingen

Verwerker informeert Verwerkingsverantwoordelijke vooraf over voorgenomen materiële wijzigingen in subverwerkers. Verwerkingsverantwoordelijke kan op redelijke gronden bezwaar maken.

#### 7.3 Contractuele waarborgen

Verwerker sluit met subverwerkers een overeenkomst die minimaal hetzelfde niveau van gegevensbescherming waarborgt als deze Overeenkomst.

Verwerker blijft jegens Verwerkingsverantwoordelijke volledig verantwoordelijk voor het handelen van subverwerkers.

### 8. Doorgifte buiten de EER

Voor zover persoonsgegevens buiten de Europese Economische Ruimte worden verwerkt, zorgt Verwerker voor passende waarborgen overeenkomstig hoofdstuk V AVG, zoals het toepassen van standaardcontractbepalingen indien vereist.

### 9. Rechten van betrokkenen

Indien Verwerker een verzoek van een betrokkene ontvangt, verwijst Verwerker de betrokkene naar Verwerkingsverantwoordelijke, tenzij Verwerker wettelijk verplicht is zelf te reageren.

Verwerker verleent, voor zover redelijk en technisch mogelijk, ondersteuning bij:

- verwijdering van gegevens;
- export van gegevens;
- uitvoering van andere AVG-verplichtingen van Verwerkingsverantwoordelijke.

### 10. Meldplicht datalekken

Verwerker stelt Verwerkingsverantwoordelijke zonder onredelijke vertraging in kennis van een inbreuk in verband met persoonsgegevens.

Voor zover beschikbaar verstrekt Verwerker informatie over:

- de aard van de inbreuk;
- de betrokken categorieen gegevens;
- de reeds genomen of voorgestelde maatregelen;
- de vermoedelijke gevolgen.

### 11. Verwijdering en teruggave

Na beëindiging van de dienstverlening:

- verwerkt Verwerker geen persoonsgegevens meer, tenzij wettelijk verplicht;
- verwijdert of anonimiseert Verwerker persoonsgegevens binnen een redelijke termijn.

Gedurende de dienstverlening kan Verwerkingsverantwoordelijke zelfstandig gegevens verwijderen via de functionaliteiten van CoachScribe.

### 12. Audit

Verwerkingsverantwoordelijke heeft het recht om naleving van deze Overeenkomst te controleren.

Partijen maken vooraf redelijke afspraken over:

- scope;
- planning;
- vertrouwelijkheid;
- kosten.

Een audit mag de dienstverlening niet onevenredig verstoren.

### 13. Aansprakelijkheid

De aansprakelijkheid van Partijen wordt beheerst door de hoofd overeenkomst tussen Partijen.

Bij gebreke daarvan is de aansprakelijkheid van Verwerker beperkt tot directe schade en tot maximaal het bedrag dat Verwerkingsverantwoordelijke in de twaalf maanden voorafgaand aan het schadeveroorzakende feit aan Verwerker heeft betaald, tenzij sprake is van opzet of bewuste roekeloosheid.

### 14. Toepasselijk recht

Op deze Overeenkomst is Nederlands recht van toepassing.  
Geschillen worden voorgelegd aan de bevoegde rechter in Nederland.

### 15. Ondertekening

Plaats: [PLAATS]  
Datum: [DATUM]

Voor Verwerkingsverantwoordelijke  
Naam:  
Functie:  
Handtekening:

Voor Verwerker (JNL Solutions)  
Naam:  
Functie:  
Handtekening:

### BIJLAGE 1 - Omschrijving van de verwerking

#### A. Doeleinden

Verwerker verwerkt persoonsgegevens voor:

- accountbeheer en authenticatie (Microsoft Entra);
- opslag en beheer van door Verwerkingsverantwoordelijke ingevoerde gegevens;
- optionele transcriptie van audio;
- genereren van samenvattingen en chatreacties;
- beveiliging, stabiliteit en foutopsporing;
- abonnementsbeheer.

#### B. Soorten persoonsgegevens

Afhankelijk van het gebruik kunnen onder meer worden verwerkt:

- accountgegevens (gebruikers-id, e-mailadres, weergavenaam);
- coachee-gegevens (bijvoorbeeld naam);
- sessiegegevens (titels, tijdstempels, metadata);
- transcripties, samenvattingen, notities en rapporten;
- chatberichten;
- technische gegevens (IP-adres, loggegevens);
- abonnements- en aankoopinformatie.

#### C. Categorieen betrokkenen

- Gebruikers van CoachScribe;
- Personen over wie gegevens worden vastgelegd;
- Contactpersonen die contact opnemen met support.

#### D. Bijzondere persoonsgegevens

Afhankelijk van de inhoud van opgenomen of ingevoerde gegevens kan de verwerking bijzondere categorieen van persoonsgegevens omvatten, waaronder gezondheidsgegevens.

Verwerkingsverantwoordelijke bepaalt welke gegevens worden ingevoerd en is verantwoordelijk voor de rechtmatigheid van die verwerking.

#### E. Aard van de verwerking

De verwerking vindt doorlopend plaats zolang CoachScribe wordt gebruikt.

Audio voor transcriptie wordt versleuteld verzonden, tijdelijk verwerkt en na verwerking verwijderd, tenzij opslag door Verwerkingsverantwoordelijke wordt voortgezet binnen CoachScribe.

### BIJLAGE 2 - Beveiligingsmaatregelen

Verwerker treft onder meer de volgende maatregelen:

- versleutelde verbindingen (HTTPS/TLS);
- verwerking binnen Europese cloudregio's;
- versleutelde opslag van gegevens;
- aanvullende versleutelingslaag waarbij encryptiesleutels buiten de opslagomgeving worden beheerd;
- toegangsbeperking op basis van minimale rechten;
- private opslag voor uploads;
- tijdelijke uploadrechten voor audio;
- verwijdering van tijdelijke uploads na verwerking;
- maatregelen tegen misbruik (zoals rate limiting);
- beleid om inhoudelijke gegevens niet in logs op te nemen.

### BIJLAGE 3 - Subverwerkers

Deze lijst kan wijzigen. Verwerker informeert Verwerkingsverantwoordelijke over materiële wijzigingen.

#### A. Authenticatie en infrastructuur

Microsoft (Microsoft Entra voor authenticatie; Azure voor hosting, opslag en database).

#### B. Tijdelijke audio-opslag

Azure Blob Storage (versleutelde uploads).

#### C. Transcriptie, samenvatting en chat (optioneel)

AI-dienstverleners afhankelijk van configuratie, waaronder:

- Azure Speech
- Azure OpenAI

#### D. Abonnementen

RevenueCat (beheer van abonnementsstatus en aankoopinformatie).`
};
}),
"[project]/Coachscribe/website/lib/legalDocuments.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getLegalDocumentContent",
    ()=>getLegalDocumentContent
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$documentation$2f$legal$2f$legalContent$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/documentation/legal/legalContent.ts [app-rsc] (ecmascript)");
;
async function getLegalDocumentContent(slug) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$documentation$2f$legal$2f$legalContent$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["legalContent"][slug];
}
}),
"[project]/Coachscribe/website/app/(site)/verwerkersovereenkomst/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>VerwerkersovereenkomstPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$components$2f$legal$2f$LegalDocumentPage$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/components/legal/LegalDocumentPage.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$lib$2f$legalDocuments$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/lib/legalDocuments.ts [app-rsc] (ecmascript)");
;
;
;
async function VerwerkersovereenkomstPage() {
    const markdown = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$lib$2f$legalDocuments$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getLegalDocumentContent"])("verwerkersovereenkomst");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$components$2f$legal$2f$LegalDocumentPage$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
        title: "Verwerkersovereenkomst",
        subtitle: "Afspraken over gegevensverwerking tussen verwerkingsverantwoordelijke en verwerker.",
        markdown: markdown
    }, void 0, false, {
        fileName: "[project]/Coachscribe/website/app/(site)/verwerkersovereenkomst/page.tsx",
        lineNumber: 8,
        columnNumber: 5
    }, this);
}
}),
"[project]/Coachscribe/website/app/(site)/verwerkersovereenkomst/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/Coachscribe/website/app/(site)/verwerkersovereenkomst/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__31079943._.js.map