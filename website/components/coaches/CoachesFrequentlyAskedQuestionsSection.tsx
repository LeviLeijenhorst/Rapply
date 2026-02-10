"use client";

import { useState } from "react";
import SectionContainer from "@/components/home/SectionContainer";

const questions = [
  {
    question: "Voor welke coaches is CoachScribe geschikt?",
    answer:
      "CoachScribe is geschikt voor coaches die gesprekken voeren en achteraf tijd willen besparen op verslaglegging en administratie.",
  },
  {
    question: "Kan CoachScribe worden gebruikt door loopbaancoaches?",
    answer:
      "Ja, loopbaancoaches kunnen CoachScribe gebruiken voor intakegesprekken, reflecties en voortgangsverslagen.",
  },
  {
    question:
      "Kan ik CoachScribe gebruiken als zelfstandig coach of alleen in een organisatie?",
    answer:
      "Je kunt CoachScribe zowel zelfstandig als binnen teams of organisaties gebruiken.",
  },
  {
    question: "Is er een minimum aantal cliënten of sessies nodig om te beginnen?",
    answer:
      "Nee, je kunt starten vanaf je eerste cliënt. Er is geen minimum aantal sessies vereist.",
  },
  {
    question: "Kunnen onderwijscoaches of begeleiders CoachScribe gebruiken?",
    answer:
      "Ja, ook onderwijscoaches en begeleiders kunnen CoachScribe inzetten om gesprekken sneller en consistenter vast te leggen.",
  },
  {
    question: "Is CoachScribe geschikt voor nieuwe coaches zonder veel ervaring?",
    answer:
      "Ja, dankzij templates en structuur is CoachScribe ook geschikt voor coaches die net zijn gestart.",
  },
];

export default function CoachesFrequentlyAskedQuestionsSection() {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  return (
    <SectionContainer className="bg-[#F8F9F9]">
      <div id="faq" className="flex w-full flex-col gap-8">
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
