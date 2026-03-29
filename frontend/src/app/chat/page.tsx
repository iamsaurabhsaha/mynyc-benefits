'use client'

import { useState, useRef, useEffect } from 'react'
import staticQA from '../../data/static-qa.json'

interface Message {
  role: 'user' | 'assistant'
  content: string
  source?: string
}

function normalizeQuestion(q: string): string {
  return q.toLowerCase().replace(/[^\w\s]/g, ' ').trim()
}

function matchStaticQA(question: string): { answer: string; source: string } | null {
  const normalized = normalizeQuestion(question)
  const queryWords = new Set(normalized.split(/\s+/).filter(w => w.length > 1))

  let bestScore = 0
  let bestAnswer: string | null = null

  for (const entry of staticQA.entries) {
    for (const pattern of entry.patterns) {
      const patternNorm = normalizeQuestion(pattern)
      const patternWords = new Set(patternNorm.split(/\s+/).filter(w => w.length > 1))
      const intersection = [...queryWords].filter(w => patternWords.has(w))
      const union = new Set([...queryWords, ...patternWords])
      const score = union.size > 0 ? intersection.length / union.size : 0

      if (score > bestScore) {
        bestScore = score
        bestAnswer = entry.answer
      }
    }
  }

  if (bestScore >= 0.4 && bestAnswer) {
    return { answer: bestAnswer, source: 'static' }
  }

  return null
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    if (!input.trim()) return
    const question = input.trim()
    setInput('')

    const userMsg: Message = { role: 'user', content: question }
    const match = matchStaticQA(question)

    const assistantMsg: Message = match
      ? { role: 'assistant', content: match.answer, source: match.source }
      : {
          role: 'assistant',
          content: "I don't have a pre-generated answer for that question yet. Try asking about a specific program (like \"What is SNAP?\") or a life event (like \"I lost my job\").\n\nYou can also use the [Benefits Screener](/screener) for a personalized eligibility check.",
          source: 'fallback',
        }

    setMessages(prev => [...prev, userMsg, assistantMsg])
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col h-[calc(100vh-200px)]">
      <h1 className="text-2xl font-bold mb-2">Chat</h1>
      <p className="text-gray-600 mb-4 text-sm">
        Ask about NYC benefits programs. Answers come from pre-generated content — no AI cost.
      </p>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white rounded-lg shadow p-4 space-y-4 mb-4">
        {messages.length === 0 && (
          <div className="text-gray-400 text-center py-12">
            <p className="text-lg mb-4">Ask me anything about NYC benefits</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['What is SNAP?', 'I lost my job', 'Benefits for seniors', 'What is Fair Fares?'].map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600 hover:bg-gray-200"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                msg.role === 'user'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-gray-100 text-[var(--color-text)]'
              }`}
            >
              {msg.role === 'assistant' && msg.source && (
                <span className="text-xs text-gray-400 block mb-1">[{msg.source}]</span>
              )}
              <div className="whitespace-pre-wrap text-sm" dangerouslySetInnerHTML={{
                __html: msg.content
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="underline" target="_blank">$1</a>')
                  .replace(/\n/g, '<br>')
              }} />
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask about NYC benefits..."
          className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:border-[var(--color-primary)] focus:outline-none"
        />
        <button
          onClick={handleSend}
          className="px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg font-semibold hover:bg-[var(--color-primary-dark)]"
        >
          Send
        </button>
      </div>
    </div>
  )
}
