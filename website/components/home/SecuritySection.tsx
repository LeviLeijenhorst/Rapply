"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Button from "@/components/Button";
import SectionContainer from "@/components/home/SectionContainer";
import securitySafeIcon from "@/home/security-safe.svg";
import lockIcon from "@/home/lock.svg";
import securityIcon from "@/home/security.svg";
import keyIcon from "@/coaches/vuesax/bold/key.svg";
import shieldTickIcon from "@/veiligheid/shield-tick.svg";
import shieldSearchIcon from "@/veiligheid/shield-search.svg";

type SecuritySectionProps = {
  duplicateCards?: boolean;
  showActionButton?: boolean;
};

const securityItems = [
  {
    title: "AVG-proof",
    description:
      "CoachScribe is AVG-proof ingericht. Opslag en verwerking van gegevens vinden uitsluitend plaats binnen de EU, volgens de geldende privacywetgeving.",
    icon: securitySafeIcon,
  },
  {
    title: "Versleuteld opgeslagen",
    description:
      "Alle gegevens zijn beveiligd met sterke encryptie, zowel tijdens verzending (in transit) als wanneer ze zijn opgeslagen\n(at rest).",
    icon: lockIcon,
  },
  {
    title: "Jouw data blijft van jou",
    description:
      "Jouw data wordt nooit gebruikt om AI-modellen te trainen of te verbeteren. Daarnaast kan je op elk moment je data verwijderen, het is jouw data.",
    icon: securityIcon,
  },
];

const SECURITY_CARD_REVEAL_DURATION_MS = 420;

export default function SecuritySection({
  duplicateCards = false,
  showActionButton = true,
}: SecuritySectionProps) {
  const securityCardsRef = useRef<HTMLDivElement | null>(null);
  const [areSecurityCardsVisible, setAreSecurityCardsVisible] = useState(false);
  const renderedSecurityItems = duplicateCards
    ? [...securityItems, ...securityItems]
    : securityItems;
  const securityGridGapClass = duplicateCards ? "gap-[30px]" : "gap-6";
  const securityButtonTopSpacingClass = duplicateCards ? "mt-[30px]" : "mt-2";

  useEffect(() => {
    const element = securityCardsRef.current;
    if (!element) return;

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setAreSecurityCardsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        if (entry.intersectionRatio < 0.15) return;
        setAreSecurityCardsVisible(true);
        observer.disconnect();
      },
      { threshold: [0, 0.15, 1] }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <SectionContainer
      className="bg-white bg-[linear-gradient(to_top_right,_rgba(184,212,255,0.25),_rgba(198,175,255,0.25))]"
      contentClassName="md:pb-[60px]"
    >
      {/* Security content */}
      <div className="flex w-full flex-col gap-8 md:pt-5">
        {/* Security heading */}
        <div className="flex w-full flex-col items-center gap-3 text-center">
          <h2 className="font-[var(--font-catamaran)] text-[40px] font-medium leading-[120%] text-black">
            Ontworpen met <span className="text-[#BD0265]">veiligheid op #1</span>
          </h2>
          <p className="text-base font-normal text-black/70 md:text-lg">
            Beschermde opslag, duidelijke regels en volledige controle over jouw
            data.
          </p>
        </div>
        {/* Security cards */}
        <div
          ref={securityCardsRef}
          className={`grid w-full md:grid-cols-3 ${securityGridGapClass}`}
        >
          {renderedSecurityItems.map((securityItem, index) => {
            const title =
              duplicateCards && index === securityItems.length
                ? "tweestapsverificatie"
                : duplicateCards && index === securityItems.length + 1
                  ? "Europese bescherming"
                : securityItem.title;
            const description =
              duplicateCards && index === securityItems.length
                ? "Inloggen verloopt via tweestapsverificatie. Naast je wachtwoord bevestig je elke login met een unieke e-mailcode zodat je account goed beveiligd is."
                : duplicateCards && index === securityItems.length + 1
                  ? "Alle gegevens blijven binnen Europa en vallen uitsluitend onder Europese privacywetgeving, zonder invloed van de Amerikaanse Cloud Act."
                : securityItem.description;
            const iconSource =
              duplicateCards && index === 2
                ? shieldTickIcon
                : duplicateCards && index === securityItems.length
                ? keyIcon
                : duplicateCards && index === securityItems.length + 1
                  ? securityIcon
                  : duplicateCards && index === securityItems.length + 2
                    ? shieldSearchIcon
                : securityItem.icon;

            return (
              <div
                key={`${securityItem.title}-${index}`}
                className={`flex w-full flex-col gap-0 rounded-2xl bg-white p-6 pb-8 shadow-[0_8px_20px_rgba(15,23,42,0.08)] ${
                  areSecurityCardsVisible ? "translate-y-0" : "translate-y-[20px]"
                }`}
                style={{
                  transitionProperty: "translate, transform",
                  transitionDuration: `${SECURITY_CARD_REVEAL_DURATION_MS}ms, ${SECURITY_CARD_REVEAL_DURATION_MS}ms`,
                  transitionTimingFunction:
                    "cubic-bezier(0.22,1,0.36,1), cubic-bezier(0.22,1,0.36,1)",
                }}
              >
                <div className="mt-2 ml-2 flex items-start gap-3 self-start">
                  <Image src={iconSource} alt="" width={24} height={24} />
                  {/* Security card title */}
                  <h3 className="font-[var(--font-catamaran)] text-[20px] font-bold text-[#BD0265]">
                    {title}
                  </h3>
                </div>
                {/* Security card description */}
                <p className="mt-3 ml-2 text-[16px] font-normal text-black/70">
                  {description}
                </p>
              </div>
            );
          })}
        </div>
        {/* Security action */}
        {showActionButton ? (
          <div
            className={`${securityButtonTopSpacingClass} flex w-full items-center justify-center ${
              areSecurityCardsVisible ? "translate-y-0" : "translate-y-[20px]"
            }`}
            style={{
              transitionProperty: "translate, transform",
              transitionDuration: `${SECURITY_CARD_REVEAL_DURATION_MS}ms, ${SECURITY_CARD_REVEAL_DURATION_MS}ms`,
              transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1), cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <Button
              label="Meer informatie"
              destination="/veiligheid"
              variant="primary"
              className="font-normal"
            />
          </div>
        ) : null}
      </div>
    </SectionContainer>
  );
}
