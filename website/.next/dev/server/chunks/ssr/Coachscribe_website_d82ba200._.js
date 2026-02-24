module.exports = [
"[project]/Coachscribe/website/lib/verwerkersovereenkomst.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
}),
"[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>VerwerkersovereenkomstFlow
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$lib$2f$verwerkersovereenkomst$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Coachscribe/website/lib/verwerkersovereenkomst.ts [app-ssr] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module '@/lib/verwerkersovereenkomstPdf'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        "aria-hidden": "true",
        viewBox: "0 0 24 24",
        className: "h-5 w-5 text-[#BD0265]",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                x: "3",
                y: "4",
                width: "18",
                height: "18",
                rx: "2"
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                lineNumber: 94,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                x1: "16",
                y1: "2",
                x2: "16",
                y2: "6"
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                lineNumber: 95,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                x1: "8",
                y1: "2",
                x2: "8",
                y2: "6"
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                lineNumber: 96,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                x1: "3",
                y1: "10",
                x2: "21",
                y2: "10"
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                lineNumber: 97,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
        lineNumber: 84,
        columnNumber: 5
    }, this);
}
function CalendarInput({ label, value, onChange }) {
    const [isOpen, setIsOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [visibleMonth, setVisibleMonth] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(()=>parseIsoDate(value));
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const selectedIso = value;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!isOpen) return;
        const handleDocumentClick = (event)=>{
            if (!(event.target instanceof Node)) return;
            if (!containerRef.current?.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleDocumentClick);
        return ()=>document.removeEventListener("mousedown", handleDocumentClick);
    }, [
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative flex flex-col gap-2",
        ref: containerRef,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-sm text-[#1D0A00]",
                children: label
            }, void 0, false, {
                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                lineNumber: 142,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                className: `${inputClassName} inline-flex cursor-pointer items-center justify-between text-left ${!value ? "text-black/40" : ""}`,
                onClick: ()=>setIsOpen((previous)=>!previous),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: value ? formatDate(value) : "Kies een datum"
                    }, void 0, false, {
                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                        lineNumber: 148,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(CalendarIcon, {}, void 0, false, {
                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                        lineNumber: 149,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                lineNumber: 143,
                columnNumber: 7
            }, this),
            isOpen ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute left-0 top-[86px] z-20 w-[320px] rounded-2xl border border-[#E3E3E3] bg-white p-4 shadow-[0_14px_28px_rgba(15,23,42,0.14)]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-3 flex items-center justify-between",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#E6C1D6] text-[#BD0265] transition-colors hover:bg-[#FCEFF6]",
                                onClick: ()=>setVisibleMonth((previous)=>new Date(previous.getFullYear(), previous.getMonth() - 1, 1)),
                                children: "<"
                            }, void 0, false, {
                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                lineNumber: 154,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-sm font-semibold capitalize text-[#1D0A00]",
                                children: monthTitle
                            }, void 0, false, {
                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                lineNumber: 170,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#E6C1D6] text-[#BD0265] transition-colors hover:bg-[#FCEFF6]",
                                onClick: ()=>setVisibleMonth((previous)=>new Date(previous.getFullYear(), previous.getMonth() + 1, 1)),
                                children: ">"
                            }, void 0, false, {
                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                lineNumber: 173,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                        lineNumber: 153,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-2 grid grid-cols-7 gap-1",
                        children: dayLabels.map((dayLabel)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-center text-xs font-semibold uppercase text-black/50",
                                children: dayLabel
                            }, dayLabel, false, {
                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                lineNumber: 192,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                        lineNumber: 190,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-7 gap-1",
                        children: calendarCells.map((calendarCell)=>{
                            const isoDate = toIsoDate(calendarCell.date);
                            const isSelected = isoDate === selectedIso;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                "data-iso-date": isoDate,
                                onClick: handleSelectDate,
                                className: `h-9 cursor-pointer rounded-lg text-sm transition-colors ${isSelected ? "bg-[#BD0265] text-white" : calendarCell.inCurrentMonth ? "text-[#1D0A00] hover:bg-[#F8E4EF]" : "text-black/35 hover:bg-[#F5F5F5]"}`,
                                children: calendarCell.date.getDate()
                            }, isoDate, false, {
                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                lineNumber: 205,
                                columnNumber: 17
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                        lineNumber: 200,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                lineNumber: 152,
                columnNumber: 9
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
        lineNumber: 141,
        columnNumber: 5
    }, this);
}
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
    const [formValues, setFormValues] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(initialValues);
    const [isReady, setIsReady] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isDownloading, setIsDownloading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isAutofillingAddress, setIsAutofillingAddress] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [hasAddressAutofilled, setHasAddressAutofilled] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const documentText = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$lib$2f$verwerkersovereenkomst$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["buildVerwerkersovereenkomst"])(formValues), [
        formValues
    ]);
    const handleSubmit = (event)=>{
        event.preventDefault();
        setIsReady(true);
    };
    const tryAutofillAddressDetails = async ()=>{
        if (!formValues.address.trim()) return;
        if (isAutofillingAddress) return;
        try {
            setIsAutofillingAddress(true);
            const query = encodeURIComponent(formValues.address.trim());
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${query}&accept-language=nl&email=contact@coachscribe.nl`);
            if (!response.ok) return;
            const results = await response.json();
            const result = results[0];
            if (!result?.address) return;
            const parsedCity = result.address.city ?? result.address.town ?? result.address.village ?? result.address.municipality ?? "";
            setFormValues((previous)=>({
                    ...previous,
                    postalCode: previous.postalCode || result.address?.postcode || "",
                    city: previous.city || parsedCity,
                    country: previous.country || result.address?.country || ""
                }));
            setHasAddressAutofilled(true);
        } catch  {
        // Optional enhancement only; ignore failures silently.
        } finally{
            setIsAutofillingAddress(false);
        }
    };
    const handleDownload = async ()=>{
        try {
            setIsDownloading(true);
            await downloadVerwerkersovereenkomstPdf(documentText, formValues.organizationName);
        } finally{
            setIsDownloading(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "w-full bg-[#F8F9F9]",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mx-auto w-full max-w-6xl p-6 py-12 md:p-10 md:py-16",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mx-auto flex w-full max-w-4xl flex-col gap-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-3xl font-semibold text-[#1D0A00] md:text-4xl xl:text-5xl",
                                children: "Verwerkersovereenkomst genereren"
                            }, void 0, false, {
                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                lineNumber: 324,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-base font-normal text-black/70 md:text-lg",
                                children: "Vul de gegevens in. Daarna kun je de verwerkersovereenkomst als CoachScribe PDF downloaden."
                            }, void 0, false, {
                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                lineNumber: 327,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                        lineNumber: 323,
                        columnNumber: 11
                    }, this),
                    !isReady ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                        onSubmit: handleSubmit,
                        className: "rounded-2xl border border-black/10 bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.06)] md:p-8",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid gap-4 md:grid-cols-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "flex flex-col gap-2 md:col-span-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm text-[#1D0A00]",
                                                children: "Naam organisatie*"
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 340,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                required: true,
                                                className: inputClassName,
                                                value: formValues.organizationName,
                                                onChange: (event)=>setFormValues((previous)=>({
                                                            ...previous,
                                                            organizationName: event.target.value
                                                        }))
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 343,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                        lineNumber: 339,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "flex flex-col gap-2 md:col-span-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm text-[#1D0A00]",
                                                children: "Adres*"
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 356,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                required: true,
                                                className: inputClassName,
                                                value: formValues.address,
                                                onChange: (event)=>setFormValues((previous)=>({
                                                            ...previous,
                                                            address: event.target.value
                                                        })),
                                                onBlur: tryAutofillAddressDetails
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 357,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                        lineNumber: 355,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "md:col-span-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: tryAutofillAddressDetails,
                                                disabled: isAutofillingAddress,
                                                className: "inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-[#BD0265] bg-white px-4 text-sm font-semibold text-[#BD0265] transition-colors hover:bg-[#FBE8F1] disabled:cursor-not-allowed disabled:opacity-70",
                                                children: isAutofillingAddress ? "Adresgegevens ophalen..." : "Vul postcode/plaats automatisch"
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 371,
                                                columnNumber: 19
                                            }, this),
                                            hasAddressAutofilled ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mt-2 text-xs text-black/50",
                                                children: "Adresgegevens zijn automatisch aangevuld via OpenStreetMap (gratis bron)."
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 382,
                                                columnNumber: 21
                                            }, this) : null
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                        lineNumber: 370,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "flex flex-col gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm text-[#1D0A00]",
                                                children: "Postcode*"
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 389,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                required: true,
                                                className: inputClassName,
                                                value: formValues.postalCode,
                                                onChange: (event)=>setFormValues((previous)=>({
                                                            ...previous,
                                                            postalCode: event.target.value
                                                        }))
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 390,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                        lineNumber: 388,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "flex flex-col gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm text-[#1D0A00]",
                                                children: "Plaats*"
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 403,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                required: true,
                                                className: inputClassName,
                                                value: formValues.city,
                                                onChange: (event)=>setFormValues((previous)=>({
                                                            ...previous,
                                                            city: event.target.value
                                                        }))
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 404,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                        lineNumber: 402,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "flex flex-col gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm text-[#1D0A00]",
                                                children: "Land*"
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 417,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                required: true,
                                                className: inputClassName,
                                                value: formValues.country,
                                                onChange: (event)=>setFormValues((previous)=>({
                                                            ...previous,
                                                            country: event.target.value
                                                        }))
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 418,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                        lineNumber: 416,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "flex flex-col gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm text-[#1D0A00]",
                                                children: "Voor- en achternaam contactpersoon*"
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 431,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                required: true,
                                                className: inputClassName,
                                                value: formValues.contactPersonFullName,
                                                onChange: (event)=>setFormValues((previous)=>({
                                                            ...previous,
                                                            contactPersonFullName: event.target.value
                                                        }))
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 434,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                        lineNumber: 430,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "flex flex-col gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm text-[#1D0A00]",
                                                children: "E-mail*"
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 447,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
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
                                                lineNumber: 448,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                        lineNumber: 446,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(CalendarInput, {
                                        label: "Ingangsdatum*",
                                        value: formValues.effectiveDate,
                                        onChange: (dateValue)=>setFormValues((previous)=>({
                                                    ...previous,
                                                    effectiveDate: dateValue
                                                }))
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                        lineNumber: 462,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "flex flex-col gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm text-[#1D0A00]",
                                                children: "Plaats*"
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 474,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                required: true,
                                                className: inputClassName,
                                                value: formValues.signingPlace,
                                                onChange: (event)=>setFormValues((previous)=>({
                                                            ...previous,
                                                            signingPlace: event.target.value
                                                        }))
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 475,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                        lineNumber: 473,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(CalendarInput, {
                                        label: "Datum*",
                                        value: formValues.signingDate,
                                        onChange: (dateValue)=>setFormValues((previous)=>({
                                                    ...previous,
                                                    signingDate: dateValue
                                                }))
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                        lineNumber: 488,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "flex flex-col gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm text-[#1D0A00]",
                                                children: "Voor- en achternaam ondertekenaar*"
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 500,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                required: true,
                                                className: inputClassName,
                                                value: formValues.signerFullName,
                                                onChange: (event)=>setFormValues((previous)=>({
                                                            ...previous,
                                                            signerFullName: event.target.value
                                                        }))
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 503,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                        lineNumber: 499,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "flex flex-col gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm text-[#1D0A00]",
                                                children: "Functie*"
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 516,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                required: true,
                                                className: inputClassName,
                                                value: formValues.signerRole,
                                                onChange: (event)=>setFormValues((previous)=>({
                                                            ...previous,
                                                            signerRole: event.target.value
                                                        }))
                                            }, void 0, false, {
                                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                                lineNumber: 517,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                        lineNumber: 515,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                lineNumber: 338,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-6",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "submit",
                                    className: "inline-flex h-12 cursor-pointer items-center gap-2 rounded-full border-2 border-[#BD0265] bg-[#BD0265] px-6 text-base font-semibold text-white transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#A00256] hover:bg-[#A00256]",
                                    children: "Maak verwerkersovereenkomst"
                                }, void 0, false, {
                                    fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                    lineNumber: 531,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                lineNumber: 530,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                        lineNumber: 334,
                        columnNumber: 13
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.06)] md:p-8",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-wrap items-center gap-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: handleDownload,
                                        disabled: isDownloading,
                                        className: "inline-flex h-12 cursor-pointer items-center gap-2 rounded-full border-2 border-[#BD0265] bg-[#BD0265] px-6 text-base font-semibold text-white transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#A00256] hover:bg-[#A00256] disabled:cursor-not-allowed disabled:opacity-70",
                                        children: isDownloading ? "PDF wordt gemaakt..." : "Download CoachScribe PDF"
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                        lineNumber: 542,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>setIsReady(false),
                                        className: "inline-flex h-12 cursor-pointer items-center gap-2 rounded-full border border-[#BD0265] bg-white px-6 text-base font-semibold text-[#BD0265] transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#FBE8F1]",
                                        children: "Gegevens aanpassen"
                                    }, void 0, false, {
                                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                        lineNumber: 552,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                lineNumber: 541,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Coachscribe$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                className: "max-h-[70vh] overflow-auto rounded-xl border border-[#E7E7E7] bg-[#FAFAFA] p-4 text-sm leading-relaxed whitespace-pre-wrap text-[#1D0A00]",
                                children: documentText
                            }, void 0, false, {
                                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                                lineNumber: 560,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                        lineNumber: 540,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
                lineNumber: 322,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
            lineNumber: 321,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Coachscribe/website/components/legal/VerwerkersovereenkomstFlow.tsx",
        lineNumber: 320,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=Coachscribe_website_d82ba200._.js.map