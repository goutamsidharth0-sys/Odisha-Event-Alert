import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Odisha Event Alert — Your Odisha Event Radar",
  description: "Find upcoming live concerts, fests, stand-up comedy shows, workshops, startup meets, offers and activities across Odisha (Bhubaneswar, Cuttack, Puri, Rourkela).",
  keywords: "Odisha Events, Bhubaneswar Events, Concerts in Cuttack, Puri Beach Yoga, College Fests Bhubaneswar, Comedy Shows Cuttack",
  openGraph: {
    title: "Odisha Event Alert — Your Odisha Event Radar",
    description: "Discover what's happening across Odisha. Find concerts, fests, workshops, and startup meets in Bhubaneswar, Cuttack, Puri, and more.",
    url: "https://odishaeventalert.com",
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
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-brand-accent selection:text-white transition-colors duration-300">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Glowing Background Radials */}
          <div className="glow-bg-accent top-[-100px] left-[-100px]"></div>
          <div className="glow-bg-accent top-[800px] right-[-100px] opacity-30"></div>
          
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
