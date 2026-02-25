module.exports=[7573,a=>{"use strict";var b=a.i(72507),c=a.i(33294),d=a.i(91920);function e(a,b){let c=a.trim();return c.length>0?c:b}function f(a){let b=a.trim();if(0===b.length)return"[DATUM]";let c=new Date(b);return Number.isNaN(c.getTime())?b:new Intl.DateTimeFormat("nl-NL",{day:"2-digit",month:"2-digit",year:"numeric"}).format(c)}async function g(){let a=await fetch("/icon.svg");if(!a.ok)return null;let b=await a.text(),c=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(b)}`,d=await new Promise((a,b)=>{let d=new Image;d.onload=()=>a(d),d.onerror=b,d.src=c}),e=document.createElement("canvas");e.width=256,e.height=256;let f=e.getContext("2d");return f?(f.clearRect(0,0,e.width,e.height),f.drawImage(d,0,0,e.width,e.height),e.toDataURL("image/png")):null}async function h(b,c){let{jsPDF:d}=await a.A(66005),e=new d({unit:"pt",format:"a4"}),f=e.internal.pageSize.getWidth(),h=e.internal.pageSize.getHeight(),i=h-56,j=f-96,k=await g(),l=()=>{if(k)try{e.addImage(k,"PNG",f-48-26,48,26,26)}catch{}e.setDrawColor(189,2,101),e.line(48,h-62,f-48,h-62),e.setTextColor(96,96,96),e.setFont("helvetica","normal"),e.setFontSize(9),e.text("coachscribe.nl  |  contact@coachscribe.nl",48,h-44)};l();let m=78,n=a=>{m+a<=i||(e.addPage(),l(),e.setTextColor(29,10,0),m=78)},o=(a,b,c,d)=>{for(let f of(e.setFont("helvetica",b),e.setFontSize(c),e.setTextColor(29,10,0),e.splitTextToSize(a,j)))n(d),e.text(f,48,m),m+=d};for(let a of b.replace(/\r/g,"").split("\n")){let b=a.trim();if(!b){n(8),m+=8;continue}if((/^4\.\s+/.test(b)||/^9\.\s+/.test(b)||/^BIJLAGE\s+1\b/i.test(b))&&78!==m&&(e.addPage(),l(),e.setTextColor(29,10,0),m=78),b===b.toUpperCase()||/^BIJLAGE\s+\d+/i.test(b)||/^\d+\.\s+/.test(b)){n(24),m+=6,o(b,"bold",13,17),m+=2;continue}if(/^\d+\.\d+\s+/.test(b)||/^[A-Z]\.\s+/.test(b)){o(b,"bold",11.5,15);continue}if(b.trim().startsWith("- ")){let a=b.replace(/^- /,"").trim();o(`• ${a}`,"normal",10.8,14);continue}if(/^[^:]{2,40}:\s+.+$/.test(b)){let a=b.indexOf(":"),c=b.slice(0,a+1),d=b.slice(a+1).trim();o(c,"bold",10.8,14),o(d,"normal",10.8,14);continue}o(b,"normal",10.8,14)}let p=`verwerkersovereenkomst-${(c||"klant").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,60)}.pdf`;e.save(p)}let i="h-12 rounded-xl border border-[#DDDDDD] bg-white px-4 text-base font-normal text-[#1D0A00] outline-none transition-colors focus:border-[#BD0265]",j=["ma","di","wo","do","vr","za","zo"];function k(){return new Date().toISOString().slice(0,10)}function l(a){let[b,c,d]=a.split("-").map(Number);return new Date(b,c-1,d)}function m(){return(0,b.jsxs)("svg",{"aria-hidden":"true",viewBox:"0 0 24 24",className:"h-5 w-5 text-[#BD0265]",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,b.jsx)("rect",{x:"3",y:"4",width:"18",height:"18",rx:"2"}),(0,b.jsx)("line",{x1:"16",y1:"2",x2:"16",y2:"6"}),(0,b.jsx)("line",{x1:"8",y1:"2",x2:"8",y2:"6"}),(0,b.jsx)("line",{x1:"3",y1:"10",x2:"21",y2:"10"})]})}function n({label:a,value:c,onChange:e}){let[f,g]=(0,d.useState)(!1),[h,k]=(0,d.useState)(()=>l(c)),n=(0,d.useRef)(null);(0,d.useEffect)(()=>{if(!f)return;let a=a=>{a.target instanceof Node&&(n.current?.contains(a.target)||g(!1))};return document.addEventListener("mousedown",a),()=>document.removeEventListener("mousedown",a)},[f]);let o=new Intl.DateTimeFormat("nl-NL",{month:"long",year:"numeric"}).format(h),p=function(a){let b=a.getFullYear(),c=a.getMonth(),d=(new Date(b,c,1).getDay()+6)%7,e=new Date(b,c+1,0).getDate(),f=new Date(b,c,0).getDate(),g=[];for(let a=0;a<42;a+=1){let h=a-d+1;if(h<=0){g.push({date:new Date(b,c-1,f+h),inCurrentMonth:!1});continue}if(h>e){g.push({date:new Date(b,c+1,h-e),inCurrentMonth:!1});continue}g.push({date:new Date(b,c,h),inCurrentMonth:!0})}return g}(h),q=a=>{let b=a.currentTarget.dataset.isoDate;b&&(e(b),k(l(b)),g(!1))};return(0,b.jsxs)("div",{className:"relative flex flex-col gap-2",ref:n,children:[(0,b.jsx)("span",{className:"text-sm text-[#1D0A00]",children:a}),(0,b.jsxs)("button",{type:"button",className:`${i} inline-flex cursor-pointer items-center justify-between text-left ${!c?"text-black/40":""}`,onClick:()=>g(a=>!a),children:[(0,b.jsx)("span",{children:c?function(a){if(!a)return"";let b=l(a);return new Intl.DateTimeFormat("nl-NL",{day:"2-digit",month:"2-digit",year:"numeric"}).format(b)}(c):"Kies een datum"}),(0,b.jsx)(m,{})]}),f?(0,b.jsxs)("div",{className:"absolute left-0 top-[86px] z-20 w-[320px] rounded-2xl border border-[#E3E3E3] bg-white p-4 shadow-[0_14px_28px_rgba(15,23,42,0.14)]",children:[(0,b.jsxs)("div",{className:"mb-3 flex items-center justify-between",children:[(0,b.jsx)("button",{type:"button",className:"inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#E6C1D6] text-[#BD0265] transition-colors hover:bg-[#FCEFF6]",onClick:()=>k(a=>new Date(a.getFullYear(),a.getMonth()-1,1)),children:"<"}),(0,b.jsx)("span",{className:"text-sm font-semibold capitalize text-[#1D0A00]",children:o}),(0,b.jsx)("button",{type:"button",className:"inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#E6C1D6] text-[#BD0265] transition-colors hover:bg-[#FCEFF6]",onClick:()=>k(a=>new Date(a.getFullYear(),a.getMonth()+1,1)),children:">"})]}),(0,b.jsx)("div",{className:"mb-2 grid grid-cols-7 gap-1",children:j.map(a=>(0,b.jsx)("div",{className:"text-center text-xs font-semibold uppercase text-black/50",children:a},a))}),(0,b.jsx)("div",{className:"grid grid-cols-7 gap-1",children:p.map(a=>{var d;let e,f,g,h=(e=(d=a.date).getFullYear(),f=String(d.getMonth()+1).padStart(2,"0"),g=String(d.getDate()).padStart(2,"0"),`${e}-${f}-${g}`),i=h===c;return(0,b.jsx)("button",{type:"button","data-iso-date":h,onClick:q,className:`h-9 cursor-pointer rounded-lg text-sm transition-colors ${i?"bg-[#BD0265] text-white":a.inCurrentMonth?"text-[#1D0A00] hover:bg-[#F8E4EF]":"text-black/35 hover:bg-[#F5F5F5]"}`,children:a.date.getDate()},h)})})]}):null]})}let o={organizationName:"",address:"",postalCode:"",city:"",country:"Nederland",contactPersonFullName:"",contactEmail:"",effectiveDate:k(),signingPlace:"",signingDate:k(),signerFullName:"",signerRole:""};function p(){let a=(0,d.useId)(),[g,j]=(0,d.useState)(o),[k,l]=(0,d.useState)(!1),[m,p]=(0,d.useState)(!1),[q,r]=(0,d.useState)([]),s=(0,d.useRef)(!1),t=(0,d.useRef)(null),u=(0,d.useMemo)(()=>{let a,b,c,d,h,i,j,k,l,m,n,o;return a=e(g.organizationName,"[NAAM KLANT]"),b=e(g.address,"[ADRES KLANT]"),c=e(g.postalCode,"[POSTCODE KLANT]"),d=e(g.city,"[PLAATS KLANT]"),h=e(g.country,"[LAND KLANT]"),i=e(g.contactPersonFullName,"[VOOR- EN ACHTERNAAM CONTACTPERSOON]"),j=e(g.contactEmail,"[E-MAIL KLANT]"),k=f(g.effectiveDate),l=e(g.signingPlace,"[PLAATS]"),m=f(g.signingDate),n=e(g.signerFullName,"[VOOR- EN ACHTERNAAM ONDERTEKENAAR]"),o=e(g.signerRole,"[FUNCTIE]"),`VERWERKERSOVEREENKOMST COACHSCRIBE

Deze verwerkersovereenkomst hoort bij het gebruik van CoachScribe.

1. Partijen

1.1 Verwerkingsverantwoordelijke
Naam organisatie: ${a}
Adres: ${b}
Postcode: ${c}
Plaats: ${d}
Land: ${h}
Contactpersoon (voor- en achternaam): ${i}
E-mail: ${j}

1.2 Verwerker
Naam: JNL Solutions
Adres: Stationsplein 26
Postcode en plaats: 6512 AB, Nijmegen
Land: Nederland
E-mail: contact@coachscribe.nl
Website: https://www.coachscribe.nl

2. Onderwerp en duur

Verwerker verwerkt persoonsgegevens voor Verwerkingsverantwoordelijke bij het leveren van CoachScribe, zoals beschreven in Bijlage 1.
Deze verwerkersovereenkomst geldt vanaf ${k} en loopt zolang Verwerker persoonsgegevens verwerkt voor Verwerkingsverantwoordelijke in het kader van CoachScribe.

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

Plaats: ${l}
Datum: ${m}

Voor Verwerkingsverantwoordelijke
Naam: ${n}
Functie: ${o}
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
`},[g]);(0,d.useEffect)(()=>{let a=g.address.trim();if(a.length<3)return void r([]);if(s.current){s.current=!1;return}let b=new AbortController,c=window.setTimeout(async()=>{try{let c=encodeURIComponent(a),d=await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&addressdetails=1&countrycodes=nl&q=${c}&accept-language=nl`,{signal:b.signal});if(!d.ok)return;let e=(await d.json()).map(a=>{let b=a.address?.road??a.address?.pedestrian??a.address?.residential??"",c=a.address?.house_number??"",d=a.address?.postcode??"",e=a.address?.city??a.address?.town??a.address?.village??a.address?.municipality??"";if(!b||!d||!e)return null;let f=`${b}${c?` ${c}`:""}`.trim();return{label:`${f}, ${d} ${e}`,address:f,postalCode:d,city:e,country:a.address?.country??"Nederland"}}).filter(a=>!!a),f=e.filter((a,b)=>e.findIndex(b=>b.label===a.label)===b);r(f.slice(0,6))}catch{}},250);return()=>{b.abort(),window.clearTimeout(c)}},[g.address]),(0,d.useEffect)(()=>{if(!q.length)return;let a=a=>{a.target instanceof Node&&(t.current?.contains(a.target)||r([]))};return document.addEventListener("mousedown",a),()=>document.removeEventListener("mousedown",a)},[q.length]);let v=async()=>{try{p(!0),await h(u,g.organizationName)}finally{p(!1)}},w=u.replace(/\r/g,"").split("\n");return(0,b.jsx)("section",{className:"w-full bg-[#F8F9F9]",children:(0,b.jsx)("div",{className:"mx-auto w-full max-w-6xl px-6 pb-12 pt-6 md:px-10 md:pb-16 md:pt-10",children:(0,b.jsxs)("div",{className:"mx-auto flex w-full max-w-4xl flex-col gap-8",children:[(0,b.jsxs)("div",{className:"flex flex-col gap-3",children:[(0,b.jsx)("h1",{className:"text-3xl font-semibold text-[#1D0A00] md:text-4xl xl:text-5xl",children:"Verwerkersovereenkomst genereren"}),(0,b.jsx)("p",{className:"text-base font-normal text-black/70 md:text-lg",children:"Vul de gegevens in. Daarna kun je de verwerkersovereenkomst als CoachScribe PDF downloaden."})]}),k?(0,b.jsxs)("div",{className:"page-enter-animation flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.06)] md:p-8",children:[(0,b.jsxs)("div",{className:"flex flex-wrap items-center gap-3",children:[(0,b.jsx)("button",{type:"button",onClick:v,disabled:m,className:"inline-flex h-12 min-w-[260px] cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-[#BD0265] bg-[#BD0265] px-6 text-base font-semibold text-white transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#A00256] hover:bg-[#A00256] disabled:cursor-not-allowed disabled:opacity-70",children:m?"PDF wordt gemaakt...":"Download CoachScribe PDF"}),(0,b.jsx)("button",{type:"button",onClick:()=>l(!1),className:"inline-flex h-12 cursor-pointer items-center gap-2 rounded-full border border-[#BD0265] bg-white px-6 text-base font-semibold text-[#BD0265] transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#FBE8F1]",children:"Gegevens aanpassen"})]}),(0,b.jsxs)("article",{className:"rounded-xl border border-[#E7E7E7] bg-white p-6",children:[(0,b.jsx)("div",{className:"mb-5 flex justify-end",children:(0,b.jsx)(c.default,{src:"/icon.svg",alt:"CoachScribe logo",width:26,height:26})}),(0,b.jsx)("div",{className:"flex flex-col gap-1 text-[#1D0A00]",children:w.map((a,c)=>{let d=a.trim();if(!d)return(0,b.jsx)("div",{className:"h-2"},`empty-${c}`);if(d===d.toUpperCase()||/^BIJLAGE\s+\d+/i.test(d)||/^\d+\.\s+/.test(d))return(0,b.jsx)("h3",{className:"pt-2 text-[16px] font-bold leading-[1.35]",children:d},`main-${c}`);if(/^\d+\.\d+\s+/.test(d)||/^[A-Z]\.\s+/.test(d))return(0,b.jsx)("h4",{className:"text-[14px] font-semibold leading-[1.35]",children:d},`sub-${c}`);if(d.trim().startsWith("- "))return(0,b.jsxs)("p",{className:"pl-3 text-[13.5px] leading-[1.45]",children:["• ",d.replace(/^- /,"").trim()]},`bullet-${c}`);if(/^[^:]{2,40}:\s+.+$/.test(d)){let a=d.indexOf(":"),e=d.slice(0,a+1),f=d.slice(a+1).trim();return(0,b.jsxs)("p",{className:"text-[13.5px] leading-[1.45]",children:[(0,b.jsx)("strong",{children:e})," ",f]},`label-${c}`)}return(0,b.jsx)("p",{className:"text-[13.5px] leading-[1.45]",children:d},`line-${c}`)})}),(0,b.jsx)("div",{className:"mt-5 border-t border-[#BD0265] pt-3 text-[11px] text-[#606060]",children:"coachscribe.nl | contact@coachscribe.nl"})]})]}):(0,b.jsxs)("form",{onSubmit:a=>{a.preventDefault(),l(!0)},className:"page-enter-animation rounded-2xl border border-black/10 bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.06)] md:p-8",children:[(0,b.jsxs)("div",{className:"grid gap-4 md:grid-cols-2",children:[(0,b.jsxs)("label",{className:"flex flex-col gap-2 md:col-span-2",children:[(0,b.jsx)("span",{className:"text-sm text-[#1D0A00]",children:"Naam organisatie*"}),(0,b.jsx)("input",{required:!0,className:i,value:g.organizationName,onChange:a=>j(b=>({...b,organizationName:a.target.value}))})]}),(0,b.jsxs)("label",{ref:t,htmlFor:a,className:"relative flex flex-col gap-2 md:col-span-2",children:[(0,b.jsx)("span",{className:"text-sm text-[#1D0A00]",children:"Adres*"}),(0,b.jsx)("input",{id:a,required:!0,className:i,value:g.address,onChange:a=>j(b=>({...b,address:a.target.value}))}),(0,b.jsx)("div",{className:`absolute left-0 right-0 top-[86px] z-20 max-h-56 overflow-auto rounded-xl bg-white shadow-[0_12px_24px_rgba(15,23,42,0.12)] transition-all duration-200 ease-out ${q.length>0?"translate-y-0 border border-[#E3E3E3] opacity-100":"-translate-y-1 border border-transparent opacity-0 pointer-events-none"}`,children:q.map((a,c)=>(0,b.jsx)("button",{type:"button",onMouseDown:b=>{b.preventDefault(),s.current=!0,j(b=>({...b,address:a.address,postalCode:a.postalCode||b.postalCode,city:a.city||b.city,country:a.country||b.country})),r([])},className:"w-full cursor-pointer border-b border-[#F0F0F0] px-4 py-3 text-left text-sm text-[#1D0A00] transition-colors hover:bg-[#FBE8F1] last:border-b-0",children:a.label},`${a.label}-${c}`))})]}),(0,b.jsxs)("label",{className:"flex flex-col gap-2",children:[(0,b.jsx)("span",{className:"text-sm text-[#1D0A00]",children:"Postcode*"}),(0,b.jsx)("input",{required:!0,className:i,value:g.postalCode,onChange:a=>j(b=>({...b,postalCode:a.target.value}))})]}),(0,b.jsxs)("label",{className:"flex flex-col gap-2",children:[(0,b.jsx)("span",{className:"text-sm text-[#1D0A00]",children:"Plaats*"}),(0,b.jsx)("input",{required:!0,className:i,value:g.city,onChange:a=>j(b=>({...b,city:a.target.value}))})]}),(0,b.jsxs)("label",{className:"flex flex-col gap-2",children:[(0,b.jsx)("span",{className:"text-sm text-[#1D0A00]",children:"Land*"}),(0,b.jsx)("input",{required:!0,className:i,value:g.country,onChange:a=>j(b=>({...b,country:a.target.value}))})]}),(0,b.jsxs)("label",{className:"flex flex-col gap-2",children:[(0,b.jsx)("span",{className:"text-sm text-[#1D0A00]",children:"Voor- en achternaam contactpersoon*"}),(0,b.jsx)("input",{required:!0,className:i,value:g.contactPersonFullName,onChange:a=>j(b=>({...b,contactPersonFullName:a.target.value}))})]}),(0,b.jsxs)("label",{className:"flex flex-col gap-2",children:[(0,b.jsx)("span",{className:"text-sm text-[#1D0A00]",children:"E-mail*"}),(0,b.jsx)("input",{required:!0,type:"email",className:i,value:g.contactEmail,onChange:a=>j(b=>({...b,contactEmail:a.target.value}))})]}),(0,b.jsx)(n,{label:"Ingangsdatum*",value:g.effectiveDate,onChange:a=>j(b=>({...b,effectiveDate:a}))}),(0,b.jsxs)("label",{className:"flex flex-col gap-2",children:[(0,b.jsx)("span",{className:"text-sm text-[#1D0A00]",children:"Plaats*"}),(0,b.jsx)("input",{required:!0,className:i,value:g.signingPlace,onChange:a=>j(b=>({...b,signingPlace:a.target.value}))})]}),(0,b.jsx)(n,{label:"Datum*",value:g.signingDate,onChange:a=>j(b=>({...b,signingDate:a}))}),(0,b.jsxs)("label",{className:"flex flex-col gap-2",children:[(0,b.jsx)("span",{className:"text-sm text-[#1D0A00]",children:"Voor- en achternaam ondertekenaar*"}),(0,b.jsx)("input",{required:!0,className:i,value:g.signerFullName,onChange:a=>j(b=>({...b,signerFullName:a.target.value}))})]}),(0,b.jsxs)("label",{className:"flex flex-col gap-2",children:[(0,b.jsx)("span",{className:"text-sm text-[#1D0A00]",children:"Functie*"}),(0,b.jsx)("input",{required:!0,className:i,value:g.signerRole,onChange:a=>j(b=>({...b,signerRole:a.target.value}))})]})]}),(0,b.jsx)("div",{className:"mt-6",children:(0,b.jsx)("button",{type:"submit",className:"inline-flex h-12 cursor-pointer items-center gap-2 rounded-full border-2 border-[#BD0265] bg-[#BD0265] px-6 text-base font-semibold text-white transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#A00256] hover:bg-[#A00256]",children:"Maak verwerkersovereenkomst"})})]})]})})})}a.s(["default",()=>p],7573)}];

//# sourceMappingURL=Coachscribe_website_components_legal_VerwerkersovereenkomstFlow_tsx_251c4d74._.js.map