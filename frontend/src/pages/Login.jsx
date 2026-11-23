import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Login() {
  const [activePortal, setActivePortal] = useState('police') // 'police' | 'citizen'
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [badgeId, setBadgeId] = useState('')
  const [phone, setPhone] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const { login, register } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleAuth = async (e) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      if (isRegister) {
        const u = await register({
          username,
          email,
          password,
          role: activePortal,
          full_name: fullName,
          badge_or_id: activePortal === 'police' ? badgeId : null,
          phone
        })
        navigate(u.role === 'police' ? '/police/dashboard' : '/citizen/dashboard')
      } else {
        const u = await login(username, password, activePortal)
        navigate(u.role === 'police' ? '/police/dashboard' : '/citizen/dashboard')
      }
    } catch (error) {
      setErr(error.message)
    } finally {
      setBusy(false)
    }
  }

  const fillDemo = (role) => {
    setIsRegister(false)
    setActivePortal(role)
    if (role === 'police') {
      setUsername('police_officer')
      setPassword('police123')
    } else {
      setUsername('citizen_user')
      setPassword('citizen123')
    }
    setErr('')
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center p-4 transition-colors duration-200">
      {/* Theme Toggle in top-right */}
      <div className="absolute top-5 right-5">
        <button
          onClick={toggleTheme}
          className="px-3 py-1.5 rounded-full text-xs font-medium border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>

      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 text-2xl font-black tracking-tight text-blue-600 dark:text-blue-400">
            <span className="w-3.5 h-3.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse"></span>
            Urban Traffic Intelligence
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            AI-Powered Urban Traffic Intelligence &amp; Predictive Road Safety Management Platform
          </p>
        </div>

        {/* Portal Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1 bg-slate-200 dark:bg-slate-900 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setActivePortal('police'); setErr('') }}
            className={`py-2.5 rounded-lg transition-all ${
              activePortal === 'police'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🛡️ Traffic Police Portal
          </button>
          <button
            type="button"
            onClick={() => { setActivePortal('citizen'); setErr('') }}
            className={`py-2.5 rounded-lg transition-all ${
              activePortal === 'citizen'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            👥 Citizen Portal
          </button>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 space-y-5">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">
                {activePortal === 'police' ? 'Command Center Access' : 'Public Safety Access'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isRegister ? 'Create an authorized user account' : 'Sign in to access your portal'}
              </p>
            </div>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
              activePortal === 'police' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
            }`}>
              {activePortal}
            </span>
          </div>

          {err && (
            <div className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs p-3 rounded-lg">
              {err}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-3 text-xs">
            {isRegister && (
              <>
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Officer Sharma / Citizen Varma"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@domain.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>
                {activePortal === 'police' && (
                  <div>
                    <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Badge / Officer ID</label>
                    <input
                      type="text"
                      placeholder="e.g. BTP-8842"
                      value={badgeId}
                      onChange={e => setBadgeId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                  </div>
                )}
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Username</label>
              <input
                type="text"
                required
                placeholder="Enter your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className={`w-full py-2.5 rounded-lg text-white font-semibold text-xs tracking-wide shadow-md transition disabled:opacity-40 ${
                activePortal === 'police' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {busy ? 'Processing…' : isRegister ? 'Complete Registration' : 'Sign In'}
            </button>
          </form>

          {/* Toggle Register / Login */}
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>
              {isRegister ? 'Already registered?' : "Don't have an account?"}
            </span>
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setErr('') }}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              {isRegister ? 'Sign in' : 'Create an account'}
            </button>
          </div>

          {/* Quick Demo Logins */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg space-y-1.5 text-slate-500 dark:text-slate-400">
            <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Quick Demo Sign-In:</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fillDemo('police')}
                className="flex-1 py-1 px-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 text-[11px] font-medium hover:bg-blue-50 dark:hover:bg-slate-800 transition"
              >
                Officer Demo
              </button>
              <button
                type="button"
                onClick={() => fillDemo('citizen')}
                className="flex-1 py-1 px-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium hover:bg-emerald-50 dark:hover:bg-slate-800 transition"
              >
                Citizen Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
