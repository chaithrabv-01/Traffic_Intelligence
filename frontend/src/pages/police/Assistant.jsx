import { useState, useRef, useEffect } from 'react'
import { api } from '../../api'

const POLICE_SUGGESTIONS = [
  'Summarize active traffic risks and critical corridors in Bengaluru right now',
  'Compare vehicle count and traffic density between Video 1 and Video 2',
  'Show pending citizen incident reports requiring police verification',
  'List historical accident hotspots detected by DBSCAN clustering',
  'Explain current congestion on the Outer Ring Road corridor'
]

export default function PoliceAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello, Officer. I am your Traffic Intelligence AI Assistant, connected directly to your urban video analytics database, PostGIS road network corridors, collision risk models, and citizen triage reports. How can I assist your command center today?'
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
          content: res.reply || res.message || 'No response returned from assistant.',
          toolCalls: res.tool_calls || res.tool_call ? [res.tool_call] : null
        }
      ])
    } catch (e) {
      setMessages([
        ...newMsgs,
        {
          role: 'assistant',
          content: `Error contacting Traffic AI Assistant: ${e.message}. Please check your connection or backend configuration.`
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 inline-block animate-pulse"></span>
            Traffic Police Command AI Assistant
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Natural language queries powered by database tool-calling across live video telemetry, DBSCAN hotspots, and incident records.
          </p>
        </div>

        <button
          onClick={() => setMessages([messages[0]])}
          className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition"
        >
          Clear History
        </button>
      </div>

      {/* Suggested Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">Command Prompts:</span>
        {POLICE_SUGGESTIONS.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(s)}
            className="shrink-0 px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs transition"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
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
                  {isUser ? 'Police Command' : 'Traffic AI Engine'}
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

                {/* Display Tool Calling Metadata if returned */}
                {m.toolCalls && m.toolCalls.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400 space-y-1">
                    <div className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      Verified Backend Data Queries:
                    </div>
                    {m.toolCalls.map((tc, tIdx) => (
                      <div key={tIdx} className="font-mono bg-white dark:bg-slate-950 p-1.5 rounded border border-slate-200 dark:border-slate-800">
                        {typeof tc === 'string' ? tc : JSON.stringify(tc)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs italic p-2">
            <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
            Querying telemetry database and running reasoning...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Box */}
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
          placeholder="Ask about traffic conditions, video comparisons, high-risk corridors, or citizen reports..."
          className="flex-1 px-3 py-2 bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  )
}
