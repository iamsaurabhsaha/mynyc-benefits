import Link from 'next/link'
import { allPrograms, getProgram } from '../../../lib/data/programs'
import { notFound } from 'next/navigation'

export function generateStaticParams() {
  return allPrograms.map(p => ({ id: p.program }))
}

export default async function ProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const program = getProgram(id)
  if (!program) notFound()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/programs" className="text-sm text-[var(--color-primary)] mb-4 inline-block">
        &larr; All Programs
      </Link>

      <h1 className="text-3xl font-bold mb-2">{program.display_name}</h1>
      <p className="text-gray-600 mb-6">{program.description}</p>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <h2 className="font-bold text-lg mb-2">Agency</h2>
          <p>{program.agency}</p>
          {program.local_agency && <p className="text-gray-600">{program.local_agency}</p>}
        </div>

        <div>
          <h2 className="font-bold text-lg mb-2">Eligibility</h2>
          <ul className="space-y-1">
            {Object.entries(program.eligibility).map(([key, value]) => (
              <li key={key} className="text-sm">
                <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong>{' '}
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-bold text-lg mb-2">How to Apply</h2>
          <p>{program.how_to_apply}</p>
          <p className="mt-2">
            <strong>Online:</strong>{' '}
            <a href={program.apply_url} target="_blank" rel="noopener noreferrer" className="underline">
              {program.apply_url}
            </a>
          </p>
          {program.apply_in_person && (
            <p className="mt-1"><strong>In person:</strong> {program.apply_in_person}</p>
          )}
        </div>

        <div className="border-t pt-4 text-sm text-gray-500">
          <p><strong>Legal citation:</strong> {program.citation}</p>
          <p className="mt-1">
            <strong>Source:</strong>{' '}
            <a href={program.source_url} target="_blank" rel="noopener noreferrer" className="underline">
              {program.source_url}
            </a>
          </p>
          <p className="mt-1"><strong>Last verified:</strong> {program.last_verified}</p>
          <p className="mt-1"><strong>Update frequency:</strong> {program.update_frequency}</p>
        </div>
      </div>

      <div className="mt-6">
        <Link
          href="/screener"
          className="inline-block px-6 py-3 rounded bg-[var(--color-primary)] text-white font-semibold no-underline hover:bg-[var(--color-primary-dark)]"
        >
          Check Your Eligibility
        </Link>
      </div>
    </div>
  )
}
