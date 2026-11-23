import { useState, useEffect } from 'react'
import { api } from '../api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function VideoComparison() {
  const [videos, setVideos] = useState([])
  const [vidA, setVidA] = useState('')
  const [vidB, setVidB] = useState('')
  const [cmp, setCmp] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    api.get('/api/videos').then(vs => {
      const doneList = vs.filter(v => v.status === 'done')
      setVideos(doneList)
      if (doneList.length >= 2) {
        setVidA(String(doneList[0].id))
        setVidB(String(doneList[1].id))
      } else if (doneList.length === 1) {
        setVidA(String(doneList[0].id))
      }
    }).catch(e => setErr(e.message))
  }, [])

  const runCompare = async () => {
    if (!vidA || !vidB) return
    if (vidA === vidB) {
      setErr('Please select two distinct videos to compare.')
      return
    }
    setErr('')
    setLoading(true)
    try {
      const res = await api.get(`/api/compare?a=${vidA}&b=${vidB}`)
      setCmp(res)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (vidA && vidB && vidA !== vidB) {
      runCompare()
    }
  }, [vidA, vidB])

  const aData = cmp?.[`video_${vidA}`]
  const bData = cmp?.[`video_${vidB}`]

  // Combine classes for side-by-side bar chart
  const allClasses = Array.from(new Set([
    ...Object.keys(aData?.counts || {}),
    ...Object.keys(bData?.counts || {})
  ]))

  const chartData = allClasses.map(cls => ({
    class: cls,
    [`Video #${vidA}`]: aData?.counts?.[cls] || 0,
    [`Video #${vidB}`]: bData?.counts?.[cls] || 0
  }))

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Traffic Video Comparison</h1>
        <p className="text-xs text-slate-500">Side-by-side intelligence analysis comparing vehicle distributions, traffic density, and collision risk timeline.</p>
      </div>

      <div className="bg-white p-4 rounded shadow-sm flex items-center gap-4 flex-wrap">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Video Stream A</label>
          <select className="border p-2 rounded text-sm min-w-48" value={vidA} onChange={e => setVidA(e.target.value)}>
            <option value="">Select Video A</option>
            {videos.map(v => (
              <option key={v.id} value={v.id}>#{v.id} - {v.filename} ({v.loc_label || 'Location unconfirmed'})</option>
            ))}
          </select>
        </div>

        <div className="text-slate-400 font-bold self-end pb-2">VS</div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Video Stream B</label>
          <select className="border p-2 rounded text-sm min-w-48" value={vidB} onChange={e => setVidB(e.target.value)}>
            <option value="">Select Video B</option>
            {videos.map(v => (
              <option key={v.id} value={v.id}>#{v.id} - {v.filename} ({v.loc_label || 'Location unconfirmed'})</option>
            ))}
          </select>
        </div>

        <button
          onClick={runCompare}
          disabled={!vidA || !vidB || vidA === vidB || loading}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm self-end disabled:opacity-40"
        >
          {loading ? 'Comparing…' : 'Compare Videos'}
        </button>
      </div>

      {err && <p className="text-red-600 text-sm">{err}</p>}

      {videos.length < 2 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded text-sm">
          <b>Note:</b> You need at least two analysed videos in the database for side-by-side comparison. Upload another video in <i>Video Intelligence</i> to test comparison.
        </div>
      )}

      {aData && bData && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50/50 border border-blue-200 p-4 rounded">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-600 text-white">STREAM A</span>
              <h2 className="font-semibold text-base mt-2">Video #{vidA}: {aData.filename}</h2>
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div className="bg-white p-2 rounded border">
                  <div className="text-xs text-slate-500">Total Vehicles</div>
                  <div className="text-lg font-bold text-blue-700">{aData.total_vehicles}</div>
                </div>
                <div className="bg-white p-2 rounded border">
                  <div className="text-xs text-slate-500">Density Level</div>
                  <div className="text-base font-bold capitalize text-slate-800">{aData.density?.level || 'N/A'}</div>
                </div>
                <div className="bg-white p-2 rounded border">
                  <div className="text-xs text-slate-500">Predicted Risks</div>
                  <div className="text-lg font-bold text-amber-600">{aData.risk_events}</div>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50/50 border border-indigo-200 p-4 rounded">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-600 text-white">STREAM B</span>
              <h2 className="font-semibold text-base mt-2">Video #{vidB}: {bData.filename}</h2>
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div className="bg-white p-2 rounded border">
                  <div className="text-xs text-slate-500">Total Vehicles</div>
                  <div className="text-lg font-bold text-indigo-700">{bData.total_vehicles}</div>
                </div>
                <div className="bg-white p-2 rounded border">
                  <div className="text-xs text-slate-500">Density Level</div>
                  <div className="text-base font-bold capitalize text-slate-800">{bData.density?.level || 'N/A'}</div>
                </div>
                <div className="bg-white p-2 rounded border">
                  <div className="text-xs text-slate-500">Predicted Risks</div>
                  <div className="text-lg font-bold text-amber-600">{bData.risk_events}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Class Breakdown Comparison Chart */}
          <div className="bg-white p-5 rounded shadow-sm space-y-3">
            <h3 className="font-semibold text-sm text-slate-800">Vehicle Classification Distribution Comparison</h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="class" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey={`Video #${vidA}`} fill="#2563eb" />
                  <Bar dataKey={`Video #${vidB}`} fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Key Intelligence Insights */}
          <div className="bg-white p-4 rounded shadow-sm text-sm space-y-2">
            <h3 className="font-semibold text-slate-800">Comparative Intelligence Summary</h3>
            <ul className="list-disc pl-5 text-slate-600 space-y-1 text-xs">
              <li>
                <b>Volume Delta:</b> Video #{aData.total_vehicles >= bData.total_vehicles ? vidA : vidB} observed{' '}
                {Math.abs(aData.total_vehicles - bData.total_vehicles)} more unique road users than Video #{aData.total_vehicles >= bData.total_vehicles ? vidB : vidA}.
              </li>
              <li>
                <b>Risk Differential:</b> {aData.risk_events === bData.risk_events
                  ? 'Both videos recorded equal predicted near-miss interactions.'
                  : `Video #${aData.risk_events > bData.risk_events ? vidA : vidB} recorded ${Math.abs(aData.risk_events - bData.risk_events)} more potential collision-risk interactions.`
                }
              </li>
              <li>
                <b>Causality Notice:</b> All comparison metrics use chronological non-leaking trajectory observations. Uncalibrated videos compare pixel velocities and normalized interaction proximity.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
