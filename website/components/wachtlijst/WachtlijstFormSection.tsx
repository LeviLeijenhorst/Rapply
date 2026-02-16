"use client";

import { FormEvent, useEffect, useState } from "react";
import SectionContainer from "@/components/home/SectionContainer";

type WachtlijstFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  coachType: string;
};

const initialFormValues: WachtlijstFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  message: "",
  coachType: "",
};

const inputClassName =
  "h-12 rounded-xl border border-[#DDDDDD] bg-white px-4 text-base font-normal text-[#1D0A00] outline-none transition-colors focus:border-[#BD0265]";

export default function WachtlijstFormSection() {
  const [formValues, setFormValues] = useState<WachtlijstFormValues>(initialFormValues);
  const [isToastVisible, setIsToastVisible] = useState(false);

  useEffect(() => {
    if (!isToastVisible) return;
    const timeout = window.setTimeout(() => setIsToastVisible(false), 2600);
    return () => window.clearTimeout(timeout);
  }, [isToastVisible]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormValues(initialFormValues);
    setIsToastVisible(false);
    window.requestAnimationFrame(() => setIsToastVisible(true));
  };

  return (
    <SectionContainer className="bg-[#F8F9F9]" contentClassName="pb-[80px] pt-[80px] md:pb-[80px] md:pt-[80px]">
      <section className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-8 shadow-[0_8px_20px_rgba(15,23,42,0.08)] md:p-10">
        <div className="mb-8 flex w-full flex-col gap-3">
          <h1 className="text-4xl font-semibold text-[#1D0A00] md:text-5xl">
            Wachtlijst
          </h1>
          <p className="text-base font-normal text-black/70">
            Laat je gegevens achter en we nemen snel contact met je op.
          </p>
        </div>
        <form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
          <div className="grid w-full gap-4 md:grid-cols-2">
            <label className="flex w-full flex-col gap-2">
              <span className="text-sm font-normal text-[#1D0A00]">Voornaam*</span>
              <input
                type="text"
                name="firstName"
                required
                value={formValues.firstName}
                onChange={(event) =>
                  setFormValues((previousValues) => ({
                    ...previousValues,
                    firstName: event.target.value,
                  }))
                }
                placeholder="Jouw voornaam"
                className={inputClassName}
              />
            </label>
            <label className="flex w-full flex-col gap-2">
              <span className="text-sm font-normal text-[#1D0A00]">Achternaam*</span>
              <input
                type="text"
                name="lastName"
                required
                value={formValues.lastName}
                onChange={(event) =>
                  setFormValues((previousValues) => ({
                    ...previousValues,
                    lastName: event.target.value,
                  }))
                }
                placeholder="Jouw achternaam"
                className={inputClassName}
              />
            </label>
          </div>
          <label className="flex w-full flex-col gap-2">
            <span className="text-sm font-normal text-[#1D0A00]">Email*</span>
            <input
              type="email"
              name="email"
              required
              value={formValues.email}
              onChange={(event) =>
                setFormValues((previousValues) => ({
                  ...previousValues,
                  email: event.target.value,
                }))
              }
              placeholder="Jouw email adres"
              className={inputClassName}
            />
          </label>
          <label className="flex w-full flex-col gap-2">
            <span className="text-sm font-normal text-[#1D0A00]">Telefoonnummer (optioneel)</span>
            <input
              type="tel"
              name="phone"
              value={formValues.phone}
              onChange={(event) =>
                setFormValues((previousValues) => ({
                  ...previousValues,
                  phone: event.target.value,
                }))
              }
              placeholder="Jouw telefoonnummer"
              className={inputClassName}
            />
          </label>
          <label className="flex w-full flex-col gap-2">
            <span className="text-sm font-normal text-[#1D0A00]">Type coach (optioneel)</span>
            <input
              type="text"
              name="coachType"
              value={formValues.coachType}
              onChange={(event) =>
                setFormValues((previousValues) => ({
                  ...previousValues,
                  coachType: event.target.value,
                }))
              }
              placeholder="Bijvoorbeeld loopbaancoach"
              className={inputClassName}
            />
          </label>
          <label className="flex w-full flex-col gap-2">
            <span className="text-sm font-normal text-[#1D0A00]">Bericht (optioneel)</span>
            <textarea
              name="message"
              rows={5}
              value={formValues.message}
              onChange={(event) =>
                setFormValues((previousValues) => ({
                  ...previousValues,
                  message: event.target.value,
                }))
              }
              placeholder="Wat wil je met ons delen?"
              className="rounded-xl border border-[#DDDDDD] bg-white px-4 py-3 text-base font-normal text-[#1D0A00] outline-none transition-colors focus:border-[#BD0265]"
            />
          </label>
          <div className="pt-2">
            <button
              type="submit"
              className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full border-2 border-[#BD0265] bg-[#BD0265] px-6 text-base font-semibold text-white transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#A00256] hover:bg-[#A00256]"
            >
              <span>Verstuur</span>
            </button>
          </div>
        </form>
      </section>
      <div
        className={`pointer-events-none fixed left-1/2 z-50 -translate-x-1/2 text-center text-xl font-semibold text-[#BD0265] transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isToastVisible ? "bottom-[25vh] translate-y-0 opacity-100" : "bottom-[25vh] translate-y-[45vh] opacity-0"
        }`}
        aria-live="polite"
      >
        Bericht verzonden! Je hoort snel van ons.
      </div>
    </SectionContainer>
  );
}
