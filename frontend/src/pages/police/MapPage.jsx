import { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, Marker, useMap } from 'react-leaflet'
import { api } from '../../api'

const RISK_COLORS = {
  critical: '#dc2626',
  high: '#ea580c',
  moderate: '#eab308',
  low: '#16a34a'
}

const TRAFFIC_CAT_COLORS = {
  'High Traffic': '#dc2626',
  'Medium Traffic': '#f59e0b',
  'Low Traffic': '#10b981'
}

// Component to dynamically pan/zoom map when user selects a location
function MapRecenter({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 13, { duration: 1.2 })
    }
  }, [center, zoom, map])
  return null
}

export default function PoliceMapPage() {
  const [videos, setVideos] = useState([])
  const [events, setEvents] = useState([])
  const [hotspots, setHotspots] = useState([])
  const [segments, setSegments] = useState([])
  const [incidents, setIncidents] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  // Layer Visibility Toggles
  const [showVideos, setShowVideos] = useState(true)
  const [showSegments, setShowSegments] = useState(true)
  const [showHotspots, setShowHotspots] = useState(true)
  const [showEvents, setShowEvents] = useState(true)
  const [showIncidents, setShowIncidents] = useState(true)
  const [showAlerts, setShowAlerts] = useState(true)

  // Filters
  const [selectedSeverity, setSelectedSeverity] = useState('all')
  const [selectedTrafficCat, setSelectedTrafficCat] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [mapCenter, setMapCenter] = useState([12.9716, 77.5946])
  const [mapZoom, setMapZoom] = useState(12)

  useEffect(() => {
    loadMapData()
  }, [])

  const loadMapData = async () => {
    setLoading(true)
    try {
      const [vidsRes, evsRes, hsRes, segsRes, incRes, alertsRes] = await Promise.allSettled([
        api.get('/api/videos'),
        api.get('/api/events?portal=police'),
        api.get('/api/hotspots'),
        api.get('/api/road-segments'),
        api.get('/api/incidents?portal=police'),
        api.get('/api/alerts?portal=police&active_only=true')
      ])

      if (vidsRes.status === 'fulfilled') setVideos(vidsRes.value || [])
      if (evsRes.status === 'fulfilled') setEvents(evsRes.value || [])
      if (hsRes.status === 'fulfilled') setHotspots(hsRes.value || [])
      if (segsRes.status === 'fulfilled') setSegments(segsRes.value?.features || [])
      if (incRes.status === 'fulfilled') setIncidents(incRes.value || [])
      if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value || [])
    } catch (e) {
      console.error('Failed to load map datasets', e)
    } finally {
      setLoading(false)
    }
  }

  // Filtered datasets
  const mappedVideos = useMemo(() => {
    return videos.filter(v => {
      if (!v.lat || !v.lon) return false
      if (selectedTrafficCat !== 'all' && v.traffic_category !== selectedTrafficCat) return false
      if (searchQuery && !(v.loc_label || v.user_location || '').toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [videos, selectedTrafficCat, searchQuery])

  const filteredHotspots = useMemo(() => {
    return hotspots.filter(h => {
      if (selectedSeverity !== 'all') {
        const sev = h.mean_severity >= 3.5 ? 'critical' : h.mean_severity >= 2.5 ? 'high' : 'moderate'
        if (sev !== selectedSeverity) return false
      }
      return true
    })
  }, [hotspots, selectedSeverity])

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
      if (selectedSeverity !== 'all' && a.severity.toLowerCase() !== selectedSeverity) return false
      return true
    })
  }, [alerts, selectedSeverity])

  return (
    <div className="space-y-4">
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 inline-block animate-pulse"></span>
            GIS Spatial Intelligence & Traffic Command Map
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time geospatial intelligence combining analyzed traffic camera video feeds, DBSCAN accident hotspots, PostGIS road corridors, and live citizen triage reports.
          </p>
        </div>

        {/* Quick Location Fly-to */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search location or corridor..."
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
            Reset Bengaluru
          </button>
        </div>
      </div>

      {/* Layer Control Bar & Filter Toggles */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Layer Checkboxes */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Layers:</span>
          
          <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 dark:bg-slate-900/60 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
            <input type="checkbox" checked={showVideos} onChange={e => setShowVideos(e.target.checked)} className="rounded text-blue-600" />
            <span className="text-slate-700 dark:text-slate-200 font-medium">Analyzed Videos ({mappedVideos.length})</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 dark:bg-slate-900/60 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
            <input type="checkbox" checked={showSegments} onChange={e => setShowSegments(e.target.checked)} className="rounded text-blue-600" />
            <span className="text-slate-700 dark:text-slate-200 font-medium">Road Corridors ({segments.length})</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 dark:bg-slate-900/60 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
            <input type="checkbox" checked={showHotspots} onChange={e => setShowHotspots(e.target.checked)} className="rounded text-red-600" />
            <span className="text-slate-700 dark:text-slate-200 font-medium">DBSCAN Hotspots ({filteredHotspots.length})</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 dark:bg-slate-900/60 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
            <input type="checkbox" checked={showEvents} onChange={e => setShowEvents(e.target.checked)} className="rounded text-orange-600" />
            <span className="text-slate-700 dark:text-slate-200 font-medium">Collision Risks ({events.length})</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 dark:bg-slate-900/60 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
            <input type="checkbox" checked={showIncidents} onChange={e => setShowIncidents(e.target.checked)} className="rounded text-indigo-600" />
            <span className="text-slate-700 dark:text-slate-200 font-medium">Citizen Reports ({filteredIncidents.length})</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 dark:bg-slate-900/60 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
            <input type="checkbox" checked={showAlerts} onChange={e => setShowAlerts(e.target.checked)} className="rounded text-amber-600" />
            <span className="text-slate-700 dark:text-slate-200 font-medium">Active Alerts ({filteredAlerts.length})</span>
          </label>
        </div>

        {/* Severity & Category Filters */}
        <div className="flex items-center gap-2">
          <select
            value={selectedTrafficCat}
            onChange={e => setSelectedTrafficCat(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Traffic Volumes</option>
            <option value="High Traffic">High Traffic</option>
            <option value="Medium Traffic">Medium Traffic</option>
            <option value="Low Traffic">Low Traffic</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={e => setSelectedSeverity(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="moderate">Moderate</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Map Legend */}
      <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl text-xs flex flex-wrap items-center justify-between gap-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-semibold text-slate-800 dark:text-slate-200">Map Legend:</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-600 inline-block ring-2 ring-blue-300 dark:ring-blue-900"/> Video Feed Location</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-600 inline-block"/> Accident Hotspot (DBSCAN)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block"/> Collision Risk Point</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-indigo-500 inline-block"/> Citizen Report</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block"/> Public Alert Area</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-800 dark:text-slate-200">Corridor Risk:</span>
          <span className="flex items-center gap-1"><span className="w-4 h-1.5 rounded bg-red-600 inline-block"/> Critical</span>
          <span className="flex items-center gap-1"><span className="w-4 h-1.5 rounded bg-orange-500 inline-block"/> High</span>
          <span className="flex items-center gap-1"><span className="w-4 h-1.5 rounded bg-yellow-500 inline-block"/> Moderate</span>
          <span className="flex items-center gap-1"><span className="w-4 h-1.5 rounded bg-emerald-600 inline-block"/> Low</span>
        </div>
      </div>

      {/* Map Frame */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md">
        {loading && (
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm z-[1000] flex items-center justify-center">
            <div className="bg-white dark:bg-slate-800 px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-white">
              <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
              Synchronizing GIS Datasets...
            </div>
          </div>
        )}

        <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '68vh', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors | AI Urban Traffic Platform"
          />
          <MapRecenter center={mapCenter} zoom={mapZoom} />

          {/* Road Network Corridors (GeoPandas / PostGIS Segments) */}
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
                  <div className="text-xs space-y-1.5 min-w-[200px]">
                    <div className="font-bold text-sm text-slate-900">{p.road_name}</div>
                    <div className="text-slate-600">Type: <b className="capitalize">{p.road_type}</b> ({p.lanes} lanes)</div>
                    <div className="text-slate-600">Speed Limit: <b>{p.speed_limit_kmh} km/h</b></div>
                    <div className="text-slate-600">Historical Accidents: <b>{p.historical_accidents_yr} / yr</b></div>
                    <div className="text-slate-600">Daily Traffic Volume: <b>{p.mean_daily_volume?.toLocaleString()}</b></div>
                    <div className="pt-1 border-t flex items-center justify-between">
                      <span className="text-slate-500">Risk Assessment:</span>
                      <span className="font-bold uppercase text-[11px] px-1.5 py-0.5 rounded" style={{ color: col, backgroundColor: `${col}15` }}>
                        {p.risk_level} ({p.risk_score})
                      </span>
                    </div>
                  </div>
                </Popup>
              </Polyline>
            )
          })}

          {/* Analyzed Video Feeds */}
          {showVideos && mappedVideos.map(v => {
            const col = TRAFFIC_CAT_COLORS[v.traffic_category] || '#2563eb'
            return (
              <CircleMarker
                key={'v' + v.id}
                center={[v.lat, v.lon]}
                radius={9}
                pathOptions={{ color: '#1e3a8a', fillColor: col, fillOpacity: 0.9, weight: 2 }}
              >
                <Popup>
                  <div className="text-xs space-y-2 min-w-[220px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">Video #{v.id}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: col }}>
                        {v.traffic_category}
                      </span>
                    </div>
                    <div className="text-slate-600">Location: <b>{v.loc_label || v.user_location || 'Confirmed'}</b></div>
                    <div className="text-slate-600">Vehicles Tracked: <b>{v.total_vehicles || 0}</b></div>
                    {v.density_level && <div className="text-slate-600">Density: <b className="capitalize">{v.density_level}</b></div>}
                    <div className="text-slate-600">Predicted Collision Risks: <b>{v.risk_count || 0}</b></div>
                    {v.annotated_path && (
                      <div className="pt-2 border-t">
                        <a
                          href={`/police/video`}
                          className="block text-center text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-2 rounded transition"
                        >
                          Open in Video Intelligence
                        </a>
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}

          {/* Historical Accident Hotspots (DBSCAN Clusters) */}
          {showHotspots && filteredHotspots.map(h => (
            <CircleMarker
              key={'h' + h.cluster}
              center={[h.lat, h.lon]}
              radius={7 + Math.min(h.accident_count || 1, 16)}
              pathOptions={{ color: '#991b1b', fillColor: '#ef4444', fillOpacity: 0.65, weight: 1.5 }}
            >
              <Popup>
                <div className="text-xs space-y-1 min-w-[190px]">
                  <div className="font-bold text-red-700 text-sm">DBSCAN Accident Hotspot</div>
                  <div>Cluster ID: <b>#{h.cluster}</b></div>
                  <div>Historical Accidents: <b className="text-red-600 font-bold">{h.accident_count}</b></div>
                  {h.mean_severity && <div>Mean Severity: <b>{h.mean_severity.toFixed(1)} / 5</b></div>}
                  <div className="text-[10px] text-slate-400 italic mt-1">Aggregated spatial density hotspot</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Collision Risk Events */}
          {showEvents && events.filter(e => e.lat && e.lon).map(e => (
            <CircleMarker
              key={'e' + e.id}
              center={[e.lat, e.lon]}
              radius={7}
              pathOptions={{ color: '#c2410c', fillColor: '#f97316', fillOpacity: 0.85, weight: 2 }}
            >
              <Popup>
                <div className="text-xs space-y-1">
                  <div className="font-bold capitalize text-orange-700">{e.type?.replace(/_/g, ' ')}</div>
                  <div>Severity: <b className="uppercase">{e.severity}</b></div>
                  {e.video_id && <div>Source: Video #{e.video_id}</div>}
                  <div className="text-slate-500 text-[10px]">{e.created_at}</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Citizen Incident Reports */}
          {showIncidents && filteredIncidents.map(i => (
            <CircleMarker
              key={'inc' + i.id}
              center={[i.lat, i.lon]}
              radius={7}
              pathOptions={{ color: '#3730a3', fillColor: '#6366f1', fillOpacity: 0.8, weight: 2 }}
            >
              <Popup>
                <div className="text-xs space-y-1.5 min-w-[200px]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-700 capitalize">{i.category}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                      i.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' :
                      i.status === 'Pending Verification' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>{i.status}</span>
                  </div>
                  <div className="text-slate-800">{i.description}</div>
                  <div className="text-slate-500 text-[10px]">Location: {i.location_name || 'Reported Point'}</div>
                  {i.photo && (
                    <div className="mt-1">
                      <img src={i.photo} alt="Citizen Evidence" className="w-full h-24 object-cover rounded border" />
                    </div>
                  )}
                  {i.police_remarks && (
                    <div className="p-1 bg-blue-50 rounded text-blue-900 text-[10px]">
                      <b>Police Remarks:</b> {i.police_remarks}
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Public Alerts */}
          {showAlerts && filteredAlerts.map(a => (
            <CircleMarker
              key={'alt' + a.id}
              center={[a.lat, a.lon]}
              radius={11}
              pathOptions={{ color: '#b45309', fillColor: '#f59e0b', fillOpacity: 0.5, weight: 2, dashArray: '4, 4' }}
            >
              <Popup>
                <div className="text-xs space-y-1 min-w-[200px]">
                  <div className="font-bold text-amber-800 text-sm">{a.title}</div>
                  <div className="text-slate-700">{a.description}</div>
                  <div>Area: <b>{a.location}</b></div>
                  <div>Severity: <b className="uppercase">{a.severity}</b></div>
                  {a.expires_at && <div className="text-slate-400 text-[10px]">Expires: {a.expires_at}</div>}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
