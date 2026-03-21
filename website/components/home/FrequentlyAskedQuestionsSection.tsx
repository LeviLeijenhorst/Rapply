"use client";

import { useState } from "react";
import SectionContainer from "@/components/home/SectionContainer";

const questions = [
  {
    question: "Wat is Rapply?",
    answer:
      "Rapply is een AI-ondersteunde tool voor loopbaancoaches en re-integratieprofessionals. Sessies worden veilig vastgelegd en automatisch omgezet in professionele rapportages die voldoen aan de eisen van opdrachtgevers en het UWV. Jij houdt de controle, Rapply neemt het schrijfwerk uit handen.",
  },
  {
    question: "Is Rapply veilig?",
    answer:
      "Ja. Rapply is veilig ingericht met sterke technische en organisatorische maatregelen om jouw gegevens te beschermen. Alle data wordt versleuteld opgeslagen en verwerkt binnen de Europese Unie, in overeenstemming met de AVG. Jouw gegevens worden niet gebruikt om AI-modellen te trainen en alleen bewaard zolang dat functioneel nodig is.",
  },
  {
    question: "Worden er AI modellen getraind met mijn informatie?",
    answer:
      "Nee. Jouw gegevens worden niet gebruikt om AI-modellen te trainen of te verbeteren. Ze worden uitsluitend verwerkt om de functionaliteiten van Rapply voor jou uit te voeren.",
  },
  {
    question: "Voor wie is Rapply bedoeld?",
    answer:
      "Rapply is specifiek ontwikkeld voor loopbaan- en re-integratiecoaches die werken met meerdere clienten en trajecten. Het helpt je om sessies gestructureerd vast te leggen, voortgang bij te houden en verslaglegging richting opdrachtgevers of UWV eenvoudiger te maken.",
  },
  {
    question: "Is Rapply een vervanging voor een menselijke coach?",
    answer:
      "Nee. Rapply ondersteunt coaches met automatisering van taken zoals notities maken en verslaglegging, maar vervangt nooit het menselijke oordeel, de contextbegrip of de relatie tussen coach en client.",
  },
  {
    question: "Kan ik niet gewoon ChatGPT gebruiken?",
    answer:
      "Nee. ChatGPT is een algemene AI zonder functionaliteit voor sessieopname, gestructureerde verslaglegging of AVG-proof beheer van cliëntgegevens. Daarnaast heeft ChatGPT geen kennis van de specifieke eisen die opdrachtgevers en het UWV stellen aan rapportages. Rapply is specifiek gebouwd voor loopbaancoaches en re-integratieprofessionals en werkt daar dan ook een stuk gerichter voor.",
  },
];

export default function FrequentlyAskedQuestionsSection() {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  return (
    <SectionContainer className="bg-[#F8F9F9]" contentClassName="md:pt-20 md:pb-20">
      <div className="flex w-full flex-col gap-8">
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
                    className={`shrink-0 ${isExpanded ? "rotate-45" : ""}`}
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
                  <p className="pb-5 text-base font-normal leading-relaxed text-[#1D0A00]">
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
