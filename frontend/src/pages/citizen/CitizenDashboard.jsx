import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'

export default function CitizenDashboard() {
  const [stats, setStats] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [recentVerified, setRecentVerified] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPublicData()
  }, [])

  const loadPublicData = async () => {
    setLoading(true)
    try {
      const [statsRes, alertsRes, incRes] = await Promise.allSettled([
        api.get('/api/dashboard/stats'),
        api.get('/api/alerts?portal=citizen&active_only=true'),
        api.get('/api/incidents?portal=citizen')
      ])

      if (statsRes.status === 'fulfilled') setStats(statsRes.value)
      if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value || [])
      if (incRes.status === 'fulfilled') setRecentVerified((incRes.value || []).slice(0, 4))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Citizen Road Safety Portal &bull; Bengaluru
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Safe Roads Bengaluru
          </h1>
          <p className="text-xs text-blue-100 max-w-2xl leading-relaxed">
            Stay informed with verified city traffic advisories, view road safety hazards, track public road conditions, and report community hazards directly to traffic police for rapid verification.
          </p>

          <div className="pt-2 flex flex-wrap gap-2 text-xs">
            <Link
              to="/citizen/report"
              className="px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-xl font-bold shadow-sm transition flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Report a Road Hazard
            </Link>
            <Link
              to="/citizen/map"
              className="px-4 py-2 bg-blue-800/60 hover:bg-blue-800 text-white rounded-xl font-semibold border border-white/20 transition"
            >
              View Safety Map
            </Link>
            <Link
              to="/citizen/predictive-risks"
              className="px-4 py-2 bg-amber-500/80 hover:bg-amber-500 text-white rounded-xl font-semibold transition"
            >
              ⚠️ Collision Risk Alerts
            </Link>
          </div>
        </div>
      </div>

      {/* Real-time Broadcast Alerts Banner */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-amber-950 dark:text-amber-200 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping inline-block"></span>
              Active Police Safety Advisories ({alerts.length})
            </h2>
            <span className="text-xs text-amber-800 dark:text-amber-300 font-semibold">
              Broadcasted from Command Center
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.slice(0, 2).map(a => (
              <div key={a.id} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-amber-200 dark:border-amber-900/50 shadow-xs space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">{a.title}</span>
                  <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded">
                    {a.severity}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">{a.description}</p>
                <div className="text-[10px] text-slate-400">Location: {a.location}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Public Statistics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase">Analyzed Corridors</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats?.analyzed_locations_count || 12}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Active camera monitoring</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase">Vehicles Tracked</span>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {stats?.total_detected_vehicles?.toLocaleString() || 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">YOLO + ByteTrack counted</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase">Verified Incidents</span>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {stats?.verified_incidents || 0}
          </div>
          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">Police confirmed &amp; routed</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase">Active Police Alerts</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {alerts.length}
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Live road safety advisories</div>
        </div>
      </div>

      {/* Citizen Safety Tools Grid */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white">Explore Public Safety Services</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <Link
            to="/citizen/map"
            className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition group space-y-1"
          >
            <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 flex items-center justify-between">
              <span>Traffic &amp; Safety Map</span>
              <span>&rarr;</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              Interactive map with high-risk corridors, verified hazards, and community reports.
            </p>
          </Link>

          <Link
            to="/citizen/predictive-risks"
            className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/50 hover:border-amber-500 transition group space-y-1"
          >
            <div className="font-bold text-sm text-amber-900 dark:text-amber-300 group-hover:text-amber-600 flex items-center justify-between">
              <span>Predictive Risk Alerts</span>
              <span>&rarr;</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              AI-identified near-miss interactions and safety advisories reviewed by traffic police.
            </p>
          </Link>

          <Link
            to="/citizen/nearby-safety"
            className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-500 transition group space-y-1"
          >
            <div className="font-bold text-sm text-emerald-900 dark:text-emerald-300 group-hover:text-emerald-600 flex items-center justify-between">
              <span>Nearby Safety &amp; Corridors</span>
              <span>&rarr;</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Corridor safety scores, active speed limits, and verified road hazards.
            </p>
          </Link>

          <Link
            to="/citizen/forecast"
            className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-200 dark:border-indigo-900/50 hover:border-indigo-500 transition group space-y-1"
          >
            <div className="font-bold text-sm text-indigo-900 dark:text-indigo-300 group-hover:text-indigo-600 flex items-center justify-between">
              <span>24h Congestion Forecast</span>
              <span>&rarr;</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Plan your travel around anticipated peak hours and avoid bottleneck gridlocks.
            </p>
          </Link>

          <Link
            to="/citizen/trends"
            className="p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-900/50 hover:border-purple-500 transition group space-y-1"
          >
            <div className="font-bold text-sm text-purple-900 dark:text-purple-300 group-hover:text-purple-600 flex items-center justify-between">
              <span>Traffic Trends &amp; Telemetry</span>
              <span>&rarr;</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Aggregated vehicle type distribution, diurnal volume rhythms, and corridor flow.
            </p>
          </Link>

          <Link
            to="/citizen/assistant"
            className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/50 hover:border-blue-500 transition group space-y-1"
          >
            <div className="font-bold text-sm text-blue-900 dark:text-blue-300 group-hover:text-blue-600 flex items-center justify-between">
              <span>Citizen AI Assistant</span>
              <span>&rarr;</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Ask questions about road conditions, travel advisories, and community hazards.
            </p>
          </Link>
        </div>
      </div>

      {/* Recent Verified Hazards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Recently Verified Road Conditions
          </h3>
          <Link to="/citizen/map" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
            View on Map &rarr;
          </Link>
        </div>

        {recentVerified.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-700 text-xs text-slate-400">
            No recent verified hazard reports at this time.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentVerified.map(r => (
              <div
                key={r.id}
                className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white capitalize">{r.category}</span>
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {r.status}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{r.description}</p>
                  <div className="text-[10px] text-slate-400">
                    Location: <b>{r.location_name || 'Mapped Coordinate'}</b> &bull; {r.created_at}
                  </div>
                </div>

                {r.photo && (
                  <img
                    src={r.photo}
                    alt="Hazard Evidence"
                    className="w-16 h-16 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
