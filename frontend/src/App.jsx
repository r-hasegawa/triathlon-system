import { useState } from 'react'
import { authAPI, athleteAPI, adminAuthAPI, adminManageAPI } from './api/client'
import HomeView from './components/auth/HomeView'
import LoginView from './components/auth/LoginView'
import AdminLoginView from './components/auth/AdminLoginView'
import DashboardView from './components/dashboard/DashboardView'
import AdminDashboardView from './components/admin/AdminDashboardView'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('home')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [athleteData, setAthleteData] = useState(null)
  const [temperatureData, setTemperatureData] = useState([])
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 選手ログイン処理
  const handleLogin = async (email, password) => {
    setLoading(true)
    setError('')
    try {
      const response = await authAPI.login(email, password)
      localStorage.setItem('auth_token', response.data.token)
      setAthleteData(response.data.athlete)
      setUserRole('athlete')
      setIsLoggedIn(true)
      setCurrentView('dashboard')
    } catch (err) {
      setError('ログインに失敗しました: ' + (err.response?.data?.error || err.message))
    }
    setLoading(false)
  }

  // 管理者ログイン処理
  const handleAdminLogin = async (username, password) => {
    setLoading(true)
    setError('')
    try {
      const response = await adminAuthAPI.login(username, password)
      localStorage.setItem('auth_token', response.data.token)
      setAthleteData(response.data.admin)
      setUserRole('admin')
      setIsLoggedIn(true)
      setCurrentView('admin-dashboard')
    } catch (err) {
      setError('ログインに失敗しました: ' + (err.response?.data?.error || err.message))
    }
    setLoading(false)
  }

  // ログアウト処理
  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    setIsLoggedIn(false)
    setAthleteData(null)
    setTemperatureData([])
    setUserRole(null)
    setCurrentView('home')
    setError('')
  }

  return (
    <div className="App">
      {currentView === 'home' && (
        <HomeView onViewChange={setCurrentView} />
      )}
      {currentView === 'athlete-login' && (
        <LoginView 
          onLogin={handleLogin}
          onBack={() => setCurrentView('home')}
          loading={loading}
          error={error}
        />
      )}
      {currentView === 'admin-login' && (
        <AdminLoginView 
          onLogin={handleAdminLogin}
          onBack={() => setCurrentView('home')}
          loading={loading}
          error={error}
        />
      )}
      {currentView === 'dashboard' && (
        <DashboardView 
          athleteData={athleteData}
          temperatureData={temperatureData}
          error={error}
          onLogout={handleLogout}
          onViewChange={setCurrentView}
        />
      )}
      {currentView === 'admin-dashboard' && (
        <AdminDashboardView 
          userData={athleteData}
          onLogout={handleLogout}
          error={error}
          setError={setError}
        />
      )}
    </div>
  )
}

export default App