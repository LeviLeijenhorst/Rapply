"use client";

import { useState } from "react";
import SectionContainer from "@/components/home/SectionContainer";

const questions = [
  {
    question: "Voor welke coaches is CoachScribe geschikt?",
    answer:
      "CoachScribe is geschikt voor alle professionals die gesprekken voeren met cliënten en daar gestructureerde verslagen van willen bijhouden. Het helpt coaches overzicht te houden, informatie veilig te bewaren en sneller terug te vinden wat belangrijk is uit sessies.",
  },
  {
    question: "Kan CoachScribe worden gebruikt door loopbaancoaches?",
    answer:
      "Ja. Loopbaancoaches kunnen CoachScribe gebruiken om gesprekken met cliënten vast te leggen, verslagen te maken en belangrijke inzichten overzichtelijk bij te houden. Dit maakt het makkelijker om trajecten te volgen en opvolging te plannen.",
  },
  {
    question:
      "Kan ik CoachScribe gebruiken als zelfstandig coach of alleen in een organisatie?",
    answer:
      "CoachScribe is geschikt voor zowel zelfstandige coaches als coaches die in een organisatie werken.",
  },
  {
    question: "Is er een minimum aantal cliënten of sessies nodig om te beginnen?",
    answer:
      "Nee. Je kunt CoachScribe vanaf het eerste gesprek gebruiken, ongeacht het aantal cliënten of sessies. Het systeem werkt direct, waardoor je meteen overzicht krijgt en efficiënt notities en verslagen kunt bijhouden.",
  },
  {
    question: "Kunnen onderwijscoaches of begeleiders CoachScribe gebruiken?",
    answer:
      "Ja. CoachScribe kan worden ingezet door onderwijscoaches, mentoren en begeleiders om gesprekken met studenten of leerlingen gestructureerd vast te leggen. Het biedt een veilig overzicht van sessies en maakt het eenvoudiger om belangrijke informatie terug te vinden en te gebruiken voor begeleiding.",
  },
  {
    question: "Is CoachScribe geschikt voor nieuwe coaches zonder veel ervaring?",
    answer:
      "Ja. CoachScribe ondersteunt zowel ervaren als nieuwe coaches door structuur en overzicht te bieden bij sessies en verslaglegging. Het helpt nieuwe coaches om gespreksinformatie efficiënt te beheren en sneller vertrouwd te raken met het bijhouden van professionele verslagen.",
  },
];

export default function CoachesFrequentlyAskedQuestionsSection() {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  return (
    <SectionContainer className="bg-[#F8F9F9]" contentClassName="md:pt-20 md:pb-20">
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
