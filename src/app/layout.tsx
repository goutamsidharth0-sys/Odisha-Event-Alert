import type { Metadata } from "next";
import { Inter, Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import SceneGate from "@/components/scene/SceneGate";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const SITE_URL = "https://www.odishaeventalert.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Odisha Event Alert — Odisha's Live Event Radar",
  description:
    "Discover verified events, workshops, expos, openings, offers, concerts, classes and community activities across Odisha (Bhubaneswar, Cuttack, Puri, Rourkela).",
  keywords:
    "Odisha Events, Bhubaneswar Events, Concerts in Cuttack, Open Mic Bhubaneswar, Jamming Sessions Odisha, New Openings Bhubaneswar, College Fests, Comedy Shows Cuttack",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Odisha Event Alert — Odisha's Live Event Radar",
    description:
      "Discover verified events, workshops, openings, offers, concerts and community activities near you — reviewed before they go live.",
    url: SITE_URL,
    siteName: "Odisha Event Alert",
    images: [
      {
        url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${spaceMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans selection:bg-brand-accent selection:text-white">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SceneGate />
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
