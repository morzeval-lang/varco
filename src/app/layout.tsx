import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VARCO",
  description: "Gioco di ruolo testuale a turni nel multiverso, con scene clou in 3D.",
};

export const viewport: Viewport = { themeColor: "#0f0d16", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
