const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const Papa = require('papaparse');
const { success, error } = require('./utils/response');

const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.uploadAthletes = async (event) => {
  try {
    const { csvData } = JSON.parse(event.body || '{}');
    
    if (!csvData) {
      return error(400, 'CSVデータが必要です');
    }

    console.log('選手データCSV受信');

    // CSV解析
    const parsed = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true
    });

    if (parsed.errors.length > 0) {
      return error(400, 'CSV解析エラー: ' + parsed.errors[0].message);
    }

    const athletes = [];
    for (const row of parsed.data) {
      const athlete = {
        email: (row.email || row.loginId || '').toLowerCase(),
        name: row.name || row.athleteName || '',
        bib_number: row.bib_number || row.bibNumber || '',
        halshare_id: row.halshare_id || row.halshareId || '',
        created_at: new Date().toISOString()
      };

      if (athlete.email && athlete.halshare_id) {
        athletes.push(athlete);
      }
    }

    console.log(`${athletes.length}名の選手データを処理`);

    return success({
      message: `${athletes.length}名の選手データをアップロードしました`,
      count: athletes.length,
      athletes: athletes.map(a => ({
        email: a.email,
        name: a.name,
        bib_number: a.bib_number,
        halshare_id: a.halshare_id
      }))
    });

  } catch (err) {
    console.error('選手アップロードエラー:', err);
    return error(500, 'サーバーエラーが発生しました');
  }
};

exports.uploadTemperatureData = async (event) => {
  try {
    const { csvData } = JSON.parse(event.body || '{}');
    
    if (!csvData) {
      return error(400, 'CSVデータが必要です');
    }

    console.log('体表温データCSV受信');

    const parsed = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true
    });

    if (parsed.errors.length > 0) {
      return error(400, 'CSV解析エラー: ' + parsed.errors[0].message);
    }

    const temperatureData = [];
    for (const row of parsed.data) {
      const dataPoint = {
        halshare_id: (row.halshareId || row.halshare_id || '').toString(),
        datetime: row.datetime || '',
        temperature: parseFloat(row.temperature) || 0,
        created_at: new Date().toISOString()
      };

      if (dataPoint.halshare_id && dataPoint.datetime && dataPoint.temperature > 0) {
        temperatureData.push(dataPoint);
      }
    }

    console.log(`${temperatureData.length}件の体表温データを処理`);

    return success({
      message: `${temperatureData.length}件の体表温データをアップロードしました`,
      count: temperatureData.length
    });

  } catch (err) {
    console.error('体表温アップロードエラー:', err);
    return error(500, 'サーバーエラーが発生しました');
  }
};

exports.getStats = async (event) => {
  try {
    return success({
      athletes_count: 3,
      temperature_records: 150,
      last_updated: new Date().toISOString()
    });

  } catch (err) {
    console.error('統計取得エラー:', err);
    return error(500, 'サーバーエラーが発生しました');
  }
};

// 全選手データ取得
exports.getAllAthletes = async (event) => {
  try {
    const user = authenticate(event);
    if (!user || user.role !== 'admin') {
      return error(403, '管理者権限が必要です');
    }

    // テスト用ダミーデータ
    const athletes = [
      {
        email: 'test@example.com',
        name: 'テスト選手',
        bib_number: '001',
        halshare_id: '110000021B17',
        last_data_time: '2025-07-28 07:48:44',
        data_count: 50
      },
      {
        email: 'athlete2@example.com', 
        name: '田中太郎',
        bib_number: '002',
        halshare_id: '110000021B18',
        last_data_time: '2025-07-28 08:15:22',
        data_count: 45
      }
    ];

    return success({
      athletes: athletes,
      total: athletes.length
    });

  } catch (err) {
    console.error('選手データ取得エラー:', err);
    return error(500, 'サーバーエラーが発生しました');
  }
};

// 特定選手のデータ取得
exports.getAthleteData = async (event) => {
  try {
    const user = authenticate(event);
    if (!user || user.role !== 'admin') {
      return error(403, '管理者権限が必要です');
    }

    const { halshare_id } = event.pathParameters || {};
    if (!halshare_id) {
      return error(400, 'halshare_idが必要です');
    }

    // テスト用ダミーデータ生成
    const testData = [];
    const startTime = new Date('2025-07-26 09:00:00');
    
    for (let i = 0; i < 60; i++) {
      const time = new Date(startTime.getTime() + i * 5 * 60000);
      const baseTemp = 36.5 + Math.sin(i * 0.15) * 0.9;
      const randomVariation = (Math.random() - 0.5) * 0.5;
      
      testData.push({
        halshare_id: halshare_id,
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
      halshare_id: halshare_id,
      data: testData,
      stats: stats
    });

  } catch (err) {
    console.error('選手データ取得エラー:', err);
    return error(500, 'サーバーエラーが発生しました');
  }
};

// 選手アカウント作成
exports.createAthlete = async (event) => {
  try {
    const user = authenticate(event);
    if (!user || user.role !== 'admin') {
      return error(403, '管理者権限が必要です');
    }

    const { email, password, name, bib_number, halshare_id } = JSON.parse(event.body || '{}');
    
    if (!email || !password || !name || !bib_number || !halshare_id) {
      return error(400, '全ての項目が必要です');
    }

    // 実際のシステムではDynamoDBに保存
    console.log('選手アカウント作成:', { email, name, bib_number, halshare_id });

    return success({
      message: '選手アカウントを作成しました',
      athlete: {
        email: email,
        name: name,
        bib_number: bib_number,
        halshare_id: halshare_id,
        created_at: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('選手作成エラー:', err);
    return error(500, 'サーバーエラーが発生しました');
  }
};