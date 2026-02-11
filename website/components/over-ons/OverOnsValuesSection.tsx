import Image, { StaticImageData } from "next/image";
import SectionContainer from "@/components/home/SectionContainer";
import userTagIcon from "@/over_ons/user-tag.svg";
import peopleIcon from "@/over_ons/people.svg";
import medalStarIcon from "@/over_ons/medal-star.svg";
import magicpenIcon from "@/over_ons/magicpen.svg";
import sunIcon from "@/over_ons/sun.svg";
import peopleOneIcon from "@/over_ons/people-1.svg";

type ValueItem = {
  title: string;
  description: string;
  icon: StaticImageData;
};

const values: ValueItem[] = [
  {
    title: "Mensgericht",
    description:
      "Technologie ondersteunt altijd de coach en de cliënt, zonder de menselijke connectie te vervangen.",
    icon: userTagIcon,
  },
  {
    title: "Samenwerking",
    description:
      "CoachScribe ontstaat niet in isolatie. We ontwikkelen samen met coaches, partners en elkaar.",
    icon: peopleIcon,
  },
  {
    title: "Kwaliteit",
    description:
      "Alles wat we bouwen is gericht op het verbeteren van de kwaliteit van coaching en het ondersteunen van elke sessie.",
    icon: medalStarIcon,
  },
  {
    title: "Innovatie",
    description:
      "We testen en verbeteren continu, zodat CoachScribe beter aansluit bij de praktijk van coaches.",
    icon: magicpenIcon,
  },
  {
    title: "Transparantie",
    description:
      "We zijn open over hoe CoachScribe werkt en hoe we omgaan met data, zodat coaches altijd weten waar ze aan toe zijn.",
    icon: sunIcon,
  },
  {
    title: "Verbinding",
    description:
      "Onze tools helpen coaches sterker in contact te staan met hun cliënten en de relatie te verdiepen.",
    icon: peopleOneIcon,
  },
];

export default function OverOnsValuesSection() {
  return (
    <SectionContainer className="bg-[linear-gradient(135deg,#A9D9F3_0%,#EDC2D9_100%)]">
      <div className="flex w-full flex-col gap-8 md:gap-10">
        <h2 className="text-center text-4xl font-semibold leading-tight text-[#1D0A00] md:text-6xl">
          Onze <span className="text-[#BD0265]">kernwaarden</span>
        </h2>
        <div className="grid w-full gap-6 md:grid-cols-2 xl:grid-cols-3">
          {values.map((value) => (
            <article
              key={value.title}
              className="flex w-full flex-col gap-4 rounded-xl bg-[#F8F9F9] p-6"
            >
              <h3 className="flex items-center gap-3 text-[28px] font-semibold text-[#BD0265]">
                <Image src={value.icon} alt="" width={20} height={20} />
                <span>{value.title}</span>
              </h3>
              <p className="text-base font-normal leading-relaxed text-[#243747]">
                {value.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}
