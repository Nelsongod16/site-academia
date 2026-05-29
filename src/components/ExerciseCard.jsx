"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/kit";

export function ExerciseCard({ exercise, onAdd, onOpen, isAdded, disabled }) {
  const [imageSrc, setImageSrc] = useState(exercise.mediaUrl || exercise.imageFallbackUrl);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="group overflow-hidden rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] shadow-[0_18px_48px_rgba(0,0,0,0.24)]"
    >
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#050608] via-[#050608]/24 to-transparent" />
          <img
            src={imageSrc}
            alt={exercise.name}
            loading="lazy"
            onError={() => {
              if (imageSrc !== exercise.imageFallbackUrl) {
                setImageSrc(exercise.imageFallbackUrl);
              }
            }}
            className="h-56 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />

          <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-3 p-4">
            <h3 className="max-w-[85%] text-xl font-semibold tracking-[-0.05em] text-white drop-shadow-[0_8px_24px_rgba(0,0,0,0.55)]">
              {exercise.name}
            </h3>
            {isAdded ? <CheckCircle2 className="size-5 shrink-0 text-[var(--accent)]" /> : null}
          </div>
        </div>
      </button>

      <div className="p-5 pt-4">
        <Button
          onClick={(event) => {
            event.stopPropagation();
            onAdd();
          }}
          disabled={disabled || isAdded}
          className="w-full gap-2"
        >
          {isAdded ? <CheckCircle2 className="size-4" /> : <Plus className="size-4" />}
          {isAdded ? "Adicionado ao treino" : "Adicionar ao treino"}
        </Button>
      </div>
    </motion.article>
  );
}
