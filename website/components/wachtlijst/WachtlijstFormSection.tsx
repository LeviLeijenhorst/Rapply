"use client";

import { FormEvent, useEffect, useState } from "react";
import SectionContainer from "@/components/home/SectionContainer";
import BottomToast from "@/components/BottomToast";
import { getApiUrl } from "@/lib/api";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isToastVisible, setIsToastVisible] = useState(false);

  useEffect(() => {
    if (!isToastVisible) return;
    const timeout = window.setTimeout(() => setIsToastVisible(false), 2600);
    return () => window.clearTimeout(timeout);
  }, [isToastVisible]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const firstName = formValues.firstName.trim();
    const lastName = formValues.lastName.trim();
    const email = formValues.email.trim();
    const phone = formValues.phone.trim();
    const coachType = formValues.coachType.trim();
    const message = formValues.message.trim();

    try {
      setIsSubmitting(true);
      const response = await fetch(getApiUrl("/wachtlijst/request"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          coachType,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error("Wachtlijstaanvraag verzenden mislukt.");
      }

      setFormValues(initialFormValues);
      setToastMessage("Bericht verzonden! Je hoort snel van ons.");
      setIsToastVisible(false);
      window.requestAnimationFrame(() => setIsToastVisible(true));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "";
      if (errorMessage.includes("NEXT_PUBLIC_COACHSCRIBE_API_BASE_URL")) {
        setToastMessage("Configuratie ontbreekt. Start de website opnieuw.");
      } else {
        setToastMessage("Verzenden mislukt. Probeer het opnieuw.");
      }
      console.error("[wachtlijst] submit failed", error);
      setIsToastVisible(false);
      window.requestAnimationFrame(() => setIsToastVisible(true));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SectionContainer className="bg-[#F8F9F9]" contentClassName="pb-[80px] pt-[80px] md:pb-[80px] md:pt-[80px]">
      <section className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-8 shadow-[0_8px_20px_rgba(15,23,42,0.08)] md:p-10">
        <div className="mb-8 flex w-full flex-col gap-3">
          <h1 className="text-3xl font-semibold text-[#1D0A00] md:text-4xl xl:text-5xl">
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
              disabled={isSubmitting}
              className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full border-2 border-[#BD0265] bg-[#BD0265] px-6 text-base font-semibold text-white transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#A00256] hover:bg-[#A00256]"
            >
              <span>{isSubmitting ? "Versturen..." : "Verstuur"}</span>
            </button>
          </div>
        </form>
      </section>
      <BottomToast
        isVisible={isToastVisible}
        message={toastMessage}
      />
    </SectionContainer>
  );
}
