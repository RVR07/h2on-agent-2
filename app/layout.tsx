import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "H2On Agent Vocal",
  description: "Asistent vocal AI pentru clienții H2On — facturi, comenzi, produse",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro" className="h-full">
      <body className={`${geist.className} h-full antialiased`}>{children}</body>
    </html>
  );
}
