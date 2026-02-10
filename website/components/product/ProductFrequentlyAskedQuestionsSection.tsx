"use client";

import { useState } from "react";
import SectionContainer from "@/components/home/SectionContainer";

const questions = [
  {
    question: "Kan ik templates gebruiken voor mijn verslagen?",
    answer:
      "Ja, je kunt werken met templates zodat elk verslag een vaste structuur heeft die past bij jouw manier van coachen.",
  },
  {
    question: "Kan ik mijn huisstijl toevoegen aan verslagen?",
    answer:
      "Ja, je kunt verslagen delen in een opmaak die aansluit op jouw professionele uitstraling en werkwijze.",
  },
  {
    question: "Is er een app voor CoachScribe?",
    answer:
      "CoachScribe is beschikbaar via de browser op desktop en mobiel. Een native app wordt verder ontwikkeld.",
  },
  {
    question: "Kan ik verslagen delen met clienten?",
    answer:
      "Ja, je kunt verslagen eenvoudig delen zodat clienten de juiste samenvatting en opvolging ontvangen.",
  },
  {
    question: "Kan ik zelf notities maken?",
    answer:
      "Ja, naast automatische verslaglegging kun je handmatig notities toevoegen en bewerken wanneer je wilt.",
  },
  {
    question: "Kan ik specifieke momenten in sessies terugluisteren?",
    answer:
      "Ja, je kunt sessies terugluisteren en relevante momenten gebruiken om context en voortgang nauwkeurig op te volgen.",
  },
];

export default function ProductFrequentlyAskedQuestionsSection() {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  return (
    <SectionContainer className="bg-[#F8F9F9]">
      <div className="flex w-full flex-col gap-8">
        <h2 className="text-4xl font-semibold text-[#1D0A00] md:text-6xl">
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
                    className={`shrink-0 text-2xl leading-none transition-transform ${isExpanded ? "rotate-45" : ""}`}
                  >
                    +
                  </span>
                </button>
                {isExpanded ? (
                  <p className="pb-5 text-base font-normal leading-relaxed text-[#1D0A00]">
                    {questionItem.answer}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </SectionContainer>
  );
}
