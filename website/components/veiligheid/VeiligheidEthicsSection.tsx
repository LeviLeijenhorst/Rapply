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
    <SectionContainer className="bg-[#F8F9F9]">
      <div className="flex w-full flex-col gap-10">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
          <h2 className="text-4xl font-semibold text-[#1D0A00]">
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
          {ethicsItems.map((ethicsItem) => (
            <article
              key={ethicsItem.title}
              className="flex min-h-[380px] flex-col items-center rounded-2xl border border-black/10 bg-white p-6 text-center"
            >
              <h3 className="text-4xl font-semibold text-[#BD0265] md:text-5xl">
                {ethicsItem.title}
              </h3>
              <div className="my-6 flex flex-1 items-center justify-center">
                <Image
                  src={ethicsItem.image}
                  alt={ethicsItem.title}
                  className="h-auto w-full max-w-[140px]"
                />
              </div>
              <p className="text-base font-normal leading-relaxed text-[#1D0A00]">
                {ethicsItem.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}
