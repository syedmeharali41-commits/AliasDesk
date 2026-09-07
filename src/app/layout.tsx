import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const grotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const jbmono = JetBrains_Mono({
  variable: "--font-jbmono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AliasDesk",
  description:
    "Premium Cloudflare Email Routing alias manager. Manage aliases, destinations, catch-all rules and DNS with a god-tier dark interface.",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-accent="gold" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${grotesk.variable} ${jbmono.variable} antialiased min-h-screen`}
      >
        <div className="obsidian-canvas" aria-hidden="true" />
        <div className="obsidian-grid" aria-hidden="true" />
        <div className="obsidian-noise" aria-hidden="true" />
        <div className="relative z-10">{children}</div>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#0c0c0d",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#f7f7f2",
            },
          }}
        />
      </body>
    </html>
  );
}
