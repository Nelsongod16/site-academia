import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pulse Studio",
    short_name: "Pulse",
    description: "App minimalista para rotina de treino, corrida, natacao e evolucao fisica.",
    start_url: "/",
    display: "standalone",
    background_color: "#06070a",
    theme_color: "#06070a",
    orientation: "portrait",
    icons: [
      { src: "/icon?size=192", sizes: "192x192", type: "image/png" },
      { src: "/icon?size=512", sizes: "512x512", type: "image/png" },
      { src: "/icon?size=512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
