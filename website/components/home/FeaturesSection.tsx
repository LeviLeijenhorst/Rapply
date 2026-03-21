"use client";

import Image, { StaticImageData } from "next/image";
import { useEffect, useRef, useState } from "react";
import SectionContainer from "@/components/home/SectionContainer";
import productOneImage from "@/home/Product BG 1 2.png";
import productFgOneImage from "@/home/Product FG 1.png";
import productFgTwoImage from "@/home/Product FG 2.png";
import productFgThreeImage from "@/home/Product FG 3.png";
import productFgFourImage from "@/home/Product FG 4.png";
import productTwoImage from "@/home/Product BG 2.jpg";
import productThreeImage from "@/home/Product BG 4.jpg";
import productFourImage from "@/home/Product BG 3.jpg";

const FG1_WHITE_TO_BOUNDING_LEFT_PX = 14;
const FG1_WHITE_TO_BOUNDING_BOTTOM_PX = 14;
const FEATURE_IMAGE_HEIGHT_PX = 480;

type FeatureItem = {
  title: string;
  description: string;
  image: StaticImageData;
};

type FeaturesSectionProps = {
  contentClassName?: string;
};

const featureItems: FeatureItem[] = [
  {
    title: "Leg je sessies vast",
    description:
      "Zet de opname aan en focus je volledig op jouw client. Rapply neemt het gehele gesprek veilig op terwijl jij je bezig houdt met waar jij goed in bent: mensen helpen.",
    image: productOneImage,
  },
  {
    title: "Genereer rapportage",
    description:
      "Kies een template die past bij het traject of de fase van je cliënt, of gebruik je eigen. Rapply genereert automatisch een gestructureerde rapportage met alle relevante informatie verwerkt.",
    image: productTwoImage,
  },
  {
    title: "Stuur het op",
    description:
      "Verstuur verslagen direct vanuit Rapply, klaar om in te leveren bij het UWV, werkgevers of je cliënt. Voeg je logo en praktijkkleur toe zodat elk verslag er professioneel en herkenbaar uitziet.",
    image: productThreeImage,
  },
  {
    title: "Behoud overzicht",
    description:
      "Alle relevante informatie voor het traject op één plek. Lees het automatische verslag en pas aan waar nodig, stel vragen aan de AI-chat, maak notities en luister specifieke momenten terug. Overzichtelijk en simpel.",
    image: productFourImage,
  },
];

function renderFeatureForeground(index: number, isActive: boolean) {
  if (index === 0) {
    return (
      <div
        className={`absolute z-10 transition-all duration-[1050ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isActive ? "translate-y-0 opacity-100" : "translate-y-8 opacity-100"
        }`}
        style={{
          left: `${20 - FG1_WHITE_TO_BOUNDING_LEFT_PX - 25}px`,
          bottom: `${28 - FG1_WHITE_TO_BOUNDING_BOTTOM_PX}px`,
        }}
      >
        <div className="layered-float-c">
          <Image src={productFgOneImage} alt="" className="translate-y-0 scale-[0.9]" />
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div
        className={`absolute z-10 transition-all duration-[1050ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isActive ? "translate-y-0 opacity-100" : "translate-y-8 opacity-100"
        }`}
        style={{
          left: "calc(120px + 30% + 20px)",
          bottom: "calc(109px + 20% + 30px)",
        }}
      >
        <div className="layered-float-c">
          <Image
            src={productFgTwoImage}
            alt=""
            className="origin-top-right scale-[1.98] translate-y-0"
          />
        </div>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div
        className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center transition-all duration-[1050ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isActive ? "translate-y-0 opacity-100" : "translate-y-8 opacity-100"
        }`}
      >
        <div className="layered-float-c">
          <Image
            src={productFgFourImage}
            alt=""
            className="translate-x-[16%] translate-y-0 scale-[0.7]"
            style={{ marginLeft: "-50px", marginTop: "30px" }}
          />
        </div>
      </div>
    );
  }

  if (index === 3) {
    return (
      <div
        className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center transition-all duration-[1050ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isActive ? "scale-100 opacity-100" : "scale-[0.82] opacity-100"
        }`}
      >
        <Image
          src={productFgThreeImage}
          alt=""
          className="layered-float-c translate-y-[8%] scale-[1.17]"
        />
      </div>
    );
  }

  return null;
}

function renderMobileFeatureForeground(index: number) {
  if (index === 0) {
    return (
      <div className="pointer-events-none absolute left-[2%] bottom-[2%] z-10 w-[88%]">
        <div className="layered-float-c">
          <Image src={productFgOneImage} alt="" className="h-auto w-full scale-[0.94]" />
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="pointer-events-none absolute right-[7%] bottom-[11%] z-10 w-[34%]">
        <div className="layered-float-c">
          <Image
            src={productFgTwoImage}
            alt=""
            className="h-auto w-full origin-top-right scale-[1.85]"
          />
        </div>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <div className="layered-float-c">
          <Image
            src={productFgFourImage}
            alt=""
            className="h-auto w-[76%] translate-x-[10%] translate-y-[12%] scale-[0.76]"
          />
        </div>
      </div>
    );
  }

  if (index === 3) {
    return (
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <Image
          src={productFgThreeImage}
          alt=""
          className="layered-float-c h-auto w-[78%] translate-y-[10%] scale-[1.08]"
        />
      </div>
    );
  }

  return null;
}

export default function FeaturesSection({
  contentClassName,
}: FeaturesSectionProps = {}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [stickyTop, setStickyTop] = useState(80);
  const [topTextSpacer, setTopTextSpacer] = useState(0);
  const [bottomTextSpacer, setBottomTextSpacer] = useState(0);
  const textCardRefs = useRef<Array<HTMLElement | null>>([]);
  const imageFrameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 768px)");

    let rafId = 0;

    const updateLayout = () => {
      if (!desktopQuery.matches) {
        setActiveIndex(0);
        setTopTextSpacer(0);
        setBottomTextSpacer(0);
        return;
      }

      const header = document.querySelector("header");
      const headerBottom =
        header instanceof HTMLElement ? header.getBoundingClientRect().bottom : 80;
      const centeredTop =
        headerBottom +
        Math.max((window.innerHeight - headerBottom - FEATURE_IMAGE_HEIGHT_PX) / 2, 0);
      const imageFrameRect = imageFrameRef.current?.getBoundingClientRect();
      const anchorY = imageFrameRect
        ? imageFrameRect.top + imageFrameRect.height / 2
        : centeredTop + FEATURE_IMAGE_HEIGHT_PX / 2;

      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      textCardRefs.current.forEach((card, index) => {
        if (!card) {
          return;
        }

        const rect = card.getBoundingClientRect();
        const cardCenterY = rect.top + rect.height / 2;
        const distance = Math.abs(cardCenterY - anchorY);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveIndex((currentIndex) =>
        currentIndex === closestIndex ? currentIndex : closestIndex,
      );

      setStickyTop((currentTop) =>
        Math.abs(currentTop - centeredTop) < 0.5 ? currentTop : centeredTop,
      );

      const firstCard = textCardRefs.current[0];
      const lastCard = textCardRefs.current[textCardRefs.current.length - 1];
      const firstCardHeight =
        firstCard instanceof HTMLElement ? firstCard.getBoundingClientRect().height : 0;
      const lastCardHeight =
        lastCard instanceof HTMLElement ? lastCard.getBoundingClientRect().height : 0;
      const nextTopSpacer = Math.max(
        (FEATURE_IMAGE_HEIGHT_PX - firstCardHeight) / 2,
        0,
      );
      const nextBottomSpacer = Math.max(
        (FEATURE_IMAGE_HEIGHT_PX - lastCardHeight) / 2,
        0,
      );

      setTopTextSpacer((currentValue) =>
        Math.abs(currentValue - nextTopSpacer) < 0.5 ? currentValue : nextTopSpacer,
      );
      setBottomTextSpacer((currentValue) =>
        Math.abs(currentValue - nextBottomSpacer) < 0.5
          ? currentValue
          : nextBottomSpacer,
      );
    };

    const queueUpdate = () => {
      if (rafId !== 0) {
        return;
      }

      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        updateLayout();
      });
    };

    queueUpdate();

    window.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", queueUpdate);
    desktopQuery.addEventListener("change", queueUpdate);

    return () => {
      window.removeEventListener("scroll", queueUpdate);
      window.removeEventListener("resize", queueUpdate);
      desktopQuery.removeEventListener("change", queueUpdate);
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <SectionContainer
      className="bg-white"
      contentClassName={contentClassName ?? "md:pt-[160px] md:pb-10"}
      disableReveal
    >
      <div className="mx-auto hidden w-full max-w-[1147px] md:grid md:grid-cols-[minmax(0,572px)_minmax(0,1fr)] md:gap-20">
        <div className="relative">
          <div className="sticky overflow-hidden rounded-2xl" style={{ top: `${stickyTop}px` }}>
            <div
              ref={imageFrameRef}
              className="relative h-[480px] w-full bg-[#F8FAFC]"
            >
              {featureItems.map((featureItem, index) => (
                <div
                  key={featureItem.title}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    index === activeIndex ? "opacity-100" : "pointer-events-none opacity-0"
                  }`}
                >
                  <Image
                    src={featureItem.image}
                    alt={featureItem.title}
                    fill
                    sizes="(min-width: 768px) 572px, 100vw"
                    className="object-cover"
                  />
                  {renderFeatureForeground(index, index === activeIndex)}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col">
          <div aria-hidden="true" style={{ height: `${topTextSpacer}px` }} />
          {featureItems.map((featureItem, index) => (
            <article
              key={featureItem.title}
              ref={(element) => {
                textCardRefs.current[index] = element;
              }}
              className="py-[136px]"
            >
              <h3
                className={`font-[var(--font-catamaran)] text-[40px] font-medium leading-[120%] transition-colors duration-300 ${
                  index === activeIndex ? "text-[#BD0265]" : "text-black"
                }`}
              >
                {featureItem.title}
              </h3>
              <p className="mt-6 max-w-[540px] whitespace-pre-line text-[16px] font-medium text-black/70">
                {featureItem.description}
              </p>
            </article>
          ))}
          <div aria-hidden="true" style={{ height: `${bottomTextSpacer}px` }} />
        </div>
      </div>

      <div className="flex w-full flex-col gap-[109px] md:hidden">
        {featureItems.map((featureItem, index) => (
          <article key={featureItem.title} className="flex w-full flex-col gap-4">
            <h3 className="font-[var(--font-catamaran)] text-[34px] font-medium leading-[120%] text-black">
              {featureItem.title}
            </h3>
            <p className="whitespace-pre-line text-[16px] font-medium text-black/70">
              {featureItem.description}
            </p>
            <div className="relative mt-2 overflow-hidden rounded-2xl">
              <Image
                src={featureItem.image}
                alt={featureItem.title}
                className="h-auto w-full object-cover"
              />
              {renderMobileFeatureForeground(index)}
            </div>
          </article>
        ))}
      </div>
    </SectionContainer>
  );
}
