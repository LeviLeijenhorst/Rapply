"use client";

import { useEffect, useMemo, useState } from "react";
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

const ENTRA_ACCESS_TOKEN_KEY = "entra_access_token";
const APP_URL = "https://app.coachscribe.nl";

function formatEuroPrice(value: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

type PricingSectionProps = {
  disableReveal?: boolean;
};

export default function PricingSection(props: PricingSectionProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [hoursSavedPerWeek, setHoursSavedPerWeek] = useState(4);
  const [averageSessionPrice, setAverageSessionPrice] = useState(150);

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

  const primaryPlan = useMemo(() => plans[0] ?? null, [plans]);
  const estimatedReportsPerMonth = primaryPlan
    ? Math.max(0, Math.floor(primaryPlan.minutesPerMonth / 60))
    : 0;
  const savedHoursPerMonth = hoursSavedPerWeek * 4.33;
  const sessionDurationHours = 1;
  const estimatedSessionsPerMonth = Math.max(0, savedHoursPerMonth / sessionDurationHours);
  const monthlyRevenue = Math.max(0, estimatedSessionsPerMonth * averageSessionPrice);
  const monthlySubscriptionCost = primaryPlan?.monthlyPrice ?? 0;
  const monthlyNetProfit = monthlyRevenue - monthlySubscriptionCost;

  if (!isVisible) return null;

  return (
    <section
      className="w-full py-12 md:py-16"
      data-reveal-disabled={props.disableReveal ? "1" : "0"}
    >
      <div className="mx-auto w-full max-w-[1320px] px-6 md:px-10">
        {isLoading ? (
          <div className="flex min-h-[470px] w-full items-center justify-center">
            <div
              className="h-10 w-10 animate-spin rounded-full border-4 border-[#BE0165]/25 border-t-[#BE0165]"
              aria-label="Prijzen laden"
            />
          </div>
        ) : !primaryPlan ? (
          <p className="text-[14px] leading-[20px] text-[rgba(38,52,63,0.8)]">
            Er zijn nog geen abonnementen beschikbaar.
          </p>
        ) : (
          <>
            <div className="grid w-full grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="flex min-h-[420px] flex-col gap-5 rounded-2xl border border-[#E0E0E0] bg-[#FFFFFF] p-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[20px] font-semibold leading-6 text-[#1D0A00]">
                      Tijdsbesparing per week (uren)
                    </p>
                    <span className="rounded-lg border border-[#E0E0E0] bg-[#FEFEFE] px-3 py-2 text-[14px] leading-[18px] text-[#1D0A00]">
                      {hoursSavedPerWeek.toFixed(1).replace(".", ",")} uur
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.3}
                    max={16}
                    step={0.1}
                    value={hoursSavedPerWeek}
                    onChange={(event) => {
                      setHoursSavedPerWeek(Number(event.currentTarget.value));
                    }}
                    className="w-full cursor-pointer accent-[#BE0165]"
                  />
                  <div className="flex items-center justify-between text-[14px] leading-[18px] text-[rgba(38,52,63,0.6)]">
                    <span>0,3 uur</span>
                    <span>16 uur</span>
                  </div>
                  <p className="text-[14px] leading-5 text-[rgba(38,52,63,0.6)]">
                    Schat hoeveel uren per week je vrijspeelt doordat
                    verslaglegging sneller gaat.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-[20px] font-semibold leading-6 text-[#1D0A00]">
                    Gemiddelde prijs per sessie (EUR)
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={String(averageSessionPrice)}
                    onChange={(event) => {
                      const digitsOnly = event.currentTarget.value.replace(
                        /[^\d]/g,
                        "",
                      );
                      setAverageSessionPrice(digitsOnly ? Number(digitsOnly) : 0);
                    }}
                    className="w-full rounded-[10px] border border-[#E0E0E0] bg-[#FEFEFE] px-3 py-2.5 text-[14px] leading-[18px] text-[#1D0A00] outline-none"
                    placeholder="150"
                  />
                </div>
              </div>

              <div className="flex min-h-[420px] flex-col gap-3 rounded-2xl border border-[#E0E0E0] bg-[#FFFFFF] p-6 text-[#1D0A00]">
                <div className="flex items-start justify-between gap-3">
                  <p className="flex-1 text-[18px] font-semibold leading-6 text-[#1D0A00]">
                    Nieuwe sessies per maand
                  </p>
                  <p className="text-[22px] font-semibold leading-7 text-[#1D0A00]">
                    {estimatedSessionsPerMonth.toFixed(1).replace(".", ",")}
                  </p>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <p className="flex-1 text-[18px] font-semibold leading-6 text-[#1D0A00]">
                    Opbrengst per maand
                  </p>
                  <p className="text-[22px] font-semibold leading-7 text-[#1D0A00]">
                    {formatEuroPrice(monthlyRevenue)}
                  </p>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <p className="flex-1 text-[18px] font-semibold leading-6 text-[#1D0A00]">
                    Kosten CoachScribe
                  </p>
                  <p className="text-[22px] font-semibold leading-7 text-[#1D0A00]">
                    {formatEuroPrice(monthlySubscriptionCost)}
                  </p>
                </div>
                <div className="my-1 h-px bg-[#E0E0E0]" />
                <p className="text-[26px] font-semibold leading-[30px] text-[#1D0A00]">
                  Netto opbrengst per maand
                </p>
                <p className="text-[42px] font-bold leading-[46px] text-[#BE0165]">
                  {formatEuroPrice(monthlyNetProfit)}
                </p>
                <p className="text-[20px] leading-6 text-[rgba(38,52,63,0.85)]">
                  Dit is je extra opbrengst{" "}
                  <span className="font-semibold">
                    minus de kosten van CoachScribe.
                  </span>
                </p>
              </div>

              <div className="flex min-h-[420px] flex-col gap-4 rounded-2xl border border-[#E0E0E0] bg-[#FEFEFE] p-6">
                <p className="text-[16px] font-semibold leading-5 text-[#1D0A00]">
                  {primaryPlan.name}
                </p>
                <div className="flex items-end gap-1.5">
                  <p className="text-[44px] font-bold leading-[48px] text-[#1D0A00]">
                    {formatEuroPrice(primaryPlan.monthlyPrice)}
                  </p>
                  <p className="mb-2 text-[14px] leading-[18px] text-[#656565]">
                    /maand
                  </p>
                </div>
                <div className="space-y-3">
                  <FeatureRow icon={<VerslagGenererenIcon size={22} color="#BE0165" />}>
                    {estimatedReportsPerMonth} gespreksverslagen
                  </FeatureRow>
                  <FeatureRow icon={<HoursPerMonthIcon size={24} color="#BE0165" />}>
                    {primaryPlan.minutesPerMonth} transcriptieminuten per maand
                  </FeatureRow>
                  <FeatureRow icon={<CalendarCircleIcon size={24} color="#BE0165" />}>
                    Uren tijdsbesparing per maand
                  </FeatureRow>
                  <FeatureRow icon={<StandaardVerslagIcon size={20} color="#BE0165" />}>
                    Automatisch opgebouwde, consistente rapportages
                  </FeatureRow>
                  <FeatureRow icon={<SecuritySafeIcon size={22} color="#BE0165" />}>
                    Veilige opslag binnen de EU
                  </FeatureRow>
                  <FeatureRow icon={<CoacheesIcon size={22} color="#BE0165" />}>
                    Alle informatie over al je clienten op een plek
                  </FeatureRow>
                </div>
                <div className="mt-auto">
                  <Button
                    label="Probeer het uit"
                    destination={APP_URL}
                    variant="primary"
                    className="h-[46px] w-full rounded-[14px] text-[16px] font-semibold"
                    openInNewTab
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 flex w-full items-center justify-between gap-3">
              <p className="text-[12px] leading-4 text-[rgba(38,52,63,0.8)]">
                Gespreksverslagen worden berekend op basis van 60 minuten per
                gesprek.
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

type FeatureRowProps = {
  icon: React.ReactNode;
  children: React.ReactNode;
};

function FeatureRow({ icon, children }: FeatureRowProps) {
  return (
    <div className="flex items-center gap-3 text-[14px] leading-[18px] text-[#656565]">
      <span className="flex h-6 w-6 items-center justify-center">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

type IconProps = {
  size?: number;
  color?: string;
};

function VerslagGenererenIcon({ size = 24, color = "#171717" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.49994 20.5C4.32994 21.33 5.66994 21.33 6.49994 20.5L19.4999 7.5C20.3299 6.67 20.3299 5.33 19.4999 4.5C18.6699 3.67 17.3299 3.67 16.4999 4.5L3.49994 17.5C2.66994 18.33 2.66994 19.67 3.49994 20.5Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M18.0098 8.99001L15.0098 5.99001" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 2.44L10 2L9.56 3.5L10 5L8.5 4.56L7 5L7.44 3.5L7 2L8.5 2.44Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 8.44L6 8L5.56 9.5L6 11L4.5 10.56L3 11L3.44 9.5L3 8L4.5 8.44Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19.5 13.44L21 13L20.56 14.5L21 16L19.5 15.56L18 16L18.44 14.5L18 13L19.5 13.44Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HoursPerMonthIcon({ color = "#BE0165", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C17.51 22 22 17.51 22 12C22 6.49 17.51 2 12 2ZM16.35 15.57C16.21 15.81 15.96 15.94 15.7 15.94C15.57 15.94 15.44 15.91 15.32 15.83L12.22 13.98C11.45 13.52 10.88 12.51 10.88 11.62V7.52C10.88 7.11 11.22 6.77 11.63 6.77C12.04 6.77 12.38 7.11 12.38 7.52V11.62C12.38 11.98 12.68 12.51 12.99 12.69L16.09 14.54C16.45 14.75 16.57 15.21 16.35 15.57Z"
        fill={color}
      />
    </svg>
  );
}

function CalendarCircleIcon({ size = 24, color = "#BE0165" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
        stroke={color}
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9.89014 5.82996V7.82996" stroke={color} strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.1099 5.82996V7.82996" stroke={color} strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.53003 10.14H16.47" stroke={color} strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M13.5 17.6699H10.5C8 17.6699 6.5 15.8699 6.5 13.6699V10.6699C6.5 8.46992 8 6.66992 10.5 6.66992H13.5C16 6.66992 17.5 8.46992 17.5 10.6699V13.6699C17.5 15.8699 16 17.6699 13.5 17.6699Z"
        stroke={color}
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StandaardVerslagIcon({ color = "#BE0165", size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 9.75H9.75" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.25 9.75H7.0875" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.25 12.75H8.25" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1.5 6.75C1.5 3 3 1.5 6.75 1.5H10.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M16.5 7.5V11.25C16.5 15 15 16.5 11.25 16.5H6.75C3 16.5 1.5 15 1.5 11.25V9.735"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13.5 7.5C11.25 7.5 10.5 6.75 10.5 4.5V1.5L16.5 7.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SecuritySafeIcon({ color = "#BD0265", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20.9098 11.1203V6.73031C20.9098 5.91031 20.2898 4.98031 19.5198 4.67031L13.9498 2.39031C12.6998 1.88031 11.2898 1.88031 10.0398 2.39031L4.46984 4.67031C3.70984 4.98031 3.08984 5.91031 3.08984 6.73031V11.1203C3.08984 16.0103 6.63984 20.5903 11.4898 21.9303C11.8198 22.0203 12.1798 22.0203 12.5098 21.9303C17.3598 20.5903 20.9098 16.0103 20.9098 11.1203ZM12.7498 12.8703V15.5003C12.7498 15.9103 12.4098 16.2503 11.9998 16.2503C11.5898 16.2503 11.2498 15.9103 11.2498 15.5003V12.8703C10.2398 12.5503 9.49984 11.6103 9.49984 10.5003C9.49984 9.12031 10.6198 8.00031 11.9998 8.00031C13.3798 8.00031 14.4998 9.12031 14.4998 10.5003C14.4998 11.6203 13.7598 12.5503 12.7498 12.8703Z"
        fill={color}
      />
    </svg>
  );
}

function CoacheesIcon({ color = "#BE0165", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 7.16C17.94 7.15 17.87 7.15 17.81 7.16C16.43 7.11 15.33 5.98 15.33 4.58C15.33 3.15 16.48 2 17.91 2C19.34 2 20.49 3.16 20.49 4.58C20.48 5.98 19.38 7.11 18 7.16Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.97 14.44C18.34 14.67 19.85 14.43 20.91 13.72C22.32 12.78 22.32 11.24 20.91 10.3C19.84 9.59001 18.31 9.35 16.94 9.59"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.97 7.16C6.03 7.15 6.1 7.15 6.16 7.16C7.54 7.11 8.64 5.98 8.64 4.58C8.64 3.15 7.49 2 6.06 2C4.63 2 3.48 3.16 3.48 4.58C3.49 5.98 4.59 7.11 5.97 7.16Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 14.44C5.63 14.67 4.12 14.43 3.06 13.72C1.65 12.78 1.65 11.24 3.06 10.3C4.13 9.59001 5.66 9.35 7.03 9.59"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 14.63C11.94 14.62 11.87 14.62 11.81 14.63C10.43 14.58 9.33 13.45 9.33 12.05C9.33 10.62 10.48 9.47 11.91 9.47C13.34 9.47 14.49 10.63 14.49 12.05C14.48 13.45 13.38 14.59 12 14.63Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.91 17.78C13.32 16.72 10.69 16.72 9.09 17.78C7.68 18.72 7.68 20.26 9.09 21.2C10.69 22.27 13.31 22.27 14.91 21.2"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
