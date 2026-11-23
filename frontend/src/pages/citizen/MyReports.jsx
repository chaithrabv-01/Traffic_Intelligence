import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'

export default function MyReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeHistoryId, setActiveHistoryId] = useState(null)
  const [historyList, setHistoryList] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const loadMyReports = async () => {
    try {
      const data = await api.get('/api/incidents/my-reports')
      setReports(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMyReports()
    // Poll every 4 seconds for dynamic status updates
    const timer = setInterval(loadMyReports, 4000)
    return () => clearInterval(timer)
  }, [])

  const viewHistory = async (iid) => {
    setActiveHistoryId(iid)
    setLoadingHistory(true)
    try {
      const hist = await api.get(`/api/incidents/${iid}/history`)
      setHistoryList(hist || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingHistory(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400 inline-block animate-pulse"></span>
            My Road Hazard Reports &amp; Verification Status
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time verification tracking directly synchronized with Traffic Police Incident Triage.
          </p>
        </div>

        <Link
          to="/citizen/report"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Report New Hazard
        </Link>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading your submitted hazard reports...</div>
      ) : reports.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-full flex items-center justify-center mx-auto text-xl">
            📝
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">No Hazard Reports Submitted Yet</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            You have not submitted any hazard reports from this account. Spot a dangerous pothole, signal failure, or accident? Let the traffic police know.
          </p>
          <Link
            to="/citizen/report"
            className="inline-block mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            Submit First Report
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(r => (
            <div
              key={r.id}
              className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400">Report #{r.id}</span>
                    <span className="font-bold text-sm text-slate-900 dark:text-white capitalize">
                      {r.category}
                    </span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Location: <b>{r.location_name || 'Mapped coordinate'}</b> &bull; Submitted: {r.created_at}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      r.status === 'Verified' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                      r.status === 'Pending Verification' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                      r.status === 'Under Review' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                      r.status === 'Resolved' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                      r.status === 'Rejected' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {r.status}
                  </span>
                  <button
                    onClick={() => viewHistory(r.id)}
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                  >
                    Audit History
                  </button>
                </div>
              </div>

              <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {r.description}
              </p>

              {r.photo && (
                <div>
                  <span className="text-[10px] font-semibold text-slate-400">Attached Evidence:</span>
                  <div className="mt-1">
                    <img
                      src={r.photo}
                      alt="Submitted evidence"
                      className="w-32 h-20 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>
              )}

              {/* Police Rejection Reason if Rejected */}
              {r.status === 'Rejected' && r.rejection_reason && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl space-y-1">
                  <div className="font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Rejection Reason
                  </div>
                  <p className="text-rose-800 dark:text-rose-200 text-[11px] leading-relaxed">
                    {r.rejection_reason}
                  </p>
                </div>
              )}

              {/* Police Feedback & Remarks Box */}
              {r.police_remarks && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl space-y-1">
                  <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Official Police Remarks &amp; Action Taken
                  </div>
                  <p className="text-blue-800 dark:text-blue-200 text-[11px] leading-relaxed">
                    {r.police_remarks}
                  </p>
                  {r.resolution_info && (
                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium pt-1">
                      Resolution Note: {r.resolution_info}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Audit History Modal */}
      {activeHistoryId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Status History for Report #{activeHistoryId}
              </h2>
              <button
                onClick={() => setActiveHistoryId(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {loadingHistory ? (
              <div className="text-xs text-slate-400 py-4 text-center">Loading audit history...</div>
            ) : historyList.length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center">No status changes recorded yet.</div>
            ) : (
              <div className="space-y-3 text-xs max-h-64 overflow-y-auto">
                {historyList.map(h => (
                  <div key={h.id} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-blue-600 dark:text-blue-400">{h.status}</span>
                      <span className="text-[10px] text-slate-400">{h.created_at}</span>
                    </div>
                    {h.police_remarks && (
                      <div className="text-slate-600 dark:text-slate-300 text-[11px]">
                        <b>Remarks:</b> {h.police_remarks}
                      </div>
                    )}
                    {h.rejection_reason && (
                      <div className="text-rose-600 dark:text-rose-400 text-[11px]">
                        <b>Rejection:</b> {h.rejection_reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setActiveHistoryId(null)}
              className="w-full py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
