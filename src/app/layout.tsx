import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TopNav from "@/components/TopNav";
import MobileBottomNav from "@/components/MobileBottomNav";
import FloatingAiBot from "@/components/FloatingAiBot";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AMAZINS",
  description: "AMAZINS management by AMAZINS",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-black text-white antialiased">
  <div className="hidden md:block">
    <TopNav />
  </div>
  {children}
  <MobileBottomNav />
  <FloatingAiBot />
</body>
    </html>
  );
}
