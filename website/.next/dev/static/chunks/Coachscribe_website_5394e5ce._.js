(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/Coachscribe/website/lib/verwerkersovereenkomst.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildVerwerkersovereenkomst",
    ()=>buildVerwerkersovereenkomst
]);
function withFallback(value, fallback) {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : fallback;
}
function formatDate(value) {
    const trimmed = value.trim();
    if (trimmed.length === 0) return "[DATUM]";
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return trimmed;
    return new Intl.DateTimeFormat("nl-NL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).format(parsed);
}
function buildVerwerkersovereenkomst(values) {
    const organizationName = withFallback(values.organizationName, "[NAAM KLANT]");
    const address = withFallback(values.address, "[ADRES KLANT]");
    const postalCode = withFallback(values.postalCode, "[POSTCODE KLANT]");
    const city = withFallback(values.city, "[PLAATS KLANT]");
    const country = withFallback(values.country, "[LAND KLANT]");
    const contactPersonFullName = withFallback(values.contactPersonFullName, "[VOOR- EN ACHTERNAAM CONTACTPERSOON]");
    const contactEmail = withFallback(values.contactEmail, "[E-MAIL KLANT]");
    const effectiveDate = formatDate(values.effectiveDate);
    const signingPlace = withFallback(values.signingPlace, "[PLAATS]");
    const signingDate = formatDate(values.signingDate);
    const signerFullName = withFallback(values.signerFullName, "[VOOR- EN ACHTERNAAM ONDERTEKENAAR]");
    const signerRole = withFallback(values.signerRole, "[FUNCTIE]");
    return `VERWERKERSOVEREENKOMST COACHSCRIBE

Deze verwerkersovereenkomst hoort bij het gebruik van CoachScribe.

1. Partijen

1.1 Verwerkingsverantwoordelijke
Naam organisatie: ${organizationName}
Adres: ${address}
Postcode: ${postalCode}
Plaats: ${city}
Land: ${country}
Contactpersoon (voor- en achternaam): ${contactPersonFullName}
E-mail: ${contactEmail}

1.2 Verwerker
Naam: JNL Solutions
Adres: Stationsplein 26
Postcode en plaats: 6512 AB, Nijmegen
Land: Nederland
E-mail: contact@coachscribe.nl
Website: https://www.coachscribe.nl

2. Onderwerp en duur

Verwerker verwerkt persoonsgegevens voor Verwerkingsverantwoordelijke bij het leveren van CoachScribe, zoals beschreven in Bijlage 1.
Deze verwerkersovereenkomst geldt vanaf ${effectiveDate} en loopt zolang Verwerker persoonsgegevens verwerkt voor Verwerkingsverantwoordelijke in het kader van CoachScribe.

3. Instructies en doelbinding

Verwerker verwerkt persoonsgegevens uitsluitend:
- om CoachScribe te leveren zoals afgesproken met Verwerkingsverantwoordelijke; en
- op basis van schriftelijke of aantoonbare instructies van Verwerkingsverantwoordelijke.

4. Vertrouwelijkheid en beveiliging

Verwerker treft passende technische en organisatorische maatregelen. De belangrijkste maatregelen staan in Bijlage 2.
Verwerker zorgt ervoor dat personen met toegang tot persoonsgegevens gebonden zijn aan geheimhouding.

5. Subverwerkers

Verwerkingsverantwoordelijke geeft algemene toestemming voor het inschakelen van subverwerkers die nodig zijn voor CoachScribe.
De actuele subverwerkers staan in Bijlage 3.

6. Datalekken

Verwerker informeert Verwerkingsverantwoordelijke zonder onredelijke vertraging bij een beveiligingsincident dat leidt tot verlies of onrechtmatige verwerking van persoonsgegevens.

7. Verwijderen of teruggeven van gegevens

Na het einde van de dienstverlening verwerkt Verwerker geen persoonsgegevens meer voor Verwerkingsverantwoordelijke, behalve als dit wettelijk verplicht is.
Verwerker verwijdert of anonimiseert persoonsgegevens op verzoek van Verwerkingsverantwoordelijke binnen een redelijke termijn.

8. Toepasselijk recht

Op deze verwerkersovereenkomst is Nederlands recht van toepassing.
Geschillen worden voorgelegd aan de bevoegde rechter in Nederland.

9. Ondertekening

Plaats: ${signingPlace}
Datum: ${signingDate}

Voor Verwerkingsverantwoordelijke
Naam: ${signerFullName}
Functie: ${signerRole}
Handtekening: ______________________

Voor Verwerker (JNL Solutions)
Naam: [NAAM]
Functie: [FUNCTIE]
Handtekening: ______________________

BIJLAGE 1 - Omschrijving van de verwerking

A. Doeleinden
- account en authenticatie via Microsoft Entra;
- opslag en beheer van gegevens die Verwerkingsverantwoordelijke in CoachScribe invoert;
- transcriptie van audio via Azure Speech;
- genereren van samenvattingen en chatreacties via Azure OpenAI;
- beveiliging, stabiliteit en foutopsporing.

B. Soorten persoonsgegevens
- accountgegevens (Entra gebruikers-id, e-mail, weergavenaam);
- coachee-gegevens;
- sessiegegevens;
- transcripties, samenvattingen, notities en rapporten;
- chatberichten;
- technische gegevens zoals IP-adres en logs;
- abonnements- en aankoopinformatie.

BIJLAGE 2 - Beveiligingsmaatregelen

- versleutelde verbindingen (HTTPS);
- toegangsbeperking en minimale toegangsrechten;
- private opslag voor uploads en tijdelijke uploadrechten;
- versleutelde audio-uploads vanuit de client;
- verwijdering van tijdelijke uploads na verwerking;
- maatregelen tegen misbruik, zoals rate limiting.

BIJLAGE 3 - Subverwerkers

A. Authenticatie en infrastructuur
- Microsoft (Microsoft Entra voor authenticatie; Azure diensten voor hosting, opslag en database).

B. Tijdelijke audio-opslag
- Azure Blob Storage (versleutelde uploads).

C. Transcriptie, samenvatting en chat
- Azure Speech (transcriptie).
- Azure OpenAI (samenvatting en chat).

D. Abonnementen en aankoopstatus
- Mollie (abonnementstatus en aankoopinformatie).
`;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Coachscribe/website/lib/verwerkersovereenkomstPdf.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "downloadVerwerkersovereenkomstPdf",
    ()=>downloadVerwerkersovereenkomstPdf
]);
function slugifyFilename(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}
function isMainHeading(line) {
    return line === line.toUpperCase() || /^BIJLAGE\s+\d+/i.test(line) || /^\d+\.\s+/.test(line);
}
function isSubHeading(line) {
    return /^\d+\.\d+\s+/.test(line) || /^[A-Z]\.\s+/.test(line);
}
function isBullet(line) {
    return line.trim().startsWith("- ");
}
function isLabelValueLine(line) {
    return /^[^:]{2,40}:\s+.+$/.test(line);
}
async function loadLogoDataUrl() {
    const response = await fetch("/icon.svg");
    if (!response.ok) return null;
    const svgText = await response.text();
    const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
    const image = await new Promise((resolve, reject)=>{
        const element = new Image();
        element.onload = ()=>resolve(element);
        element.onerror = reject;
        element.src = svgDataUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
}
async function downloadVerwerkersovereenkomstPdf(documentText, organizationName) {
    const { jsPDF } = await __turbopack_context__.A("[project]/Coachscribe/website/node_modules/jspdf/dist/jspdf.es.min.js [app-client] (ecmascript, async loader)");
    const doc = new jsPDF({
        unit: "pt",
        format: "a4"
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 48;
    const topBodyY = 78;
    const bottomY = pageHeight - 56;
    const contentWidth = pageWidth - marginX * 2;
    const logoSize = 26;
    const logoDataUrl = await loadLogoDataUrl();
    const drawPageChrome = ()=>{
        if (logoDataUrl) {
            try {
                const logoX = pageWidth - marginX - logoSize;
                const logoY = marginX;
                doc.addImage(logoDataUrl, "PNG", logoX, logoY, logoSize, logoSize);
            } catch  {
            // Keep PDF generation resilient if image conversion failed.
            }
        }
        doc.setDrawColor(189, 2, 101);
        doc.line(marginX, pageHeight - 62, pageWidth - marginX, pageHeight - 62);
        doc.setTextColor(96, 96, 96);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text("coachscribe.nl  |  contact@coachscribe.nl", marginX, pageHeight - 44);
    };
    drawPageChrome();
    let y = topBodyY;
    const ensurePageSpace = (requiredHeight)=>{
        if (y + requiredHeight <= bottomY) return;
        doc.addPage();
        drawPageChrome();
        doc.setTextColor(29, 10, 0);
        y = topBodyY;
    };
    const drawWrappedText = (text, font, fontSize, lineHeight)=>{
        doc.setFont("helvetica", font);
        doc.setFontSize(fontSize);
        doc.setTextColor(29, 10, 0);
        const wrapped = doc.splitTextToSize(text, contentWidth);
        for (const line of wrapped){
            ensurePageSpace(lineHeight);
            doc.text(line, marginX, y);
            y += lineHeight;
        }
    };
    const lines = documentText.replace(/\r/g, "").split("\n");
    for (const rawLine of lines){
        const line = rawLine.trim();
        if (!line) {
            ensurePageSpace(8);
            y += 8;
            continue;
        }
        const mustStartNewPage = /^4\.\s+/.test(line) || /^9\.\s+/.test(line) || /^BIJLAGE\s+1\b/i.test(line);
        if (mustStartNewPage && y !== topBodyY) {
            doc.addPage();
            drawPageChrome();
            doc.setTextColor(29, 10, 0);
            y = topBodyY;
        }
        if (isMainHeading(line)) {
            ensurePageSpace(24);
            y += 6;
            drawWrappedText(line, "bold", 13, 17);
            y += 2;
            continue;
        }
        if (isSubHeading(line)) {
            drawWrappedText(line, "bold", 11.5, 15);
            continue;
        }
        if (isBullet(line)) {
            const bulletText = line.replace(/^- /, "").trim();
            drawWrappedText(`• ${bulletText}`, "normal", 10.8, 14);
            continue;
        }
        if (isLabelValueLine(line)) {
            const separatorIndex = line.indexOf(":");
            const label = line.slice(0, separatorIndex + 1);
            const value = line.slice(separatorIndex + 1).trim();
            drawWrappedText(label, "bold", 10.8, 14);
            drawWrappedText(value, "normal", 10.8, 14);
            continue;
        }
        drawWrappedText(line, "normal", 10.8, 14);
    }
    const fileName = `verwerkersovereenkomst-${slugifyFilename(organizationName || "klant")}.pdf`;
    doc.save(fileName);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>VerwerkersovereenkomstFlow
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/image.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$lib$2f$verwerkersovereenkomst$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/lib/verwerkersovereenkomst.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$lib$2f$verwerkersovereenkomstPdf$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/lib/verwerkersovereenkomstPdf.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
const inputClassName = "h-12 rounded-xl border border-[#DDDDDD] bg-white px-4 text-base font-normal text-[#1D0A00] outline-none transition-colors focus:border-[#BD0265]";
const dayLabels = [
    "ma",
    "di",
    "wo",
    "do",
    "vr",
    "za",
    "zo"
];
function isMainHeading(line) {
    return line === line.toUpperCase() || /^BIJLAGE\s+\d+/i.test(line) || /^\d+\.\s+/.test(line);
}
function isSubHeading(line) {
    return /^\d+\.\d+\s+/.test(line) || /^[A-Z]\.\s+/.test(line);
}
function isBullet(line) {
    return line.trim().startsWith("- ");
}
function isLabelValueLine(line) {
    return /^[^:]{2,40}:\s+.+$/.test(line);
}
function getTodayIsoDate() {
    return new Date().toISOString().slice(0, 10);
}
function parseIsoDate(value) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
}
function toIsoDate(value) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}
function formatDate(value) {
    if (!value) return "";
    const parsed = parseIsoDate(value);
    return new Intl.DateTimeFormat("nl-NL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).format(parsed);
}
function getCalendarCells(monthDate) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startWeekday = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPreviousMonth = new Date(year, month, 0).getDate();
    const cells = [];
    for(let index = 0; index < 42; index += 1){
        const dayOffset = index - startWeekday + 1;
        if (dayOffset <= 0) {
            cells.push({
                date: new Date(year, month - 1, daysInPreviousMonth + dayOffset),
                inCurrentMonth: false
            });
            continue;
        }
        if (dayOffset > daysInMonth) {
            cells.push({
                date: new Date(year, month + 1, dayOffset - daysInMonth),
                inCurrentMonth: false
            });
            continue;
        }
        cells.push({
            date: new Date(year, month, dayOffset),
            inCurrentMonth: true
        });
    }
    return cells;
}
function CalendarIcon() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        "aria-hidden": "true",
        viewBox: "0 0 24 24",
        className: "h-5 w-5 text-[#BD0265]",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                x: "3",
                y: "4",
                width: "18",
                height: "18",
                rx: "2"
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                lineNumber: 124,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                x1: "16",
                y1: "2",
                x2: "16",
                y2: "6"
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                lineNumber: 125,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                x1: "8",
                y1: "2",
                x2: "8",
                y2: "6"
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                lineNumber: 126,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                x1: "3",
                y1: "10",
                x2: "21",
                y2: "10"
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                lineNumber: 127,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
        lineNumber: 114,
        columnNumber: 5
    }, this);
}
_c = CalendarIcon;
function CalendarInput({ label, value, onChange }) {
    _s();
    const [isOpen, setIsOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [visibleMonth, setVisibleMonth] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "CalendarInput.useState": ()=>parseIsoDate(value)
    }["CalendarInput.useState"]);
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const selectedIso = value;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CalendarInput.useEffect": ()=>{
            if (!isOpen) return;
            const handleDocumentClick = {
                "CalendarInput.useEffect.handleDocumentClick": (event)=>{
                    if (!(event.target instanceof Node)) return;
                    if (!containerRef.current?.contains(event.target)) {
                        setIsOpen(false);
                    }
                }
            }["CalendarInput.useEffect.handleDocumentClick"];
            document.addEventListener("mousedown", handleDocumentClick);
            return ({
                "CalendarInput.useEffect": ()=>document.removeEventListener("mousedown", handleDocumentClick)
            })["CalendarInput.useEffect"];
        }
    }["CalendarInput.useEffect"], [
        isOpen
    ]);
    const monthTitle = new Intl.DateTimeFormat("nl-NL", {
        month: "long",
        year: "numeric"
    }).format(visibleMonth);
    const calendarCells = getCalendarCells(visibleMonth);
    const handleSelectDate = (event)=>{
        const iso = event.currentTarget.dataset.isoDate;
        if (!iso) return;
        onChange(iso);
        setVisibleMonth(parseIsoDate(iso));
        setIsOpen(false);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative flex flex-col gap-2",
        ref: containerRef,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-sm text-[#1D0A00]",
                children: label
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                lineNumber: 172,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                className: `${inputClassName} inline-flex cursor-pointer items-center justify-between text-left ${!value ? "text-black/40" : ""}`,
                onClick: ()=>setIsOpen((previous)=>!previous),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: value ? formatDate(value) : "Kies een datum"
                    }, void 0, false, {
                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                        lineNumber: 178,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CalendarIcon, {}, void 0, false, {
                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                        lineNumber: 179,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                lineNumber: 173,
                columnNumber: 7
            }, this),
            isOpen ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute left-0 top-[86px] z-20 w-[320px] rounded-2xl border border-[#E3E3E3] bg-white p-4 shadow-[0_14px_28px_rgba(15,23,42,0.14)]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-3 flex items-center justify-between",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#E6C1D6] text-[#BD0265] transition-colors hover:bg-[#FCEFF6]",
                                onClick: ()=>setVisibleMonth((previous)=>new Date(previous.getFullYear(), previous.getMonth() - 1, 1)),
                                children: "<"
                            }, void 0, false, {
                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                lineNumber: 184,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-sm font-semibold capitalize text-[#1D0A00]",
                                children: monthTitle
                            }, void 0, false, {
                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                lineNumber: 200,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#E6C1D6] text-[#BD0265] transition-colors hover:bg-[#FCEFF6]",
                                onClick: ()=>setVisibleMonth((previous)=>new Date(previous.getFullYear(), previous.getMonth() + 1, 1)),
                                children: ">"
                            }, void 0, false, {
                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                lineNumber: 203,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                        lineNumber: 183,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-2 grid grid-cols-7 gap-1",
                        children: dayLabels.map((dayLabel)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-center text-xs font-semibold uppercase text-black/50",
                                children: dayLabel
                            }, dayLabel, false, {
                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                lineNumber: 222,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                        lineNumber: 220,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-7 gap-1",
                        children: calendarCells.map((calendarCell)=>{
                            const isoDate = toIsoDate(calendarCell.date);
                            const isSelected = isoDate === selectedIso;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                "data-iso-date": isoDate,
                                onClick: handleSelectDate,
                                className: `h-9 cursor-pointer rounded-lg text-sm transition-colors ${isSelected ? "bg-[#BD0265] text-white" : calendarCell.inCurrentMonth ? "text-[#1D0A00] hover:bg-[#F8E4EF]" : "text-black/35 hover:bg-[#F5F5F5]"}`,
                                children: calendarCell.date.getDate()
                            }, isoDate, false, {
                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                lineNumber: 235,
                                columnNumber: 17
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                        lineNumber: 230,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                lineNumber: 182,
                columnNumber: 9
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
        lineNumber: 171,
        columnNumber: 5
    }, this);
}
_s(CalendarInput, "nncJNN9ZkShGgIFNO7dIqHwExSE=");
_c1 = CalendarInput;
const initialValues = {
    organizationName: "",
    address: "",
    postalCode: "",
    city: "",
    country: "Nederland",
    contactPersonFullName: "",
    contactEmail: "",
    effectiveDate: getTodayIsoDate(),
    signingPlace: "",
    signingDate: getTodayIsoDate(),
    signerFullName: "",
    signerRole: ""
};
function VerwerkersovereenkomstFlow() {
    _s1();
    const addressInputId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useId"])();
    const [formValues, setFormValues] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialValues);
    const [isReady, setIsReady] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isDownloading, setIsDownloading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [addressSuggestions, setAddressSuggestions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const skipAutocompleteRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const addressContainerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const documentText = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "VerwerkersovereenkomstFlow.useMemo[documentText]": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$lib$2f$verwerkersovereenkomst$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildVerwerkersovereenkomst"])(formValues)
    }["VerwerkersovereenkomstFlow.useMemo[documentText]"], [
        formValues
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "VerwerkersovereenkomstFlow.useEffect": ()=>{
            const query = formValues.address.trim();
            if (query.length < 3) {
                setAddressSuggestions([]);
                return;
            }
            if (skipAutocompleteRef.current) {
                skipAutocompleteRef.current = false;
                return;
            }
            const controller = new AbortController();
            const timeout = window.setTimeout({
                "VerwerkersovereenkomstFlow.useEffect.timeout": async ()=>{
                    try {
                        const encodedQuery = encodeURIComponent(query);
                        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&addressdetails=1&countrycodes=nl&q=${encodedQuery}&accept-language=nl`, {
                            signal: controller.signal
                        });
                        if (!response.ok) return;
                        const results = await response.json();
                        const mapped = results.map({
                            "VerwerkersovereenkomstFlow.useEffect.timeout.mapped": (result)=>{
                                const street = result.address?.road ?? result.address?.pedestrian ?? result.address?.residential ?? "";
                                const houseNumber = result.address?.house_number ?? "";
                                const postcode = result.address?.postcode ?? "";
                                const city = result.address?.city ?? result.address?.town ?? result.address?.village ?? result.address?.municipality ?? "";
                                if (!street || !postcode || !city) return null;
                                const address = `${street}${houseNumber ? ` ${houseNumber}` : ""}`.trim();
                                const label = `${address}, ${postcode} ${city}`;
                                return {
                                    label,
                                    address,
                                    postalCode: postcode,
                                    city,
                                    country: result.address?.country ?? "Nederland"
                                };
                            }
                        }["VerwerkersovereenkomstFlow.useEffect.timeout.mapped"]).filter({
                            "VerwerkersovereenkomstFlow.useEffect.timeout.mapped": (value)=>Boolean(value)
                        }["VerwerkersovereenkomstFlow.useEffect.timeout.mapped"]);
                        const uniqueByLabel = mapped.filter({
                            "VerwerkersovereenkomstFlow.useEffect.timeout.uniqueByLabel": (suggestion, index)=>mapped.findIndex({
                                    "VerwerkersovereenkomstFlow.useEffect.timeout.uniqueByLabel": (item)=>item.label === suggestion.label
                                }["VerwerkersovereenkomstFlow.useEffect.timeout.uniqueByLabel"]) === index
                        }["VerwerkersovereenkomstFlow.useEffect.timeout.uniqueByLabel"]);
                        setAddressSuggestions(uniqueByLabel.slice(0, 6));
                    } catch  {
                    // Keep autocomplete best-effort only.
                    }
                }
            }["VerwerkersovereenkomstFlow.useEffect.timeout"], 250);
            return ({
                "VerwerkersovereenkomstFlow.useEffect": ()=>{
                    controller.abort();
                    window.clearTimeout(timeout);
                }
            })["VerwerkersovereenkomstFlow.useEffect"];
        }
    }["VerwerkersovereenkomstFlow.useEffect"], [
        formValues.address
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "VerwerkersovereenkomstFlow.useEffect": ()=>{
            if (!addressSuggestions.length) return;
            const onOutsideClick = {
                "VerwerkersovereenkomstFlow.useEffect.onOutsideClick": (event)=>{
                    if (!(event.target instanceof Node)) return;
                    if (!addressContainerRef.current?.contains(event.target)) {
                        setAddressSuggestions([]);
                    }
                }
            }["VerwerkersovereenkomstFlow.useEffect.onOutsideClick"];
            document.addEventListener("mousedown", onOutsideClick);
            return ({
                "VerwerkersovereenkomstFlow.useEffect": ()=>document.removeEventListener("mousedown", onOutsideClick)
            })["VerwerkersovereenkomstFlow.useEffect"];
        }
    }["VerwerkersovereenkomstFlow.useEffect"], [
        addressSuggestions.length
    ]);
    const handleSelectSuggestion = (suggestion)=>{
        skipAutocompleteRef.current = true;
        setFormValues((previous)=>({
                ...previous,
                address: suggestion.address,
                postalCode: suggestion.postalCode || previous.postalCode,
                city: suggestion.city || previous.city,
                country: suggestion.country || previous.country
            }));
        setAddressSuggestions([]);
    };
    const handleSubmit = (event)=>{
        event.preventDefault();
        setIsReady(true);
    };
    const handleDownload = async ()=>{
        try {
            setIsDownloading(true);
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$lib$2f$verwerkersovereenkomstPdf$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["downloadVerwerkersovereenkomstPdf"])(documentText, formValues.organizationName);
        } finally{
            setIsDownloading(false);
        }
    };
    const previewLines = documentText.replace(/\r/g, "").split("\n");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "w-full bg-[#F8F9F9]",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mx-auto w-full max-w-6xl p-6 py-12 md:p-10 md:py-16",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mx-auto flex w-full max-w-4xl flex-col gap-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-3xl font-semibold text-[#1D0A00] md:text-4xl xl:text-5xl",
                                children: "Verwerkersovereenkomst genereren"
                            }, void 0, false, {
                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                lineNumber: 419,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-base font-normal text-black/70 md:text-lg",
                                children: "Vul de gegevens in. Daarna kun je de verwerkersovereenkomst als CoachScribe PDF downloaden."
                            }, void 0, false, {
                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                lineNumber: 422,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                        lineNumber: 418,
                        columnNumber: 11
                    }, this),
                    !isReady ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                        onSubmit: handleSubmit,
                        className: "page-enter-animation rounded-2xl border border-black/10 bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.06)] md:p-8",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid gap-4 md:grid-cols-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "flex flex-col gap-2 md:col-span-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm text-[#1D0A00]",
                                                children: "Naam organisatie*"
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 435,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                required: true,
                                                className: inputClassName,
                                                value: formValues.organizationName,
                                                onChange: (event)=>setFormValues((previous)=>({
                                                            ...previous,
                                                            organizationName: event.target.value
                                                        }))
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 438,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                        lineNumber: 434,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        ref: addressContainerRef,
                                        htmlFor: addressInputId,
                                        className: "relative flex flex-col gap-2 md:col-span-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm text-[#1D0A00]",
                                                children: "Adres*"
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 455,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                id: addressInputId,
                                                required: true,
                                                className: inputClassName,
                                                value: formValues.address,
                                                onChange: (event)=>setFormValues((previous)=>({
                                                            ...previous,
                                                            address: event.target.value
                                                        }))
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 456,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: `absolute left-0 right-0 top-[86px] z-20 max-h-56 overflow-auto rounded-xl bg-white shadow-[0_12px_24px_rgba(15,23,42,0.12)] transition-all duration-200 ease-out ${addressSuggestions.length > 0 ? "translate-y-0 border border-[#E3E3E3] opacity-100" : "-translate-y-1 border border-transparent opacity-0 pointer-events-none"}`,
                                                children: addressSuggestions.map((suggestion, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        onMouseDown: (event)=>{
                                                            event.preventDefault();
                                                            handleSelectSuggestion(suggestion);
                                                        },
                                                        className: "w-full cursor-pointer border-b border-[#F0F0F0] px-4 py-3 text-left text-sm text-[#1D0A00] transition-colors hover:bg-[#FBE8F1] last:border-b-0",
                                                        children: suggestion.label
                                                    }, `${suggestion.label}-${index}`, false, {
                                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                        lineNumber: 476,
                                                        columnNumber: 23
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 468,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                        lineNumber: 450,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "flex flex-col gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm text-[#1D0A00]",
                                                children: "Postcode*"
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 491,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                required: true,
                                                className: inputClassName,
                                                value: formValues.postalCode,
                                                onChange: (event)=>setFormValues((previous)=>({
                                                            ...previous,
                                                            postalCode: event.target.value
                                                        }))
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 492,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                        lineNumber: 490,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "flex flex-col gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm text-[#1D0A00]",
                                                children: "Plaats*"
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 505,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                required: true,
                                                className: inputClassName,
                                                value: formValues.city,
                                                onChange: (event)=>setFormValues((previous)=>({
                                                            ...previous,
                                                            city: event.target.value
                                                        }))
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 506,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                        lineNumber: 504,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "flex flex-col gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm text-[#1D0A00]",
                                                children: "Land*"
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 519,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                required: true,
                                                className: inputClassName,
                                                value: formValues.country,
                                                onChange: (event)=>setFormValues((previous)=>({
                                                            ...previous,
                                                            country: event.target.value
                                                        }))
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 520,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                        lineNumber: 518,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "flex flex-col gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm text-[#1D0A00]",
                                                children: "Voor- en achternaam contactpersoon*"
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 533,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                required: true,
                                                className: inputClassName,
                                                value: formValues.contactPersonFullName,
                                                onChange: (event)=>setFormValues((previous)=>({
                                                            ...previous,
                                                            contactPersonFullName: event.target.value
                                                        }))
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 536,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                        lineNumber: 532,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "flex flex-col gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm text-[#1D0A00]",
                                                children: "E-mail*"
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 549,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                required: true,
                                                type: "email",
                                                className: inputClassName,
                                                value: formValues.contactEmail,
                                                onChange: (event)=>setFormValues((previous)=>({
                                                            ...previous,
                                                            contactEmail: event.target.value
                                                        }))
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 550,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                        lineNumber: 548,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CalendarInput, {
                                        label: "Ingangsdatum*",
                                        value: formValues.effectiveDate,
                                        onChange: (dateValue)=>setFormValues((previous)=>({
                                                    ...previous,
                                                    effectiveDate: dateValue
                                                }))
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                        lineNumber: 564,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "flex flex-col gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm text-[#1D0A00]",
                                                children: "Plaats*"
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 576,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                required: true,
                                                className: inputClassName,
                                                value: formValues.signingPlace,
                                                onChange: (event)=>setFormValues((previous)=>({
                                                            ...previous,
                                                            signingPlace: event.target.value
                                                        }))
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 577,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                        lineNumber: 575,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CalendarInput, {
                                        label: "Datum*",
                                        value: formValues.signingDate,
                                        onChange: (dateValue)=>setFormValues((previous)=>({
                                                    ...previous,
                                                    signingDate: dateValue
                                                }))
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                        lineNumber: 590,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "flex flex-col gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm text-[#1D0A00]",
                                                children: "Voor- en achternaam ondertekenaar*"
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 602,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                required: true,
                                                className: inputClassName,
                                                value: formValues.signerFullName,
                                                onChange: (event)=>setFormValues((previous)=>({
                                                            ...previous,
                                                            signerFullName: event.target.value
                                                        }))
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 605,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                        lineNumber: 601,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "flex flex-col gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm text-[#1D0A00]",
                                                children: "Functie*"
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 618,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                required: true,
                                                className: inputClassName,
                                                value: formValues.signerRole,
                                                onChange: (event)=>setFormValues((previous)=>({
                                                            ...previous,
                                                            signerRole: event.target.value
                                                        }))
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 619,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                        lineNumber: 617,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                lineNumber: 433,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-6",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "submit",
                                    className: "inline-flex h-12 cursor-pointer items-center gap-2 rounded-full border-2 border-[#BD0265] bg-[#BD0265] px-6 text-base font-semibold text-white transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#A00256] hover:bg-[#A00256]",
                                    children: "Maak verwerkersovereenkomst"
                                }, void 0, false, {
                                    fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                    lineNumber: 633,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                lineNumber: 632,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                        lineNumber: 429,
                        columnNumber: 13
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "page-enter-animation flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.06)] md:p-8",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-wrap items-center gap-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: handleDownload,
                                        disabled: isDownloading,
                                        className: "inline-flex h-12 min-w-[260px] cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-[#BD0265] bg-[#BD0265] px-6 text-base font-semibold text-white transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#A00256] hover:bg-[#A00256] disabled:cursor-not-allowed disabled:opacity-70",
                                        children: isDownloading ? "PDF wordt gemaakt..." : "Download CoachScribe PDF"
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                        lineNumber: 644,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>setIsReady(false),
                                        className: "inline-flex h-12 cursor-pointer items-center gap-2 rounded-full border border-[#BD0265] bg-white px-6 text-base font-semibold text-[#BD0265] transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#FBE8F1]",
                                        children: "Gegevens aanpassen"
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                        lineNumber: 654,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                lineNumber: 643,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                                className: "rounded-xl border border-[#E7E7E7] bg-white p-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mb-5 flex justify-end",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            src: "/icon.svg",
                                            alt: "CoachScribe logo",
                                            width: 26,
                                            height: 26
                                        }, void 0, false, {
                                            fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                            lineNumber: 665,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                        lineNumber: 664,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-col gap-1 text-[#1D0A00]",
                                        children: previewLines.map((rawLine, index)=>{
                                            const line = rawLine.trim();
                                            if (!line) {
                                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "h-2"
                                                }, `empty-${index}`, false, {
                                                    fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                    lineNumber: 676,
                                                    columnNumber: 30
                                                }, this);
                                            }
                                            if (isMainHeading(line)) {
                                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    className: "pt-2 text-[16px] font-bold leading-[1.35]",
                                                    children: line
                                                }, `main-${index}`, false, {
                                                    fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                    lineNumber: 680,
                                                    columnNumber: 25
                                                }, this);
                                            }
                                            if (isSubHeading(line)) {
                                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                    className: "text-[14px] font-semibold leading-[1.35]",
                                                    children: line
                                                }, `sub-${index}`, false, {
                                                    fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                    lineNumber: 690,
                                                    columnNumber: 25
                                                }, this);
                                            }
                                            if (isBullet(line)) {
                                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "pl-3 text-[13.5px] leading-[1.45]",
                                                    children: [
                                                        "• ",
                                                        line.replace(/^- /, "").trim()
                                                    ]
                                                }, `bullet-${index}`, true, {
                                                    fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                    lineNumber: 700,
                                                    columnNumber: 25
                                                }, this);
                                            }
                                            if (isLabelValueLine(line)) {
                                                const separatorIndex = line.indexOf(":");
                                                const label = line.slice(0, separatorIndex + 1);
                                                const value = line.slice(separatorIndex + 1).trim();
                                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-[13.5px] leading-[1.45]",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                            children: label
                                                        }, void 0, false, {
                                                            fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                            lineNumber: 711,
                                                            columnNumber: 27
                                                        }, this),
                                                        " ",
                                                        value
                                                    ]
                                                }, `label-${index}`, true, {
                                                    fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                    lineNumber: 710,
                                                    columnNumber: 25
                                                }, this);
                                            }
                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-[13.5px] leading-[1.45]",
                                                children: line
                                            }, `line-${index}`, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 716,
                                                columnNumber: 23
                                            }, this);
                                        })
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                        lineNumber: 672,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-5 border-t border-[#BD0265] pt-3 text-[11px] text-[#606060]",
                                        children: "coachscribe.nl | contact@coachscribe.nl"
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                        lineNumber: 722,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                lineNumber: 663,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                        lineNumber: 642,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                lineNumber: 417,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
            lineNumber: 416,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
        lineNumber: 415,
        columnNumber: 5
    }, this);
}
_s1(VerwerkersovereenkomstFlow, "LWlW7gpGaV8M6upSLWBoQ4x82f4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useId"]
    ];
});
_c2 = VerwerkersovereenkomstFlow;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "CalendarIcon");
__turbopack_context__.k.register(_c1, "CalendarInput");
__turbopack_context__.k.register(_c2, "VerwerkersovereenkomstFlow");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=Coachscribe_website_5394e5ce._.js.map