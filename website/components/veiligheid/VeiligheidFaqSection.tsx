"use client";

import { useState } from "react";
import SectionContainer from "@/components/home/SectionContainer";

const questions = [
  {
    question: "Blijven gegevens binnen Europa?",
    answer:
      "Ja. Alle aan sessies en coachees gerelateerde gegevens worden opgeslagen en verwerkt binnen de Europese Unie.",
  },
  {
    question: "Worden onze gegevens gebruikt om AI-modellen te trainen?",
    answer:
      "Nee. Gegevens binnen Rapply worden niet gebruikt om AI-modellen te trainen of commercieel te exploiteren.",
  },
  {
    question: "Wie is verantwoordelijk onder de AVG?",
    answer:
      "De gebruiker is verwerkingsverantwoordelijke.\nRapply treedt op als verwerker en verwerkt gegevens uitsluitend op basis van instructies.",
  },
  {
    question: "Hoe zijn gegevens technisch beveiligd?",
    answer:
      "Gegevens worden versleuteld opgeslagen binnen Europese cloudinfrastructuur.\nDaarnaast passen wij een aanvullende versleutelingslaag toe, waarbij encryptiesleutels onafhankelijk van de opslagomgeving worden beheerd.",
  },
  {
    question: "Zijn opgeslagen gegevens leesbaar binnen de cloudomgeving?",
    answer:
      "Opgeslagen gegevens zijn versleuteld.\nDoor de aanvullende versleuteling zijn gegevens binnen de opslagomgeving niet leesbaar zonder de bijbehorende encryptiesleutel.",
  },
  {
    question: "Wordt audio tijdelijk opgeslagen?",
    answer:
      "Audio wordt versleuteld verzonden voor transcriptie.\nTijdelijke uploads worden na verwerking verwijderd, tenzij de gebruiker ervoor kiest de gegevens binnen Rapply te bewaren.",
  },
  {
    question: "Kan ik gegevens verwijderen als een cliënt dat vraagt?",
    answer:
      "Ja. Via de applicatie kunnen sessies en bijbehorende gegevens worden verwijderd.\nNa beëindiging van de dienstverlening worden gegevens binnen een redelijke termijn verwijderd of geanonimiseerd, tenzij een wettelijke bewaarplicht anders vereist.",
  },
  {
    question: "Welke subverwerkers gebruiken jullie?",
    answer:
      "Rapply maakt gebruik van cloud-, authenticatie- en AI-dienstverleners die nodig zijn voor hosting en functionaliteit.\nDe actuele lijst van subverwerkers is opgenomen in de verwerkersovereenkomst.",
  },
  {
    question: "Hebben jullie een ISO 27001-certificering?",
    answer:
      "Op dit moment niet.\nWij bereiden onze processen en documentatie voor op een ISO 27001-certificeringstraject.",
  },
  {
    question: "Wat als onze organisatie aanvullende beveiligingseisen heeft?",
    answer:
      "Neem contact met ons op.\nWe bespreken graag aanvullende documentatie of technische vragen over de inrichting van Rapply.",
  },
];

export default function VeiligheidFaqSection() {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  return (
    <SectionContainer className="bg-[#F8F9F9]" contentClassName="md:pt-10 md:pb-20">
      <div id="faq" className="flex w-full flex-col gap-8">
        <h2 className="text-3xl font-semibold text-[#1D0A00] md:text-5xl xl:text-6xl">
          Veel gestelde vragen
        </h2>
        <div className="w-full border-y border-black/40">
          {questions.map((questionItem, index) => {
            const isExpanded = expandedQuestion === questionItem.question;
            return (
              <div
                key={questionItem.question}
                className={index === 0 ? "" : "border-t border-black/40"}
              >
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={`faq-answer-${index}`}
                  onClick={() =>
                    setExpandedQuestion((previousQuestion) =>
                      previousQuestion === questionItem.question
                        ? null
                        : questionItem.question,
                    )
                  }
                  className="flex w-full cursor-pointer items-center justify-between gap-6 py-5 text-left text-[#1D0A00] transition-colors hover:text-[#BD0265]"
                >
                  <span className="text-base font-semibold md:text-xl">
                    {questionItem.question}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`shrink-0 transition-transform duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isExpanded ? "rotate-45" : ""
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M6 12H18"
                        stroke="#1D0A00"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 18V6"
                        stroke="#1D0A00"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
                <div
                  id={`faq-answer-${index}`}
                  className={isExpanded ? "block" : "hidden"}
                >
                  <p className="pb-5 text-base font-normal leading-relaxed text-[#1D0A00] whitespace-pre-line">
                    {questionItem.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SectionContainer>
  );
}
