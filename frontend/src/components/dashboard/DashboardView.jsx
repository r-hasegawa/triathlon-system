import AthleteInfo from './AthleteInfo'
import SimpleChart from './SimpleChart'

const DashboardView = ({ 
  athleteData, 
  temperatureData, 
  error, 
  onLogout, 
  onViewChange 
}) => {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>🏊‍♂️ トライアスロン ダッシュボード</h1>
        <button 
          onClick={onLogout} 
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#dc3545', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ログアウト
        </button>
      </div>

      {error && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          borderRadius: '4px', 
          marginBottom: '20px' 
        }}>
          {error}
        </div>
      )}

      {/* 選手情報 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', marginBottom: '30px' }}>
        <AthleteInfo 
          athleteData={athleteData} 
          dataCount={temperatureData.length} 
        />

        <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>体表温グラフ</h3>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            {temperatureData.length > 0 ? (
              <SimpleChart data={temperatureData} />
            ) : (
              <p>体表温データがありません</p>
            )}
          </div>
        </div>
      </div>

      {/* 管理者機能 */}
      <div style={{ marginTop: '40px' }}>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <button
            onClick={() => onViewChange('admin')}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            管理者画面
          </button>
        </div>
      </div>
    </div>
  )
}

export default DashboardView