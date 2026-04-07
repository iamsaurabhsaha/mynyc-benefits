import type { Metadata } from "next"
import "./globals.css"
import Link from "next/link"

export const metadata: Metadata = {
  title: "MyNYC Benefits — Find NYC Government Benefits",
  description: "Free eligibility screener for NYC government benefits. Check what federal, state, and city programs you qualify for.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-[#f9f9f9] text-[#1a1c1c] font-['Public_Sans']">
        <header className="sticky top-0 z-50 bg-[#f9f9f9] shadow-[0_8px_32px_rgba(26,28,28,0.06)]">
          <nav className="flex justify-between items-center w-full px-8 py-4 max-w-[1440px] mx-auto">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-2xl font-bold tracking-tight text-[#1a1c1c] no-underline">
                MyNYC Benefits
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <Link href="/screener" className="text-[#1a1c1c] opacity-80 hover:opacity-100 tracking-[-0.02em] transition-colors duration-200 no-underline">Screener</Link>
                <Link href="/programs" className="text-[#1a1c1c] opacity-80 hover:opacity-100 tracking-[-0.02em] transition-colors duration-200 no-underline">Programs</Link>
                <Link href="/chat" className="text-[#1a1c1c] opacity-80 hover:opacity-100 tracking-[-0.02em] transition-colors duration-200 no-underline">Help</Link>
              </div>
            </div>
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="bg-[#eeeeee]">
          <div className="w-full px-8 py-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[1440px] mx-auto">
            <div>
              <div className="text-lg font-semibold text-[#1a1c1c] mb-4">MyNYC Benefits</div>
              <p className="text-[#1a1c1c] opacity-70 text-sm leading-relaxed max-w-sm">
                Connecting New Yorkers to essential services and financial support. Free, open-source, and built with accessibility in mind.
              </p>
              <p className="mt-6 text-[#1a1c1c] opacity-70 text-sm">
                Open source under{" "}
                <a href="https://github.com/iamsaurabhsaha/mynyc-benefits" className="hover:text-[#005EA2] hover:underline">MIT License</a>.
                This is a screening tool, not legal advice.
              </p>
            </div>
            <div className="flex flex-col md:items-end justify-between gap-6">
              <nav className="flex flex-wrap gap-6 md:gap-8">
                <Link href="/programs" className="text-[#1a1c1c] opacity-70 hover:text-[#005EA2] hover:underline decoration-2 transition-all text-sm no-underline">Programs</Link>
                <Link href="/screener" className="text-[#1a1c1c] opacity-70 hover:text-[#005EA2] hover:underline decoration-2 transition-all text-sm no-underline">Screener</Link>
                <Link href="/chat" className="text-[#1a1c1c] opacity-70 hover:text-[#005EA2] hover:underline decoration-2 transition-all text-sm no-underline">Help Chat</Link>
                <a href="https://github.com/iamsaurabhsaha/mynyc-benefits" className="text-[#1a1c1c] opacity-70 hover:text-[#005EA2] hover:underline decoration-2 transition-all text-sm no-underline">GitHub</a>
              </nav>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
