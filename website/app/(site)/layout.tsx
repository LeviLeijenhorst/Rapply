"use client";

import { usePathname } from "next/navigation";
import NavigationBar from "@/components/NavigationBar";
import Footer from "@/components/Footer";
import PageEnterTransition from "@/components/PageEnterTransition";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isPricingPath =
    pathname === "/pricing" || pathname.startsWith("/pricing/");

  return (
    <div
      className={`flex min-h-screen w-full flex-col ${
        isPricingPath
          ? "bg-[linear-gradient(to_top_right,rgba(184,212,255,0.25)_0%,rgba(198,175,255,0.25)_100%)]"
          : "bg-white"
      }`}
    >
      {/* Navigation bar */}
      <NavigationBar />
      {/* Page content */}
      <main className={`mt-36 flex w-full flex-1 flex-col ${isPricingPath ? "bg-transparent" : "bg-white"}`}>
        <PageEnterTransition>{children}</PageEnterTransition>
      </main>
      {/* Footer */}
      <Footer />
    </div>
  );
}
