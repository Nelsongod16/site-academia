"use client";

export function RunPostMetrics({
  runTime,
  runDistance,
  runPace,
}: {
  runTime?: string;
  runDistance?: string;
  runPace?: string;
}) {
  const items = [
    runTime ? { label: "Tempo", value: runTime } : null,
    runDistance ? { label: "Distancia", value: runDistance } : null,
    runPace ? { label: "Pace", value: runPace } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-[16px] border border-white/10 bg-black/24 px-3 py-3 backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/56">{item.label}</p>
          <p className="mt-1 text-sm font-medium text-white">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
