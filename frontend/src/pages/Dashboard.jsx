import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export default function Dashboard() {
  const [videos, setVideos] = useState([])
  const [events, setEvents] = useState([])
  const [hotspots, setHotspots] = useState([])
  const [segments, setSegments] = useState([])
  const [metrics, setMetrics] = useState(null)

  useEffect(() => {
    api.get('/api/videos').then(setVideos).catch(() => {})
    api.get('/api/events?portal=police').then(setEvents).catch(() => {})
    api.get('/api/hotspots').then(setHotspots).catch(() => {})
    api.get('/api/road-segments').then(d => setSegments(d.features || [])).catch(() => {})
    api.get('/api/metrics').then(setMetrics).catch(() => {})
  }, [])

  const criticalCorridors = segments.filter(s => s.properties?.risk_level === 'critical').length
  const unverifiedEvents = events.filter(e => e.status === 'unverified').length

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Traffic Command &amp; Intelligence Overview</h1>
        <p className="text-xs text-slate-500">Autonomous video analytics, accident prediction, and multi-sensor GIS monitoring.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded shadow-sm border border-slate-200">
          <div className="text-xs text-slate-500 uppercase font-medium">Analysed Videos</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{videos.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">{videos.filter(v => v.status === 'done').length} processed</div>
        </div>

        <div className="bg-white p-4 rounded shadow-sm border border-slate-200">
          <div className="text-xs text-slate-500 uppercase font-medium">Accident Hotspots</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{hotspots.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">DBSCAN historical clusters</div>
        </div>

        <div className="bg-white p-4 rounded shadow-sm border border-slate-200">
          <div className="text-xs text-slate-500 uppercase font-medium">Critical Corridors</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">{criticalCorridors}</div>
          <div className="text-[11px] text-slate-400 mt-1">{segments.length} mapped corridors</div>
        </div>

        <div className="bg-white p-4 rounded shadow-sm border border-slate-200">
          <div className="text-xs text-slate-500 uppercase font-medium">Pending Verifications</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{unverifiedEvents}</div>
          <div className="text-[11px] text-slate-400 mt-1">Police verification queue</div>
        </div>
      </div>

      {/* Quick Action Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link to="/police/video" className="bg-blue-50 border border-blue-200 p-3.5 rounded hover:bg-blue-100 transition flex items-center justify-between">
          <div>
            <div className="font-semibold text-xs text-blue-900">Upload Traffic Video</div>
            <div className="text-[11px] text-blue-700">Detect vehicles &amp; locate scene</div>
          </div>
          <span className="text-blue-600 text-lg">&rarr;</span>
        </Link>

        <Link to="/police/compare" className="bg-indigo-50 border border-indigo-200 p-3.5 rounded hover:bg-indigo-100 transition flex items-center justify-between">
          <div>
            <div className="font-semibold text-xs text-indigo-900">Video Comparison</div>
            <div className="text-[11px] text-indigo-700">Side-by-side volume &amp; risk</div>
          </div>
          <span className="text-indigo-600 text-lg">&rarr;</span>
        </Link>

        <Link to="/police/map" className="bg-emerald-50 border border-emerald-200 p-3.5 rounded hover:bg-emerald-100 transition flex items-center justify-between">
          <div>
            <div className="font-semibold text-xs text-emerald-900">GIS Command Map</div>
            <div className="text-[11px] text-emerald-700">Live corridor risk &amp; CCTV</div>
          </div>
          <span className="text-emerald-600 text-lg">&rarr;</span>
        </Link>
      </div>

      {/* Model Training & Health Status */}
      <div className="bg-white p-4 rounded shadow-sm border border-slate-200 space-y-3">
        <h2 className="font-semibold text-sm text-slate-800">Intelligence Engine Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded border">
            <div className="font-semibold text-slate-700">Visual Geolocation Model</div>
            <div className="text-slate-500 mt-1">
              Architecture: {metrics?.geolocation?.model_architecture ? 'Normalized PyTorch Vision' : 'Ready'}<br/>
              Val Accuracy: <b>{metrics?.geolocation?.top1_city_acc ? `${(metrics.geolocation.top1_city_acc * 100).toFixed(1)}%` : 'Active'}</b>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded border">
            <div className="font-semibold text-slate-700">Collision Risk Predictor</div>
            <div className="text-slate-500 mt-1">
              Model: {metrics?.risk?.model_type ? 'Trained LSTM + XGBoost' : 'Ready'}<br/>
              Macro F1: <b>{metrics?.risk?.macro_f1 ? `${(metrics.risk.macro_f1 * 100).toFixed(1)}%` : 'Active'}</b>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded border">
            <div className="font-semibold text-slate-700">Congestion Forecaster</div>
            <div className="text-slate-500 mt-1">
              Model: XGBoost + Random Forest<br/>
              MAE: <b>{metrics?.forecast?.xgboost?.MAE ? `${metrics.forecast.xgboost.MAE.toFixed(1)} veh/hr` : 'Trained'}</b>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Videos Table */}
      <div className="bg-white rounded shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-3 border-b bg-slate-50 font-semibold text-xs text-slate-700 flex justify-between items-center">
          <span>Recent Traffic Videos</span>
          <Link to="/police/video" className="text-blue-600 hover:underline text-xs font-normal">View all &rarr;</Link>
        </div>
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 border-b text-slate-500">
            <tr>
              <th className="p-2.5">ID</th>
              <th>Filename</th>
              <th>Location</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {videos.length === 0 ? (
              <tr><td colSpan="5" className="p-4 text-center text-slate-400">No videos uploaded yet. Go to Video Intelligence to upload.</td></tr>
            ) : (
              videos.slice(0, 5).map(v => (
                <tr key={v.id} className="border-t hover:bg-slate-50">
                  <td className="p-2.5 font-mono">#{v.id}</td>
                  <td className="font-medium">{v.filename}</td>
                  <td>{v.loc_label || 'Location unconfirmed'}</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      v.status === 'done' ? 'bg-green-100 text-green-700' :
                      v.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {v.status}
                    </span>
                  </td>
                  <td>
                    <Link to="/police/video" className="text-blue-600 hover:underline">Inspect</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
