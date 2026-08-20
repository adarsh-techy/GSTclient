
export const DEFAULT_FLAVORS = {
  KSCC: {
    header: 'Bill_File_mas',
    docId: '205',
    line: 'Bill_File_trn',
    outwardSp: 'Usp_GSTR_For_Filing',
    inwardSp: 'Usp_GSTR2A_For_Filing',
  },
  Default: {
    header: 'Bill_Mas',
    docId: '51',
    line: 'Bill_Mas',
    outwardSp: '',
    inwardSp: '',
  },
} as const;

export const DEFAULT_PERIODS = [
  '2026-06',
  '2026-05',
  '2026-04',
  '2026-03',
  '2026-02',
  '2026-01',
];
