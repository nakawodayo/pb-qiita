# 設計書

このディレクトリには、pb-qiita プロジェクトの設計書（PlantUML形式）が含まれています。

## ファイル一覧

### 1. `design.puml` - クラス図
主要なコンポーネント、型定義、ユーティリティ関数の関係を表すクラス図です。

**含まれる要素:**
- フロントエンドコンポーネント（App, DatePicker）
- データ型（QiitaItem, QiitaUser, QiitaTag, RateLimitInfo）
- ユーティリティ関数（qiita.ts）
- バックエンドプロキシ（Vercel Serverless Function, Express Proxy Server）
- 外部API（Qiita API v2）

### 2. `sequence-article-list.puml` - 記事一覧取得シーケンス図
記事一覧を取得する際の処理フローを表すシーケンス図です。

**処理フロー:**
1. ユーザーがページ読み込みまたは検索を実行
2. Appコンポーネントがクエリを構築
3. qiita.tsのfetchQiitaItemsを呼び出し
4. プロキシ（Vercel/Express）経由でQiita APIにリクエスト
5. レスポンスをパースして状態を更新
6. UIに記事一覧を表示

### 3. `sequence-ranking.puml` - 期間別ランキング取得シーケンス図
期間別ランキングを取得する際の処理フローを表すシーケンス図です。

**処理フロー:**
1. ユーザーがDatePickerで開始日・終了日を選択
2. 「ランキング取得」ボタンをクリック
3. fetchAllItemsInPeriodで期間内の全記事を取得（ページネーション対応）
4. レート制限を考慮しながら複数ページを取得
5. クライアント側でいいね数ランキングと投稿数ランキングを計算
6. UIにランキングを表示

### 4. `component-diagram.puml` - コンポーネント図
Reactアプリケーションのコンポーネント構造と依存関係を表すコンポーネント図です。

**含まれる要素:**
- メインコンポーネント（App, DatePicker）
- UIコンポーネント（検索バー、記事リスト、ページネーション、ランキングセクションなど）
- 状態管理（検索、ページネーション、ランキング、ローディング、エラー）
- API通信（記事取得、期間別記事取得、クエリ構築、レート制限解析）

### 5. `architecture.puml` - システムアーキテクチャ図
システム全体のアーキテクチャと環境構成を表す図です。

**含まれる要素:**
- クライアント（React SPA、Vite Dev Server）
- 本番環境（Vercel Static Assets、Serverless Functions、Environment Variables）
- 開発環境（Express Proxy Server、Local Environment）
- 外部API（Qiita API v2、Rate Limiting）

## 使用方法

### PlantUMLの表示方法

1. **VS Code拡張機能を使用する場合:**
   - VS Codeに「PlantUML」拡張機能をインストール
   - `.puml`ファイルを開いて、`Alt + D`でプレビューを表示

2. **オンラインビューアを使用する場合:**
   - [PlantUML Online Server](http://www.plantuml.com/plantuml/uml/) にアクセス
   - `.puml`ファイルの内容をコピー＆ペーストして表示

3. **コマンドラインから画像生成する場合:**
   ```bash
   # PlantUMLをインストール（Javaが必要）
   # macOS: brew install plantuml
   # Windows: choco install plantuml

   # PNG形式で生成
   plantuml docs/*.puml

   # SVG形式で生成
   plantuml -tsvg docs/*.puml
   ```

## 設計のポイント

### アーキテクチャ
- **フロントエンド**: React + TypeScript + Vite
- **バックエンド**: Vercel Serverless Functions（本番） / Express Proxy Server（開発）
- **API通信**: プロキシ経由でQiita API v2にアクセス

### セキュリティ
- アクセストークンは環境変数で管理
- クライアント側にはトークンを送信しない
- プロキシサーバーでトークンを追加

### パフォーマンス
- ページネーション対応
- レート制限の考慮（残りリクエスト数が少ない場合は待機）
- 期間別ランキングは最大100件/ページで効率的に取得

### 状態管理
- React Hooks（useState, useEffect, useMemo）を使用
- コンポーネント内で状態を管理
- グローバル状態管理ライブラリは未使用（シンプルな構成）
