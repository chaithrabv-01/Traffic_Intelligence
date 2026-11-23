import { useState, useEffect } from 'react'
import { api } from '../../api'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

export default function TrafficTrends() {
  const [trends, setTrends] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/traffic-trends')
      .then(res => setTrends(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const vehicleClassData = trends?.vehicle_type_distribution
    ? Object.entries(trends.vehicle_type_distribution).map(([type, count]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        count
      }))
    : []

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 inline-block"></span>
          Citywide Traffic Trends &amp; Vehicular Insights
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Historical traffic volume trends, vehicle mode split, and corridor density patterns compiled from verified video analytics.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading traffic trend statistics...</div>
      ) : trends ? (
        <div className="space-y-6">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Vehicles Analyzed</span>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {trends.total_analyzed_vehicles?.toLocaleString() || 0}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">YOLO + ByteTrack verified counts</div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Primary Vehicle Mode</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {trends.vehicle_type_distribution?.car > trends.vehicle_type_distribution?.motorcycle ? 'Passenger Cars' : 'Motorcycles'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Most frequent arterial commuters</div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Analyzed Corridors</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {trends.recent_density_trends?.length || 0}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Active telemetry data points</div>
            </div>
          </div>

          {/* Diurnal Hourly Volume Distribution */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Diurnal Traffic Volume Profile (24-Hour Cycle)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Hourly aggregate traffic flow showing morning and evening peak windows across monitored corridors.
              </p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends.hourly_volume_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.3} />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#64748b' }} />
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
                  <Area
                    type="monotone"
                    dataKey="volume"
                    name="Vehicle Volume"
                    stroke="#2563eb"
                    fill="#93c5fd"
                    fillOpacity={0.35}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Vehicle Mode Composition Breakdown */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Vehicle Category Breakdown
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Distribution of detected vehicle classes across recorded video observations.
              </p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehicleClassData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.3} />
                  <XAxis dataKey="type" tick={{ fontSize: 10, fill: '#64748b' }} />
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
                  <Bar dataKey="count" name="Count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Corridor Observations Table */}
          {trends.recent_density_trends && trends.recent_density_trends.length > 0 && (
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Corridor Flow Observations
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Location / Corridor</th>
                      <th className="py-2.5 px-3">Density (veh/frame)</th>
                      <th className="py-2.5 px-3">Flow Rate (veh/min)</th>
                      <th className="py-2.5 px-3">Traffic Category</th>
                      <th className="py-2.5 px-3">Observation Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {trends.recent_density_trends.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">{row.location}</td>
                        <td className="py-2 px-3">{row.density}</td>
                        <td className="py-2 px-3">{row.flow_rate}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.category === 'High Traffic' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                            row.category === 'Medium Traffic' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                            'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}>
                            {row.category}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[11px] text-slate-400">{row.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
