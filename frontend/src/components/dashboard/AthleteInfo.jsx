const AthleteInfo = ({ athleteData, dataCount }) => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', borderLeft: '4px solid #007bff' }}>
      <h3>選手情報</h3>
      <p><strong>ゼッケン番号:</strong> {athleteData?.bib_number || 'N/A'}</p>
      <p><strong>名前:</strong> {athleteData?.name || 'N/A'}</p>
      <p><strong>Email:</strong> {athleteData?.email || 'N/A'}</p>
      <p><strong>HalshareID:</strong> {athleteData?.halshare_id || 'N/A'}</p>
      <p><strong>データ数:</strong> {dataCount}件</p>
    </div>
  )
}

export default AthleteInfo