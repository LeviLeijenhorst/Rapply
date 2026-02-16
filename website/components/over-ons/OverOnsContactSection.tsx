"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import SectionContainer from "@/components/home/SectionContainer";
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

export default function OverOnsContactSection() {
  const [formValues, setFormValues] = useState<ContactFormValues>(initialFormValues);
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
    <SectionContainer
      className="bg-[#F8F9F9]"
      contentClassName="pb-[80px] pt-[80px] md:pb-[80px] md:pt-[80px]"
    >
      <section
        id="contact"
        className="relative w-full overflow-hidden rounded-[24px] bg-cover bg-center bg-no-repeat p-8 text-white md:p-12"
        style={{
          backgroundImage: `url(${contactBackground.src})`,
        }}
      >
        <div className="grid w-full gap-10 lg:grid-cols-2">
          <div className="flex h-full flex-col justify-center lg:pl-6">
            <h2 className="font-[var(--font-catamaran)] text-[64px] font-medium leading-[110%] text-white">
              Kom in contact
            </h2>
            <p className="mt-4 max-w-lg text-base font-normal leading-relaxed text-white/90">
              Heb je een vraag, wil je input geven of ben je benieuwd wat wij
              <br />
              voor jou kunnen betekenen? Neem contact met ons op!
            </p>
            <Image
              src={contactImage}
              alt="CoachScribe team"
              className="mt-6 h-auto w-full max-w-[420px] rounded-xl object-cover"
            />
          </div>
          <form className="flex w-full flex-col gap-4 lg:pr-6" onSubmit={handleSubmit}>
            <label className="flex w-full flex-col gap-2">
              <span className="text-sm font-normal text-white">Volledige naam*</span>
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
                className={inputClassName}
              />
            </label>
            <label className="flex w-full flex-col gap-2">
              <span className="text-sm font-normal text-white">Email*</span>
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
                className={inputClassName}
              />
            </label>
            <label className="flex w-full flex-col gap-2">
              <span className="text-sm font-normal text-white">
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
                placeholder="Jouw telefoon nummer"
                className={inputClassName}
              />
            </label>
            <label className="flex w-full flex-col gap-2">
              <span className="text-sm font-normal text-white">Bericht*</span>
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
                className="rounded-xl border border-white/60 bg-white/10 px-4 py-3 text-base font-normal text-white placeholder:text-white/70 outline-none transition-colors focus:border-white"
              />
            </label>
            <div className="pt-1">
              <button
                type="submit"
                className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full border border-white/60 bg-white/10 px-6 text-base font-normal text-white transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/20"
              >
                <span>Verstuur</span>
                <span aria-hidden="true">-&gt;</span>
              </button>
            </div>
          </form>
        </div>
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
