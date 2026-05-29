import type { Metadata, Viewport } from "next";
import { GeistMono, GeistSans } from "geist/font";

import "@/app/globals.css";
import { BrowserRepair } from "@/components/system/browser-repair";

export const metadata: Metadata = {
  title: "Pulse Studio",
  description: "Rotina de treino, corrida, natacao e evolucao fisica em uma interface premium e minimalista.",
  applicationName: "Pulse Studio",
  icons: {
    icon: [
      { url: "/icons/pulse-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/pulse-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/icons/pulse-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#06070a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <BrowserRepair />
        {children}
      </body>
    </html>
  );
}
