'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { Household, createDefaultHousehold, EligibilityResult } from '../../lib/eligibility/types'
import { checkEligibility } from '../../lib/eligibility/engine'

function ResultsContent() {
  const searchParams = useSearchParams()
  const dataParam = searchParams.get('data')

  let household: Household
  try { household = dataParam ? JSON.parse(decodeURIComponent(dataParam)) : createDefaultHousehold() }
  catch { household = createDefaultHousehold() }

  const results = checkEligibility(household)
  const eligible = results.filter(r => r.eligible === true)
  const maybe = results.filter(r => r.eligible === null)
  const notEligible = results.filter(r => r.eligible === false)

  return (
    <div className="min-h-screen">
      {/* Household Summary */}
      <section className="bg-[#eeeeee] py-12 px-8">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <p className="text-[#00467b] font-bold uppercase tracking-widest text-xs">Summary of Results</p>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Your Benefits Results</h1>
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <span className="material-symbols-outlined text-[#00467b]" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
                <span className="font-medium">{household.householdSize} {household.householdSize === 1 ? 'person' : 'people'}</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <span className="material-symbols-outlined text-[#00467b]" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                <span className="font-medium">${household.annualIncome.toLocaleString()}/year</span>
              </div>
              {household.borough && (
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                  <span className="material-symbols-outlined text-[#00467b]" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                  <span className="font-medium">{household.borough === 'staten_island' ? 'Staten Island' : household.borough.charAt(0).toUpperCase() + household.borough.slice(1)}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => window.print()}
              className="flex items-center gap-2 px-6 py-3 bg-[#e8e8e8] text-[#00467b] font-bold rounded-md hover:bg-[#e2e2e2] transition-colors">
              <span className="material-symbols-outlined">print</span> Print Results
            </button>
            <Link href="/screener"
              className="flex items-center gap-2 px-6 py-3 bg-[#e8e8e8] text-[#414750] font-bold rounded-md hover:bg-[#e2e2e2] transition-colors no-underline">
              <span className="material-symbols-outlined">refresh</span> Start Over
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-[1440px] mx-auto px-8 py-16 space-y-20">
        {/* Eligible */}
        {eligible.length > 0 && (
          <section>
            <div className="flex items-center gap-4 mb-10 border-l-8 border-[#2E7D32] pl-6 py-2">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight">You likely qualify for {eligible.length} program{eligible.length !== 1 ? 's' : ''}</h2>
                <p className="text-[#414750] text-lg">Based on your answers, we recommend applying for these first.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {eligible.map(r => <EligibleCard key={r.program} result={r} />)}
            </div>
          </section>
        )}

        {/* Maybe */}
        {maybe.length > 0 && (
          <section>
            <div className="flex items-center gap-4 mb-8 border-l-8 border-[#FBC02D] pl-6 py-2">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight">You may qualify for these programs</h2>
                <p className="text-[#414750] text-lg">Additional information or a formal application is needed to confirm.</p>
              </div>
            </div>
            <div className="space-y-4">
              {maybe.map(r => <MaybeCard key={r.program} result={r} />)}
            </div>
          </section>
        )}

        {/* Not eligible */}
        {notEligible.length > 0 && (
          <section>
            <details className="group bg-[#f3f3f3] rounded-xl overflow-hidden">
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none hover:bg-[#e8e8e8] transition-colors">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-[#717782]">info</span>
                  <h2 className="text-xl font-bold text-[#414750]">Programs you are likely not eligible for ({notEligible.length})</h2>
                </div>
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="p-8 space-y-6 bg-white">
                <div className="grid md:grid-cols-2 gap-8">
                  {notEligible.map(r => (
                    <div key={r.program} className="opacity-60">
                      <h4 className="font-bold flex items-center gap-2">
                        {r.displayName}
                        <span className="material-symbols-outlined text-sm">block</span>
                      </h4>
                      {r.notes && <p className="text-sm text-[#414750] mt-1">{r.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </details>
          </section>
        )}
      </div>

      {/* Disclaimer */}
      <div className="max-w-[1440px] mx-auto px-8 pb-16">
        <p className="text-sm text-[#414750] p-6 bg-[#f3f3f3] rounded-xl">
          <strong>Disclaimer:</strong> This is a screening tool, not legal advice.
          Eligibility determinations are estimates based on the information you provided
          and publicly available program rules. Always verify with the program agency.
        </p>
      </div>
    </div>
  )
}

function EligibleCard({ result }: { result: EligibilityResult }) {
  return (
    <div className="bg-white p-8 rounded-xl shadow-sm flex flex-col justify-between h-full border-t-4 border-[#2E7D32]">
      <div>
        <div className="flex justify-between items-start mb-6">
          <span className="material-symbols-outlined text-4xl text-[#00467b]">check_circle</span>
          <span className="bg-green-100 text-[#1B5E20] text-xs font-bold px-3 py-1 rounded-full uppercase">
            {result.confidence === 'high' ? 'High Match' : 'Likely'}
          </span>
        </div>
        <h3 className="text-2xl font-bold mb-2">{result.displayName}</h3>
        {result.estimatedBenefit && (
          <div className="text-4xl font-black text-[#00467b] mb-4">
            {result.estimatedBenefit}
          </div>
        )}
        <p className="text-[#414750] leading-relaxed mb-4">{result.howToApply}</p>
        {result.notes && <p className="text-sm text-[#414750] mb-4">{result.notes}</p>}
        <div className="bg-[#f3f3f3] p-4 rounded-lg mb-8">
          <p className="text-xs font-mono text-[#414750] leading-tight">Citation: {result.citation}</p>
        </div>
      </div>
      <a href={result.applyUrl} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center justify-center w-full hero-gradient text-white py-4 rounded-md font-bold text-lg hover:shadow-lg transition-all group no-underline">
        Apply Now
        <span className="material-symbols-outlined ml-2 group-hover:translate-x-1 transition-transform">arrow_forward</span>
      </a>
    </div>
  )
}

function MaybeCard({ result }: { result: EligibilityResult }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-lg shadow-sm border-l-4 border-[#FBC02D] gap-6">
      <div className="flex gap-6 items-center">
        <span className="material-symbols-outlined text-3xl text-[#4a607c]">help</span>
        <div>
          <h4 className="text-xl font-bold">{result.displayName}</h4>
          <p className="text-[#414750]">{result.notes || result.howToApply}</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right hidden md:block">
          <p className="text-xs font-mono text-[#414750]">{result.citation}</p>
        </div>
        <a href={result.applyUrl} target="_blank" rel="noopener noreferrer"
          className="bg-[#e8e8e8] text-[#00467b] px-6 py-2 rounded-md font-bold hover:bg-[#e2e2e2] transition-all no-underline whitespace-nowrap">
          Learn More
        </a>
      </div>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-8 py-16">Loading results...</div>}>
      <ResultsContent />
    </Suspense>
  )
}
