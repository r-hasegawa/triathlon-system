const { success, error } = require('./utils/response');
const { verify, extractToken } = require('./utils/jwt');
const db = require('./data/dynamodb');

const authenticate = (event) => {
  try {
    const token = extractToken(event);
    if (!token) return null;
    return verify(token);
  } catch (err) {
    console.error('認証エラー:', err);
    return null;
  }
};

exports.getProfile = async (event) => {
  try {
    const user = authenticate(event);
    if (!user) {
      return error(401, '認証が必要です');
    }

    // DynamoDBから最新の選手情報を取得
    const athlete = await db.findAthleteByEmail(user.email);
    if (!athlete) {
      return error(404, '選手情報が見つかりません');
    }

    // データ統計も含めて返す
    try {
      const stats = await db.getAthleteStats(athlete.halshare_id);

      return success({
        email: athlete.email,
        name: athlete.name,
        bib_number: athlete.bib_number,
        halshare_id: athlete.halshare_id,
        data_stats: stats.count > 0 ? {
          total_records: stats.count,
          latest_datetime: stats.latest_datetime,
          temperature_range: {
            min: stats.min_temperature,
            max: stats.max_temperature,
            avg: stats.avg_temperature
          }
        } : null
      });
    } catch (statsError) {
      console.warn('統計取得エラー:', statsError);
      return success({
        email: athlete.email,
        name: athlete.name,
        bib_number: athlete.bib_number,
        halshare_id: athlete.halshare_id,
        data_stats: null
      });
    }

  } catch (err) {
    console.error('プロファイル取得エラー:', err);
    return error(500, 'サーバーエラーが発生しました: ' + err.message);
  }
};

exports.getTemperatureData = async (event) => {
  try {
    const user = authenticate(event);
    if (!user) {
      return error(401, '認証が必要です');
    }

    // DynamoDBから実際のデータを取得
    const temperatureData = await db.getTemperatureDataByHalshareId(user.halshare_id);

    if (temperatureData.length === 0) {
      return success({
        data: [],
        stats: {
          min: 0,
          max: 0,
          avg: 0,
          count: 0
        },
        message: 'まだ体表温データがありません'
      });
    }

    // 統計計算
    const temperatures = temperatureData.map(item => item.temperature);
    const stats = {
      min: Math.min(...temperatures),
      max: Math.max(...temperatures),
      avg: Math.round((temperatures.reduce((a, b) => a + b, 0) / temperatures.length) * 10) / 10,
      count: temperatures.length,
      date_range: {
        start: temperatureData[0].datetime,
        end: temperatureData[temperatureData.length - 1].datetime
      },
      recent_trend: calculateRecentTrend(temperatureData)
    };

    return success({
      data: temperatureData,
      stats: stats
    });

  } catch (err) {
    console.error('体表温データ取得エラー:', err);
    return error(500, 'サーバーエラーが発生しました: ' + err.message);
  }
};

// 最近のトレンド計算（直近10%のデータで判定）
function calculateRecentTrend(data) {
  try {
    if (data.length < 10) return 'insufficient_data';
    
    const recentCount = Math.max(10, Math.floor(data.length * 0.1));
    const recentData = data.slice(-recentCount);
    const olderData = data.slice(-(recentCount * 2), -recentCount);
    
    if (olderData.length === 0) return 'insufficient_data';
    
    const recentAvg = recentData.reduce((sum, item) => sum + item.temperature, 0) / recentData.length;
    const olderAvg = olderData.reduce((sum, item) => sum + item.temperature, 0) / olderData.length;
    
    const diff = recentAvg - olderAvg;
    
    if (Math.abs(diff) < 0.1) return 'stable';
    return diff > 0 ? 'increasing' : 'decreasing';
  } catch (err) {
    console.error('トレンド計算エラー:', err);
    return 'insufficient_data';
  }
}