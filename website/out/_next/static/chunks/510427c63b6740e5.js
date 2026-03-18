(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,37761,e=>{"use strict";var t=e.i(99651),n=e.i(49870),r=e.i(38559);function a(e,t){let n=e.trim();return n.length>0?n:t}function s(e){let t=e.trim();if(0===t.length)return"[DATUM]";let n=new Date(t);return Number.isNaN(n.getTime())?t:new Intl.DateTimeFormat("nl-NL",{day:"2-digit",month:"2-digit",year:"numeric"}).format(n)}async function i(){let e=await fetch("/icon.svg");if(!e.ok)return null;let t=await e.text(),n=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(t)}`,r=await new Promise((e,t)=>{let r=new Image;r.onload=()=>e(r),r.onerror=t,r.src=n}),a=document.createElement("canvas");a.width=256,a.height=256;let s=a.getContext("2d");return s?(s.clearRect(0,0,a.width,a.height),s.drawImage(r,0,0,a.width,a.height),a.toDataURL("image/png")):null}async function l(t,n){let{jsPDF:r}=await e.A(42129),a=new r({unit:"pt",format:"a4"}),s=a.internal.pageSize.getWidth(),l=a.internal.pageSize.getHeight(),o=l-56,c=s-96,d=await i(),u=()=>{if(d)try{a.addImage(d,"PNG",s-48-26,48,26,26)}catch{}a.setDrawColor(189,2,101),a.line(48,l-62,s-48,l-62),a.setTextColor(96,96,96),a.setFont("helvetica","normal"),a.setFontSize(9),a.text("Rapply.nl  |  contact@Rapply.nl",48,l-44)};u();let g=78,m=e=>{g+e<=o||(a.addPage(),u(),a.setTextColor(29,10,0),g=78)},x=(e,t,n,r)=>{for(let s of(a.setFont("helvetica",t),a.setFontSize(n),a.setTextColor(29,10,0),a.splitTextToSize(e,c)))m(r),a.text(s,48,g),g+=r};for(let e of t.replace(/\r/g,"").split("\n")){let t=e.trim();if(!t){m(8),g+=8;continue}if((/^4\.\s+/.test(t)||/^9\.\s+/.test(t)||/^BIJLAGE\s+1\b/i.test(t))&&78!==g&&(a.addPage(),u(),a.setTextColor(29,10,0),g=78),t===t.toUpperCase()||/^BIJLAGE\s+\d+/i.test(t)||/^\d+\.\s+/.test(t)){m(24),g+=6,x(t,"bold",13,17),g+=2;continue}if(/^\d+\.\d+\s+/.test(t)||/^[A-Z]\.\s+/.test(t)){x(t,"bold",11.5,15);continue}if(t.trim().startsWith("- ")){let e=t.replace(/^- /,"").trim();x(`• ${e}`,"normal",10.8,14);continue}if(/^[^:]{2,40}:\s+.+$/.test(t)){let e=t.indexOf(":"),n=t.slice(0,e+1),r=t.slice(e+1).trim();x(n,"bold",10.8,14),x(r,"normal",10.8,14);continue}x(t,"normal",10.8,14)}let h=`verwerkersovereenkomst-${(n||"klant").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,60)}.pdf`;a.save(h)}let o="h-12 rounded-xl border border-[#DDDDDD] bg-white px-4 text-base font-normal text-[#1D0A00] outline-none transition-colors focus:border-[#BD0265]",c=["ma","di","wo","do","vr","za","zo"];function d(){return new Date().toISOString().slice(0,10)}function u(e){let[t,n,r]=e.split("-").map(Number);return new Date(t,n-1,r)}function g(){return(0,t.jsxs)("svg",{"aria-hidden":"true",viewBox:"0 0 24 24",className:"h-5 w-5 text-[#BD0265]",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,t.jsx)("rect",{x:"3",y:"4",width:"18",height:"18",rx:"2"}),(0,t.jsx)("line",{x1:"16",y1:"2",x2:"16",y2:"6"}),(0,t.jsx)("line",{x1:"8",y1:"2",x2:"8",y2:"6"}),(0,t.jsx)("line",{x1:"3",y1:"10",x2:"21",y2:"10"})]})}function m({label:e,value:n,onChange:a}){let[s,i]=(0,r.useState)(!1),[l,d]=(0,r.useState)(()=>u(n)),m=(0,r.useRef)(null);(0,r.useEffect)(()=>{if(!s)return;let e=e=>{e.target instanceof Node&&(m.current?.contains(e.target)||i(!1))};return document.addEventListener("mousedown",e),()=>document.removeEventListener("mousedown",e)},[s]);let x=new Intl.DateTimeFormat("nl-NL",{month:"long",year:"numeric"}).format(l),h=function(e){let t=e.getFullYear(),n=e.getMonth(),r=(new Date(t,n,1).getDay()+6)%7,a=new Date(t,n+1,0).getDate(),s=new Date(t,n,0).getDate(),i=[];for(let e=0;e<42;e+=1){let l=e-r+1;if(l<=0){i.push({date:new Date(t,n-1,s+l),inCurrentMonth:!1});continue}if(l>a){i.push({date:new Date(t,n+1,l-a),inCurrentMonth:!1});continue}i.push({date:new Date(t,n,l),inCurrentMonth:!0})}return i}(l),p=e=>{let t=e.currentTarget.dataset.isoDate;t&&(a(t),d(u(t)),i(!1))};return(0,t.jsxs)("div",{className:"relative flex flex-col gap-2",ref:m,children:[(0,t.jsx)("span",{className:"text-sm text-[#1D0A00]",children:e}),(0,t.jsxs)("button",{type:"button",className:`${o} inline-flex cursor-pointer items-center justify-between text-left ${!n?"text-black/40":""}`,onClick:()=>i(e=>!e),children:[(0,t.jsx)("span",{children:n?function(e){if(!e)return"";let t=u(e);return new Intl.DateTimeFormat("nl-NL",{day:"2-digit",month:"2-digit",year:"numeric"}).format(t)}(n):"Kies een datum"}),(0,t.jsx)(g,{})]}),s?(0,t.jsxs)("div",{className:"absolute left-0 top-[86px] z-20 w-[320px] rounded-2xl border border-[#E3E3E3] bg-white p-4 shadow-[0_14px_28px_rgba(15,23,42,0.14)]",children:[(0,t.jsxs)("div",{className:"mb-3 flex items-center justify-between",children:[(0,t.jsx)("button",{type:"button",className:"inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#E6C1D6] text-[#BD0265] transition-colors hover:bg-[#FCEFF6]",onClick:()=>d(e=>new Date(e.getFullYear(),e.getMonth()-1,1)),children:"<"}),(0,t.jsx)("span",{className:"text-sm font-semibold capitalize text-[#1D0A00]",children:x}),(0,t.jsx)("button",{type:"button",className:"inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#E6C1D6] text-[#BD0265] transition-colors hover:bg-[#FCEFF6]",onClick:()=>d(e=>new Date(e.getFullYear(),e.getMonth()+1,1)),children:">"})]}),(0,t.jsx)("div",{className:"mb-2 grid grid-cols-7 gap-1",children:c.map(e=>(0,t.jsx)("div",{className:"text-center text-xs font-semibold uppercase text-black/50",children:e},e))}),(0,t.jsx)("div",{className:"grid grid-cols-7 gap-1",children:h.map(e=>{var r;let a,s,i,l=(a=(r=e.date).getFullYear(),s=String(r.getMonth()+1).padStart(2,"0"),i=String(r.getDate()).padStart(2,"0"),`${a}-${s}-${i}`),o=l===n;return(0,t.jsx)("button",{type:"button","data-iso-date":l,onClick:p,className:`h-9 cursor-pointer rounded-lg text-sm transition-colors ${o?"bg-[#BD0265] text-white":e.inCurrentMonth?"text-[#1D0A00] hover:bg-[#F8E4EF]":"text-black/35 hover:bg-[#F5F5F5]"}`,children:e.date.getDate()},l)})})]}):null]})}let x={organizationName:"",address:"",postalCode:"",city:"",country:"Nederland",contactPersonFullName:"",contactEmail:"",effectiveDate:d(),signingPlace:"",signingDate:d(),signerFullName:"",signerRole:""};function h(){let e=(0,r.useId)(),[i,c]=(0,r.useState)(x),[d,u]=(0,r.useState)(!1),[g,h]=(0,r.useState)(!1),[p,v]=(0,r.useState)([]),b=(0,r.useRef)(!1),f=(0,r.useRef)(null),w=(0,r.useMemo)(()=>{let e,t,n,r,l,o,c,d,u,g,m,x;return e=a(i.organizationName,"[NAAM KLANT]"),t=a(i.address,"[ADRES KLANT]"),n=a(i.postalCode,"[POSTCODE KLANT]"),r=a(i.city,"[PLAATS KLANT]"),l=a(i.country,"[LAND KLANT]"),o=a(i.contactPersonFullName,"[VOOR- EN ACHTERNAAM CONTACTPERSOON]"),c=a(i.contactEmail,"[E-MAIL KLANT]"),d=s(i.effectiveDate),u=a(i.signingPlace,"[PLAATS]"),g=s(i.signingDate),m=a(i.signerFullName,"[VOOR- EN ACHTERNAAM ONDERTEKENAAR]"),x=a(i.signerRole,"[FUNCTIE]"),`VERWERKERSOVEREENKOMST Rapply

Deze verwerkersovereenkomst hoort bij het gebruik van Rapply.

1. Partijen

1.1 Verwerkingsverantwoordelijke
Naam organisatie: ${e}
Adres: ${t}
Postcode: ${n}
Plaats: ${r}
Land: ${l}
Contactpersoon (voor- en achternaam): ${o}
E-mail: ${c}

1.2 Verwerker
Naam: JNL Solutions
Adres: Stationsplein 26
Postcode en plaats: 6512 AB, Nijmegen
Land: Nederland
E-mail: contact@Rapply.nl
Website: https://www.Rapply.nl

2. Onderwerp en duur

Verwerker verwerkt persoonsgegevens voor Verwerkingsverantwoordelijke bij het leveren van Rapply, zoals beschreven in Bijlage 1.
Deze verwerkersovereenkomst geldt vanaf ${d} en loopt zolang Verwerker persoonsgegevens verwerkt voor Verwerkingsverantwoordelijke in het kader van Rapply.

3. Instructies en doelbinding

Verwerker verwerkt persoonsgegevens uitsluitend:
- om Rapply te leveren zoals afgesproken met Verwerkingsverantwoordelijke; en
- op basis van schriftelijke of aantoonbare instructies van Verwerkingsverantwoordelijke.

4. Vertrouwelijkheid en beveiliging

Verwerker treft passende technische en organisatorische maatregelen. De belangrijkste maatregelen staan in Bijlage 2.
Verwerker zorgt ervoor dat personen met toegang tot persoonsgegevens gebonden zijn aan geheimhouding.

5. Subverwerkers

Verwerkingsverantwoordelijke geeft algemene toestemming voor het inschakelen van subverwerkers die nodig zijn voor Rapply.
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

Plaats: ${u}
Datum: ${g}

Voor Verwerkingsverantwoordelijke
Naam: ${m}
Functie: ${x}
Handtekening: ______________________

Voor Verwerker (JNL Solutions)
Naam: [NAAM]
Functie: [FUNCTIE]
Handtekening: ______________________

BIJLAGE 1 - Omschrijving van de verwerking

A. Doeleinden
- account en authenticatie via Microsoft Entra;
- opslag en beheer van gegevens die Verwerkingsverantwoordelijke in Rapply invoert;
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
`},[i]);(0,r.useEffect)(()=>{let e=i.address.trim();if(e.length<3)return void v([]);if(b.current){b.current=!1;return}let t=new AbortController,n=window.setTimeout(async()=>{try{let n=encodeURIComponent(e),r=await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&addressdetails=1&countrycodes=nl&q=${n}&accept-language=nl`,{signal:t.signal});if(!r.ok)return;let a=(await r.json()).map(e=>{let t=e.address?.road??e.address?.pedestrian??e.address?.residential??"",n=e.address?.house_number??"",r=e.address?.postcode??"",a=e.address?.city??e.address?.town??e.address?.village??e.address?.municipality??"";if(!t||!r||!a)return null;let s=`${t}${n?` ${n}`:""}`.trim();return{label:`${s}, ${r} ${a}`,address:s,postalCode:r,city:a,country:e.address?.country??"Nederland"}}).filter(e=>!!e),s=a.filter((e,t)=>a.findIndex(t=>t.label===e.label)===t);v(s.slice(0,6))}catch{}},250);return()=>{t.abort(),window.clearTimeout(n)}},[i.address]),(0,r.useEffect)(()=>{if(!p.length)return;let e=e=>{e.target instanceof Node&&(f.current?.contains(e.target)||v([]))};return document.addEventListener("mousedown",e),()=>document.removeEventListener("mousedown",e)},[p.length]);let j=async()=>{try{h(!0),await l(w,i.organizationName)}finally{h(!1)}},N=w.replace(/\r/g,"").split("\n");return(0,t.jsx)("section",{className:"w-full bg-[#F8F9F9]",children:(0,t.jsx)("div",{className:"mx-auto w-full max-w-6xl px-6 pb-12 pt-6 md:px-10 md:pb-16 md:pt-10",children:(0,t.jsxs)("div",{className:"mx-auto flex w-full max-w-4xl flex-col gap-8",children:[(0,t.jsxs)("div",{className:"flex flex-col gap-3",children:[(0,t.jsx)("h1",{className:"text-3xl font-semibold text-[#1D0A00] md:text-4xl xl:text-5xl",children:"Verwerkersovereenkomst genereren"}),(0,t.jsx)("p",{className:"text-base font-normal text-black/70 md:text-lg",children:"Vul de gegevens in. Daarna kun je de verwerkersovereenkomst als Rapply PDF downloaden."})]}),d?(0,t.jsxs)("div",{className:"page-enter-animation flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.06)] md:p-8",children:[(0,t.jsxs)("div",{className:"flex flex-wrap items-center gap-3",children:[(0,t.jsx)("button",{type:"button",onClick:j,disabled:g,className:"inline-flex h-12 min-w-[260px] cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-[#BD0265] bg-[#BD0265] px-6 text-base font-semibold text-white transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#A00256] hover:bg-[#A00256] disabled:cursor-not-allowed disabled:opacity-70",children:g?"PDF wordt gemaakt...":"Download Rapply PDF"}),(0,t.jsx)("button",{type:"button",onClick:()=>u(!1),className:"inline-flex h-12 cursor-pointer items-center gap-2 rounded-full border border-[#BD0265] bg-white px-6 text-base font-semibold text-[#BD0265] transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#FBE8F1]",children:"Gegevens aanpassen"})]}),(0,t.jsxs)("article",{className:"rounded-xl border border-[#E7E7E7] bg-white p-6",children:[(0,t.jsx)("div",{className:"mb-5 flex justify-end",children:(0,t.jsx)(n.default,{src:"/icon.svg",alt:"Rapply logo",width:26,height:26})}),(0,t.jsx)("div",{className:"flex flex-col gap-1 text-[#1D0A00]",children:N.map((e,n)=>{let r=e.trim();if(!r)return(0,t.jsx)("div",{className:"h-2"},`empty-${n}`);if(r===r.toUpperCase()||/^BIJLAGE\s+\d+/i.test(r)||/^\d+\.\s+/.test(r))return(0,t.jsx)("h3",{className:"pt-2 text-[16px] font-bold leading-[1.35]",children:r},`main-${n}`);if(/^\d+\.\d+\s+/.test(r)||/^[A-Z]\.\s+/.test(r))return(0,t.jsx)("h4",{className:"text-[14px] font-semibold leading-[1.35]",children:r},`sub-${n}`);if(r.trim().startsWith("- "))return(0,t.jsxs)("p",{className:"pl-3 text-[13.5px] leading-[1.45]",children:["• ",r.replace(/^- /,"").trim()]},`bullet-${n}`);if(/^[^:]{2,40}:\s+.+$/.test(r)){let e=r.indexOf(":"),a=r.slice(0,e+1),s=r.slice(e+1).trim();return(0,t.jsxs)("p",{className:"text-[13.5px] leading-[1.45]",children:[(0,t.jsx)("strong",{children:a})," ",s]},`label-${n}`)}return(0,t.jsx)("p",{className:"text-[13.5px] leading-[1.45]",children:r},`line-${n}`)})}),(0,t.jsx)("div",{className:"mt-5 border-t border-[#BD0265] pt-3 text-[11px] text-[#606060]",children:"Rapply.nl | contact@Rapply.nl"})]})]}):(0,t.jsxs)("form",{onSubmit:e=>{e.preventDefault(),u(!0)},className:"page-enter-animation rounded-2xl border border-black/10 bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.06)] md:p-8",children:[(0,t.jsxs)("div",{className:"grid gap-4 md:grid-cols-2",children:[(0,t.jsxs)("label",{className:"flex flex-col gap-2 md:col-span-2",children:[(0,t.jsx)("span",{className:"text-sm text-[#1D0A00]",children:"Naam organisatie*"}),(0,t.jsx)("input",{required:!0,className:o,value:i.organizationName,onChange:e=>c(t=>({...t,organizationName:e.target.value}))})]}),(0,t.jsxs)("label",{ref:f,htmlFor:e,className:"relative flex flex-col gap-2 md:col-span-2",children:[(0,t.jsx)("span",{className:"text-sm text-[#1D0A00]",children:"Adres*"}),(0,t.jsx)("input",{id:e,required:!0,className:o,value:i.address,onChange:e=>c(t=>({...t,address:e.target.value}))}),(0,t.jsx)("div",{className:`absolute left-0 right-0 top-[86px] z-20 max-h-56 overflow-auto rounded-xl bg-white shadow-[0_12px_24px_rgba(15,23,42,0.12)] transition-all duration-200 ease-out ${p.length>0?"translate-y-0 border border-[#E3E3E3] opacity-100":"-translate-y-1 border border-transparent opacity-0 pointer-events-none"}`,children:p.map((e,n)=>(0,t.jsx)("button",{type:"button",onMouseDown:t=>{t.preventDefault(),b.current=!0,c(t=>({...t,address:e.address,postalCode:e.postalCode||t.postalCode,city:e.city||t.city,country:e.country||t.country})),v([])},className:"w-full cursor-pointer border-b border-[#F0F0F0] px-4 py-3 text-left text-sm text-[#1D0A00] transition-colors hover:bg-[#FBE8F1] last:border-b-0",children:e.label},`${e.label}-${n}`))})]}),(0,t.jsxs)("label",{className:"flex flex-col gap-2",children:[(0,t.jsx)("span",{className:"text-sm text-[#1D0A00]",children:"Postcode*"}),(0,t.jsx)("input",{required:!0,className:o,value:i.postalCode,onChange:e=>c(t=>({...t,postalCode:e.target.value}))})]}),(0,t.jsxs)("label",{className:"flex flex-col gap-2",children:[(0,t.jsx)("span",{className:"text-sm text-[#1D0A00]",children:"Plaats*"}),(0,t.jsx)("input",{required:!0,className:o,value:i.city,onChange:e=>c(t=>({...t,city:e.target.value}))})]}),(0,t.jsxs)("label",{className:"flex flex-col gap-2",children:[(0,t.jsx)("span",{className:"text-sm text-[#1D0A00]",children:"Land*"}),(0,t.jsx)("input",{required:!0,className:o,value:i.country,onChange:e=>c(t=>({...t,country:e.target.value}))})]}),(0,t.jsxs)("label",{className:"flex flex-col gap-2",children:[(0,t.jsx)("span",{className:"text-sm text-[#1D0A00]",children:"Voor- en achternaam contactpersoon*"}),(0,t.jsx)("input",{required:!0,className:o,value:i.contactPersonFullName,onChange:e=>c(t=>({...t,contactPersonFullName:e.target.value}))})]}),(0,t.jsxs)("label",{className:"flex flex-col gap-2",children:[(0,t.jsx)("span",{className:"text-sm text-[#1D0A00]",children:"E-mail*"}),(0,t.jsx)("input",{required:!0,type:"email",className:o,value:i.contactEmail,onChange:e=>c(t=>({...t,contactEmail:e.target.value}))})]}),(0,t.jsx)(m,{label:"Ingangsdatum*",value:i.effectiveDate,onChange:e=>c(t=>({...t,effectiveDate:e}))}),(0,t.jsxs)("label",{className:"flex flex-col gap-2",children:[(0,t.jsx)("span",{className:"text-sm text-[#1D0A00]",children:"Plaats*"}),(0,t.jsx)("input",{required:!0,className:o,value:i.signingPlace,onChange:e=>c(t=>({...t,signingPlace:e.target.value}))})]}),(0,t.jsx)(m,{label:"Datum*",value:i.signingDate,onChange:e=>c(t=>({...t,signingDate:e}))}),(0,t.jsxs)("label",{className:"flex flex-col gap-2",children:[(0,t.jsx)("span",{className:"text-sm text-[#1D0A00]",children:"Voor- en achternaam ondertekenaar*"}),(0,t.jsx)("input",{required:!0,className:o,value:i.signerFullName,onChange:e=>c(t=>({...t,signerFullName:e.target.value}))})]}),(0,t.jsxs)("label",{className:"flex flex-col gap-2",children:[(0,t.jsx)("span",{className:"text-sm text-[#1D0A00]",children:"Functie*"}),(0,t.jsx)("input",{required:!0,className:o,value:i.signerRole,onChange:e=>c(t=>({...t,signerRole:e.target.value}))})]})]}),(0,t.jsx)("div",{className:"mt-6",children:(0,t.jsx)("button",{type:"submit",className:"inline-flex h-12 cursor-pointer items-center gap-2 rounded-full border-2 border-[#BD0265] bg-[#BD0265] px-6 text-base font-semibold text-white transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#A00256] hover:bg-[#A00256]",children:"Maak verwerkersovereenkomst"})})]})]})})})}e.s(["default",()=>h],37761)},42129,e=>{e.v(t=>Promise.all(["static/chunks/a7b9c9e2fa85e90d.js","static/chunks/718767c25012dce2.js"].map(t=>e.l(t))).then(()=>t(4506)))}]);