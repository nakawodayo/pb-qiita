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

const API_BASE = 'https://qiita.com/api/v2'
const TOKEN = import.meta.env.VITE_QIITA_ACCESS_TOKEN as string | undefined

export async function fetchQiitaItems(input: { query: string; page: number; perPage: number }): Promise<{ items: QiitaItem[]; rate: RateLimitInfo | null }> {
	const url = new URL(`${API_BASE}/items`)
	url.searchParams.set('page', String(input.page))
	url.searchParams.set('per_page', String(input.perPage))
	url.searchParams.set('query', input.query)

	const headers: Record<string, string> = { 'Accept': 'application/json' }
	if (TOKEN) {
		headers['Authorization'] = `Bearer ${TOKEN}`
	}

	const res = await fetch(url.toString(), { headers })
	const rate = parseRate(res)
	if (!res.ok) {
		const text = await res.text().catch(() => '')
		throw new Error(`Qiita API error ${res.status}: ${text || res.statusText}`)
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

function parseRate(res: Response): RateLimitInfo | null {
	const limit = Number(res.headers.get('Rate-Limit'))
	const remaining = Number(res.headers.get('Rate-Remaining'))
	const reset = Number(res.headers.get('Rate-Reset'))
	if (Number.isFinite(limit) && Number.isFinite(remaining) && Number.isFinite(reset)) {
		return { limit, remaining, reset }
	}
	return null
}
