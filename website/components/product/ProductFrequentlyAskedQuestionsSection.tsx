"use client";

import { useState } from "react";
import SectionContainer from "@/components/home/SectionContainer";

const questions = [
  {
    question: "Kan ik templates gebruiken voor mijn verslagen?",
    answer:
      "Ja. Je kunt vooraf ingestelde templates gebruiken om snel gestructureerde verslagen te maken. Zo hoef je niet telkens vanaf nul te beginnen en houd je verslagen consistent en overzichtelijk. Zit er geen template tussen die bij jouw workflow past? Geen probleem, het is ook mogelijk om je eigen templates te maken.",
  },
  {
    question: "Kan ik mijn huisstijl toevoegen aan verslagen?",
    answer:
      "Ja. Je kunt je eigen logo en praktijk kleur toevoegen, zodat elk verslag direct herkenbaar is en professioneel oogt. Zo blijft de uitstraling consistent en duidelijk voor jou en je cliënten.",
  },
  {
    question: "Is er een app voor CoachScribe?",
    answer:
      "Binnenkort. Naar verwachting zal deze halverwege maart op de AppStore en PlayStore uit worden gebracht.",
  },
  {
    question: "Kan ik verslagen delen met cliënten?",
    answer:
      "Ja. Je kunt verslagen eenvoudig delen met cliënten of collega’s, en ze worden gedeeld in jouw huisstijl met logo en praktijkkleur, zodat alles herkenbaar en professioneel blijft.",
  },
  {
    question: "Kan ik zelf notities maken?",
    answer:
      "Ja. Je kunt altijd zelf notities toevoegen bij een sessie, zodat belangrijke informatie niet verloren gaat en je later snel terug kunt vinden wat er besproken is.",
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
