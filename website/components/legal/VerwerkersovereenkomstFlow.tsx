"use client";

import Image from "next/image";
import {
  FormEvent,
  MouseEvent as ReactMouseEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  buildVerwerkersovereenkomst,
  VerwerkersovereenkomstFormValues,
} from "@/lib/verwerkersovereenkomst";
import { downloadVerwerkersovereenkomstPdf } from "@/lib/verwerkersovereenkomstPdf";

const inputClassName =
  "h-12 rounded-xl border border-[#DDDDDD] bg-white px-4 text-base font-normal text-[#1D0A00] outline-none transition-colors focus:border-[#BD0265]";

const dayLabels = ["ma", "di", "wo", "do", "vr", "za", "zo"];

type AddressSuggestion = {
  label: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
};

function isMainHeading(line: string) {
  return (
    line === line.toUpperCase() ||
    /^BIJLAGE\s+\d+/i.test(line) ||
    /^\d+\.\s+/.test(line)
  );
}

function isSubHeading(line: string) {
  return /^\d+\.\d+\s+/.test(line) || /^[A-Z]\.\s+/.test(line);
}

function isBullet(line: string) {
  return line.trim().startsWith("- ");
}

function isLabelValueLine(line: string) {
  return /^[^:]{2,40}:\s+.+$/.test(line);
}

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toIsoDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value: string) {
  if (!value) return "";
  const parsed = parseIsoDate(value);
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

function getCalendarCells(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const startWeekday = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPreviousMonth = new Date(year, month, 0).getDate();
  const cells: Array<{ date: Date; inCurrentMonth: boolean }> = [];

  for (let index = 0; index < 42; index += 1) {
    const dayOffset = index - startWeekday + 1;
    if (dayOffset <= 0) {
      cells.push({
        date: new Date(year, month - 1, daysInPreviousMonth + dayOffset),
        inCurrentMonth: false,
      });
      continue;
    }
    if (dayOffset > daysInMonth) {
      cells.push({
        date: new Date(year, month + 1, dayOffset - daysInMonth),
        inCurrentMonth: false,
      });
      continue;
    }
    cells.push({
      date: new Date(year, month, dayOffset),
      inCurrentMonth: true,
    });
  }

  return cells;
}

function CalendarIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 text-[#BD0265]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

type CalendarInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function CalendarInput({ label, value, onChange }: CalendarInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => parseIsoDate(value));
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedIso = value;

  useEffect(() => {
    if (!isOpen) return;
    const handleDocumentClick = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, [isOpen]);

  const monthTitle = new Intl.DateTimeFormat("nl-NL", {
    month: "long",
    year: "numeric",
  }).format(visibleMonth);
  const calendarCells = getCalendarCells(visibleMonth);

  const handleSelectDate = (event: ReactMouseEvent<HTMLButtonElement>) => {
    const iso = event.currentTarget.dataset.isoDate;
    if (!iso) return;
    onChange(iso);
    setVisibleMonth(parseIsoDate(iso));
    setIsOpen(false);
  };

  return (
    <div className="relative flex flex-col gap-2" ref={containerRef}>
      <span className="text-sm text-[#1D0A00]">{label}</span>
      <button
        type="button"
        className={`${inputClassName} inline-flex cursor-pointer items-center justify-between text-left ${!value ? "text-black/40" : ""}`}
        onClick={() => setIsOpen((previous) => !previous)}
      >
        <span>{value ? formatDate(value) : "Kies een datum"}</span>
        <CalendarIcon />
      </button>
      {isOpen ? (
        <div className="absolute left-0 top-[86px] z-20 w-[320px] rounded-2xl border border-[#E3E3E3] bg-white p-4 shadow-[0_14px_28px_rgba(15,23,42,0.14)]">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#E6C1D6] text-[#BD0265] transition-colors hover:bg-[#FCEFF6]"
              onClick={() =>
                setVisibleMonth(
                  (previous) =>
                    new Date(
                      previous.getFullYear(),
                      previous.getMonth() - 1,
                      1,
                    ),
                )
              }
            >
              {"<"}
            </button>
            <span className="text-sm font-semibold capitalize text-[#1D0A00]">
              {monthTitle}
            </span>
            <button
              type="button"
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#E6C1D6] text-[#BD0265] transition-colors hover:bg-[#FCEFF6]"
              onClick={() =>
                setVisibleMonth(
                  (previous) =>
                    new Date(
                      previous.getFullYear(),
                      previous.getMonth() + 1,
                      1,
                    ),
                )
              }
            >
              {">"}
            </button>
          </div>
          <div className="mb-2 grid grid-cols-7 gap-1">
            {dayLabels.map((dayLabel) => (
              <div
                key={dayLabel}
                className="text-center text-xs font-semibold uppercase text-black/50"
              >
                {dayLabel}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((calendarCell) => {
              const isoDate = toIsoDate(calendarCell.date);
              const isSelected = isoDate === selectedIso;
              return (
                <button
                  key={isoDate}
                  type="button"
                  data-iso-date={isoDate}
                  onClick={handleSelectDate}
                  className={`h-9 cursor-pointer rounded-lg text-sm transition-colors ${
                    isSelected
                      ? "bg-[#BD0265] text-white"
                      : calendarCell.inCurrentMonth
                        ? "text-[#1D0A00] hover:bg-[#F8E4EF]"
                        : "text-black/35 hover:bg-[#F5F5F5]"
                  }`}
                >
                  {calendarCell.date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const initialValues: VerwerkersovereenkomstFormValues = {
  organizationName: "",
  address: "",
  postalCode: "",
  city: "",
  country: "Nederland",
  contactPersonFullName: "",
  contactEmail: "",
  effectiveDate: getTodayIsoDate(),
  signingPlace: "",
  signingDate: getTodayIsoDate(),
  signerFullName: "",
  signerRole: "",
};

export default function VerwerkersovereenkomstFlow() {
  const addressInputId = useId();
  const [formValues, setFormValues] =
    useState<VerwerkersovereenkomstFormValues>(initialValues);
  const [isReady, setIsReady] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<
    AddressSuggestion[]
  >([]);
  const skipAutocompleteRef = useRef(false);
  const addressContainerRef = useRef<HTMLLabelElement | null>(null);

  const documentText = useMemo(
    () => buildVerwerkersovereenkomst(formValues),
    [formValues],
  );

  useEffect(() => {
    const query = formValues.address.trim();
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    if (skipAutocompleteRef.current) {
      skipAutocompleteRef.current = false;
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const encodedQuery = encodeURIComponent(query);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&addressdetails=1&countrycodes=nl&q=${encodedQuery}&accept-language=nl`,
          { signal: controller.signal },
        );
        if (!response.ok) return;
        const results = (await response.json()) as Array<{
          address?: {
            house_number?: string;
            road?: string;
            pedestrian?: string;
            residential?: string;
            postcode?: string;
            city?: string;
            town?: string;
            village?: string;
            municipality?: string;
            country?: string;
          };
        }>;

        const mapped = results
          .map((result) => {
            const street =
              result.address?.road ??
              result.address?.pedestrian ??
              result.address?.residential ??
              "";
            const houseNumber = result.address?.house_number ?? "";
            const postcode = result.address?.postcode ?? "";
            const city =
              result.address?.city ??
              result.address?.town ??
              result.address?.village ??
              result.address?.municipality ??
              "";
            if (!street || !postcode || !city) return null;
            const address = `${street}${houseNumber ? ` ${houseNumber}` : ""}`.trim();
            const label = `${address}, ${postcode} ${city}`;
            return {
              label,
              address,
              postalCode: postcode,
              city,
              country: result.address?.country ?? "Nederland",
            } satisfies AddressSuggestion;
          })
          .filter((value): value is AddressSuggestion => Boolean(value));

        const uniqueByLabel = mapped.filter(
          (suggestion, index) =>
            mapped.findIndex((item) => item.label === suggestion.label) ===
            index,
        );
        setAddressSuggestions(uniqueByLabel.slice(0, 6));
      } catch {
        // Keep autocomplete best-effort only.
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [formValues.address]);

  useEffect(() => {
    if (!addressSuggestions.length) return;
    const onOutsideClick = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;
      if (!addressContainerRef.current?.contains(event.target)) {
        setAddressSuggestions([]);
      }
    };
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [addressSuggestions.length]);

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    skipAutocompleteRef.current = true;
    setFormValues((previous) => ({
      ...previous,
      address: suggestion.address,
      postalCode: suggestion.postalCode || previous.postalCode,
      city: suggestion.city || previous.city,
      country: suggestion.country || previous.country,
    }));
    setAddressSuggestions([]);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsReady(true);
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await downloadVerwerkersovereenkomstPdf(
        documentText,
        formValues.organizationName,
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const previewLines = documentText.replace(/\r/g, "").split("\n");

  return (
    <section className="w-full bg-[#F8F9F9]">
      <div className="mx-auto w-full max-w-6xl px-6 pb-12 pt-6 md:px-10 md:pb-16 md:pt-10">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-semibold text-[#1D0A00] md:text-4xl xl:text-5xl">
              Verwerkersovereenkomst genereren
            </h1>
            <p className="text-base font-normal text-black/70 md:text-lg">
              Vul de gegevens in. Daarna kun je de verwerkersovereenkomst als
              CoachScribe PDF downloaden.
            </p>
          </div>

          {!isReady ? (
            <form
              onSubmit={handleSubmit}
              className="page-enter-animation rounded-2xl border border-black/10 bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.06)] md:p-8"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-sm text-[#1D0A00]">
                    Naam organisatie*
                  </span>
                  <input
                    required
                    className={inputClassName}
                    value={formValues.organizationName}
                    onChange={(event) =>
                      setFormValues((previous) => ({
                        ...previous,
                        organizationName: event.target.value,
                      }))
                    }
                  />
                </label>
                <label
                  ref={addressContainerRef}
                  htmlFor={addressInputId}
                  className="relative flex flex-col gap-2 md:col-span-2"
                >
                  <span className="text-sm text-[#1D0A00]">Adres*</span>
                  <input
                    id={addressInputId}
                    required
                    className={inputClassName}
                    value={formValues.address}
                    onChange={(event) =>
                      setFormValues((previous) => ({
                        ...previous,
                        address: event.target.value,
                      }))
                    }
                  />
                  <div
                    className={`absolute left-0 right-0 top-[86px] z-20 max-h-56 overflow-auto rounded-xl bg-white shadow-[0_12px_24px_rgba(15,23,42,0.12)] transition-all duration-200 ease-out ${
                      addressSuggestions.length > 0
                        ? "translate-y-0 border border-[#E3E3E3] opacity-100"
                        : "-translate-y-1 border border-transparent opacity-0 pointer-events-none"
                    }`}
                  >
                    {addressSuggestions.map((suggestion, index) => (
                      <button
                        key={`${suggestion.label}-${index}`}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          handleSelectSuggestion(suggestion);
                        }}
                        className="w-full cursor-pointer border-b border-[#F0F0F0] px-4 py-3 text-left text-sm text-[#1D0A00] transition-colors hover:bg-[#FBE8F1] last:border-b-0"
                      >
                        {suggestion.label}
                      </button>
                    ))}
                  </div>
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm text-[#1D0A00]">Postcode*</span>
                  <input
                    required
                    className={inputClassName}
                    value={formValues.postalCode}
                    onChange={(event) =>
                      setFormValues((previous) => ({
                        ...previous,
                        postalCode: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm text-[#1D0A00]">Plaats*</span>
                  <input
                    required
                    className={inputClassName}
                    value={formValues.city}
                    onChange={(event) =>
                      setFormValues((previous) => ({
                        ...previous,
                        city: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm text-[#1D0A00]">Land*</span>
                  <input
                    required
                    className={inputClassName}
                    value={formValues.country}
                    onChange={(event) =>
                      setFormValues((previous) => ({
                        ...previous,
                        country: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm text-[#1D0A00]">
                    Voor- en achternaam contactpersoon*
                  </span>
                  <input
                    required
                    className={inputClassName}
                    value={formValues.contactPersonFullName}
                    onChange={(event) =>
                      setFormValues((previous) => ({
                        ...previous,
                        contactPersonFullName: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm text-[#1D0A00]">E-mail*</span>
                  <input
                    required
                    type="email"
                    className={inputClassName}
                    value={formValues.contactEmail}
                    onChange={(event) =>
                      setFormValues((previous) => ({
                        ...previous,
                        contactEmail: event.target.value,
                      }))
                    }
                  />
                </label>

                <CalendarInput
                  label="Ingangsdatum*"
                  value={formValues.effectiveDate}
                  onChange={(dateValue) =>
                    setFormValues((previous) => ({
                      ...previous,
                      effectiveDate: dateValue,
                    }))
                  }
                />

                <label className="flex flex-col gap-2">
                  <span className="text-sm text-[#1D0A00]">Plaats*</span>
                  <input
                    required
                    className={inputClassName}
                    value={formValues.signingPlace}
                    onChange={(event) =>
                      setFormValues((previous) => ({
                        ...previous,
                        signingPlace: event.target.value,
                      }))
                    }
                  />
                </label>

                <CalendarInput
                  label="Datum*"
                  value={formValues.signingDate}
                  onChange={(dateValue) =>
                    setFormValues((previous) => ({
                      ...previous,
                      signingDate: dateValue,
                    }))
                  }
                />

                <label className="flex flex-col gap-2">
                  <span className="text-sm text-[#1D0A00]">
                    Voor- en achternaam ondertekenaar*
                  </span>
                  <input
                    required
                    className={inputClassName}
                    value={formValues.signerFullName}
                    onChange={(event) =>
                      setFormValues((previous) => ({
                        ...previous,
                        signerFullName: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm text-[#1D0A00]">Functie*</span>
                  <input
                    required
                    className={inputClassName}
                    value={formValues.signerRole}
                    onChange={(event) =>
                      setFormValues((previous) => ({
                        ...previous,
                        signerRole: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
              <div className="mt-6">
                <button
                  type="submit"
                  className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full border-2 border-[#BD0265] bg-[#BD0265] px-6 text-base font-semibold text-white transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#A00256] hover:bg-[#A00256]"
                >
                  Maak verwerkersovereenkomst
                </button>
              </div>
            </form>
          ) : (
            <div className="page-enter-animation flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.06)] md:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="inline-flex h-12 min-w-[260px] cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-[#BD0265] bg-[#BD0265] px-6 text-base font-semibold text-white transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#A00256] hover:bg-[#A00256] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isDownloading
                    ? "PDF wordt gemaakt..."
                    : "Download CoachScribe PDF"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsReady(false)}
                  className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full border border-[#BD0265] bg-white px-6 text-base font-semibold text-[#BD0265] transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#FBE8F1]"
                >
                  Gegevens aanpassen
                </button>
              </div>

              <article className="rounded-xl border border-[#E7E7E7] bg-white p-6">
                <div className="mb-5 flex justify-end">
                  <Image
                    src="/icon.svg"
                    alt="CoachScribe logo"
                    width={26}
                    height={26}
                  />
                </div>
                <div className="flex flex-col gap-1 text-[#1D0A00]">
                  {previewLines.map((rawLine, index) => {
                    const line = rawLine.trim();
                    if (!line) {
                      return <div key={`empty-${index}`} className="h-2" />;
                    }
                    if (isMainHeading(line)) {
                      return (
                        <h3
                          key={`main-${index}`}
                          className="pt-2 text-[16px] font-bold leading-[1.35]"
                        >
                          {line}
                        </h3>
                      );
                    }
                    if (isSubHeading(line)) {
                      return (
                        <h4
                          key={`sub-${index}`}
                          className="text-[14px] font-semibold leading-[1.35]"
                        >
                          {line}
                        </h4>
                      );
                    }
                    if (isBullet(line)) {
                      return (
                        <p key={`bullet-${index}`} className="pl-3 text-[13.5px] leading-[1.45]">
                          • {line.replace(/^- /, "").trim()}
                        </p>
                      );
                    }
                    if (isLabelValueLine(line)) {
                      const separatorIndex = line.indexOf(":");
                      const label = line.slice(0, separatorIndex + 1);
                      const value = line.slice(separatorIndex + 1).trim();
                      return (
                        <p key={`label-${index}`} className="text-[13.5px] leading-[1.45]">
                          <strong>{label}</strong> {value}
                        </p>
                      );
                    }
                    return (
                      <p key={`line-${index}`} className="text-[13.5px] leading-[1.45]">
                        {line}
                      </p>
                    );
                  })}
                </div>
                <div className="mt-5 border-t border-[#BD0265] pt-3 text-[11px] text-[#606060]">
                  coachscribe.nl | contact@coachscribe.nl
                </div>
              </article>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

