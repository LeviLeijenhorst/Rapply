"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import SectionContainer from "@/components/home/SectionContainer";
import BottomToast from "@/components/BottomToast";
import { getApiUrl } from "@/lib/api";
import contactImage from "@/over_ons/over_ons-beiden.png";
import contactBackground from "@/over_ons/kom_in_contact-background.svg";

type ContactFormValues = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

const initialFormValues: ContactFormValues = {
  name: "",
  email: "",
  phone: "",
  message: "",
};

const inputClassName =
  "h-12 rounded-xl border border-white/60 bg-white/10 px-4 text-base font-normal text-white placeholder:text-white/70 outline-none transition-colors focus:border-white";

type OverOnsContactSectionProps = {
  useRoundedContainer?: boolean;
  useLightTheme?: boolean;
};

export default function OverOnsContactSection({
  useRoundedContainer = true,
  useLightTheme = false,
}: OverOnsContactSectionProps) {
  const [formValues, setFormValues] = useState<ContactFormValues>(initialFormValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("Bericht verzonden! Je hoort snel van ons.");
  const [isToastVisible, setIsToastVisible] = useState(false);

  useEffect(() => {
    if (!isToastVisible) return;
    const timeout = window.setTimeout(() => setIsToastVisible(false), 2600);
    return () => window.clearTimeout(timeout);
  }, [isToastVisible]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const name = formValues.name.trim();
    const email = formValues.email.trim();
    const phone = formValues.phone.trim();
    const message = formValues.message.trim();

    try {
      setIsSubmitting(true);
      const response = await fetch(getApiUrl("/contact/request"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error("Contactaanvraag verzenden mislukt.");
      }

      setFormValues(initialFormValues);
      setToastMessage("Bericht verzonden! Je hoort snel van ons.");
      setIsToastVisible(false);
      window.requestAnimationFrame(() => setIsToastVisible(true));
    } catch {
      setToastMessage("Verzenden mislukt. Probeer het opnieuw.");
      setIsToastVisible(false);
      window.requestAnimationFrame(() => setIsToastVisible(true));
    } finally {
      setIsSubmitting(false);
    }
  };

  const titleClassName = useLightTheme
    ? "font-[var(--font-catamaran)] text-[36px] font-medium leading-[110%] text-[#1D0A00] md:text-[50px] xl:text-[64px]"
    : "font-[var(--font-catamaran)] text-[36px] font-medium leading-[110%] text-white md:text-[50px] xl:text-[64px]";

  const descriptionClassName = useLightTheme
    ? "mt-4 max-w-lg text-base font-normal leading-relaxed text-black/70"
    : "mt-4 max-w-lg text-base font-normal leading-relaxed text-white/90";

  const labelClassName = useLightTheme
    ? "text-sm font-normal text-[#1D0A00]"
    : "text-sm font-normal text-white";

  const fieldClassName = useLightTheme
    ? "h-12 rounded-xl border border-[#DDDDDD] bg-white px-4 text-base font-normal text-[#1D0A00] placeholder:text-black/50 outline-none transition-colors focus:border-[#BD0265]"
    : inputClassName;

  const textAreaClassName = useLightTheme
    ? "rounded-xl border border-[#DDDDDD] bg-white px-4 py-3 text-base font-normal text-[#1D0A00] placeholder:text-black/50 outline-none transition-colors focus:border-[#BD0265]"
    : "rounded-xl border border-white/60 bg-white/10 px-4 py-3 text-base font-normal text-white placeholder:text-white/70 outline-none transition-colors focus:border-white";

  const submitButtonClassName = useLightTheme
    ? "inline-flex h-12 cursor-pointer items-center gap-2 rounded-full border-2 border-[#BD0265] bg-[#BD0265] px-6 text-base font-semibold text-white transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#A00256] hover:bg-[#A00256]"
    : "inline-flex h-12 cursor-pointer items-center gap-2 rounded-full border border-white/60 bg-white/10 px-6 text-base font-normal text-white transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/20";

  return (
    <SectionContainer
      className="bg-[#F8F9F9]"
      contentClassName="pb-[80px] pt-[80px] md:pb-[80px] md:pt-[80px]"
    >
      <section
        id="contact"
        className={`relative w-full overflow-hidden p-8 md:p-12 ${
          useLightTheme ? "bg-white shadow-[0_8px_20px_rgba(15,23,42,0.08)]" : ""
        } ${
          useRoundedContainer ? "rounded-[24px]" : ""
        }`}
        style={
          useLightTheme
            ? undefined
            : {
                backgroundImage: `url(${contactBackground.src})`,
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover",
              }
        }
      >
        <div className="grid w-full gap-10 lg:grid-cols-2">
          <div className="flex h-full flex-col justify-center lg:pl-6">
            <h2 className={titleClassName}>
              Kom in contact
            </h2>
            <p className={descriptionClassName}>
              Heb je een vraag, wil je input geven of ben je benieuwd wat wij
              <br />
              voor jou kunnen betekenen? Neem contact met ons op!
            </p>
            <Image
              src={contactImage}
              alt="CoachScribe team"
              className="mt-6 h-auto w-full max-w-[320px] rounded-xl object-cover md:max-w-[380px] xl:max-w-[420px]"
            />
          </div>
          <form className="flex w-full flex-col gap-4 lg:pr-6" onSubmit={handleSubmit}>
            <label className="flex w-full flex-col gap-2">
              <span className={labelClassName}>Volledige naam*</span>
              <input
                type="text"
                name="name"
                required
                value={formValues.name}
                onChange={(event) =>
                  setFormValues((previousValues) => ({
                    ...previousValues,
                    name: event.target.value,
                  }))
                }
                placeholder="Jouw volledige naam"
                className={fieldClassName}
              />
            </label>
            <label className="flex w-full flex-col gap-2">
              <span className={labelClassName}>Email*</span>
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
                placeholder="Jouw Email adres"
                className={fieldClassName}
              />
            </label>
            <label className="flex w-full flex-col gap-2">
              <span className={labelClassName}>
                Nummer (optioneel)
              </span>
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
                className={fieldClassName}
              />
            </label>
            <label className="flex w-full flex-col gap-2">
              <span className={labelClassName}>Bericht*</span>
              <textarea
                name="message"
                rows={5}
                required
                value={formValues.message}
                onChange={(event) =>
                  setFormValues((previousValues) => ({
                    ...previousValues,
                    message: event.target.value,
                  }))
                }
                placeholder="Laat ons weten wat je denkt..."
                className={textAreaClassName}
              />
            </label>
            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className={submitButtonClassName}
              >
                {isSubmitting ? (
                  <span
                    aria-label="Versturen"
                    className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  />
                ) : (
                  <>
                    <span>Verstuur</span>
                    <span aria-hidden="true">-&gt;</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>
      <BottomToast
        isVisible={isToastVisible}
        message={toastMessage}
      />
    </SectionContainer>
  );
}
