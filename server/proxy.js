import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Qiita APIへのプロキシ
app.use('/api/qiita', createProxyMiddleware({
	target: 'https://qiita.com',
	changeOrigin: true,
	pathRewrite: {
		'^/api/qiita': '/api/v2'
	},
	onProxyReq: (proxyReq, req, res) => {
		// 環境変数からトークンを取得してヘッダーに追加
		const token = process.env.QIITA_ACCESS_TOKEN
		if (token) {
			proxyReq.setHeader('Authorization', `Bearer ${token}`)
		}
		// CORSヘッダーを追加
		proxyReq.setHeader('Accept', 'application/json')
	},
	onProxyRes: (proxyRes, req, res) => {
		// CORSヘッダーを追加
		proxyRes.headers['Access-Control-Allow-Origin'] = '*'
		proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
		proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
	}
}))

// ヘルスチェック
app.get('/health', (req, res) => {
	res.json({ status: 'ok' })
})

app.listen(PORT, () => {
	console.log(`Proxy server running on http://localhost:${PORT}`)
})
