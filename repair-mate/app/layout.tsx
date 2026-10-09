import type { Metadata, Viewport } from "next";
import { Barlow } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { DirectorySync } from "@/components/directory-sync";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-barlow",
});

export const metadata: Metadata = {
  title: "repAIrMate · Find a trusted Blue Collar Professional",
  description:
    "Homeowners describe repair requests. Blue-collar professionals register and get found.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={barlow.variable}>
      <body className="flex min-h-screen flex-col font-sans">
        <DirectorySync />
        <Header />
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
