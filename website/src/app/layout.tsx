import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coachscribe",
  description: "Turn coaching conversations into clear notes and action items.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Catamaran:wght@400;500;700&family=Inter:wght@400;500;700&family=Sansita+Swashed:wght@400;600&display=swap"
        />
      </head>
      <body>
        <a className="skipLink" href="#main">
          Naar inhoud
        </a>
        {children}
      </body>
    </html>
  );
}
