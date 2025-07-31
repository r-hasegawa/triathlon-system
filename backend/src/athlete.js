const AWS = require('aws-sdk');
const { success, error } = require('./utils/response');
const { verify, extractToken } = require('./utils/jwt');

const dynamodb = new AWS.DynamoDB.DocumentClient();

const authenticate = (event) => {
  const token = extractToken(event);
  if (!token) return null;
  return verify(token);
};

exports.getProfile = async (event) => {
  try {
    const user = authenticate(event);
    if (!user) {
      return error(401, '認証が必要です');
    }

    return success({
      email: user.email,
      name: user.name,
      bib_number: user.bib_number,
      halshare_id: user.halshare_id
    });

  } catch (err) {
    console.error('プロファイル取得エラー:', err);
    return error(500, 'サーバーエラーが発生しました');
  }
};

exports.getTemperatureData = async (event) => {
  try {
    const user = authenticate(event);
    if (!user) {
      return error(401, '認証が必要です');
    }

    // テスト用ダミーデータ
    const testData = [];
    const startTime = new Date('2025-07-26 09:00:00');
    
    for (let i = 0; i < 50; i++) {
      const time = new Date(startTime.getTime() + i * 5 * 60000);
      const baseTemp = 36.5 + Math.sin(i * 0.2) * 0.8;
      const randomVariation = (Math.random() - 0.5) * 0.4;
      
      testData.push({
        halshare_id: user.halshare_id,
        datetime: time.toISOString().replace('T', ' ').slice(0, 19),
        temperature: Math.round((baseTemp + randomVariation) * 10) / 10
      });
    }

    const temperatures = testData.map(item => item.temperature);
    const stats = {
      min: Math.min(...temperatures),
      max: Math.max(...temperatures),
      avg: Math.round((temperatures.reduce((a, b) => a + b, 0) / temperatures.length) * 10) / 10,
      count: temperatures.length
    };

    return success({
      data: testData,
      stats: stats
    });

  } catch (err) {
    console.error('体表温データ取得エラー:', err);
    return error(500, 'サーバーエラーが発生しました');
  }
};