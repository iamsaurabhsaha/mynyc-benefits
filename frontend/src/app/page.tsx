import Link from 'next/link'

const lifeEvents = [
  { label: 'I lost my job', href: '/screener?event=lost_job', icon: 'work_off', desc: 'Find unemployment insurance and job placement services.' },
  { label: "I'm having a baby", href: '/screener?event=baby', icon: 'child_care', desc: 'Access prenatal care, childcare vouchers, and WIC support.' },
  { label: 'I need food help', href: '/screener?event=food', icon: 'restaurant', desc: 'Apply for SNAP benefits and emergency food assistance.' },
  { label: 'I need healthcare', href: '/screener?event=healthcare', icon: 'medical_services', desc: 'Affordable health insurance plans and community clinics.' },
  { label: "I'm retiring", href: '/screener?event=retiring', icon: 'elderly', desc: 'Social security help, senior housing, and pharmaceutical aid.' },
  { label: 'I need help with rent', href: '/screener?event=rent', icon: 'home', desc: 'Rent freeze programs, Section 8, and eviction prevention.' },
]

const categories = [
  {
    name: 'Food', icon: 'fastfood',
    programs: [
      { name: 'SNAP (Food Stamps)', desc: 'Electronic benefits to buy food at grocery stores and markets.', id: 'snap' },
      { name: 'WIC', desc: 'Food and healthcare support for pregnant people and children.', id: 'wic' },
    ]
  },
  {
    name: 'Healthcare', icon: 'health_and_safety',
    programs: [
      { name: 'Medicaid', desc: 'Free or low-cost health coverage for low-income New Yorkers.', id: 'medicaid' },
      { name: 'NYC Care', desc: 'Healthcare for uninsured residents, no immigration requirement.', id: 'nyc_care' },
    ]
  },
  {
    name: 'Tax Credits', icon: 'account_balance',
    programs: [
      { name: 'Earned Income Tax Credit', desc: 'Triple credit in NYC: federal + state + city.', id: 'eitc' },
      { name: 'Child Tax Credit', desc: 'Up to $2,000 per qualifying child.', id: 'ctc' },
    ]
  },
  {
    name: 'Housing', icon: 'apartment',
    programs: [
      { name: 'Section 8', desc: 'Housing Choice Voucher program for private market rentals.', id: 'section8' },
      { name: 'SCRIE / DRIE', desc: 'Rent increase exemptions for seniors and people with disabilities.', id: 'scrie' },
    ]
  },
]

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#f9f9f9] py-24 md:py-32">
        <div className="max-w-[1440px] mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="z-10">
            <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-[-0.03em] mb-8">
              Find NYC Benefits <br /><span className="text-[#00467b]">You Qualify For</span>
            </h1>
            <p className="text-xl md:text-2xl text-[#414750] leading-relaxed mb-10 max-w-xl">
              Check eligibility for 14 federal, state, and city programs — free, no login required. Simple, private, and fast.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/screener"
                className="hero-gradient text-white px-8 py-4 rounded-md text-lg font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 no-underline"
              >
                Start Benefits Screener
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              <Link
                href="/programs"
                className="bg-[#e8e8e8] text-[#00467b] px-8 py-4 rounded-md text-lg font-bold hover:bg-[#e2e2e2] transition-all flex items-center justify-center no-underline"
              >
                Explore All Programs
              </Link>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="aspect-square rounded-full bg-[#d2e4ff] opacity-20 absolute -top-20 -right-20 blur-3xl"></div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="New York City skyline"
              className="rounded-2xl shadow-2xl relative z-10 w-full h-[500px] object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZ8JGN5VBAKMBeYAbguDIzq58b7I_HqIJI8OVLVc36JmCJxzamuo2x_5nmXAOkrsJ_UjJt5iZjeDkAozlmEFYOdv2LHp2Yeqlt7ZafXPkTkGlV5tjrYPbF2IZh6nEUGdsmMzs9iB63sqPdR2Mj4G2RiizKc4wPlQOmra6q1Q9k1b0-LcuWV6Qb5KWoydbMOPD999LTrnCvv6j0x8j4q1ebbGgIKluKG8y-XjAEwhjCD1qVgD5uh4E8wAiBDAj2zprkqELhuIOICENZ"
            />
          </div>
        </div>
      </section>

      {/* Life Events */}
      <section className="bg-[#f3f3f3] py-24">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="mb-16">
            <span className="text-[#00467b] font-bold tracking-widest uppercase text-sm">Getting Started</span>
            <h2 className="text-4xl font-extrabold mt-4">Personalize your search</h2>
            <p className="text-[#414750] text-lg mt-2">Select a life event to see relevant benefits immediately.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {lifeEvents.map(event => (
              <Link
                key={event.label}
                href={event.href}
                className="group bg-white p-8 rounded-xl transition-all duration-300 hover:shadow-[0_32px_64px_rgba(0,0,0,0.08)] text-left flex flex-col justify-between h-64 border-b-4 border-transparent hover:border-[#00467b] no-underline"
              >
                <span className="material-symbols-outlined text-4xl text-[#00467b] mb-4">{event.icon}</span>
                <div>
                  <h3 className="text-2xl font-bold text-[#1a1c1c] mb-2">{event.label}</h3>
                  <p className="text-[#414750]">{event.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-[#f9f9f9] py-24">
        <div className="max-w-[1440px] mx-auto px-8">
          <h2 className="text-4xl font-extrabold mb-16 text-center">Browse Programs by Category</h2>
          <div className="space-y-12">
            {categories.map((cat, i) => (
              <div key={cat.name} className={`flex flex-col lg:flex-row gap-8 lg:gap-16 items-start ${i % 2 === 1 ? 'bg-[#f3f3f3] p-8 rounded-2xl' : ''}`}>
                <div className="lg:w-1/4">
                  <h3 className="text-2xl font-bold text-[#00467b] flex items-center gap-3">
                    <span className="material-symbols-outlined">{cat.icon}</span>
                    {cat.name}
                  </h3>
                </div>
                <div className="lg:w-3/4 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {cat.programs.map(prog => (
                    <Link key={prog.id} href={`/programs/${prog.id}`} className="group no-underline">
                      <h4 className="text-lg font-bold text-[#1a1c1c] group-hover:text-[#00467b] transition-colors">{prog.name}</h4>
                      <p className="text-[#414750] mt-1">{prog.desc}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
