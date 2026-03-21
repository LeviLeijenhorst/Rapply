import type { SiteCopy } from "@/content/siteCopy/types";

const sharedFaqItems = [
  {
    question: "Voor wie is Rapply bedoeld?",
    answer:
      "Voor loopbaan- en re-integratiecoaches die gesprekken willen vastleggen en daar consistente rapportages en dossiernotities van willen maken.",
  },
  {
    question: "Is Rapply geschikt voor Poortwachter-rapportages?",
    answer:
      "Rapply ondersteunt verslaglegging en structuur voor o.a. Plan van Aanpak, evaluaties en (tweede spoor) rapportages. Je houdt altijd zelf de eindcontrole op inhoud en formulering.",
  },
  {
    question: "Hoe zit het met AVG en privacy?",
    answer:
      "Privacy is een uitgangspunt: EU-verwerking, versleuteling en duidelijke afspraken over data. Je bepaalt zelf wat je opslaat of verwijdert.",
  },
  {
    question: "Worden AI-modellen getraind met mijn informatie?",
    answer:
      "Nee. Jouw data wordt niet gebruikt om publieke AI-modellen te trainen.",
  },
  {
    question: "Kan ik mijn eigen template gebruiken?",
    answer:
      "Ja. Je kunt werken met standaard templates of je eigen format aanhouden zodat de output aansluit op jouw werkwijze.",
  },
  {
    question: "Kan ik rapportages delen met client of werkgever?",
    answer:
      "Ja. Je kunt rapportages exporteren als PDF en delen wanneer dat past binnen jouw proces en afspraken.",
  },
] as const;

export const loopbaanEnReintegratieprofessionalsCopy: SiteCopy = {
  home: {
    heroTitleLine1: "Betere begeleiding begint bij",
    heroTitleLine2: "betrouwbare verslaglegging",
    subheadline:
      "Rapply helpt loopbaan- en re-integratiecoaches gesprekken vastleggen, structureren en omzetten naar professionele rapportages - met privacy en controle als uitgangspunt.",
    primaryCta: "Maak een afspraak",
    secondaryCta: "Bekijk hoe het werkt",
    features: [
      {
        title: "Leg je gesprek vast",
        description:
          "Neem gesprekken op en maak direct een gespreksverslag als basis voor je dossier. Minder losse notities, meer overzicht.",
      },
      {
        title: "Kies je rapportage-workflow",
        description:
          "Werk met vaste formats zoals Plan van Aanpak, (eerstejaars)evaluatie, tweede spoor en eindrapportage - of pas je eigen template toe.",
      },
      {
        title: "Beheer je dossier",
        description:
          "Bewaar sessies, verslagen en notities per client. Vind informatie snel terug en houd je voortgang consistent.",
      },
      {
        title: "Deel professioneel",
        description:
          "Deel rapportages als PDF in jouw huisstijl. Duidelijk voor werkgever, werknemer en ketenpartners.",
      },
    ],
    availabilityTitleLine1: "Binnenkort ook",
    availabilityTitleLine2: "op Android en iOS",
    availabilityTextLine1: "Gebruik Rapply op laptop, tablet en telefoon.",
    availabilityTextLine2: "Alles blijft gesynchroniseerd.",
    faqTitle: "Veelgestelde vragen",
    faqItems: [...sharedFaqItems],
  },
  shared: {
    securityTitlePrefix: "Ontworpen met",
    securityTitleHighlight: "privacy en compliance als basis",
    securitySubtitle: "EU-verwerking, versleuteling en heldere controle over jouw data.",
    securityCards: [
      {
        title: "Verwerking binnen Europa",
        description:
          "Gegevens worden verwerkt en opgeslagen binnen de Europese Unie. Zo sluit je beter aan op AVG-eisen.",
      },
      {
        title: "Versleuteld van upload tot opslag",
        description:
          "Audio en rapportages worden versleuteld verwerkt en opgeslagen. Minder risico bij gevoelige trajectinformatie.",
      },
      {
        title: "Jouw dossier blijft van jou",
        description:
          "Jij bepaalt wat je bewaart en wat je verwijdert. Geen training van publieke AI-modellen op jouw data.",
      },
    ],
    sectionForProfessionalsTitlePrefix: "Voor coaches,",
    sectionForProfessionalsTitleHighlight: "gebouwd met de praktijk",
    sectionForProfessionalsParagraphs: [
      "We ontwikkelen Rapply samen met coaches die dagelijks moeten rapporteren.",
      "Zo sluiten templates en output aan op echte trajecten.",
      "Wil je meedenken of input geven? Neem contact met ons op!",
    ],
    sectionForProfessionalsCta: "Contact",
    footerMicrocopyLine1:
      "Rapply helpt bij professionele verslaglegging en dossieropbouw voor loopbaan- en re-integratietrajecten.",
    footerMicrocopyLine2: "",
    footerMicrocopyLine3: "",
  },
  product: {
    heroTitleLine1: "Rust in je dossier.",
    heroTitleLine2: "Snel naar een professioneel rapport.",
    heroSubtext:
      "Zet gesprekken om naar gestructureerde verslagen en rapportages die passen bij jouw trajecten en templates.",
    heroCta: "Maak een afspraak",
    impactItems: [
      {
        title: "Overzicht",
        description:
          "Houd dossieropbouw strak per client en traject, zonder losse documenten.",
      },
      {
        title: "Tijd",
        description:
          "Minder handmatig uitwerken, sneller van gesprek naar rapportage.",
      },
      {
        title: "Kwaliteit",
        description:
          "Consistente structuur en taal, zodat je rapportages professioneler ogen.",
      },
      {
        title: "Zekerheid",
        description:
          "Privacy en controle als basis, met EU-verwerking en versleuteling.",
      },
      {
        title: "Samenwerking",
        description:
          "Maak output die begrijpelijk is voor werkgever, werknemer en ketenpartners.",
      },
      {
        title: "Rust",
        description:
          "Minder administratie-stress, meer aandacht voor het traject.",
      },
    ],
    faqTitle: "Veelgestelde vragen",
    faqItems: [...sharedFaqItems],
  },
  coaches: {
    heroTitleLine1: "Is Rapply",
    heroTitleLine2: "iets voor jou?",
    heroSubtext:
      "Ben je loopbaan- of re-integratiecoach en wil je sneller, consistenter en AVG-bewust rapporteren? Rapply helpt je van gesprek naar dossier en rapportage.",
    heroCta: "Maak een afspraak",
    typesSectionTitle: "Coaches: een breed werkveld",
    types: [
      {
        title: "Loopbaanbegeleiding",
        description:
          "Leg loopbaangesprekken vast en maak duidelijke samenvattingen en actiepunten per client.",
      },
      {
        title: "Re-integratie (1e spoor)",
        description:
          "Ondersteun dossieropbouw met gespreksverslagen, evaluaties en afspraken richting werkgever en werknemer.",
      },
      {
        title: "Tweede spoor",
        description:
          "Werk gestructureerd aan rapportages met voortgang, resultaten en onderbouwing.",
      },
      {
        title: "Jobcoaching",
        description:
          "Maak overzichtelijke notities en rapportages rond werkbehoud, begeleiding en interventies.",
      },
      {
        title: "Mobiliteit & outplacement",
        description:
          "Van intake tot trajectafronding: consistent vastleggen en professioneel communiceren.",
      },
      {
        title: "Arbeidsdeskundig samenwerken",
        description:
          "Documenteer observaties en bevindingen helder als input voor ketenpartners (met jouw eindcontrole).",
      },
      {
        title: "Praktijk- en casemanagement",
        description:
          "Alles per dossier bij elkaar, minder zoeken, minder dubbel werk.",
      },
      {
        title: "Nog veel meer",
        description:
          "Werk je in een aangrenzend veld met veel gesprekken en verslaglegging? Dan sluit Rapply waarschijnlijk ook aan.",
      },
      {
        title: "Nog veel meer",
        description:
          "Werk je in een aangrenzend veld met veel gesprekken en verslaglegging? Dan sluit Rapply waarschijnlijk ook aan.",
      },
    ],
    workflowTitlePrefix: "Jouw",
    workflowTitleHighlight: "werkwijze",
    workflowParagraphs: [
      "Elke coach heeft een eigen werkwijze. Daarom werkt Rapply met templates die zijn afgestemd op rapportages zoals Plan van Aanpak, evaluaties en tweede spoor.",
      "Deze templates zijn ontwikkeld in samenwerking met coaches, zodat ze aansluiten op hoe trajecten in de praktijk verlopen.",
      "Mocht er niets tussen zitten? Geen probleem. Ontwerp gemakkelijk je eigen template die precies aansluit op jouw manier van verslaglegging en dossieropbouw.",
    ],
    faqTitle: "Veelgestelde vragen",
    faqItems: [...sharedFaqItems],
  },
  overOns: {
    heroTitleMain: "Aangenaam ",
    heroTitleAccent: ":)",
    heroSubtext:
      "Rapply is gebouwd voor coaches die met gevoelige trajectinformatie werken. Ons doel: betrouwbare verslaglegging en rapportages, met privacy en controle als uitgangspunt.",
    heroCta: "Contact",
    values: [
      {
        title: "Mensgericht",
        description:
          "Administratie ondersteunt het traject - het vervangt nooit de menselijke begeleiding.",
      },
      {
        title: "Samenwerking",
        description:
          "We bouwen samen met coaches en partners aan wat in de praktijk echt werkt.",
      },
      {
        title: "Kwaliteit",
        description:
          "Heldere structuur en consistente output, zodat rapportages professioneel en bruikbaar blijven.",
      },
      {
        title: "Innovatie",
        description:
          "We verbeteren continu, met focus op tijdwinst zonder concessies aan privacy.",
      },
      {
        title: "Transparantie",
        description:
          "Duidelijke keuzes over verwerking, opslag en controle. Geen verrassingen.",
      },
      {
        title: "Vertrouwen",
        description:
          "Beveiliging en zorgvuldigheid staan centraal bij alles wat we bouwen.",
      },
    ],
    founders: [
      {
        name: "Levi Leijenhorst",
        description: [
          "Levi richt zich op product en techniek binnen Rapply. Hij werkt aan veilige verwerking, betrouwbare verslaglegging en een workflow die past bij de praktijk van loopbaan- en re-integratiecoaches. Daarnaast spreekt hij regelmatig gebruikers om scherp te blijven op wat er echt nodig is.",
        ],
      },
      {
        name: "Jonas Kroon",
        description: [
          "Jonas richt zich op design, gebruikservaring en positionering. Hij zorgt dat Rapply simpel blijft in gebruik, maar professioneel in output - van templates tot export in huisstijl. Ook hij haalt continu feedback op bij coaches om het product te verbeteren.",
        ],
      },
    ],
    contactHeading: "Kom in contact",
    contactText:
      "Wil je zien hoe Rapply past binnen jouw rapportage- en dossierproces? Laat een bericht achter, dan nemen we contact met je op.",
  },
};
