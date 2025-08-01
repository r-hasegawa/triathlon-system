import { useState, useEffect } from 'react'
import { athleteAPI } from '../../api/client'
import AthleteInfo from './AthleteInfo'
import SimpleChart from './SimpleChart'

const DashboardView = ({ 
  athleteData, 
  temperatureData, 
  error, 
  onLogout, 
  onViewChange 
}) => {
  const [actualTemperatureData, setActualTemperatureData] = useState([])
  const [athleteProfile, setAthleteProfile] = useState(athleteData)
  const [loading, setLoading] = useState(true)
  const [dataError, setDataError] = useState('')

  // 実際のデータを取得
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setDataError('')
      
      try {
        // プロファイル情報を取得
        const profileResponse = await athleteAPI.getProfile()
        setAthleteProfile(profileResponse.data)

        // 体表温データを取得
        const tempResponse = await athleteAPI.getTemperatureData()
        setActualTemperatureData(tempResponse.data.data || [])
        
      } catch (err) {
        setDataError('データの取得に失敗しました: ' + (err.response?.data?.error || err.message))
      }
      
      setLoading(false)
    }

    if (athleteData) {
      fetchData()
    }
  }, [athleteData])

  const currentTemperatureData = actualTemperatureData.length > 0 ? actualTemperatureData : temperatureData

  return (
    <div className="app-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div className="header">
        <h1 className="title title-h1">🏊‍♂️ トライアスロン ダッシュボード</h1>
        <button onClick={onLogout} className="btn btn-danger">
          ログアウト
        </button>
      </div>

      {(error || dataError) && (
        <div className="alert alert-danger">
          {error || dataError}
        </div>
      )}

      {loading && (
        <div className="alert alert-info">
          データを読み込み中...
        </div>
      )}

      {/* 選手情報とグラフ */}
      <div className="grid-2 mb-30">
        <EnhancedAthleteInfo 
          athleteData={athleteProfile} 
          dataCount={currentTemperatureData.length}
          loading={loading}
        />

        <div className="card">
          <h3 className="title title-h3 mb-15">体表温グラフ</h3>
          <div style={{ height: '300px' }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px' }}>
                <p>グラフを読み込み中...</p>
              </div>
            ) : currentTemperatureData.length > 0 ? (
              <SimpleChart data={currentTemperatureData} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px' }}>
                <div style={{ textAlign: 'center' }}>
                  <p>体表温データがありません</p>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    管理者にCSVデータのアップロードを依頼してください
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* データ統計情報 */}
      {currentTemperatureData.length > 0 && (
        <DataStatistics data={currentTemperatureData} />
      )}

      {/* データテーブル（最新20件） */}
      {currentTemperatureData.length > 0 && (
        <RecentDataTable data={currentTemperatureData.slice(-20)} />
      )}
    </div>
  )
}

// 拡張された選手情報コンポーネント
const EnhancedAthleteInfo = ({ athleteData, dataCount, loading }) => {
  if (loading) {
    return (
      <div className="card">
        <h3 className="title title-h3 mb-15">選手情報</h3>
        <p style={{ color: 'var(--text-secondary)' }}>読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="title title-h3 mb-15">選手情報</h3>
      <div className="mb-15">
        <p><strong>ゼッケン番号:</strong> {athleteData?.bib_number || 'N/A'}</p>
        <p><strong>名前:</strong> {athleteData?.name || 'N/A'}</p>
        <p><strong>Email:</strong> {athleteData?.email || 'N/A'}</p>
        <p><strong>HalshareID:</strong> {athleteData?.halshare_id || 'N/A'}</p>
      </div>
      
      <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '15px' }}>
        <p><strong>データ統計:</strong></p>
        <p style={{ fontSize: '14px' }}>総レコード数: {dataCount.toLocaleString()}件</p>
        
        {athleteData?.data_stats && (
          <>
            <p style={{ fontSize: '14px' }}>
              最終データ: {new Date(athleteData.data_stats.latest_datetime).toLocaleString('ja-JP')}
            </p>
            {athleteData.data_stats.temperature_range && (
              <p style={{ fontSize: '14px' }}>
                体温範囲: {athleteData.data_stats.temperature_range.min}°C 〜 {athleteData.data_stats.temperature_range.max}°C 
                (平均: {athleteData.data_stats.temperature_range.avg}°C)
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// データ統計コンポーネント
const DataStatistics = ({ data }) => {
  const temperatures = data.map(item => item.temperature)
  const stats = {
    min: Math.min(...temperatures),
    max: Math.max(...temperatures),
    avg: Math.round((temperatures.reduce((a, b) => a + b, 0) / temperatures.length) * 10) / 10,
    count: temperatures.length
  }

  // 時間範囲を計算
  const startTime = new Date(data[0].datetime)
  const endTime = new Date(data[data.length - 1].datetime)
  const duration = Math.round((endTime - startTime) / (1000 * 60 * 60)) // 時間

  return (
    <div className="card mb-30">
      <h3 className="title title-h3 mb-15">データ統計</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div>
          <p><strong>データ件数:</strong> {stats.count.toLocaleString()}件</p>
          <p><strong>記録期間:</strong> {duration}時間</p>
        </div>
        <div>
          <p><strong>最低体温:</strong> {stats.min}°C</p>
          <p><strong>最高体温:</strong> {stats.max}°C</p>
        </div>
        <div>
          <p><strong>平均体温:</strong> {stats.avg}°C</p>
          <p><strong>体温変動:</strong> {(stats.max - stats.min).toFixed(1)}°C</p>
        </div>
        <div>
          <p><strong>開始時刻:</strong> {startTime.toLocaleString('ja-JP')}</p>
          <p><strong>終了時刻:</strong> {endTime.toLocaleString('ja-JP')}</p>
        </div>
      </div>
    </div>
  )
}

// 最新データテーブル
const RecentDataTable = ({ data }) => {
  return (
    <div className="card">
      <h3 className="title title-h3 mb-15">最新データ（直近20件）</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>日時</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>体温</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>変化</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => {
              const prevTemp = index > 0 ? data[index - 1].temperature : item.temperature
              const tempChange = item.temperature - prevTemp
              const changeIcon = tempChange > 0.1 ? '↗️' : tempChange < -0.1 ? '↘️' : '➡️'
              
              return (
                <tr key={index}>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-light)', fontSize: '14px' }}>
                    {new Date(item.datetime).toLocaleString('ja-JP')}
                  </td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-light)', fontSize: '14px' }}>
                    {item.temperature}°C
                  </td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-light)', fontSize: '14px' }}>
                    {changeIcon} {tempChange > 0 ? '+' : ''}{tempChange.toFixed(1)}°C
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DashboardView