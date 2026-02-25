"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/Button";
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

type PricingSectionProps = {
  disableReveal?: boolean;
  isStandalonePage?: boolean;
};

type RoiInputs = {
  hourlyRate: number;
  sessionsPerWeek: number;
  currentMinutes: number;
  toolMinutes: number;
  subscriptionMonthly: number;
  weeksPerYear: number;
  newSessionsPercentage: number;
};

type RoiResults = {
  currentHoursWeek: number;
  toolHoursWeek: number;
  hoursSavedWeek: number;
  eurSavedWeek: number;
  eurSavedMonth: number;
  eurSavedYear: number;
  netMonth: number;
};

const ENTRA_ACCESS_TOKEN_KEY = "entra_access_token";
const APP_URL = "https://app.coachscribe.nl";

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function toNumber(value: string): number {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function calculateRoi(inputs: RoiInputs): RoiResults {
  const currentHoursWeek = (inputs.sessionsPerWeek * inputs.currentMinutes) / 60;
  const toolHoursWeek = (inputs.sessionsPerWeek * inputs.toolMinutes) / 60;
  const hoursSavedWeek = Math.max(0, currentHoursWeek - toolHoursWeek);
  const eurSavedWeek =
    hoursSavedWeek * inputs.hourlyRate * (inputs.newSessionsPercentage / 100);
  const eurSavedMonth = eurSavedWeek * 4.33;
  const eurSavedYear = eurSavedWeek * inputs.weeksPerYear;
  const netMonth = eurSavedMonth - inputs.subscriptionMonthly;

  return {
    currentHoursWeek,
    toolHoursWeek,
    hoursSavedWeek,
    eurSavedWeek,
    eurSavedMonth,
    eurSavedYear,
    netMonth,
  };
}

function useAnimatedNumber(target: number, durationMs = 450): number {
  const [value, setValue] = useState(target);
  const valueRef = useRef(target);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    let frameId = 0;
    const start = performance.now();
    const from = valueRef.current;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - progress) * (1 - progress);
      setValue(from + (target - from) * eased);
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [target, durationMs]);

  return value;
}

function formatEuro(value: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PricingSection(props: PricingSectionProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  const [hourlyRate, setHourlyRate] = useState(75);
  const [sessionsPerWeek, setSessionsPerWeek] = useState(10);
  const [currentMinutes, setCurrentMinutes] = useState(20);
  const [newSessionsPercentage, setNewSessionsPercentage] = useState(50);
  const [subscriptionMonthly, setSubscriptionMonthly] = useState(29);
  const toolMinutes = 8;
  const weeksPerYear = 46;

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

        if (plansResponse.ok) {
          const plansPayload = (await plansResponse.json()) as PlansResponse;
          const primaryPlan = Array.isArray(plansPayload.items)
            ? plansPayload.items[0]
            : null;
          if (!isCancelled && primaryPlan?.monthlyPrice != null) {
            const resolvedPrice = clamp(primaryPlan.monthlyPrice, 0, 200);
            setSubscriptionMonthly(resolvedPrice);
          }
        }
      } catch {
        // Fallback to default subscription price.
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
        const visibilityResponse = await fetch(getApiUrl("/pricing/me-visibility"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({}),
        });

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

  const roi = useMemo(
    () =>
      calculateRoi({
        hourlyRate,
        sessionsPerWeek,
        currentMinutes,
        toolMinutes,
        subscriptionMonthly,
        weeksPerYear,
        newSessionsPercentage,
      }),
    [
      hourlyRate,
      sessionsPerWeek,
      currentMinutes,
      subscriptionMonthly,
      newSessionsPercentage,
    ],
  );

  const animatedHoursSavedWeek = useAnimatedNumber(roi.hoursSavedWeek);
  const animatedSavedMonth = useAnimatedNumber(roi.eurSavedMonth);
  const animatedSavedYear = useAnimatedNumber(roi.eurSavedYear);
  const animatedNetMonth = useAnimatedNumber(roi.netMonth);

  if (!isVisible) return null;

  return (
    <section
      className={`w-full ${
        props.isStandalonePage
          ? "pt-6 pb-12 md:pt-10 md:pb-16"
          : "py-12 md:py-16"
      }`}
      data-reveal-disabled={props.disableReveal ? "1" : "0"}
    >
      <div className="mx-auto w-full max-w-[1320px] px-6 md:px-10">
        {isLoading ? (
          <div className="flex min-h-[470px] w-full items-center justify-center">
            <div
              className="h-10 w-10 animate-spin rounded-full border-4 border-[#BE0165]/25 border-t-[#BE0165]"
              aria-label="Calculator laden"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#E0E0E0] bg-white p-6 md:p-7">
              <h2 className="text-[24px] font-semibold leading-[30px] text-[#1D0A00] md:text-[26px] md:leading-[32px]">
                ROI calculator
              </h2>
              <p className="mt-2 text-[14px] leading-5 text-[rgba(38,52,63,0.78)] md:text-[15px] md:leading-6">
                Bereken hoeveel tijd en omzet je potentieel vrijspeelt met CoachScribe.
              </p>

              <div className="mt-5 space-y-4">
                <RangeWithInput
                  id="hourlyRate"
                  label="Uurtarief (EUR)"
                  min={20}
                  max={250}
                  step={1}
                  value={hourlyRate}
                  onChange={setHourlyRate}
                  unit="EUR"
                />
                <RangeWithInput
                  id="sessionsPerWeek"
                  label="Sessies per week"
                  min={1}
                  max={40}
                  step={1}
                  value={sessionsPerWeek}
                  onChange={setSessionsPerWeek}
                  unit="sessies"
                />
                <RangeWithInput
                  id="currentMinutes"
                  label="Minuten verslaglegging per sessie (nu)"
                  min={5}
                  max={90}
                  step={1}
                  value={currentMinutes}
                  onChange={setCurrentMinutes}
                  unit="min"
                />
                <RangeWithInput
                  id="newSessionsPercentage"
                  label="In welk deel van je bespaarde tijd help je nieuwe mensen?"
                  min={0}
                  max={100}
                  step={1}
                  value={newSessionsPercentage}
                  onChange={setNewSessionsPercentage}
                  unit="%"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-[#E0E0E0] bg-[#FEFEFE] p-6 md:p-7">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <MetricCard
                  label="Uren bespaard per week"
                  value={`${animatedHoursSavedWeek.toFixed(1).replace(".", ",")} uur`}
                />
                <MetricCard
                  label="Besparing per maand"
                  value={formatEuro(animatedSavedMonth)}
                />
                <MetricCard
                  label="Besparing per jaar"
                  value={formatEuro(animatedSavedYear)}
                />
              </div>

              <div className="mt-4 rounded-xl border border-[#E6E6E6] bg-white p-4 text-[#1D0A00]">
                <p className="text-[13px] leading-5 text-[rgba(38,52,63,0.72)]">
                  Netto besparing per maand
                </p>
                <p className="mt-1 text-[28px] font-semibold leading-8 text-[#1D0A00]">
                  {`${formatEuro(animatedSavedMonth)} - `}
                  <span className="relative inline-block pr-2">
                    {formatEuro(subscriptionMonthly)}
                    <span className="absolute -right-0 top-0 text-[10px] leading-none">*</span>
                  </span>
                  {` = ${formatEuro(animatedNetMonth)}`}
                </p>
              </div>
              <p className="mt-2 text-[12px] leading-4 text-[rgba(38,52,63,0.65)]">
                Een CoachScribe abonnement kost 85 euro per maand.
              </p>

              <div className="mt-6">
                <Button
                  label="Probeer het gratis"
                  destination={APP_URL}
                  variant="primary"
                  className="h-[46px] w-full rounded-[14px] text-[16px] font-semibold"
                  openInNewTab
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
};

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-[#E6E6E6] bg-white p-4">
      <p className="text-[13px] leading-5 text-[rgba(38,52,63,0.72)]">{label}</p>
      <p className="mt-1 text-[28px] font-semibold leading-8 text-[#1D0A00]">{value}</p>
    </div>
  );
}

type RangeWithInputProps = {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  unit: string;
};

function RangeWithInput(props: RangeWithInputProps) {
  const { id, label, min, max, step, value, onChange, unit } = props;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={`${id}-input`}
        className="text-[13px] font-medium leading-5 text-[#1D0A00] md:text-[14px] md:leading-5"
      >
        {label}
      </label>
      <div className="flex w-[50%] max-w-[150px] items-center gap-1.5">
        <input
          id={`${id}-input`}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => {
            const nextValue = clamp(toNumber(event.currentTarget.value), min, max);
            onChange(nextValue);
          }}
          className="w-full rounded-lg border border-[#D8D8D8] bg-white px-2.5 py-1.5 text-right text-[13px] leading-5 text-[#1D0A00] outline-none"
        />
        <span className="text-[11px] leading-4 text-[rgba(29,10,0,0.65)] md:text-[12px]">
          {unit}
        </span>
      </div>
      <input
        id={`${id}-range`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        onChange={(event) => onChange(clamp(toNumber(event.currentTarget.value), min, max))}
        className="w-full cursor-pointer accent-[#BE0165]"
      />
    </div>
  );
}
