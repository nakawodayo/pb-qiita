import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
	// 環境変数を読み込む
	const env = loadEnv(mode, process.cwd(), '')
	const token = env.VITE_QIITA_ACCESS_TOKEN

	return {
		plugins: [react()],
		resolve: {
			alias: {
				'@': fileURLToPath(new URL('./src', import.meta.url))
			}
		},
		server: {
			port: 5173,
			proxy: {
				'/api/qiita': {
					target: 'https://qiita.com',
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/api\/qiita/, '/api/v2'),
					configure: (proxy, _options) => {
						proxy.on('proxyReq', (proxyReq, req, _res) => {
							// Acceptヘッダーを設定
							proxyReq.setHeader('Accept', 'application/json')
							// 環境変数からトークンを取得してヘッダーに追加
							if (token) {
								proxyReq.setHeader('Authorization', `Bearer ${token}`)
							}
						})
						proxy.on('error', (err, req, res) => {
							if (res && !res.headersSent) {
								res.writeHead(500, {
									'Content-Type': 'text/plain'
								})
								res.end('Proxy error: ' + err.message)
							}
						})
					}
				}
			}
		}
	}
})
