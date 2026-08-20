
export const GST_SECTIONS = ['B2B', 'Export', 'B2CL', 'B2CS', 'CDN'] as const;

export const FILING_STATUSES = ['Filed', 'Submitted', 'Locked', 'SaveFailed'] as const;

export const RECON_STATUSES = ['Matched', 'Mismatch', 'Missing', 'NotIn2B'] as const;

export const RECON_COLORS: Record<string, string> = {
  Matched: '#10b981',
  Mismatch: '#f59e0b',
  Missing: '#ef4444',
  'Not in 2B': '#f97316',
};

export const GST_DUE_DATES = {
  GSTR1: 11,
  GSTR3B: 20,
  IFF: 13,
} as const;
