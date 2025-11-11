## Qiita Organization Browser (MVP)

Qiitaの特定Organizationに属する記事を、検索・一覧・ページングして表示するSPA（Vite + React + TypeScript）。

要件は `REQUIREMENTS.md` を参照。

### セットアップ
1) 依存関係のインストール
```bash
npm install
```

2) 環境変数（開発）
- ルートに `.env` を作成して、少なくとも下記を設定:
```bash
VITE_QIITA_ORG_ID=your_org_id
# VITE_PER_PAGE=20
VITE_QIITA_ACCESS_TOKEN=your_token   # 開発環境ではViteプロキシが使用します
```

3) 開発サーバ起動
```bash
npm install  # 依存関係をインストール（初回のみ）
npm run dev
```
ブラウザで `http://localhost:5173` を開いて確認。

**注意**: Qiita APIはCORSを許可していないため、開発環境ではViteのプロキシ機能を使用しています。本番環境では別途プロキシサーバーが必要です（`server/proxy.js`を参照）。

### 機能
- `org:ORG` を前置した検索（キーワード、`tag:xxx`, `user:yyy` に対応）
- 新着順（Qiitaの検索API準拠）
- ページネーション（20件/ページ既定、変更可）
- **期間別ランキング**: 指定した日付範囲内の記事を対象に、いいね数ランキングと投稿数ランキング（ユーザー別）を表示
- レート制限の残数・リセット時刻の簡易表示
- クリックでQiita記事を新規タブで開く

### 本番環境でのプロキシサーバー

本番環境では、CORS問題を回避するためにプロキシサーバーを使用してください:

```bash
# プロキシサーバーを起動（別ターミナル）
npm run proxy
```

プロキシサーバーは `http://localhost:3001` で起動します。環境変数 `QIITA_ACCESS_TOKEN` を設定してください。

### セキュリティ注意
- 開発環境: `VITE_QIITA_ACCESS_TOKEN` はViteプロキシが使用します（ビルド成果物には含まれません）
- 本番環境: プロキシサーバーで `QIITA_ACCESS_TOKEN` を使用し、トークンをクライアントに公開しないようにしてください

### ディレクトリ構成
```
src/
  ui/App.tsx            UI本体
  utils/qiita.ts        APIクライアントと型
  main.tsx              エントリ
  styles.css            スタイル
```
