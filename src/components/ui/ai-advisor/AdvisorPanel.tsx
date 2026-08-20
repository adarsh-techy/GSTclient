import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { advisorChat, advisorStatus, type AdvisorMessage, type AdvisorToolCall } from '../../../api';
import { fetchCompanies } from '../../../api';
import { getActiveCompanyId } from '../../../api';
import { apiErrorMessage } from '../../../api';
import { usePeriod } from '../../../hooks/usePeriod';

interface PanelMessage extends AdvisorMessage {
  tools?: AdvisorToolCall[];
}

const GREETING: PanelMessage = {
  role: 'assistant',
  content:
    "Hi! I'm your GST advisor. Ask me about GSTR-1, 2B, 3B, ITC, RCM, e-invoicing, e-way bills, or due dates — and I'll pull your actual figures when you ask about them.",
};

const SUGGESTIONS = [
  'Am I ready to file GSTR-3B?',
  'How much GST do I owe this period?',
  'Any reconciliation mismatches?',
  'What is my ITC for this period?',
];

const TOOL_LABELS: Record<string, string> = {
  get_gst_summary: 'GST summary',
  get_gstr3b: 'GSTR-3B',
  get_recon_results: 'Reconciliation',
  get_gstr2b: 'GSTR-2B',
  get_filing_status: 'Filing status',
  get_filing_readiness: 'Filing readiness',
};

export function AdvisorPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<PanelMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const { period } = usePeriod();
  const scrollRef = useRef<HTMLDivElement>(null);

  const statusQuery = useQuery({ queryKey: ['advisor-status'], queryFn: advisorStatus, staleTime: 5 * 60_000 });
  const enabled = statusQuery.data === true;

  const companiesQuery = useQuery({ queryKey: ['companies'], queryFn: fetchCompanies, staleTime: 60_000, retry: false, enabled });
  const companyLabel = useMemo(() => {
    const companies = companiesQuery.data ?? [];
    if (companies.length === 0) return undefined;
    const activeId = getActiveCompanyId();
    const co = activeId == null ? companies[0] : companies.find((c) => c.coId === activeId);
    if (!co) return undefined;
    return co.gstNo ? `${co.coName} · ${co.gstNo}` : co.coName;
  }, [companiesQuery.data]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  if (!enabled) return null;

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    const next: PanelMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(next);
    setInput('');
    setSending(true);
    try {

      const history: AdvisorMessage[] = next
        .filter((m) => m !== GREETING)
        .map((m) => ({ role: m.role, content: m.content }));
      const { reply, toolsUsed } = await advisorChat(history, { period, companyLabel });
      setMessages((prev) => [...prev, { role: 'assistant', content: reply || '(no response)', tools: toolsUsed }]);
    } catch (err) {
      const msg = apiErrorMessage(err);
      setMessages((prev) => [...prev, { role: 'assistant', content: `Sorry — ${msg}` }]);
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  const showSuggestions = messages.length === 1 && !sending;

  return (
    <>
      {!open ? (
        <button
          type="button"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20"
          onClick={() => setOpen(true)}
          title="Ask the GST advisor"
        >
          <span aria-hidden="true" className="text-base">💬</span>
          <span className="hidden xs:inline sm:inline">GST Advisor</span>
        </button>
      ) : null}

      {open && (
        <div
          className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-24px)] max-w-sm sm:w-[400px] h-[520px] max-h-[calc(100vh-70px)] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          role="dialog"
          aria-label="GST advisor"
        >
          
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base">✨</span>
                <span className="text-xs font-black tracking-tight text-slate-900 dark:text-white">GST AI Advisor</span>
              </div>
              <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                Read-only · plain-language compliance guidance
              </div>
            </div>
            <button
              type="button"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              onClick={() => setOpen(false)}
              aria-label="Close advisor"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 text-xs" ref={scrollRef}>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex flex-col gap-1.5 ${
                  m.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-xs shadow-xs font-medium'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  {m.content}
                </div>
                {m.tools && m.tools.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1 mt-1 text-[10px] text-slate-400">
                    <span className="font-semibold">Checked:</span>
                    {m.tools.map((t, j) => (
                      <span
                        key={j}
                        className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700"
                      >
                        {TOOL_LABELS[t.tool] ?? t.tool}
                        {t.period ? ` · ${t.period}` : ''}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {sending ? (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs w-fit">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                <span>Thinking…</span>
              </div>
            ) : null}

            {showSuggestions ? (
              <div className="flex flex-col gap-1.5 mt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Suggestions:</span>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="text-left px-3 py-2 rounded-xl bg-blue-50/70 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 text-xs font-semibold transition-all cursor-pointer"
                    onClick={() => void send(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2">
            <textarea
              className="flex-1 text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-500 resize-none shadow-2xs"
              placeholder="Ask about GST… (Enter to send)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
            />
            <button
              type="button"
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              disabled={!input.trim() || sending}
              onClick={() => void send(input)}
            >
              {sending ? '…' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
