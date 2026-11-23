import { useState } from 'react'
import { NavLink, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'

// Auth Page
import Login from './pages/Login'

// Police Portal Pages
import PoliceDashboard from './pages/police/Dashboard'
import PoliceVideoIntel from './pages/police/VideoIntel'
import PoliceVideoComparison from './pages/police/VideoComparison'
import PoliceMapPage from './pages/police/MapPage'
import PoliceForecast from './pages/police/Forecast'
import PoliceIncidentManagement from './pages/police/IncidentManagement'
import PoliceAlertsManagement from './pages/police/AlertsManagement'
import PoliceAssistant from './pages/police/Assistant'

// Citizen Portal Pages
import CitizenDashboard from './pages/citizen/CitizenDashboard'
import TrafficSafetyMap from './pages/citizen/TrafficSafetyMap'
import CongestionForecast from './pages/citizen/CongestionForecast'
import ReportIssue from './pages/citizen/ReportIssue'
import PublicAlerts from './pages/citizen/PublicAlerts'
import MyReports from './pages/citizen/MyReports'
import CitizenAssistant from './pages/citizen/CitizenAssistant'
import PredictiveRiskAlerts from './pages/citizen/PredictiveRiskAlerts'
import NearbySafety from './pages/citizen/NearbySafety'
import TrafficTrends from './pages/citizen/TrafficTrends'

const policeNav = [
  { to: '/police/dashboard', label: 'Command Overview', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { to: '/police/video', label: 'Video Intelligence', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
  { to: '/police/compare', label: 'Video Comparison', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { to: '/police/map', label: 'GIS Command Map', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
  { to: '/police/forecast', label: 'Traffic Forecast', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' },
  { to: '/police/incidents', label: 'Incident Triage', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { to: '/police/alerts', label: 'Public Alerts', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
  { to: '/police/assistant', label: 'Police AI Assistant', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' }
]

const citizenNav = [
  { to: '/citizen/dashboard', label: 'Citizen Safety Hub', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/citizen/map', label: 'Traffic & Safety Map', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
  { to: '/citizen/predictive-risks', label: 'Predictive Risk Alerts', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  { to: '/citizen/nearby-safety', label: 'Nearby Safety & Corridors', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { to: '/citizen/trends', label: 'Traffic Trends & Telemetry', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' },
  { to: '/citizen/forecast', label: '24h Congestion Forecast', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  { to: '/citizen/report', label: 'Report Road Hazard', icon: 'M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z' },
  { to: '/citizen/my-reports', label: 'My Hazard Reports', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { to: '/citizen/assistant', label: 'Citizen AI Assistant', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' }
]

// Strict Route Guards
function PoliceRoute({ children }) {
  const { user, loading, isAuthenticated, isPolice } = useAuth()
  if (loading) return <div className="p-8 text-center text-xs text-slate-400">Authenticating command session...</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isPolice) return <Navigate to="/citizen/dashboard" replace />
  return children
}

function CitizenRoute({ children }) {
  const { user, loading, isAuthenticated, isCitizen } = useAuth()
  if (loading) return <div className="p-8 text-center text-xs text-slate-400">Authenticating public session...</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isCitizen) return <Navigate to="/police/dashboard" replace />
  return children
}

function AppLayout() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout, isPolice, isCitizen, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Active navigation strictly scoped to current user role
  const activeNav = isPolice ? policeNav : citizenNav

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex flex-col justify-between hidden md:flex">
        <div className="p-4 space-y-4">
          {/* Logo Brand */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md ${
              isPolice ? 'bg-blue-600 shadow-blue-500/20' : 'bg-emerald-600 shadow-emerald-500/20'
            }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white leading-none">
                TRAFFIC AI
              </div>
              <div className={`text-[10px] font-semibold tracking-wider uppercase mt-1 ${
                isPolice ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {isPolice ? 'Police Command' : 'Citizen Safety'}
              </div>
            </div>
          </div>

          {/* Navigation Items (STRICTLY SCOPED TO LOGGED-IN ROLE - NO SWITCHER) */}
          <div className="space-y-1 pt-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-3 pb-1 tracking-wider">
              {isPolice ? 'Police Command Functions' : 'Citizen Safety Services'}
            </div>
            {activeNav.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ' +
                  (isActive
                    ? isPolice
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-bold'
                      : 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70')
                }
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                </svg>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* User Session Card & Sign Out */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          {isAuthenticated && user ? (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <div className="min-w-0">
                <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                  {user.full_name || user.username}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${user.role === 'police' ? 'bg-blue-500' : 'bg-emerald-500'}`}></span>
                  <span className="capitalize">{user.role} {user.badge_or_id ? `(#${user.badge_or_id})` : ''}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              Sign In to Platform
            </button>
          )}

          <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between px-1">
            <span>CPU Causal ML Engine</span>
            <span className="font-mono">v2.0.0</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Bengaluru Urban Intelligence &amp; Road Safety Grid
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Dark/Light Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 text-xs font-semibold"
              title="Toggle Dark / Light Mode"
            >
              {theme === 'dark' ? (
                <>
                  <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>

            {/* User Profile and Sign Out Button */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                  user.role === 'police'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                }`}>
                  {user.role}
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {user.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="ml-1 px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Police Portal Routes (Protected by PoliceRoute) */}
            <Route path="/police" element={<PoliceRoute><Navigate to="/police/dashboard" replace /></PoliceRoute>} />
            <Route path="/police/dashboard" element={<PoliceRoute><PoliceDashboard /></PoliceRoute>} />
            <Route path="/police/overview" element={<PoliceRoute><Navigate to="/police/dashboard" replace /></PoliceRoute>} />
            <Route path="/police/video" element={<PoliceRoute><PoliceVideoIntel /></PoliceRoute>} />
            <Route path="/police/compare" element={<PoliceRoute><PoliceVideoComparison /></PoliceRoute>} />
            <Route path="/police/map" element={<PoliceRoute><PoliceMapPage /></PoliceRoute>} />
            <Route path="/police/forecast" element={<PoliceRoute><PoliceForecast /></PoliceRoute>} />
            <Route path="/police/incidents" element={<PoliceRoute><PoliceIncidentManagement /></PoliceRoute>} />
            <Route path="/police/alerts" element={<PoliceRoute><PoliceAlertsManagement /></PoliceRoute>} />
            <Route path="/police/assistant" element={<PoliceRoute><PoliceAssistant /></PoliceRoute>} />

            {/* Citizen Portal Routes (Protected by CitizenRoute) */}
            <Route path="/citizen" element={<CitizenRoute><Navigate to="/citizen/dashboard" replace /></CitizenRoute>} />
            <Route path="/citizen/dashboard" element={<CitizenRoute><CitizenDashboard /></CitizenRoute>} />
            <Route path="/citizen/map" element={<CitizenRoute><TrafficSafetyMap /></CitizenRoute>} />
            <Route path="/citizen/predictive-risks" element={<CitizenRoute><PredictiveRiskAlerts /></CitizenRoute>} />
            <Route path="/citizen/nearby-safety" element={<CitizenRoute><NearbySafety /></CitizenRoute>} />
            <Route path="/citizen/trends" element={<CitizenRoute><TrafficTrends /></CitizenRoute>} />
            <Route path="/citizen/forecast" element={<CitizenRoute><CongestionForecast /></CitizenRoute>} />
            <Route path="/citizen/report" element={<CitizenRoute><ReportIssue /></CitizenRoute>} />
            <Route path="/citizen/my-reports" element={<CitizenRoute><MyReports /></CitizenRoute>} />
            <Route path="/citizen/alerts" element={<Navigate to="/citizen/dashboard" replace />} />
            <Route path="/citizen/assistant" element={<CitizenRoute><CitizenAssistant /></CitizenRoute>} />

            {/* Fallback & Root redirect based on role */}
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  isPolice ? <Navigate to="/police/dashboard" replace /> : <Navigate to="/citizen/dashboard" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="*"
              element={
                isAuthenticated ? (
                  isPolice ? <Navigate to="/police/dashboard" replace /> : <Navigate to="/citizen/dashboard" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </ThemeProvider>
  )
}
