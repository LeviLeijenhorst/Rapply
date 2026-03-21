"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { getApiUrl } from "@/lib/api";

type WebsiteEvent = {
  type: "visit" | "click";
  action: string;
  path: string | null;
  anonymousId: string;
  sessionId: string;
  metadata: Record<string, unknown>;
  occurredAt: string;
};

const MAX_BUFFER_SIZE = 150;

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readOrCreateStorageId(key: string): string {
  const storage = getStorage();
  const existing = storage?.getItem(key);
  if (existing) return existing;
  const next = `${key}-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
  storage?.setItem(key, next);
  return next;
}

function readElementData(target: EventTarget | null): Record<string, unknown> {
  if (!(target instanceof Element)) return {};
  const element = target as HTMLElement;
  const text = String(element.textContent || "").trim().slice(0, 120);
  const href =
    element instanceof HTMLAnchorElement
      ? element.href
      : element.closest("a")?.getAttribute("href");

  return {
    tag: element.tagName.toLowerCase(),
    id: element.id || null,
    className: String(element.className || "").slice(0, 160) || null,
    role: element.getAttribute("role"),
    ariaLabel: element.getAttribute("aria-label"),
    text: text || null,
    href: href || null,
    testId: element.getAttribute("data-testid"),
  };
}

async function postEvents(events: WebsiteEvent[]) {
  if (events.length === 0) return;
  try {
    await fetch(getApiUrl("/analytics/public/events"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ app: "website", events }),
      keepalive: true,
    });
  } catch {
    // Best effort analytics.
  }
}

export default function WebsiteAnalyticsTracker() {
  const pathname = usePathname();
  const eventBufferRef = useRef<WebsiteEvent[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const anonymousId = readOrCreateStorageId("rapply_website_anon_id");
    const sessionId = readOrCreateStorageId("rapply_website_session_id");

    const queueEvent = (event: Omit<WebsiteEvent, "anonymousId" | "sessionId" | "occurredAt">) => {
      eventBufferRef.current.push({
        ...event,
        anonymousId,
        sessionId,
        occurredAt: new Date().toISOString(),
      });
      if (eventBufferRef.current.length > MAX_BUFFER_SIZE) {
        eventBufferRef.current.splice(0, eventBufferRef.current.length - MAX_BUFFER_SIZE);
      }
    };

    const flush = async () => {
      if (eventBufferRef.current.length === 0) return;
      const events = [...eventBufferRef.current];
      eventBufferRef.current = [];
      await postEvents(events);
    };

    queueEvent({
      type: "visit",
      action: "page_open",
      path: window.location.pathname,
      metadata: {
        source: "website",
      },
    });
    void flush();

    const flushIntervalId = window.setInterval(() => {
      void flush();
    }, 2000);

    const onBeforeUnload = () => {
      void flush();
    };

    const onClick = (event: MouseEvent) => {
      queueEvent({
        type: "click",
        action: "user_click",
        path: window.location.pathname,
        metadata: readElementData(event.target),
      });
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.clearInterval(flushIntervalId);
      void flush();
    };
  }, [pathname]);

  return null;
}
