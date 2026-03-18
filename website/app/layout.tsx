import type { Metadata } from "next";
import { Catamaran } from "next/font/google";
import WebsiteAnalyticsTracker from "@/components/WebsiteAnalyticsTracker";
import "./globals.css";

const catamaran = Catamaran({
  variable: "--font-catamaran",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rapply",
  description: "Rapply website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${catamaran.variable} antialiased`}>
        <WebsiteAnalyticsTracker />
        {children}
      </body>
    </html>
  );
}
