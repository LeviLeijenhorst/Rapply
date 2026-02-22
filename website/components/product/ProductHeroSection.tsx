import Image from "next/image";
import Button from "@/components/Button";
import SectionContainer from "@/components/home/SectionContainer";
import heroImage from "@/product/product-1.png";

export default function ProductHeroSection() {
  return (
    <SectionContainer className="bg-white">
      <div className="grid w-full items-center gap-10 lg:grid-cols-2">
        <div className="flex w-full flex-col items-start lg:translate-y-[46px]">
          <div className="flex w-full flex-col items-start gap-4">
            <h1 className="font-[var(--font-catamaran)] text-[38px] font-medium leading-[110%] text-black md:text-[50px] xl:text-[64px]">
              <span className="block text-[#BD0265]">Ervaar rust</span>
              <span className="block">met onze features</span>
            </h1>
            <p className="max-w-xl text-[16px] font-medium text-black/70">
              CoachScribe neemt het maken van notities tijdens gesprekken en de
              verslaglegging uit handen. Op een manier die is afgestemd op de
              werkwijze van loopbaan- en re-integratieprofessionals.
            </p>
          </div>
          <div className="mt-6">
            <Button
              label="Probeer het uit"
              destination="https://app.coachscribe.nl"
              variant="primary"
              showArrow
              className="font-normal"
            />
          </div>
        </div>
        <div className="flex w-full justify-center lg:justify-end">
          <Image
            src={heroImage}
            alt="Coach en client in gesprek"
            className="h-auto w-full max-w-[380px] object-contain md:max-w-[520px] xl:max-w-[680px]"
            priority
          />
        </div>
      </div>
    </SectionContainer>
  );
}

