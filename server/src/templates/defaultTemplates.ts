import crypto from "crypto"

import type { Template } from "../appData"

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

export function createDefaultTemplates(): Template[] {
  const now = Date.now()
  return [
    {
      id: createId("template"),
      name: "Standaard verslag",
      isSaved: false,
      createdAtUnixMs: now,
      updatedAtUnixMs: now,
      sections: [
        {
          id: createId("template-section"),
          title: "Samenvatting",
          description: "Een korte samenvatting van de sessie met de belangrijkste punten die relevant zijn voor de coachee.",
        },
        {
          id: createId("template-section"),
          title: "Bulletpoints",
          description: "De belangrijkste inzichten in bulletpoints zodat je ze snel kan terugvinden.",
        },
        {
          id: createId("template-section"),
          title: "Actiepunten",
          description: "Duidelijke actiepunten die uit de sessie zijn gekomen.",
        },
      ],
    },
    {
      id: createId("template"),
      name: "SOAP",
      isSaved: false,
      createdAtUnixMs: now,
      updatedAtUnixMs: now,
      sections: [
        {
          id: createId("template-section"),
          title: "Subjectief",
          description: "Wat de coachee ervaart en hoe die de situatie beschrijft.",
        },
        {
          id: createId("template-section"),
          title: "Objectief",
          description: "Feiten en observaties die relevant zijn voor de situatie.",
        },
        {
          id: createId("template-section"),
          title: "Analyse",
          description: "De betekenis van de informatie en wat dit zegt over de situatie.",
        },
        {
          id: createId("template-section"),
          title: "Plan",
          description: "De afspraken en vervolgstappen die zijn afgesproken.",
        },
      ],
    },
    {
      id: createId("template"),
      name: "Intake",
      isSaved: false,
      createdAtUnixMs: now,
      updatedAtUnixMs: now,
      sections: [
        {
          id: createId("template-section"),
          title: "Hulpvraag",
          description: "De directe hulpvraag van de coachee.",
        },
        {
          id: createId("template-section"),
          title: "Achtergrond",
          description: "De context, geschiedenis en relevante achtergrondinformatie.",
        },
        {
          id: createId("template-section"),
          title: "Doelen",
          description: "Wat de coachee wil bereiken met het traject.",
        },
        {
          id: createId("template-section"),
          title: "Verwachtingen",
          description: "Wat de coachee verwacht van de coaching en de samenwerking.",
        },
      ],
    },
    {
      id: createId("template"),
      name: "Eindverslag",
      isSaved: false,
      createdAtUnixMs: now,
      updatedAtUnixMs: now,
      sections: [
        {
          id: createId("template-section"),
          title: "Resultaten",
          description: "Wat er is bereikt in het traject en welke doelen zijn gehaald.",
        },
        {
          id: createId("template-section"),
          title: "Belangrijkste inzichten",
          description: "De meest waardevolle inzichten uit de sessies.",
        },
        {
          id: createId("template-section"),
          title: "Vervolg",
          description: "Aanbevelingen en vervolgstappen na het traject.",
        },
      ],
    },
    {
      id: createId("template"),
      name: "Voor de coachee",
      isSaved: false,
      createdAtUnixMs: now,
      updatedAtUnixMs: now,
      sections: [
        {
          id: createId("template-section"),
          title: "Samenvatting",
          description: "Een korte en duidelijke samenvatting van de sessie.",
        },
        {
          id: createId("template-section"),
          title: "Afspraken",
          description: "De afspraken die tijdens de sessie zijn gemaakt.",
        },
        {
          id: createId("template-section"),
          title: "Acties",
          description: "Acties die de coachee zelf kan uitvoeren.",
        },
      ],
    },
  ]
}
