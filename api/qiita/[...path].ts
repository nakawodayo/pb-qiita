import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(
	req: VercelRequest,
	res: VercelResponse
) {
	// パスを取得（/api/qiita/items -> /api/v2/items）
	const path = Array.isArray(req.query.path)
		? req.query.path.join('/')
		: req.query.path || ''

	const targetUrl = `https://qiita.com/api/v2/${path}`

	// クエリパラメータを取得（path以外のパラメータ）
	const queryParams: Record<string, string> = {}
	for (const [key, value] of Object.entries(req.query)) {
		if (key !== 'path' && value) {
			queryParams[key] = Array.isArray(value) ? value[0] : value
		}
	}
	const queryString = new URLSearchParams(queryParams).toString()
	const url = queryString
		? `${targetUrl}?${queryString}`
		: targetUrl

	// ヘッダーを準備
	const headers: Record<string, string> = {
		'Accept': 'application/json',
		'Content-Type': 'application/json'
	}

	// 環境変数からトークンを取得（Vercelの環境変数）
	const token = process.env.QIITA_ACCESS_TOKEN
	if (token) {
		headers['Authorization'] = `Bearer ${token}`
	}

	try {
		const response = await fetch(url, {
			method: req.method,
			headers,
			body: req.method !== 'GET' && req.method !== 'HEAD'
				? JSON.stringify(req.body)
				: undefined
		})

		// レスポンスヘッダーをコピー
		const rateLimit = response.headers.get('Rate-Limit')
		const rateRemaining = response.headers.get('Rate-Remaining')
		const rateReset = response.headers.get('Rate-Reset')

		if (rateLimit) res.setHeader('Rate-Limit', rateLimit)
		if (rateRemaining) res.setHeader('Rate-Remaining', rateRemaining)
		if (rateReset) res.setHeader('Rate-Reset', rateReset)

		// CORSヘッダーを追加
		res.setHeader('Access-Control-Allow-Origin', '*')
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
		res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

		// OPTIONSリクエストの処理
		if (req.method === 'OPTIONS') {
			return res.status(200).end()
		}

		const data = await response.json()
		res.status(response.status).json(data)
	} catch (error) {
		console.error('Proxy error:', error)
		res.status(500).json({
			error: 'Proxy error',
			message: error instanceof Error ? error.message : String(error)
		})
	}
}
