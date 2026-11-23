import { useState, useEffect, useRef } from 'react'
import { api } from '../../api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function VideoIntel() {
  const [file, setFile] = useState(null)
  const [locationInput, setLocationInput] = useState('')
  const [vid, setVid] = useState(null)
  const [videoData, setVideoData] = useState(null)
  const [videoHistory, setVideoHistory] = useState([])
  const [err, setErr] = useState('')
  const [uploading, setUploading] = useState(false)
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const originalVideoRef = useRef(null)
  const annotatedVideoRef = useRef(null)
  const isSyncingRef = useRef(false)

  const loadHistory = async (autoSelect = false) => {
    try {
      const list = await api.get('/api/videos')
      setVideoHistory(list)
      if (autoSelect && list && list.length > 0) {
        // Auto-select latest completed video so the player is immediately displayed on page load
        const latestDone = list.find(v => v.status === 'done' && v.annotated_path) || list.find(v => v.status === 'done')
        if (latestDone) {
          selectPreviousVideo(latestDone.id)
        }
      }
    } catch {}
  }

  useEffect(() => {
    loadHistory(true)
  }, [])

  // Poll video status while processing
  useEffect(() => {
    if (!vid) return
    const timer = setInterval(async () => {
      try {
        const d = await api.get(`/api/videos/${vid}`)
        setVideoData(d)
        if (['done', 'failed'].includes(d.status)) {
          clearInterval(timer)
          setUploading(false)
          loadHistory()
        }
      } catch (e) {
        setErr(e.message)
        clearInterval(timer)
        setUploading(false)
      }
    }, 2000)
    return () => clearInterval(timer)
  }, [vid])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return
    setErr('')
    setUploading(true)
    try {
      const res = await api.uploadVideo(file, locationInput, '')
      setVid(res.id)
    } catch (e) {
      setErr(e.message)
      setUploading(false)
    }
  }

  const selectPreviousVideo = async (previousId) => {
    setErr('')
    setVid(previousId)
    try {
      const d = await api.get(`/api/videos/${previousId}`)
      setVideoData(d)
    } catch (e) {
      setErr(e.message)
    }
  }

  const confirmLocationCandidate = async (candidate) => {
    try {
      const payload = candidate
        ? { label: `${candidate.locality}, ${candidate.city}`, lat: candidate.lat, lon: candidate.lon }
        : { unknown: true }
      await api.post(`/api/videos/${vid}/confirm-location`, payload)
      const updated = await api.get(`/api/videos/${vid}`)
      setVideoData(updated)
      loadHistory()
    } catch (e) {
      setErr(e.message)
    }
  }

  // Synchronized Video Event Handlers
  const handlePlaySync = (leader) => {
    setIsPlaying(true)
    if (isSyncingRef.current) return
    isSyncingRef.current = true
    const follower = leader === originalVideoRef.current ? annotatedVideoRef.current : originalVideoRef.current
    if (follower && follower.paused) {
      follower.currentTime = leader.currentTime
      follower.play().catch(() => {})
    }
    setTimeout(() => { isSyncingRef.current = false }, 80)
  }

  const handlePauseSync = (leader) => {
    setIsPlaying(false)
    if (isSyncingRef.current) return
    isSyncingRef.current = true
    const follower = leader === originalVideoRef.current ? annotatedVideoRef.current : originalVideoRef.current
    if (follower && !follower.paused) {
      follower.pause()
    }
    setTimeout(() => { isSyncingRef.current = false }, 80)
  }

  const handleSeekSync = (leader) => {
    if (isSyncingRef.current) return
    isSyncingRef.current = true
    const follower = leader === originalVideoRef.current ? annotatedVideoRef.current : originalVideoRef.current
    if (follower && Math.abs(follower.currentTime - leader.currentTime) > 0.15) {
      follower.currentTime = leader.currentTime
    }
    setCurrentPlaybackTime(leader.currentTime)
    setTimeout(() => { isSyncingRef.current = false }, 80)
  }

  const handleTimeUpdate = (e) => {
    setCurrentPlaybackTime(e.target.currentTime)
  }

  const toggleMasterPlayPause = () => {
    if (isPlaying) {
      if (originalVideoRef.current) originalVideoRef.current.pause()
      if (annotatedVideoRef.current) annotatedVideoRef.current.pause()
      setIsPlaying(false)
    } else {
      const t = originalVideoRef.current?.currentTime || 0
      if (originalVideoRef.current) {
        originalVideoRef.current.currentTime = t
        originalVideoRef.current.play().catch(() => {})
      }
      if (annotatedVideoRef.current) {
        annotatedVideoRef.current.currentTime = t
        annotatedVideoRef.current.play().catch(() => {})
      }
      setIsPlaying(true)
    }
  }

  const seekVideoToTimestamp = (ts) => {
    const target = Math.max(0, ts - 0.5)
    if (originalVideoRef.current) {
      originalVideoRef.current.currentTime = target
      originalVideoRef.current.play().catch(() => {})
    }
    if (annotatedVideoRef.current) {
      annotatedVideoRef.current.currentTime = target
      annotatedVideoRef.current.play().catch(() => {})
    }
    setCurrentPlaybackTime(target)
    setIsPlaying(true)
  }

  const an = videoData?.analysis
  const geo = videoData?.geo
  const tracks = an?.tracks || []
  const riskEvents = an?.risk || []
  const trafficClass = an?.traffic_classification || {}

  // Calculate live detection stats at current playback time
  const getActiveMetrics = () => {
    if (!tracks || tracks.length === 0) return { active: 0, cars: 0, trucks: 0, bikes: 0 }
    let active = 0
    let cars = 0
    let trucks = 0
    let bikes = 0
    for (const tr of tracks) {
      if (!tr.points || tr.points.length === 0) continue
      const t0 = tr.points[0][0]
      const t1 = tr.points[tr.points.length - 1][0]
      if (currentPlaybackTime >= t0 - 0.25 && currentPlaybackTime <= t1 + 0.25) {
        active++
        const cls = (tr.cls || '').toLowerCase()
        if (cls === 'car') cars++
        else if (cls === 'truck' || cls === 'bus') trucks++
        else if (cls === 'motorcycle' || cls === 'bicycle') bikes++
        else cars++
      }
    }
    return { active, cars, trucks, bikes }
  }

  const liveStats = getActiveMetrics()

  const countsObj = an?.counts || {}
  const totalCars = countsObj['car'] || 0
  const totalTrucks = (countsObj['truck'] || 0) + (countsObj['bus'] || 0)
  const totalBikes = (countsObj['motorcycle'] || 0) + (countsObj['bicycle'] || 0)

  const chartData = an?.counts ? Object.entries(an.counts).map(([k, n]) => ({ k, n })) : []

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Video Intelligence &amp; Synchronized Spatial Tracking
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          YOLOv8 vehicle detection, ByteTrack tracking, synchronized dual-panel playback, multi-factor traffic classification, and predictive collision risk.
        </p>
      </div>

      {err && (
        <div className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-xl text-xs">
          {err}
        </div>
      )}

      {/* Upload Form - NOTE: Calibration input permanently removed */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-800 dark:text-white">Upload &amp; Analyze Traffic Video</h2>
        <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Traffic Video File</label>
            <input
              type="file"
              accept="video/*"
              required
              onChange={e => setFile(e.target.files[0])}
              className="w-full file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-800 dark:file:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg p-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            />
          </div>

          <div>
            <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Corridor Location (Road / Intersection)</label>
            <input
              type="text"
              placeholder="e.g. Silk Board Junction, Bengaluru"
              value={locationInput}
              onChange={e => setLocationInput(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={!file || uploading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs shadow-md transition disabled:opacity-40"
            >
              {uploading ? 'Processing Video (YOLO + ByteTrack)…' : 'Upload & Start Intelligence Pipeline'}
            </button>
          </div>
        </form>
      </div>

      {/* Processing Status Banner */}
      {videoData && (
        <div className="flex items-center justify-between text-xs bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 p-3.5 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="font-bold text-blue-900 dark:text-blue-300">Video #{videoData.id}</span>
            <span className="text-slate-600 dark:text-slate-300">{videoData.filename}</span>
            <span className="text-slate-400">&bull; Location: <b>{videoData.loc_label || videoData.user_location || 'Unconfirmed'}</b></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">Status:</span>
            <span className={`px-2 py-0.5 rounded font-bold uppercase ${
              videoData.status === 'done' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' :
              videoData.status === 'processing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 animate-pulse' :
              'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
            }`}>
              {videoData.status}
            </span>
          </div>
        </div>
      )}

      {/* Processing State Card */}
      {videoData?.status === 'processing' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-8 text-center space-y-3">
          <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="font-bold text-sm text-slate-800 dark:text-white">
            AI Video Tracking &amp; H.264 Annotation In Progress
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            YOLOv8 vehicle detection, ByteTrack unique tracking, and browser-compatible video encoding are running on CPU. Panels will display automatically upon completion.
          </p>
        </div>
      )}

      {/* Failed State Card */}
      {videoData?.status === 'failed' && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl p-6 text-center space-y-2 text-xs">
          <div className="font-bold text-red-800 dark:text-red-300 text-sm">Video Processing Failed</div>
          <p className="text-red-700 dark:text-red-400">{videoData.error || 'An error occurred during video analysis.'}</p>
        </div>
      )}

      {/* Side-by-Side Synchronized Video Playback */}
      {videoData?.status === 'done' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span>Dual-Stream Synchronized Playback</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Playing original footage alongside AI-annotated stream with synchronized timeline controls.
              </p>
            </div>

            {/* Master Playback Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMasterPlayPause}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
              >
                {isPlaying ? '⏸ Pause Both' : '▶ Play Both Synchronously'}
              </button>
              <div className="font-mono text-xs text-slate-500 dark:text-slate-400 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                t = {currentPlaybackTime.toFixed(1)}s
              </div>
            </div>
          </div>

          {/* Side-by-Side Dual Player Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Panel 1: Original Traffic Video */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  Panel 1: Original Traffic Video
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Raw Camera Feed</span>
              </div>
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 shadow-sm">
                <video
                  ref={originalVideoRef}
                  key={`orig_${videoData.id}_${videoData.path}`}
                  src={videoData.path}
                  controls
                  onPlay={() => handlePlaySync(originalVideoRef.current)}
                  onPause={() => handlePauseSync(originalVideoRef.current)}
                  onSeeking={() => handleSeekSync(originalVideoRef.current)}
                  onTimeUpdate={handleTimeUpdate}
                  className="w-full h-full object-contain"
                >
                  Your browser does not support HTML5 video.
                </video>
              </div>
            </div>

            {/* Panel 2: AI-Annotated Video */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  Panel 2: AI-Annotated Stream (YOLOv8 + ByteTrack IDs)
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded font-mono font-bold">
                  AI Overlays Active
                </span>
              </div>
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 shadow-sm">
                <video
                  ref={annotatedVideoRef}
                  key={`annot_${videoData.id}_${videoData.annotated_path || videoData.id}`}
                  src={videoData.annotated_path || `/media/annotated/annotated_${videoData.id}.mp4`}
                  controls
                  preload="auto"
                  playsInline
                  onPlay={() => handlePlaySync(annotatedVideoRef.current)}
                  onPause={() => handlePauseSync(annotatedVideoRef.current)}
                  onSeeking={() => handleSeekSync(annotatedVideoRef.current)}
                  onTimeUpdate={handleTimeUpdate}
                  className="w-full h-full object-contain"
                >
                  Your browser does not support HTML5 video.
                </video>
              </div>
            </div>
          </div>

          {/* Live Detection Statistics Bar */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Live Detection Statistics (At t={currentPlaybackTime.toFixed(1)}s)
              </span>
              <span className="text-[10px] text-slate-400">
                Dynamically computed from tracked bounding boxes &amp; trajectory history
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-400">Active In Frame</div>
                <div className="text-lg font-extrabold text-blue-600 dark:text-blue-400">{liveStats.active}</div>
                <div className="text-[9px] text-slate-500">Live monitored</div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-400">Total Unique</div>
                <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{an?.total_unique_vehicles || 0}</div>
                <div className="text-[9px] text-slate-500">All unique tracks</div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-400">Cars (Now / Total)</div>
                <div className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                  {liveStats.cars} <span className="text-xs text-slate-400 font-normal">/ {totalCars}</span>
                </div>
                <div className="text-[9px] text-slate-500">Passenger cars</div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-400">Trucks (Now / Total)</div>
                <div className="text-lg font-extrabold text-purple-600 dark:text-purple-400">
                  {liveStats.trucks} <span className="text-xs text-slate-400 font-normal">/ {totalTrucks}</span>
                </div>
                <div className="text-[9px] text-slate-500">Commercial &amp; buses</div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-400">Bikes (Now / Total)</div>
                <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                  {liveStats.bikes} <span className="text-xs text-slate-400 font-normal">/ {totalBikes}</span>
                </div>
                <div className="text-[9px] text-slate-500">2-wheelers</div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span>Click any risk event below to seek both video players directly to that exact second.</span>
            <a
              href={`/api/videos/${videoData.id}/report.pdf`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              📄 Download Intelligence PDF Report
            </a>
          </div>
        </div>
      )}

      {/* Traffic Analytics & Multi-Factor Classification */}
      {an && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">Traffic Volume, Density &amp; Classification</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Total Unique Vehicles Observed: <b className="text-slate-900 dark:text-white">{an.total_unique_vehicles}</b>
              </p>
            </div>

            {/* Traffic Category Badge */}
            <div className="text-right">
              <span className={`px-3 py-1 rounded-lg text-xs font-extrabold uppercase shadow-sm ${
                videoData.traffic_category === 'High Traffic' ? 'bg-red-600 text-white' :
                videoData.traffic_category === 'Low Traffic' ? 'bg-emerald-600 text-white' :
                'bg-amber-600 text-white'
              }`}>
                {videoData.traffic_category || 'Medium Traffic'}
              </span>
              <div className="text-[10px] text-slate-400 mt-1">Multi-factor Traffic Index: {trafficClass.composite_traffic_index ?? 50}/100</div>
            </div>
          </div>

          {/* Explanation Banner */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
            <div className="font-semibold text-slate-800 dark:text-slate-200">Traffic Assessment Rationale:</div>
            <p className="text-slate-600 dark:text-slate-400">{trafficClass.explanation}</p>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">{trafficClass.thresholds}</div>
          </div>

          {/* Classification Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs">
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="text-slate-400 text-[10px]">Flow Rate</div>
              <div className="text-base font-bold text-slate-800 dark:text-white">{trafficClass.flow_rate_per_min || 0} veh/min</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="text-slate-400 text-[10px]">Spatial Density</div>
              <div className="text-base font-bold text-slate-800 dark:text-white">{an.density?.mean_vehicles_per_frame || 0} / frame</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="text-slate-400 text-[10px]">Peak Frame Density</div>
              <div className="text-base font-bold text-slate-800 dark:text-white">{an.density?.peak || 0} vehicles</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="text-slate-400 text-[10px]">Stationary / Crawl Ratio</div>
              <div className="text-base font-bold text-slate-800 dark:text-white">{((trafficClass.stationary_ratio || 0) * 100).toFixed(0)}%</div>
            </div>
          </div>

          {/* Vehicle Class Chart */}
          <div className="h-44 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="k" stroke="#94a3b8" fontSize={11} />
                <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="n" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* DEDICATED RISK ANALYSIS SECTION WITH CLICK-TO-SEEK */}
      {an && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>⚠️ Predictive Collision Risk &amp; Near-Miss Analysis</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Engine: <b className="text-blue-600 dark:text-blue-400">{an.risk_engine}</b> &bull; Strictly causal past observations. Click any row to seek playback.
              </p>
            </div>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-600 dark:text-slate-300 font-medium">
              {riskEvents.length} Event(s) Identified
            </span>
          </div>

          {riskEvents.length === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-800/40 p-6 text-center text-slate-400 rounded-xl text-xs">
              No potential dangerous vehicle interactions detected in this recording. All tracked paths maintained safe proximity.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="p-3">Video Timestamp</th>
                    <th>Involved Vehicles</th>
                    <th>Risk Level</th>
                    <th>Time to Collision (TTC)</th>
                    <th>Model Score</th>
                    <th>Risk Explanation &amp; Evidence</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {riskEvents.map((r, i) => (
                    <tr
                      key={i}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition"
                      onClick={() => seekVideoToTimestamp(r.ts)}
                    >
                      <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {r.ts}s
                      </td>
                      <td className="font-medium text-slate-800 dark:text-slate-200">
                        #{r.vehicle_ids.join(' & #')} ({r.classes.join('/')})
                      </td>
                      <td>
                        <span className={`px-2 py-0.5 rounded font-extrabold uppercase text-[10px] ${
                          r.level === 'critical' ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300' :
                          r.level === 'high' ? 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300' :
                          r.level === 'moderate' ? 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-300' :
                          'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300'
                        }`}>
                          {r.level}
                        </span>
                      </td>
                      <td className="font-mono">{r.ttc_s ? `${r.ttc_s}s` : 'N/A'}</td>
                      <td className="font-mono text-slate-500">{r.score}</td>
                      <td className="text-slate-600 dark:text-slate-400">{r.explanation}</td>
                      <td>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); seekVideoToTimestamp(r.ts) }}
                          className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          Seek ▶
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            * Note: YOLO identifies vehicle classes; collision risks are estimated by chronological sequence models. Video detections are model predictions, not confirmed accidents.
          </div>
        </section>
      )}

      {/* Visual Geolocation Evidence & Candidates */}
      {geo && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">Visual Geolocation Clues &amp; Candidates</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Status: <b className="capitalize text-slate-800 dark:text-white">{videoData.location_status}</b>
                {videoData.loc_label && <span className="ml-2 font-semibold text-blue-600 dark:text-blue-400">({videoData.loc_label})</span>}
              </p>
            </div>
          </div>

          {geo.candidates?.length > 0 && (
            <div className="space-y-2 mt-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Top Multi-City Visual Match Candidates:</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {geo.candidates.map((c, i) => (
                  <div key={i} className="border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 text-xs">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-white">{c.locality}, {c.city}</div>
                      <div className="text-[10px] text-slate-400">Similarity: {c.similarity} &bull; {c.match_type}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => confirmLocationCandidate(c)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs font-medium"
                    >
                      Confirm
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {geo.ocr_text?.length > 0 && (
            <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 p-2.5 rounded-lg">
              <b>Extracted OCR Road Signs:</b> {geo.ocr_text.map(t => t.text).join(' · ')}
            </div>
          )}

          <button
            type="button"
            onClick={() => confirmLocationCandidate(null)}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white underline pt-1"
          >
            Mark location as unknown (Analysis continues independently)
          </button>
        </section>
      )}

      {/* Analysis History */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-bold text-slate-800 dark:text-white">Video Analysis History</h2>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-auto text-xs">
          {videoHistory.map(h => (
            <div
              key={h.id}
              onClick={() => selectPreviousVideo(h.id)}
              className="py-2.5 px-2 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg cursor-pointer transition"
            >
              <div>
                <span className="font-bold text-blue-600 dark:text-blue-400 mr-2">#{h.id}</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{h.filename}</span>
                <span className="text-slate-400 ml-2">&bull; {h.loc_label || 'Location unconfirmed'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-500">{h.traffic_category || 'Medium Traffic'}</span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Reopen &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
