import Image from "next/image";
import SectionContainer from "@/components/home/SectionContainer";
import product2DesktopImage from "@/product/product-2-desktop.png";
import product2MobileImage from "@/product/product-2-mobile.png";

export default function ProductOverviewSection() {
  return (
    <SectionContainer className="bg-white" contentClassName="!pt-0 md:!pt-0 md:pb-20">
      <div className="flex w-full flex-col items-center">
        <Image
          src={product2DesktopImage}
          alt="Rapply functies overzicht"
          className="hidden h-auto w-full rounded-[28px] md:block"
        />
        <Image
          src={product2MobileImage}
          alt="Rapply functies overzicht mobiel"
          className="h-auto w-full rounded-[28px] md:hidden"
        />
      </div>
    </SectionContainer>
  );
}
