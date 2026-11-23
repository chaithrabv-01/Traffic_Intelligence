import { useState, useEffect } from 'react'
import { api } from '../../api'

export default function PredictiveRiskAlerts() {
  const [riskAlerts, setRiskAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSeverity, setSelectedSeverity] = useState('all')

  const loadRiskAlerts = async () => {
    setLoading(true)
    try {
      const data = await api.get('/api/predictive-risks?portal=citizen')
      setRiskAlerts(data || [])
    } catch (e) {
      console.error('Failed to load predictive risk alerts', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRiskAlerts()
  }, [])

  const filteredAlerts = riskAlerts.filter(a => {
    if (selectedSeverity === 'all') return true
    return a.risk_level?.toLowerCase() === selectedSeverity.toLowerCase()
  })

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block animate-ping"></span>
            Predictive Accident Risk Alerts
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Causal machine learning safety predictions derived from vehicle trajectory interactions, near-miss proximity, and velocity differentials.
          </p>
        </div>

        <button
          onClick={loadRiskAlerts}
          className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 font-medium transition"
        >
          Refresh Alerts
        </button>
      </div>

      {/* Distinction & Transparency Notice */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl p-4 text-xs text-amber-900 dark:text-amber-200 space-y-1">
        <div className="font-semibold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Important Distinction: Model-Predicted Risk vs Confirmed Accidents
        </div>
        <p className="text-slate-600 dark:text-amber-300/80 leading-relaxed text-[11px]">
          These alerts reflect <b>predictive hazard models</b> analyzing rapid deceleration, trajectory conflict, and low Time-To-Collision (TTC) interactions observed in traffic footage. They indicate corridors requiring defensive driving and reduced speed, <b>not confirmed physical collisions</b>. All alerts are reviewed and verified by Traffic Police before publication.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Risk Severity:</span>
          {['all', 'critical', 'high', 'moderate', 'low'].map(s => (
            <button
              key={s}
              onClick={() => setSelectedSeverity(s)}
              className={`px-2.5 py-1 rounded-lg font-medium capitalize transition ${
                selectedSeverity === s
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="text-slate-400 text-[11px]">
          Showing {filteredAlerts.length} verified risk forecast{filteredAlerts.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* List of Risk Alerts */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading predictive accident risk alerts...</div>
      ) : filteredAlerts.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
          No predictive risk alerts currently match your filter. Corridors are currently showing normal interaction dynamics.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map(a => {
            const isHighOrCritical = ['high', 'critical'].includes(a.risk_level?.toLowerCase())
            return (
              <div
                key={a.id}
                className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border shadow-sm transition space-y-3 ${
                  isHighOrCritical
                    ? 'border-red-300 dark:border-red-900 ring-1 ring-red-200 dark:ring-red-900/40'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          a.risk_level?.toLowerCase() === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                          a.risk_level?.toLowerCase() === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' :
                          a.risk_level?.toLowerCase() === 'moderate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300' :
                          'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {a.risk_level} Risk Level
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Alert #{a.id} &bull; Recorded Video #{a.video_id || 'Corridor'}
                      </span>
                    </div>

                    <h2 className="text-sm font-bold text-slate-900 dark:text-white pt-1">
                      {a.location}
                    </h2>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                    Authority: {a.review_status || 'Approved'}
                  </span>
                </div>

                {/* Explanation */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <span className="font-semibold text-slate-900 dark:text-white">Interaction Dynamics: </span>
                  {a.explanation}
                </div>

                {/* Safety Recommendation */}
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs space-y-0.5">
                  <span className="font-semibold text-emerald-900 dark:text-emerald-300">Safety Recommendation:</span>
                  <p className="text-emerald-800 dark:text-emerald-200 text-[11px]">
                    {a.safety_recommendation || 'Maintain safe following distance, reduce speed, and remain alert for merging traffic.'}
                  </p>
                </div>

                {/* Metadata */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                  <div>
                    Prediction Timestamp: <b>{a.timestamp_sec ? `${a.timestamp_sec.toFixed(1)}s into recording` : 'Continuous'}</b>
                  </div>
                  <div>
                    Evaluated: <b>{a.created_at || 'Recently'}</b> &bull; Status: <b className="text-emerald-600 dark:text-emerald-400">{a.is_public ? 'Active Public Advisory' : 'Under Review'}</b>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
