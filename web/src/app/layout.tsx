import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { NetworkBanner } from "@/components/NetworkBanner";
import { TxToaster } from "@/components/TxToaster";
import { CONTRACT_ADDRESS, CONTRACT_URL, TARGET_CHAIN } from "@/config/env";
import { shortAddress } from "@/lib/format";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Credit Ledger",
  description:
    "On-chain credits and automatic payment splits for creative works made by humans and AI.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      {/* Browser extensions (e.g. Grammarly) add attributes to <body>; ignore that mismatch. */}
      <body className="flex min-h-full flex-col font-sans" suppressHydrationWarning>
        <Providers>
          <Header />
          <NetworkBanner />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
          <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-500">
            Credit Ledger · built for the AI-Native Creator Economy &amp; Digital Rights track ·{" "}
            <Link href="/demo" className="underline">
              Demo guide
            </Link>
            {CONTRACT_URL && CONTRACT_ADDRESS && (
              <>
                {" "}
                · Contract on {TARGET_CHAIN.name}:{" "}
                <a href={CONTRACT_URL} target="_blank" rel="noreferrer" className="font-mono underline">
                  {shortAddress(CONTRACT_ADDRESS)} ↗
                </a>
              </>
            )}
          </footer>
          <TxToaster />
        </Providers>
      </body>
    </html>
  );
}
