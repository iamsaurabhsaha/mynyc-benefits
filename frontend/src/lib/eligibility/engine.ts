import { Household, EligibilityResult, ProgramData } from './types'
import { incomeAsPctFpl } from './fpl'
import { allPrograms } from '../data/programs'

type CheckResult = {
  eligible: boolean | null
  confidence: 'high' | 'medium' | 'low'
  estimatedBenefit?: string
  notes?: string
}

export function checkEligibility(household: Household): EligibilityResult[] {
  const results = allPrograms.map(program => evaluateProgram(program, household))
  results.sort((a, b) => {
    const order = { true: 0, null: 1, false: 2 }
    const aKey = String(a.eligible) as keyof typeof order
    const bKey = String(b.eligible) as keyof typeof order
    return (order[aKey] ?? 3) - (order[bKey] ?? 3)
  })
  return results
}

function evaluateProgram(program: ProgramData, h: Household): EligibilityResult {
  const checkers: Record<string, (p: ProgramData, h: Household) => CheckResult> = {
    snap: checkSnap, medicaid: checkMedicaid, eitc: checkEitc, ctc: checkCtc,
    wic: checkWic, section8: checkSection8, heap: checkHeap,
    fair_fares: checkFairFares, nyc_care: checkNycCare, getfood: checkGetfood,
    idnyc: checkIdnyc, free_tax_prep: checkFreeTaxPrep, scrie: checkScrie, drie: checkDrie,
  }

  const checker = checkers[program.program]
  const result = checker
    ? checker(program, h)
    : { eligible: null as boolean | null, confidence: 'low' as const, notes: 'Program checker not implemented.' }

  return {
    program: program.program,
    displayName: program.display_name,
    eligible: result.eligible,
    confidence: result.confidence,
    estimatedBenefit: result.estimatedBenefit,
    howToApply: program.how_to_apply,
    applyUrl: program.apply_url,
    applyInPerson: program.apply_in_person,
    citation: program.citation,
    sourceUrl: program.source_url,
    notes: result.notes,
    relatedPrograms: program.related_programs,
  }
}

function checkSnap(program: ProgramData, h: Household): CheckResult {
  if (!h.isUsCitizenOrPr)
    return { eligible: false, confidence: 'high', notes: 'SNAP requires US citizenship or qualified immigrant status.' }

  const elig = program.eligibility as Record<string, number>
  const grossPct = elig.gross_income_pct_fpl ?? 200
  const netPct = elig.net_income_pct_fpl ?? 100
  const pctFpl = incomeAsPctFpl(h.annualIncome, h.householdSize)

  if (pctFpl > grossPct)
    return { eligible: false, confidence: 'high', notes: `Income exceeds ${grossPct}% FPL gross income limit.` }

  const maxAllotments: Record<number, number> = { 1: 292, 2: 536, 3: 768, 4: 975, 5: 1158, 6: 1390, 7: 1536, 8: 1756 }
  const size = Math.min(h.householdSize, 8)
  let benefit = maxAllotments[size] ?? 1756
  if (h.householdSize > 8) benefit += (h.householdSize - 8) * 220
  const benefitStr = `Up to $${benefit}/month`

  if (pctFpl <= netPct)
    return { eligible: true, confidence: 'high', estimatedBenefit: benefitStr }

  return {
    eligible: true, confidence: 'medium', estimatedBenefit: benefitStr,
    notes: `Income is between ${netPct}% and ${grossPct}% FPL. Final eligibility depends on allowable deductions.`,
  }
}

function checkMedicaid(program: ProgramData, h: Household): CheckResult {
  const elig = program.eligibility as Record<string, number>
  const pctFpl = incomeAsPctFpl(h.annualIncome, h.householdSize)

  if (h.isPregnant && pctFpl <= (elig.pregnant_women_pct_fpl ?? 223))
    return { eligible: true, confidence: 'high', notes: 'Eligible through Medicaid for pregnant women.' }

  const hasChild = (h.ages && h.ages.some(a => a < 19)) || false
  if (hasChild && pctFpl <= (elig.children_pct_fpl ?? 223))
    return { eligible: true, confidence: 'high', notes: 'Children in household likely eligible for Child Health Plus or Medicaid.' }

  if (pctFpl <= (elig.adults_pct_fpl ?? 138))
    return { eligible: true, confidence: 'high' }

  const epLimit = elig.essential_plan_pct_fpl ?? 200
  if (pctFpl <= epLimit)
    return { eligible: true, confidence: 'high', notes: 'Income exceeds Medicaid limit but you may qualify for the NY Essential Plan ($0-20/month premiums).' }

  return { eligible: false, confidence: 'high', notes: `Income exceeds ${epLimit}% FPL.` }
}

function checkEitc(program: ProgramData, h: Household): CheckResult {
  if (!h.isEmployed || h.annualIncome <= 0)
    return { eligible: false, confidence: 'high', notes: 'EITC requires earned income from employment.' }
  if (!h.isUsCitizenOrPr)
    return { eligible: false, confidence: 'high', notes: 'EITC requires a valid Social Security Number.' }

  const elig = program.eligibility as Record<string, Record<string, Record<string, number>>>
  const limits = elig.income_limits ?? {}
  const childrenKey = String(Math.min(h.numChildren, 3))
  const statusLimits = limits[h.filingStatus] ?? limits.single ?? {}
  const incomeLimit = statusLimits[childrenKey]

  if (incomeLimit === undefined)
    return { eligible: null, confidence: 'low', notes: 'Could not determine EITC limit for your filing status.' }
  if (h.annualIncome > incomeLimit)
    return { eligible: false, confidence: 'high', notes: `Income exceeds $${incomeLimit.toLocaleString()} limit.` }

  const maxCredits = ((elig as Record<string, unknown>).max_federal_credit ?? {}) as Record<string, number>
  const federalMax = maxCredits[childrenKey] ?? 0
  const nyPct = ((elig as Record<string, unknown>).ny_state_eitc_pct as number) ?? 30
  const nycPct = ((elig as Record<string, unknown>).nyc_eitc_pct as number) ?? 5
  const totalMax = federalMax + Math.floor(federalMax * nyPct / 100) + Math.floor(federalMax * nycPct / 100)

  return {
    eligible: true, confidence: 'high',
    estimatedBenefit: `Up to $${totalMax.toLocaleString()}/year (federal + NY + NYC)`,
    notes: 'Triple credit: Federal EITC + NY State EITC + NYC EITC.',
  }
}

function checkCtc(program: ProgramData, h: Household): CheckResult {
  if (h.numChildren === 0)
    return { eligible: false, confidence: 'high', notes: 'Requires qualifying children under 17.' }

  const elig = program.eligibility as Record<string, number | Record<string, number>>
  const creditPerChild = (elig.credit_per_child as number) ?? 2000
  const phaseOut = (elig.phase_out_threshold as Record<string, number>) ?? {}
  const threshold = phaseOut[h.filingStatus] ?? phaseOut.single ?? 200000

  if (h.annualIncome > threshold) {
    const reduction = Math.floor((h.annualIncome - threshold) / 1000) * 50
    const total = Math.max(0, creditPerChild * h.numChildren - reduction)
    if (total <= 0) return { eligible: false, confidence: 'high', notes: 'Income exceeds phase-out threshold.' }
    return { eligible: true, confidence: 'medium', estimatedBenefit: `~$${total.toLocaleString()}/year (reduced by phase-out)` }
  }

  const total = creditPerChild * h.numChildren
  return { eligible: true, confidence: 'high', estimatedBenefit: `$${total.toLocaleString()}/year` }
}

function checkWic(program: ProgramData, h: Household): CheckResult {
  const hasUnder5 = h.ages ? h.ages.some(a => a < 5) : false
  if (!h.isPregnant && !hasUnder5)
    return { eligible: false, confidence: 'high', notes: 'WIC is for pregnant/postpartum individuals and children under 5.' }

  const elig = program.eligibility as Record<string, number>
  const pctFpl = incomeAsPctFpl(h.annualIncome, h.householdSize)
  if (pctFpl > (elig.income_pct_fpl ?? 185))
    return { eligible: null, confidence: 'medium', notes: `Income exceeds ${elig.income_pct_fpl ?? 185}% FPL, but you may be automatically eligible if you receive SNAP or Medicaid.` }

  return { eligible: true, confidence: 'high' }
}

function checkSection8(program: ProgramData, h: Household): CheckResult {
  const elig = program.eligibility as Record<string, Record<string, Record<string, number>> | string>
  const incomeLimit = elig.income_limit as Record<string, Record<string, number>> | undefined
  const waitlistNote = (elig.waitlist_status as string) ?? 'Waitlist status unknown. Contact NYCHA directly.'

  if (incomeLimit) {
    const eli = incomeLimit.extremely_low_income ?? {}
    const limit = eli[String(h.householdSize)] ?? eli['4']
    if (limit && h.annualIncome <= limit)
      return { eligible: true, confidence: 'medium', notes: waitlistNote }
    if (limit)
      return { eligible: false, confidence: 'high', notes: 'Income exceeds Section 8 extremely low income limits.' }
  }
  return { eligible: null, confidence: 'low', notes: waitlistNote }
}

function checkHeap(program: ProgramData, h: Household): CheckResult {
  const elig = program.eligibility as Record<string, number | string>
  const pctFpl = incomeAsPctFpl(h.annualIncome, h.householdSize)
  if (pctFpl <= ((elig.income_pct_fpl as number) ?? 150))
    return { eligible: true, confidence: 'high', notes: elig.program_period_note as string | undefined }
  return { eligible: false, confidence: 'medium', notes: `Income exceeds ${elig.income_pct_fpl ?? 150}% FPL. However, you are automatically eligible if you receive SNAP, SSI, or Temporary Assistance.` }
}

function checkFairFares(program: ProgramData, h: Household): CheckResult {
  const elig = program.eligibility as Record<string, number>
  const pctFpl = incomeAsPctFpl(h.annualIncome, h.householdSize)
  if (pctFpl > (elig.income_pct_fpl ?? 100))
    return { eligible: false, confidence: 'high', notes: `Income exceeds ${elig.income_pct_fpl ?? 100}% FPL.` }
  if (h.ages) {
    const age = h.ages[0]
    if (age < (elig.min_age ?? 18) || age > (elig.max_age ?? 64))
      return { eligible: false, confidence: 'high', notes: `Must be between ${elig.min_age ?? 18} and ${elig.max_age ?? 64} years old.` }
  }
  return { eligible: true, confidence: 'high', estimatedBenefit: 'Half-price MetroCard' }
}

function checkNycCare(_program: ProgramData, h: Household): CheckResult {
  if (h.hasHealthInsurance)
    return { eligible: false, confidence: 'high', notes: 'NYC Care is for people without health insurance.' }
  return { eligible: true, confidence: 'high', notes: 'NYC Care provides low-cost healthcare at NYC Health + Hospitals. No immigration status requirement.' }
}

function checkGetfood(): CheckResult {
  return { eligible: true, confidence: 'high', notes: 'No income test. Free food resources available to all NYC residents.' }
}

function checkIdnyc(program: ProgramData, h: Household): CheckResult {
  const elig = program.eligibility as Record<string, number>
  if (h.ages && h.ages[0] < (elig.min_age ?? 10))
    return { eligible: false, confidence: 'high', notes: `Must be at least ${elig.min_age ?? 10} years old.` }
  return { eligible: true, confidence: 'high', estimatedBenefit: 'Free municipal ID', notes: 'Available to all NYC residents regardless of immigration status.' }
}

function checkFreeTaxPrep(program: ProgramData, h: Household): CheckResult {
  const elig = program.eligibility as Record<string, number>
  if (h.annualIncome > (elig.income_limit ?? 85000))
    return { eligible: false, confidence: 'high', notes: `Income exceeds $${(elig.income_limit ?? 85000).toLocaleString()} limit.` }
  return { eligible: true, confidence: 'high', estimatedBenefit: 'Free tax preparation' }
}

function checkScrie(program: ProgramData, h: Household): CheckResult {
  const elig = program.eligibility as Record<string, number | boolean>
  if (h.ages && h.ages[0] < ((elig.min_age as number) ?? 62))
    return { eligible: false, confidence: 'high', notes: `Must be at least ${elig.min_age ?? 62} years old.` }
  if (!h.isRentRegulated)
    return { eligible: false, confidence: 'high', notes: 'Must live in a rent-regulated apartment.' }
  if (h.annualIncome > ((elig.income_limit as number) ?? 50000))
    return { eligible: false, confidence: 'high', notes: `Income exceeds $${((elig.income_limit as number) ?? 50000).toLocaleString()} limit.` }
  return { eligible: true, confidence: 'high', estimatedBenefit: 'Rent freeze' }
}

function checkDrie(program: ProgramData, h: Household): CheckResult {
  const elig = program.eligibility as Record<string, number | boolean>
  if (!h.isDisabled)
    return { eligible: false, confidence: 'high', notes: 'Must be receiving disability-related benefits.' }
  if (!h.isRentRegulated)
    return { eligible: false, confidence: 'high', notes: 'Must live in a rent-regulated apartment.' }
  if (h.annualIncome > ((elig.income_limit as number) ?? 50000))
    return { eligible: false, confidence: 'high', notes: `Income exceeds $${((elig.income_limit as number) ?? 50000).toLocaleString()} limit.` }
  return { eligible: true, confidence: 'high', estimatedBenefit: 'Rent freeze' }
}
