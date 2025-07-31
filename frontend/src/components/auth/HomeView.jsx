const HomeView = ({ onViewChange }) => {
  return (
    <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="card" style={{ maxWidth: '500px', margin: '100px auto', textAlign: 'center' }}>
        <h1 className="title title-h1 text-center mb-30">
          🏊‍♂️ トライアスロン体表温システム
        </h1>
        
        <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '16px' }}>
          ログイン方法を選択してください
        </p>
        
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <div className="card-secondary" style={{ flex: 1, cursor: 'pointer' }} onClick={() => onViewChange('athlete-login')}>
            <h3 className="title title-h3 mb-15">🏃‍♂️ 選手ログイン</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              自分の体表温データを確認
            </p>
          </div>
          
          <div className="card-secondary" style={{ flex: 1, cursor: 'pointer' }} onClick={() => onViewChange('admin-login')}>
            <h3 className="title title-h3 mb-15">👨‍💼 管理者ログイン</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              全選手データ管理・分析
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomeView