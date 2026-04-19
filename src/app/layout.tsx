import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Protein-to-Calorie Ratio Calculator",
  description:
    "Instantly calculate how protein-dense any food is. See protein per 100 calories, protein calorie percentage, and get a quality rating.",
  keywords: ["protein calculator", "protein density", "calorie ratio", "nutrition calculator", "diet tool"],
  openGraph: {
    title: "Protein-to-Calorie Ratio Calculator",
    description: "Find out how protein-dense your food really is.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
