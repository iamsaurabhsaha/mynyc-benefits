'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Household, createDefaultHousehold, VALID_BOROUGHS, VALID_FILING_STATUSES } from '../../lib/eligibility/types'

const STEPS = ['household', 'income', 'borough', 'age', 'children', 'conditions', 'citizenship', 'insurance', 'filing'] as const

function ScreenerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(0)
  const [household, setHousehold] = useState<Household>(() => {
    const h = createDefaultHousehold()
    const event = searchParams.get('event')
    if (event === 'baby') h.isPregnant = true
    if (event === 'retiring') h.filingStatus = 'single'
    return h
  })
  const [age, setAge] = useState<number | ''>('')
  const [childAges, setChildAges] = useState('')

  const currentStep = STEPS[step]
  const progress = ((step + 1) / STEPS.length) * 100

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1)
    else submit()
  }
  function back() { if (step > 0) setStep(step - 1) }

  function submit() {
    const ages: number[] = []
    if (age !== '') ages.push(age)
    if (childAges) childAges.split(',').forEach(a => { const n = parseInt(a.trim()); if (!isNaN(n)) ages.push(n) })
    const h = { ...household, ages: ages.length > 0 ? ages : undefined }
    router.push(`/results?data=${encodeURIComponent(JSON.stringify(h))}`)
  }

  function update(fields: Partial<Household>) { setHousehold(prev => ({ ...prev, ...fields })) }

  return (
    <div className="min-h-screen">
      {/* Progress */}
      <div className="w-full bg-[#f3f3f3] pt-8 pb-4">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex justify-between items-end mb-4">
            <div>
              <span className="text-[#414750] text-sm font-medium uppercase tracking-wider">Benefit Eligibility</span>
              <h1 className="text-2xl font-extrabold tracking-tight">Eligibility Screener</h1>
            </div>
            <span className="text-sm font-bold text-[#00467b]">Step {step + 1} of {STEPS.length}</span>
          </div>
          <div className="w-full bg-[#e2e2e2] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#00467b] h-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white p-10 rounded-xl shadow-[0_8px_32px_rgba(26,28,28,0.04)]">
          <div className="space-y-8">

            {currentStep === 'household' && (
              <div className="space-y-2">
                <h2 className="text-3xl font-bold leading-tight">How many people live in your household?</h2>
                <p className="text-[#414750] text-lg">Include yourself and everyone who lives with you.</p>
                <input type="number" min={1} max={20} value={household.householdSize}
                  onChange={e => update({ householdSize: parseInt(e.target.value) || 1 })}
                  className="w-full max-w-sm mt-4 pl-4 pr-4 py-4 bg-[#f3f3f3] border-b-2 border-[#c1c7d2] focus:border-[#00467b] focus:ring-0 text-xl font-semibold transition-colors" />
              </div>
            )}

            {currentStep === 'income' && (
              <div className="space-y-2">
                <h2 className="text-3xl font-bold leading-tight">What is your total household annual income?</h2>
                <p className="text-[#414750] text-lg">Include all sources of income for all household members before taxes.</p>
                <div className="relative max-w-sm mt-4">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#414750] font-bold text-xl">$</span>
                  <input type="number" min={0} value={household.annualIncome || ''}
                    onChange={e => update({ annualIncome: parseInt(e.target.value) || 0 })}
                    placeholder="25000"
                    className="w-full pl-10 pr-4 py-4 bg-[#f3f3f3] border-b-2 border-[#c1c7d2] focus:border-[#00467b] focus:ring-0 text-xl font-semibold transition-colors" />
                </div>
              </div>
            )}

            {currentStep === 'borough' && (
              <div className="space-y-2">
                <h2 className="text-3xl font-bold leading-tight">Which NYC borough do you live in?</h2>
                <p className="text-[#414750] text-lg">Select the location of your primary residence.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {VALID_BOROUGHS.map(b => (
                    <button key={b} onClick={() => update({ borough: b })}
                      className={`flex flex-col items-start p-6 rounded-lg transition-all text-left ${
                        household.borough === b
                          ? 'bg-[#f9f9f9] border-2 border-[#00467b] ring-2 ring-[#00467b]/10'
                          : 'bg-[#eeeeee] border-2 border-transparent hover:border-[#c1c7d2]'
                      }`}>
                      <span className={`font-bold text-xl mb-1 ${household.borough === b ? 'text-[#00467b]' : ''}`}>
                        {b === 'staten_island' ? 'Staten Island' : b.charAt(0).toUpperCase() + b.slice(1)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 'age' && (
              <div className="space-y-2">
                <h2 className="text-3xl font-bold leading-tight">What is your age?</h2>
                <p className="text-[#414750] text-lg">This helps determine eligibility for age-specific programs.</p>
                <input type="number" min={0} max={120} value={age}
                  onChange={e => setAge(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full max-w-sm mt-4 pl-4 pr-4 py-4 bg-[#f3f3f3] border-b-2 border-[#c1c7d2] focus:border-[#00467b] focus:ring-0 text-xl font-semibold transition-colors" />
              </div>
            )}

            {currentStep === 'children' && (
              <div className="space-y-2">
                <h2 className="text-3xl font-bold leading-tight">How many children (under 18) in your household?</h2>
                <input type="number" min={0} value={household.numChildren}
                  onChange={e => update({ numChildren: parseInt(e.target.value) || 0 })}
                  className="w-full max-w-sm mt-4 pl-4 pr-4 py-4 bg-[#f3f3f3] border-b-2 border-[#c1c7d2] focus:border-[#00467b] focus:ring-0 text-xl font-semibold transition-colors" />
                {household.numChildren > 0 && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium mb-2">Children&apos;s ages (comma-separated, for WIC eligibility):</label>
                    <input type="text" value={childAges} onChange={e => setChildAges(e.target.value)} placeholder="3, 7"
                      className="w-full max-w-sm p-4 bg-[#f3f3f3] border-b-2 border-[#c1c7d2] focus:border-[#00467b] focus:ring-0 transition-colors" />
                  </div>
                )}
              </div>
            )}

            {currentStep === 'conditions' && (
              <div className="space-y-2">
                <h2 className="text-3xl font-bold leading-tight">Do any of the following apply?</h2>
                <div className="grid gap-4 mt-4">
                  {([
                    { key: 'isPregnant' as const, label: 'Someone in the household is pregnant' },
                    { key: 'isDisabled' as const, label: 'Someone in the household has a disability' },
                    { key: 'isRentRegulated' as const, label: 'Living in a rent-regulated apartment' },
                  ]).map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-4 p-4 rounded-lg bg-[#f3f3f3] hover:bg-[#eeeeee] transition-colors cursor-pointer">
                      <input type="checkbox" checked={household[key]}
                        onChange={e => update({ [key]: e.target.checked })}
                        className="w-6 h-6 rounded border-[#717782] text-[#00467b] focus:ring-[#00467b]" />
                      <span className="font-medium">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 'citizenship' && (
              <div className="space-y-2">
                <h2 className="text-3xl font-bold leading-tight">Is the primary applicant a US citizen or permanent resident?</h2>
                <p className="text-[#414750] text-lg">Some programs are available regardless of immigration status.</p>
                <div className="grid grid-cols-2 gap-4 mt-4 max-w-sm">
                  {[{ v: true, l: 'Yes' }, { v: false, l: 'No' }].map(({ v, l }) => (
                    <button key={l} onClick={() => update({ isUsCitizenOrPr: v })}
                      className={`p-6 rounded-lg text-xl font-bold transition-all ${
                        household.isUsCitizenOrPr === v
                          ? 'bg-[#f9f9f9] border-2 border-[#00467b] text-[#00467b]'
                          : 'bg-[#eeeeee] border-2 border-transparent hover:border-[#c1c7d2]'
                      }`}>{l}</button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 'insurance' && (
              <div className="space-y-2">
                <h2 className="text-3xl font-bold leading-tight">Do you currently have health insurance?</h2>
                <div className="grid grid-cols-2 gap-4 mt-4 max-w-sm">
                  {[{ v: true, l: 'Yes' }, { v: false, l: 'No' }].map(({ v, l }) => (
                    <button key={l} onClick={() => update({ hasHealthInsurance: v })}
                      className={`p-6 rounded-lg text-xl font-bold transition-all ${
                        household.hasHealthInsurance === v
                          ? 'bg-[#f9f9f9] border-2 border-[#00467b] text-[#00467b]'
                          : 'bg-[#eeeeee] border-2 border-transparent hover:border-[#c1c7d2]'
                      }`}>{l}</button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 'filing' && (
              <div className="space-y-2">
                <h2 className="text-3xl font-bold leading-tight">What is your tax filing status?</h2>
                <div className="space-y-3 mt-4">
                  {VALID_FILING_STATUSES.map(s => (
                    <button key={s} onClick={() => update({ filingStatus: s })}
                      className={`w-full p-5 rounded-lg text-left text-lg font-semibold transition-all ${
                        household.filingStatus === s
                          ? 'bg-[#f9f9f9] border-2 border-[#00467b] text-[#00467b]'
                          : 'bg-[#eeeeee] border-2 border-transparent hover:border-[#c1c7d2]'
                      }`}>
                      {s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-16 flex items-center justify-between border-t border-[#c1c7d2] pt-10">
            <button onClick={back} disabled={step === 0}
              className="flex items-center gap-2 px-6 py-3 text-[#00467b] font-bold hover:bg-[#00467b]/5 rounded-md transition-all disabled:opacity-30">
              <span className="material-symbols-outlined">arrow_back</span> Back
            </button>
            <button onClick={next}
              className="flex items-center gap-2 px-10 py-4 hero-gradient text-white font-bold rounded-md shadow-lg shadow-[#00467b]/20 hover:translate-y-[-2px] active:translate-y-0 transition-all">
              {step === STEPS.length - 1 ? 'See Results' : 'Next Step'}
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-[#414750] text-sm max-w-lg mx-auto leading-relaxed">
          Your information is used only to determine eligibility and is not stored or shared.
        </p>
      </div>
    </div>
  )
}

export default function ScreenerPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto px-6 py-12">Loading screener...</div>}>
      <ScreenerContent />
    </Suspense>
  )
}
