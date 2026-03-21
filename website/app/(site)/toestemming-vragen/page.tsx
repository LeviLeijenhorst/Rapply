import LegalDocumentPage from "@/components/legal/LegalDocumentPage";

const markdown = `## Hoe geef ik toestemming voor het opnemen van een gesprek?

Wanneer je een gesprek opneemt, is het belangrijk dat alle betrokkenen hiervan op de hoogte zijn en toestemming geven.

Als coach ben jij verantwoordelijk voor het zorgvuldig omgaan met vertrouwelijke informatie. Rapply helpt je daarbij, maar jij blijft verantwoordelijk voor het verkrijgen van toestemming.

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

Wetgeving rondom privacy verschilt per land en situatie. Rapply geeft geen juridisch advies.

Bij twijfel raden we aan juridisch advies in te winnen of de richtlijnen van jouw beroepsorganisatie te raadplegen.
`;

export default function ToestemmingVragenPage() {
  return (
    <LegalDocumentPage
      title="Toestemming vragen voor opname"
      subtitle="Richtlijnen voor duidelijke en zorgvuldige toestemming bij het opnemen van gesprekken."
      markdown={markdown}
    />
  );
}
