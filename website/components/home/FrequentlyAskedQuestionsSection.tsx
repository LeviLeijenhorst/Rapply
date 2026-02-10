"use client";

import { useState } from "react";
import SectionContainer from "@/components/home/SectionContainer";

const questions = [
  {
    question: "Wat is CoachScribe?",
    answer:
      "CoachScribe neemt je sessies op en zet ze om in duidelijke verslagen zodat jij je volledig kunt richten op het gesprek.",
  },
  {
    question: "Is CoachScribe veilig?",
    answer:
      "Je data wordt beschermd opgeslagen en alleen jij hebt toegang tot je gesprekken en verslagen.",
  },
  {
    question:
      "Worden modellen voor kunstmatige intelligentie getraind met mijn informatie?",
    answer:
      "Nee, jouw gesprekken worden niet gebruikt om modellen te trainen.",
  },
  {
    question: "Voor wie is CoachScribe?",
    answer:
      "CoachScribe is gemaakt voor coaches die hun administratie willen versimpelen en meer focus willen houden op hun clienten.",
  },
  {
    question: "Is CoachScribe een vervanging voor een menselijke coach?",
    answer:
      "Nee, CoachScribe ondersteunt jouw werk en neemt alleen de verslaglegging uit handen.",
  },
  {
    question: "Voor wie is CoachScribe bedoeld?",
    answer:
      "CoachScribe is bedoeld voor zelfstandige coaches en teams die efficiënt willen samenwerken.",
  },
];

export default function FrequentlyAskedQuestionsSection() {
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
