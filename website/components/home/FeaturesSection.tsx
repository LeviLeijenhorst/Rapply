import Image from "next/image";
import Button from "@/components/Button";
import SectionContainer from "@/components/home/SectionContainer";
import productOneImage from "@/home/product-1.jpg";
import productTwoImage from "@/home/product-2.jpg";
import productThreeImage from "@/home/product-3.jpg";
import productFourImage from "@/home/product-4.jpg";

const featureItems = [
  {
    title: "Record je sessie met een klik",
    description:
      "Zet de opname aan voor of tijdens je gesprek en laat CoachScribe het werk doen. Jij blijft bij je client.",
    image: productOneImage,
  },
  {
    title: "Selecteer een template",
    description:
      "Kies een structuur die past bij jouw manier van werken. Het verslag past zich aan jouw voorkeuren aan.",
    image: productTwoImage,
  },
  {
    title: "Beheer de sessie",
    description:
      "Controleer, vul aan en organiseer alles op één plek. Zo blijft je dossier overzichtelijk.",
    image: productFourImage,
  },
  {
    title: "Deel in jouw huisstijl",
    description:
      "Deel verslagen direct met je client of team. Voeg je eigen branding toe voor een professionele uitstraling.",
    image: productThreeImage,
  },
];

export default function FeaturesSection() {
  return (
    <SectionContainer className="bg-white">
      {/* Features content */}
      <div className="flex w-full flex-col gap-10">
        {/* Features list */}
        <div className="flex w-full flex-col gap-8">
          {featureItems.map((featureItem, index) => {
            const isReversed = index % 2 === 1;
            return (
              <div
                key={featureItem.title}
                className={`flex w-full flex-col gap-6 rounded-3xl bg-[#F8FAFC] p-6 md:items-center md:gap-10 ${
                  isReversed ? "md:flex-row-reverse" : "md:flex-row"
                }`}
              >
                {/* Feature text */}
                <div className="flex w-full flex-col gap-4 md:w-1/2">
                  {/* Feature title */}
                  <h3 className="text-xl font-semibold text-black">
                    {featureItem.title}
                  </h3>
                  {/* Feature description */}
                  <p className="text-sm font-normal text-black/70">
                    {featureItem.description}
                  </p>
                  {/* Feature action */}
                  <div className="flex w-full">
                    <Button
                      label="Probeer Gratis"
                      destination="https://app.coachscribe.nl"
                      variant="primary"
                      showArrow
                      className="font-normal"
                    />
                  </div>
                </div>
                {/* Feature image */}
                <div className="group flex w-full overflow-hidden rounded-2xl md:w-1/2">
                  <Image
                    src={featureItem.image}
                    alt={featureItem.title}
                    className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SectionContainer>
  );
}
