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

    if (typeof window === "undefined") {
      setIsVisible(true);
      return;
    }

    if (!("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        if (typeof window !== "undefined" && window.scrollY < minScrollY) {
          return;
        }
        setIsVisible(true);
        observer.disconnect();
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

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
