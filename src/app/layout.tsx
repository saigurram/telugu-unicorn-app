import type { Metadata, Viewport } from "next";
import { Fredoka, Noto_Sans_Telugu } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoTelugu = Noto_Sans_Telugu({
  variable: "--font-noto-telugu",
  subsets: ["telugu"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "మిల యునికార్న్ — Mila the Unicorn",
  description: "Daily Telugu speaking practice with Mila the magical unicorn.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffe9f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="te" className={`${fredoka.variable} ${notoTelugu.variable} h-full`}>
      <body className="min-h-full flex flex-col overflow-x-hidden text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
