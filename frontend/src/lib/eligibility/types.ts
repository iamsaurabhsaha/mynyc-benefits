export interface Household {
  annualIncome: number
  householdSize: number
  borough?: string
  ages?: number[]
  isPregnant: boolean
  isDisabled: boolean
  isEmployed: boolean
  filingStatus: 'single' | 'married_joint' | 'head_of_household'
  numChildren: number
  isUsCitizenOrPr: boolean
  isRentRegulated: boolean
  hasHealthInsurance: boolean
}

export interface EligibilityResult {
  program: string
  displayName: string
  eligible: boolean | null
  confidence: 'high' | 'medium' | 'low'
  estimatedBenefit?: string
  howToApply: string
  applyUrl: string
  applyInPerson?: string
  citation: string
  sourceUrl: string
  notes?: string
  relatedPrograms: string[]
}

export interface ProgramData {
  program: string
  display_name: string
  agency: string
  local_agency?: string
  description: string
  category: string
  eligibility: Record<string, unknown>
  apply_url: string
  apply_in_person?: string
  how_to_apply: string
  citation: string
  source_url: string
  last_verified: string
  next_update?: string
  update_frequency: string
  related_programs: string[]
}

export const VALID_BOROUGHS = ['manhattan', 'brooklyn', 'queens', 'bronx', 'staten_island'] as const
export type Borough = typeof VALID_BOROUGHS[number]

export const VALID_FILING_STATUSES = ['single', 'married_joint', 'head_of_household'] as const
export type FilingStatus = typeof VALID_FILING_STATUSES[number]

export function createDefaultHousehold(): Household {
  return {
    annualIncome: 0,
    householdSize: 1,
    isPregnant: false,
    isDisabled: false,
    isEmployed: true,
    filingStatus: 'single',
    numChildren: 0,
    isUsCitizenOrPr: true,
    isRentRegulated: false,
    hasHealthInsurance: true,
  }
}
