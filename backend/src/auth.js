const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const { success, error } = require('./utils/response');
const { sign } = require('./utils/jwt');

const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.login = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body || '{}');
    
    if (!email || !password) {
      return error(400, 'メールアドレスとパスワードが必要です');
    }

    console.log('ログイン試行:', email);

    // テスト用のハードコード認証
    if (email === 'test@example.com' && password === 'password123') {
      const token = sign({
        email: 'test@example.com',
        halshare_id: '110000021B17',
        bib_number: '001',
        name: 'テスト選手'
      });

      return success({
        token,
        athlete: {
          email: 'test@example.com',
          name: 'テスト選手',
          bib_number: '001',
          halshare_id: '110000021B17'
        }
      });
    }

    return error(401, 'ログイン情報が正しくありません');

  } catch (err) {
    console.error('ログインエラー:', err);
    return error(500, 'サーバーエラーが発生しました');
  }
};

// 管理者ログイン関数を追加
exports.adminLogin = async (event) => {
  try {
    const { username, password } = JSON.parse(event.body || '{}');
    
    if (!username || !password) {
      return error(400, 'ユーザー名とパスワードが必要です');
    }

    console.log('管理者ログイン試行:', username);

    // 管理者認証（環境変数または固定値）
    const adminUsers = {
      'admin': 'admin123',
      'triathlon_admin': 'secure_password_2025'
    };

    if (adminUsers[username] && adminUsers[username] === password) {
      const token = sign({
        username: username,
        role: 'admin',
        permissions: ['read_all', 'write_all', 'manage_users']
      });

      return success({
        token,
        admin: {
          username: username,
          role: 'admin',
          permissions: ['read_all', 'write_all', 'manage_users']
        }
      });
    }

    return error(401, 'ログイン情報が正しくありません');

  } catch (err) {
    console.error('管理者ログインエラー:', err);
    return error(500, 'サーバーエラーが発生しました');
  }
};