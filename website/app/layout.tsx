import type { Metadata } from "next";
import WebsiteAnalyticsTracker from "@/components/WebsiteAnalyticsTracker";
import "./globals.css";

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
      <body className="antialiased">
        <WebsiteAnalyticsTracker />
        {children}
      </body>
    </html>
  );
}
