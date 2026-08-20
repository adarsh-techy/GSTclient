import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  details?: string;
  category: 'compliance' | 'feature' | 'system';
  timestamp: string;
  unread: boolean;
  actionPath?: string;
  actionLabel?: string;
  tone: 'cyan' | 'emerald' | 'amber' | 'purple' | 'rose';
}

function stripEmojis(str: string): string {
  if (!str) return '';
  return str
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}]/gu, '')
    .replace(/[✓✕⚠⛔⚡✨]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    title: 'GSTR-1 Filing Period Active',
    message: 'Review and lock outward sales supplies before the 11th. Direct GSTN JSON generation and OTP filing are enabled.',
    details: 'GSTR-1 contains all outward supplies of goods and services made during the tax period. In GSTAutoPilot, your CarolERP sales invoices are automatically organized into B2B, B2CL, B2CS, Export, CDN, and HSN summary tables. You can download the GSTN JSON directly or perform 1-click filing via GST OTP.',
    category: 'compliance',
    timestamp: 'Due by 11th',
    unread: true,
    actionPath: '/gstr1',
    actionLabel: 'Open GSTR-1 View',
    tone: 'cyan',
  },
  {
    id: 'n2',
    title: 'GSTR-2B Auto-Drafted ITC Ready',
    message: 'GSTN auto-drafted ITC statement is generated on the 14th. Fetch from portal and run 2B vs Books reconciliation.',
    details: 'GSTR-2B is a static monthly auto-drafted statement indicating the availability of Input Tax Credit (ITC) for your company. Fetch it directly from the government portal into GSTAutoPilot to audit eligible and ineligible ITC before filing GSTR-3B.',
    category: 'compliance',
    timestamp: 'Monthly Statement',
    unread: true,
    actionPath: '/gstr2b',
    actionLabel: 'View GSTR-2B Statement',
    tone: 'emerald',
  },
  {
    id: 'n3',
    title: 'Auto-Pilot e-Invoicing & QR Codes',
    message: '1-click IRN generation, signed QR code rendering, and bulk dispatch from your CarolERP sales database.',
    details: 'Taxpayers with aggregate turnover above statutory thresholds must generate Invoice Reference Numbers (IRN) and digitally signed QR codes from the IRP (Invoice Registration Portal). GSTAutoPilot automates this in real time via WhiteBooks API directly from your CarolERP sales ledger.',
    category: 'feature',
    timestamp: 'Core Engine',
    unread: true,
    actionPath: '/invoices',
    actionLabel: 'Manage Invoices',
    tone: 'purple',
  },
  {
    id: 'n4',
    title: 'e-Way Bill Real-Time Generation',
    message: 'Generate e-Way bills alongside e-Invoices with Part-B vehicle updates, multi-vehicle dispatch, and PDF print templates.',
    details: 'Electronic Way Bills are statutory documents required for movement of goods valued above ₹50,000. In GSTAutoPilot, generate e-Way bills in 1-click alongside e-Invoices, update vehicle numbers, extend validity, or cancel bills within statutory windows.',
    category: 'feature',
    timestamp: 'Logistics Ready',
    unread: true,
    actionPath: '/eway-bills',
    actionLabel: 'Open e-Way Bills',
    tone: 'amber',
  },
  {
    id: 'n5',
    title: 'AI Smart Reconciliation',
    message: 'Cross-audits ERP purchase books against GSTR-2B to flag missing invoices, value mismatches, and unfiled supplier returns.',
    details: 'GSTAutoPilot automatically compares every inward purchase invoice in your CarolERP accounting books against supplier filings in GSTR-2B. It categorizes entries into Matched, Mismatched, Missing in Books, and Not in 2B with AI diagnostic remarks.',
    category: 'feature',
    timestamp: 'Audit Engine',
    unread: false,
    actionPath: '/recon',
    actionLabel: 'Run Reconciliation',
    tone: 'cyan',
  },
  {
    id: 'n6',
    title: 'GSTR-3B Tax Liability Settlement',
    message: 'Auto-calculates Section 3.1 outward tax, Table 4 eligible ITC, and net cash tax payable for monthly settlement.',
    details: 'GSTR-3B is a monthly self-declaration return for summarizing outward supplies, input tax credit availed, and payment of tax liabilities. GSTAutoPilot consolidates Section 3.1 with Table 4 ITC and calculates whether you have nil cash liability or require a PMT-06 challan deposit.',
    category: 'compliance',
    timestamp: 'Due by 20th',
    unread: false,
    actionPath: '/gstr3b',
    actionLabel: 'Open GSTR-3B',
    tone: 'rose',
  },
];

function NotificationItemIcon({ id, tone, className = 'w-4 h-4' }: { id: string; tone: string; className?: string }) {
  const toneClasses: Record<string, string> = {
    cyan: 'text-[#0096c7] dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60',
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60',
    rose: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60',
  };
  const colorCls = toneClasses[tone] || 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800';

  const renderSvg = () => {
    switch (id) {
      case 'n1':
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        );
      case 'n2':
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="8 17 12 21 16 17" />
            <line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
          </svg>
        );
      case 'n3':
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        );
      case 'n4':
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" />
            <polygon points="16 8 20 8 23 11 23 16 16 16" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
        );
      case 'n5':
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        );
      case 'n6':
      default:
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        );
    }
  };

  return (
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${colorCls}`}>
      {renderSvg()}
    </div>
  );
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [activePopup, setActivePopup] = useState<AppNotification | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('gst_notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AppNotification[];
        return parsed.map((item) => ({
          ...item,
          title: stripEmojis(item.title) || item.title,
        }));
      } catch {
        return INITIAL_NOTIFICATIONS;
      }
    }
    return INITIAL_NOTIFICATIONS;
  });
  const [filter, setFilter] = useState<'all' | 'unread' | 'compliance' | 'feature'>('all');
  const popoverRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('gst_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return n.unread;
    if (filter === 'compliance') return n.category === 'compliance';
    if (filter === 'feature') return n.category === 'feature';
    return true;
  });

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
    );
  };

  const openNotificationPopup = (n: AppNotification) => {
    markAsRead(n.id);
    setOpen(false);
    setActivePopup(n);
  };

  const handleLaunch = (n: AppNotification) => {
    markAsRead(n.id);
    setActivePopup(null);
    setOpen(false);
    if (n.actionPath) {
      navigate(n.actionPath);
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
        title="Notifications & App Guide"
        aria-label="Notifications & App Guide"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black font-mono shadow-xs border-2 border-white dark:border-[#0f172a]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-32px)] max-w-sm sm:w-96 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-white">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 flex items-center justify-center text-[#0096c7] dark:text-cyan-400">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Notifications &amp; App Hub
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {unreadCount} unread update{unreadCount === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[10.5px] font-bold text-[#0096c7] hover:text-[#0077b6] dark:text-cyan-400 dark:hover:text-cyan-300 cursor-pointer"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 overflow-x-auto [scrollbar-width:none]">
            {(
              [
                { key: 'all', label: 'All' },
                { key: 'unread', label: `Unread (${unreadCount})` },
                { key: 'compliance', label: 'Compliance' },
                { key: 'feature', label: 'App Guide' },
              ] as const
            ).map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-[#00b4d8] text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {filtered.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  All caught up!
                </div>
                <p className="text-[11px] text-slate-400">
                  No notifications in this category.
                </p>
              </div>
            ) : (
              filtered.map((n) => {
                return (
                  <div
                    key={n.id}
                    onClick={() => openNotificationPopup(n)}
                    className={`p-3.5 flex items-start gap-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer ${
                      n.unread ? 'bg-cyan-50/20 dark:bg-cyan-950/10' : ''
                    }`}
                  >
                    <NotificationItemIcon id={n.id} tone={n.tone} />

                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {n.title}
                        </span>
                        <span className="text-[9.5px] font-medium text-slate-400 shrink-0">
                          {n.timestamp}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10.5px] font-bold text-[#0096c7] dark:text-cyan-400 flex items-center gap-1">
                          <span>View Details &amp; Actions</span>
                          <span>→</span>
                        </span>

                        {n.unread && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 text-[10.5px] text-slate-500 dark:text-slate-400 text-center">
            GSTAutoPilot Suite v1.0 · Integrated with CarolERP &amp; GSTN
          </div>
        </div>
      )}

      {activePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <NotificationItemIcon id={activePopup.id} tone={activePopup.tone} className="w-5 h-5" />
                <div>
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#0096c7] dark:text-cyan-400">
                    {activePopup.category === 'compliance' ? 'GST Statutory Compliance' : 'GSTAutoPilot Feature Hub'}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {activePopup.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivePopup(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Status / Deadline</span>
                <span className="font-bold text-slate-900 dark:text-white">{activePopup.timestamp}</span>
              </div>

              <div className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                {activePopup.message}
              </div>

              {activePopup.details && (
                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/60 text-slate-600 dark:text-slate-300 leading-relaxed flex flex-col gap-1.5">
                  <span className="font-bold text-[#0096c7] dark:text-cyan-300 flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <span>System Workflow Guide:</span>
                  </span>
                  <span>{activePopup.details}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => setActivePopup(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>

              {activePopup.actionPath && (
                <button
                  type="button"
                  onClick={() => handleLaunch(activePopup)}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-[#00b4d8] to-[#0096c7] hover:from-[#0096c7] hover:to-[#0077b6] shadow-sm transition-all cursor-pointer"
                >
                  <span>{activePopup.actionLabel ?? 'Launch Feature'}</span>
                  <span>→</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
