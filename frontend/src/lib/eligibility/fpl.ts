// 2025 Federal Poverty Level guidelines (48 contiguous states + DC)
// Source: https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines
const FPL_2025: Record<number, number> = {
  1: 15650, 2: 21150, 3: 26650, 4: 32150,
  5: 37650, 6: 43150, 7: 48650, 8: 54150,
}
const FPL_ADDITIONAL_PERSON = 5500

export function getFpl(householdSize: number): number {
  if (householdSize <= 8) return FPL_2025[householdSize]
  return FPL_2025[8] + (householdSize - 8) * FPL_ADDITIONAL_PERSON
}

export function incomeAsPctFpl(annualIncome: number, householdSize: number): number {
  return (annualIncome / getFpl(householdSize)) * 100
}

export function incomeAtPctFpl(householdSize: number, pct: number): number {
  return Math.floor(getFpl(householdSize) * pct / 100)
}
