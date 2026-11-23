import { useState, useEffect } from 'react'
import { api } from '../../api'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

export default function CongestionForecast() {
  const [data, setData] = useState({ history: [], forecast: [] })
  const [availableCorridors, setAvailableCorridors] = useState([])
  const [selectedCorridor, setSelectedCorridor] = useState('All Monitored Corridors (City Grid)')
  const [loading, setLoading] = useState(true)

  // Load available locations from existing videos/stats
  useEffect(() => {
    api.get('/api/dashboard/stats')
      .then(stats => {
        const locs = [
          ...(stats.high_traffic_locations || []),
          ...(stats.moderate_traffic_locations || []),
          ...(stats.low_traffic_locations || [])
        ]
        const unique = Array.from(new Set(locs)).filter(Boolean)
        setAvailableCorridors(unique)
      })
      .catch(() => {})
  }, [])

  // Fetch forecast data specifically for the selected corridor whenever it changes
  useEffect(() => {
    setLoading(true)
    const isAll = selectedCorridor === 'All Monitored Corridors (City Grid)' || !selectedCorridor
    const url = isAll
      ? '/api/forecast/series'
      : `/api/forecast/series?location=${encodeURIComponent(selectedCorridor)}`

    api.get(url)
      .then(res => setData(res))
      .catch(err => {
        console.error(err)
        setData({ history: [], forecast: [], insufficient_data: true, message: err.message })
      })
      .finally(() => setLoading(false))
  }, [selectedCorridor])

  // Combine observed historical telemetry and projected future flow
  const chartPoints = [
    ...(data.history || []).map(h => ({
      time: (h.timestamp || '').split(' ')[1]?.slice(0, 5) || (h.timestamp || '').slice(-8, -3) || h.timestamp,
      date: (h.timestamp || '').split(' ')[0],
      'Observed Volume': h.count,
      'Projected Volume': null
    })),
    ...(data.forecast || []).map(f => ({
      time: (f.timestamp || '').split(' ')[1]?.slice(0, 5) || (f.timestamp || '').slice(-8, -3) || f.timestamp,
      date: (f.timestamp || '').split(' ')[0],
      'Observed Volume': null,
      'Projected Volume': f.predicted_count
    }))
  ]

  const peakCongestionHours = (data.forecast || []).filter(f => f.predicted_count >= 240)

  // Default corridor list combined with database-discovered corridors
  const corridorOptions = Array.from(new Set([
    'All Monitored Corridors (City Grid)',
    ...availableCorridors,
    'Outer Ring Road (Silk Board to Marathahalli)',
    'Hosur Road (Silk Board to Electronic City)',
    'Old Madras Road (Indiranagar to KR Puram)',
    'Bellary Road (Hebbal Flyover to Airport)',
    'Kanakapura Road (Banashankari to NICE)'
  ]))

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 inline-block"></span>
          24-Hour City Congestion Forecast for Commuters
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Machine-learning powered hourly traffic volume projections to help you plan travel times and avoid heavy traffic jams.
        </p>
      </div>

      {/* Corridor Selector */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <label className="font-semibold text-slate-700 dark:text-slate-300">
          Select Monitored Corridor:
        </label>
        <select
          value={selectedCorridor}
          onChange={e => setSelectedCorridor(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
        >
          {corridorOptions.map((opt, i) => (
            <option key={i} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* Commuter Recommendation Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4 text-xs space-y-1">
          <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Optimal Travel Windows (Smooth Flow)
          </div>
          <p className="text-emerald-800 dark:text-emerald-300 text-[11px] leading-relaxed">
            Early morning (before 8:15 AM) and late evening (after 8:30 PM). Volume drops significantly during these off-peak periods.
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-4 text-xs space-y-1">
          <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Anticipated Peak Congestion Windows
          </div>
          <p className="text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
            Morning commute: <b>08:30 AM - 11:30 AM</b> &bull; Evening office rush: <b>05:30 PM - 08:30 PM</b>. Plan additional buffer time on this corridor.
          </p>
        </div>
      </div>

      {/* Main 24-Hour Forecast Chart or No-Data Display */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-900 dark:text-white">
            Traffic Demand Trend &bull; {selectedCorridor}
          </h2>
          <span className="text-[11px] bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
            AI Temporal Model
          </span>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
              <span>Loading forecast for {selectedCorridor}...</span>
            </div>
          </div>
        ) : data.insufficient_data ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
            <div className="text-amber-600 font-bold text-sm flex items-center gap-1.5">
              <span>⚠️</span>
              <span>Insufficient Telemetry for &apos;{selectedCorridor}&apos;</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
              {data.message || `No sufficient video observations are available for '${selectedCorridor}'. At least 3 sequential video recordings are required to generate an ML time-series forecast.`}
            </p>
            <button
              type="button"
              onClick={() => setSelectedCorridor('All Monitored Corridors (City Grid)')}
              className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              View City-Wide Aggregated Forecast
            </button>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.3} />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                {chartPoints.some(p => p['Observed Volume'] !== null) && (
                  <Area
                    type="monotone"
                    dataKey="Observed Volume"
                    stroke="#3b82f6"
                    fill="#93c5fd"
                    fillOpacity={0.35}
                    strokeWidth={2}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="Projected Volume"
                  stroke="#f97316"
                  fill="#fdba74"
                  fillOpacity={0.35}
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Projected Hourly Details */}
      {!data.insufficient_data && peakCongestionHours.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            High Density Hourly Forecasts (&gt;240 veh/hr)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
            {peakCongestionHours.slice(0, 8).map((f, i) => (
              <div key={i} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 space-y-0.5">
                <div className="font-bold text-slate-800 dark:text-slate-200">{f.timestamp?.split(' ')[1]?.slice(0, 5)}</div>
                <div className="text-red-600 dark:text-red-400 font-bold">{f.predicted_count} veh/hr</div>
                <div className="text-[10px] text-slate-400">High Volume</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
