module.exports=[93695,(a,b,c)=>{b.exports=a.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},41699,a=>{a.n(a.i(1177))},96549,a=>{a.n(a.i(93671))},60305,a=>{a.n(a.i(65e3))},27442,a=>{a.n(a.i(94922))},94881,a=>{a.n(a.i(11502))},2891,a=>{a.n(a.i(78826))},58744,a=>{a.n(a.i(33957))},53471,a=>{"use strict";var b=a.i(83980);function c(a){return a.toLowerCase().replace(/[^a-z0-9\s-]/g,"").trim().replace(/\s+/g,"-").slice(0,60)}function d(a,c){return(function(a){if(!/[ÃÂâ]/.test(a))return a;try{let b=Uint8Array.from(a,a=>a.charCodeAt(0));return new TextDecoder("utf-8").decode(b)}catch{return a}})(a).split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean).map((a,d)=>{let e=`${c}-${d}`;if(a.startsWith("**")&&a.endsWith("**"))return(0,b.jsx)("strong",{children:a.slice(2,-2)},e);if(a.startsWith("`")&&a.endsWith("`"))return(0,b.jsx)("code",{className:"rounded bg-[#EEF0FF] px-1.5 py-0.5 text-[0.95em] text-[#243747]",children:a.slice(1,-1)},e);let f=a.split("\n");return(0,b.jsx)("span",{children:f.map((a,c)=>(0,b.jsxs)("span",{children:[a,c<f.length-1?(0,b.jsx)("br",{}):null]},`${e}-line-${c}`))},e)})}function e({title:a,subtitle:e,markdown:f}){let g=function(a){let b=a.replace(/\r/g,"").split("\n");if(!b.some(a=>{let b=a.trim();return/^#{1,6}\s+/.test(b)||/^-\s+/.test(b)||"---"===b})){let a=b.map(a=>a.trim()).filter(Boolean),d=[],e=0,f=[],g=!1,h=()=>{0!==f.length&&(d.push({type:"list",id:`l-${e++}`,items:[...f]}),f=[])};return a.forEach((a,b)=>{if(0===b||a.length<=70&&!/[.:;!?]$/.test(a)){h(),d.push({type:"heading",id:`h-${c(a)}-${e++}`,level:0===b?2:3,text:a}),g=!1;return}g&&a.length<=140?f.push(a):(h(),d.push({type:"paragraph",id:`p-${e++}`,text:a}),g=a.endsWith(":"))}),h(),d}let d=[],e=[],f=[],g=0,h=()=>{0!==e.length&&(d.push({type:"paragraph",id:`p-${g++}`,text:e.join("\n").trim()}),e=[])},i=()=>{0!==f.length&&(d.push({type:"list",id:`l-${g++}`,items:[...f]}),f=[])};for(let a of b){let b=a.trim();if(0===b.length){h(),i();continue}if("---"===b){h(),i(),d.push({type:"divider",id:`d-${g++}`});continue}let j=b.match(/^(#{1,6})\s+(.+)$/);if(j){h(),i();let a=j[1].length,b=j[2].trim();d.push({type:"heading",id:`h-${c(b)}-${g++}`,level:a,text:b});continue}let k=b.match(/^-\s+(.+)$/);if(k){h(),f.push(k[1].trim());continue}i(),e.push(b)}return h(),i(),d}(f);return(0,b.jsx)("section",{className:"w-full bg-white",children:(0,b.jsx)("div",{className:"mx-auto w-full max-w-6xl p-6 py-12 md:p-10 md:py-16",children:(0,b.jsxs)("div",{className:"mx-auto flex w-full max-w-4xl flex-col gap-8",children:[(0,b.jsxs)("div",{className:"flex flex-col gap-3",children:[(0,b.jsx)("h1",{className:"text-3xl font-semibold text-[#1D0A00] md:text-4xl xl:text-5xl",children:a}),e?(0,b.jsx)("p",{className:"text-base font-normal text-black/70 md:text-lg",children:e}):null]}),(0,b.jsx)("article",{className:"rounded-2xl border border-black/10 bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.06)] md:p-8",children:(0,b.jsx)("div",{className:"flex flex-col gap-5 text-base font-normal leading-relaxed text-[#1D0A00]",children:g.map(a=>{if("divider"===a.type)return(0,b.jsx)("hr",{className:"border-black/10"},a.id);if("heading"===a.type){let c={1:"text-2xl font-semibold text-[#1D0A00]",2:"text-xl font-semibold text-[#1D0A00]",3:"text-lg font-semibold text-[#1D0A00]",4:"text-base font-semibold text-[#1D0A00]",5:"text-base font-semibold text-[#1D0A00]",6:"text-base font-semibold text-[#1D0A00]"},e=Math.min(a.level+1,6);return 2===e?(0,b.jsx)("h2",{id:a.id,className:c[a.level],children:d(a.text,a.id)},a.id):3===e?(0,b.jsx)("h3",{id:a.id,className:c[a.level],children:d(a.text,a.id)},a.id):4===e?(0,b.jsx)("h4",{id:a.id,className:c[a.level],children:d(a.text,a.id)},a.id):5===e?(0,b.jsx)("h5",{id:a.id,className:c[a.level],children:d(a.text,a.id)},a.id):6===e?(0,b.jsx)("h6",{id:a.id,className:c[a.level],children:d(a.text,a.id)},a.id):(0,b.jsx)("h1",{id:a.id,className:c[a.level],children:d(a.text,a.id)},a.id)}return"list"===a.type?(0,b.jsx)("ul",{className:"list-disc pl-6",children:a.items.map((c,e)=>(0,b.jsx)("li",{children:d(c,`${a.id}-${e}`)},`${a.id}-${e}`))},a.id):(0,b.jsx)("p",{children:d(a.text,a.id)},a.id)})})})]})})})}a.s(["default",()=>e])},96441,a=>{"use strict";var b=a.i(83980),c=a.i(53471);let d=`## Hoe geef ik toestemming voor het opnemen van een gesprek?

Wanneer je een gesprek opneemt, is het belangrijk dat alle betrokkenen hiervan op de hoogte zijn en toestemming geven.

Als coach ben jij verantwoordelijk voor het zorgvuldig omgaan met vertrouwelijke informatie. CoachScribe helpt je daarbij, maar jij blijft verantwoordelijk voor het verkrijgen van toestemming.

## Wanneer heb ik toestemming nodig?

In de meeste situaties geldt:

- Je mag een gesprek niet heimelijk opnemen.
- De andere persoon moet weten dat het gesprek wordt opgenomen.
- De andere persoon moet hier expliciet mee instemmen.

Twijfel je? Vraag altijd toestemming. Transparantie voorkomt problemen.

## Hoe vraag ik toestemming op een professionele manier?

Hier zijn drie manieren die in de praktijk goed werken:

### 1. Mondelinge toestemming (aanbevolen)

Begin het gesprek bijvoorbeeld met:

"Voor mijn verslaglegging gebruik ik een opname-tool. Vind je het goed dat ik dit gesprek opneem?"

Wacht op een duidelijke "ja" voordat je start met opnemen.

Je kunt dit ook laten vastleggen aan het begin van de opname.

### 2. Schriftelijke toestemming vooraf

Je kunt vooraf een korte bevestiging sturen per e-mail of in je intakeformulier.

Voorbeeld:

"Tijdens onze sessies maak ik gebruik van een opname-tool voor verslaglegging. De opname wordt veilig verwerkt. Ga je hiermee akkoord?"

Laat de coachee dit bevestigen.

### 3. Opnemen in je coachovereenkomst

Je kunt in je algemene voorwaarden of coachovereenkomst opnemen dat sessies (met toestemming) mogen worden opgenomen voor verslaglegging.

Belangrijk: blijf het alsnog bij elke sessie kort benoemen.

## Wat gebeurt er met de opname?

- De opname wordt gebruikt om een transcriptie en samenvatting te maken.
- De gegevens worden beveiligd opgeslagen.
- Alleen jij (en eventueel de coachee als jij dat deelt) hebben toegang.

Wil je meer weten over privacy en beveiliging? Bekijk onze privacyverklaring op /privacybeleid.

## Wat als iemand geen toestemming geeft?

Dan neem je het gesprek niet op.

Je kunt er dan voor kiezen om handmatig notities te maken zoals je gewend bent.

## Twijfel over de regels?

Wetgeving rondom privacy verschilt per land en situatie. CoachScribe geeft geen juridisch advies.

Bij twijfel raden we aan juridisch advies in te winnen of de richtlijnen van jouw beroepsorganisatie te raadplegen.
`;function e(){return(0,b.jsx)(c.default,{title:"Toestemming vragen voor opname",subtitle:"Richtlijnen voor duidelijke en zorgvuldige toestemming bij het opnemen van gesprekken.",markdown:d})}a.s(["default",()=>e])}];

//# sourceMappingURL=%5Broot-of-the-server%5D__68613f08._.js.map