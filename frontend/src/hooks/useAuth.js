import { useState, useCallback } from 'react'
import { authAPI } from '../api/client'

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [athleteData, setAthleteData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const login = useCallback(async (email, password) => {
    setLoading(true)
    setError('')
    try {
      const response = await authAPI.login(email, password)
      localStorage.setItem('auth_token', response.data.token)
      setAthleteData(response.data.athlete)
      setIsLoggedIn(true)
      return true
    } catch (err) {
      setError('ログインに失敗しました: ' + (err.response?.data?.error || err.message))
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token')
    setIsLoggedIn(false)
    setAthleteData(null)
    setError('')
  }, [])

  return {
    isLoggedIn,
    athleteData,
    loading,
    error,
    login,
    logout
  }
}