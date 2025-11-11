export type QiitaUser = {
	id: string
	name?: string
}
export type QiitaTag = {
	name: string
}
export type QiitaItem = {
	id: string
	title: string
	url: string
	likes_count: number
	created_at: string
	rendered_body?: string
	user: QiitaUser
	tags: QiitaTag[]
}

export type RateLimitInfo = {
	limit: number
	remaining: number
	reset: number
}

export function buildQuery(params: { org: string; raw: string }): string {
	const tokens = params.raw.trim()
	const base = `org:${params.org}`
	if (!tokens) return base
	return `${base} ${tokens}`
}

// 開発環境ではViteのプロキシを使用、本番環境ではVercelのServerless Functionsを使用
// Vercelでは/api/qiitaがServerless Functionsにルーティングされる
const API_BASE = '/api/qiita'

export async function fetchQiitaItems(input: { query: string; page: number; perPage: number }): Promise<{ items: QiitaItem[]; rate: RateLimitInfo | null }> {
	const url = new URL(`${API_BASE}/items`, window.location.origin)
	url.searchParams.set('page', String(input.page))
	url.searchParams.set('per_page', String(input.perPage))
	url.searchParams.set('query', input.query)

	const headers: Record<string, string> = { 'Accept': 'application/json' }
	// プロキシ（Vite開発サーバーまたはVercel Serverless Functions）がトークンを追加するため、
	// クライアント側ではトークンを送信しない（セキュリティのため）

	const res = await fetch(url.toString(), { headers })
	const rate = parseRate(res)
	if (!res.ok) {
		let errorMessage = `Qiita API error ${res.status}: ${res.statusText}`
		try {
			const text = await res.text()
			if (text) {
				// JSONエラーレスポンスをパースしてみる
				try {
					const json = JSON.parse(text)
					errorMessage = `Qiita API error ${res.status}: ${json.message || json.error || text}`
				} catch {
					errorMessage = `Qiita API error ${res.status}: ${text}`
				}
			}
		} catch {
			// テキスト取得に失敗した場合は既存のメッセージを使用
		}
		throw new Error(errorMessage)
	}
	const json = await res.json() as any[]
	// rendered_body は /items では返らないため、excerpt 代わりに空 or 省略
	const items: QiitaItem[] = json.map(j => ({
		id: j.id,
		title: j.title,
		url: j.url,
		likes_count: j.likes_count ?? 0,
		created_at: j.created_at,
		rendered_body: undefined,
		user: { id: j.user?.id, name: j.user?.name },
		tags: Array.isArray(j.tags) ? j.tags.map((t: any) => ({ name: t.name })) : []
	}))
	return { items, rate }
}

/**
 * 期間内の全記事を取得（ページネーション対応）
 */
export async function fetchAllItemsInPeriod(input: { org: string; startDate: string; endDate: string }): Promise<{ items: QiitaItem[]; rate: RateLimitInfo | null }> {
	// Qiita APIの日付範囲クエリは >= と <= を使う
	const dateQuery = `created:>=${input.startDate} created:<=${input.endDate}`
	const query = buildQuery({ org: input.org, raw: dateQuery })

	const allItems: QiitaItem[] = []
	let page = 1
	const perPage = 100 // 最大値
	let rate: RateLimitInfo | null = null
	let hasMore = true

	while (hasMore) {
		const url = new URL(`${API_BASE}/items`, window.location.origin)
		url.searchParams.set('page', String(page))
		url.searchParams.set('per_page', String(perPage))
		url.searchParams.set('query', query)

		const headers: Record<string, string> = { 'Accept': 'application/json' }
		// プロキシ（Vite開発サーバーまたはVercel Serverless Functions）がトークンを追加するため、
		// クライアント側ではトークンを送信しない（セキュリティのため）

		const res = await fetch(url.toString(), { headers })
		const currentRate = parseRate(res)
		if (currentRate) rate = currentRate

		if (!res.ok) {
			let errorMessage = `Qiita API error ${res.status}: ${res.statusText}`
			try {
				const text = await res.text()
				if (text) {
					// JSONエラーレスポンスをパースしてみる
					try {
						const json = JSON.parse(text)
						errorMessage = `Qiita API error ${res.status}: ${json.message || json.error || text}`
					} catch {
						errorMessage = `Qiita API error ${res.status}: ${text}`
					}
				}
			} catch {
				// テキスト取得に失敗した場合は既存のメッセージを使用
			}
			throw new Error(errorMessage)
		}

		const json = await res.json() as any[]
		const items: QiitaItem[] = json.map(j => ({
			id: j.id,
			title: j.title,
			url: j.url,
			likes_count: j.likes_count ?? 0,
			created_at: j.created_at,
			rendered_body: undefined,
			user: { id: j.user?.id, name: j.user?.name },
			tags: Array.isArray(j.tags) ? j.tags.map((t: any) => ({ name: t.name })) : []
		}))

		allItems.push(...items)
		hasMore = items.length === perPage
		page++

		// レート制限を考慮して少し待機
		if (hasMore && rate && rate.remaining < 10) {
			await new Promise(resolve => setTimeout(resolve, 1000))
		}
	}

	return { items: allItems, rate }
}

function parseRate(res: Response): RateLimitInfo | null {
	const limit = Number(res.headers.get('Rate-Limit'))
	const remaining = Number(res.headers.get('Rate-Remaining'))
	const reset = Number(res.headers.get('Rate-Reset'))
	if (Number.isFinite(limit) && Number.isFinite(remaining) && Number.isFinite(reset)) {
		return { limit, remaining, reset }
	}
	return null
}
