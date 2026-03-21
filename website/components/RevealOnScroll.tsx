"use client";

import { useEffect, useRef, useState } from "react";

type RevealOnScrollProps = {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  hiddenClassName?: string;
  visibleClassName?: string;
  minScrollY?: number;
};

export default function RevealOnScroll({
  children,
  className,
  threshold = 0.2,
  rootMargin = "0px",
  hiddenClassName = "translate-y-4 opacity-0",
  visibleClassName = "translate-y-0 opacity-100",
  minScrollY = 0,
}: RevealOnScrollProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      const frameId = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(frameId);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        if (window.scrollY < minScrollY) {
          return;
        }
        setIsVisible(true);
        observer.disconnect();
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [minScrollY, rootMargin, threshold]);

  return (
    <div
      ref={containerRef}
      className={`transition-all duration-700 ease-out ${
        isVisible ? visibleClassName : hiddenClassName
      } ${className ?? ""}`}
    >
      {/* Reveal content */}
      {children}
    </div>
  );
}
