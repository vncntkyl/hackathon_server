import type { Metadata, Viewport } from "next";
import { Barlow } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

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
      <body className="font-sans">
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
