import { useState, useEffect } from 'react'
import { api } from '../../api'

export default function AlertsManagement() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [feedback, setFeedback] = useState('')

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Severe Congestion',
    severity: 'High',
    location: '',
    target_area: 'Bengaluru Central',
    expires_in_hours: 12,
    lat: 12.9716,
    lon: 77.5946
  })

  const loadAlerts = async () => {
    setLoading(true)
    try {
      const data = await api.get('/api/alerts?portal=police&active_only=false')
      setAlerts(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAlerts()
  }, [])

  const handleCreateAlert = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setFeedback('')
    try {
      await api.post('/api/alerts', {
        title: form.title,
        description: form.description,
        category: form.category,
        severity: form.severity,
        location: form.location,
        target_area: form.target_area,
        expires_in_hours: Number(form.expires_in_hours),
        lat: form.lat ? Number(form.lat) : null,
        lon: form.lon ? Number(form.lon) : null
      })
      setFeedback('Public alert published successfully and dispatched to Citizen portal!')
      setShowCreateModal(false)
      setForm({
        title: '',
        description: '',
        category: 'Severe Congestion',
        severity: 'High',
        location: '',
        target_area: 'Bengaluru Central',
        expires_in_hours: 12,
        lat: 12.9716,
        lon: 77.5946
      })
      await loadAlerts()
    } catch (err) {
      setFeedback(`Failed to publish alert: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleAlert = async (id, currentStatus) => {
    try {
      await api.patch(`/api/alerts/${id}`, { is_active: !currentStatus })
      await loadAlerts()
    } catch (err) {
      alert(`Could not toggle alert: ${err.message}`)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block animate-pulse"></span>
            Public Safety Alerts &amp; Advisory Broadcast Command
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Author and broadcast official road safety advisories, accident alerts, and emergency diversions to citizens in real time.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Publish New Public Alert
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-medium">
          {feedback}
        </div>
      )}

      {/* Alert Cards */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading alerts database...</div>
      ) : alerts.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
          No public safety alerts currently registered in database.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.map(a => (
            <div
              key={a.id}
              className={`bg-white dark:bg-slate-800 rounded-xl p-5 border shadow-sm transition flex flex-col justify-between ${
                a.is_active
                  ? 'border-amber-300 dark:border-amber-900/60 ring-1 ring-amber-200/50 dark:ring-amber-900/20'
                  : 'border-slate-200 dark:border-slate-700 opacity-60'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        a.severity === 'Critical' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                        a.severity === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' :
                        a.severity === 'Moderate' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {a.severity}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">{a.category}</span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      a.is_active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {a.is_active ? 'Active Broadcast' : 'Deactivated'}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {a.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {a.description}
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                  <div>Affected Location: <b className="text-slate-700 dark:text-slate-200">{a.location}</b></div>
                  <div className="flex justify-between text-[10px]">
                    <span>Published: {a.created_at || 'Recently'}</span>
                    <span>Expires: {a.expires_at || 'No expiration'}</span>
                  </div>
                </div>
              </div>

              {/* Toggle Active Switch */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Broadcast Status</span>
                <button
                  onClick={() => handleToggleAlert(a.id, a.is_active)}
                  className={`px-3 py-1 text-xs rounded-lg font-semibold transition ${
                    a.is_active
                      ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                      : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                  }`}
                >
                  {a.is_active ? 'Deactivate Broadcast' : 'Reactivate Alert'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Create Public Safety Alert
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateAlert} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Alert Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Major Accident at Silk Board Junction - Left Lanes Blocked"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Description &amp; Advice *</label>
                <textarea
                  required
                  rows="3"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Provide instructions to commuters, recommended diversions, or expected delay duration..."
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="Accident / Collision">Accident / Collision</option>
                    <option value="Severe Congestion">Severe Congestion</option>
                    <option value="Road Closure">Road Closure</option>
                    <option value="Emergency Diversion">Emergency Diversion</option>
                    <option value="Weather Hazard">Weather Hazard</option>
                    <option value="VIP Movement">VIP Movement</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">Severity</label>
                  <select
                    value={form.severity}
                    onChange={e => setForm({ ...form, severity: e.target.value })}
                    className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Advisory">Advisory</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Location / Corridor Name *</label>
                <input
                  type="text"
                  required
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Outer Ring Road, Silk Board to Bellandur"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">Expires In (Hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="72"
                    value={form.expires_in_hours}
                    onChange={e => setForm({ ...form, expires_in_hours: e.target.value })}
                    className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={form.lat}
                    onChange={e => setForm({ ...form, lat: e.target.value })}
                    className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={form.lon}
                    onChange={e => setForm({ ...form, lon: e.target.value })}
                    className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Broadcast to Public'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
