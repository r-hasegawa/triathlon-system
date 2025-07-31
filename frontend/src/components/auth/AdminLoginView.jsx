import { useState } from 'react'

const AdminLoginView = ({ onLogin, onBack, loading, error }) => {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')

  return (
    <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="card" style={{ maxWidth: '400px', margin: '100px auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <button onClick={onBack} className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
            ← 戻る
          </button>
        </div>
        
        <h2 className="title title-h2 text-center mb-30">
          👨‍💼 管理者ログイン
        </h2>
        
        <div className="mb-20">
          <label className="label">ユーザー名</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input"
          />
        </div>
        
        <div className="mb-20">
          <label className="label">パスワード</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        </div>
        
        <button
          onClick={() => onLogin(username, password)}
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading ? 'ログイン中...' : 'ログイン'}
        </button>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        <div className="alert alert-info">
          <strong>テスト用ログイン情報:</strong><br />
          Username: admin<br />
          Password: admin123
        </div>
      </div>
    </div>
  )
}

export default AdminLoginView