module.exports.hello = async (event) => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: '🏊‍♂️ トライアスロン体表温システム',
      status: 'API稼働中',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      endpoints: [
        'GET  / - この画面',
        'POST /auth/login - ログイン',
        'GET  /athlete/profile - 選手プロファイル',
        'GET  /athlete/temperature-data - 体表温データ',
        'POST /admin/athletes - 選手データアップロード',
        'POST /admin/temperature - 体表温データアップロード',
        'GET  /admin/stats - 統計情報'
      ]
    }),
  };
};