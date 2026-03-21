"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/Button";
import { getApiUrl } from "@/lib/api";

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
  hoursPerWeekReports: number;
  weeksPerYear: number;
  newSessionsPercentage: number;
};

type RoiResults = {
  hoursSavedWeek: number;
  eurSavedMonth: number;
  eurSavedYear: number;
  netMonth: number;
};

const ENTRA_ACCESS_TOKEN_KEY = "entra_access_token";
const APP_URL = "https://calendly.com/jonaskroon/new-meeting?month=2026-02";
const REPORTING_TIME_SAVED_RATIO = 0.7;

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function toNumber(value: string): number {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function calculateRoi(inputs: RoiInputs): RoiResults {
  const hoursSavedWeek = inputs.hoursPerWeekReports * REPORTING_TIME_SAVED_RATIO;
  const eurSavedWeek =
    hoursSavedWeek * inputs.hourlyRate * (inputs.newSessionsPercentage / 100);
  const eurSavedMonth = eurSavedWeek * 4.33;
  const eurSavedYear = eurSavedWeek * inputs.weeksPerYear;
  const netMonth = eurSavedMonth;

  return {
    hoursSavedWeek,
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

function formatHours(value: number): string {
  return new Intl.NumberFormat("nl-NL", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export default function PricingSection(props: PricingSectionProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  const [hourlyRate, setHourlyRate] = useState(75);
  const [hoursPerWeekReports, setHoursPerWeekReports] = useState(5);
  const [newSessionsPercentage, setNewSessionsPercentage] = useState(50);
  const weeksPerYear = 46;

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      setIsLoading(true);

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
        hoursPerWeekReports,
        weeksPerYear,
        newSessionsPercentage,
      }),
    [hourlyRate, hoursPerWeekReports, newSessionsPercentage],
  );

  const animatedHoursSavedWeek = useAnimatedNumber(roi.hoursSavedWeek);
  const animatedSavedYear = useAnimatedNumber(roi.eurSavedYear);
  const animatedNetMonth = useAnimatedNumber(roi.netMonth);

  if (!isVisible) return null;

  return (
    <section
      className={`w-full ${
        props.isStandalonePage
          ? "pt-20 pb-[120px] md:pt-20 md:pb-[120px]"
          : "py-12 md:py-16"
      }`}
      data-reveal-disabled={props.disableReveal ? "1" : "0"}
    >
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        {isLoading ? (
          <div className="flex min-h-[470px] w-full items-center justify-center">
            <div
              className="h-10 w-10 animate-spin rounded-full border-4 border-[#BE0165]/25 border-t-[#BE0165]"
              aria-label="Calculator laden"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.5fr)] lg:items-stretch">
            <div className="rounded-[28px] border border-[#E7DCE4] bg-[#FFFCFE] px-6 py-10 shadow-[0_18px_40px_rgba(99,35,79,0.05)] md:px-7 md:py-10">
              <h2 className="font-[var(--font-catamaran)] text-[30px] font-medium leading-[34px] text-[#1D0A00] md:text-[34px] md:leading-[38px]">
                <span className="text-[#BD0265]">ROI</span> calculator
              </h2>
              <p className="mt-2 text-[14px] leading-5 text-[rgba(38,52,63,0.78)] md:text-[15px] md:leading-6">
                Bereken hoeveel tijd en omzet je potentieel vrijspeelt met Rapply.
              </p>

              <div className="mt-8 space-y-6">
                <RangeWithInput
                  id="hourlyRate"
                  label="Uurtarief"
                  min={20}
                  max={250}
                  step={1}
                  value={hourlyRate}
                  onChange={setHourlyRate}
                  valueLabel={`€ ${hourlyRate}`}
                />
                <RangeWithInput
                  id="hoursPerWeekReports"
                  label="Uren per week aan rapportages"
                  min={0.5}
                  max={40}
                  step={0.5}
                  value={hoursPerWeekReports}
                  onChange={setHoursPerWeekReports}
                  valueLabel={`${formatHours(hoursPerWeekReports)} uur`}
                />
                <RangeWithInput
                  id="newSessionsPercentage"
                  label="Tijdswinst ingezet voor extra cliënten (%)"
                  min={0}
                  max={100}
                  step={1}
                  value={newSessionsPercentage}
                  onChange={setNewSessionsPercentage}
                  valueLabel={`${newSessionsPercentage}%`}
                />
              </div>
            </div>

            <div className="font-[var(--font-catamaran)] flex h-full flex-col overflow-hidden rounded-[28px] border border-[#D9BDD1] bg-[linear-gradient(180deg,#BD0265_0%,#C92A87_100%)] text-white shadow-[0_24px_60px_rgba(99,35,79,0.12)]">
              <div className="flex-1 px-6 py-8 md:px-8 md:py-10">
                <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-white/65">
                  Besparing per maand
                </p>
                <p className="mt-3 text-[50px] font-medium leading-none md:text-[58px]">
                  {formatEuro(animatedNetMonth)}
                </p>

                <div className="mt-8 space-y-4 border-t border-white/20 pt-6">
                  <div className="flex items-end justify-between gap-4">
                    <span className="text-[15px] text-white/78">Besparing per jaar</span>
                    <span className="text-[32px] font-medium leading-none">
                      {formatEuro(animatedSavedYear)}
                    </span>
                  </div>
                  <div className="flex items-end justify-between gap-4">
                    <span className="text-[15px] text-white/78">Uren bespaard per week</span>
                    <span className="text-[32px] font-medium leading-none">
                      {`${animatedHoursSavedWeek.toFixed(1).replace(".", ",")} uur`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-auto flex items-end px-6 pt-6 pb-6 md:px-8 md:pt-8 md:pb-6">
                <Button
                  label="Maak een afspraak"
                  destination={APP_URL}
                  variant="secondary"
                  className="h-[46px] w-full rounded-[14px] border-white bg-white text-[16px] font-semibold text-[#BD0265] hover:border-white hover:bg-white/95 hover:text-[#BD0265]"
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

type RangeWithInputProps = {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  valueLabel: string;
};

function RangeWithInput(props: RangeWithInputProps) {
  const { id, label, min, max, step, value, onChange, valueLabel } = props;

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <label
          htmlFor={`${id}-range`}
          className="text-[15px] font-medium leading-6 text-[#1D0A00]"
        >
          {label}
        </label>
        <span className="font-[var(--font-catamaran)] text-[18px] font-medium leading-none text-[#BD0265]">
          {valueLabel}
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
