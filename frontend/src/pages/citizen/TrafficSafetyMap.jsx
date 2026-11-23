import { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, useMap } from 'react-leaflet'
import { api } from '../../api'

const RISK_COLORS = {
  critical: '#dc2626',
  high: '#ea580c',
  moderate: '#eab308',
  low: '#16a34a'
}

function MapRecenter({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 12, { duration: 1.2 })
    }
  }, [center, zoom, map])
  return null
}

export default function TrafficSafetyMap() {
  const [segments, setSegments] = useState([])
  const [hotspots, setHotspots] = useState([])
  const [incidents, setIncidents] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  // Layer Toggles
  const [showSegments, setShowSegments] = useState(true)
  const [showHotspots, setShowHotspots] = useState(true)
  const [showIncidents, setShowIncidents] = useState(true)
  const [showAlerts, setShowAlerts] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [mapCenter, setMapCenter] = useState([12.9716, 77.5946])
  const [mapZoom, setMapZoom] = useState(12)

  useEffect(() => {
    loadPublicMap()
  }, [])

  const loadPublicMap = async () => {
    setLoading(true)
    try {
      const [segsRes, hsRes, incRes, alertsRes] = await Promise.allSettled([
        api.get('/api/road-segments'),
        api.get('/api/hotspots'),
        api.get('/api/incidents?portal=citizen'),
        api.get('/api/alerts?portal=citizen&active_only=true')
      ])

      if (segsRes.status === 'fulfilled') setSegments(segsRes.value?.features || [])
      if (hsRes.status === 'fulfilled') setHotspots(hsRes.value || [])
      if (incRes.status === 'fulfilled') setIncidents(incRes.value || [])
      if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filteredIncidents = useMemo(() => {
    return incidents.filter(i => {
      if (!i.lat || !i.lon) return false
      if (searchQuery && !(i.location_name || i.category || '').toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [incidents, searchQuery])

  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (!a.lat || !a.lon) return false
      if (searchQuery && !(a.location || a.title || '').toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [alerts, searchQuery])

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            Bengaluru Public Traffic &amp; Road Safety Map
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Public safety transparency map showing high-risk corridors, historical accident zones, verified community hazard reports, and active police advisories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search road or area..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => {
              setMapCenter([12.9716, 77.5946])
              setMapZoom(12)
            }}
            className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium border border-slate-200 dark:border-slate-700 transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Layer Control Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Public Layers:</span>

          <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 dark:bg-slate-900/60 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
            <input type="checkbox" checked={showSegments} onChange={e => setShowSegments(e.target.checked)} className="rounded text-blue-600" />
            <span className="text-slate-700 dark:text-slate-200 font-medium">Road Corridors ({segments.length})</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 dark:bg-slate-900/60 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
            <input type="checkbox" checked={showHotspots} onChange={e => setShowHotspots(e.target.checked)} className="rounded text-red-600" />
            <span className="text-slate-700 dark:text-slate-200 font-medium">Accident Hotspots ({hotspots.length})</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 dark:bg-slate-900/60 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
            <input type="checkbox" checked={showIncidents} onChange={e => setShowIncidents(e.target.checked)} className="rounded text-indigo-600" />
            <span className="text-slate-700 dark:text-slate-200 font-medium">Verified Hazards ({filteredIncidents.length})</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 dark:bg-slate-900/60 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
            <input type="checkbox" checked={showAlerts} onChange={e => setShowAlerts(e.target.checked)} className="rounded text-amber-600" />
            <span className="text-slate-700 dark:text-slate-200 font-medium">Active Advisories ({filteredAlerts.length})</span>
          </label>
        </div>
      </div>

      {/* Map Legend */}
      <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl text-xs flex flex-wrap items-center justify-between gap-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-semibold text-slate-800 dark:text-slate-200">Symbols:</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-600 inline-block"/> Accident Hotspot</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-indigo-600 inline-block"/> Verified Road Hazard</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block"/> Police Advisory Area</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-800 dark:text-slate-200">Corridor Safety:</span>
          <span className="flex items-center gap-1"><span className="w-4 h-1.5 rounded bg-red-600 inline-block"/> High Caution</span>
          <span className="flex items-center gap-1"><span className="w-4 h-1.5 rounded bg-yellow-500 inline-block"/> Moderate</span>
          <span className="flex items-center gap-1"><span className="w-4 h-1.5 rounded bg-emerald-600 inline-block"/> Safe Flow</span>
        </div>
      </div>

      {/* Map Frame */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md">
        {loading && (
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm z-[1000] flex items-center justify-center">
            <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-white">
              <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
              Loading Public Safety Map...
            </div>
          </div>
        )}

        <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '68vh', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors | Safe Roads Bengaluru"
          />
          <MapRecenter center={mapCenter} zoom={mapZoom} />

          {/* Road Network Corridors */}
          {showSegments && segments.map(seg => {
            const p = seg.properties
            const latlngs = seg.geometry.coordinates.map(pt => [pt[1], pt[0]])
            const col = RISK_COLORS[p.risk_level] || '#3b82f6'
            return (
              <Polyline
                key={p.segment_id}
                positions={latlngs}
                pathOptions={{ color: col, weight: 6, opacity: 0.85 }}
              >
                <Popup>
                  <div className="text-xs space-y-1 min-w-[200px]">
                    <div className="font-bold text-sm text-slate-900">{p.road_name}</div>
                    <div className="text-slate-600">Type: <b className="capitalize">{p.road_type}</b> ({p.lanes} lanes)</div>
                    <div className="text-slate-600">Speed Limit: <b>{p.speed_limit_kmh} km/h</b></div>
                    <div className="pt-1 border-t flex items-center justify-between">
                      <span className="text-slate-500">Safety Level:</span>
                      <span className="font-bold uppercase text-[11px] px-1.5 py-0.5 rounded" style={{ color: col, backgroundColor: `${col}15` }}>
                        {p.risk_level}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Polyline>
            )
          })}

          {/* Historical Accident Hotspots */}
          {showHotspots && hotspots.map(h => (
            <CircleMarker
              key={'h' + h.cluster}
              center={[h.lat, h.lon]}
              radius={7 + Math.min(h.accident_count || 1, 14)}
              pathOptions={{ color: '#991b1b', fillColor: '#ef4444', fillOpacity: 0.65, weight: 1.5 }}
            >
              <Popup>
                <div className="text-xs space-y-1 min-w-[180px]">
                  <div className="font-bold text-red-700 text-sm">Accident Hotspot</div>
                  <div>Historical Accidents: <b className="text-red-600">{h.accident_count}</b></div>
                  <div className="text-[10px] text-slate-500 italic mt-1">Please drive with extra caution in this sector.</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Verified Citizen Hazard Reports */}
          {showIncidents && filteredIncidents.map(i => (
            <CircleMarker
              key={'inc' + i.id}
              center={[i.lat, i.lon]}
              radius={8}
              pathOptions={{ color: '#312e81', fillColor: '#6366f1', fillOpacity: 0.85, weight: 2 }}
            >
              <Popup>
                <div className="text-xs space-y-1.5 min-w-[200px]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-700 capitalize">{i.category}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-emerald-100 text-emerald-800">
                      Verified
                    </span>
                  </div>
                  <div className="text-slate-800">{i.description}</div>
                  <div className="text-slate-500 text-[10px]">Location: {i.location_name || 'Mapped Area'}</div>
                  {i.photo && (
                    <div className="mt-1">
                      <img src={i.photo} alt="Report Evidence" className="w-full h-24 object-cover rounded border" />
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Official Public Alerts */}
          {showAlerts && filteredAlerts.map(a => (
            <CircleMarker
              key={'alt' + a.id}
              center={[a.lat, a.lon]}
              radius={11}
              pathOptions={{ color: '#b45309', fillColor: '#f59e0b', fillOpacity: 0.55, weight: 2, dashArray: '4, 4' }}
            >
              <Popup>
                <div className="text-xs space-y-1 min-w-[200px]">
                  <div className="font-bold text-amber-800 text-sm">{a.title}</div>
                  <div className="text-slate-700">{a.description}</div>
                  <div>Sector: <b>{a.location}</b></div>
                  <div>Advisory Level: <b className="uppercase">{a.severity}</b></div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
