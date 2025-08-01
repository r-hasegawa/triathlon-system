const AWS = require('aws-sdk');

class DynamoDBClient {
  constructor() {
    // ローカル環境とAWS環境の自動切り替え
    const isLocal = process.env.IS_LOCAL === 'true' || process.env.NODE_ENV === 'development';
    
    if (isLocal) {
      this.dynamodb = new AWS.DynamoDB.DocumentClient({
        region: 'localhost',
        endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
        accessKeyId: 'DEFAULT_ACCESS_KEY',
        secretAccessKey: 'DEFAULT_SECRET'
      });
      console.log('DynamoDB Local に接続しました');
    } else {
      this.dynamodb = new AWS.DynamoDB.DocumentClient({
        region: process.env.AWS_REGION || 'ap-northeast-1'
      });
      console.log('AWS DynamoDB に接続しました');
    }
    
    this.athletesTable = process.env.ATHLETES_TABLE;
    this.temperatureTable = process.env.TEMPERATURE_TABLE;
    
    console.log('テーブル名:', {
      athletes: this.athletesTable,
      temperature: this.temperatureTable
    });
  }

  // 選手関連操作
  async createAthlete(athleteData) {
    const params = {
      TableName: this.athletesTable,
      Item: {
        ...athleteData,
        created_at: new Date().toISOString()
      },
      ConditionExpression: 'attribute_not_exists(email)'
    };
    
    try {
      await this.dynamodb.put(params).promise();
      console.log(`選手作成成功: ${athleteData.email}`);
      return athleteData;
    } catch (error) {
      if (error.code === 'ConditionalCheckFailedException') {
        // 既存選手は更新
        try {
          const updateParams = {
            TableName: this.athletesTable,
            Key: { email: athleteData.email },
            UpdateExpression: 'SET #name = :name, bib_number = :bib, halshare_id = :halshare, password_hash = :hash, updated_at = :updated',
            ExpressionAttributeNames: { '#name': 'name' },
            ExpressionAttributeValues: {
              ':name': athleteData.name,
              ':bib': athleteData.bib_number,
              ':halshare': athleteData.halshare_id,
              ':hash': athleteData.password_hash,
              ':updated': new Date().toISOString()
            }
          };
          await this.dynamodb.update(updateParams).promise();
          console.log(`選手更新成功: ${athleteData.email}`);
          return athleteData;
        } catch (updateError) {
          console.error(`選手更新エラー: ${athleteData.email}`, updateError);
          throw updateError;
        }
      } else {
        console.error(`選手作成エラー: ${athleteData.email}`, error);
        throw error;
      }
    }
  }

  async findAthleteByEmail(email) {
    const params = {
      TableName: this.athletesTable,
      Key: { email: email.toLowerCase() }
    };
    
    try {
      const result = await this.dynamodb.get(params).promise();
      return result.Item;
    } catch (error) {
      console.error('選手検索エラー(email):', error);
      return null;
    }
  }

  async findAthleteByHalshareId(halshareId) {
    const params = {
      TableName: this.athletesTable,
      IndexName: 'halshare-id-index',
      KeyConditionExpression: 'halshare_id = :halshare_id',
      ExpressionAttributeValues: {
        ':halshare_id': halshareId
      }
    };
    
    try {
      const result = await this.dynamodb.query(params).promise();
      return result.Items[0];
    } catch (error) {
      console.error('選手検索エラー(halshare_id):', error);
      return null;
    }
  }

  async getAllAthletes() {
    const params = {
      TableName: this.athletesTable
    };
    
    try {
      const result = await this.dynamodb.scan(params).promise();
      
      // 各選手の統計情報を並行取得
      const athletesWithStats = await Promise.all(
        result.Items.map(async (athlete) => {
          try {
            const stats = await this.getAthleteStats(athlete.halshare_id);
            return {
              ...athlete,
              data_count: stats.count,
              last_data_time: stats.latest_datetime || '未取得',
              avg_temperature: stats.avg_temperature
            };
          } catch (statsError) {
            console.warn(`選手統計取得エラー: ${athlete.halshare_id}`, statsError);
            return {
              ...athlete,
              data_count: 0,
              last_data_time: '未取得',
              avg_temperature: null
            };
          }
        })
      );
      
      return athletesWithStats;
    } catch (error) {
      console.error('全選手取得エラー:', error);
      throw error;
    }
  }

  // 体表温データ操作
  async batchInsertTemperatureData(dataArray) {
    if (dataArray.length === 0) return [];
    
    const BATCH_SIZE = 25; // DynamoDB制限
    const batches = [];
    
    for (let i = 0; i < dataArray.length; i += BATCH_SIZE) {
      batches.push(dataArray.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`バッチ挿入開始: ${batches.length}バッチ, 総${dataArray.length}件`);
    
    const results = await Promise.allSettled(
      batches.map((batch, index) => this.processBatch(batch, index + 1, batches.length))
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;
    
    console.log(`バッチ挿入完了: 成功${successCount}, エラー${errorCount}`);
    
    if (errorCount > 0) {
      const errors = results.filter(r => r.status === 'rejected').map(r => r.reason);
      console.error('バッチエラー詳細:', errors);
    }
    
    return results;
  }

  async processBatch(batch, batchNum, totalBatches) {
    const params = {
      RequestItems: {
        [this.temperatureTable]: batch.map(item => ({
          PutRequest: {
            Item: {
              ...item,
              created_at: new Date().toISOString()
            }
          }
        }))
      }
    };
    
    try {
      await this.dynamodb.batchWrite(params).promise();
      console.log(`バッチ ${batchNum}/${totalBatches} 完了 (${batch.length}件)`);
      return batch;
    } catch (error) {
      console.error(`バッチ ${batchNum} エラー:`, error);
      
      // 個別リトライ
      if (error.code === 'ProvisionedThroughputExceededException') {
        console.log(`バッチ ${batchNum} をリトライします...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機
        return this.processBatch(batch, batchNum, totalBatches);
      }
      
      throw error;
    }
  }

  async getTemperatureDataByHalshareId(halshareId) {
    const params = {
      TableName: this.temperatureTable,
      KeyConditionExpression: 'halshare_id = :halshare_id',
      ExpressionAttributeValues: {
        ':halshare_id': halshareId
      },
      ScanIndexForward: true // datetime昇順
    };
    
    try {
      const result = await this.dynamodb.query(params).promise();
      return result.Items;
    } catch (error) {
      console.error('体表温データ取得エラー:', error);
      return [];
    }
  }

  async getAthleteStats(halshareId) {
    try {
      const data = await this.getTemperatureDataByHalshareId(halshareId);
      
      if (data.length === 0) {
        return { count: 0, latest_datetime: null, avg_temperature: null };
      }
      
      const temperatures = data.map(item => item.temperature);
      return {
        count: data.length,
        latest_datetime: data[data.length - 1].datetime,
        min_temperature: Math.min(...temperatures),
        max_temperature: Math.max(...temperatures),
        avg_temperature: Math.round((temperatures.reduce((a, b) => a + b, 0) / temperatures.length) * 10) / 10
      };
    } catch (error) {
      console.error(`選手統計取得エラー (${halshareId}):`, error);
      return { count: 0, latest_datetime: null, avg_temperature: null };
    }
  }

  async getSystemStats() {
    try {
      // 選手数を取得
      const athleteParams = { 
        TableName: this.athletesTable, 
        Select: 'COUNT' 
      };
      const athleteResult = await this.dynamodb.scan(athleteParams).promise();
      
      // 体表温データ数を取得
      const tempParams = { 
        TableName: this.temperatureTable, 
        Select: 'COUNT' 
      };
      const tempResult = await this.dynamodb.scan(tempParams).promise();
      
      // ユニークデバイス数を取得（サンプリング）
      let uniqueDevices = 0;
      try {
        const deviceParams = {
          TableName: this.temperatureTable,
          ProjectionExpression: 'halshare_id'
        };
        const deviceResult = await this.dynamodb.scan(deviceParams).promise();
        const deviceSet = new Set(deviceResult.Items.map(item => item.halshare_id));
        uniqueDevices = deviceSet.size;
      } catch (err) {
        console.warn('ユニークデバイス数取得エラー:', err);
      }
      
      return {
        athletes_count: athleteResult.Count,
        temperature_records: tempResult.Count,
        unique_devices: uniqueDevices,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('システム統計取得エラー:', error);
      throw error;
    }
  }

  // データリセット機能（開発用）
  async resetAllData() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('本番環境ではデータリセットできません');
    }
    
    console.log('データリセット開始...');
    
    try {
      // 全選手データを削除
      const athleteParams = { TableName: this.athletesTable };
      const athleteResult = await this.dynamodb.scan(athleteParams).promise();
      
      if (athleteResult.Items.length > 0) {
        const deleteRequests = athleteResult.Items.map(item => ({
          DeleteRequest: { Key: { email: item.email } }
        }));
        
        for (let i = 0; i < deleteRequests.length; i += 25) {
          const batch = deleteRequests.slice(i, i + 25);
          await this.dynamodb.batchWrite({
            RequestItems: { [this.athletesTable]: batch }
          }).promise();
        }
      }
      
      // 全体表温データを削除
      const tempParams = { TableName: this.temperatureTable };
      const tempResult = await this.dynamodb.scan(tempParams).promise();
      
      if (tempResult.Items.length > 0) {
        const deleteRequests = tempResult.Items.map(item => ({
          DeleteRequest: { 
            Key: { 
              halshare_id: item.halshare_id, 
              datetime: item.datetime 
            } 
          }
        }));
        
        for (let i = 0; i < deleteRequests.length; i += 25) {
          const batch = deleteRequests.slice(i, i + 25);
          await this.dynamodb.batchWrite({
            RequestItems: { [this.temperatureTable]: batch }
          }).promise();
        }
      }
      
      console.log('データリセット完了');
      return {
        deletedAthletes: athleteResult.Items.length,
        deletedTemperatureRecords: tempResult.Items.length
      };
    } catch (error) {
      console.error('データリセットエラー:', error);
      throw error;
    }
  }

  // 接続テスト
  async testConnection() {
    try {
      const testParams = {
        TableName: this.athletesTable,
        Key: { email: 'connection-test@example.com' }
      };
      
      await this.dynamodb.get(testParams).promise();
      console.log('DynamoDB接続テスト成功');
      return true;
    } catch (error) {
      console.error('DynamoDB接続テストエラー:', error);
      return false;
    }
  }
}

module.exports = new DynamoDBClient();