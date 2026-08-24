import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../theme/ThemeContext';

export interface FilingEvent {
  id: string;
  returnType: string;
  title: string;
  description: string;
  dueDay: number;
  dueDate: Date;
  daysRemaining: number;
  status: 'OVERDUE' | 'URGENT' | 'UPCOMING' | 'ON_TRACK';
  route: string;
  penaltyNote: string;
  color: string;
}

function getUpcomingDeadlines(): FilingEvent[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Check deadlines for current calendar month
  const definitions = [
    {
      id: 'gstr1',
      returnType: 'GSTR-1',
      title: 'Monthly Outward Supplies Return',
      description: 'Report all B2B, B2C sales, credit notes, and HSN summary for the previous month.',
      dueDay: 11,
      route: '/gstr1',
      penaltyNote: '₹50/day (₹20 for Nil) late fee applies post due date.',
      color: '#3b82f6',
    },
    {
      id: 'iff',
      returnType: 'IFF (QRMP)',
      title: 'Invoice Furnishing Facility',
      description: 'Upload B2B invoices for quarterly filers to pass ITC to buyers.',
      dueDay: 13,
      route: '/invoices',
      penaltyNote: 'Optional for QRMP, but essential for buyers to claim ITC in 2B.',
      color: '#8b5cf6',
    },
    {
      id: 'gstr2b',
      returnType: 'GSTR-2B',
      title: 'Auto-Drafted ITC Statement',
      description: 'Government portal releases official eligible ITC statement based on supplier filings.',
      dueDay: 14,
      route: '/gstr2b',
      penaltyNote: 'Verify ITC before settling final GSTR-3B tax liability.',
      color: '#06b6d4',
    },
    {
      id: 'gstr3b',
      returnType: 'GSTR-3B',
      title: 'Monthly Summary & Tax Payment',
      description: 'Offset Output Tax liability with Eligible ITC and pay net cash balance.',
      dueDay: 20,
      route: '/gstr3b',
      penaltyNote: '18% p.a. interest on unpaid cash tax + ₹50/day late fee.',
      color: '#10b981',
    },
  ];

  return definitions.map((def) => {
    // If today is past the dueDay, calculate for next month, otherwise this month
    let targetYear = currentYear;
    let targetMonth = currentMonth;
    
    // Target due date in current month
    let dueDate = new Date(targetYear, targetMonth, def.dueDay);
    
    // If more than 5 days past due date in this month, show next month's due date
    const diffDaysFromCurrent = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDaysFromCurrent < -5) {
      targetMonth += 1;
      if (targetMonth > 11) {
        targetMonth = 0;
        targetYear += 1;
      }
      dueDate = new Date(targetYear, targetMonth, def.dueDay);
    }

    const daysRemaining = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let status: FilingEvent['status'] = 'ON_TRACK';
    if (daysRemaining < 0) {
      status = 'OVERDUE';
    } else if (daysRemaining <= 3) {
      status = 'URGENT';
    } else if (daysRemaining <= 7) {
      status = 'UPCOMING';
    }

    return {
      ...def,
      dueDate,
      daysRemaining,
      status,
    };
  }).sort((a, b) => a.daysRemaining - b.daysRemaining);
}

const SNOOZE_KEY = 'gstautopilot_filing_reminder_snoozed_date';

export function FilingDeadlineReminderModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { activeAccentHex } = useTheme();
  const deadlines = useMemo(() => getUpcomingDeadlines(), []);

  const [dontShowToday, setDontShowToday] = useState(false);

  const handleClose = () => {
    if (dontShowToday) {
      const todayStr = new Date().toISOString().slice(0, 10);
      localStorage.setItem(SNOOZE_KEY, todayStr);
    }
    onClose();
  };

  const handleNavigate = (route: string) => {
    onClose();
    navigate(route);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, dontShowToday]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm transition-all duration-200"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[#111827] rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] my-auto transform transition-all animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md flex-shrink-0"
              style={{ backgroundColor: activeAccentHex }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                GST Statutory Filing Deadlines
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Live compliance calendar & deadline countdown
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Body: List of Deadlines */}
        <div className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-3.5 divide-y-0">
          {deadlines.map((item) => {
            const isOverdue = item.status === 'OVERDUE';
            const isUrgent = item.status === 'URGENT';
            
            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isOverdue
                    ? 'bg-rose-50/70 dark:bg-rose-950/25 border-rose-200 dark:border-rose-900/50'
                    : isUrgent
                    ? 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-200 dark:border-amber-900/50'
                    : 'bg-slate-50/80 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Left Info */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className="w-11 h-11 rounded-2xl flex flex-col items-center justify-center text-white font-extrabold flex-shrink-0 shadow-xs"
                    style={{ backgroundColor: item.color }}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider leading-none opacity-85">
                      {item.dueDate.toLocaleString('en-IN', { month: 'short' })}
                    </span>
                    <span className="text-base leading-none font-black mt-0.5">
                      {item.dueDate.getDate()}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {item.returnType}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        · {item.title}
                      </span>
                      
                      {/* Status Tag */}
                      {isOverdue ? (
                        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-extrabold bg-rose-600 text-white animate-pulse">
                          🔴 Overdue ({Math.abs(item.daysRemaining)}d ago)
                        </span>
                      ) : isUrgent ? (
                        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-extrabold bg-amber-500 text-white">
                          ⏰ Due in {item.daysRemaining === 0 ? 'Today' : `${item.daysRemaining} day${item.daysRemaining === 1 ? '' : 's'}`}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {item.daysRemaining} days left
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 leading-relaxed">
                      {item.description}
                    </p>

                    <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                      <span>⚠️</span> {item.penaltyNote}
                    </p>
                  </div>
                </div>

                {/* Right Action Button */}
                <div className="sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleNavigate(item.route)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-xs hover:shadow-md hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: item.color }}
                  >
                    <span>Proceed to {item.returnType}</span>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Statutory Penalty Advisory Card */}
          <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-3">
            <span className="text-base flex-shrink-0">⚖️</span>
            <div>
              <strong className="text-slate-800 dark:text-slate-200 font-bold block mb-0.5">
                Statutory Compliance Advisory
              </strong>
              Late filing of GST returns attracts a daily late fee of ₹50/day (₹20/day for Nil returns) up to ₹10,000 per return, plus mandatory 18% per annum interest on un-offset tax liabilities.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowToday}
              onChange={(e) => setDontShowToday(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            />
            <span>Don't show automatically today</span>
          </label>

          <button
            type="button"
            onClick={handleClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
          >
            Close Calendar
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * TopBar Trigger Button for the Filing Deadlines Modal
 */
export function FilingDeadlineButton() {
  const [isOpen, setIsOpen] = useState(false);
  const deadlines = useMemo(() => getUpcomingDeadlines(), []);

  // Check if any deadline is urgent (<= 3 days) or overdue
  const urgentCount = deadlines.filter((d) => d.status === 'URGENT' || d.status === 'OVERDUE').length;

  // Auto-open logic once per day if urgent deadlines exist
  useEffect(() => {
    if (urgentCount > 0) {
      const snoozedDate = localStorage.getItem(SNOOZE_KEY);
      const todayStr = new Date().toISOString().slice(0, 10);
      if (snoozedDate !== todayStr) {
        // Auto-show popup after a slight delay for smooth page load
        const t = setTimeout(() => setIsOpen(true), 1200);
        return () => clearTimeout(t);
      }
    }
  }, [urgentCount]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
        title="View GST Filing Deadlines & Reminders"
        aria-label="View GST Filing Deadlines & Reminders"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>

        {/* Pulsing indicator if urgent/overdue */}
        {urgentCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-rose-600 text-[9px] font-black text-white">
              {urgentCount}
            </span>
          </span>
        )}
      </button>

      <FilingDeadlineReminderModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
