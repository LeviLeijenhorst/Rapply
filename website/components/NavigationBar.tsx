"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Button from "@/components/Button";
import logo from "@/home/logo.png";

const navigationLinks = [
  { label: "Product", destination: "/product" },
  { label: "Doelgroep", destination: "/coaches" },
  { label: "Veiligheid", destination: "/veiligheid" },
  { label: "Over Ons", destination: "/over-ons" },
];
const NAV_EXPAND_SCROLL_THRESHOLD = 48;
const NAV_EXPAND_ANIMATION_MS = 450;
const NAV_RADIUS_ANIMATION_MS = 180;

export default function NavigationBar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const useSoftBackground =
    pathname === "/contact" ||
    pathname.startsWith("/contact/") ||
    pathname === "/wachtlijst" ||
    pathname.startsWith("/wachtlijst/");
  const isActiveDestination = (destination: string) =>
    pathname === destination || pathname.startsWith(`${destination}/`);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > NAV_EXPAND_SCROLL_THRESHOLD);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed left-0 top-0 z-50 w-full font-inter ${
        useSoftBackground ? "bg-[#F8F9F9]" : "bg-white"
      }`}
    >
      {/* Navigation bar container */}
      <div
        className={`relative mx-auto w-full max-w-full px-0 pb-0 pt-0 transition-all ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isScrolled ? "xl:px-0 xl:pb-0 xl:pt-0" : "xl:px-20 xl:pb-8 xl:pt-8"
        }`}
        style={{ transitionDuration: `${NAV_EXPAND_ANIMATION_MS}ms` }}
      >
        {/* Navigation bar surface */}
        <div
          className={`relative flex h-20 w-full items-center justify-between gap-6 rounded-[0px] bg-white px-4 shadow-[0_8px_24px_rgba(0,0,0,0.14)] xl:px-10 ${
            isScrolled
              ? "xl:rounded-[0px] xl:bg-white xl:px-10 xl:shadow-[0_8px_24px_rgba(0,0,0,0.14)]"
              : "xl:rounded-[40px] xl:bg-white xl:px-8 xl:shadow-[0_4px_16px_rgba(0,0,0,0.18)]"
          }`}
          style={{
            transitionProperty:
              "border-radius, padding-left, padding-right, background-color, box-shadow",
            transitionDuration: `${NAV_RADIUS_ANIMATION_MS}ms, ${NAV_EXPAND_ANIMATION_MS}ms, ${NAV_EXPAND_ANIMATION_MS}ms, ${NAV_EXPAND_ANIMATION_MS}ms, ${NAV_EXPAND_ANIMATION_MS}ms`,
            transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
            transitionDelay: "0ms, 0ms, 0ms, 0ms, 0ms",
          }}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src={logo}
              alt="CoachScribe logo"
              width={261}
              height={132}
              className="-translate-x-[50px] translate-y-[28px] h-[132px] w-[261px] object-contain"
              priority
            />
          </Link>
          {/* Navigation links */}
          <nav className="hidden items-center gap-10 text-[16px] font-medium text-black xl:absolute xl:left-1/2 xl:flex xl:-translate-x-1/2">
            {navigationLinks.map((navigationLink) => (
              <Link
                key={navigationLink.label}
                href={navigationLink.destination}
                className={`transition-colors hover:text-[#BD0265] ${
                  isActiveDestination(navigationLink.destination)
                    ? "font-medium text-[#BD0265]"
                    : "font-medium text-black"
                }`}
              >
                {navigationLink.label}
              </Link>
            ))}
          </nav>
          {/* Navigation actions */}
          <div className="hidden items-center gap-3 xl:flex">
            <Button
              label="Contact"
              destination="/contact"
              variant="secondary"
              className="font-normal"
            />
            <Button
              label="Probeer het gratis"
              destination="https://app.coachscribe.nl"
              variant="primary"
              className="font-normal"
            />
          </div>
          {/* Mobile menu button */}
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white xl:hidden"
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
        className={`fixed inset-0 z-50 flex justify-end bg-black/40 transition-opacity duration-300 xl:hidden ${
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
                  isActiveDestination(navigationLink.destination)
                    ? "font-normal text-[#BD0265]"
                    : "font-normal text-black"
                }`}
              >
                {navigationLink.label}
              </Link>
            ))}
          </nav>
          {/* Mobile menu actions */}
          <div className="flex flex-col gap-3">
            <div onClick={() => setIsMobileMenuOpen(false)}>
              <Button
                label="Contact"
                destination="/contact"
                variant="secondary"
                className="font-normal"
              />
            </div>
            <div onClick={() => setIsMobileMenuOpen(false)}>
              <Button
                label="Probeer het gratis"
                destination="https://app.coachscribe.nl"
                variant="primary"
                className="font-normal"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}


