import { useState, useEffect, useRef } from 'react'
import { api } from '../../api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function VideoComparison() {
  const [videos, setVideos] = useState([])
  const [vidA, setVidA] = useState('')
  const [vidB, setVidB] = useState('')
  const [dataA, setDataA] = useState(null)
  const [dataB, setDataB] = useState(null)
  const [viewA, setViewA] = useState('annotated') // 'annotated' | 'original'
  const [viewB, setViewB] = useState('annotated')
  const [syncPlayback, setSyncPlayback] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  // Two separate video upload controls state
  const [file1, setFile1] = useState(null)
  const [loc1, setLoc1] = useState('')
  const [file2, setFile2] = useState(null)
  const [loc2, setLoc2] = useState('')

  const file1InputRef = useRef(null)
  const file2InputRef = useRef(null)
  const videoRefA = useRef(null)
  const videoRefB = useRef(null)
  const isSyncingRef = useRef(false)

  const loadVideosList = async () => {
    try {
      const vs = await api.get('/api/videos')
      const doneList = vs.filter(v => v.status === 'done')
      setVideos(doneList)
      if (doneList.length >= 2 && !vidA && !vidB) {
        const id1 = String(doneList[0].id)
        const id2 = String(doneList[1].id)
        setVidA(id1)
        setVidB(id2)
        // Automatically load and display comparison for top two videos on page load
        runCompare(id1, id2)
      }
    } catch (e) {
      setErr(e.message)
    }
  }

  useEffect(() => {
    loadVideosList()
  }, [])

  const runCompare = async (id1 = vidA, id2 = vidB) => {
    if (!id1 || !id2) return
    if (id1 === id2) {
      setErr('Please select two distinct videos to compare.')
      return
    }
    setErr('')
    setLoading(true)
    try {
      const [resA, resB] = await Promise.all([
        api.get(`/api/videos/${id1}`),
        api.get(`/api/videos/${id2}`)
      ])
      setDataA(resA)
      setDataB(resB)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  const validateFile = (file) => {
    if (!file) return 'No file selected.'
    const validExts = ['.mp4', '.avi', '.mov', '.mkv', '.webm']
    const hasValidExt = validExts.some(ext => file.name.toLowerCase().endsWith(ext))
    if (!hasValidExt) {
      return `Unsupported format for ${file.name}. Please select an MP4, AVI, MOV, or MKV video.`
    }
    if (file.size > 500 * 1024 * 1024) {
      return `File size of ${file.name} exceeds 500MB limit.`
    }
    return null
  }

  const handleDualUpload = async (e) => {
    e.preventDefault()
    if (!file1 || !file2) {
      setErr('Please select both Video 1 and Video 2 from your local files.')
      return
    }
    const err1 = validateFile(file1)
    if (err1) { setErr(err1); return }
    const err2 = validateFile(file2)
    if (err2) { setErr(err2); return }

    if (!loc1.trim() || !loc2.trim()) {
      setErr('Please provide location names for both Video 1 and Video 2.')
      return
    }

    setErr('')
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file1', file1)
      formData.append('location1', loc1.trim())
      formData.append('file2', file2)
      formData.append('location2', loc2.trim())

      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch('/api/compare/upload', {
        method: 'POST',
        headers,
        body: formData
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || 'Dual upload comparison failed')
      }

      const resJson = await res.json()
      await loadVideosList()

      const idA = resJson.video1_id || resJson.video1?.id
      const idB = resJson.video2_id || resJson.video2?.id

      if (resJson.video1 && resJson.video2) {
        setDataA(resJson.video1)
        setDataB(resJson.video2)
        setVidA(String(idA))
        setVidB(String(idB))
      } else if (idA && idB) {
        setVidA(String(idA))
        setVidB(String(idB))
        await runCompare(idA, idB)
      }
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Playback sync handlers
  const handlePlay = (leader) => {
    setIsPlaying(true)
    if (!syncPlayback || isSyncingRef.current) return
    isSyncingRef.current = true
    const follower = leader === videoRefA.current ? videoRefB.current : videoRefA.current
    if (follower && follower.paused) {
      follower.currentTime = leader.currentTime
      follower.play().catch(() => {})
    }
    setTimeout(() => { isSyncingRef.current = false }, 80)
  }

  const handlePause = (leader) => {
    setIsPlaying(false)
    if (!syncPlayback || isSyncingRef.current) return
    isSyncingRef.current = true
    const follower = leader === videoRefA.current ? videoRefB.current : videoRefA.current
    if (follower && !follower.paused) {
      follower.pause()
    }
    setTimeout(() => { isSyncingRef.current = false }, 80)
  }

  const handleSeek = (leader) => {
    if (!syncPlayback || isSyncingRef.current) return
    isSyncingRef.current = true
    const follower = leader === videoRefA.current ? videoRefB.current : videoRefA.current
    if (follower && Math.abs(follower.currentTime - leader.currentTime) > 0.15) {
      follower.currentTime = leader.currentTime
    }
    setTimeout(() => { isSyncingRef.current = false }, 80)
  }

  const toggleMasterPlay = () => {
    if (isPlaying) {
      if (videoRefA.current) videoRefA.current.pause()
      if (videoRefB.current) videoRefB.current.pause()
      setIsPlaying(false)
    } else {
      if (videoRefA.current) videoRefA.current.play().catch(() => {})
      if (videoRefB.current) videoRefB.current.play().catch(() => {})
      setIsPlaying(true)
    }
  }

  const anA = dataA?.analysis || {}
  const anB = dataB?.analysis || {}
  const classA = anA.traffic_classification || {}
  const classB = anB.traffic_classification || {}

  const countsA = anA.counts || {}
  const countsB = anB.counts || {}

  const carsA = countsA['car'] || 0
  const carsB = countsB['car'] || 0
  const trucksA = (countsA['truck'] || 0) + (countsA['bus'] || 0)
  const trucksB = (countsB['truck'] || 0) + (countsB['bus'] || 0)
  const bikesA = (countsA['motorcycle'] || 0) + (countsA['bicycle'] || 0)
  const bikesB = (countsB['motorcycle'] || 0) + (countsB['bicycle'] || 0)

  const densityA = anA.density?.mean_vehicles_per_frame || 0
  const densityB = anB.density?.mean_vehicles_per_frame || 0
  const peakA = anA.density?.peak || 0
  const peakB = anB.density?.peak || 0
  const flowA = classA.flow_rate_per_min || 0
  const flowB = classB.flow_rate_per_min || 0
  const volA = anA.total_unique_vehicles || 0
  const volB = anB.total_unique_vehicles || 0
  const risksA = anA.risk?.length || 0
  const risksB = anB.risk?.length || 0

  const allClasses = Array.from(new Set([
    ...Object.keys(countsA),
    ...Object.keys(countsB)
  ]))

  const locLabelA = dataA?.loc_label || dataA?.user_location || `Video #${dataA?.id}`
  const locLabelB = dataB?.loc_label || dataB?.user_location || `Video #${dataB?.id}`

  const chartData = allClasses.map(cls => ({
    class: cls,
    [locLabelA]: countsA[cls] || 0,
    [locLabelB]: countsB[cls] || 0
  }))

  // Automated Differential Conclusion
  const getDifferentialConclusion = () => {
    if (!dataA || !dataB) return null
    const volDiff = Math.abs(volA - volB)
    const densDiff = Math.abs(densityA - densityB)
    
    let winner = ''
    let conclusion = ''

    if (volA > volB && densityA > densityB) {
      winner = locLabelA
      conclusion = `${locLabelA} exhibits significantly heavier traffic pressure than ${locLabelB}, with ${volDiff} more observed vehicles (+${volB > 0 ? ((volDiff / volB) * 100).toFixed(0) : 100}%) and higher frame density (${densityA} vs ${densityB} veh/frame).`
    } else if (volB > volA && densityB > densityA) {
      winner = locLabelB
      conclusion = `${locLabelB} exhibits significantly heavier traffic pressure than ${locLabelA}, with ${volDiff} more observed vehicles (+${volA > 0 ? ((volDiff / volA) * 100).toFixed(0) : 100}%) and higher frame density (${densityB} vs ${densityA} veh/frame).`
    } else if (volDiff < 4 && densDiff < 1.5) {
      conclusion = `Both locations exhibit very similar traffic flow profiles (${volA} vs ${volB} vehicles, ${densityA} vs ${densityB} mean density). Congestion dynamics and road capacity utilization are balanced.`
    } else {
      const higherVol = volA >= volB ? locLabelA : locLabelB
      conclusion = `Mixed traffic patterns observed. ${higherVol} recorded greater total vehicle volume (${Math.max(volA, volB)} vs ${Math.min(volA, volB)}), while peak queuing behavior was observed at ${peakA >= peakB ? locLabelA : locLabelB} (${Math.max(peakA, peakB)} peak frame vehicles).`
    }

    return { winner, conclusion }
  }

  const diffConclusion = getDifferentialConclusion()

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Traffic Video Comparison &amp; Differential Analysis
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Side-by-side comparative analytics of two traffic locations using identical YOLOv8 + ByteTrack pipelines, density metrics, and collision risk models.
        </p>
      </div>

      {err && (
        <div className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-xl text-xs">
          {err}
        </div>
      )}

      {/* Two Separate Video Upload Controls (Local File Pickers) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span>Upload Two Local Videos for Comparative Analysis</span>
          </h2>
          <span className="text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full font-bold">
            Dual YOLOv8 + ByteTrack Engine
          </span>
        </div>

        <form onSubmit={handleDualUpload} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Control 1: Video 1 */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="font-bold text-blue-600 dark:text-blue-400 uppercase text-[11px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                Video 1 Input
              </span>

              {/* Hidden file input */}
              <input
                ref={file1InputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={e => setFile1(e.target.files[0] || null)}
              />

              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Traffic Recording File</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => file1InputRef.current?.click()}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs transition shrink-0"
                  >
                    Select Video 1
                  </button>
                  <span className="text-slate-600 dark:text-slate-300 truncate font-mono text-[11px]">
                    {file1 ? file1.name : 'No file selected'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Video 1 Corridor Location</label>
                <input
                  type="text"
                  placeholder="e.g. Silk Board Junction, Outer Ring Road"
                  value={loc1}
                  onChange={e => setLoc1(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Control 2: Video 2 */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[11px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                Video 2 Input
              </span>

              {/* Hidden file input */}
              <input
                ref={file2InputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={e => setFile2(e.target.files[0] || null)}
              />

              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Traffic Recording File</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => file2InputRef.current?.click()}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs transition shrink-0"
                  >
                    Select Video 2
                  </button>
                  <span className="text-slate-600 dark:text-slate-300 truncate font-mono text-[11px]">
                    {file2 ? file2.name : 'No file selected'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Video 2 Corridor Location</label>
                <input
                  type="text"
                  placeholder="e.g. Hebbal Flyover Corridor"
                  value={loc2}
                  onChange={e => setLoc2(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <span className="text-[11px] text-slate-400">
              Supported formats: MP4, AVI, MOV, MKV (Max 500MB). Videos are processed independently and transcoded to browser-compatible H.264.
            </span>
            <button
              type="submit"
              disabled={loading || !file1 || !file2}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs shadow-md transition disabled:opacity-40 shrink-0"
            >
              {loading ? 'Processing Dual Videos on CPU…' : 'Compare Videos'}
            </button>
          </div>
        </form>

        {/* Alternative: Select from previously analyzed videos */}
        {videos.length >= 2 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-2">
              Or compare existing videos from analyzed library:
            </span>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <select
                className="flex-1 w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 rounded-lg text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={vidA}
                onChange={e => {
                  const newA = e.target.value
                  setVidA(newA)
                  if (newA && vidB && newA !== vidB) {
                    runCompare(newA, vidB)
                  }
                }}
              >
                <option value="">Select Video 1</option>
                {videos.map(v => (
                  <option key={v.id} value={v.id}>
                    #{v.id} - {v.loc_label || v.user_location || v.filename}
                  </option>
                ))}
              </select>

              <span className="text-slate-400 font-bold text-xs">VS</span>

              <select
                className="flex-1 w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 rounded-lg text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={vidB}
                onChange={e => {
                  const newB = e.target.value
                  setVidB(newB)
                  if (vidA && newB && vidA !== newB) {
                    runCompare(vidA, newB)
                  }
                }}
              >
                <option value="">Select Video 2</option>
                {videos.map(v => (
                  <option key={v.id} value={v.id}>
                    #{v.id} - {v.loc_label || v.user_location || v.filename}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => runCompare(vidA, vidB)}
                disabled={!vidA || !vidB || vidA === vidB || loading}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-40 shrink-0"
              >
                Compare Library Videos
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading state during dual processing */}
      {loading && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-8 text-center space-y-3">
          <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="font-bold text-sm text-slate-800 dark:text-white">
            Running Dual Video AI Tracking &amp; H.264 Annotation
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Processing both video inputs on CPU through YOLOv8 vehicle detection and ByteTrack unique trajectory tracking. Comparison results will appear below.
          </p>
        </div>
      )}

      {/* Comparison Results & Playback Panels */}
      {dataA && dataB && (
        <div className="space-y-6">
          {/* Synchronized Playback Control Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleMasterPlay}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs transition"
              >
                {isPlaying ? '⏸ Pause Both Videos' : '▶ Play Both Synchronously'}
              </button>
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                <input
                  type="checkbox"
                  checked={syncPlayback}
                  onChange={e => setSyncPlayback(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                Synchronized Scrubbing &amp; Playback
              </label>
            </div>
            <div className="text-[11px] text-slate-400">
              {syncPlayback ? 'Videos seek and scrub in lockstep' : 'Independent playback active for each stream'}
            </div>
          </div>

          {/* Side-by-Side Playable Video Players */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stream 1 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  Video 1: #{dataA.id}
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold uppercase ${
                  dataA.traffic_category === 'High Traffic' ? 'bg-red-100 text-red-700' :
                  dataA.traffic_category === 'Low Traffic' ? 'bg-green-100 text-green-700' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {dataA.traffic_category || 'Medium Traffic'}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <div className="font-bold text-slate-800 dark:text-white truncate">
                  {locLabelA}
                </div>
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded text-[10px] font-medium">
                  <button
                    type="button"
                    onClick={() => setViewA('annotated')}
                    className={`px-2 py-0.5 rounded ${viewA === 'annotated' ? 'bg-blue-600 text-white font-bold' : 'text-slate-500'}`}
                  >
                    AI Annotated
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewA('original')}
                    className={`px-2 py-0.5 rounded ${viewA === 'original' ? 'bg-blue-600 text-white font-bold' : 'text-slate-500'}`}
                  >
                    Original Video
                  </button>
                </div>
              </div>

              <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 shadow-sm">
                <video
                  ref={videoRefA}
                  key={`compA_${dataA.id}_${viewA}_${viewA === 'annotated' ? (dataA.annotated_path || dataA.id) : dataA.path}`}
                  src={viewA === 'annotated' ? (dataA.annotated_path || `/media/annotated/annotated_${dataA.id}.mp4`) : dataA.path}
                  controls
                  preload="auto"
                  playsInline
                  onPlay={() => handlePlay(videoRefA.current)}
                  onPause={() => handlePause(videoRefA.current)}
                  onSeeking={() => handleSeek(videoRefA.current)}
                  className="w-full h-full object-contain"
                >
                  Your browser does not support HTML5 video.
                </video>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                  <div className="text-slate-400 text-[10px]">Vehicles</div>
                  <div className="font-extrabold text-blue-600 dark:text-blue-400 text-base">{volA}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                  <div className="text-slate-400 text-[10px]">Density</div>
                  <div className="font-extrabold text-slate-800 dark:text-white text-base">{densityA}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                  <div className="text-slate-400 text-[10px]">Risks</div>
                  <div className="font-extrabold text-amber-600 dark:text-amber-400 text-base">{risksA}</div>
                </div>
              </div>
            </div>

            {/* Stream 2 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  Video 2: #{dataB.id}
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold uppercase ${
                  dataB.traffic_category === 'High Traffic' ? 'bg-red-100 text-red-700' :
                  dataB.traffic_category === 'Low Traffic' ? 'bg-green-100 text-green-700' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {dataB.traffic_category || 'Medium Traffic'}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <div className="font-bold text-slate-800 dark:text-white truncate">
                  {locLabelB}
                </div>
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded text-[10px] font-medium">
                  <button
                    type="button"
                    onClick={() => setViewB('annotated')}
                    className={`px-2 py-0.5 rounded ${viewB === 'annotated' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-500'}`}
                  >
                    AI Annotated
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewB('original')}
                    className={`px-2 py-0.5 rounded ${viewB === 'original' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-500'}`}
                  >
                    Original Video
                  </button>
                </div>
              </div>

              <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 shadow-sm">
                <video
                  ref={videoRefB}
                  key={`compB_${dataB.id}_${viewB}_${viewB === 'annotated' ? (dataB.annotated_path || dataB.id) : dataB.path}`}
                  src={viewB === 'annotated' ? (dataB.annotated_path || `/media/annotated/annotated_${dataB.id}.mp4`) : dataB.path}
                  controls
                  preload="auto"
                  playsInline
                  onPlay={() => handlePlay(videoRefB.current)}
                  onPause={() => handlePause(videoRefB.current)}
                  onSeeking={() => handleSeek(videoRefB.current)}
                  className="w-full h-full object-contain"
                >
                  Your browser does not support HTML5 video.
                </video>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                  <div className="text-slate-400 text-[10px]">Vehicles</div>
                  <div className="font-extrabold text-indigo-600 dark:text-indigo-400 text-base">{volB}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                  <div className="text-slate-400 text-[10px]">Density</div>
                  <div className="font-extrabold text-slate-800 dark:text-white text-base">{densityB}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                  <div className="text-slate-400 text-[10px]">Risks</div>
                  <div className="font-extrabold text-amber-600 dark:text-amber-400 text-base">{risksB}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Automated Differential Conclusion Card */}
          {diffConclusion && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-blue-900 dark:text-blue-300 flex items-center gap-2">
                  <span>📊 Automated Traffic Differential Conclusion</span>
                </h3>
                <span className="text-[10px] bg-blue-600 text-white font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                  AI Evaluated
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                {diffConclusion.conclusion}
              </p>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-blue-200/60 dark:border-blue-900/60">
                Actionable Command Recommendation: {
                  diffConclusion.winner
                    ? `Prioritize traffic signal green-split optimization and officer deployment towards ${diffConclusion.winner}.`
                    : 'Maintain balanced monitoring between both arterial corridors.'
                }
              </div>
            </div>
          )}

          {/* Detailed Side-by-Side Comparison Metrics Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Corridor Telemetry Comparison Table</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="p-3">Measurement Metric</th>
                    <th>{locLabelA}</th>
                    <th>{locLabelB}</th>
                    <th>Comparative Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">Total Unique Vehicles</td>
                    <td className="font-bold text-blue-600 dark:text-blue-400 font-mono text-sm">{volA}</td>
                    <td className="font-bold text-indigo-600 dark:text-indigo-400 font-mono text-sm">{volB}</td>
                    <td className="font-mono text-slate-500">
                      {volA > volB ? `+${volA - volB} in Video 1` : volB > volA ? `+${volB - volA} in Video 2` : 'Equal volume'}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">Cars &amp; Sedans</td>
                    <td className="font-mono">{carsA}</td>
                    <td className="font-mono">{carsB}</td>
                    <td className="font-mono text-slate-500">{Math.abs(carsA - carsB)} diff</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">Trucks &amp; Heavy Freight</td>
                    <td className="font-mono">{trucksA}</td>
                    <td className="font-mono">{trucksB}</td>
                    <td className="font-mono text-slate-500">{Math.abs(trucksA - trucksB)} diff</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">Bikes &amp; 2-Wheelers</td>
                    <td className="font-mono">{bikesA}</td>
                    <td className="font-mono">{bikesB}</td>
                    <td className="font-mono text-slate-500">{Math.abs(bikesA - bikesB)} diff</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">Spatial Density (veh/frame)</td>
                    <td className="font-mono">{densityA}</td>
                    <td className="font-mono">{densityB}</td>
                    <td className="font-mono text-slate-500">{(densityA - densityB).toFixed(1)} veh/frame</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">Peak Frame Congestion</td>
                    <td className="font-mono">{peakA} veh</td>
                    <td className="font-mono">{peakB} veh</td>
                    <td className="font-mono text-slate-500">{Math.abs(peakA - peakB)} veh diff</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">Flow Throughput Rate</td>
                    <td className="font-mono">{flowA} veh/min</td>
                    <td className="font-mono">{flowB} veh/min</td>
                    <td className="font-mono text-slate-500">{(flowA - flowB).toFixed(1)} veh/min</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">Traffic Condition Assessment</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                        dataA.traffic_category === 'High Traffic' ? 'bg-red-100 text-red-700' :
                        dataA.traffic_category === 'Low Traffic' ? 'bg-green-100 text-green-700' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {dataA.traffic_category || 'Medium Traffic'}
                      </span>
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                        dataB.traffic_category === 'High Traffic' ? 'bg-red-100 text-red-700' :
                        dataB.traffic_category === 'Low Traffic' ? 'bg-green-100 text-green-700' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {dataB.traffic_category || 'Medium Traffic'}
                      </span>
                    </td>
                    <td className="text-slate-500">
                      {dataA.traffic_category === dataB.traffic_category ? 'Identical category' : 'Different categories'}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">Predicted Collision Risks</td>
                    <td className="font-mono text-amber-600 font-bold">{risksA} events</td>
                    <td className="font-mono text-amber-600 font-bold">{risksB} events</td>
                    <td className="font-mono text-slate-500">{Math.abs(risksA - risksB)} diff</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Vehicle Class Breakdown Bar Chart */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Vehicle Category Distribution Comparison</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="class" stroke="#94a3b8" fontSize={11} />
                  <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Legend />
                  <Bar dataKey={locLabelA} fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={locLabelB} fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
