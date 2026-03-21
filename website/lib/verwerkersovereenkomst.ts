export type VerwerkersovereenkomstFormValues = {
  organizationName: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  contactPersonFullName: string;
  contactEmail: string;
  effectiveDate: string;
  signingPlace: string;
  signingDate: string;
  signerFullName: string;
  signerRole: string;
};

function withFallback(value: string, fallback: string) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : fallback;
}

function formatDate(value: string) {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "[DATUM]";
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return trimmed;
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

export function buildVerwerkersovereenkomst(
  values: VerwerkersovereenkomstFormValues,
) {
  const organizationName = withFallback(values.organizationName, "[NAAM KLANT]");
  const address = withFallback(values.address, "[ADRES KLANT]");
  const postalCode = withFallback(values.postalCode, "[POSTCODE KLANT]");
  const city = withFallback(values.city, "[PLAATS KLANT]");
  const country = withFallback(values.country, "[LAND KLANT]");
  const contactPersonFullName = withFallback(
    values.contactPersonFullName,
    "[VOOR- EN ACHTERNAAM CONTACTPERSOON]",
  );
  const contactEmail = withFallback(values.contactEmail, "[E-MAIL KLANT]");
  const effectiveDate = formatDate(values.effectiveDate);
  const signingPlace = withFallback(values.signingPlace, "[PLAATS]");
  const signingDate = formatDate(values.signingDate);
  const signerFullName = withFallback(
    values.signerFullName,
    "[VOOR- EN ACHTERNAAM ONDERTEKENAAR]",
  );
  const signerRole = withFallback(values.signerRole, "[FUNCTIE]");

  return `VERWERKERSOVEREENKOMST Rapply

Deze verwerkersovereenkomst hoort bij het gebruik van Rapply.

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
E-mail: contact@rapply.nl
Website: https://www.Rapply.nl

2. Onderwerp en duur

Verwerker verwerkt persoonsgegevens voor Verwerkingsverantwoordelijke bij het leveren van Rapply, zoals beschreven in Bijlage 1.
Deze verwerkersovereenkomst geldt vanaf ${effectiveDate} en loopt zolang Verwerker persoonsgegevens verwerkt voor Verwerkingsverantwoordelijke in het kader van Rapply.

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
`;
}
