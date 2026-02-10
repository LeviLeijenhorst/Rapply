import Image from "next/image";
import SectionContainer from "@/components/home/SectionContainer";
import productOverviewDesktop from "@/product/product-2-desktop.png";
import productOverviewMobile from "@/product/product-2-mobile.png";

export default function ProductOverviewSection() {
  return (
    <SectionContainer className="bg-white">
      <div className="flex w-full flex-col items-center gap-10">
        <h2 className="max-w-4xl text-center text-3xl font-semibold leading-tight text-[#1D0A00] md:text-5xl">
          Alles rondom je sessies
          <span className="block text-[#BD0265]">op een plek</span>
        </h2>
        <Image
          src={productOverviewDesktop}
          alt="CoachScribe functies overzicht"
          className="hidden h-auto w-full rounded-[28px] md:block"
        />
        <Image
          src={productOverviewMobile}
          alt="CoachScribe functies overzicht mobiel"
          className="h-auto w-full rounded-[28px] md:hidden"
        />
      </div>
    </SectionContainer>
  );
}
