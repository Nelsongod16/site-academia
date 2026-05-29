import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import React from "react";
import { ImageResponse } from "next/og.js";

const repoRoot = path.resolve(import.meta.dirname, "..");
const iconDir = path.join(repoRoot, "public", "icons");

const baseStyle = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "radial-gradient(circle at top, rgba(156,255,121,0.28), transparent 35%), linear-gradient(180deg, #0b0e14 0%, #050608 100%)",
  color: "white",
  fontWeight: 700,
  letterSpacing: "-0.12em",
};

function createIcon(fontSize) {
  return React.createElement(
    "div",
    {
      style: {
        ...baseStyle,
        fontSize,
      },
    },
    "P",
  );
}

async function renderPng(fileName, size, fontSize) {
  const image = new ImageResponse(createIcon(fontSize), {
    width: size,
    height: size,
  });

  const arrayBuffer = await image.arrayBuffer();
  await writeFile(path.join(iconDir, fileName), Buffer.from(arrayBuffer));
}

await mkdir(iconDir, { recursive: true });

await Promise.all([
  renderPng("pulse-192.png", 192, 84),
  renderPng("pulse-512.png", 512, 220),
  renderPng("pulse-512-maskable.png", 512, 220),
  renderPng("apple-touch-icon.png", 180, 80),
]);
