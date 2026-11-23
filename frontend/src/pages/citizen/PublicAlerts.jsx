import { useState, useEffect } from 'react'
import { api } from '../../api'

export default function PublicAlerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState(null)

  const loadAlerts = async () => {
    setLoading(true)
    try {
      const data = await api.get('/api/alerts?portal=citizen&active_only=true')
      setAlerts(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAlerts()
  }, [])

  const handleCopyAlert = (alert) => {
    const text = `[Traffic Police Advisory] ${alert.title}\nSeverity: ${alert.severity}\nLocation: ${alert.location}\nDetails: ${alert.description}`
    navigator.clipboard?.writeText(text)
    setCopiedId(alert.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block animate-ping"></span>
            Official Traffic Police Public Advisories &amp; Alerts
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time road safety bulletins, severe accident notices, and traffic diversion advisories broadcasted by Bengaluru Traffic Police.
          </p>
        </div>

        <button
          onClick={loadAlerts}
          className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 font-medium transition"
        >
          Refresh Feed
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading active public advisories...</div>
      ) : alerts.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto font-bold text-lg">
            &check;
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">All Corridors Operating Under Normal Conditions</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            There are no active emergency alerts or road closures broadcasted by traffic police at this time.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map(a => (
            <div
              key={a.id}
              className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border shadow-sm transition space-y-3 ${
                a.severity === 'Critical'
                  ? 'border-red-300 dark:border-red-900 ring-1 ring-red-200 dark:ring-red-900/40'
                  : 'border-amber-200 dark:border-amber-900/50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        a.severity === 'Critical' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                        a.severity === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' :
                        a.severity === 'Moderate' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {a.severity} Priority
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold">{a.category}</span>
                  </div>

                  <h2 className="text-base font-bold text-slate-900 dark:text-white pt-1">
                    {a.title}
                  </h2>
                </div>

                <button
                  onClick={() => handleCopyAlert(a)}
                  className="px-2.5 py-1 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-xs rounded-lg border border-slate-200 dark:border-slate-700 transition"
                >
                  {copiedId === a.id ? 'Copied!' : 'Share / Copy'}
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {a.description}
              </p>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <div>
                  Affected Area: <b className="text-slate-800 dark:text-slate-200">{a.location}</b>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <span>Issued: {a.created_at || 'Recently'}</span>
                  {a.expires_at && <span>Valid Until: {a.expires_at}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
