import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "H2On Agent Vocal",
  description: "Asistent vocal AI H2On",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body className={geist.className} style={{ background: "transparent" }}>
        {children}
      </body>
    </html>
  );
}
