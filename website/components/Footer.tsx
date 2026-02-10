import Image from "next/image";
import Link from "next/link";
import logoIcon from "@/home/coachscribe-logo-icon.svg";
import logoText from "@/home/coachscribe-logo-text.svg";
import linkedinIcon from "@/home/LinkedIn.svg";
import tiktokIcon from "@/home/TikTok.svg";
import facebookIcon from "@/home/Facebook.svg";
import instagramIcon from "@/home/Instagram.svg";

const navigationLinks = [
  { label: "Product", destination: "/product" },
  { label: "Coaches", destination: "/coaches" },
  { label: "Veiligheid", destination: "/veiligheid" },
  { label: "Over Ons", destination: "/over-ons" },
  { label: "Prijzen", destination: "/prijzen" },
  { label: "Inloggen", destination: "https://app.coachscribe.nl" },
  { label: "Probeer Gratis", destination: "https://app.coachscribe.nl" },
];

const socialLinks = [
  {
    label: "LinkedIn",
    destination: "https://www.linkedin.com",
    icon: linkedinIcon,
  },
  {
    label: "TikTok",
    destination: "https://www.tiktok.com",
    icon: tiktokIcon,
  },
  {
    label: "Facebook",
    destination: "https://www.facebook.com",
    icon: facebookIcon,
  },
  {
    label: "Instagram",
    destination: "https://www.instagram.com",
    icon: instagramIcon,
  },
];

export default function Footer() {
  return (
    <footer className="w-full bg-[linear-gradient(135deg,rgba(169,217,243,0.5)_0%,rgba(237,194,217,0.5)_100%)] font-inter text-black">
      {/* Footer container */}
      <div className="mx-auto w-full max-w-6xl p-8">
        {/* Footer content */}
        <div className="grid w-full grid-cols-1 gap-12 lg:grid-cols-[1fr_auto] lg:gap-10">
          {/* Footer brand */}
          <div className="flex w-full flex-col gap-6">
            {/* Brand logo */}
            <div className="flex items-center gap-3">
              {/* Brand logo icon */}
              <Image
                src={logoIcon}
                alt="CoachScribe logo icon"
                width={28}
                height={28}
              />
              {/* Brand logo text */}
              <Image
                src={logoText}
                alt="CoachScribe logo text"
                width={150}
                height={28}
              />
            </div>
            {/* Brand description */}
            <p className="text-sm font-normal leading-relaxed">
              CoachScribe neemt sessies op van coaches en zet deze om in
              praktische verslagen die aansluiten op de behoefte van de coach.
            </p>
            {/* Brand contact */}
            <a
              href="mailto:contact@coachscribe.nl"
              className="text-sm font-semibold"
            >
              contact@coachscribe.nl
            </a>
          </div>
          <div className="flex w-full flex-col gap-12 lg:flex-row-reverse lg:justify-self-end lg:gap-16">
            {/* Footer social */}
            <div className="flex w-full flex-col gap-4 lg:items-end">
              {/* Social title */}
              <h2 className="text-base font-semibold">Connect</h2>
              {/* Social links */}
              <div className="flex flex-col gap-3 text-sm font-normal lg:items-end">
                {socialLinks.map((socialLink) => (
                  <a
                    key={socialLink.label}
                    href={socialLink.destination}
                    className="flex w-fit items-center gap-3 transition-colors hover:text-[#BD0265] lg:flex-row-reverse"
                    rel="noreferrer"
                    target="_blank"
                  >
                    {/* Social icon */}
                    <Image
                      src={socialLink.icon}
                      alt={`${socialLink.label} icon`}
                      width={22}
                      height={22}
                      className="h-[22px] w-[22px] object-contain"
                    />
                    {/* Social label */}
                    <span>{socialLink.label}</span>
                  </a>
                ))}
              </div>
            </div>
            {/* Footer navigation */}
            <div className="flex w-full flex-col gap-4 lg:items-end">
              {/* Navigation title */}
              <h2 className="text-base font-semibold">Navigatie</h2>
              {/* Navigation links */}
              <nav className="flex flex-col gap-2 text-sm font-normal lg:items-end">
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
        </div>
        {/* Footer legal */}
        <div className="mt-12 flex w-full flex-col gap-4 text-sm font-normal text-black lg:flex-row lg:items-center lg:justify-between">
          {/* Copyright */}
          <span>Copyright (c) 2026 CoachScribe. Alle rechten voorbehouden.</span>
          {/* Legal links */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
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
            <Link
              href="/verwerkersovereenkomst"
              className="basis-full w-fit underline transition-colors hover:text-[#BD0265] sm:basis-auto"
            >
              Verwerkersovereenkomst
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

