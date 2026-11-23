import { useState, useEffect } from 'react'
import { api } from '../../api'

export default function IncidentManagement() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('All')
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [remarks, setRemarks] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [resolutionInfo, setResolutionInfo] = useState('')
  const [updating, setUpdating] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [historyList, setHistoryList] = useState([])

  const loadIncidents = async () => {
    setLoading(true)
    try {
      const data = await api.get('/api/incidents?portal=police')
      setIncidents(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadIncidents()
  }, [])

  const openReviewModal = async (inc) => {
    setSelectedIncident(inc)
    setRemarks(inc.police_remarks || '')
    setRejectionReason(inc.rejection_reason || '')
    setResolutionInfo(inc.resolution_info || '')
    setFeedback('')
    try {
      const hist = await api.get(`/api/incidents/${inc.id}/history`)
      setHistoryList(hist || [])
    } catch {
      setHistoryList([])
    }
  }

  const handleUpdateStatus = async (status) => {
    if (!selectedIncident) return
    if (status === 'Rejected' && !rejectionReason.trim()) {
      setFeedback('Please specify a rejection reason for this report.')
      return
    }

    setUpdating(true)
    setFeedback('')
    try {
      await api.patch(`/api/incidents/${selectedIncident.id}`, {
        status,
        police_remarks: remarks,
        rejection_reason: status === 'Rejected' ? rejectionReason : null,
        resolution_info: status === 'Resolved' ? (resolutionInfo || 'Issue resolved by field officers') : null
      })
      setFeedback(`Incident #${selectedIncident.id} status updated to "${status}"`)
      await loadIncidents()
      setSelectedIncident(prev => ({
        ...prev,
        status,
        police_remarks: remarks,
        rejection_reason: status === 'Rejected' ? rejectionReason : prev.rejection_reason,
        resolution_info: status === 'Resolved' ? (resolutionInfo || 'Issue resolved by field officers') : prev.resolution_info
      }))
      const hist = await api.get(`/api/incidents/${selectedIncident.id}/history`)
      setHistoryList(hist || [])
    } catch (e) {
      setFeedback(`Failed: ${e.message}`)
    } finally {
      setUpdating(false)
    }
  }

  const filteredIncidents = incidents.filter(i => {
    if (filterStatus === 'All') return true
    return i.status === filterStatus
  })

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400 inline-block"></span>
            Citizen Incident Triage &amp; Road Verification Queue
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review live citizen-submitted hazard reports, inspect uploaded evidence, verify ground truth, and dispatch officer response.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadIncidents}
            className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 font-medium transition"
          >
            Refresh Queue
          </button>
        </div>
      </div>

      {/* Filter Tabs & Statistics */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {['All', 'Pending Verification', 'Under Review', 'Verified', 'Resolved', 'Rejected'].map(s => {
            const count = s === 'All' ? incidents.length : incidents.filter(i => i.status === s).length
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                  filterStatus === s
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>{s}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  filterStatus === s ? 'bg-blue-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Incident List */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
          Loading incident reports...
        </div>
      ) : filteredIncidents.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
          No reports found for filter "{filterStatus}".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredIncidents.map(inc => (
            <div
              key={inc.id}
              className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between hover:border-blue-400 dark:hover:border-blue-600 transition"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">#{inc.id}</span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white capitalize">
                      {inc.category}
                    </h3>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      inc.status === 'Verified' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                      inc.status === 'Pending Verification' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                      inc.status === 'Under Review' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                      inc.status === 'Resolved' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                      inc.status === 'Rejected' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {inc.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {inc.description}
                </p>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Location:</span>
                    <span>{inc.location_name || 'Coordinates submitted'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span>Reported by: <b>{inc.reporting_user}</b></span>
                    <span>{inc.created_at}</span>
                  </div>
                </div>

                {inc.rejection_reason && (
                  <div className="p-2 bg-rose-50 dark:bg-rose-950/40 rounded-lg text-xs text-rose-900 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                    <span className="font-semibold">Rejection Reason:</span> {inc.rejection_reason}
                  </div>
                )}

                {inc.police_remarks && (
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-xs text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                    <span className="font-semibold">Police Remarks:</span> {inc.police_remarks}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                {inc.photo ? (
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Has Evidence
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">No Photo</span>
                )}

                <button
                  onClick={() => openReviewModal(inc)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  Review &amp; Triage
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div>
                <span className="text-xs font-mono text-slate-400">Incident Report #{selectedIncident.id}</span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white capitalize">
                  {selectedIncident.category}
                </h2>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {feedback && (
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-300 rounded text-xs">
                {feedback}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 dark:text-slate-400 font-semibold">Citizen Description:</label>
                <p className="mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  {selectedIncident.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-600 dark:text-slate-300">
                <div>Location: <b>{selectedIncident.location_name || 'N/A'}</b></div>
                <div>Reported by: <b>{selectedIncident.reporting_user}</b></div>
                {selectedIncident.lat && <div>Lat: <b>{selectedIncident.lat.toFixed(5)}</b></div>}
                {selectedIncident.lon && <div>Lon: <b>{selectedIncident.lon.toFixed(5)}</b></div>}
              </div>

              {/* Photo Evidence */}
              {selectedIncident.photo && (
                <div>
                  <label className="text-slate-500 dark:text-slate-400 font-semibold">Citizen Photo / Video Evidence:</label>
                  <div className="mt-1 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                    <img
                      src={selectedIncident.photo}
                      alt="Incident Evidence"
                      className="w-full max-h-60 object-contain bg-black/5 dark:bg-black/40"
                    />
                  </div>
                </div>
              )}

              {/* Police Remarks Input */}
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Police Field Officer Remarks:</label>
                <textarea
                  rows="2"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="Enter verification notes, confirmed hazards, or dispatch details..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Rejection Reason Input (Visible for Rejection) */}
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-semibold text-rose-600 dark:text-rose-400">Rejection Reason (Required if rejecting):</label>
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="e.g. Inaccurate location, duplicate report, or normal road condition observed by patrol"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Resolution Input */}
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Resolution Notes (If resolved):</label>
                <input
                  type="text"
                  value={resolutionInfo}
                  onChange={e => setResolutionInfo(e.target.value)}
                  placeholder="e.g., Road cleared by patrol 14; signal technician repaired junction"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status Audit History Timeline */}
              {historyList.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-1">
                  <label className="text-slate-500 dark:text-slate-400 font-semibold text-[11px]">Audit History Log:</label>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {historyList.map(h => (
                      <div key={h.id} className="text-[10px] p-1.5 rounded bg-slate-50 dark:bg-slate-900 flex justify-between">
                        <span><b>{h.status}</b> {h.police_remarks ? `(${h.police_remarks})` : ''} {h.rejection_reason ? `[Rejection: ${h.rejection_reason}]` : ''}</span>
                        <span className="text-slate-400">{h.created_at}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons for Triage */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400">Current: <b>{selectedIncident.status}</b></span>
              
              <div className="flex items-center gap-2">
                <button
                  disabled={updating}
                  onClick={() => handleUpdateStatus('Verified')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  Verify &amp; Confirm
                </button>
                <button
                  disabled={updating}
                  onClick={() => handleUpdateStatus('Under Review')}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  Under Review
                </button>
                <button
                  disabled={updating}
                  onClick={() => handleUpdateStatus('Resolved')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  Mark Resolved
                </button>
                <button
                  disabled={updating}
                  onClick={() => handleUpdateStatus('Rejected')}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  Reject with Reason
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
