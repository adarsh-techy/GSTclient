import React from 'react';

export interface BottomBarProps {
  isSidebarOpen?: boolean;
}

export const BottomBar: React.FC<BottomBarProps> = () => {
  return (
    <footer className="w-full mt-auto py-3 px-4 sm:px-6 md:px-8 transition-colors duration-150 border-t border-slate-200/60 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs">
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">GSTAutoPilot</span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span>Enterprise v2.4</span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">All Systems Operational</span>
        </div>

        <div className="flex items-center gap-1.5 text-[10.5px]">
          <span>Designed &amp; Developed by</span>
          <span className="font-bold text-red-500 dark:text-red-400">Carol</span>
          <span className="font-bold text-blue-600 dark:text-blue-500">Solutions</span>
          <span className="text-slate-400 dark:text-slate-500">© 2026</span>
        </div>
      </div>
    </footer>
  );
};

export default BottomBar;
