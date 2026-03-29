'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { Household, createDefaultHousehold } from '../../lib/eligibility/types'
import { checkEligibility } from '../../lib/eligibility/engine'
import { EligibilityResult } from '../../lib/eligibility/types'

function ResultsContent() {
  const searchParams = useSearchParams()
  const dataParam = searchParams.get('data')

  let household: Household
  try {
    household = dataParam ? JSON.parse(dataParam) : createDefaultHousehold()
  } catch {
    household = createDefaultHousehold()
  }

  const results = checkEligibility(household)
  const eligible = results.filter(r => r.eligible === true)
  const maybe = results.filter(r => r.eligible === null)
  const notEligible = results.filter(r => r.eligible === false)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Summary header */}
      <div className="bg-[var(--color-primary-dark)] text-white rounded-lg p-6 mb-8">
        <h1 className="text-2xl font-bold mb-2">Your Benefits Results</h1>
        <p className="text-gray-200">
          Household: {household.householdSize} {household.householdSize === 1 ? 'person' : 'people'},
          ${household.annualIncome.toLocaleString()}/year
          {household.borough && `, ${household.borough.charAt(0).toUpperCase() + household.borough.slice(1).replace('_', ' ')}`}
        </p>
      </div>

      {/* Eligible */}
      {eligible.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-[var(--color-success)] mb-4">
            You likely qualify for {eligible.length} program{eligible.length !== 1 ? 's' : ''}
          </h2>
          <div className="space-y-4">
            {eligible.map(r => <ResultCard key={r.program} result={r} />)}
          </div>
        </section>
      )}

      {/* Maybe eligible */}
      {maybe.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-[var(--color-warning)] mb-4">
            May qualify — needs further review ({maybe.length})
          </h2>
          <div className="space-y-4">
            {maybe.map(r => <ResultCard key={r.program} result={r} />)}
          </div>
        </section>
      )}

      {/* Not eligible */}
      {notEligible.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg text-gray-500 mb-3">
            Not eligible for {notEligible.length} program{notEligible.length !== 1 ? 's' : ''}
          </h2>
          <div className="text-gray-500 text-sm">
            {notEligible.map(r => r.displayName).join(', ')}
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="flex gap-4 mt-8">
        <Link
          href="/screener"
          className="px-6 py-3 rounded bg-[var(--color-primary)] text-white font-semibold no-underline hover:bg-[var(--color-primary-dark)]"
        >
          Start Over
        </Link>
        <button
          onClick={() => window.print()}
          className="px-6 py-3 rounded border-2 border-gray-300 font-semibold hover:border-gray-400"
        >
          Print Results
        </button>
      </div>

      {/* Disclaimer */}
      <p className="text-sm text-gray-500 mt-8 p-4 bg-gray-100 rounded">
        <strong>Disclaimer:</strong> This is a screening tool, not legal advice.
        Eligibility determinations are estimates based on the information you provided
        and publicly available program rules. Always verify with the program agency before applying.
      </p>
    </div>
  )
}

function ResultCard({ result }: { result: EligibilityResult }) {
  const borderColor = result.eligible === true
    ? 'border-l-[var(--color-success)]'
    : 'border-l-[var(--color-warning)]'

  return (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${borderColor}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-bold">{result.displayName}</h3>
        {result.estimatedBenefit && (
          <span className="text-[var(--color-success)] font-bold whitespace-nowrap ml-4">
            {result.estimatedBenefit}
          </span>
        )}
      </div>

      {result.notes && (
        <p className="text-gray-600 text-sm mb-3">{result.notes}</p>
      )}

      <div className="text-sm space-y-1">
        <p>
          <strong>How to apply:</strong> {result.howToApply}
        </p>
        <p>
          <strong>Apply online:</strong>{' '}
          <a href={result.applyUrl} target="_blank" rel="noopener noreferrer" className="underline">
            {result.applyUrl}
          </a>
        </p>
        {result.applyInPerson && (
          <p><strong>In person:</strong> {result.applyInPerson}</p>
        )}
        <p className="text-gray-400 text-xs mt-2">
          <strong>Citation:</strong> {result.citation}
        </p>
      </div>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-8">Loading results...</div>}>
      <ResultsContent />
    </Suspense>
  )
}
