
export function calculateNetPayable(outputGST: number, eligibleITC: number): { netPayable: number; carryForward: number } {
  const diff = outputGST - eligibleITC;
  if (diff >= 0) {
    return { netPayable: diff, carryForward: 0 };
  } else {
    return { netPayable: 0, carryForward: Math.abs(diff) };
  }
}

export function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}
