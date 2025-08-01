#!/bin/bash
# scripts/setup-dynamodb.sh

echo "🚀 DynamoDB Local (Docker版) セットアップ開始..."

# 1. 既存のコンテナを停止・削除
echo "既存のDynamoDB Localコンテナをクリーンアップ..."
docker stop dynamodb-local 2>/dev/null || true
docker rm dynamodb-local 2>/dev/null || true

# 2. DynamoDB Localコンテナを起動
echo "DynamoDB Localコンテナを起動中..."
docker run -d \
  --name dynamodb-local \
  -p 8000:8000 \
  amazon/dynamodb-local:latest \
  -jar DynamoDBLocal.jar -sharedDb

# 3. コンテナ起動を待機
echo "コンテナの起動を待機中..."
sleep 5

# 4. ヘルスチェック
echo "DynamoDB Localヘルスチェック..."
curl -s http://localhost:8000 > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ DynamoDB Local起動成功！"
else
    echo "❌ DynamoDB Local起動失敗"
    exit 1
fi

# 5. テーブル作成
echo "テーブル作成中..."

# Athletes テーブル
aws dynamodb create-table \
    --table-name triathlon-system-athletes-dev \
    --attribute-definitions \
        AttributeName=email,AttributeType=S \
        AttributeName=halshare_id,AttributeType=S \
    --key-schema \
        AttributeName=email,KeyType=HASH \
    --global-secondary-indexes \
        'IndexName=halshare-id-index,KeySchema=[{AttributeName=halshare_id,KeyType=HASH}],Projection={ProjectionType=ALL}' \
    --billing-mode PAY_PER_REQUEST \
    --endpoint-url http://localhost:8000 \
    --region us-east-1 \
    --no-cli-pager

# Temperature テーブル
aws dynamodb create-table \
    --table-name triathlon-system-temperature-dev \
    --attribute-definitions \
        AttributeName=halshare_id,AttributeType=S \
        AttributeName=datetime,AttributeType=S \
    --key-schema \
        AttributeName=halshare_id,KeyType=HASH \
        AttributeName=datetime,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --endpoint-url http://localhost:8000 \
    --region us-east-1 \
    --no-cli-pager

# 6. 初期データ挿入
echo "初期データ挿入中..."
aws dynamodb put-item \
    --table-name triathlon-system-athletes-dev \
    --item '{
        "email": {"S": "test@example.com"},
        "halshare_id": {"S": "110000021B17"},
        "name": {"S": "テスト選手"},
        "bib_number": {"S": "001"},
        "password_hash": {"S": "$2a$10$N9qo8uLOickgx2ZMRZoMu.Tz.1sdx7hZgVeVGVZhw8UYHdUbOzgIy"},
        "created_at": {"S": "2025-01-01T00:00:00.000Z"}
    }' \
    --endpoint-url http://localhost:8000 \
    --region us-east-1 \
    --no-cli-pager

# 7. テーブル一覧確認
echo "作成されたテーブル一覧:"
aws dynamodb list-tables \
    --endpoint-url http://localhost:8000 \
    --region us-east-1 \
    --no-cli-pager

echo "🎉 セットアップ完了！"
echo ""
echo "次のステップ:"
echo "1. npm run dev でAPIサーバーを起動"
echo "2. cd ../frontend && npm run dev でフロントエンドを起動"
echo "3. ブラウザで http://localhost:5173 にアクセス"
echo ""
echo "停止するには: docker stop dynamodb-local"
echo "再起動するには: docker start dynamodb-local"