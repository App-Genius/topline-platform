import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import DemoNav from "@/components/DemoNav";
import CelebrationOverlay from "@/components/CelebrationOverlay";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Topline - Business Optimization",
  description: "Lead measures to Lag measures",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased min-h-screen`}>
        <AppProvider>
          {children}
          <CelebrationOverlay />
          <DemoNav />
        </AppProvider>
      </body>
    </html>
  );
}
