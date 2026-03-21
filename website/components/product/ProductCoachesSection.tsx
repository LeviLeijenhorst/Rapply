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
            alt="Rapply door coaches ontwikkeld"
            fill
            sizes="(min-width: 1024px) 52vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="flex w-full flex-col items-start">
          <h2 className="font-[var(--font-catamaran)] text-[40px] font-medium leading-[120%] text-black">
            <span className="block">Voor coaches,</span>
            <span className="block text-[#BD0265]">door coaches.</span>
          </h2>
          <div className="mt-3 flex w-full flex-col gap-6">
            <p className="text-[16px] font-medium text-black/70">
              Rapply is niet gebouwd achter een bureau. Het is ontstaan
              vanuit de praktijk, door tientallen gesprekken met loopbaan- en
              re-integratiecoaches die dagelijks tegen dezelfde
              uitdagingen aanliepen. Hun ervaringen, frustraties en behoeften
              vormen de basis van elk onderdeel van het product.
            </p>
            <p className="text-[16px] font-medium text-black/70">
              We blijven continu in gesprek met coaches om Rapply te
              verbeteren. Want het werkveld verandert, en Rapply verandert
              mee.
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
