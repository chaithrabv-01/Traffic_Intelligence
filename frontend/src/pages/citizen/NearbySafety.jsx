import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'

const POPULAR_AREAS = [
  'Outer Ring Road',
  'Silk Board',
  'Koramangala',
  'Indiranagar',
  'Whitefield',
  'Hebbal Flyover',
  'Hosur Road',
  'Electronic City'
]

export default function NearbySafety() {
  const [area, setArea] = useState('Outer Ring Road')
  const [customInput, setCustomInput] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadSafetyData = async (targetArea) => {
    setLoading(true)
    try {
      const res = await api.get(`/api/nearby-safety?location=${encodeURIComponent(targetArea || area)}`)
      setData(res)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSafetyData(area)
  }, [area])

  const handleSearch = (e) => {
    e.preventDefault()
    if (customInput.trim()) {
      setArea(customInput.trim())
      loadSafetyData(customInput.trim())
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 inline-block"></span>
          Nearby Road Safety Information &amp; Area Advisories
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Explore verified road safety conditions, active police advisories, and corridor risk ratings for your neighborhood.
        </p>
      </div>

      {/* Area Selector and Search */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            placeholder="Type any Bengaluru neighborhood or road (e.g. MG Road, Bellandur)..."
            className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            Check Safety
          </button>
        </form>

        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-[11px] font-semibold text-slate-400">Popular Corridors:</span>
          {POPULAR_AREAS.map(p => (
            <button
              key={p}
              onClick={() => {
                setArea(p)
                setCustomInput('')
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                area === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Querying verified safety data for {area}...</div>
      ) : data ? (
        <div className="space-y-6">
          {/* Safety Summary Scorecard */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Area Overview</span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{data.query_location}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {data.active_advisories.length} active advisories &bull; {data.verified_hazards.length} verified road hazard reports
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-medium">Overall Safety Rating</div>
                <div className={`text-base font-black ${
                  data.safety_score === 'Good' ? 'text-emerald-600 dark:text-emerald-400' :
                  data.safety_score === 'Caution' ? 'text-red-600 dark:text-red-400' :
                  'text-amber-600 dark:text-amber-400'
                }`}>
                  {data.safety_score}
                </div>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                data.safety_score === 'Good' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                data.safety_score === 'Caution' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' :
                'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                {data.safety_score === 'Good' ? '✓' : '!'}
              </div>
            </div>
          </div>

          {/* Active Public Advisories for Area */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Active Police Safety Advisories in this Sector ({data.active_advisories.length})
            </h3>
            {data.active_advisories.length === 0 ? (
              <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-400">
                No active emergency advisories or road closures broadcasted for this area.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.active_advisories.map(a => (
                  <div key={a.id} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-amber-200 dark:border-amber-900/60 shadow-xs space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{a.title}</span>
                      <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded">
                        {a.severity}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">{a.description}</p>
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700">
                      Sector: <b>{a.location}</b>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Verified Citizen Road Hazards */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              Verified Community Hazards &amp; Roadworks ({data.verified_hazards.length})
            </h3>
            {data.verified_hazards.length === 0 ? (
              <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-400">
                No verified potholes or hazardous obstructions reported in this area.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.verified_hazards.map(i => (
                  <div key={i.id} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white capitalize">{i.category}</span>
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.2 rounded">
                        {i.status}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px]">{i.description}</p>
                    <div className="text-[10px] text-slate-400">Location: {i.location}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mapped Road Corridors & Speed Limits */}
          {data.monitored_corridors && data.monitored_corridors.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Monitored Road Corridors in this Sector
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {data.monitored_corridors.map(c => (
                  <div key={c.segment_id} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-1 text-xs">
                    <div className="font-bold text-slate-900 dark:text-white">{c.road_name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Type: <b className="capitalize">{c.road_type}</b> ({c.lanes} lanes)</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Speed Limit: <b>{c.speed_limit_kmh} km/h</b></div>
                    <div className="pt-1 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Safety Rating:</span>
                      <span className="font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                        {c.risk_level}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Report an issue callout */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-bold text-blue-900 dark:text-blue-200">Spot an unrecorded hazard in {area}?</div>
              <div className="text-slate-600 dark:text-blue-300 text-[11px]">Help your fellow citizens and notify Traffic Police command immediately.</div>
            </div>
            <Link
              to="/citizen/report"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs transition shrink-0 text-center"
            >
              Report Hazard
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}
