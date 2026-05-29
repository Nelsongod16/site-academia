"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export function MuscleFilter({ title, description, options, value, onChange, countMap = {}, className }) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">{title}</p>
          {description ? <p className="mt-1 text-sm text-[var(--muted)]">{description}</p> : null}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {options.map((option, index) => {
          const active = value === option.value;
          const count = countMap[option.value];

          return (
            <motion.button
              key={option.value}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02, duration: 0.22, ease: "easeOut" }}
              onClick={() => onChange(option.value)}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm transition",
                active
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-white"
                  : "border-white/7 bg-white/[0.03] text-[var(--muted)] hover:border-white/14 hover:bg-white/[0.05]",
              )}
            >
              <span>{option.label}</span>
              {typeof count === "number" ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px]",
                    active ? "bg-black/16 text-white/88" : "bg-white/7 text-white/72",
                  )}
                >
                  {count}
                </span>
              ) : null}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
