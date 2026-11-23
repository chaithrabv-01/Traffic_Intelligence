import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'

const HAZARD_CATEGORIES = [
  'Accident',
  'Pothole',
  'Waterlogging',
  'Road Damage',
  'Damaged Traffic Signal',
  'Roadblock',
  'Illegal Parking',
  'Dangerous Driving',
  'Road Construction',
  'Other'
]

export default function ReportIssue() {
  const [category, setCategory] = useState('Accident')
  const [locationName, setLocationName] = useState('')
  const [description, setDescription] = useState('')
  const [evidenceFile, setEvidenceFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submittedReport, setSubmittedReport] = useState(null)
  const [error, setError] = useState('')

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setEvidenceFile(file)
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file))
      } else {
        setPreviewUrl(null)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!locationName.trim()) {
      setError('Please provide the road name, junction, or landmark.')
      return
    }
    if (!description.trim()) {
      setError('Please provide a detailed description of the road hazard.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('category', category)
      fd.append('location_name', locationName.trim())
      fd.append('description', description.trim())
      if (evidenceFile) {
        fd.append('evidence', evidenceFile)
      }

      const res = await api.uploadIncident(fd)
      setSubmittedReport(res)
    } catch (err) {
      setError(err.message || 'Failed to submit report. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 inline-block"></span>
          Report a Road Hazard
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Submit live hazard reports to the Bengaluru Traffic Police command center. Reports are verified by field officers before publication to keep fellow citizens safe.
        </p>
      </div>

      {submittedReport ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-emerald-300 dark:border-emerald-800 shadow-md text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            ✓
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Incident Report Submitted Successfully
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Your report <b>#{submittedReport.id}</b> ({submittedReport.category}) has been transmitted to Traffic Police Incident Triage.
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs text-slate-600 dark:text-slate-300">
            Initial Status: <b className="text-amber-600 dark:text-amber-400">Pending Verification</b>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setSubmittedReport(null)
                setLocationName('')
                setDescription('')
                setEvidenceFile(null)
                setPreviewUrl(null)
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
            >
              Report Another Hazard
            </button>
            <Link
              to="/citizen/my-reports"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              Track in My Reports &rarr;
            </Link>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 text-xs"
        >
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 rounded-lg">
              {error}
            </div>
          )}

          {/* 1. Hazard Category */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Hazard Category *
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {HAZARD_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* 2. Location (Text only, geocoded on backend) */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Location / Landmark *
            </label>
            <input
              type="text"
              required
              value={locationName}
              onChange={e => setLocationName(e.target.value)}
              placeholder="e.g. Sony World Junction, Koramangala 80ft Road"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[10px] text-slate-400">
              Geographical coordinates are resolved automatically by the backend mapping service.
            </p>
          </div>

          {/* 3. Detailed Description */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Detailed Description *
            </label>
            <textarea
              required
              rows="3"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the hazard (e.g. Deep pothole on right lane causing vehicles to brake abruptly; waterlogged left lane)..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 4. Evidence Photo */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Evidence Photo / Video (Optional)
            </label>
            <div className="mt-1 flex items-center justify-center px-4 py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-blue-500 transition cursor-pointer relative bg-slate-50/50 dark:bg-slate-900/40">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="text-center space-y-1">
                <svg className="mx-auto h-7 w-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div className="text-slate-600 dark:text-slate-400 font-medium">
                  {evidenceFile ? <span className="font-bold text-blue-600">{evidenceFile.name}</span> : 'Click or drop photo evidence here'}
                </div>
                <div className="text-[10px] text-slate-400">PNG, JPG, MP4 supported (stored in persistent file storage)</div>
              </div>
            </div>

            {previewUrl && (
              <div className="mt-2">
                <img src={previewUrl} alt="Upload preview" className="w-full max-h-48 object-cover rounded-xl border border-slate-200 dark:border-slate-700" />
              </div>
            )}
          </div>

          {/* 5. Submit Report Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Transmitting Report to Traffic Police...
              </>
            ) : (
              'Submit Report'
            )}
          </button>
        </form>
      )}
    </div>
  )
}
