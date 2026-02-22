import Image from "next/image";
import Button from "@/components/Button";
import SectionContainer from "@/components/home/SectionContainer";
import coachesImage from "@/product/Door coaches.jpg";

export default function ProductCoachesSection() {
  return (
    <SectionContainer className="bg-white" contentClassName="md:pt-20 md:pb-20">
      <div className="grid w-full items-start gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
        <div className="relative w-full overflow-hidden rounded-2xl aspect-[4/3] lg:aspect-auto lg:h-full">
          <Image
            src={coachesImage}
            alt="CoachScribe door coaches ontwikkeld"
            fill
            sizes="(min-width: 1024px) 52vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="flex w-full flex-col items-start">
          <h2 className="text-3xl font-semibold leading-tight text-black md:text-4xl">
            In samenwerking met <span className="text-[#BD0265]">professionals</span>
          </h2>
          <div className="mt-3 flex w-full flex-col gap-6">
            <p className="text-[16px] font-medium text-black/70">
              CoachScribe is ontstaan uit tientallen gesprekken met loopbaan-
              en re-integratieprofessionals uit het werkveld. Door te
              onderzoeken welke functies echt waardevol zijn, hebben we een
              product ontwikkeld dat volledig aansluit bij hun behoeften.
            </p>
            <p className="text-[16px] font-medium text-black/70">
              We blijven continu in contact met professionals om het product te
              verbeteren en verder te ontwikkelen.
            </p>
            <p className="text-[16px] font-medium text-black/70">
              Wil je meedenken of input geven? Neem contact met ons op!
            </p>
          </div>
          <Button
            label="Contact"
            destination="/contact"
            variant="primary"
            showArrow
            className="mt-6 font-normal"
          />
        </div>
      </div>
    </SectionContainer>
  );
}
