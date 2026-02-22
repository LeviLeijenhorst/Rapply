import Image from "next/image";
import Link from "next/link";
import logo from "@/home/logo.png";
import linkedinIcon from "@/home/LinkedIn.svg";
import instagramIcon from "@/home/Instagram.svg";

const navigationLinks = [
  { label: "Product", destination: "/product" },
  { label: "Doelgroep", destination: "/coaches" },
  { label: "Veiligheid", destination: "/veiligheid" },
  { label: "Over Ons", destination: "/over-ons" },
  { label: "Contact", destination: "/contact" },
  { label: "Probeer het uit", destination: "https://app.coachscribe.nl" },
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
    <footer className="w-full bg-[linear-gradient(110deg,rgba(184,212,255,0.45)_0%,rgba(198,175,255,0.25)_55%,rgba(255,224,236,0.45)_100%)] text-[#1D0A00]">
      {/* Footer container */}
      <div className="mx-auto w-full max-w-6xl px-8 pb-8 pt-20">
        {/* Footer content */}
        <div className="grid w-full grid-cols-2 gap-x-8 gap-y-14 md:gap-x-16 lg:grid-cols-[max-content_max-content_max-content] lg:items-start lg:justify-between lg:gap-0">
          {/* Footer brand */}
          <div className="col-span-2 flex w-full max-w-[430px] flex-col lg:col-span-1 lg:w-fit lg:max-w-none">
            <div className="flex flex-col gap-6">
              {/* Brand logo */}
              <div className="-mb-[108px] flex items-center">
                <Image
                  src={logo}
                  alt="CoachScribe logo"
                  width={261}
                  height={132}
                  className="-translate-x-[53px] -translate-y-[20px] h-[132px] w-[261px] object-contain"
                />
              </div>
              {/* Brand description */}
              <p className="text-[16px] font-medium leading-relaxed">
                CoachScribe neemt sessies op van coaches
                <br />
                en zet deze om in praktische verslagen die
                <br />
                aansluiten op de behoefte van de coach.
              </p>
            </div>
            {/* Brand contact */}
            <a
              href="mailto:contact@coachscribe.nl"
              className="mt-8 text-[16px] font-medium"
            >
              contact@coachscribe.nl
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
          <span>Copyright Â© 2026 CoachScribe. Alle rechten voorbehouden.</span>
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


