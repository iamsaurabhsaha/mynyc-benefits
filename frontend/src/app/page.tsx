import Link from 'next/link'

const lifeEvents = [
  { label: 'I lost my job', href: '/screener?event=lost_job' },
  { label: "I'm having a baby", href: '/screener?event=baby' },
  { label: 'I need food help', href: '/screener?event=food' },
  { label: 'I need healthcare', href: '/screener?event=healthcare' },
  { label: "I'm retiring", href: '/screener?event=retiring' },
  { label: 'I need help with rent', href: '/screener?event=rent' },
]

export default function HomePage() {
  return (
    <div>
      <section className="bg-[var(--color-primary-dark)] text-white py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Find NYC Benefits You Qualify For</h1>
          <p className="text-xl mb-8 text-gray-200">
            Check your eligibility for 14 federal, state, and city programs — with
            direct links to apply and citations to actual law.
          </p>
          <Link
            href="/screener"
            className="inline-block bg-white text-[var(--color-primary-dark)] px-8 py-4 rounded font-bold text-lg no-underline hover:bg-gray-100"
          >
            Start Benefits Screener
          </Link>
          <p className="mt-4 text-sm text-gray-300">
            Free. No login required. No personal data stored.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6 text-center">What is happening in your life?</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {lifeEvents.map(event => (
            <Link
              key={event.label}
              href={event.href}
              className="bg-white p-6 rounded-lg shadow text-center no-underline text-[var(--color-text)] hover:shadow-lg hover:scale-105 transition-transform"
            >
              <div className="font-semibold">{event.label}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 text-center">Programs We Screen For</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-lg mb-2">Federal (as applied in NY)</h3>
              <ul className="space-y-1 text-gray-700">
                <li>SNAP — Food assistance (up to $1,756/month)</li>
                <li>Medicaid &amp; Essential Plan — Free/low-cost healthcare</li>
                <li>EITC — Triple tax credit in NYC</li>
                <li>Child Tax Credit — $2,000 per child</li>
                <li>WIC — Nutrition for mothers &amp; children</li>
                <li>Section 8 / NYCHA — Housing assistance</li>
                <li>HEAP — Energy/heating assistance</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">NYC-Specific</h3>
              <ul className="space-y-1 text-gray-700">
                <li>Fair Fares — Half-price MetroCard</li>
                <li>NYC Care — Healthcare for uninsured</li>
                <li>GetFoodNYC — Free food resources</li>
                <li>IDNYC — Free municipal ID</li>
                <li>NYC Free Tax Prep — Free tax filing</li>
                <li>SCRIE — Senior rent freeze</li>
                <li>DRIE — Disability rent freeze</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl mb-3 font-bold text-[var(--color-primary)]">1</div>
            <h3 className="font-bold mb-2">Answer a Few Questions</h3>
            <p className="text-gray-600">Household size, income, borough, age. Takes about 2 minutes.</p>
          </div>
          <div>
            <div className="text-4xl mb-3 font-bold text-[var(--color-primary)]">2</div>
            <h3 className="font-bold mb-2">See Your Results</h3>
            <p className="text-gray-600">Programs you likely qualify for with estimated benefits.</p>
          </div>
          <div>
            <div className="text-4xl mb-3 font-bold text-[var(--color-primary)]">3</div>
            <h3 className="font-bold mb-2">Apply Directly</h3>
            <p className="text-gray-600">Direct links to ACCESS HRA, NY State of Health, and more.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
