import type { Metadata, Viewport } from "next";
import { GeistMono, GeistSans } from "geist/font";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Pulse Studio",
  description: "Rotina de treino, corrida, natacao e evolucao fisica em uma interface premium e minimalista.",
  applicationName: "Pulse Studio",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pulse Studio",
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
      <body>{children}</body>
    </html>
  );
}
