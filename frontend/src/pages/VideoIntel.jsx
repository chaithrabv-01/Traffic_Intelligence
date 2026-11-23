import { useState, useEffect } from 'react'
import { api } from '../api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const CLASS_COLORS = {
  car: '#2563eb',
  motorcycle: '#dc2626',
  bus: '#d97706',
  truck: '#7c3aed',
  bicycle: '#16a34a'
}

export default function VideoIntel() {
  const [file, setFile] = useState(null)
  const [mpp, setMpp] = useState('')
  const [vid, setVid] = useState(null)
  const [v, setV] = useState(null)
  const [err, setErr] = useState('')
  const [showTrajectories, setShowTrajectories] = useState(true)
  const [trajFilter, setTrajFilter] = useState('all')

  useEffect(() => {
    if (!vid) return
    const t = setInterval(async () => {
      const d = await api.get('/api/videos/' + vid)
      setV(d)
      if (['done', 'failed'].includes(d.status)) clearInterval(t)
    }, 2000)
    return () => clearInterval(t)
  }, [vid])

  const up = async () => {
    try {
      setErr('')
      const r = await api.upload(file, mpp)
      setVid(r.id)
    } catch (e) {
      setErr(e.message)
    }
  }

  const confirm = async (c) =>
    setV(
      await api
        .post(`/api/videos/${vid}/confirm-location`, c ? { label: `${c.locality}, ${c.city}`, lat: c.lat, lon: c.lon } : { unknown: true })
        .then(() => api.get('/api/videos/' + vid))
    )

  const an = v?.analysis
  const geo = v?.geo
  const chart = an ? Object.entries(an.counts || {}).map(([k, n]) => ({ k, n })) : []
  const tracks = an?.tracks || []
  const frameSize = an?.frame_size || [640, 360]
  const [frameW, frameH] = frameSize

  const filteredTracks = tracks.filter(t => trajFilter === 'all' || t.cls === trajFilter)

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Video Intelligence &amp; Spatial Tracking</h1>
        <p className="text-xs text-slate-500">Deep learning vehicle detection, ByteTrack tracking, visual geolocation retrieval, and causal collision risk prediction.</p>
      </div>

      <div className="bg-white p-4 rounded shadow-sm flex gap-3 items-center flex-wrap">
        <input type="file" accept="video/*" onChange={e => setFile(e.target.files[0])} />
        <input
          className="border px-2 py-1 text-sm w-48 rounded"
          placeholder="metres/pixel (e.g. 0.05)"
          value={mpp}
          onChange={e => setMpp(e.target.value)}
        />
        <button
          disabled={!file}
          onClick={up}
          className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm disabled:opacity-40 hover:bg-blue-700"
        >
          Upload &amp; Analyse
        </button>
      </div>

      {err && <p className="text-red-600 text-sm">{err}</p>}
      {v && (
        <div className="flex items-center gap-3 text-sm bg-blue-50 border border-blue-200 px-3 py-2 rounded">
          <span>Video <b>#{v.id}</b> ({v.filename})</span>
          <span>Status: <b className="capitalize">{v.status}</b></span>
          {v.status === 'processing' && <span className="animate-pulse text-blue-600 text-xs">Extracting frames &amp; tracking road users…</span>}
        </div>
      )}
      {v?.error && <pre className="text-xs text-red-600 bg-red-50 p-3 rounded whitespace-pre-wrap">{v.error}</pre>}

      {/* Geolocation Section */}
      {geo && (
        <section className="bg-white p-5 rounded shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-semibold text-slate-800">
                Visual Geolocation Clues <span className="text-xs font-normal text-slate-500">(Retrieval evidence — requires confirmation)</span>
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Status: <span className="font-semibold capitalize px-2 py-0.5 rounded bg-slate-100">{v.location_status}</span>
                {v.loc_label && <span className="ml-2 font-medium text-blue-700">{v.loc_label} ({v.lat?.toFixed(4)}, {v.lon?.toFixed(4)})</span>}
              </p>
            </div>
          </div>

          {geo.warnings?.map((w, i) => (
            <p key={i} className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">{w}</p>
          ))}

          {geo.candidates?.length > 0 && (
            <div className="space-y-2 mt-2">
              <span className="text-xs font-medium text-slate-500">Visual Similarity Candidates from Multi-City Index:</span>
              {geo.candidates.map((c, i) => (
                <div key={i} className="border rounded p-3 text-sm flex justify-between items-center bg-slate-50">
                  <div>
                    <span className="font-medium text-slate-800">{c.locality}, {c.city}</span>
                    <span className="text-xs text-slate-500 ml-2">Similarity: {c.similarity} ({c.match_type})</span>
                  </div>
                  <button
                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    onClick={() => confirm(c)}
                  >
                    Confirm Location
                  </button>
                </div>
              ))}
            </div>
          )}

          {geo.ocr_text?.length > 0 && (
            <p className="text-xs text-slate-700 bg-slate-100 p-2 rounded">
              <b>Extracted OCR Signboards:</b> {geo.ocr_text.map(t => t.text).join(' · ')}
            </p>
          )}

          {geo.ocr_geocode_hits?.length > 0 && (
            <div className="text-xs text-slate-600 space-y-1">
              {geo.ocr_geocode_hits.slice(0, 3).map((h, i) => (
                <p key={i}>OSM Geocode for &ldquo;{h.query}&rdquo;: {h.name}</p>
              ))}
            </div>
          )}

          <div className="pt-2">
            <button className="text-xs text-slate-500 underline hover:text-slate-700" onClick={() => confirm(null)}>
              Mark Location as Unknown (Preserves location-independent analysis)
            </button>
          </div>
        </section>
      )}

      {/* Traffic Analytics Section */}
      {an && (
        <section className="bg-white p-5 rounded shadow-sm space-y-5">
          <div>
            <h2 className="font-semibold text-slate-800">Traffic Detection, Tracking &amp; Trajectories</h2>
            <p className="text-xs text-slate-500">
              Total Unique Road Users: <b>{an.total_unique_vehicles}</b> | Density Level: <b className="capitalize">{an.density.level}</b> (Mean {an.density.mean_vehicles_per_frame} / frame, Peak {an.density.peak})
            </p>
          </div>

          {/* Vehicle Distribution Chart */}
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <XAxis dataKey="k" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="n" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Trajectory Overlay Canvas / SVG */}
          <div className="border rounded p-4 bg-slate-900 text-white space-y-3">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-blue-400">Vehicle Trajectory Map Overlay</span>
                <button
                  onClick={() => setShowTrajectories(!showTrajectories)}
                  className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-700 text-slate-300"
                >
                  {showTrajectories ? 'Hide Overlay' : 'Show Overlay'}
                </button>
              </div>

              {/* Class Filter */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Filter:</span>
                <select
                  value={trajFilter}
                  onChange={e => setTrajFilter(e.target.value)}
                  className="bg-slate-800 text-white border border-slate-700 px-2 py-0.5 rounded text-xs"
                >
                  <option value="all">All Classes ({tracks.length})</option>
                  {Object.keys(an.counts || {}).map(c => (
                    <option key={c} value={c}>{c} ({an.counts[c]})</option>
                  ))}
                </select>
              </div>
            </div>

            {showTrajectories && (
              <div className="relative w-full aspect-video bg-black rounded overflow-hidden border border-slate-800">
                <svg viewBox={`0 0 ${frameW} ${frameH}`} className="w-full h-full">
                  {/* Grid lines representing perspective space */}
                  <line x1="0" y1={frameH * 0.5} x2={frameW} y2={frameH * 0.5} stroke="#334155" strokeDasharray="4 4" strokeWidth="1" />
                  <line x1={frameW * 0.5} y1="0" x2={frameW * 0.5} y2={frameH} stroke="#334155" strokeDasharray="4 4" strokeWidth="1" />

                  {/* Vehicle Trajectory Trails */}
                  {filteredTracks.map(trk => {
                    const col = CLASS_COLORS[trk.cls] || '#38bdf8'
                    const pts = trk.points || []
                    if (pts.length < 2) return null
                    const pathD = pts.reduce((acc, p, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p[1]} ${p[2]}`, '')
                    const lastPt = pts[pts.length - 1]
                    return (
                      <g key={trk.id}>
                        {/* Trail Line */}
                        <path d={pathD} fill="none" stroke={col} strokeWidth="2" strokeOpacity="0.8" />
                        {/* Origin dot */}
                        <circle cx={pts[0][1]} cy={pts[0][2]} r="2.5" fill={col} opacity="0.6" />
                        {/* Current/Endpoint dot */}
                        <circle cx={lastPt[1]} cy={lastPt[2]} r="4" fill={col} />
                        {/* Vehicle ID label */}
                        <text x={lastPt[1] + 5} y={lastPt[2] - 5} fill={col} fontSize="10" fontWeight="bold">
                          #{trk.id} {trk.cls}
                        </text>
                      </g>
                    )
                  })}
                </svg>

                {/* Overlay Legend */}
                <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur px-2 py-1 rounded text-[10px] flex gap-3 border border-slate-700">
                  {Object.entries(CLASS_COLORS).map(([c, col]) => (
                    <span key={c} className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: col }} />
                      <span className="capitalize">{c}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Trajectory Table Summary */}
          <div>
            <h3 className="font-medium text-sm text-slate-800 mb-2">Tracked Road Users Details</h3>
            <div className="max-h-48 overflow-auto border rounded text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 sticky top-0 border-b">
                  <tr>
                    <th className="p-2">ID</th>
                    <th>Class</th>
                    <th>Direction (Image)</th>
                    <th>Avg Speed (px/s)</th>
                    {an.calibrated && <th>Speed (km/h)</th>}
                    <th>Points Tracked</th>
                  </tr>
                </thead>
                <tbody>
                  {tracks.slice(0, 15).map(t => (
                    <tr key={t.id} className="border-t">
                      <td className="p-2 font-mono font-semibold">#{t.id}</td>
                      <td>
                        <span className="px-1.5 py-0.5 rounded text-[10px] text-white capitalize" style={{ backgroundColor: CLASS_COLORS[t.cls] || '#64748b' }}>
                          {t.cls}
                        </span>
                      </td>
                      <td>{t.direction}</td>
                      <td>{t.avg_speed_px_s}</td>
                      {an.calibrated && <td>{t.avg_speed_kmh ? `${t.avg_speed_kmh} km/h` : 'N/A'}</td>}
                      <td>{t.points.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Predictive Collision Risk Timeline */}
          <div>
            <h3 className="font-medium text-sm text-slate-800">
              Short-term Collision Risk Timeline <span className="text-xs text-slate-500">({an.risk_engine}; Strictly Causal Past Observations)</span>
            </h3>
            {an.risk?.length === 0 ? (
              <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-3 rounded">No high-risk vehicle interactions predicted for this recording.</p>
            ) : (
              <div className="overflow-x-auto mt-2">
                <table className="text-xs w-full border rounded">
                  <thead className="bg-slate-50 border-b text-left">
                    <tr>
                      <th className="p-2">t (s)</th>
                      <th>Vehicles</th>
                      <th>Level</th>
                      <th>TTC</th>
                      <th>Score</th>
                      <th>Explanation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {an.risk.map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2 font-mono">{r.ts}s</td>
                        <td>#{r.vehicle_ids.join(' & #')} ({r.classes.join('/')})</td>
                        <td>
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold uppercase text-[10px] ${
                              r.level === 'critical' ? 'bg-red-100 text-red-700' :
                              r.level === 'high' ? 'bg-orange-100 text-orange-700' :
                              r.level === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-700'
                            }`}
                          >
                            {r.level}
                          </span>
                        </td>
                        <td>{r.ttc_s}s</td>
                        <td>{r.score}</td>
                        <td className="text-slate-600">{r.explanation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <a
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
              href={`/api/videos/${v.id}/report.pdf`}
              target="_blank"
              rel="noreferrer"
            >
              <span>Download Intelligence PDF Report</span>
            </a>
          </div>
        </section>
      )}
    </div>
  )
}
