import Link from 'next/link'
import { allPrograms } from '../../lib/data/programs'

const categoryLabels: Record<string, string> = {
  food: 'Food Assistance',
  healthcare: 'Healthcare',
  tax_credit: 'Tax Credits',
  housing: 'Housing',
  energy: 'Energy',
  other: 'Other',
}

export default function ProgramsPage() {
  const categories = [...new Set(allPrograms.map(p => p.category))]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">NYC Benefits Programs</h1>
      <p className="text-gray-600 mb-8">
        14 federal, state, and city programs available to NYC residents.
      </p>

      {categories.map(cat => (
        <section key={cat} className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-[var(--color-primary)]">
            {categoryLabels[cat] ?? cat}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {allPrograms.filter(p => p.category === cat).map(p => (
              <Link
                key={p.program}
                href={`/programs/${p.program}`}
                className="bg-white rounded-lg shadow p-5 no-underline text-[var(--color-text)] hover:shadow-lg transition-shadow"
              >
                <h3 className="font-bold text-lg mb-1">{p.display_name}</h3>
                <p className="text-sm text-gray-600 mb-2">{p.description}</p>
                <p className="text-xs text-gray-400">
                  {p.agency}{p.local_agency ? ` / ${p.local_agency}` : ''}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
