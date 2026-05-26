"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Waves, Zap } from "lucide-react";
import { useState } from "react";

import { Button, Surface } from "@/components/ui/kit";

const actions = [
  { href: "/training", label: "Treino rapido", sub: "Abrir treino em 1 toque", icon: Zap },
  { href: "/run", label: "Registrar corrida", sub: "KM, metros e tempo", icon: Plus },
  { href: "/swim", label: "Registrar natacao", sub: "Tempo e distancia", icon: Waves },
];

export function FabSheet() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 32, opacity: 0 }}
              className="absolute inset-x-4 bottom-24"
            >
              <Surface className="space-y-3 rounded-[24px] p-3">
                {actions.map(({ href, label, sub, icon: Icon }) => (
                  <Link
                    href={href}
                    key={href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-[18px] border border-white/6 bg-white/4 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-[var(--muted)]">{sub}</p>
                    </div>
                    <Icon className="size-4 text-[var(--accent)]" />
                  </Link>
                ))}
              </Surface>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <Button
        onClick={() => setOpen((value) => !value)}
        className="fixed right-4 bottom-26 z-50 size-14 rounded-full p-0 shadow-[0_16px_40px_rgba(156,255,121,0.22)] md:right-10 md:bottom-10"
      >
        <Plus className="size-5" />
      </Button>
    </>
  );
}
