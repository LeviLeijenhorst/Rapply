module.exports = [
"[project]/app/favicon.ico.mjs { IMAGE => \"[project]/app/favicon.ico (static in ecmascript, tag client)\" } [app-rsc] (structured image object, ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/favicon.ico.mjs { IMAGE => \"[project]/app/favicon.ico (static in ecmascript, tag client)\" } [app-rsc] (structured image object, ecmascript)"));
}),
"[project]/app/icon.png.mjs { IMAGE => \"[project]/app/icon.png (static in ecmascript, tag client)\" } [app-rsc] (structured image object, ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/icon.png.mjs { IMAGE => \"[project]/app/icon.png (static in ecmascript, tag client)\" } [app-rsc] (structured image object, ecmascript)"));
}),
"[project]/app/icon.svg.mjs { IMAGE => \"[project]/app/icon.svg (static in ecmascript, tag client)\" } [app-rsc] (structured image object, ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/icon.svg.mjs { IMAGE => \"[project]/app/icon.svg (static in ecmascript, tag client)\" } [app-rsc] (structured image object, ecmascript)"));
}),
"[project]/app/apple-icon.png.mjs { IMAGE => \"[project]/app/apple-icon.png (static in ecmascript, tag client)\" } [app-rsc] (structured image object, ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/apple-icon.png.mjs { IMAGE => \"[project]/app/apple-icon.png (static in ecmascript, tag client)\" } [app-rsc] (structured image object, ecmascript)"));
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/app/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/layout.tsx [app-rsc] (ecmascript)"));
}),
"[project]/app/not-found.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/not-found.tsx [app-rsc] (ecmascript)"));
}),
"[project]/app/(site)/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/(site)/layout.tsx [app-rsc] (ecmascript)"));
}),
"[project]/components/legal/LegalDocumentPage.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LegalDocumentPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
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
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                children: segment.slice(2, -2)
            }, key, false, {
                fileName: "[project]/components/legal/LegalDocumentPage.tsx",
                lineNumber: 200,
                columnNumber: 14
            }, this);
        }
        if (segment.startsWith("`") && segment.endsWith("`")) {
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                className: "rounded bg-[#EEF0FF] px-1.5 py-0.5 text-[0.95em] text-[#243747]",
                children: segment.slice(1, -1)
            }, key, false, {
                fileName: "[project]/components/legal/LegalDocumentPage.tsx",
                lineNumber: 204,
                columnNumber: 9
            }, this);
        }
        const lineSegments = segment.split("\n");
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            children: lineSegments.map((lineSegment, lineIndex)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    children: [
                        lineSegment,
                        lineIndex < lineSegments.length - 1 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                            fileName: "[project]/components/legal/LegalDocumentPage.tsx",
                            lineNumber: 218,
                            columnNumber: 52
                        }, this) : null
                    ]
                }, `${key}-line-${lineIndex}`, true, {
                    fileName: "[project]/components/legal/LegalDocumentPage.tsx",
                    lineNumber: 216,
                    columnNumber: 11
                }, this))
        }, key, false, {
            fileName: "[project]/components/legal/LegalDocumentPage.tsx",
            lineNumber: 214,
            columnNumber: 7
        }, this);
    });
}
function LegalDocumentPage({ title, subtitle, markdown }) {
    const blocks = parseMarkdown(markdown);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "w-full bg-white",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mx-auto w-full max-w-6xl px-6 pb-12 pt-6 md:px-10 md:pb-16 md:pt-10",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mx-auto flex w-full max-w-4xl flex-col gap-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-3xl font-semibold text-[#1D0A00] md:text-4xl xl:text-5xl",
                                children: title
                            }, void 0, false, {
                                fileName: "[project]/components/legal/LegalDocumentPage.tsx",
                                lineNumber: 238,
                                columnNumber: 11
                            }, this),
                            subtitle ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-base font-normal text-black/70 md:text-lg",
                                children: subtitle
                            }, void 0, false, {
                                fileName: "[project]/components/legal/LegalDocumentPage.tsx",
                                lineNumber: 242,
                                columnNumber: 13
                            }, this) : null
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/legal/LegalDocumentPage.tsx",
                        lineNumber: 237,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: "rounded-2xl border border-black/10 bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.06)] md:p-8",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col gap-5 text-base font-normal leading-relaxed text-[#1D0A00]",
                            children: blocks.map((block)=>{
                                if (block.type === "divider") {
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("hr", {
                                        className: "border-black/10"
                                    }, block.id, false, {
                                        fileName: "[project]/components/legal/LegalDocumentPage.tsx",
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
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            id: block.id,
                                            className: classNameByLevel[block.level],
                                            children: renderInline(block.text, block.id)
                                        }, block.id, false, {
                                            fileName: "[project]/components/legal/LegalDocumentPage.tsx",
                                            lineNumber: 266,
                                            columnNumber: 21
                                        }, this);
                                    }
                                    if (headingLevel === 3) {
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            id: block.id,
                                            className: classNameByLevel[block.level],
                                            children: renderInline(block.text, block.id)
                                        }, block.id, false, {
                                            fileName: "[project]/components/legal/LegalDocumentPage.tsx",
                                            lineNumber: 273,
                                            columnNumber: 21
                                        }, this);
                                    }
                                    if (headingLevel === 4) {
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                            id: block.id,
                                            className: classNameByLevel[block.level],
                                            children: renderInline(block.text, block.id)
                                        }, block.id, false, {
                                            fileName: "[project]/components/legal/LegalDocumentPage.tsx",
                                            lineNumber: 280,
                                            columnNumber: 21
                                        }, this);
                                    }
                                    if (headingLevel === 5) {
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h5", {
                                            id: block.id,
                                            className: classNameByLevel[block.level],
                                            children: renderInline(block.text, block.id)
                                        }, block.id, false, {
                                            fileName: "[project]/components/legal/LegalDocumentPage.tsx",
                                            lineNumber: 287,
                                            columnNumber: 21
                                        }, this);
                                    }
                                    if (headingLevel === 6) {
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h6", {
                                            id: block.id,
                                            className: classNameByLevel[block.level],
                                            children: renderInline(block.text, block.id)
                                        }, block.id, false, {
                                            fileName: "[project]/components/legal/LegalDocumentPage.tsx",
                                            lineNumber: 294,
                                            columnNumber: 21
                                        }, this);
                                    }
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        id: block.id,
                                        className: classNameByLevel[block.level],
                                        children: renderInline(block.text, block.id)
                                    }, block.id, false, {
                                        fileName: "[project]/components/legal/LegalDocumentPage.tsx",
                                        lineNumber: 300,
                                        columnNumber: 19
                                    }, this);
                                }
                                if (block.type === "list") {
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                        className: "list-disc pl-6",
                                        children: block.items.map((item, itemIndex)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: renderInline(item, `${block.id}-${itemIndex}`)
                                            }, `${block.id}-${itemIndex}`, false, {
                                                fileName: "[project]/components/legal/LegalDocumentPage.tsx",
                                                lineNumber: 310,
                                                columnNumber: 23
                                            }, this))
                                    }, block.id, false, {
                                        fileName: "[project]/components/legal/LegalDocumentPage.tsx",
                                        lineNumber: 308,
                                        columnNumber: 19
                                    }, this);
                                }
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    children: renderInline(block.text, block.id)
                                }, block.id, false, {
                                    fileName: "[project]/components/legal/LegalDocumentPage.tsx",
                                    lineNumber: 319,
                                    columnNumber: 17
                                }, this);
                            })
                        }, void 0, false, {
                            fileName: "[project]/components/legal/LegalDocumentPage.tsx",
                            lineNumber: 248,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/legal/LegalDocumentPage.tsx",
                        lineNumber: 247,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/legal/LegalDocumentPage.tsx",
                lineNumber: 236,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/components/legal/LegalDocumentPage.tsx",
            lineNumber: 235,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/legal/LegalDocumentPage.tsx",
        lineNumber: 234,
        columnNumber: 5
    }, this);
}
}),
"[project]/documentation/legal/legalContent.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "legalContent",
    ()=>legalContent
]);
const legalContent = {
    privacybeleid: `## Privacyverklaring Rapply

Deze privacyverklaring legt uit welke persoonsgegevens JNL Solutions verwerkt wanneer je Rapply gebruikt, waarom dat gebeurt, met wie gegevens worden gedeeld en welke rechten je hebt.

JNL Solutions, gevestigd aan Stationsplein 26, 6512 AB, Nijmegen, is verantwoordelijk voor de verwerking van persoonsgegevens zoals beschreven in deze privacyverklaring.

## Contactgegevens

- Website: https://www.Rapply.nl
- Adres: Stationsplein 26, 6512 AB, Nijmegen
- Telefoon: +31 6 221 68 360
- E-mail: contact@Rapply.nl

## Rollen en verantwoordelijkheid

- Jij als coach bent verwerkingsverantwoordelijke voor de inhoud die je in Rapply verwerkt.
- Rapply (JNL Solutions) is verwerker en verwerkt gegevens alleen in jouw opdracht om de dienst te leveren.
- Jij blijft verantwoordelijk voor het rechtmatig vastleggen van gesprekken en het hebben van een geldige rechtsgrond.

## Hoe data door Rapply stroomt

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

- Namen van cliÃ«nten
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

Rapply kan worden gebruikt in situaties waarin gevoelige onderwerpen worden besproken. Daardoor kan de inhoud bijzondere persoonsgegevens bevatten, zoals gegevens over de gezondheid van een cliÃ«nt.

Voordat je audio opneemt of uploadt, moet je bevestigen dat je expliciete toestemming hebt van je cliÃ«nt.

Onder expliciete toestemming verstaan wij een vrij gegeven, specifieke, geinformeerde en ondubbelzinnige wilsuiting conform de AVG.

Op https://www.Rapply.nl/toestemming-vragen leggen wij uit hoe je toestemming kunt vragen.

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

- AI-verwerking gebeurt binnen enterprise-omgevingen die wij voor Rapply hebben ingericht.
- Gegevens uit Rapply worden niet door ons verkocht.
- Gegevens uit Rapply worden niet door ons gebruikt om publieke AI-modellen te trainen.
- Verwerking van inhoud gebeurt uitsluitend voor de door jou gevraagde functionaliteit.

## Verwerking binnen de EU en doorgifte

- PatiÃ«nt- en sessie-inhoud (zoals audio, transcripties, samenvattingen en notities) wordt verwerkt en opgeslagen binnen door ons gebruikte Azure-regio's in de EU.
- Onze huidige primaire regio's zijn West Europe, Belgium Central en Sweden Central.
- Voor bepaalde account-, authenticatie- of abonnementsfunctionaliteit gebruiken wij externe partijen. Daardoor kan beperkte metadata buiten de EU worden verwerkt, afhankelijk van die partij.
- Waar nodig treffen wij passende contractuele en organisatorische waarborgen.

## Delen met derden en subverwerkers

Wij delen persoonsgegevens alleen met partijen die nodig zijn om Rapply te laten functioneren.

Belangrijke categorieÃ«n:

- Cloud hosting en opslag (EU)
- AI-verwerking binnen onze enterprise-inrichting
- Authenticatie (Microsoft Entra)
- Abonnementsbeheer en aankoopstatus (Mollie)

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

Bij vermoedens van een beveiligingsincident kun je contact opnemen via contact@Rapply.nl.

## Geautomatiseerde besluitvorming

Rapply gebruikt geen geautomatiseerde besluitvorming of profilering die rechtsgevolgen heeft of je significant treft.

## Cookies

Rapply gebruikt geen tracking-, marketing- of analytics-cookies. Eventuele cookies zijn uitsluitend functioneel en technisch noodzakelijk.

## Jouw rechten

Je hebt onder de AVG het recht om:

- Je persoonsgegevens in te zien
- Je persoonsgegevens te laten corrigeren
- Je persoonsgegevens te laten verwijderen
- De verwerking te laten beperken
- Bezwaar te maken tegen bepaalde verwerkingen

Je kunt een verzoek sturen naar contact@Rapply.nl. Wij reageren binnen een maand.

Je hebt ook het recht om een klacht in te dienen bij de Autoriteit Persoonsgegevens via www.autoriteitpersoonsgegevens.nl.

## Leeftijdsgrens

Rapply is niet bedoeld voor personen jonger dan 16 jaar. Wij verzamelen niet bewust persoonsgegevens van personen jonger dan 16 jaar.

## Wijzigingen

Wij kunnen deze privacyverklaring wijzigen. De meest actuele versie is beschikbaar via onze website.`,
    gebruikersovereenkomst: "### Gebruikersovereenkomst Rapply\r\n\r\nDeze gebruikersovereenkomst beschrijft de afspraken tussen jou en JNL Solutions over het gebruik van Rapply.\r\n\r\nDoor Rapply te gebruiken ga je akkoord met deze gebruikersovereenkomst.\r\n\r\n---\r\n\r\n### 1. Wie zijn wij\r\n\r\nRapply is een dienst van **JNL Solutions**, gevestigd aan Stationsplein 26, 6512 AB, Nijmegen.\r\n\r\nContact:\r\n- Website: `https://www.Rapply.nl`\r\n- E-mail: contact@Rapply.nl\r\n- Telefoon: +31 6 221 68 360\r\n\r\n---\r\n\r\n### 2. Voor wie is Rapply bedoeld\r\n\r\nRapply is bedoeld voor personen van **16 jaar en ouder**.\r\n\r\nAls je Rapply gebruikt voor gesprekken met andere personen, dan ben jij verantwoordelijk voor het rechtmatig opnemen van die gesprekken en voor het informeren van gesprekspartners.\r\n\r\n---\r\n\r\n### 3. Wat Rapply doet\r\n\r\nRapply helpt je om gesprekken vast te leggen en te verwerken. Afhankelijk van wat je gebruikt kan Rapply onder andere:\r\n- audio verwerken voor transcriptie;\r\n- transcripties tonen en opslaan;\r\n- samenvattingen genereren;\r\n- notities en geschreven rapporten opslaan;\r\n- een chatfunctie bieden die context kan gebruiken uit transcripties en jouw chatinvoer.\r\n\r\nRapply is een hulpmiddel. Het is niet bedoeld voor medisch advies, diagnose of behandeling.\r\n\r\n---\r\n\r\n### 4. Account en inloggen\r\n\r\nJe logt in via **Microsoft Entra**. Je bent zelf verantwoordelijk voor:\r\n- het veilig houden van je apparaat en account;\r\n- het direct contact opnemen als je denkt dat iemand anders toegang heeft tot je account.\r\n\r\nWij kunnen de toegang beperken of blokkeren als wij misbruik vermoeden of als dit nodig is voor beveiliging.\r\n\r\n---\r\n\r\n### 5. Jouw inhoud en jouw verantwoordelijkheid\r\n\r\nIn Rapply kun je inhoud opslaan zoals transcripties, samenvattingen, notities, chatberichten en cliëntgegevens. Jij bepaalt zelf welke inhoud je toevoegt.\r\n\r\nJij belooft dat:\r\n- je geen inhoud toevoegt waarvoor je geen recht of toestemming hebt;\r\n- je geen wetten of rechten van anderen schendt;\r\n- je geen misleidende, schadelijke of onrechtmatige inhoud gebruikt.\r\n\r\nAls je gevoelige informatie verwerkt, zoals gezondheidsinformatie, dan ben jij verantwoordelijk voor het doel en de rechtmatige grondslag om dat te mogen doen.\r\n\r\n---\r\n\r\n### 6. Beveiliging en versleuteling van audio-uploads\r\n\r\nRapply is ontworpen om zorgvuldig met gegevens om te gaan.\r\n\r\nBij transcriptie kan audio als **versleutelde upload** worden verwerkt. Uploadlinks zijn tijdelijk. De tijdelijke versleutelde upload wordt in principe verwijderd nadat de verwerking klaar is.\r\n\r\nJe begrijpt dat geen enkele online dienst 100% veilig kan worden gemaakt. Wij nemen wel passende maatregelen om de dienst te beveiligen.\r\n\r\n---\r\n\r\n### 7. Externe dienstverleners\r\n\r\nOm Rapply te laten werken gebruiken wij dienstverleners, bijvoorbeeld voor:\r\n- authenticatie;\r\n- hosting en opslag;\r\n- transcriptie, samenvattingen en chatfunctionaliteit;\r\n- abonnementen en aankopen.\r\n\r\nWelke dienstverleners precies worden ingezet kan afhangen van de configuratie van Rapply.\r\n\r\nMeer uitleg over gegevensverwerking vind je in onze privacyverklaring.\r\n\r\n---\r\n\r\n### 8. Abonnementen, betalingen en aankopen\r\n\r\nRapply kan betaalde functies hebben, bijvoorbeeld via een abonnement of extra aankopen.\r\n\r\nBetalingen kunnen verlopen via app stores en via een dienst voor abonnementstatus en aankoopinformatie. Als een app store jouw betaling verwerkt, dan gelden ook de voorwaarden van die app store.\r\n\r\nAls je een abonnement opzegt, dan blijft het abonnement meestal actief tot het einde van de betaalperiode, afhankelijk van de regels van de betaalprovider.\r\n\r\n---\r\n\r\n### 9. Beschikbaarheid en wijzigingen\r\n\r\nWij doen ons best om Rapply beschikbaar en stabiel te houden. Soms is er onderhoud of is er een storing.\r\n\r\nWij mogen Rapply wijzigen, verbeteren of (gedeeltelijk) stoppen. Als een wijziging grote impact heeft, proberen wij dit op tijd te communiceren.\r\n\r\n---\r\n\r\n### 10. Redelijk gebruik\r\n\r\nOm de dienst veilig en bruikbaar te houden kunnen wij beperkingen toepassen, zoals rate limiting. Je mag de dienst niet gebruiken om:\r\n- systemen te overbelasten of te verstoren;\r\n- beveiligingsmaatregelen te omzeilen;\r\n- ongeautoriseerde toegang te proberen te krijgen.\r\n\r\n---\r\n\r\n### 11. Intellectueel eigendom\r\n\r\nRapply, de software en de vormgeving zijn van JNL Solutions of van onze licentiegevers.\r\n\r\nJij blijft eigenaar van de inhoud die jij invoert of opslaat. Je geeft ons wel toestemming om die inhoud te verwerken, voor zover dat nodig is om Rapply aan jou te leveren.\r\n\r\n---\r\n\r\n### 12. Verwijderen van gegevens en account\r\n\r\nJe kunt in Rapply gegevens verwijderen. Je kunt ook je account verwijderen. Na het verwijderen van je account worden de bijbehorende gegevens verwijderd, tenzij wij bepaalde gegevens langer moeten bewaren omdat de wet dat verplicht.\r\n\r\n---\r\n\r\n### 13. Aansprakelijkheid\r\n\r\nWij willen Rapply zo goed mogelijk leveren, maar wij kunnen niet garanderen dat:\r\n- transcripties of samenvattingen altijd volledig of foutloos zijn;\r\n- de dienst altijd beschikbaar is;\r\n- de dienst altijd geschikt is voor jouw specifieke situatie.\r\n\r\nVoor zover de wet dat toestaat is onze aansprakelijkheid beperkt tot directe schade en tot het bedrag dat je in de laatste 12 maanden voor Rapply hebt betaald. Als je niets hebt betaald, dan is onze aansprakelijkheid beperkt tot een redelijk bedrag.\r\n\r\nWij zijn niet aansprakelijk voor indirecte schade, zoals gemiste omzet, gemiste kansen of gevolgschade, voor zover de wet dat toestaat.\r\n\r\n---\r\n\r\n### 14. BeÃ«indiging\r\n\r\nJe mag stoppen met Rapply wanneer je wilt.\r\n\r\nWij mogen het gebruik van Rapply opschorten of beÃ«indigen als:\r\n- je deze gebruikersovereenkomst schendt;\r\n- dit nodig is om misbruik of schade te voorkomen;\r\n- wij de dienst beÃ«indigen.\r\n\r\n---\r\n\r\n### 15. Klachten en contact\r\n\r\nHeb je een vraag of klacht, mail dan naar contact@Rapply.nl. Wij proberen altijd samen tot een oplossing te komen.\r\n\r\n---\r\n\r\n### 16. Toepasselijk recht\r\n\r\nOp deze gebruikersovereenkomst is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter in Nederland.\r\n\r\n---\r\n\r\n### 17. Wijzigingen van deze gebruikersovereenkomst\r\n\r\nWij kunnen deze gebruikersovereenkomst aanpassen. De meest actuele versie is beschikbaar via onze website.\r\n\r\n",
    verwerkersovereenkomst: "### Verwerkersovereenkomst Rapply\r\n\r\nDeze verwerkersovereenkomst hoort bij het gebruik van Rapply. In dit document spreken partijen af hoe persoonsgegevens worden verwerkt en beveiligd wanneer Rapply wordt gebruikt.\r\n\r\n**Let op**: dit is een template. Vul de invulvelden in en laat dit document zo nodig juridisch controleren voor jouw situatie.\r\n\r\n---\r\n\r\n### 1. Partijen\r\n\r\n#### 1.1 Verwerkingsverantwoordelijke\r\n\r\nNaam organisatie: **[NAAM KLANT]**  \r\nAdres: **[ADRES KLANT]**  \r\nPostcode en plaats: **[POSTCODE EN PLAATS KLANT]**  \r\nLand: **[LAND KLANT]**  \r\nContactpersoon: **[NAAM CONTACTPERSOON KLANT]**  \r\nE-mail: **[E-MAIL KLANT]**  \r\n\r\nHierna: **Verwerkingsverantwoordelijke**.\r\n\r\n#### 1.2 Verwerker\r\n\r\nNaam: **JNL Solutions**  \r\nAdres: Stationsplein 26  \r\nPostcode en plaats: 6512 AB, Nijmegen  \r\nLand: Nederland  \r\nE-mail: contact@Rapply.nl  \r\nTelefoon: +31 6 221 68 360  \r\nWebsite: `https://www.Rapply.nl`  \r\n\r\nHierna: **Verwerker**.\r\n\r\nVerwerkingsverantwoordelijke en Verwerker worden hieronder ook samen â€œpartijenâ€ genoemd.\r\n\r\n---\r\n\r\n### 2. Uitleg van begrippen\r\n\r\n- Met â€œpersoonsgegevensâ€ bedoelen partijen alle informatie die gaat over een geÃ¯dentificeerde of identificeerbare persoon.\r\n- Met â€œverwerkenâ€ bedoelen partijen alles wat je met persoonsgegevens kunt doen, zoals opslaan, bekijken, gebruiken, versturen en verwijderen.\r\n- Met â€œAlgemene verordening gegevensbescherming (AVG)â€ bedoelen partijen de Europese privacywet.\r\n\r\nAls woorden in deze overeenkomst niet duidelijk zijn, dan geldt de betekenis die de AVG daaraan geeft.\r\n\r\n---\r\n\r\n### 3. Onderwerp en duur\r\n\r\n#### 3.1 Onderwerp\r\n\r\nVerwerker verwerkt persoonsgegevens voor Verwerkingsverantwoordelijke bij het leveren van Rapply, zoals beschreven in **Bijlage 1 (Omschrijving van de verwerking)**.\r\n\r\n#### 3.2 Duur\r\n\r\nDeze verwerkersovereenkomst geldt vanaf **[INGANGSDATUM]** en loopt zolang Verwerker persoonsgegevens verwerkt voor Verwerkingsverantwoordelijke in het kader van Rapply.\r\n\r\n---\r\n\r\n### 4. Instructies en doelbinding\r\n\r\n#### 4.1 Verwerking uitsluitend op instructie\r\n\r\nVerwerker verwerkt persoonsgegevens uitsluitend:\r\n- om Rapply te leveren zoals afgesproken met Verwerkingsverantwoordelijke; en\r\n- op basis van schriftelijke of aantoonbare instructies van Verwerkingsverantwoordelijke.\r\n\r\n#### 4.2 Wettelijke plichten\r\n\r\nAls Verwerker volgens een wet persoonsgegevens moet verwerken op een manier die afwijkt van instructies van Verwerkingsverantwoordelijke, dan meldt Verwerker dat vooraf, tenzij de wet dit verbiedt.\r\n\r\n---\r\n\r\n### 5. Vertrouwelijkheid\r\n\r\nVerwerker zorgt ervoor dat personen die onder zijn verantwoordelijkheid werken en toegang hebben tot persoonsgegevens:\r\n- gebonden zijn aan geheimhouding; en\r\n- alleen toegang hebben voor zover dat nodig is voor hun werk.\r\n\r\n---\r\n\r\n### 6. Beveiliging\r\n\r\n#### 6.1 Passende maatregelen\r\n\r\nVerwerker neemt passende technische en organisatorische maatregelen om persoonsgegevens te beveiligen. De belangrijkste maatregelen staan in **Bijlage 2 (Beveiligingsmaatregelen)**.\r\n\r\n#### 6.2 Geen logging van inhoud\r\n\r\nVerwerker probeert te voorkomen dat gevoelige inhoud zoals transcripties, audio, encryptiesleutels en toegangstokens in logs terechtkomt, behalve als dit strikt nodig is om een concreet incident op te lossen.\r\n\r\n---\r\n\r\n### 7. Inschakeling van subverwerkers\r\n\r\n#### 7.1 Toestemming en lijst\r\n\r\nVerwerkingsverantwoordelijke geeft algemene toestemming voor het inschakelen van subverwerkers die nodig zijn voor Rapply. De huidige subverwerkers staan in **Bijlage 3 (Subverwerkers)**.\r\n\r\n#### 7.2 Wijzigingen\r\n\r\nVerwerker mag subverwerkers wijzigen of toevoegen. Verwerker informeert Verwerkingsverantwoordelijke vooraf over materiÃ«le wijzigingen via een redelijke kennisgeving, zodat Verwerkingsverantwoordelijke bezwaar kan maken als daar een goede reden voor is.\r\n\r\n#### 7.3 Afspraken met subverwerkers\r\n\r\nVerwerker sluit met subverwerkers afspraken die minstens hetzelfde beschermingsniveau geven als deze verwerkersovereenkomst.\r\n\r\n---\r\n\r\n### 8. Doorgifte buiten de Europese Economische Ruimte\r\n\r\nAls persoonsgegevens worden verwerkt buiten de Europese Economische Ruimte, dan zorgt Verwerker voor passende waarborgen, zoals standaardcontractbepalingen, voor zover dit onder de AVG nodig is.\r\n\r\n---\r\n\r\n### 9. Hulp bij rechten van betrokkenen\r\n\r\nAls Verwerker een verzoek krijgt van een betrokkene (bijvoorbeeld inzage of verwijdering), dan verwijst Verwerker de betrokkene door naar Verwerkingsverantwoordelijke, tenzij Verwerker volgens de wet zelf moet reageren.\r\n\r\nVerwerker helpt Verwerkingsverantwoordelijke op verzoek, voor zover dat redelijk is, bij het uitvoeren van rechten van betrokkenen. Bijvoorbeeld door het verwijderen van gegevens als Verwerkingsverantwoordelijke daarom vraagt.\r\n\r\nAls Verwerkingsverantwoordelijke een export van gegevens nodig heeft (bijvoorbeeld voor dataportabiliteit), dan helpt Verwerker op verzoek met een redelijke export uit Rapply, voor zover dit technisch mogelijk is.\r\n\r\n---\r\n\r\n### 10. Datalekken\r\n\r\n#### 10.1 Melding\r\n\r\nAls Verwerker een beveiligingsincident ontdekt dat leidt tot verlies of onrechtmatige verwerking van persoonsgegevens (een datalek), dan informeert Verwerker Verwerkingsverantwoordelijke zonder onredelijke vertraging.\r\n\r\n#### 10.2 Informatie\r\n\r\nVoor zover beschikbaar verstrekt Verwerker in de melding:\r\n- wat er is gebeurd;\r\n- welke gegevens het betreft;\r\n- wat Verwerker heeft gedaan of gaat doen om de gevolgen te beperken;\r\n- wat Verwerkingsverantwoordelijke kan doen.\r\n\r\n---\r\n\r\n### 11. Verwijderen of teruggeven van gegevens\r\n\r\n#### 11.1 Einde van de dienstverlening\r\n\r\nNa het einde van Rapply verwerkt Verwerker geen persoonsgegevens meer voor Verwerkingsverantwoordelijke, behalve als dit wettelijk verplicht is.\r\n\r\n#### 11.2 Verwijderen\r\n\r\nVerwerker verwijdert of anonimiseert persoonsgegevens op verzoek van Verwerkingsverantwoordelijke en in ieder geval binnen een redelijke termijn na beÃ«indiging van de dienstverlening, tenzij een wettelijke bewaarplicht anders vereist.\r\n\r\nRapply bevat functies waarmee Verwerkingsverantwoordelijke gegevens kan verwijderen. Bij het verwijderen van een account worden bijbehorende gegevens in de database verwijderd en bijbehorende uploads in opslag verwijderd, voor zover die nog aanwezig zijn.\r\n\r\n---\r\n\r\n### 12. Audit en controle\r\n\r\nVerwerkingsverantwoordelijke mag controleren of Verwerker deze verwerkersovereenkomst naleeft, bijvoorbeeld door documentatie op te vragen of door een audit te laten uitvoeren. Partijen maken hierover vooraf praktische afspraken, zodat de controle de dienstverlening niet onnodig verstoort.\r\n\r\n---\r\n\r\n### 13. Aansprakelijkheid\r\n\r\nVoor aansprakelijkheid geldt wat partijen in de hoofdovereenkomst hebben afgesproken. Als er geen hoofdovereenkomst is, dan geldt het Nederlandse recht.\r\n\r\n---\r\n\r\n### 14. Toepasselijk recht en forum\r\n\r\nOp deze verwerkersovereenkomst is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter in Nederland.\r\n\r\n---\r\n\r\n### 15. Ondertekening\r\n\r\nAldus overeengekomen en ondertekend:\r\n\r\nPlaats: **[PLAATS]**  \r\nDatum: **[DATUM]**  \r\n\r\n**Voor Verwerkingsverantwoordelijke**  \r\nNaam: **[NAAM]**  \r\nFunctie: **[FUNCTIE]**  \r\nHandtekening: ______________________  \r\n\r\n**Voor Verwerker (JNL Solutions)**  \r\nNaam: **[NAAM]**  \r\nFunctie: **[FUNCTIE]**  \r\nHandtekening: ______________________  \r\n\r\n---\r\n\r\n### Bijlage 1: Omschrijving van de verwerking\r\n\r\n#### A. Doeleinden\r\n\r\nVerwerker verwerkt persoonsgegevens om Rapply te leveren, waaronder:\r\n- account en authenticatie via Microsoft Entra;\r\n- het opslaan en beheren van gegevens die Verwerkingsverantwoordelijke in Rapply invoert;\r\n- het (optioneel) transcriberen van audio en het genereren van samenvattingen en chatreacties op basis van door Verwerkingsverantwoordelijke aangeleverde inhoud;\r\n- beveiliging, stabiliteit en foutopsporing (zoals rate limiting).\r\n\r\n#### B. Soorten persoonsgegevens\r\n\r\nAfhankelijk van gebruik kunnen dit onder andere zijn:\r\n- accountgegevens (Entra gebruikers-id, e-mail, weergavenaam);\r\n- cliëntgegevens (bijvoorbeeld naam);\r\n- sessiegegevens (titel, type sessie, tijdstempels, bestandsnaam van upload);\r\n- transcripties, samenvattingen, notities, geschreven rapporten;\r\n- chatberichten;\r\n- technische gegevens zoals IP-adres en technische logs.\r\n\r\n#### C. CategorieÃ«n betrokkenen\r\n\r\nDit kunnen onder andere zijn:\r\n- Verwerkingsverantwoordelijke zelf (gebruiker van Rapply);\r\n- personen over wie gegevens worden vastgelegd (bijvoorbeeld cliÃ«nten of gesprekspartners);\r\n- contactpersonen die berichten sturen aan support.\r\n\r\n#### D. Bijzondere persoonsgegevens\r\n\r\nDe inhoud kan bijzondere persoonsgegevens bevatten, afhankelijk van wat Verwerkingsverantwoordelijke opneemt of invoert (bijvoorbeeld gezondheidsinformatie). Verwerkingsverantwoordelijke bepaalt de inhoud en het doel.\r\n\r\n#### E. Frequentie en aard\r\n\r\nDe verwerking vindt doorlopend plaats zolang Rapply wordt gebruikt. Audio voor transcriptie wordt als versleutelde upload tijdelijk verwerkt en na verwerking verwijderd.\r\n\r\n---\r\n\r\n### Bijlage 2: Beveiligingsmaatregelen\r\n\r\nVerwerker neemt maatregelen die passen bij het risico en de gevoeligheid van de gegevens. In elk geval:\r\n- versleutelde verbindingen (HTTPS) waar van toepassing;\r\n- toegangsbeperking en minimale toegangsrechten voor systemen en database;\r\n- private opslag voor uploads en het gebruik van tijdelijke uploadrechten;\r\n- versleutelde audio-uploads vanuit de client voor transcriptie;\r\n- verwijdering van tijdelijke uploads na verwerking;\r\n- maatregelen tegen misbruik, zoals rate limiting op basis van IP-adres;\r\n- beleid om gevoelige inhoud (transcripties, audio, sleutels, tokens) niet te loggen.\r\n\r\n---\r\n\r\n### Bijlage 3: Subverwerkers\r\n\r\nDeze lijst kan wijzigen. Verwerker houdt deze bij en informeert Verwerkingsverantwoordelijke over materiÃ«le wijzigingen.\r\n\r\n#### A. Auth en infrastructuur\r\n- **Microsoft** (Microsoft Entra voor authenticatie; Azure diensten voor hosting, opslag en database).\r\n\r\n#### B. Audio-opslag voor transcriptie (tijdelijk)\r\n- **Cloudopslagdienst** voor versleutelde audio-uploads (in de huidige inrichting: Azure Blob Storage).\r\n\r\n#### C. Transcriptie, samenvatting en chat (optioneel)\r\n- **Azure Speech** voor transcriptie.\r\n- **Azure OpenAI** voor samenvatting en chat.\r\n\r\n#### D. Abonnementen en aankoopstatus\r\n- **Mollie** (abonnementstatus en aankoopinformatie).\r\n\r\n"
};
}),
"[project]/lib/legalDocuments.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getLegalDocumentContent",
    ()=>getLegalDocumentContent
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$documentation$2f$legal$2f$legalContent$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/documentation/legal/legalContent.ts [app-rsc] (ecmascript)");
;
async function getLegalDocumentContent(slug) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$documentation$2f$legal$2f$legalContent$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["legalContent"][slug];
}
}),
"[project]/app/(site)/privacybeleid/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PrivacybeleidPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$legal$2f$LegalDocumentPage$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/legal/LegalDocumentPage.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$legalDocuments$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/legalDocuments.ts [app-rsc] (ecmascript)");
;
;
;
async function PrivacybeleidPage() {
    const markdown = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$legalDocuments$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getLegalDocumentContent"])("privacybeleid");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$legal$2f$LegalDocumentPage$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
        title: "Privacybeleid",
        subtitle: "Heldere informatie over gegevensstromen, rollen, beveiliging en jouw rechten.",
        markdown: markdown
    }, void 0, false, {
        fileName: "[project]/app/(site)/privacybeleid/page.tsx",
        lineNumber: 8,
        columnNumber: 5
    }, this);
}
}),
"[project]/app/(site)/privacybeleid/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/(site)/privacybeleid/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__458b1eb6._.js.map