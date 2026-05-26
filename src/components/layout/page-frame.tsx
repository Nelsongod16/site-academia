"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={cn("mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pb-28 pt-5 sm:px-6", className)}
    >
      {children}
    </motion.div>
  );
}
