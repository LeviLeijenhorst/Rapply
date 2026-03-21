import Image from "next/image";
import Button from "@/components/Button";
import SectionContainer from "@/components/home/SectionContainer";
import heroImage from "@/product/product-1.png";

export default function ProductHeroSection() {
  return (
    <SectionContainer className="bg-white">
      <div className="grid w-full items-center gap-10 lg:grid-cols-2">
        <div className="flex w-full flex-col items-start lg:translate-y-[56px]">
          <div className="flex w-full flex-col items-start gap-4">
            <h1 className="font-[var(--font-catamaran)] text-[38px] font-medium leading-[110%] text-black md:text-[50px] xl:text-[64px]">
              <span className="block text-[#BD0265]">Bespaar tijd,</span>
              <span className="block">focus op de mens</span>
            </h1>
            <p className="max-w-xl text-[16px] font-medium text-black/70">
              Stop met uren kwijt zijn aan verslagen. Rapply legt jouw
              sessies automatisch vast en genereert direct een professioneel
              verslag.
            </p>
          </div>
          <div className="mt-6">
            <Button
              label="Maak een afspraak"
              destination="https://calendly.com/jonaskroon/new-meeting?month=2026-02"
              openInNewTab
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
