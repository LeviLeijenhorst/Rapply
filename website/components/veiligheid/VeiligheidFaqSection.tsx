"use client";

import { useState } from "react";
import SectionContainer from "@/components/home/SectionContainer";

const questions = [
  {
    question: "Is CoachScribe AVG-proof?",
    answer:
      "Ja. Alle gegevens worden versleuteld opgeslagen op beveiligde servers in Europa. Dit zorgt ervoor dat informatie beschermd is tegen ongeautoriseerde toegang.",
  },
  {
    question: "Worden mijn gegevens veilig opgeslagen?",
    answer:
      "Ja. Alle gegevens worden versleuteld opgeslagen op beveiligde servers in Europa. Dit zorgt ervoor dat informatie beschermd is tegen ongeautoriseerde toegang.",
  },
  {
    question: "Hoe wordt mijn data beschermd tijdens verzending?",
    answer:
      "Tijdens verzending wordt jouw data beschermd met sterke encryptie. Dit betekent dat informatie beveiligd is terwijl deze van jouw apparaat naar de servers wordt gestuurd.",
  },
  {
    question: "Kan iemand anders mijn gegevens inzien?",
    answer:
      "Nee. Alleen jij hebt toegang tot jouw gegevens. Zelfs CoachScribe kan de inhoud van je sessies of notities niet inzien.",
  },
  {
    question: "Hoe lang worden mijn gegevens bewaard?",
    answer:
      "Gegevens worden alleen bewaard zolang dat functioneel nodig is voor het gebruik van het platform. Na verloop van tijd worden ze verwijderd volgens de geldende privacyrichtlijnen.",
  },
  {
    question: "Wat gebeurt er bij een datalek?",
    answer:
      "In het uiterst onwaarschijnlijke geval van een datalek blijft de inhoud van jouw gegevens alsnog versleuteld en onleesbaar. Extra beveiligingsmaatregelen zorgen ervoor dat er geen ongeautoriseerde toegang mogelijk is.",
  },
  {
    question: "Wordt AI-verwerking volledig binnen de EU uitgevoerd?",
    answer:
      "Ja. Alle AI-verwerking, zoals transcripties en verslag generatie, vindt volledig plaats op Europese servers. Zo blijft verwerking van gegevens binnen de EU en onder de AVG.",
  },
];

export default function VeiligheidFaqSection() {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  return (
    <SectionContainer className="bg-[#F8F9F9]" contentClassName="md:pt-10 md:pb-20">
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
                  className="grid overflow-hidden transition-[grid-template-rows,opacity] duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{
                    gridTemplateRows: isExpanded ? "1fr" : "0fr",
                    opacity: isExpanded ? 1 : 0,
                  }}
                >
                  <p className="overflow-hidden pb-5 text-base font-normal leading-relaxed text-[#1D0A00]">
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
