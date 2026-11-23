import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'

export default function PoliceDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    const fetchStats = () => {
      api.get('/api/dashboard/stats')
        .then(d => setStats(d))
        .catch(e => setErr(e.message))
        .finally(() => setLoading(false))
    }
    fetchStats()
    const timer = setInterval(fetchStats, 4000)
    return () => clearInterval(timer)
  }, [])

  const dist = stats?.traffic_distribution || { 'Low Traffic': 0, 'Medium Traffic': 0, 'High Traffic': 0 }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>Traffic Police Command Overview</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Dynamic municipal traffic intelligence, video telemetry, accident risk monitoring, and citizen incident triage.
        </p>
      </div>

      {err && (
        <div className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-lg text-xs">
          {err}
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Analysed Videos</div>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            {stats?.total_analyzed_videos ?? '-'}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Across {stats?.analyzed_locations_count ?? 0} unique corridor locations
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Tracked Vehicles</div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {stats?.total_detected_vehicles?.toLocaleString() ?? '-'}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            ByteTrack unique vehicle trajectories
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Potential Risk Events</div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {stats?.total_risk_events ?? '-'}
          </div>
          <div className="text-[10px] text-red-500 font-semibold mt-1">
            {stats?.high_critical_risk_events ?? 0} High / Critical interactions
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Citizen Reports</div>
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
            {stats?.pending_citizen_reports ?? '-'}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            {stats?.verified_incidents ?? 0} verified &bull; {stats?.active_public_alerts ?? 0} active alerts
          </div>
        </div>
      </div>

      {/* Vehicle Type Breakdown Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-white">Detected Vehicle Classification Breakdown</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">YOLOv8 fine-grained vehicle detection and category aggregation across all analyzed videos</p>
          </div>
          <span className="text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full font-bold">
            Real Detection Telemetry
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-3.5 rounded-xl">
            <div className="text-2xl font-extrabold text-blue-700 dark:text-blue-300">
              {stats?.cars_detected?.toLocaleString() ?? 0}
            </div>
            <div className="text-slate-800 dark:text-slate-200 font-bold mt-1">Cars &amp; Sedans</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Light passenger vehicles</div>
          </div>

          <div className="bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 p-3.5 rounded-xl">
            <div className="text-2xl font-extrabold text-purple-700 dark:text-purple-300">
              {stats?.trucks_detected?.toLocaleString() ?? 0}
            </div>
            <div className="text-slate-800 dark:text-slate-200 font-bold mt-1">Trucks &amp; Heavy</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Commercial freight &amp; buses</div>
          </div>

          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-3.5 rounded-xl">
            <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">
              {stats?.bikes_detected?.toLocaleString() ?? 0}
            </div>
            <div className="text-slate-800 dark:text-slate-200 font-bold mt-1">Bikes &amp; 2-Wheelers</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Motorcycles &amp; bicycles</div>
          </div>

          <div className="bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl">
            <div className="text-2xl font-extrabold text-slate-800 dark:text-white">
              {stats?.total_detected_vehicles?.toLocaleString() ?? 0}
            </div>
            <div className="text-slate-800 dark:text-slate-200 font-bold mt-1">Total Monitored</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Unique trajectory tracks</div>
          </div>
        </div>
      </div>

      {/* Traffic Conditions by Location (High, Moderate, Low) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-white">Corridor Traffic Conditions by Location</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Categorized based on spatial density, flow rate per minute, and stationary ratio</p>
          </div>
          <div className="flex gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 font-bold">
              {stats?.high_traffic_locations?.length || 0} High
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 font-bold">
              {stats?.moderate_traffic_locations?.length || 0} Moderate
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 font-bold">
              {stats?.low_traffic_locations?.length || 0} Low
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* High Traffic Column */}
          <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-red-200 dark:border-red-900/50">
              <span className="font-bold text-red-800 dark:text-red-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                High Traffic Locations
              </span>
              <span className="font-mono text-[11px] font-bold text-red-700 dark:text-red-400">
                {stats?.high_traffic_locations?.length || 0}
              </span>
            </div>
            {(!stats?.high_traffic_locations || stats.high_traffic_locations.length === 0) ? (
              <p className="text-slate-400 italic text-[11px] py-2">No corridors currently flagged with severe congestion.</p>
            ) : (
              <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                {stats.high_traffic_locations.map((loc, i) => (
                  <li key={i} className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-lg border border-red-100 dark:border-red-950 shadow-2xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">{loc}</span>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 shrink-0">
                      Congested
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Moderate Traffic Column */}
          <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-amber-200 dark:border-amber-900/50">
              <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Moderate Traffic Locations
              </span>
              <span className="font-mono text-[11px] font-bold text-amber-700 dark:text-amber-400">
                {stats?.moderate_traffic_locations?.length || 0}
              </span>
            </div>
            {(!stats?.moderate_traffic_locations || stats.moderate_traffic_locations.length === 0) ? (
              <p className="text-slate-400 italic text-[11px] py-2">No locations recorded in moderate flow band.</p>
            ) : (
              <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                {stats.moderate_traffic_locations.map((loc, i) => (
                  <li key={i} className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-lg border border-amber-100 dark:border-amber-950 shadow-2xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">{loc}</span>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 shrink-0">
                      Steady Flow
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Low Traffic Column */}
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-emerald-200 dark:border-emerald-900/50">
              <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Low Traffic Locations
              </span>
              <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                {stats?.low_traffic_locations?.length || 0}
              </span>
            </div>
            {(!stats?.low_traffic_locations || stats.low_traffic_locations.length === 0) ? (
              <p className="text-slate-400 italic text-[11px] py-2">No free-flowing locations recorded yet.</p>
            ) : (
              <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                {stats.low_traffic_locations.map((loc, i) => (
                  <li key={i} className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-lg border border-emerald-100 dark:border-emerald-950 shadow-2xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">{loc}</span>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                      Free Flow
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Quick Command Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link
          to="/police/video"
          className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 p-4 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/60 transition flex justify-between items-center group"
        >
          <div>
            <div className="font-bold text-sm text-blue-900 dark:text-blue-300">Upload &amp; Analyze Video</div>
            <div className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">YOLOv8 tracking, synchronous playback &amp; risk analysis</div>
          </div>
          <span className="text-blue-600 dark:text-blue-400 text-xl group-hover:translate-x-1 transition">&rarr;</span>
        </Link>

        <Link
          to="/police/compare"
          className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 p-4 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition flex justify-between items-center group"
        >
          <div>
            <div className="font-bold text-sm text-indigo-900 dark:text-indigo-300">Traffic Video Comparison</div>
            <div className="text-xs text-indigo-700 dark:text-indigo-400 mt-0.5">Dual upload, side-by-side synchronized comparison &amp; table</div>
          </div>
          <span className="text-indigo-600 dark:text-indigo-400 text-xl group-hover:translate-x-1 transition">&rarr;</span>
        </Link>

        <Link
          to="/police/incidents"
          className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-4 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition flex justify-between items-center group"
        >
          <div>
            <div className="font-bold text-sm text-emerald-900 dark:text-emerald-300">Incident Triage Queue</div>
            <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">Verify citizen road hazards &amp; log audit history</div>
          </div>
          <span className="text-emerald-600 dark:text-emerald-400 text-xl group-hover:translate-x-1 transition">&rarr;</span>
        </Link>
      </div>

      {/* Grid: Recent Risk Events + Recent Video Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Potential Risk Events */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <span>⚠️ Recent Predictive Collision Risks</span>
            </h2>
            <Link to="/police/video" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              Inspect in Video &rarr;
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs flex-1">
            {(!stats?.recent_risk_events || stats.recent_risk_events.length === 0) ? (
              <div className="p-6 text-center text-slate-400">No near-miss collision risks recorded yet.</div>
            ) : (
              stats.recent_risk_events.map((r, i) => (
                <div key={i} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 dark:text-white">{r.location}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      r.level?.toLowerCase() === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' :
                      r.level?.toLowerCase() === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300'
                    }`}>
                      {r.level} Risk
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px]">{r.explanation}</p>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Timestamp: <b>{r.score}</b> in Video #{r.video_id}</span>
                    <span className="capitalize">{r.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Video Activity Stream */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white">Recent Video Telemetry</h2>
            <Link to="/police/video" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              View all &rarr;
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs flex-1">
            {(!stats?.recent_activity || stats.recent_activity.length === 0) ? (
              <div className="p-6 text-center text-slate-400">No video analyses recorded yet. Upload a video to begin.</div>
            ) : (
              stats.recent_activity.map((a, i) => (
                <div key={i} className="p-3.5 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-white">{a.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Recorded: {a.time} &bull; Unique Vehicles: <b>{a.vehicles}</b></div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    a.category === 'High Traffic' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' :
                    a.category === 'Low Traffic' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' :
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300'
                  }`}>
                    {a.category}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
