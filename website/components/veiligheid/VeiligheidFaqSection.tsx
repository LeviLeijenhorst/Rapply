"use client";

import { useState } from "react";
import SectionContainer from "@/components/home/SectionContainer";

const questions = [
  {
    question: "Is CoachScribe AVG-proof?",
    answer:
      "Ja. CoachScribe is AVG-proof ingericht en verwerkt gegevens volgens de geldende Europese privacywetgeving.",
  },
  {
    question: "Worden mijn gegevens veilig opgeslagen?",
    answer:
      "Ja. Gegevens worden versleuteld opgeslagen en ook tijdens verzending beveiligd met sterke encryptie.",
  },
  {
    question: "Kan iemand anders mijn gegevens inzien?",
    answer:
      "Nee, alleen geautoriseerde gebruikers hebben toegang tot hun eigen data en rechten binnen de omgeving.",
  },
  {
    question: "Hoe lang worden mijn gegevens bewaard?",
    answer:
      "Gegevens worden bewaard volgens de afgesproken bewaartermijnen en je behoudt altijd controle over verwijdering.",
  },
  {
    question: "Wat gebeurt er bij een datalek?",
    answer:
      "Bij een incident volgen we een vast protocol met snelle melding, onderzoek, mitigatie en communicatie.",
  },
  {
    question: "Wordt AI-verwerking volledig binnen de EU uitgevoerd?",
    answer:
      "Ja. Opslag, verwerking en back-ups vinden plaats binnen Europese infrastructuur.",
  },
];

export default function VeiligheidFaqSection() {
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
                  <span className="text-base font-semibold text-[#1D0A00] md:text-xl">
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
