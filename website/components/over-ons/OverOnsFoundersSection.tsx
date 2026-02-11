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
  },
  {
    name: "Jonas Kroon",
    description: [
      "Jonas is een oude jeugdvriend van Levi. Ook hij heeft toegepaste-psychologie gestudeerd en herkende de problemen die Levi omschreef. Toen Jonas het idee voor CoachScribe hoorde was hij gelijk verkocht.",
      "Jonas is creatief en strategisch ingesteld. Hij neemt het design, de gebruikerservaring en marketing voor zijn rekening en houdt zich bezig met alles aan de voorkant van CoachScribe.",
      "Ook Jonas voert regelmatig feedback- en salesgesprekken met coaches, is constant opzoek naar ruimte voor verbetering en een gepassioneerde ondernemer.",
    ],
    image: jonasImage,
    reverseOnDesktop: true,
  },
];

export default function OverOnsFoundersSection() {
  return (
    <SectionContainer className="bg-[#F8F9F9]">
      <div className="flex w-full flex-col gap-8 md:gap-10">
        <h2 className="text-center text-4xl font-semibold leading-tight text-[#1D0A00] md:text-6xl">
          Ontmoet <span className="text-[#BD0265]">de oprichters</span>
        </h2>
        <div className="flex w-full flex-col gap-8">
          {founders.map((founder) => (
            <article
              key={founder.name}
              className="grid w-full overflow-hidden rounded-[24px] bg-[#F2F3F5] lg:grid-cols-2"
            >
              <div
                className={`order-2 flex flex-col items-start gap-6 p-8 md:p-10 lg:order-1 ${
                  founder.reverseOnDesktop ? "lg:order-2" : "lg:order-1"
                }`}
              >
                <h3 className="text-[32px] font-semibold leading-tight text-[#BD0265]">
                  {founder.name}
                </h3>
                <div className="space-y-4">
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
                  destination="https://www.linkedin.com"
                  showArrow
                  className="font-normal"
                />
              </div>
              <div
                className={`order-1 flex h-full w-full lg:order-2 ${
                  founder.reverseOnDesktop ? "lg:order-1" : "lg:order-2"
                }`}
              >
                <Image
                  src={founder.image}
                  alt={founder.name}
                  className="h-full min-h-[340px] w-full object-cover"
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}
