import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 認証トークンを自動追加
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email, password) => 
    apiClient.post('/auth/login', { email, password }),
};

export const athleteAPI = {
  getProfile: () => apiClient.get('/athlete/profile'),
  getTemperatureData: () => apiClient.get('/athlete/temperature-data'),
};

export const adminAPI = {
  uploadAthletes: (csvData) => 
    apiClient.post('/admin/athletes', { csvData }),
  uploadTemperatureData: (csvData) => 
    apiClient.post('/admin/temperature', { csvData }),
  getStats: () => apiClient.get('/admin/stats'),
};

// 既存のAPI関数に追加

export const adminAuthAPI = {
  login: (username, password) => 
    apiClient.post('/admin/login', { username, password }),
};

export const adminManageAPI = {
  getAllAthletes: () => apiClient.get('/admin/athletes'),
  getAthleteData: (halshareId) => apiClient.get(`/admin/athletes/${halshareId}/data`),
  createAthlete: (athleteData) => apiClient.post('/admin/athletes/create', athleteData),
  // 既存のアップロード機能
  uploadAthletes: (csvData) => apiClient.post('/admin/athletes', { csvData }),
  uploadTemperatureData: (csvData) => apiClient.post('/admin/temperature', { csvData }),
  getStats: () => apiClient.get('/admin/stats'),
};