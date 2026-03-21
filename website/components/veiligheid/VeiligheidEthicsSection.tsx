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
      "Automatisering mag het werk verlichten, maar nooit de coach vervangen.",
    image: relieveImage,
  },
];

const matchingHeadingClass =
  "font-[var(--font-catamaran)] text-[24px] font-bold leading-[120%] md:text-[28px]";

export default function VeiligheidEthicsSection() {
  return (
    <>
      <SectionContainer
        className="bg-[#EEF0FF]"
        contentClassName="pt-[80px] pb-[80px] md:pt-[80px] md:pb-[80px]"
      >
        <div className="mx-auto grid w-full max-w-3xl gap-[40px] md:grid-cols-2 md:gap-[60px]">
          <div className="flex w-full flex-col items-start gap-4 text-left">
              <h4 className={`${matchingHeadingClass} text-black`}>
                Wat we <span className="text-[#BD0265]">doen</span>
              </h4>
            <ul className="list-disc space-y-1 pl-5 text-sm font-normal leading-relaxed text-[#1D0A00] md:text-base">
              <li>Opslag van aan sessies gerelateerde gegevens binnen de Europese Unie</li>
              <li>Versleutelde opslag met aanvullende versleutelingslaag</li>
              <li>Encryptiesleutels worden buiten de opslagomgeving beheerd</li>
              <li>Verwerkersovereenkomst beschikbaar</li>
              <li>Transparantie over subverwerkers</li>
            </ul>
          </div>
          <div className="flex w-full flex-col items-start gap-4 text-left">
            <h4 className={`${matchingHeadingClass} text-black`}>
              Wat we <span className="text-[#BD0265]">niet doen</span>
            </h4>
            <ul className="list-disc space-y-1 pl-5 text-sm font-normal leading-relaxed text-[#1D0A00] md:text-base">
              <li>Geen verkoop van data</li>
              <li>Geen advertenties</li>
              <li>Geen training van AI-modellen op jouw inhoud</li>
              <li>Geen verwerking buiten de Europese Unie</li>
            </ul>
          </div>
        </div>
      </SectionContainer>
      <SectionContainer className="bg-white" contentClassName="pt-[80px] pb-12 md:pt-[80px] md:pb-16">
        <div className="flex w-full flex-col gap-10">
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-[16px] text-center">
            <h2 className="text-4xl font-semibold text-[#1D0A00]">
              Aanvullende <span className="text-[#BD0265]">versleuteling tijdens opslag</span>
            </h2>
            <div className="w-full text-center">
              <p className="text-base font-normal leading-relaxed text-[#1D0A00]">
                Gegevens worden opgeslagen binnen de Europese Unie en zijn
                versleuteld. Daarnaast passen wij een extra versleutelingslaag
                toe. De encryptiesleutels worden beheerd buiten de cloud-omgeving
                waarin de gegevens worden opgeslagen. De aanvullende
                versleuteling zorgt ervoor dat opgeslagen gegevens binnen de
                cloud niet leesbaar zijn voor de cloud-provider.
              </p>
            </div>
          </div>
        </div>
      </SectionContainer>
      <SectionContainer
        className="bg-white bg-[linear-gradient(135deg,rgba(169,217,243,0.5)_0%,rgba(237,194,217,0.5)_100%)]"
        contentClassName="pt-[80px] pb-[80px] md:pt-[80px] md:pb-[80px]"
      >
        <div className="flex w-full flex-col gap-10">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-[16px] text-center">
            <h2 className="font-[var(--font-catamaran)] text-[40px] font-medium leading-[120%] text-black">
              <span className="text-[#BD0265]">Ethiek</span> als uitgangspunt
            </h2>
            <p className="text-base font-normal leading-relaxed text-[#1D0A00]">
              Privacy en beveiliging zijn voor ons niet alleen technische
              vraagstukken, maar ook ethische keuzes. Rapply wordt gebruikt
              in contexten waarin vertrouwen centraal staat en daar zijn wij ons
              van bewust. Rapply is ontworpen in dienst van coach en coachee.
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
                <h3 className={`relative z-10 ${matchingHeadingClass} text-[#BD0265]`}>
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
    </>
  );
}
