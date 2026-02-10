import type { Metadata } from "next";
import { Catamaran } from "next/font/google";
import "./globals.css";

const catamaran = Catamaran({
  variable: "--font-catamaran",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CoachScribe",
  description: "CoachScribe website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${catamaran.variable} antialiased`}>{children}</body>
    </html>
  );
}
