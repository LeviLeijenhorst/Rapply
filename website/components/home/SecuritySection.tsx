"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Button from "@/components/Button";
import SectionContainer from "@/components/home/SectionContainer";
import euStarsCircleIcon from "@/home/eu-stars-circle.svg";
import lockIcon from "@/home/lock.svg";
import securitySafeIcon from "@/home/security-safe.svg";

type SecuritySectionProps = {
  duplicateCards?: boolean;
  showActionButton?: boolean;
  disableAnimations?: boolean;
  plainBackground?: boolean;
};

const securityItems = [
  {
    title: "Verwerking binnen Europa",
    description:
      "Rapply verwerkt en bewaart sessiegegevens binnen de Europese Unie. Zo sluiten opslag en verwerking aan op de AVG.",
    icon: euStarsCircleIcon,
  },
  {
    title: "Altijd versleuteld",
    description:
      "Audio voor transcriptie wordt versleuteld verzonden. Transcripties, samenvattingen en notities blijven versleuteld opgeslagen.",
    icon: lockIcon,
  },
  {
    title: "Jouw data blijft van jou",
    description:
      "Jouw data wordt niet gebruikt om AI-modellen te trainen. Jij bepaalt wat je bewaart en kunt je gegevens verwijderen wanneer jij wilt.",
    icon: securitySafeIcon,
  },
];

const veiligheidDataFlowItems = [
  {
    title: "Opname",
    description:
      "Gesprekken worden lokaal opgenomen en versleuteld voordat zij verder worden verwerkt. Onversleutelde audio wordt niet permanent opgeslagen op het apparaat.",
  },
  {
    title: "Versleutelde overdracht",
    description:
      "Audio wordt versleuteld verzonden naar onze verwerkingsomgeving.",
  },
  {
    title: "Verwerking binnen de Europese Unie",
    description:
      "Transcriptie en AI-functionaliteiten draaien binnen de Europese Unie.",
  },
  {
    title: "Dubbele versleuteling tijdens opslag",
    description:
      "Gegevens worden versleuteld opgeslagen. Naast de standaardversleuteling in de cloud passen wij aanvullende versleuteling toe.",
  },
  {
    title: "Verwijdering",
    description: "Gebruikers kunnen sessies en gegevens verwijderen.",
  },
];

const SECURITY_CARD_REVEAL_DURATION_MS = 420;
const TIMELINE_MUTED_RGBA = { r: 77, g: 77, b: 77, a: 0.5 };
const TIMELINE_ACTIVE_RGBA = { r: 189, g: 2, b: 101, a: 1 };
const TIMELINE_HEADING_MUTED_RGBA = { r: 77, g: 77, b: 77, a: 1 };
const TIMELINE_MUTED_COLOR = `rgba(${TIMELINE_MUTED_RGBA.r}, ${TIMELINE_MUTED_RGBA.g}, ${TIMELINE_MUTED_RGBA.b}, ${TIMELINE_MUTED_RGBA.a})`;
const TIMELINE_ACTIVE_COLOR = `rgba(${TIMELINE_ACTIVE_RGBA.r}, ${TIMELINE_ACTIVE_RGBA.g}, ${TIMELINE_ACTIVE_RGBA.b}, ${TIMELINE_ACTIVE_RGBA.a})`;

function clampProgress(value: number) {
  return Math.max(0, Math.min(1, value));
}

function toTimelineLineBackground(progress: number) {
  const p = clampProgress(progress);
  const split = Math.round(p * 1000) / 10;
  return `linear-gradient(to bottom, ${TIMELINE_ACTIVE_COLOR} 0%, ${TIMELINE_ACTIVE_COLOR} ${split}%, ${TIMELINE_MUTED_COLOR} ${split}%, ${TIMELINE_MUTED_COLOR} 100%)`;
}

function toTimelineHeadingColor(progress: number) {
  const t = clampProgress(progress);
  const r = Math.round(
    TIMELINE_HEADING_MUTED_RGBA.r + (TIMELINE_ACTIVE_RGBA.r - TIMELINE_HEADING_MUTED_RGBA.r) * t
  );
  const g = Math.round(
    TIMELINE_HEADING_MUTED_RGBA.g + (TIMELINE_ACTIVE_RGBA.g - TIMELINE_HEADING_MUTED_RGBA.g) * t
  );
  const b = Math.round(
    TIMELINE_HEADING_MUTED_RGBA.b + (TIMELINE_ACTIVE_RGBA.b - TIMELINE_HEADING_MUTED_RGBA.b) * t
  );
  const a = TIMELINE_HEADING_MUTED_RGBA.a + (TIMELINE_ACTIVE_RGBA.a - TIMELINE_HEADING_MUTED_RGBA.a) * t;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function areProgressArraysEqual(a: number[], b: number[]) {
  if (a.length !== b.length) return false;
  return a.every((value, index) => Math.abs(value - b[index]) < 0.01);
}

function DataFlowIcon({ index }: { index: number }) {
  if (index === 0) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M7.99963 10.02V11.5C7.99963 13.71 9.78963 15.5 11.9996 15.5C14.2096 15.5 15.9996 13.71 15.9996 11.5V6C15.9996 3.79 14.2096 2 11.9996 2C9.78963 2 7.99963 3.79 7.99963 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4.34961 9.6499V11.3499C4.34961 15.5699 7.77961 18.9999 11.9996 18.9999C16.2196 18.9999 19.6496 15.5699 19.6496 11.3499V9.6499"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10.6096 6.43012C11.5096 6.10012 12.4896 6.10012 13.3896 6.43012"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11.1996 8.55007C11.7296 8.41007 12.2796 8.41007 12.8096 8.55007"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11.9996 19V22"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (index === 1) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M19.7901 14.9301C17.7301 16.9801 14.7801 17.6101 12.1901 16.8001L7.48015 21.5001C7.14015 21.8501 6.47015 22.0601 5.99015 21.9901L3.81015 21.6901C3.09015 21.5901 2.42015 20.9101 2.31015 20.1901L2.01015 18.0101C1.94015 17.5301 2.17015 16.8601 2.50015 16.5201L7.20015 11.8201C6.40015 9.22007 7.02015 6.27007 9.08015 4.22007C12.0301 1.27007 16.8201 1.27007 19.7801 4.22007C22.7401 7.17007 22.7401 11.9801 19.7901 14.9301Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeMiterlimit="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.89014 17.49L9.19014 19.79"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeMiterlimit="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14.5 11C15.3284 11 16 10.3284 16 9.5C16 8.67157 15.3284 8 14.5 8C13.6716 8 13 8.67157 13 9.5C13 10.3284 13.6716 11 14.5 11Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (index === 2) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 512 512"
        fill="none"
      >
        <path
          fill="currentColor"
          d="M256 46.305l-9.404 19.054-21.03 3.056 15.217 14.832-3.592 20.945L256 94.305l18.81 9.888-3.593-20.945 15.217-14.832-21.03-3.057L256 46.304zM167.566 72.63l-9.404 19.056-21.03 3.056 15.218 14.832-3.592 20.946 18.808-9.89 18.81 9.89-3.593-20.946L198 94.742l-21.03-3.056-9.404-19.055zm176.868 0l-9.405 19.056L314 94.742l15.217 14.832-3.592 20.946 18.81-9.89 18.807 9.89-3.592-20.946 15.217-14.832-21.03-3.056-9.403-19.055zm-243.868 67.425l-9.404 19.054-21.03 3.056 15.218 14.832-3.592 20.945 18.808-9.888 18.81 9.888-3.593-20.945L131 162.166l-21.03-3.057-9.404-19.055zm310.868 0l-9.405 19.054-21.03 3.056 15.217 14.832-3.592 20.945 18.81-9.888 18.807 9.888-3.592-20.945 15.217-14.832-21.03-3.057-9.403-19.055zM76.566 228.55l-9.404 19.054-21.03 3.056 15.218 14.832-3.592 20.945 18.808-9.888 18.81 9.887-3.593-20.945L107 250.66l-21.03-3.056-9.404-19.055zm358.868 0l-9.405 19.054L405 250.66l15.217 14.832-3.592 20.945 18.81-9.888 18.807 9.887-3.592-20.945 15.217-14.832-21.03-3.056-9.403-19.055zm-334.868 89.897l-9.404 19.055-21.03 3.057 15.218 14.83-3.592 20.946 18.808-9.89 18.81 9.89-3.593-20.945L131 340.56l-21.03-3.058-9.404-19.055zm310.868 0l-9.405 19.055L381 340.56l15.217 14.83-3.592 20.946 18.81-9.89 18.807 9.89-3.592-20.945 15.217-14.83-21.03-3.058-9.403-19.055zm-243.868 65.746l-9.404 19.055-21.03 3.057 15.218 14.832-3.592 20.945 18.808-9.89 18.81 9.89-3.593-20.945L198 406.305l-21.03-3.057-9.404-19.055zm176.868 0l-9.405 19.055-21.03 3.057 15.217 14.832-3.592 20.945 18.81-9.89 18.807 9.89-3.592-20.945 15.217-14.832-21.03-3.057-9.403-19.055zm-88.61 23.614l-9.404 19.056-21.03 3.055 15.217 14.834-3.59 20.943.385-.203-.035.203L256 455.898l18.633 9.797-.035-.203.386.203-3.59-20.943 15.215-14.834-21.03-3.055-9.404-19.056-.176.355-.176-.355z"
        />
      </svg>
    );
  }

  if (index === 3) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M19.32 10H4.69002C3.21002 10 2.01001 8.79002 2.01001 7.32002V4.69002C2.01001 3.21002 3.22002 2.01001 4.69002 2.01001H19.32C20.8 2.01001 22 3.22002 22 4.69002V7.32002C22 8.79002 20.79 10 19.32 10Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M19.32 22H4.69002C3.21002 22 2.01001 20.79 2.01001 19.32V16.69C2.01001 15.21 3.22002 14.01 4.69002 14.01H19.32C20.8 14.01 22 15.22 22 16.69V19.32C22 20.79 20.79 22 19.32 22Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 5V7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 5V7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 17V19"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 17V19"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 6H18"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 18H18"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M21 5.97998C17.67 5.64998 14.32 5.47998 10.98 5.47998C9 5.47998 7.02 5.57998 5.04 5.77998L3 5.97998"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 4.97L8.72 3.66C8.88 2.71 9 2 10.69 2H13.31C15 2 15.13 2.75 15.28 3.67L15.5 4.97"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.8499 9.13989L18.1999 19.2099C18.0899 20.7799 17.9999 21.9999 15.2099 21.9999H8.7899C5.9999 21.9999 5.9099 20.7799 5.7999 19.2099L5.1499 9.13989"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.3301 16.5H13.6601"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 12.5H14.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TimelineProgressIcon({ index, progress }: { index: number; progress: number }) {
  const fillHeight = `${Math.round(clampProgress(progress) * 1000) / 10}%`;
  return (
    <div className="relative h-8 w-8">
      <div className="absolute inset-0" style={{ color: TIMELINE_MUTED_COLOR }}>
        <DataFlowIcon index={index} />
      </div>
      <div className="absolute left-0 top-0 w-full overflow-hidden" style={{ height: fillHeight }}>
        <div className="h-8 w-8" style={{ color: TIMELINE_ACTIVE_COLOR }}>
          <DataFlowIcon index={index} />
        </div>
      </div>
    </div>
  );
}

export default function SecuritySection({
  duplicateCards = false,
  showActionButton = true,
  disableAnimations = false,
  plainBackground = false,
}: SecuritySectionProps) {
  const timelineItemCount = veiligheidDataFlowItems.length;
  const securityCardsRef = useRef<HTMLDivElement | null>(null);
  const mobileIconRefs = useRef<Array<HTMLDivElement | null>>([]);
  const mobileLineRefs = useRef<Array<HTMLDivElement | null>>([]);
  const desktopIconRefs = useRef<Array<HTMLDivElement | null>>([]);
  const desktopLineRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [areSecurityCardsVisible, setAreSecurityCardsVisible] = useState(false);
  const [timelineIconProgresses, setTimelineIconProgresses] = useState<number[]>(() =>
    Array(timelineItemCount).fill(0)
  );
  const [timelineLineProgresses, setTimelineLineProgresses] = useState<number[]>(() =>
    Array(Math.max(timelineItemCount - 1, 0)).fill(0)
  );
  const securityGridGapClass = duplicateCards ? "gap-[30px]" : "gap-6";
  const securityButtonTopSpacingClass = duplicateCards ? "mt-[30px]" : "mt-2";

  useEffect(() => {
    if (!duplicateCards) return;

    let rafId: number | null = null;

    const updateTimelineProgress = () => {
      const viewportCenter = window.innerHeight / 2;
      const isDesktop = window.matchMedia("(min-width: 768px)").matches;
      const activeIconRefs = isDesktop ? desktopIconRefs.current : mobileIconRefs.current;
      const activeLineRefs = isDesktop ? desktopLineRefs.current : mobileLineRefs.current;
      const nextIconProgresses = Array(timelineItemCount).fill(0);
      const nextLineProgresses = Array(Math.max(timelineItemCount - 1, 0)).fill(0);

      for (let index = 0; index < timelineItemCount; index += 1) {
        const canFillIcon = index === 0 || nextLineProgresses[index - 1] >= 0.999;
        const iconElement = activeIconRefs[index];
        if (canFillIcon && iconElement) {
          const iconRect = iconElement.getBoundingClientRect();
          if (iconRect.height > 0) {
            nextIconProgresses[index] = clampProgress((viewportCenter - iconRect.top) / iconRect.height);
          }
        }

        if (index >= timelineItemCount - 1) continue;

        const canFillLine = nextIconProgresses[index] >= 0.999;
        const lineElement = activeLineRefs[index];
        if (canFillLine && lineElement) {
          const lineRect = lineElement.getBoundingClientRect();
          if (lineRect.height > 0) {
            nextLineProgresses[index] = clampProgress((viewportCenter - lineRect.top) / lineRect.height);
          }
        }
      }

      setTimelineIconProgresses((previous) =>
        areProgressArraysEqual(previous, nextIconProgresses) ? previous : nextIconProgresses
      );
      setTimelineLineProgresses((previous) =>
        areProgressArraysEqual(previous, nextLineProgresses) ? previous : nextLineProgresses
      );
    };

    const scheduleTimelineUpdate = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        updateTimelineProgress();
      });
    };

    updateTimelineProgress();

    window.addEventListener("scroll", scheduleTimelineUpdate, { passive: true });
    window.addEventListener("resize", scheduleTimelineUpdate);

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener("scroll", scheduleTimelineUpdate);
      window.removeEventListener("resize", scheduleTimelineUpdate);
    };
  }, [duplicateCards, timelineItemCount]);

  useEffect(() => {
    const element = securityCardsRef.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      const frameId = requestAnimationFrame(() => setAreSecurityCardsVisible(true));
      return () => cancelAnimationFrame(frameId);
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
      className={
        duplicateCards || plainBackground
          ? "bg-white"
          : "bg-white bg-[linear-gradient(to_top_right,_rgba(184,212,255,0.25),_rgba(198,175,255,0.25))]"
      }
      contentClassName={duplicateCards ? "pt-0 pb-12 md:pt-0 md:pb-16" : "md:pb-[60px]"}
    >
      {/* Security content */}
      <div
        className={`flex w-full flex-col ${
          duplicateCards ? "gap-[60px]" : "gap-8 md:pt-5"
        }`}
      >
        {/* Security heading */}
        <div className="flex w-full flex-col items-center gap-3 text-center">
          <h2 className="font-[var(--font-catamaran)] text-[34px] font-medium leading-[120%] text-black md:text-[40px]">
            {duplicateCards ? (
              <>
                Hoe Rapply{" "}
                <span className="text-[#BD0265]">met gegevens omgaat</span>
              </>
            ) : (
              <>
                Ontworpen met <span className="text-[#BD0265]">veiligheid op #1</span>
              </>
            )}
          </h2>
          {duplicateCards ? null : (
            <p className="text-base font-normal text-black/70 md:text-lg">
              Beschermde opslag, duidelijke regels en volledige controle over jouw data.
            </p>
          )}
        </div>
        {/* Security cards */}
        {duplicateCards ? (
          <div
            ref={securityCardsRef}
            className={`mx-auto w-full max-w-4xl ${
              disableAnimations || areSecurityCardsVisible
                ? "translate-y-0"
                : "translate-y-[20px]"
            }`}
            style={{
              transitionProperty: "translate, transform",
              transitionDuration: `${SECURITY_CARD_REVEAL_DURATION_MS}ms, ${SECURITY_CARD_REVEAL_DURATION_MS}ms`,
              transitionTimingFunction:
                "cubic-bezier(0.22,1,0.36,1), cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <div className="relative pl-10 max-[500px]:pl-0 md:hidden">
              <div className="flex w-full flex-col gap-20">
                {veiligheidDataFlowItems.map((securityItem, index) => (
                  <div
                    key={`${securityItem.title}-${index}`}
                    className="relative h-[136px] w-full"
                  >
                    <div
                      ref={(node) => {
                        mobileIconRefs.current[index] = node;
                      }}
                      className="absolute left-[20px] top-[2px] h-8 w-8 max-[500px]:hidden"
                      aria-hidden="true"
                    >
                      <TimelineProgressIcon index={index} progress={timelineIconProgresses[index] ?? 0} />
                    </div>
                    <div className="relative flex w-full flex-col gap-2 pl-[106px] max-[500px]:pl-0">
                      <h3
                        className="font-[var(--font-catamaran)] text-[24px] font-bold transition-colors duration-200 ease-out"
                        style={{ color: toTimelineHeadingColor(timelineIconProgresses[index] ?? 0) }}
                      >
                        {securityItem.title}
                      </h3>
                      <p className="text-[16px] font-normal text-black/70">
                        {securityItem.description}
                      </p>
                    </div>
                    {index < veiligheidDataFlowItems.length - 1 ? (
                      <div
                        ref={(node) => {
                          mobileLineRefs.current[index] = node;
                        }}
                        className={`absolute left-[35px] top-[46px] w-[2px] rounded-full bg-[#BD0265] max-[500px]:hidden ${
                          index === veiligheidDataFlowItems.length - 2
                            ? "h-[156px]"
                            : "h-[160px]"
                        }`}
                        style={{ background: toTimelineLineBackground(timelineLineProgresses[index] ?? 0) }}
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto hidden w-full max-w-6xl md:block">
              <div className="flex w-full flex-col gap-20">
                {veiligheidDataFlowItems.map((securityItem, index) => {
                  const isLeft = index % 2 === 0;
                  const isLast = index === veiligheidDataFlowItems.length - 1;
                  const isBeforeLast = index === veiligheidDataFlowItems.length - 2;
                  return (
                    <article
                      key={`${securityItem.title}-${index}`}
                      className="grid h-[136px] w-full grid-cols-[1fr_128px_1fr] items-center"
                    >
                      {isLeft ? (
                        <div className="ml-auto mr-6 w-full max-w-[420px] text-left">
                          <h3
                            className="font-[var(--font-catamaran)] text-[28px] font-bold leading-[120%] transition-colors duration-200 ease-out"
                            style={{ color: toTimelineHeadingColor(timelineIconProgresses[index] ?? 0) }}
                          >
                            {securityItem.title}
                          </h3>
                          <p className="mt-2 text-[16px] font-normal leading-relaxed text-black/70">
                            {securityItem.description}
                          </p>
                        </div>
                      ) : (
                        <div />
                      )}

                      <div className="relative mx-auto w-[128px] self-stretch">
                        {!isLast ? (
                          <div
                            ref={(node) => {
                              desktopLineRefs.current[index] = node;
                            }}
                            className={`pointer-events-none absolute left-1/2 top-[calc(50%+28px)] w-[2px] -translate-x-1/2 rounded-full bg-[#BD0265] ${
                              isBeforeLast ? "h-[156px]" : "h-[160px]"
                            }`}
                            style={{ background: toTimelineLineBackground(timelineLineProgresses[index] ?? 0) }}
                            aria-hidden="true"
                          />
                        ) : null}
                        <div
                          ref={(node) => {
                            desktopIconRefs.current[index] = node;
                          }}
                          className="absolute left-1/2 top-1/2 z-10 h-8 w-8 -translate-x-1/2 -translate-y-1/2 bg-white"
                          aria-hidden="true"
                        >
                          <TimelineProgressIcon index={index} progress={timelineIconProgresses[index] ?? 0} />
                        </div>
                      </div>

                      {!isLeft ? (
                        <div className="ml-6 w-full max-w-[420px] text-left">
                          <h3
                            className="font-[var(--font-catamaran)] text-[28px] font-bold leading-[120%] transition-colors duration-200 ease-out"
                            style={{ color: toTimelineHeadingColor(timelineIconProgresses[index] ?? 0) }}
                          >
                            {securityItem.title}
                          </h3>
                          <p className="mt-2 text-[16px] font-normal leading-relaxed text-black/70">
                            {securityItem.description}
                          </p>
                        </div>
                      ) : (
                        <div />
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div
            ref={securityCardsRef}
            className={`grid w-full md:grid-cols-3 ${securityGridGapClass}`}
          >
            {securityItems.map((securityItem, index) => {
              return (
                <div
                  key={`${securityItem.title}-${index}`}
                  className={`flex w-full flex-col gap-0 rounded-2xl bg-white p-6 pb-8 shadow-[0_8px_20px_rgba(15,23,42,0.08)] ${
                    disableAnimations || areSecurityCardsVisible
                      ? "translate-y-0"
                      : "translate-y-[20px]"
                  }`}
                  style={{
                    transitionProperty: "translate, transform",
                    transitionDuration: `${SECURITY_CARD_REVEAL_DURATION_MS}ms, ${SECURITY_CARD_REVEAL_DURATION_MS}ms`,
                    transitionTimingFunction:
                      "cubic-bezier(0.22,1,0.36,1), cubic-bezier(0.22,1,0.36,1)",
                  }}
                >
                  <div className="mt-2 ml-2 flex items-start gap-3 self-start">
                    <Image src={securityItem.icon} alt="" width={24} height={24} />
                    {/* Security card title */}
                    <h3 className="font-[var(--font-catamaran)] text-[20px] font-bold text-[#BD0265]">
                      {securityItem.title}
                    </h3>
                  </div>
                  {/* Security card description */}
                  <p className="mt-3 ml-2 text-[16px] font-normal text-black/70">
                    {securityItem.description}
                  </p>
                </div>
              );
            })}
          </div>
        )}
        {/* Security action */}
        {showActionButton ? (
          <div
            className={`${securityButtonTopSpacingClass} flex w-full items-center justify-center ${
              disableAnimations || areSecurityCardsVisible
                ? "translate-y-0"
                : "translate-y-[20px]"
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
