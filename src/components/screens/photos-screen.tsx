"use client";

import { format } from "date-fns";
import { Camera, Expand, Upload, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { useStore } from "zustand";

import { PageFrame } from "@/components/layout/page-frame";
import { Button, SectionHeading, StrongSurface, Surface } from "@/components/ui/kit";
import { compressImage } from "@/lib/media";
import { useAppStore } from "@/store/app-store";

export function PhotosScreen() {
  const photos = useStore(useAppStore, (state) => state.photos);
  const addPhotoEntries = useStore(useAppStore, (state) => state.addPhotoEntries);
  const [preview, setPreview] = useState<string | null>(null);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const sortedPhotos = useMemo(() => [...photos].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)), [photos]);

  async function handleUpload(files: FileList | null) {
    if (!files) {
      return;
    }

    const images = Array.from(files).filter((file) => file.type.startsWith("image/"));
    const videos = Array.from(files).filter((file) => file.type.startsWith("video/"));

    if (images.length) {
      const prepared = await Promise.all(
        images.map(async (file) => ({
          image: await compressImage(file),
          label: file.name.replace(/\.[^.]+$/, ""),
          kind: "progress" as const,
          note: "Upload comprimido no aparelho.",
        })),
      );

      addPhotoEntries(prepared);
    }

    if (videos.length) {
      setVideoPreviews((current) => [...videos.map((file) => URL.createObjectURL(file)), ...current].slice(0, 6));
    }
  }

  const [before, after] = sortedPhotos;

  return (
    <PageFrame>
      <StrongSurface className="rounded-[30px]">
        <SectionHeading eyebrow="evolucao fisica" title="Fotos e comparacao" />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[before, after].filter(Boolean).map((item) => (
            <div key={item!.id} className="overflow-hidden rounded-[22px] border border-white/8 bg-white/4">
              <img src={item!.image} alt={item!.label} className="h-56 w-full object-cover" />
              <div className="p-4">
                <p className="text-sm font-medium">{item!.label}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{format(new Date(item!.createdAt), "dd/MM/yyyy")}</p>
              </div>
            </div>
          ))}
        </div>
      </StrongSurface>

      <Surface className="rounded-[28px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Upload rapido</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Compressao de imagens no aparelho e preview de video.</p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-[16px] bg-[var(--accent)] px-4 py-3 text-sm font-medium text-black">
            <Upload className="size-4" />
            Selecionar
            <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={(event) => void handleUpload(event.target.files)} />
          </label>
        </div>
      </Surface>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {sortedPhotos.map((photo) => (
          <button key={photo.id} onClick={() => setPreview(photo.image)} className="group overflow-hidden rounded-[22px] border border-white/8 bg-white/4 text-left">
            <img src={photo.image} alt={photo.label} className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.03]" loading="lazy" />
            <div className="flex items-center justify-between px-3 py-3">
              <div>
                <p className="text-sm font-medium">{photo.label}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">{photo.kind}</p>
              </div>
              <Expand className="size-4 text-[var(--muted)]" />
            </div>
          </button>
        ))}
      </div>

      {videoPreviews.length ? (
        <Surface className="rounded-[28px]">
          <div className="flex items-center gap-2">
            <Video className="size-4 text-[var(--sky)]" />
            <p className="text-sm font-medium">Videos enviados</p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {videoPreviews.map((src) => (
              <video key={src} src={src} controls className="h-48 w-full rounded-[20px] object-cover" />
            ))}
          </div>
        </Surface>
      ) : null}

      {preview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setPreview(null)}>
          <img src={preview} alt="preview" className="max-h-full max-w-full rounded-[24px] object-contain" />
        </div>
      ) : null}

      <Surface className="flex items-center gap-3 rounded-[22px]">
        <Camera className="size-4 text-[var(--accent)]" />
        <p className="text-sm text-[var(--muted)]">Grid compacto com lazy loading, fullscreen e ordenacao por data.</p>
      </Surface>
    </PageFrame>
  );
}
