export function GstinTag({ value }: { value?: string | null }) {
  const v = (value ?? '').trim();
  if (!v) return <span className="text-slate-400">—</span>;
  if (v.toLowerCase() === 'export') return <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">Export</span>;
  if (v.toLowerCase() === 'unregistered') return <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">Unregistered</span>;
  return <span className="font-mono text-[11.5px] font-medium tracking-tight text-slate-800 dark:text-slate-200">{v}</span>;
}
