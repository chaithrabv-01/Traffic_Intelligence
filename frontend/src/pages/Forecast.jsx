import { useState, useEffect } from 'react'
import { api } from '../api'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function Forecast() {
  const [data, setData] = useState({ history: [], forecast: [] })
  const [metrics, setMetrics] = useState(null)
  const [training, setTraining] = useState(false)
  const [msg, setMsg] = useState('')

  const loadData = () => {
    api.get('/api/forecast/series').then(setData).catch(() => {})
    api.get('/api/metrics').then(m => setMetrics(m?.forecast)).catch(() => {})
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRetrain = async () => {
    setTraining(true)
    setMsg('Retraining XGBoost, Random Forest and ARIMA models on chronological traffic records…')
    try {
      const res = await api.post('/api/forecast/train', {})
      setMetrics(res)
      setMsg('Models successfully trained and updated!')
      loadData()
    } catch (e) {
      setMsg(`Training failed: ${e.message}`)
    } finally {
      setTraining(false)
    }
  }

  // Combine history and forecast into a continuous series for Recharts
  const chartPoints = [
    ...data.history.map(h => ({
      time: h.timestamp.split(' ')[1] || h.timestamp,
      date: h.timestamp.split(' ')[0],
      'Historical Count': h.count,
      'Predicted Volume': null
    })),
    ...data.forecast.map(f => ({
      time: f.timestamp.split(' ')[1] || f.timestamp,
      date: f.timestamp.split(' ')[0],
      'Historical Count': null,
      'Predicted Volume': f.predicted_count
    }))
  ]

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Traffic Congestion &amp; Volume Forecasting</h1>
          <p className="text-xs text-slate-500">
            Machine learning time-series regression predicting traffic volume and congestion patterns using XGBoost, Random Forest, and ARIMA.
          </p>
        </div>
        <button
          onClick={handleRetrain}
          disabled={training}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium disabled:opacity-40"
        >
          {training ? 'Training Models…' : 'Retrain Forecast Models'}
        </button>
      </div>

      {msg && <p className="text-xs text-blue-700 bg-blue-50 p-2.5 rounded border border-blue-200">{msg}</p>}

      {/* Model Performance Evaluation Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded shadow-sm border border-slate-200">
            <div className="text-xs font-semibold text-blue-600 uppercase">Primary Model</div>
            <h3 className="font-bold text-base text-slate-800">XGBoost Regressor</h3>
            <div className="mt-2 text-xs space-y-1 text-slate-600">
              <div>MAE: <b className="text-slate-900">{metrics.xgboost?.MAE?.toFixed(2)}</b> veh/hr</div>
              <div>RMSE: <b className="text-slate-900">{metrics.xgboost?.RMSE?.toFixed(2)}</b></div>
              <div className="text-[11px] text-slate-400">Train size: {metrics.n_train} | Test: {metrics.n_test}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow-sm border border-slate-200">
            <div className="text-xs font-semibold text-indigo-600 uppercase">Ensemble Model</div>
            <h3 className="font-bold text-base text-slate-800">Random Forest</h3>
            <div className="mt-2 text-xs space-y-1 text-slate-600">
              <div>MAE: <b className="text-slate-900">{metrics.random_forest?.MAE?.toFixed(2)}</b> veh/hr</div>
              <div>RMSE: <b className="text-slate-900">{metrics.random_forest?.RMSE?.toFixed(2)}</b></div>
              <div className="text-[11px] text-slate-400">Time-ordered split (no leakage)</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow-sm border border-slate-200">
            <div className="text-xs font-semibold text-slate-500 uppercase">Statistical Baseline</div>
            <h3 className="font-bold text-base text-slate-800">ARIMA (2,1,2)</h3>
            <div className="mt-2 text-xs space-y-1 text-slate-600">
              <div>MAE: <b className="text-slate-900">{metrics.arima_baseline?.MAE?.toFixed(2) || 'N/A'}</b></div>
              <div>RMSE: <b className="text-slate-900">{metrics.arima_baseline?.RMSE?.toFixed(2) || 'N/A'}</b></div>
              <div className="text-[11px] text-slate-400">Standard statistical baseline</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Forecast Chart */}
      <div className="bg-white p-5 rounded shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-sm text-slate-800">48-Hour Historical Observations &amp; 24-Hour Projected Volume</h2>
          <span className="text-[11px] text-slate-400">Source: backend/data/traffic_counts/counts.csv</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartPoints}>
              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="Historical Count" stroke="#2563eb" fill="#93c5fd" fillOpacity={0.4} strokeWidth={2} />
              <Area type="monotone" dataKey="Predicted Volume" stroke="#ea580c" fill="#fdba74" fillOpacity={0.4} strokeWidth={2} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-slate-500">
          * Blue area represents actual recorded traffic sensor volume. Dashed orange area represents ML projected hourly traffic demand.
        </p>
      </div>
    </div>
  )
}
