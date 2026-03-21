"use client";

import { useState } from "react";
import SectionContainer from "@/components/home/SectionContainer";

const questions = [
  {
    question: "Kan ik Rapply gebruiken op mijn telefoon?",
    answer:
      "Ja. Rapply is beschikbaar via de browser op je telefoon, tablet of laptop. Je kunt dus direct sessies opnemen via je smartphone zonder dat je een app nodig hebt. Een dedicated app voor de AppStore en PlayStore is daarnaast binnenkort beschikbaar.",
  },
  {
    question: "Kan ik mijn huisstijl toevoegen aan verslagen?",
    answer:
      "Ja. Je kunt je eigen logo en praktijk kleur toevoegen, zodat elk verslag direct herkenbaar is en professioneel oogt. Zo blijft de uitstraling consistent en duidelijk voor jou en je clienten.",
  },
  {
    question: "Kan ik verslagen delen met clienten?",
    answer:
      "Ja. Je kunt verslagen eenvoudig delen met clienten of collega's, en ze worden gedeeld in jouw huisstijl met logo en praktijkkleur, zodat alles herkenbaar en professioneel blijft.",
  },
  {
    question: "Kan ik verslagen delen met opdrachtgevers of werkgevers?",
    answer:
      "Ja. Je kunt verslagen eenvoudig delen met clienten, opdrachtgevers of werkgevers, in jouw eigen huisstijl. Handig voor re-integratietrajecten waarbij meerdere partijen betrokken zijn.",
  },
  {
    question: "Kan ik templates gebruiken?",
    answer:
      "Ja. Je kunt vooraf ingestelde templates gebruiken die zijn afgestemd op loopbaan- en re-integratiecoaches. Zo hoef je niet telkens vanaf nul te beginnen en houd je verslagen consistent. Past er geen template bij jouw werkwijze? Dan maak je eenvoudig je eigen template.",
  },
  {
    question: "Kan ik specifieke momenten in sessies terugluisteren?",
    answer:
      "Ja. De audio wordt veilig opgeslagen en je kunt in de transcriptie klikken op elk moment van de sessie en direct de audio terugluisteren, zodat je gemakkelijk belangrijke stukken opnieuw kunt horen.",
  },
];

export default function ProductFrequentlyAskedQuestionsSection() {
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
