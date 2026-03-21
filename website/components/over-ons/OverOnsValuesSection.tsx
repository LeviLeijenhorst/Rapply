"use client";

import { useEffect, useRef, useState } from "react";
import Image, { StaticImageData } from "next/image";
import SectionContainer from "@/components/home/SectionContainer";
import userTagIcon from "@/over_ons/user-tag.svg";
import peopleIcon from "@/over_ons/people.svg";
import medalStarIcon from "@/over_ons/medal-star.svg";
import magicpenIcon from "@/over_ons/magicpen.svg";
import sunIcon from "@/over_ons/sun.svg";
import peopleOneIcon from "@/over_ons/people-1.svg";

type ValueItem = {
  title: string;
  description: string;
  icon: StaticImageData;
};

const values: ValueItem[] = [
  {
    title: "Mensgericht",
    description:
      "Technologie ondersteunt altijd de coach en de cliënt, zonder de menselijke connectie te vervangen.",
    icon: userTagIcon,
  },
  {
    title: "Samenwerking",
    description:
      "Rapply ontstaat niet in isolatie. We ontwikkelen samen met coaches, partners en elkaar.",
    icon: peopleIcon,
  },
  {
    title: "Kwaliteit",
    description:
      "Alles wat we bouwen is gericht op het verbeteren van de kwaliteit van coaching en het ondersteunen van elke sessie.",
    icon: medalStarIcon,
  },
  {
    title: "Innovatie",
    description:
      "We testen en verbeteren continu, zodat Rapply beter aansluit bij de praktijk van coaches.",
    icon: magicpenIcon,
  },
  {
    title: "Transparantie",
    description:
      "We zijn open over hoe Rapply werkt en hoe we omgaan met data, zodat coaches altijd weten waar ze aan toe zijn.",
    icon: sunIcon,
  },
  {
    title: "Verbinding",
    description:
      "Onze tools helpen coaches sterker in contact te staan met hun cliënten en de relatie te verdiepen.",
    icon: peopleOneIcon,
  },
];

const VALUE_CARD_REVEAL_DURATION_MS = 420;

export default function OverOnsValuesSection() {
  const valueCardsRef = useRef<HTMLDivElement | null>(null);
  const [areValueCardsVisible, setAreValueCardsVisible] = useState(false);

  useEffect(() => {
    const element = valueCardsRef.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      const frameId = requestAnimationFrame(() => setAreValueCardsVisible(true));
      return () => cancelAnimationFrame(frameId);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        if (entry.intersectionRatio < 0.15) return;
        setAreValueCardsVisible(true);
        observer.disconnect();
      },
      { threshold: [0, 0.15, 1] }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <SectionContainer
      className="mt-[160px] bg-white bg-[linear-gradient(135deg,rgba(169,217,243,0.5)_0%,rgba(237,194,217,0.5)_100%)]"
      contentClassName="pb-[60px] pt-[60px] md:pb-[60px] md:pt-[60px]"
    >
      <div className="flex w-full flex-col gap-[40px]">
        <h2 className="text-center font-[var(--font-catamaran)] text-[40px] font-medium leading-[120%] text-black">
          Onze <span className="text-[#BD0265]">kernwaarden</span>
        </h2>
        <div ref={valueCardsRef} className="grid w-full gap-6 md:grid-cols-2 xl:grid-cols-3">
          {values.map((value) => (
            <article
              key={value.title}
              className={`flex w-full flex-col gap-3 rounded-xl bg-[#F8F9F9] p-8 ${
                areValueCardsVisible ? "translate-y-0" : "translate-y-[20px]"
              }`}
              style={{
                transitionProperty: "translate, transform",
                transitionDuration: `${VALUE_CARD_REVEAL_DURATION_MS}ms, ${VALUE_CARD_REVEAL_DURATION_MS}ms`,
                transitionTimingFunction:
                  "cubic-bezier(0.22,1,0.36,1), cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              <h3 className="flex min-h-[24px] items-center gap-3 text-base font-semibold text-[#BD0265] md:text-xl">
                <Image
                  src={value.icon}
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 shrink-0 object-contain"
                />
                <span>{value.title}</span>
              </h3>
              <p className="text-base font-normal leading-relaxed text-[#243747]">
                {value.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}
