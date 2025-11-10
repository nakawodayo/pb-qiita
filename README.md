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
# VITE_QIITA_ACCESS_TOKEN=your_token   # 注意: フロントに埋め込まれ公開されます
```

3) 開発サーバ起動
```bash
npm run dev
```
ブラウザで `http://localhost:5173` を開いて確認。

### 機能
- `org:ORG` を前置した検索（キーワード、`tag:xxx`, `user:yyy` に対応）
- 新着順（Qiitaの検索API準拠）
- ページネーション（20件/ページ既定、変更可）
- レート制限の残数・リセット時刻の簡易表示
- クリックでQiita記事を新規タブで開く

### セキュリティ注意
- `VITE_QIITA_ACCESS_TOKEN` はビルド成果物に含まれます。公開環境では使わず、将来的にサーバサイドの薄いプロキシで秘匿する構成に移行してください。

### ディレクトリ構成
```
src/
  ui/App.tsx            UI本体
  utils/qiita.ts        APIクライアントと型
  main.tsx              エントリ
  styles.css            スタイル
```
