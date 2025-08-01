import { useState } from 'react'
import { adminManageAPI } from '../../api/client'

const AdminDashboardView = ({ userData, onLogout, error, setError }) => {
  const [athletes, setAthletes] = useState([])
  const [adminView, setAdminView] = useState('overview')
  const [athletesLoaded, setAthletesLoaded] = useState(false)
  const [systemStats, setSystemStats] = useState(null)

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

  // システム統計取得
  const fetchStats = async () => {
    try {
      const response = await adminManageAPI.getStats()
      setSystemStats(response.data)
    } catch (err) {
      setError('統計データの取得に失敗しました')
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
            onClick={() => { 
              setAdminView('overview'); 
              if (!systemStats) fetchStats(); 
            }} 
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
            {systemStats ? (
              <>
                <p><strong>登録選手数:</strong> {systemStats.athletes_count}名</p>
                <p><strong>総データ数:</strong> {systemStats.temperature_records.toLocaleString()}件</p>
                <p><strong>最終更新:</strong> {new Date(systemStats.last_updated).toLocaleString('ja-JP')}</p>
                {systemStats.data_summary && (
                  <>
                    <p><strong>デバイス数:</strong> {systemStats.data_summary.unique_devices}台</p>
                    {systemStats.data_summary.date_range && (
                      <p><strong>データ期間:</strong><br />
                        {new Date(systemStats.data_summary.date_range.earliest).toLocaleDateString('ja-JP')} 〜<br />
                        {new Date(systemStats.data_summary.date_range.latest).toLocaleDateString('ja-JP')}
                      </p>
                    )}
                  </>
                )}
              </>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>統計を読み込み中...</p>
            )}
          </div>
          <div className="card">
            <h3 className="title title-h3 mb-15">クイックアクション</h3>
            <button 
              onClick={() => setAdminView('upload')} 
              className="btn btn-primary mb-15" 
              style={{ width: '100%' }}
            >
              📁 CSVデータをアップロード
            </button>
            <button 
              onClick={() => { setAdminView('athletes'); if (!athletesLoaded) fetchAthletes(); }} 
              className="btn btn-secondary mb-15" 
              style={{ width: '100%' }}
            >
              👥 選手一覧を表示
            </button>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              • CSVファイルから体表温データを一括インポート<br />
              • 新しい選手アカウントを手動作成<br />
              • 全選手のデータ状況を確認
            </p>
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
          {athletes.length === 0 && athletesLoaded && (
            <div className="alert alert-info">
              まだ選手が登録されていません。CSVデータをアップロードするか、手動で選手を作成してください。
            </div>
          )}
          {athletes.map((athlete, index) => (
            <div key={index} className="card-secondary mb-15">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p><strong>{athlete.name}</strong> (#{athlete.bib_number})</p>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {athlete.email} | {athlete.halshare_id}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    データ数: {athlete.data_count.toLocaleString()}件 | 
                    最終データ: {athlete.last_data_time !== '未取得' ? 
                      new Date(athlete.last_data_time).toLocaleString('ja-JP') : '未取得'
                    }
                    {athlete.avg_temperature && (
                      ` | 平均体温: ${athlete.avg_temperature}°C`
                    )}
                  </p>
                </div>
                <button 
                  className="btn btn-primary" 
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                  onClick={() => viewAthleteDetails(athlete.halshare_id)}
                >
                  詳細表示
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 選手作成ビュー */}
      {adminView === 'create' && <AthleteCreateForm setError={setError} />}

      {/* データアップロードビュー */}
      {adminView === 'upload' && <DataUploadForm setError={setError} onSuccess={() => {
        setAthletesLoaded(false);
        setSystemStats(null);
      }} />}
    </div>
  )

  // 選手詳細表示（今後実装）
  function viewAthleteDetails(halshareId) {
    alert(`選手詳細機能は今後実装予定です\nHalshare ID: ${halshareId}`)
  }
}

// 選手作成フォーム
const AthleteCreateForm = ({ setError }) => {
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
      setError('全ての項目を入力してください')
      return
    }

    setCreating(true)
    try {
      const response = await adminManageAPI.createAthlete(formData)
      alert('✅ 選手アカウントを作成しました！\n' + response.data.message)
      setFormData({ email: '', password: '', name: '', bib_number: '', halshare_id: '' })
      setError('')
    } catch (err) {
      setError('作成失敗: ' + (err.response?.data?.error || err.message))
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

// データアップロードフォーム（ファイルアップロード対応）
const DataUploadForm = ({ setError, onSuccess }) => {
  const [csvData, setCsvData] = useState('')
  const [uploadType, setUploadType] = useState('temperature')
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState(null)
  const [uploadResult, setUploadResult] = useState(null)
  const [csvPreview, setCsvPreview] = useState(null)

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0]
    if (uploadedFile && uploadedFile.type === 'text/csv') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target.result
        setCsvData(content)
        setUploadResult(null)
        
        // CSV プレビュー生成
        generateCsvPreview(content)
      }
      reader.readAsText(uploadedFile, 'UTF-8') // UTF-8で読み込み
      setFile(uploadedFile)
    } else {
      setError('CSVファイルを選択してください')
    }
  }

  const generateCsvPreview = (content) => {
    try {
      // 最初の100行程度でプレビュー生成
      const lines = content.split('\n').slice(0, 101) // ヘッダー + 100行
      const previewContent = lines.join('\n')
      
      // 簡易CSV解析（プレビュー用）
      const rows = lines.filter(line => line.trim()).slice(0, 6) // ヘッダー + 5行表示
      const parsedRows = rows.map(row => {
        // ダブルクォート対応の簡易パース
        const columns = []
        let current = ''
        let inQuotes = false
        
        for (let i = 0; i < row.length; i++) {
          const char = row[i]
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === ',' && !inQuotes) {
            columns.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
        columns.push(current.trim()) // 最後の列
        return columns
      })

      setCsvPreview({
        totalLines: content.split('\n').length - 1, // ヘッダー除く
        headers: parsedRows[0] || [],
        sampleRows: parsedRows.slice(1) || [],
        fileSize: new Blob([content]).size
      })
    } catch (err) {
      console.warn('CSV プレビュー生成エラー:', err)
      setCsvPreview(null)
    }
  }

  const handleUpload = async () => {
    if (!csvData.trim()) {
      setError('CSVデータを入力してください')
      return
    }

    // データサイズをチェック
    const dataSize = new Blob([csvData]).size
    const estimatedRows = csvData.split('\n').length - 1
    
    if (estimatedRows > 1000) {
      const confirm = window.confirm(
        `大量データ（${estimatedRows.toLocaleString()}行, ${Math.round(dataSize/1024)}KB）をアップロードしようとしています。\n` +
        `処理に時間がかかる可能性があります。続行しますか？`
      )
      if (!confirm) return
    }

    setUploading(true)
    setError('')
    setUploadResult(null)
    
    try {
      console.log(`アップロード開始: ${estimatedRows}行のデータ`)
      const startTime = Date.now()
      
      let response
      if (uploadType === 'athletes') {
        response = await adminManageAPI.uploadAthletes(csvData)
      } else {
        response = await adminManageAPI.uploadTemperatureData(csvData)
      }
      
      const processingTime = Date.now() - startTime
      console.log(`アップロード完了: ${processingTime}ms`)
      
      setUploadResult({
        ...response.data,
        clientProcessingTime: processingTime
      })
      setCsvData('')
      setFile(null)
      setCsvPreview(null)
      onSuccess()
      
      // 詳細な成功メッセージを表示
      let message = '✅ アップロード成功！\n' + response.data.message
      if (response.data.newAthletesCreated) {
        message += '\n' + response.data.newAthletesCreated
      }
      if (response.data.processingTimeMs) {
        message += `\n処理時間: ${(response.data.processingTimeMs / 1000).toFixed(1)}秒`
      }
      if (response.data.invalidRows > 0) {
        message += `\n⚠️ スキップされた行: ${response.data.invalidRows}行`
      }
      
      alert(message)
      
    } catch (err) {
      console.error('アップロードエラー:', err)
      
      let errorMessage = 'アップロード失敗: '
      
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        errorMessage += 'タイムアウトエラーが発生しました。データが大きすぎる可能性があります。'
      } else if (err.response?.status === 504) {
        errorMessage += 'サーバータイムアウトエラー（504）'
      } else {
        errorMessage += err.response?.data?.error || err.message
      }
      
      setError(errorMessage)
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
          <option value="temperature">🌡️ 体表温データ（推奨）</option>
          <option value="athletes">👥 選手データ</option>
        </select>
      </div>

      <div className="mb-20">
        <label className="label">CSVファイル選択:</label>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="input"
        />
        {file && (
          <div style={{ fontSize: '12px', color: 'var(--color-success)', marginTop: '5px' }}>
            ✅ 選択済み: {file.name} ({Math.round(file.size / 1024)}KB)
          </div>
        )}
      </div>

      {/* CSV プレビュー */}
      {csvPreview && (
        <div className="mb-20" style={{ border: '1px solid var(--border-light)', borderRadius: '4px', padding: '15px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>📋 CSV プレビュー</h4>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            総行数: {csvPreview.totalLines.toLocaleString()}行 | 
            ファイルサイズ: {Math.round(csvPreview.fileSize / 1024)}KB
          </div>
          
          {csvPreview.headers.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    {csvPreview.headers.map((header, i) => (
                      <th key={i} style={{ padding: '6px 8px', border: '1px solid var(--border-light)', textAlign: 'left' }}>
                        {header.replace(/"/g, '')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.sampleRows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} style={{ padding: '4px 8px', border: '1px solid var(--border-light)' }}>
                          {String(cell).replace(/"/g, '').substring(0, 50)}
                          {String(cell).length > 50 ? '...' : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="mb-20">
        <label className="label">CSVデータ確認:</label>
        <textarea
          value={csvData.substring(0, 2000) + (csvData.length > 2000 ? '\n... (省略)' : '')}
          onChange={(e) => setCsvData(e.target.value)}
          className="textarea"
          style={{ height: '150px' }}
          placeholder="CSVファイルを選択するか、直接貼り付けてください"
          readOnly={!!file}
        />
        {csvData && (
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '5px' }}>
            データ行数: {(csvData.split('\n').length - 1).toLocaleString()}行
            {csvData.split('\n').length > 501 && (
              <span style={{ color: 'var(--color-warning)', fontWeight: 'bold' }}>
                {' '}(大量データ)
              </span>
            )}
          </p>
        )}
      </div>

      <button 
        onClick={handleUpload}
        disabled={uploading || !csvData.trim()}
        className="btn btn-primary"
      >
        {uploading ? '⏳ アップロード中...' : '🚀 アップロード'}
      </button>

      {uploadResult && (
        <div className="alert alert-success" style={{ marginTop: '20px' }}>
          <h4>アップロード結果:</h4>
          <p><strong>処理件数:</strong> {uploadResult.count.toLocaleString()}件</p>
          {uploadResult.invalidRows > 0 && (
            <p><strong>スキップ行数:</strong> {uploadResult.invalidRows}行</p>
          )}
          {uploadResult.newAthletesCreated && (
            <p><strong>新規選手:</strong> {uploadResult.newAthletesCreated}</p>
          )}
          {uploadResult.processingTimeMs && (
            <p><strong>処理時間:</strong> {(uploadResult.processingTimeMs / 1000).toFixed(1)}秒</p>
          )}
          {uploadResult.validation_errors && (
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', color: 'var(--color-warning)' }}>
                検証エラーの詳細を表示
              </summary>
              <pre style={{ fontSize: '11px', backgroundColor: 'var(--bg-secondary)', padding: '10px', borderRadius: '4px', marginTop: '5px' }}>
                {JSON.stringify(uploadResult.validation_errors, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminDashboardView