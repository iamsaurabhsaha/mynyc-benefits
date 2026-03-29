import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "MyNYC Benefits — Find NYC Government Benefits",
  description: "Free eligibility screener for NYC government benefits. Check what federal, state, and city programs you qualify for — with citations to actual law.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        <header className="bg-[var(--color-primary-dark)] text-white">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="text-white no-underline text-xl font-bold hover:text-gray-200">
              MyNYC Benefits
            </a>
            <nav className="flex gap-6 text-sm">
              <a href="/screener" className="text-white no-underline hover:text-gray-200">Screener</a>
              <a href="/programs" className="text-white no-underline hover:text-gray-200">Programs</a>
              <a href="/chat" className="text-white no-underline hover:text-gray-200">Chat</a>
            </nav>
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>

        <footer className="bg-[var(--color-text)] text-gray-400 text-sm">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <p className="mb-2">
              <strong className="text-white">Disclaimer:</strong> This is a screening tool, not legal advice.
              Always verify eligibility with the program agency. Thresholds may change.
            </p>
            <p>
              Open source under MIT License.{" "}
              <a href="https://github.com/iamsaurabhsaha/mynyc-benefits" className="text-gray-300 hover:text-white">
                GitHub
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
