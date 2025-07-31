const SimpleChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <p>グラフデータがありません</p>
  }

  const maxTemp = Math.max(...data.map(d => d.temperature))
  const minTemp = Math.min(...data.map(d => d.temperature))
  const tempRange = maxTemp - minTemp
  
  return (
    <div style={{ width: '100%', height: '100%', padding: '20px' }}>
      <svg width="100%" height="250" style={{ border: '1px solid #ddd' }}>
        {data.map((point, index) => {
          if (index === 0) return null
          
          const prevPoint = data[index - 1]
          const x1 = ((index - 1) / (data.length - 1)) * 90 + 5
          const y1 = tempRange > 0 ? ((maxTemp - prevPoint.temperature) / tempRange) * 80 + 10 : 50
          const x2 = (index / (data.length - 1)) * 90 + 5
          const y2 = tempRange > 0 ? ((maxTemp - point.temperature) / tempRange) * 80 + 10 : 50
          
          return (
            <line
              key={index}
              x1={`${x1}%`}
              y1={`${y1}%`}
              x2={`${x2}%`}
              y2={`${y2}%`}
              stroke="#007bff"
              strokeWidth="2"
            />
          )
        })}
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * 90 + 5
          const y = tempRange > 0 ? ((maxTemp - point.temperature) / tempRange) * 80 + 10 : 50
          return (
            <circle
              key={`point-${index}`}
              cx={`${x}%`}
              cy={`${y}%`}
              r="3"
              fill="#007bff"
            />
          )
        })}
      </svg>
      <p style={{ textAlign: 'center', marginTop: '10px' }}>
        最低: {minTemp.toFixed(1)}°C | 最高: {maxTemp.toFixed(1)}°C | データ数: {data.length}件
      </p>
    </div>
  )
}

export default SimpleChart