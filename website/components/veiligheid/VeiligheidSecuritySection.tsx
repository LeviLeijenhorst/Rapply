import Image, { StaticImageData } from "next/image";
import SectionContainer from "@/components/home/SectionContainer";
import securitySafeIcon from "@/veiligheid/security-safe.svg";
import lockIcon from "@/veiligheid/lock.svg";
import shieldTickIcon from "@/veiligheid/shield-tick.svg";
import securityIcon from "@/veiligheid/security.svg";
import shieldSearchIcon from "@/veiligheid/shield-search.svg";

type SecurityItem = {
  title: string;
  description: string;
  icon: StaticImageData;
};

const securityItems: SecurityItem[] = [
  {
    title: "AVG Proof",
    description:
      "CoachScribe is AVG-proof ingericht. Opslag en verwerking van gegevens vinden uitsluitend plaats binnen de EU, volgens de geldende privacywetgeving.",
    icon: securitySafeIcon,
  },
  {
    title: "Versleuteld opgeslagen",
    description:
      "Alle gegevens zijn beveiligd met sterke encryptie, zowel tijdens verzending (in transit) als wanneer ze zijn opgeslagen (at rest).",
    icon: lockIcon,
  },
  {
    title: "Jouw data blijft van jou",
    description:
      "Jouw data wordt nooit gebruikt om AI-modellen te trainen of te verbeteren. Daarnaast kan je op elk moment je data verwijderen, het is jouw data.",
    icon: shieldTickIcon,
  },
  {
    title: "Binnen Europa",
    description:
      "Al je data blijft binnen Europa. Opslag, verwerking en back-ups vinden uitsluitend plaats op Europese servers, in overeenstemming met de AVG.",
    icon: securityIcon,
  },
  {
    title: "Transparantie",
    description:
      "We doen niet aan vage beloftes of kleine lettertjes. Heb je vragen over onze beveiliging, infrastructuur of privacykeuzes? Neem gerust contact op!",
    icon: shieldSearchIcon,
  },
];

const cardPlacementClasses = [
  "",
  "",
  "",
  "xl:col-start-2",
  "xl:col-start-4",
];

export default function VeiligheidSecuritySection() {
  return (
    <SectionContainer className="bg-[#EEF0FF]">
      <div className="flex w-full flex-col gap-10">
        <div className="flex w-full justify-center text-center">
          <h2 className="text-4xl font-semibold text-[#1D0A00]">
            Ontworpen met <span className="text-[#BD0265]">veiligheid op #1</span>
          </h2>
        </div>
        <div className="grid w-full gap-5 md:grid-cols-2 xl:grid-cols-6">
          {securityItems.map((securityItem, index) => (
            <article
              key={securityItem.title}
              className={`rounded-xl border border-black/10 bg-white p-6 shadow-[0_8px_18px_rgba(15,23,42,0.06)] md:col-span-1 xl:col-span-2 ${cardPlacementClasses[index]}`}
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
