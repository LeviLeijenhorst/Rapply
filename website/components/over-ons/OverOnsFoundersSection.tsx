import Image, { StaticImageData } from "next/image";
import Button from "@/components/Button";
import SectionContainer from "@/components/home/SectionContainer";
import leviImage from "@/over_ons/over_ons-Levi.jpg";
import jonasImage from "@/over_ons/over_ons-Jonas.jpg";

type Founder = {
  name: string;
  description: string[];
  image: StaticImageData;
  reverseOnDesktop?: boolean;
  linkedInUrl: string;
  openInNewTab?: boolean;
  imageClassName?: string;
  textContainerClassName?: string;
};

const founders: Founder[] = [
  {
    name: "Levi Leijenhorst",
    description: [
      "Levi heeft een achtergrond in toegepaste psychologie en merkte tijdens zijn werk als begeleider hoe tijdrovend en mentaal belastend verslaglegging kan zijn.",
      "Dat inzicht vormde de basis voor CoachScribe.",
      "Binnen CoachScribe richt Levi zich op het vertalen van praktijkproblemen naar een goed doordachte digitale oplossing. De technische infrastructuur en beveiliging zijn ingericht op basis van technologie van gespecialiseerde cloud- en AI-partners die binnen de EU veel worden gebruikt voor het verwerken van gevoelige informatie.",
      "Levi is verantwoordelijk voor de architectuurkeuzes, de manier waarop deze technologieen worden geintegreerd en de verdere doorontwikkeling van het platform. Daarnaast is hij nauw betrokken bij design, gebruikerservaring en de gesprekken met professionals die CoachScribe dagelijks gebruiken.",
    ],
    image: leviImage,
    imageClassName: "lg:rounded-l-[24px]",
    textContainerClassName: "lg:px-[80px]",
    linkedInUrl: "https://www.linkedin.com/in/levi-leijenhorst-07b1b71a2/",
    openInNewTab: true,
  },
  {
    name: "Jonas Kroon",
    description: [
      "Jonas heeft een achtergrond in toegepaste psychologie en herkende direct de uitdagingen waar professionals dagelijks mee te maken hebben.",
      "Als creatief oprichter is Jonas verantwoordelijk voor design, gebruikerservaring en marketing. Hij zorgt ervoor dat CoachScribe niet alleen goed werkt, maar ook prettig en intuitief aanvoelt. Jonas staat in nauw contact met coaches en re-integratieprofessionals om het product continu te verbeteren.",
    ],
    image: jonasImage,
    textContainerClassName: "lg:px-[80px]",
    imageClassName: "object-[78%_center] lg:rounded-r-[24px]",
    reverseOnDesktop: true,
    linkedInUrl: "https://www.linkedin.com/in/jonas-kroon-0105622bb/",
    openInNewTab: true,
  },
];

export default function OverOnsFoundersSection() {
  return (
    <SectionContainer
      className="bg-[#F8F9F9]"
      contentClassName="pb-0 pt-[80px] md:pb-0 md:pt-[80px]"
    >
      <div className="flex w-full flex-col gap-[40px]">
        <h2 className="text-center font-[var(--font-catamaran)] text-[40px] font-medium leading-[120%] text-black">
          Ontmoet <span className="text-[#BD0265]">de oprichters</span>
        </h2>
        <div className="flex w-full flex-col gap-[40px]">
          {founders.map((founder) => (
            <article
              key={founder.name}
              className="grid w-full overflow-hidden rounded-[24px] bg-[#F2F3F5] lg:grid-cols-2"
            >
              <div
                className={`order-2 flex h-full flex-col items-start justify-center px-8 py-[80px] md:px-10 ${
                  founder.reverseOnDesktop ? "lg:order-2" : "lg:order-1"
                } ${founder.textContainerClassName ?? ""}`}
              >
                <h3 className="text-[24px] font-semibold leading-[120%] text-[#BD0265]">
                  {founder.name}
                </h3>
                <div className="mt-4 space-y-4">
                  {founder.description.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-base font-normal leading-relaxed text-[#1D0A00]"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
                <Button
                  label="LinkedIn"
                  destination={founder.linkedInUrl}
                  openInNewTab={founder.openInNewTab}
                  showArrow
                  className="mt-10 font-normal"
                />
              </div>
              <div
                className={`order-1 flex h-full w-full ${
                  founder.reverseOnDesktop ? "lg:order-1" : "lg:order-2"
                }`}
              >
                <Image
                  src={founder.image}
                  alt={founder.name}
                  className={`h-full min-h-[340px] w-full object-cover ${
                    founder.imageClassName ?? ""
                  }`}
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}
