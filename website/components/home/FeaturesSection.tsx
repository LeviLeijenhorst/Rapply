import Image from "next/image";
import Button from "@/components/Button";
import SectionContainer from "@/components/home/SectionContainer";
import productOneImage from "@/home/Product BG 1 2.png";
import productFgOneImage from "@/home/Product FG 1.png";
import productFgTwoImage from "@/home/Product FG 2.png";
import productFgThreeImage from "@/home/Product FG 3.png";
import productFgFourImage from "@/home/Product FG 4.png";
import productTwoImage from "@/home/Product BG 2.jpg";
import productThreeImage from "@/home/Product BG 4.jpg";
import productFourImage from "@/home/Product BG 3.jpg";

const FG1_WHITE_TO_BOUNDING_LEFT_PX = 14;
const FG1_WHITE_TO_BOUNDING_BOTTOM_PX = 14;

const featureItems = [
  {
    title: "Leg je sessie vast",
    description:
      "Zet de opname aan en focus je volledig op jouw cliënt. CoachScribe neemt het gehele gesprek veilig op terwijl jij je bezig houdt met waar je goed in bent; mensen helpen.\n\nCoachScript is gebouwd voor maximale focus.",
    image: productOneImage,
  },
  {
    title: "Kies jouw workflow",
    description:
      "Er zijn meerdere templates inbegrepen die je kan gebruiken zodat de sessie wordt vastgelegd zoals jij dat wil. Gebruik je liever je eigen template? geen probleem!\n\nOntworpen om aan te sluiten op jouw workflow.",
    image: productTwoImage,
  },
  {
    title: "Beheer de sessie",
    description:
      "Lees het automatische verslag en pas aan waar nodig, stel snelle vragen aan de slimme AI-Chat, maak notities en lees of luister specifieke momenten terug uit het gesprek.\n\nOverzichtelijk, simpel en alles op één plek.",
    image: productFourImage,
  },
  {
    title: "Deel in jouw huisstijl",
    description:
      "Deel verslagen direct met je coachee, in jouw eigen huisstijl. Voeg je logo en praktijkkleur toe, zodat elke PDF direct herkenbaar en professioneel oogt.\n\nGemaakt met oog op coach én coachee.",
    image: productThreeImage,
  },
];

export default function FeaturesSection() {
  return (
    <SectionContainer
      className="bg-white"
      contentClassName="md:pt-[160px] md:pb-20"
      disableReveal
    >
      {/* Features content */}
      <div className="flex w-full flex-col gap-10">
        {/* Features list */}
        <div className="flex w-full flex-col gap-10">
          {featureItems.map((featureItem, index) => {
            const isReversed = index % 2 === 1;
            const containerGapClass =
              index === 1
                ? "md:gap-[80px]"
                : index === 3
                  ? "md:gap-[80px]"
                  : "md:gap-10";
            return (
              <div
                key={featureItem.title}
                className={`mx-auto flex w-full max-w-[1147px] flex-col gap-6 rounded-3xl bg-[#F8FAFC] px-[80px] py-6 md:h-[480px] md:items-center ${containerGapClass} ${
                  isReversed ? "md:flex-row-reverse" : "md:flex-row"
                }`}
              >
                {/* Feature text */}
                <div className="flex w-full flex-col gap-6 md:w-1/2">
                  {/* Feature title */}
                  <h3 className="font-[var(--font-catamaran)] text-[40px] font-medium leading-[120%] text-black">
                    {featureItem.title}
                  </h3>
                  {/* Feature description */}
                  <p className="whitespace-pre-line text-[16px] font-medium text-black/70">
                    {featureItem.description}
                  </p>
                  {/* Feature action */}
                  <div className="flex w-full">
                    <Button
                      label="Probeer het uit"
                      destination="/wachtlijst"
                      variant="primary"
                      showArrow
                      className="font-normal"
                    />
                  </div>
                </div>
                {/* Feature image */}
                <div
                  className={`relative group flex w-full overflow-hidden rounded-2xl md:h-[480px] md:w-[572px] md:shrink-0 ${
                    isReversed ? "md:-ml-[80px]" : "md:-mr-[80px]"
                  }`}
                >
                  <Image
                    src={featureItem.image}
                    alt={featureItem.title}
                    className="h-full w-full object-cover"
                  />
                  {index === 0 ? (
                    <div
                      className="absolute z-10"
                      style={{
                        left: `${20 - FG1_WHITE_TO_BOUNDING_LEFT_PX - 25}px`,
                        bottom: `${80 - FG1_WHITE_TO_BOUNDING_BOTTOM_PX - 50}px`,
                      }}
                    >
                      <Image
                        src={productFgOneImage}
                        alt=""
                        className="translate-y-0 layered-float-a"
                      />
                    </div>
                  ) : null}
                  {index === 1 ? (
                    <div
                      className="absolute z-10"
                      style={{
                        left: "calc(130px + 30% + 20px)",
                        bottom: "calc(109px + 20% + 30px)",
                      }}
                    >
                      <Image
                        src={productFgTwoImage}
                        alt=""
                        className="origin-top-right scale-[2.2] translate-y-0 layered-float-b"
                      />
                    </div>
                  ) : null}
                  {index === 2 ? (
                    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                      <Image
                        src={productFgThreeImage}
                        alt=""
                        className="layered-float-c translate-y-[8%] scale-[1.17]"
                      />
                    </div>
                  ) : null}
                  {index === 3 ? (
                    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                      <Image
                        src={productFgFourImage}
                        alt=""
                        className="layered-float-d translate-x-[16%] translate-y-0 scale-[0.7]"
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SectionContainer>
  );
}
