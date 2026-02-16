"use client";

import Image, { StaticImageData } from "next/image";
import SectionContainer from "@/components/home/SectionContainer";
import supportImage from "@/veiligheid/veiligheid-2.jpg";
import helpImage from "@/veiligheid/veiligheid-3.jpg";
import relieveImage from "@/veiligheid/veiligheid-4.jpg";

type EthicsItem = {
  title: string;
  description: string;
  image: StaticImageData;
};

const ethicsItems: EthicsItem[] = [
  {
    title: "Ondersteunen",
    description:
      "AI ondersteunt de coach, maar neemt nooit de regie over.",
    image: supportImage,
  },
  {
    title: "Helpen",
    description:
      "Verslagen zijn bedoeld om te helpen met inzichten, niet om te sturen of te verdraaien.",
    image: helpImage,
  },
  {
    title: "Verlichten",
    description:
      "Automatisering mag het werk verlichten, maar nooit de professional vervangen.",
    image: relieveImage,
  },
];

export default function VeiligheidEthicsSection() {
  return (
    <SectionContainer className="bg-[#F8F9F9]" contentClassName="pt-20">
      <div className="flex w-full flex-col gap-10">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-[16px] text-center">
          <h2 className="font-[var(--font-catamaran)] text-[40px] font-medium leading-[120%] text-black">
            <span className="text-[#BD0265]">Ethiek</span> als uitgangspunt
          </h2>
          <p className="text-base font-normal leading-relaxed text-[#1D0A00]">
            Privacy en beveiliging zijn voor ons niet alleen technische
            vraagstukken, maar ook ethische keuzes. CoachScribe wordt gebruikt
            in contexten waarin vertrouwen centraal staat en daar zijn wij ons
            van bewust. CoachScribe is ontworpen in dienst van coach en coachee.
          </p>
        </div>
        <div className="grid w-full gap-6 md:grid-cols-3">
          {ethicsItems.map((ethicsItem, index) => (
            <article
              key={ethicsItem.title}
              className="relative mx-auto flex h-[408px] w-full max-w-[364px] flex-col items-center overflow-hidden rounded-2xl border border-black/10 bg-white p-6 pb-8 pt-8 text-center"
            >
              <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
                <Image
                  src={ethicsItem.image}
                  alt={ethicsItem.title}
                  className={`h-auto w-full max-w-[140px] object-contain ${
                    index === 1 ? "scale-[1.5]" : "scale-[1.6]"
                  }`}
                />
              </div>
              <h3 className="relative z-10 font-[var(--font-catamaran)] text-[40px] font-medium leading-[120%] text-[#BD0265]">
                {ethicsItem.title}
              </h3>
              <p className="relative z-10 mt-auto text-base font-normal leading-relaxed text-[#1D0A00]">
                {ethicsItem.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}
