'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Household, createDefaultHousehold, VALID_BOROUGHS, VALID_FILING_STATUSES } from '../../lib/eligibility/types'

const STEPS = [
  'household', 'income', 'borough', 'age', 'children',
  'conditions', 'citizenship', 'insurance', 'filing',
] as const

export default function ScreenerPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [household, setHousehold] = useState<Household>(createDefaultHousehold())
  const [age, setAge] = useState<number | ''>('')
  const [childAges, setChildAges] = useState<string>('')

  const currentStep = STEPS[step]
  const progress = ((step + 1) / STEPS.length) * 100

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1)
    else submit()
  }

  function back() {
    if (step > 0) setStep(step - 1)
  }

  function submit() {
    const ages: number[] = []
    if (age !== '') ages.push(age)
    if (childAges) {
      childAges.split(',').forEach(a => {
        const n = parseInt(a.trim())
        if (!isNaN(n)) ages.push(n)
      })
    }
    const h = { ...household, ages: ages.length > 0 ? ages : undefined }
    const params = new URLSearchParams()
    params.set('data', JSON.stringify(h))
    router.push(`/results?${params.toString()}`)
  }

  function update(fields: Partial<Household>) {
    setHousehold(prev => ({ ...prev, ...fields }))
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Benefits Eligibility Screener</h1>
      <p className="text-gray-600 mb-6">
        Answer a few questions to find programs you may qualify for.
        No personal data is stored.
      </p>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
        <div
          className="bg-[var(--color-primary)] h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="bg-white rounded-lg shadow p-8 min-h-[300px] flex flex-col">
        <div className="flex-1">
          {currentStep === 'household' && (
            <div>
              <label className="block text-lg font-semibold mb-4">
                How many people live in your household?
              </label>
              <input
                type="number" min={1} max={20}
                value={household.householdSize}
                onChange={e => update({ householdSize: parseInt(e.target.value) || 1 })}
                className="w-full p-3 border-2 border-gray-300 rounded text-lg focus:border-[var(--color-primary)] focus:outline-none"
              />
              <p className="text-sm text-gray-500 mt-2">Include yourself and everyone who lives with you.</p>
            </div>
          )}

          {currentStep === 'income' && (
            <div>
              <label className="block text-lg font-semibold mb-4">
                What is your household&apos;s total annual income (before taxes)?
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-lg text-gray-500">$</span>
                <input
                  type="number" min={0}
                  value={household.annualIncome || ''}
                  onChange={e => update({ annualIncome: parseInt(e.target.value) || 0 })}
                  className="w-full p-3 pl-8 border-2 border-gray-300 rounded text-lg focus:border-[var(--color-primary)] focus:outline-none"
                  placeholder="25000"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">Combined income from all household members. Estimate is fine.</p>
            </div>
          )}

          {currentStep === 'borough' && (
            <div>
              <label className="block text-lg font-semibold mb-4">
                Which NYC borough do you live in?
              </label>
              <div className="space-y-2">
                {VALID_BOROUGHS.map(b => (
                  <button
                    key={b}
                    onClick={() => update({ borough: b })}
                    className={`w-full p-3 text-left rounded border-2 transition-colors ${
                      household.borough === b
                        ? 'border-[var(--color-primary)] bg-blue-50 font-semibold'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {b.charAt(0).toUpperCase() + b.slice(1).replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'age' && (
            <div>
              <label className="block text-lg font-semibold mb-4">
                What is your age?
              </label>
              <input
                type="number" min={0} max={120}
                value={age}
                onChange={e => setAge(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full p-3 border-2 border-gray-300 rounded text-lg focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
          )}

          {currentStep === 'children' && (
            <div>
              <label className="block text-lg font-semibold mb-4">
                How many children (under 18) are in your household?
              </label>
              <input
                type="number" min={0}
                value={household.numChildren}
                onChange={e => update({ numChildren: parseInt(e.target.value) || 0 })}
                className="w-full p-3 border-2 border-gray-300 rounded text-lg focus:border-[var(--color-primary)] focus:outline-none"
              />
              {household.numChildren > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">
                    Children&apos;s ages (comma-separated, for WIC eligibility):
                  </label>
                  <input
                    type="text"
                    value={childAges}
                    onChange={e => setChildAges(e.target.value)}
                    placeholder="3, 7"
                    className="w-full p-3 border-2 border-gray-300 rounded focus:border-[var(--color-primary)] focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {currentStep === 'conditions' && (
            <div>
              <label className="block text-lg font-semibold mb-4">
                Do any of these apply to your household?
              </label>
              <div className="space-y-3">
                {[
                  { key: 'isPregnant' as const, label: 'Someone is pregnant' },
                  { key: 'isDisabled' as const, label: 'Someone has a disability' },
                  { key: 'isRentRegulated' as const, label: 'We live in a rent-regulated apartment' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded cursor-pointer hover:border-gray-400">
                    <input
                      type="checkbox"
                      checked={household[key]}
                      onChange={e => update({ [key]: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'citizenship' && (
            <div>
              <label className="block text-lg font-semibold mb-4">
                Is the primary applicant a US citizen or permanent resident?
              </label>
              <div className="space-y-2">
                {[
                  { value: true, label: 'Yes' },
                  { value: false, label: 'No' },
                ].map(({ value, label }) => (
                  <button
                    key={label}
                    onClick={() => update({ isUsCitizenOrPr: value })}
                    className={`w-full p-3 text-left rounded border-2 transition-colors ${
                      household.isUsCitizenOrPr === value
                        ? 'border-[var(--color-primary)] bg-blue-50 font-semibold'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-3">
                Some programs are available regardless of immigration status (NYC Care, IDNYC, GetFoodNYC).
              </p>
            </div>
          )}

          {currentStep === 'insurance' && (
            <div>
              <label className="block text-lg font-semibold mb-4">
                Do you currently have health insurance?
              </label>
              <div className="space-y-2">
                {[
                  { value: true, label: 'Yes' },
                  { value: false, label: 'No' },
                ].map(({ value, label }) => (
                  <button
                    key={label}
                    onClick={() => update({ hasHealthInsurance: value })}
                    className={`w-full p-3 text-left rounded border-2 transition-colors ${
                      household.hasHealthInsurance === value
                        ? 'border-[var(--color-primary)] bg-blue-50 font-semibold'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'filing' && (
            <div>
              <label className="block text-lg font-semibold mb-4">
                What is your tax filing status?
              </label>
              <div className="space-y-2">
                {VALID_FILING_STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => update({ filingStatus: s })}
                    className={`w-full p-3 text-left rounded border-2 transition-colors ${
                      household.filingStatus === s
                        ? 'border-[var(--color-primary)] bg-blue-50 font-semibold'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-4 border-t">
          <button
            onClick={back}
            disabled={step === 0}
            className="px-6 py-2 rounded border-2 border-gray-300 disabled:opacity-30 hover:border-gray-400"
          >
            Back
          </button>
          <button
            onClick={next}
            className="px-6 py-2 rounded bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-dark)]"
          >
            {step === STEPS.length - 1 ? 'See Results' : 'Next'}
          </button>
        </div>
      </div>

      <p className="text-center text-sm text-gray-500 mt-4">
        Step {step + 1} of {STEPS.length}
      </p>
    </div>
  )
}
