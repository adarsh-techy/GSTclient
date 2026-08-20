export function Footer() {
  return (
    <footer className="w-full mt-auto py-3 px-4 sm:px-6 md:px-8 transition-colors duration-150">
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-start gap-x-3 gap-y-1 text-[11px] text-slate-400 dark:text-slate-500">
        <span>Developed by</span>
        <span className="font-bold text-red-500 dark:text-red-400">Carol</span>
        <span className="font-bold text-blue-600 dark:text-blue-600">Solutions</span>
        <span>@2026</span>
        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 inline-block" />
        <span>GSTAutoPilot Enterprise v2.4</span>
        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 inline-block" />
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Systems Operational</span>
        </span>
      </div>
    </footer>
  );
}

export default Footer;
