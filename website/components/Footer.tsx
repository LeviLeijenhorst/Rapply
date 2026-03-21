"use client";

import Image from "next/image";
import Link from "next/link";
import BrandWordmark from "@/components/BrandWordmark";
import linkedinIcon from "@/home/LinkedIn.svg";
import instagramIcon from "@/home/Instagram.svg";

const navigationLinks = [
  { label: "Product", destination: "/product" },
  { label: "Doelgroep", destination: "/coaches" },
  { label: "Veiligheid", destination: "/veiligheid" },
  { label: "Over Ons", destination: "/over-ons" },
  { label: "Contact", destination: "/contact" },
  { label: "Maak een afspraak", destination: "https://calendly.com/jonaskroon/new-meeting?month=2026-02" },
];

const connectLinks = [
  {
    label: "LinkedIn",
    destination: "https://www.linkedin.com/company/110146544",
    icon: linkedinIcon,
    iconClassName: "scale-[1.9]",
  },
  {
    label: "Instagram",
    destination: "https://www.instagram.com/coach.scribe/",
    icon: instagramIcon,
    iconClassName: "scale-[1.15]",
  },
];

export default function Footer() {
  return (
    <footer className="w-full text-[#1D0A00] bg-[linear-gradient(110deg,rgba(184,212,255,0.45)_0%,rgba(198,175,255,0.25)_55%,rgba(255,224,236,0.45)_100%)]">
      {/* Footer container */}
      <div className="mx-auto w-full max-w-6xl px-8 pb-8 pt-20">
        {/* Footer content */}
        <div className="grid w-full grid-cols-2 gap-x-8 gap-y-14 md:gap-x-16 lg:grid-cols-[max-content_max-content_max-content] lg:items-start lg:justify-between lg:gap-0">
          {/* Footer brand */}
          <div className="col-span-2 flex w-full max-w-[430px] flex-col lg:col-span-1 lg:w-fit lg:max-w-none">
            <div className="flex flex-col gap-6">
              {/* Brand wordmark */}
              <div className="flex items-center">
                <BrandWordmark />
              </div>
              {/* Brand description */}
              <p className="text-[16px] font-medium leading-relaxed">
                Rapply helpt loopbaan- en
                <br />
                re-integratiecoaches met het automatisch
                <br />
                vastleggen van sessies en het genereren van
                <br />
                professionele verslagen.
              </p>
            </div>
            {/* Brand contact */}
            <a
              href="mailto:contact@rapply.nl"
              className="mt-8 text-[16px] font-medium"
            >
              contact@rapply.nl
            </a>
          </div>
          {/* Footer navigation */}
          <div className="justify-self-start lg:justify-self-auto">
            <div className="flex w-fit flex-col gap-6">
            {/* Navigation title */}
            <h2 className="text-base font-semibold md:text-xl">
              Navigatie
            </h2>
            {/* Navigation links */}
            <nav className="flex flex-col gap-2 text-[16px] font-medium leading-tight">
              {navigationLinks.map((navigationLink) => (
                <Link
                  key={navigationLink.label}
                  href={navigationLink.destination}
                  className="w-fit underline transition-colors hover:text-[#BD0265]"
                >
                  {navigationLink.label}
                </Link>
              ))}
            </nav>
            </div>
          </div>
          {/* Footer connect */}
          <div className="-translate-x-6 justify-self-start lg:translate-x-0 lg:justify-self-auto">
            <div className="flex w-fit flex-col gap-6 lg:-translate-x-[8px]">
            <h2 className="text-base font-semibold md:text-xl">
              Connect
            </h2>
            <div className="flex flex-col gap-2 text-[16px] font-medium leading-tight">
              {connectLinks.map((connectLink) => (
                <a
                  key={connectLink.label}
                  href={connectLink.destination}
                  className="flex w-fit items-center gap-3 transition-colors hover:text-[#BD0265]"
                  rel="noreferrer"
                  target="_blank"
                >
                  <span className="relative h-[22px] w-[22px] overflow-hidden rounded-[5px]">
                    <Image
                      src={connectLink.icon}
                      alt={`${connectLink.label} icon`}
                      fill
                      sizes="22px"
                      className={`object-contain ${connectLink.iconClassName ?? ""}`}
                    />
                  </span>
                  <span>{connectLink.label}</span>
                </a>
              ))}
            </div>
            </div>
          </div>
        </div>
        {/* Footer legal */}
        <div className="mt-40 flex w-full flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[16px] font-medium text-[#2D3B4A]">
          {/* Copyright */}
          <span>Copyright © 2026 Rapply. Alle rechten voorbehouden.</span>
          {/* Legal links */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            <Link
              href="/privacybeleid"
              className="w-fit underline transition-colors hover:text-[#BD0265]"
            >
              Privacybeleid
            </Link>
            <Link
              href="/gebruikersovereenkomst"
              className="w-fit underline transition-colors hover:text-[#BD0265]"
            >
              Gebruikersovereenkomst
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
