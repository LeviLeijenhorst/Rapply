import Image from "next/image";
import Button from "@/components/Button";
import SectionContainer from "@/components/home/SectionContainer";
import SectionHeading from "@/components/home/SectionHeading";
import checkmarkCircleIcon from "@/home/checkmark-circle.svg";

const securityItems = [
  {
    title: "AVG-proof",
    description:
      "CoachScribe is AVG-proof ingericht. Opslag en verwerking van gegevens vinden uitsluitend plaats binnen de EU, volgens de geldende privacywetgeving.",
  },
  {
    title: "Versleuteld opgeslagen",
    description:
      "Alle gegevens zijn beveiligd met sterke encryptie, zowel tijdens verzending (in transit) als wanneer ze zijn opgeslagen (at rest).",
  },
  {
    title: "Jouw data blijft van jou",
    description:
      "Jouw data wordt nooit gebruikt om AI-modellen te trainen of te verbeteren. Daarnaast kan je op elk moment je data verwijderen, het is jouw data.",
  },
];

export default function SecuritySection() {
  return (
    <SectionContainer className="bg-[#EEF2FF]">
      {/* Security content */}
      <div className="flex w-full flex-col gap-8">
        {/* Security heading */}
        <SectionHeading
          title="Ontworpen met"
          highlightedTitle="veiligheid op #1"
          description="Beschermde opslag, duidelijke regels en volledige controle over jouw data."
          alignment="center"
        />
        {/* Security cards */}
        <div className="grid w-full gap-6 md:grid-cols-3">
          {securityItems.map((securityItem) => (
            <div
              key={securityItem.title}
              className="flex w-full flex-col gap-4 rounded-2xl bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.08)]"
            >
              {/* Security card icon */}
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FCE7F3]">
                <Image
                  src={checkmarkCircleIcon}
                  alt=""
                  width={24}
                  height={24}
                />
              </div>
              {/* Security card title */}
              <h3 className="text-lg font-semibold text-black">
                {securityItem.title}
              </h3>
              {/* Security card description */}
              <p className="text-sm font-normal text-black/70">
                {securityItem.description}
              </p>
            </div>
          ))}
        </div>
        {/* Security action */}
        <div className="flex w-full items-center justify-center">
          <Button
            label="Meer informatie"
            destination="/veiligheid"
            variant="primary"
            className="font-normal"
          />
        </div>
      </div>
    </SectionContainer>
  );
}
