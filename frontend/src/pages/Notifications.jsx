import { useState, useEffect } from 'react'
import { api } from '../api'

export default function Notifications({ portal = 'police' }) {
  const [notifs, setNotifs] = useState([])
  const [fcmStatus, setFcmStatus] = useState('Standby')
  const [role, setRole] = useState(portal)

  const loadNotifs = () => {
    api.get(`/api/notifications?role=${role}`).then(setNotifs).catch(() => {})
  }

  useEffect(() => {
    loadNotifs()
    const timer = setInterval(loadNotifs, 5000)
    return () => clearInterval(timer)
  }, [role])

  const enableWebPush = async () => {
    setFcmStatus('Requesting browser permission…')
    if (!('Notification' in window)) {
      setFcmStatus('Web notifications not supported in this browser environment.')
      return
    }
    try {
      const perm = await Notification.requestPermission()
      if (perm === 'granted') {
        const fakeToken = 'fcm_web_token_' + Math.random().toString(36).substring(2, 12)
        await api.post('/api/notifications/register-token', {
          token: fakeToken,
          role: role,
          user_id: 'web_client_demo'
        })
        setFcmStatus('Active: Web push & FCM token registered!')
      } else {
        setFcmStatus(`Permission ${perm}`)
      }
    } catch (e) {
      setFcmStatus(`FCM Error: ${e.message}`)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Traffic Notifications &amp; Alerts Engine</h1>
          <p className="text-xs text-slate-500">
            Automated event routing, safety warnings, and Firebase Cloud Messaging (FCM) integration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            className="border text-xs p-1.5 rounded bg-white"
            value={role}
            onChange={e => setRole(e.target.value)}
          >
            <option value="police">Traffic Police Feed</option>
            <option value="citizen">Citizen Public Feed</option>
          </select>
          <button
            onClick={enableWebPush}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded"
          >
            Enable Web Push / FCM
          </button>
        </div>
      </div>

      <div className="bg-slate-50 border p-3 rounded text-xs flex justify-between items-center">
        <span>FCM Push Status: <b>{fcmStatus}</b></span>
        <span className="text-slate-400">Auto-refreshing every 5s</span>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifs.length === 0 ? (
          <div className="bg-white p-8 text-center text-slate-400 rounded border text-sm">
            No active alerts for this role. Notifications will appear when videos are analysed or incidents are reported.
          </div>
        ) : (
          notifs.map(n => {
            const sevCol =
              n.severity === 'critical' ? 'bg-red-100 text-red-700 border-red-300' :
              n.severity === 'high' ? 'bg-orange-100 text-orange-700 border-orange-300' :
              n.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
              'bg-blue-100 text-blue-700 border-blue-300'
            return (
              <div key={n.id} className="bg-white p-4 rounded shadow-sm border flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${sevCol}`}>
                      {n.severity}
                    </span>
                    <span className="font-semibold text-sm text-slate-800">{n.title}</span>
                  </div>
                  <p className="text-xs text-slate-600">{n.body}</p>
                  <div className="text-[10px] text-slate-400">
                    Audience: {n.audience?.join(', ')} | Received: {n.created_at}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
