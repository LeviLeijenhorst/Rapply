"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import SectionContainer from "@/components/home/SectionContainer";
import featuresImage from "@/home/Features.png";
import product2MobileImage from "@/product/product-2-mobile.png";

export default function ProductOverviewSection() {
  const [isImageVisible, setIsImageVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsImageVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const fadeInClassName = `transition-[opacity,transform] duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
    isImageVisible ? "opacity-100" : "opacity-0"
  }`;
  const moveUpClassName = isImageVisible ? "translate-y-0" : "translate-y-[16px]";

  return (
    <SectionContainer className="bg-white" contentClassName="md:pt-[160px] md:pb-20">
      <div className="flex w-full flex-col items-center gap-10">
        <Image
          src={featuresImage}
          alt="CoachScribe functies overzicht"
          className={`hidden h-auto w-full rounded-[28px] md:block ${fadeInClassName} ${moveUpClassName}`}
        />
        <Image
          src={product2MobileImage}
          alt="CoachScribe functies overzicht mobiel"
          className={`h-auto w-full rounded-[28px] md:hidden ${fadeInClassName} ${moveUpClassName}`}
        />
      </div>
    </SectionContainer>
  );
}
