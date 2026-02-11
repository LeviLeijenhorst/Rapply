import Image from "next/image";
import SectionContainer from "@/components/home/SectionContainer";
import contactImage from "@/over_ons/over_ons-beiden.png";
import contactBackground from "@/over_ons/kom_in_contact-background.svg";

const inputClassName =
  "h-12 rounded-xl border border-white/60 bg-white/10 px-4 text-base font-normal text-white placeholder:text-white/70 outline-none transition-colors focus:border-white";

export default function OverOnsContactSection() {
  return (
    <SectionContainer className="bg-[#F8F9F9]" contentClassName="pt-4 md:pt-6">
      <section
        id="contact"
        className="w-full overflow-hidden rounded-[24px] bg-cover bg-center bg-no-repeat p-8 text-white md:p-12"
        style={{
          backgroundImage: `url(${contactBackground.src})`,
        }}
      >
        <div className="grid w-full gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <h2 className="text-5xl font-semibold leading-tight md:text-6xl">
              Kom in contact
            </h2>
            <p className="max-w-lg text-base font-normal leading-relaxed text-white/90">
              Heb je een vraag, wil je input geven of ben je benieuwd wat wij
              voor jou kunnen betekenen? Neem contact met ons op!
            </p>
            <Image
              src={contactImage}
              alt="CoachScribe team"
              className="h-auto w-full max-w-[420px] rounded-xl object-cover"
            />
          </div>
          <form className="flex w-full flex-col gap-4" action="#">
            <label className="flex w-full flex-col gap-2">
              <span className="text-sm font-normal text-white">Volledige naam*</span>
              <input
                type="text"
                name="name"
                placeholder="Jouw volledige naam"
                className={inputClassName}
              />
            </label>
            <label className="flex w-full flex-col gap-2">
              <span className="text-sm font-normal text-white">Email*</span>
              <input
                type="email"
                name="email"
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
                placeholder="Jouw telefoon nummer"
                className={inputClassName}
              />
            </label>
            <label className="flex w-full flex-col gap-2">
              <span className="text-sm font-normal text-white">Bericht*</span>
              <textarea
                name="message"
                rows={5}
                placeholder="Laat ons weten wat je denkt..."
                className="rounded-xl border border-white/60 bg-white/10 px-4 py-3 text-base font-normal text-white placeholder:text-white/70 outline-none transition-colors focus:border-white"
              />
            </label>
            <div className="pt-1">
              <button
                type="submit"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white/60 bg-white/10 px-6 text-base font-normal text-white transition-colors hover:border-white hover:bg-white/20"
              >
                <span>Verstuur</span>
                <span aria-hidden="true">-&gt;</span>
              </button>
            </div>
          </form>
        </div>
      </section>
    </SectionContainer>
  );
}
