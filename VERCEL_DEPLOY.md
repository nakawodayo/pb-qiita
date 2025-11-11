# Vercel デプロイガイド

## デプロイ前の準備

### 1. 環境変数の設定

Vercel のダッシュボードで以下の環境変数を設定してください：

- `VITE_QIITA_ORG_ID`: Qiita Organization ID（例: `primebrains`）
- `QIITA_ACCESS_TOKEN`: Qiita Personal Access Token（**重要**: `VITE_`プレフィックスは付けない）

**注意**:

- `VITE_QIITA_ACCESS_TOKEN`は設定しないでください（クライアント側に公開されてしまいます）
- `QIITA_ACCESS_TOKEN`は Serverless Functions 側でのみ使用されます

### 2. デプロイ手順

1. Vercel にプロジェクトをインポート
2. 環境変数を設定（上記参照）
3. ビルドコマンド: `npm run build`（自動検出される）
4. 出力ディレクトリ: `dist`（自動検出される）
5. フレームワーク: `Vite`（自動検出される）

### 3. 重要なポイント

#### CORS 問題の解決

- 開発環境: Vite のプロキシ機能を使用
- 本番環境（Vercel）: Serverless Functions（`api/qiita/[...path].ts`）を使用
- クライアント側では常に `/api/qiita` にリクエストを送信し、プロキシが Qiita API に転送

#### セキュリティ

- **トークンはクライアント側に公開しない**
- `QIITA_ACCESS_TOKEN`は Serverless Functions 側でのみ使用
- `VITE_QIITA_ACCESS_TOKEN`は開発環境でのみ使用（ローカル開発用）

#### ビルド設定

- `vercel.json`でルーティングを設定済み
- `/api/qiita/*`は自動的に Serverless Functions にルーティングされる

### 4. トラブルシューティング

#### 環境変数が読み込まれない

- Vercel のダッシュボードで環境変数が正しく設定されているか確認
- 再デプロイが必要な場合があります

#### CORS エラーが発生する

- Serverless Functions が正しく動作しているか確認
- `api/qiita/[...path].ts`がデプロイされているか確認

#### ビルドエラー

- `npm run build`がローカルで成功するか確認
- TypeScript の型エラーがないか確認

### 5. ローカル開発との違い

| 項目               | ローカル開発              | Vercel 本番           |
| ------------------ | ------------------------- | --------------------- |
| プロキシ           | Vite 開発サーバー         | Serverless Functions  |
| 環境変数           | `.env`ファイル            | Vercel ダッシュボード |
| トークン           | `VITE_QIITA_ACCESS_TOKEN` | `QIITA_ACCESS_TOKEN`  |
| API エンドポイント | `/api/qiita`              | `/api/qiita`（同じ）  |

### 6. デプロイ後の確認

1. アプリケーションが正常に表示されるか
2. 記事一覧が取得できるか
3. ランキング機能が動作するか
4. ブラウザのコンソールにエラーがないか
