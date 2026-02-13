"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Button from "@/components/Button";
import logoIcon from "@/home/coachscribe-logo-icon.svg";
import logoText from "@/home/coachscribe-logo-text.svg";

const navigationLinks = [
  { label: "Product", destination: "/product" },
  { label: "Coaches", destination: "/coaches" },
  { label: "Veiligheid", destination: "/veiligheid" },
  { label: "Over Ons", destination: "/over-ons" },
];

export default function NavigationBar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed left-0 top-0 z-50 w-full font-inter">
      {/* Navigation bar container */}
      <div
        className={`relative mx-auto w-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isScrolled
            ? "max-w-full px-0 pb-0 pt-0"
            : "max-w-6xl px-6 pb-8 pt-8 md:px-10"
        }`}
      >
        {/* Navigation bar top accent */}
        <div
          className={`absolute left-6 right-6 top-0 h-[72px] bg-transparent transition-opacity duration-300 md:left-10 md:right-10 ${
            isScrolled ? "opacity-0" : "opacity-100"
          }`}
        />
        {/* Navigation bar surface */}
        <div
          className={`relative flex w-full items-center justify-between gap-6 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isScrolled
              ? "h-20 rounded-none bg-white/70 px-4 shadow-[0_8px_24px_rgba(0,0,0,0.14)] backdrop-blur-xl md:px-10"
              : "h-20 rounded-full bg-white/75 px-4 shadow-[0_4px_16px_rgba(0,0,0,0.18)] backdrop-blur-xl md:px-8"
          }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            {/* Logo icon */}
            <Image
              src={logoIcon}
              alt="CoachScribe logo icon"
              width={24}
              height={24}
            />
            {/* Logo text */}
            <Image
              src={logoText}
              alt="CoachScribe logo text"
              width={130}
              height={24}
            />
          </Link>
          {/* Navigation links */}
          <nav className="hidden items-center gap-10 text-base font-normal text-black md:flex">
            {navigationLinks.map((navigationLink) => (
              <Link
                key={navigationLink.label}
                href={navigationLink.destination}
                className={`transition-colors hover:text-[#BD0265] ${
                  pathname === navigationLink.destination
                    ? "font-semibold text-black"
                    : "font-normal text-black"
                }`}
              >
                {navigationLink.label}
              </Link>
            ))}
          </nav>
          {/* Navigation actions */}
          <div className="hidden items-center gap-4 lg:flex">
            <Button
              label="Inloggen"
              destination="https://app.coachscribe.nl/inloggen?direct=1"
              variant="secondary"
              className="font-normal"
            />
            <Button
              label="Probeer Gratis"
              destination="https://app.coachscribe.nl/inloggen?mode=signup"
              variant="primary"
              className="font-normal"
            />
          </div>
          {/* Mobile menu button */}
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white md:hidden"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 7H21"
                stroke="#171717"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M9.48999 12H21"
                stroke="#171717"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M3 12H5.99"
                stroke="#171717"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-50 flex justify-end bg-black/40 transition-opacity duration-300 md:hidden ${
          isMobileMenuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setIsMobileMenuOpen(false)}
          className="h-full flex-1"
        />
        {/* Mobile menu panel */}
        <div
          className={`flex h-full w-80 flex-col gap-8 bg-white p-8 transition-transform duration-300 ease-out ${
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Mobile menu header */}
          <div className="flex items-center justify-between">
            {/* Mobile menu title */}
            <span className="text-lg font-normal text-black">Menu</span>
            {/* Mobile menu close button */}
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex h-10 w-10 items-center justify-center text-black"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M9.16992 14.8299L14.8299 9.16992"
                  stroke="#171717"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14.8299 14.8299L9.16992 9.16992"
                  stroke="#171717"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z"
                  stroke="#171717"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          {/* Mobile menu links */}
          <nav className="flex flex-col gap-6 text-base font-normal text-black">
            {navigationLinks.map((navigationLink) => (
              <Link
                key={navigationLink.label}
                href={navigationLink.destination}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`transition-colors hover:text-[#BD0265] ${
                  pathname === navigationLink.destination
                    ? "font-semibold text-black"
                    : "font-normal text-black"
                }`}
              >
                {navigationLink.label}
              </Link>
            ))}
          </nav>
          {/* Mobile menu actions */}
          <div className="flex flex-col gap-4">
            <Button
              label="Inloggen"
              destination="https://app.coachscribe.nl/inloggen?direct=1"
              variant="secondary"
              className="font-normal"
            />
            <Button
              label="Probeer Gratis"
              destination="https://app.coachscribe.nl/inloggen?mode=signup"
              variant="primary"
              className="font-normal"
            />
          </div>
        </div>
      </div>
    </header>
  );
}

