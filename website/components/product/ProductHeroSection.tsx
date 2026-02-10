import Image from "next/image";
import Button from "@/components/Button";
import SectionContainer from "@/components/home/SectionContainer";
import heroImage from "@/product/product-1.png";

export default function ProductHeroSection() {
  return (
    <SectionContainer className="bg-white">
      <div className="grid w-full items-center gap-10 lg:grid-cols-2">
        <div className="flex w-full flex-col items-start gap-6">
          <h1 className="text-4xl font-semibold leading-tight text-black md:text-5xl">
            <span className="block text-[#BD0265]">Ervaar rust</span>
            <span className="block">met onze features</span>
          </h1>
          <p className="max-w-xl text-base font-normal leading-relaxed text-[#243747] md:text-lg">
            CoachScribe neemt het noteren van gesprekken en verslaggeving uit
            handen. Jij behoudt de volledige controle, wij helpen je met de
            details en het overzicht.
          </p>
          <Button
            label="Probeer Gratis"
            destination="https://app.coachscribe.nl"
            variant="primary"
            showArrow
            className="font-normal"
          />
        </div>
        <div className="flex w-full justify-center lg:justify-end">
          <Image
            src={heroImage}
            alt="Coach en client in gesprek"
            className="h-auto w-full max-w-[680px] object-contain"
            priority
          />
        </div>
      </div>
    </SectionContainer>
  );
}
