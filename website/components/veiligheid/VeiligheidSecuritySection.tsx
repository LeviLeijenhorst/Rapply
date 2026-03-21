import Image, { StaticImageData } from "next/image";
import SectionContainer from "@/components/home/SectionContainer";
import euStarsCircleIcon from "@/home/eu-stars-circle.svg";
import lockIcon from "@/veiligheid/lock.svg";
import securitySafeIcon from "@/veiligheid/security-safe.svg";

type SecurityItem = {
  title: string;
  description: string;
  icon: StaticImageData;
};

const securityItems: SecurityItem[] = [
  {
    title: "Verwerking binnen Europa",
    description:
      "Rapply verwerkt en bewaart sessiegegevens binnen de Europese Unie. Zo sluiten opslag en verwerking aan op de AVG.",
    icon: euStarsCircleIcon,
  },
  {
    title: "Altijd versleuteld",
    description:
      "Audio voor transcriptie wordt versleuteld verzonden. Transcripties, samenvattingen en notities blijven versleuteld opgeslagen.",
    icon: lockIcon,
  },
  {
    title: "Jouw data blijft van jou",
    description:
      "Jouw data wordt niet gebruikt om AI-modellen te trainen. Jij bepaalt wat je bewaart en kunt je gegevens verwijderen wanneer jij wilt.",
    icon: securitySafeIcon,
  },
];

export default function VeiligheidSecuritySection() {
  return (
    <SectionContainer className="bg-[#EEF0FF]" contentClassName="pt-12 pb-12 md:pt-16 md:pb-16">
      <div className="flex w-full flex-col gap-10">
        <div className="flex w-full justify-center text-center">
          <h2 className="text-4xl font-semibold text-[#1D0A00]">
            Ontworpen met <span className="text-[#BD0265]">veiligheid op #1</span>
          </h2>
        </div>
        <div className="grid w-full gap-5 md:grid-cols-3">
          {securityItems.map((securityItem) => (
            <article
              key={securityItem.title}
              className="rounded-xl border border-black/10 bg-white p-6 shadow-[0_8px_18px_rgba(15,23,42,0.06)]"
            >
              <div className="mb-3 flex items-center gap-2">
                <Image src={securityItem.icon} alt="" width={16} height={16} />
                <h3 className="text-lg font-semibold text-[#BD0265]">
                  {securityItem.title}
                </h3>
              </div>
              <p className="text-base font-normal leading-relaxed text-[#1D0A00]">
                {securityItem.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}
