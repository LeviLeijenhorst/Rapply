"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Button from "@/components/Button";
import SectionContainer from "@/components/home/SectionContainer";
import checkmarkCircleIcon from "@/home/checkmark-circle.svg";
import { getApiUrl } from "@/lib/api";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  monthlyPrice: number;
  minutesPerMonth: number;
  displayOrder: number;
};

type PlansResponse = {
  items: Plan[];
};

type PricingVisibilityResponse = {
  isAuthenticated: boolean;
  canSeePricingPage: boolean;
};

const ENTRA_ACCESS_TOKEN_KEY = "entra_access_token";

function formatEuroPrice(value: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PricingSection() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      setIsLoading(true);

      try {
        const plansResponse = await fetch(getApiUrl("/pricing/plans/public"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (!plansResponse.ok) {
          throw new Error(`Pricing request failed: ${plansResponse.status}`);
        }
        const plansPayload = (await plansResponse.json()) as PlansResponse;
        if (!isCancelled) {
          setPlans(Array.isArray(plansPayload.items) ? plansPayload.items : []);
        }
      } catch {
        if (!isCancelled) {
          setPlans([]);
        }
      }

      let accessToken: string | null = null;
      if (typeof window !== "undefined") {
        try {
          accessToken = window.sessionStorage.getItem(ENTRA_ACCESS_TOKEN_KEY);
        } catch {
          accessToken = null;
        }
      }

      if (!accessToken) {
        if (!isCancelled) {
          setIsVisible(true);
          setIsLoading(false);
        }
        return;
      }

      try {
        const visibilityResponse = await fetch(
          getApiUrl("/pricing/me-visibility"),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({}),
          },
        );
        if (!visibilityResponse.ok) {
          throw new Error(`Visibility request failed: ${visibilityResponse.status}`);
        }
        const visibilityPayload =
          (await visibilityResponse.json()) as PricingVisibilityResponse;
        if (!isCancelled) {
          setIsVisible(Boolean(visibilityPayload.canSeePricingPage));
        }
      } catch {
        if (!isCancelled) {
          setIsVisible(true);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      isCancelled = true;
    };
  }, []);

  const hasPlans = useMemo(() => plans.length > 0, [plans.length]);
  if (isLoading || !isVisible || !hasPlans) return null;

  return (
    <SectionContainer className="bg-[#B90061]" contentClassName="md:py-[80px]">
      <div className="flex w-full flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex w-full flex-col gap-4 text-white lg:max-w-md lg:self-center">
          <h3 className="font-[var(--font-catamaran)] text-[64px] font-medium leading-[120%] text-white">
            Een plan
            <br />
            dat bij jou past
          </h3>
          <p className="text-[16px] font-medium text-white/90">
            We houden rekening met coaches en praktijken van alle formaten. Kijk
            rustig even rond, we hebben vast een plan
            <br />
            dat perfect aansluit op jouw behoeften!
          </p>
        </div>
        <div className="flex w-full flex-col gap-10 lg:flex-row lg:items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="flex h-full w-full flex-col gap-0 rounded-2xl bg-white px-8 py-8 shadow-[0_8px_20px_rgba(15,23,42,0.12)] lg:min-h-[336px] lg:w-[288px]"
            >
              <div className="flex w-full flex-col gap-0">
                <h4 className="font-[var(--font-catamaran)] text-[40px] font-medium leading-[120%] text-black">
                  {plan.name}
                </h4>
                <p className="mt-2 text-[28px] font-semibold text-black">
                  {formatEuroPrice(plan.monthlyPrice)}
                  <span className="ml-1 text-[14px] font-medium text-black/70">
                    /maand
                  </span>
                </p>
                <p className="mt-2 text-[16px] font-medium text-black/70">
                  Krijg toegang tot:
                </p>
              </div>
              <div className="mt-3 flex w-full flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Image src={checkmarkCircleIcon} alt="" width={18} height={18} />
                  <span className="text-[16px] font-medium text-black/70">
                    {plan.minutesPerMonth} minuten per maand
                  </span>
                </div>
                {plan.description ? (
                  <div className="flex items-center gap-3">
                    <Image
                      src={checkmarkCircleIcon}
                      alt=""
                      width={18}
                      height={18}
                    />
                    <span className="text-[16px] font-medium text-black/70">
                      {plan.description}
                    </span>
                  </div>
                ) : null}
              </div>
              <div className="mt-3 flex w-full justify-center lg:mt-auto">
                <Button
                  label="Plan een kennismaking"
                  destination="/contact"
                  variant="secondary"
                  className="font-normal"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}
