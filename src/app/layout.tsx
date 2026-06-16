import type { Metadata } from "next";
import { Inter, Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import SceneGate from "@/components/scene/SceneGate";
import { SITE_URL } from "@/lib/seo";

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

export const metadata: Metadata = {
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
  metadataBase: new URL(SITE_URL),
  title: "Odisha Event Alert | Events, Concerts, Fests & Workshops in Odisha",
  description:
    "Discover verified events in Odisha including concerts, college fests, workshops, expos, comedy shows, DJ nights, cultural events, offers and new openings across Bhubaneswar, Cuttack, Puri, Rourkela, Sambalpur and Berhampur.",
  applicationName: "Odisha Event Alert",
  keywords:
    "Odisha Events, Events in Bhubaneswar, Events in Cuttack, Concerts in Odisha, College Fests Odisha, Workshops Bhubaneswar, Comedy Shows Cuttack, DJ Nights Odisha, Cultural Events Odisha, New Openings Bhubaneswar, Offers in Odisha, Puri Events, Rourkela Events, Sambalpur Events, Berhampur Events",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Odisha Event Alert | Events, Concerts, Fests & Workshops in Odisha",
    description:
      "Discover verified events in Odisha — concerts, college fests, workshops, expos, comedy shows, DJ nights, cultural events, offers and new openings across Bhubaneswar, Cuttack, Puri, Rourkela, Sambalpur and Berhampur.",
    url: SITE_URL,
    siteName: "Odisha Event Alert",
    images: [
      {
        url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop",
        width: 1200,
        height: 630,
        alt: "Odisha Event Alert — events across Odisha",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Odisha Event Alert | Events, Concerts, Fests & Workshops in Odisha",
    description:
      "Discover verified events in Odisha — concerts, fests, workshops, comedy, DJ nights, cultural events, offers and new openings across Bhubaneswar, Cuttack, Puri, Rourkela, Sambalpur and Berhampur.",
    images: [
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop",
    ],
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
