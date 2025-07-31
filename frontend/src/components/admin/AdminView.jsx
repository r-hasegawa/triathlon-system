import { useState } from 'react'
import { adminAPI } from '../../api/client'

const AdminView = ({ onViewChange }) => {
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
        response = await adminAPI.uploadAthletes(csvData)
      } else {
        response = await adminAPI.uploadTemperatureData(csvData)
      }
      alert('アップロード成功！ ' + (response.data.message || ''))
      setCsvData('')
    } catch (err) {
      alert('アップロード失敗: ' + (err.response?.data?.error || err.message))
    }
    setUploading(false)
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2>管理者画面</h2>
        <button 
          onClick={() => onViewChange('dashboard')} 
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#6c757d', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          戻る
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>アップロード種類:</label>
        <select 
          value={uploadType} 
          onChange={(e) => setUploadType(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="athletes">選手データ</option>
          <option value="temperature">体表温データ</option>
        </select>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>CSVデータ:</label>
        <textarea
          value={csvData}
          onChange={(e) => setCsvData(e.target.value)}
          placeholder={uploadType === 'athletes' ? 
            'email,password,name,bib_number,halshare_id\ntest2@example.com,password123,テスト選手2,002,110000021B18' :
            'halshareId,datetime,temperature\n110000021B17,2025/07/26 09:00:00,36.5\n110000021B17,2025/07/26 09:05:00,36.7'
          }
          style={{ 
            width: '100%', 
            height: '200px', 
            padding: '10px', 
            border: '1px solid #ddd', 
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '14px'
          }}
        />
      </div>

      <button 
        onClick={handleUpload}
        disabled={uploading}
        style={{ 
          padding: '12px 24px', 
          backgroundColor: uploading ? '#6c757d' : '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          fontSize: '16px',
          cursor: uploading ? 'not-allowed' : 'pointer'
        }}
      >
        {uploading ? 'アップロード中...' : 'アップロード'}
      </button>
    </div>
  )
}

export default AdminView