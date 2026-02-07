"use client";

import { useEffect, useState } from "react";

type MarketingContentProps = {
  children: React.ReactNode;
};

export function MarketingContent({ children }: MarketingContentProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const images = Array.from(document.images);

    if (images.length === 0) {
      setIsReady(true);
      return;
    }

    let remaining = 0;

    const handleImageReady = () => {
      remaining -= 1;
      if (remaining <= 0) {
        setIsReady(true);
      }
    };

    images.forEach((image) => {
      if (image.complete) {
        return;
      }

      remaining += 1;
      image.addEventListener("load", handleImageReady);
      image.addEventListener("error", handleImageReady);
    });

    if (remaining === 0) {
      setIsReady(true);
      return;
    }

    return () => {
      images.forEach((image) => {
        image.removeEventListener("load", handleImageReady);
        image.removeEventListener("error", handleImageReady);
      });
    };
  }, []);

  return <div className={`page-entry ${isReady ? "page-entry-visible" : ""}`}>{children}</div>;
}
