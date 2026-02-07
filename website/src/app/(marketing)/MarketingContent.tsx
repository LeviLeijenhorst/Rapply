"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type MarketingContentProps = {
  children: React.ReactNode;
};

export function MarketingContent({ children }: MarketingContentProps) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animatedElementsRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const rootElement = container.firstElementChild;
    if (!(rootElement instanceof HTMLElement)) {
      console.log("page-load: no root element");
      return;
    }

    animatedElementsRef.current.forEach((element) => {
      element.classList.remove("page-load");
      element.classList.remove("page-load-visible");
    });

    const nextElements = Array.from(rootElement.children).filter((element): element is HTMLElement => {
      return element instanceof HTMLElement;
    });

    const elementsToAnimate = nextElements.filter((element) => {
      const style = window.getComputedStyle(element);
      return style.position !== "fixed";
    });

    console.log("page-load", {
      pathname,
      rootChildren: nextElements.length,
      animated: elementsToAnimate.length,
    });

    elementsToAnimate.forEach((element) => {
      element.classList.add("page-load");
      element.classList.remove("page-load-visible");
    });

    animatedElementsRef.current = elementsToAnimate;

    const requestId = window.requestAnimationFrame(() => {
      elementsToAnimate.forEach((element) => {
        element.classList.add("page-load-visible");
      });
    });

    return () => {
      window.cancelAnimationFrame(requestId);
    };
  }, [pathname]);

  return <div ref={containerRef}>{children}</div>;
}
