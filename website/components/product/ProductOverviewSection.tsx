import Image from "next/image";
import SectionContainer from "@/components/home/SectionContainer";
import featuresImage from "@/home/Features.png";
import product2MobileImage from "@/product/product-2-mobile.png";

export default function ProductOverviewSection() {
  return (
    <SectionContainer className="bg-white" contentClassName="md:pt-[160px] md:pb-20">
      <div className="flex w-full flex-col items-center gap-10">
        <Image
          src={featuresImage}
          alt="CoachScribe functies overzicht"
          className="hidden h-auto w-full rounded-[28px] md:block"
        />
        <Image
          src={product2MobileImage}
          alt="CoachScribe functies overzicht mobiel"
          className="h-auto w-full rounded-[28px] md:hidden"
        />
      </div>
    </SectionContainer>
  );
}
