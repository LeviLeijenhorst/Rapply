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
      "Levi heeft een achtergrond in toegepaste-psychologie en tijdens zijn stage als studentencoach is het idee voor CoachScribe ontstaan.",
      "Levi is technisch aangelegd en heeft zichzelf leren coderen als hobby, deze hobby is ondertussen flink uit de hand gelopen en hij is verantwoordelijk over de gehele technische kant van CoachScribe, de veiligheid en alles wat hiermee te maken heeft.",
      "Daarnaast voert Levi regelmatig feedback- en salesgesprekken met coaches, is nauw betrokken bij het design en gebruikerservaring en is een gepassioneerde ondernemer.",
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
      "Jonas is een oude jeugdvriend van Levi. Ook hij heeft toegepaste-psychologie gestudeerd en herkende de problemen die Levi omschreef. Toen Jonas het idee voor CoachScribe hoorde was hij gelijk verkocht.",
      "Jonas is creatief en strategisch ingesteld. Hij neemt het design, de gebruikerservaring en marketing voor zijn rekening en houdt zich bezig met alles aan de voorkant van CoachScribe.",
      "Ook Jonas voert regelmatig feedback- en salesgesprekken met coaches, is constant opzoek naar ruimte voor verbetering en een gepassioneerde ondernemer.",
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
