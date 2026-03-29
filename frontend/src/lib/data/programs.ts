import { ProgramData } from '../eligibility/types'

import snap from '../../data/federal/snap.json'
import medicaid from '../../data/federal/medicaid.json'
import eitc from '../../data/federal/eitc.json'
import ctc from '../../data/federal/ctc.json'
import wic from '../../data/federal/wic.json'
import section8 from '../../data/federal/section8.json'
import heap from '../../data/federal/heap.json'
import fairFares from '../../data/nyc/fair_fares.json'
import nycCare from '../../data/nyc/nyc_care.json'
import getfood from '../../data/nyc/getfood.json'
import idnyc from '../../data/nyc/idnyc.json'
import freeTaxPrep from '../../data/nyc/free_tax_prep.json'
import scrie from '../../data/nyc/scrie.json'
import drie from '../../data/nyc/drie.json'

export const allPrograms: ProgramData[] = [
  snap, medicaid, eitc, ctc, wic, section8, heap,
  fairFares, nycCare, getfood, idnyc, freeTaxPrep, scrie, drie,
] as ProgramData[]

export function getProgram(id: string): ProgramData | undefined {
  return allPrograms.find(p => p.program === id)
}
