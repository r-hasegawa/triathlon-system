import { useState } from 'react'
import { adminManageAPI } from '../../api/client'

const AdminDashboardView = ({ userData, onLogout, error, setError }) => {
  const [athletes, setAthletes] = useState([])
  const [adminView, setAdminView] = useState('overview')
  const [athletesLoaded, setAthletesLoaded] = useState(false)

  // 選手一覧取得
  const fetchAthletes = async () => {
    try {
      const response = await adminManageAPI.getAllAthletes()
      setAthletes(response.data.athletes)
      setAthletesLoaded(true)
    } catch (err) {
      setError('選手データの取得に失敗しました')
    }
  }

  return (
    <div className="app-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div className="header">
        <h1 className="title title-h1">👨‍💼 管理者ダッシュボード</h1>
        <div>
          <span style={{ marginRight: '15px', color: 'var(--text-secondary)' }}>
            ユーザー: {userData?.username}
          </span>
          <button onClick={onLogout} className="btn btn-danger">
            ログアウト
          </button>
        </div>
      </div>

      {/* ナビゲーション */}
      <div className="card mb-30">
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setAdminView('overview')} 
            className={`btn ${adminView === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
          >
            📊 概要
          </button>
          <button 
            onClick={() => { 
              setAdminView('athletes'); 
              if (!athletesLoaded) fetchAthletes(); 
            }} 
            className={`btn ${adminView === 'athletes' ? 'btn-primary' : 'btn-secondary'}`}
          >
            👥 選手一覧
          </button>
          <button 
            onClick={() => setAdminView('create')} 
            className={`btn ${adminView === 'create' ? 'btn-primary' : 'btn-secondary'}`}
          >
            ➕ 選手作成
          </button>
          <button 
            onClick={() => setAdminView('upload')} 
            className={`btn ${adminView === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
          >
            📁 データアップロード
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* 概要ビュー */}
      {adminView === 'overview' && (
        <div className="grid-2">
          <div className="card">
            <h3 className="title title-h3 mb-15">システム統計</h3>
            <p><strong>登録選手数:</strong> 3名</p>
            <p><strong>総データ数:</strong> 150件</p>
            <p><strong>最終更新:</strong> 2025-07-31</p>
          </div>
          <div className="card">
            <h3 className="title title-h3 mb-15">最近の活動</h3>
            <p>• 新しい選手データがアップロードされました</p>
            <p>• 体表温データが更新されました</p>
          </div>
        </div>
      )}

      {/* 選手一覧ビュー */}
      {adminView === 'athletes' && (
        <div className="card">
          <h3 className="title title-h3 mb-15">選手一覧</h3>
          {athletes.length === 0 && !athletesLoaded && (
            <p style={{ color: 'var(--text-secondary)' }}>選手データを読み込み中...</p>
          )}
          {athletes.map((athlete, index) => (
            <div key={index} className="card-secondary mb-15">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p><strong>{athlete.name}</strong> (#{athlete.bib_number})</p>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {athlete.email} | {athlete.halshare_id} | データ数: {athlete.data_count}件
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    最終データ: {athlete.last_data_time}
                  </p>
                </div>
                <button className="btn btn-primary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                  詳細表示
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 選手作成ビュー */}
      {adminView === 'create' && <AthleteCreateForm />}

      {/* データアップロードビュー */}
      {adminView === 'upload' && <DataUploadForm />}
    </div>
  )
}

// 選手作成フォーム
const AthleteCreateForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    bib_number: '',
    halshare_id: ''
  })
  const [creating, setCreating] = useState(false)

  const handleSubmit = async () => {
    if (!formData.email || !formData.password || !formData.name || !formData.bib_number || !formData.halshare_id) {
      alert('全ての項目を入力してください')
      return
    }

    setCreating(true)
    try {
      const response = await adminManageAPI.createAthlete(formData)
      alert('✅ 選手アカウントを作成しました！\n' + response.data.message)
      setFormData({ email: '', password: '', name: '', bib_number: '', halshare_id: '' })
    } catch (err) {
      alert('❌ 作成失敗: ' + (err.response?.data?.error || err.message))
    }
    setCreating(false)
  }

  return (
    <div className="card">
      <h3 className="title title-h3 mb-15">新しい選手アカウント作成</h3>
      <div className="grid-2">
        <div>
          <div className="mb-15">
            <label className="label">メールアドレス</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="input"
              placeholder="athlete@example.com"
            />
          </div>
          <div className="mb-15">
            <label className="label">パスワード</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="input"
              placeholder="パスワードを入力"
            />
          </div>
          <div className="mb-15">
            <label className="label">選手名</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="input"
              placeholder="山田太郎"
            />
          </div>
        </div>
        <div>
          <div className="mb-15">
            <label className="label">ゼッケン番号</label>
            <input
              type="text"
              value={formData.bib_number}
              onChange={(e) => setFormData({...formData, bib_number: e.target.value})}
              className="input"
              placeholder="004"
            />
          </div>
          <div className="mb-15">
            <label className="label">HalshareID</label>
            <input
              type="text"
              value={formData.halshare_id}
              onChange={(e) => setFormData({...formData, halshare_id: e.target.value})}
              className="input"
              placeholder="110000021B20"
            />
          </div>
          <button 
            onClick={handleSubmit} 
            disabled={creating}
            className="btn btn-success w-full"
          >
            {creating ? '⏳ 作成中...' : '✅ アカウント作成'}
          </button>
        </div>
      </div>
    </div>
  )
}

// データアップロードフォーム（既存のAdminViewから移植）
const DataUploadForm = () => {
  const [csvData, setCsvData] = useState('')
  const [uploadType, setUploadType] = useState('athletes')
  const [uploading, setUploading] = useState(false)

  const handleUpload = async () => {
    if (!csvData.trim()) {
      alert('CSVデータを入力してください')
      return
    }

    setUploading(true)
    try {
      let response
      if (uploadType === 'athletes') {
        response = await adminManageAPI.uploadAthletes(csvData)
      } else {
        response = await adminManageAPI.uploadTemperatureData(csvData)
      }
      alert('✅ アップロード成功！\n' + (response.data.message || ''))
      setCsvData('')
    } catch (err) {
      alert('❌ アップロード失敗:\n' + (err.response?.data?.error || err.message))
    }
    setUploading(false)
  }

  return (
    <div className="card">
      <h3 className="title title-h3 mb-15">CSVデータアップロード</h3>
      <div className="mb-20">
        <label className="label">アップロード種類:</label>
        <select 
          value={uploadType} 
          onChange={(e) => setUploadType(e.target.value)}
          className="input"
          style={{ width: 'auto', minWidth: '200px' }}
        >
          <option value="athletes">👥 選手データ</option>
          <option value="temperature">🌡️ 体表温データ</option>
        </select>
      </div>

      <div className="mb-20">
        <label className="label">CSVデータ:</label>
        <textarea
          value={csvData}
          onChange={(e) => setCsvData(e.target.value)}
          placeholder={uploadType === 'athletes' ? 
            'email,password,name,bib_number,halshare_id\ntest2@example.com,password123,テスト選手2,002,110000021B18' :
            'halshareId,datetime,temperature\n110000021B17,2025/07/26 09:00:00,36.5\n110000021B17,2025/07/26 09:05:00,36.7'
          }
          className="textarea"
          style={{ height: '200px' }}
        />
      </div>

      <button 
        onClick={handleUpload}
        disabled={uploading}
        className="btn btn-primary"
      >
        {uploading ? '⏳ アップロード中...' : '🚀 アップロード'}
      </button>
    </div>
  )
}

export default AdminDashboardView