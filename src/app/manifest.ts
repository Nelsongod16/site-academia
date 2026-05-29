import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pulse Studio",
    short_name: "Pulse",
    description: "App minimalista para rotina de treino, corrida, natacao e evolucao fisica.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#06070a",
    theme_color: "#06070a",
    icons: [
      { src: "/icons/pulse-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/pulse-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/pulse-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
