import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Marker, Polyline, Popup } from 'react-leaflet'
import { api } from '../api'

const RISK_COLORS = {
  critical: '#dc2626',
  high: '#ea580c',
  moderate: '#eab308',
  low: '#16a34a'
}

export default function MapPage({ portal }) {
  const [ev, setEv] = useState([])
  const [hs, setHs] = useState([])
  const [cams, setCams] = useState([])
  const [inc, setInc] = useState([])
  const [segments, setSegments] = useState([])
  const [showSegments, setShowSegments] = useState(true)
  const [showHotspots, setShowHotspots] = useState(true)
  const [showIncidents, setShowIncidents] = useState(true)

  useEffect(() => {
    api.get('/api/events?portal=' + portal).then(setEv).catch(() => {})
    api.get('/api/hotspots').then(setHs).catch(() => {})
    api.get('/api/incidents').then(setInc).catch(() => {})
    api.get('/api/road-segments').then(data => setSegments(data.features || [])).catch(() => {})
    if (portal === 'police') {
      api.get('/api/cameras').then(setCams).catch(() => {})
    }
  }, [portal])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">{portal === 'police' ? 'GIS Traffic & Road Risk Monitoring' : 'Bengaluru Traffic & Safety Map'}</h1>
          <p className="text-xs text-slate-500">
            {portal === 'police'
              ? 'Real-time road safety corridors, historical accident hotspots, verified incidents and CCTV monitoring.'
              : 'Public safety view: verified traffic alerts, road hazards, and historical high-risk corridors.'
            }
          </p>
        </div>

        {/* Layer Toggles */}
        <div className="flex gap-2 text-xs bg-white p-2 rounded shadow-sm border">
          <label className="flex items-center gap-1 cursor-pointer">
            <input type="checkbox" checked={showSegments} onChange={e => setShowSegments(e.target.checked)} />
            <span>Corridors</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer ml-2">
            <input type="checkbox" checked={showHotspots} onChange={e => setShowHotspots(e.target.checked)} />
            <span>Hotspots</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer ml-2">
            <input type="checkbox" checked={showIncidents} onChange={e => setShowIncidents(e.target.checked)} />
            <span>Citizen Reports</span>
          </label>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white px-3 py-2 rounded text-xs flex gap-4 flex-wrap items-center border shadow-sm">
        <span className="font-semibold text-slate-600">Corridors:</span>
        <span className="flex items-center gap-1"><span className="w-3 h-1 bg-red-600 inline-block"/> Critical Risk</span>
        <span className="flex items-center gap-1"><span className="w-3 h-1 bg-orange-600 inline-block"/> High Risk</span>
        <span className="flex items-center gap-1"><span className="w-3 h-1 bg-yellow-500 inline-block"/> Moderate</span>
        <span className="flex items-center gap-1"><span className="w-3 h-1 bg-green-600 inline-block"/> Low</span>
        <span className="border-l pl-3 font-semibold text-slate-600">Points:</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"/> Accident Hotspots</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"/> Traffic Events</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"/> Citizen Reports</span>
      </div>

      <div className="rounded overflow-hidden border shadow-sm">
        <MapContainer center={[12.9716, 77.5946]} zoom={11} style={{ height: '72vh', width: '100%' }}>
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {/* Road Network Corridors (GeoPandas / PostGIS Segments) */}
          {showSegments && segments.map(seg => {
            const p = seg.properties
            // GeoJSON coordinates are [lon, lat]; Leaflet Polyline expects [lat, lon]
            const latlngs = seg.geometry.coordinates.map(pt => [pt[1], pt[0]])
            const col = RISK_COLORS[p.risk_level] || '#2563eb'
            return (
              <Polyline
                key={p.segment_id}
                positions={latlngs}
                pathOptions={{ color: col, weight: 6, opacity: 0.85 }}
              >
                <Popup>
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-sm text-slate-900">{p.road_name}</div>
                    <div>Type: <b>{p.road_type}</b> ({p.lanes} lanes)</div>
                    <div>Speed Limit: <b>{p.speed_limit_kmh} km/h</b></div>
                    <div>Historical Accidents: <b>{p.historical_accidents_yr} / yr</b></div>
                    <div>Mean Daily Traffic: <b>{p.mean_daily_volume?.toLocaleString()}</b></div>
                    <div>
                      Risk Rating: <span className="font-bold uppercase" style={{ color: col }}>{p.risk_level} ({p.risk_score})</span>
                    </div>
                  </div>
                </Popup>
              </Polyline>
            )
          })}

          {/* Historical Accident Hotspots (DBSCAN Clusters) */}
          {showHotspots && hs.map(h => (
            <CircleMarker
              key={'h' + h.cluster}
              center={[h.lat, h.lon]}
              radius={6 + Math.min(h.accident_count, 18)}
              pathOptions={{ color: '#dc2626', fillColor: '#ef4444', fillOpacity: 0.6 }}
            >
              <Popup>
                <div className="text-xs">
                  <div className="font-bold text-red-700">Historical Accident Hotspot</div>
                  <div>Cluster ID: #{h.cluster}</div>
                  <div>Accident Records: <b>{h.accident_count}</b></div>
                  {h.mean_severity && <div>Mean Severity: <b>{h.mean_severity.toFixed(1)} / 5</b></div>}
                  <div className="text-slate-500 mt-1">Source: Official accident records (DBSCAN)</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Video / Traffic Events (Confirmed Locations Only) */}
          {ev.filter(e => e.lat).map(e => (
            <CircleMarker
              key={'e' + e.id}
              center={[e.lat, e.lon]}
              radius={8}
              pathOptions={{ color: '#ea580c', fillColor: '#f97316', fillOpacity: 0.7 }}
            >
              <Popup>
                <div className="text-xs">
                  <div className="font-bold capitalize">{e.type.replace('_', ' ')}</div>
                  <div>Severity: <b>{e.severity}</b></div>
                  <div>Status: <b>{e.status}</b></div>
                  {e.video_id && <div>Associated Video: #{e.video_id}</div>}
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Citizen Incidents */}
          {showIncidents && inc.map(i => (
            <CircleMarker
              key={'i' + i.id}
              center={[i.lat, i.lon]}
              radius={6}
              pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.7 }}
            >
              <Popup>
                <div className="text-xs">
                  <div className="font-bold capitalize text-blue-700">{i.category}</div>
                  <div>{i.description}</div>
                  <div>Status: <b>{i.status}</b></div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* CCTV Cameras */}
          {cams.map(c => (
            <Marker key={'c' + c.id} position={[c.lat, c.lon]}>
              <Popup>
                <div className="text-xs">
                  <div className="font-bold text-slate-900">CCTV: {c.name}</div>
                  {c.notes && <div className="text-slate-500">{c.notes}</div>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
