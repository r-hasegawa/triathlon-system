const bcrypt = require('bcryptjs');
const Papa = require('papaparse');
const { success, error } = require('./utils/response');
const { verify, extractToken } = require('./utils/jwt');
const db = require('./data/dynamodb');

const authenticate = (event) => {
  const token = extractToken(event);
  if (!token) return null;
  return verify(token);
};

exports.uploadAthletes = async (event) => {
  try {
    const user = authenticate(event);
    if (!user || user.role !== 'admin') {
      return error(403, '管理者権限が必要です');
    }

    const { csvData } = JSON.parse(event.body || '{}');
    
    if (!csvData) {
      return error(400, 'CSVデータが必要です');
    }

    console.log('選手データCSV受信');

    const parsed = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      fastMode: true
    });

    if (parsed.errors.length > 0) {
      console.warn('CSV解析警告:', parsed.errors);
    }

    const athletes = [];
    for (const row of parsed.data) {
      const athlete = {
        email: (row.email || `${row.halshareId}@triathlon.local`).toLowerCase(),
        name: row.halshareWearerName || row.name || `選手_${row.halshareId}`,
        bib_number: row.bib_number || row.bibNumber || Math.floor(Math.random() * 1000).toString(),
        halshare_id: row.halshareId || row.halshare_id || '',
        password_hash: bcrypt.hashSync('password123', 10)
      };

      if (athlete.halshare_id) {
        athletes.push(athlete);
      }
    }

    // DynamoDBに並行で選手を作成
    const athletePromises = athletes.map(athlete => 
      db.createAthlete(athlete).catch(err => {
        console.warn(`選手作成スキップ: ${athlete.email}`, err.message);
        return null;
      })
    );
    
    const results = await Promise.all(athletePromises);
    const successCount = results.filter(r => r !== null).length;

    console.log(`${successCount}名の選手データを処理`);

    return success({
      message: `${successCount}名の選手データをアップロードしました`,
      count: successCount,
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
    const user = authenticate(event);
    if (!user || user.role !== 'admin') {
      return error(403, '管理者権限が必要です');
    }

    const { csvData } = JSON.parse(event.body || '{}');
    
    if (!csvData) {
      return error(400, 'CSVデータが必要です');
    }

    console.log('DynamoDB高速処理開始');
    const startTime = Date.now();

    // ダブルクォーテーション対応のCSV解析設定
    const parsed = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      // fastMode: false,  // fastModeを無効にしてクォート処理を有効化
      dynamicTyping: true,
      // クォート処理を明示的に有効化
      quoteChar: '"',
      delimiter: ',',
      // ヘッダーと値のトリム処理
      transformHeader: (header) => header.trim(),
      transform: (value) => {
        if (typeof value === 'string') {
          return value.trim();
        }
        return value;
      },
      // エラー処理を寛容に
      errors: 'first'
    });

    // CSV解析エラーの詳細チェック
    if (parsed.errors && parsed.errors.length > 0) {
      console.warn('CSV解析警告:', parsed.errors);
      // 致命的なエラーのみで停止
      const fatalErrors = parsed.errors.filter(err => err.type === 'Delimiter' || err.type === 'Quote');
      if (fatalErrors.length > 0) {
        return error(400, `CSV解析エラー: ${fatalErrors[0].message}`);
      }
    }

    console.log(`CSV解析完了: ${parsed.data.length}行 (${Date.now() - startTime}ms)`);
    
    // デバッグ用: 最初の数行のデータ構造を確認
    if (parsed.data.length > 0) {
      console.log('CSV ヘッダー:', Object.keys(parsed.data[0]));
      console.log('サンプルデータ:', parsed.data.slice(0, 2));
    }

    const temperatureData = [];
    const athletesToCreate = [];
    const existingAthletes = new Set();
    let validCount = 0;
    let processedCount = 0;
    let invalidRows = [];

    // データ検証と準備（より柔軟なフィールド名対応）
    for (const row of parsed.data) {
      processedCount++;
      
      // 進捗表示（1000行ごと）
      if (processedCount % 1000 === 0) {
        console.log(`処理進捗: ${processedCount}/${parsed.data.length}`);
      }

      // フィールド名の柔軟な対応（大小文字、スペース、アンダースコア等）
      let halshareId = '';
      let datetime = '';
      let temperature = 0;
      let wearerName = '';

      // halshareId の取得（複数のフィールド名に対応）
      const halshareFields = ['halshareId', 'halshare_id', 'HalshareId', 'HALSHARE_ID'];
      for (const field of halshareFields) {
        if (row[field]) {
          halshareId = String(row[field]).trim().replace(/"/g, ''); // クォート除去
          break;
        }
      }

      // datetime の取得
      const datetimeFields = ['datetime', 'date_time', 'DateTime', 'DATE_TIME', 'timestamp'];
      for (const field of datetimeFields) {
        if (row[field]) {
          datetime = String(row[field]).trim().replace(/"/g, '');
          break;
        }
      }

      // temperature の取得
      const tempFields = ['temperature', 'temp', 'Temperature', 'TEMPERATURE'];
      for (const field of tempFields) {
        if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
          const tempValue = String(row[field]).trim().replace(/"/g, '');
          temperature = parseFloat(tempValue);
          break;
        }
      }

      // wearerName の取得
      const nameFields = ['halshareWearerName', 'wearer_name', 'name', 'WearerName', 'WEARER_NAME'];
      for (const field of nameFields) {
        if (row[field]) {
          wearerName = String(row[field]).trim().replace(/"/g, '');
          break;
        }
      }

      // データ検証（より詳細な検証）
      let isValid = true;
      let invalidReason = '';

      if (!halshareId) {
        isValid = false;
        invalidReason = 'halshareId が空';
      } else if (!datetime) {
        isValid = false;
        invalidReason = 'datetime が空';
      } else if (isNaN(temperature) || temperature <= 0) {
        isValid = false;
        invalidReason = `temperature が無効: ${row[tempFields.find(f => row[f])]}`;
      } else if (temperature < 20 || temperature > 50) {
        isValid = false;
        invalidReason = `temperature が範囲外: ${temperature}°C`;
      }

      if (isValid) {
        const dataPoint = {
          halshare_id: halshareId,
          datetime: datetime,
          temperature: temperature
        };

        temperatureData.push(dataPoint);
        validCount++;

        // 新しい選手の準備（重複チェック）
        if (!existingAthletes.has(halshareId)) {
          existingAthletes.add(halshareId);
          
          try {
            const existingAthlete = await db.findAthleteByHalshareId(halshareId);
            if (!existingAthlete) {
              athletesToCreate.push({
                email: `${halshareId}@triathlon.local`,
                halshare_id: halshareId,
                name: wearerName || `選手_${halshareId}`,
                bib_number: String(Math.floor(Math.random() * 1000)).padStart(3, '0'),
                password_hash: bcrypt.hashSync('password123', 10)
              });
            }
          } catch (err) {
            console.warn(`選手チェックエラー: ${halshareId}`, err.message);
          }
        }
      } else {
        // 無効な行の詳細を記録（最初の10件まで）
        if (invalidRows.length < 10) {
          invalidRows.push({
            row: processedCount,
            reason: invalidReason,
            data: row
          });
        }
      }
    }

    console.log(`データ準備完了: ${validCount}件, 新規選手: ${athletesToCreate.length}名 (${Date.now() - startTime}ms)`);
    
    if (invalidRows.length > 0) {
      console.warn('無効な行の例:', invalidRows);
    }

    // 選手を並行作成
    const athletePromises = athletesToCreate.map(athlete => 
      db.createAthlete(athlete).catch(err => {
        console.warn(`選手作成スキップ: ${athlete.halshare_id}`, err.message);
        return null;
      })
    );
    
    const athleteResults = await Promise.all(athletePromises);
    const newAthletesCount = athleteResults.filter(r => r !== null).length;

    console.log(`選手作成完了: ${newAthletesCount}名 (${Date.now() - startTime}ms)`);

    // 体表温データを高速バッチ挿入
    if (temperatureData.length > 0) {
      await db.batchInsertTemperatureData(temperatureData);
    }

    const processingTime = Date.now() - startTime;
    console.log(`DynamoDB処理完了: ${processingTime}ms`);

    return success({
      message: `${validCount}件の体表温データをアップロードしました`,
      newAthletesCreated: `${newAthletesCount}名の選手を自動作成しました`,
      count: validCount,
      totalProcessed: processedCount,
      invalidRows: processedCount - validCount,
      processingTimeMs: processingTime,
      performance: {
        recordsPerSecond: Math.round(validCount / (processingTime / 1000)),
        database: 'DynamoDB Local'
      },
      sample_data: temperatureData.slice(0, 3),
      validation_errors: invalidRows.length > 0 ? invalidRows : undefined
    });

  } catch (err) {
    console.error('DynamoDBアップロードエラー:', err);
    return error(500, `処理エラー: ${err.message}`);
  }
};

exports.getAllAthletes = async (event) => {
  try {
    const user = authenticate(event);
    if (!user || user.role !== 'admin') {
      return error(403, '管理者権限が必要です');
    }

    const athletes = await db.getAllAthletes();
    
    return success({
      athletes: athletes,
      total: athletes.length
    });

  } catch (err) {
    console.error('選手データ取得エラー:', err);
    return error(500, 'サーバーエラーが発生しました');
  }
};

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

    const athleteData = await db.getTemperatureDataByHalshareId(halshare_id);

    if (athleteData.length === 0) {
      return error(404, '指定された選手のデータが見つかりません');
    }

    const temperatures = athleteData.map(item => item.temperature);
    const stats = {
      min: Math.min(...temperatures),
      max: Math.max(...temperatures),
      avg: Math.round((temperatures.reduce((a, b) => a + b, 0) / temperatures.length) * 10) / 10,
      count: temperatures.length,
      date_range: {
        start: athleteData[0].datetime,
        end: athleteData[athleteData.length - 1].datetime
      }
    };

    return success({
      halshare_id: halshare_id,
      data: athleteData,
      stats: stats
    });

  } catch (err) {
    console.error('選手データ取得エラー:', err);
    return error(500, 'サーバーエラーが発生しました');
  }
};

exports.getStats = async (event) => {
  try {
    const user = authenticate(event);
    if (!user || user.role !== 'admin') {
      return error(403, '管理者権限が必要です');
    }

    const stats = await db.getSystemStats();
    
    return success({
      athletes_count: stats.athletes_count,
      temperature_records: stats.temperature_records,
      last_updated: stats.last_updated,
      data_summary: {
        unique_devices: stats.unique_devices || 0
      }
    });

  } catch (err) {
    console.error('統計取得エラー:', err);
    return error(500, 'サーバーエラーが発生しました');
  }
};

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

    // 重複チェック
    const existingByEmail = await db.findAthleteByEmail(email);
    const existingByHalshare = await db.findAthleteByHalshareId(halshare_id);
    
    if (existingByEmail || existingByHalshare) {
      return error(400, 'すでに登録されているメールアドレスまたはHalshareIDです');
    }

    const newAthlete = {
      email: email.toLowerCase(),
      name: name,
      bib_number: bib_number,
      halshare_id: halshare_id,
      password_hash: bcrypt.hashSync(password, 10)
    };

    await db.createAthlete(newAthlete);

    console.log('選手アカウント作成:', { email, name, bib_number, halshare_id });

    return success({
      message: '選手アカウントを作成しました',
      athlete: {
        email: newAthlete.email,
        name: newAthlete.name,
        bib_number: newAthlete.bib_number,
        halshare_id: newAthlete.halshare_id,
        created_at: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('選手作成エラー:', err);
    return error(500, 'サーバーエラーが発生しました');
  }
};