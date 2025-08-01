const bcrypt = require('bcryptjs');
const { success, error } = require('./utils/response');
const { sign } = require('./utils/jwt');
const db = require('./data/dynamodb');

exports.login = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { email, password } = body;
    
    if (!email || !password) {
      return error(400, 'メールアドレスとパスワードが必要です');
    }

    console.log('ログイン試行:', email);

    // DynamoDBから選手情報を取得
    const athlete = await db.findAthleteByEmail(email);

    if (athlete && bcrypt.compareSync(password, athlete.password_hash)) {
      const token = sign({
        email: athlete.email,
        halshare_id: athlete.halshare_id,
        bib_number: athlete.bib_number,
        name: athlete.name
      });

      return success({
        token,
        athlete: {
          email: athlete.email,
          name: athlete.name,
          bib_number: athlete.bib_number,
          halshare_id: athlete.halshare_id
        }
      });
    }

    return error(401, 'ログイン情報が正しくありません');

  } catch (err) {
    console.error('ログインエラー:', err);
    return error(500, 'サーバーエラーが発生しました: ' + err.message);
  }
};

// 管理者ログイン
exports.adminLogin = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { username, password } = body;
    
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
    return error(500, 'サーバーエラーが発生しました: ' + err.message);
  }
};