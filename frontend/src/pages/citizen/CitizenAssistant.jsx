import { useState, useRef, useEffect } from 'react'
import { api } from '../../api'

const CITIZEN_SUGGESTIONS = [
  'Explain traffic conditions from Silk Board to Marathahalli on Outer Ring Road',
  'Are there any active traffic police advisories or road closures today?',
  'What is the safety and accident history along Hosur Road?',
  'When is the best time to commute through Hebbal Flyover to avoid congestion?'
]

export default function CitizenAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your Bengaluru Citizen Traffic & Safety Assistant. Ask me about corridor traffic conditions, accident history, active police safety advisories, or road hazards along your travel route.'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async (textToSend) => {
    const query = textToSend || input
    if (!query.trim() || loading) return

    const newMsgs = [...messages, { role: 'user', content: query }]
    setMessages(newMsgs)
    setInput('')
    setLoading(true)

    try {
      const res = await api.post('/api/assistant', { message: query })
      setMessages([
        ...newMsgs,
        {
          role: 'assistant',
          content: res.reply || res.message || 'No response returned from traffic assistant.'
        }
      ])
    } catch (e) {
      setMessages([
        ...newMsgs,
        {
          role: 'assistant',
          content: `Unable to connect to traffic intelligence assistant: ${e.message}.`
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 inline-block"></span>
            Citizen Road Safety &amp; Corridor AI Assistant
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Get factual traffic explanations, high-risk corridor awareness, and verified road safety updates.
          </p>
        </div>

        <button
          onClick={() => setMessages([messages[0]])}
          className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition"
        >
          Reset
        </button>
      </div>

      {/* Suggested Questions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">Common Inquiries:</span>
        {CITIZEN_SUGGESTIONS.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(s)}
            className="shrink-0 px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs transition"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm overflow-y-auto space-y-4 text-xs">
        {messages.map((m, idx) => {
          const isUser = m.role === 'user'
          return (
            <div
              key={idx}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  {isUser ? 'You' : 'Traffic Assistant'}
                </span>
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            </div>
          )
        })}

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs italic p-2">
            <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
            Checking verified corridor data and advisories...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSend()
        }}
        className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about traffic conditions between any two areas, accident hotspots, or advisories..."
          className="flex-1 px-3 py-2 bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-40"
        >
          Ask
        </button>
      </form>
    </div>
  )
}
