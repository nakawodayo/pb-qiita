import React, { useEffect, useMemo, useState } from 'react'
import { fetchQiitaItems, QiitaItem, RateLimitInfo, buildQuery } from '@/utils/qiita'

const ORG = import.meta.env.VITE_QIITA_ORG_ID as string | undefined
const DEFAULT_PER_PAGE = Number(import.meta.env.VITE_PER_PAGE ?? 20)

export function App() {
	const [q, setQ] = useState<string>('')
	const [page, setPage] = useState<number>(1)
	const [perPage, setPerPage] = useState<number>(Number.isFinite(DEFAULT_PER_PAGE) ? DEFAULT_PER_PAGE : 20)
	const [items, setItems] = useState<QiitaItem[]>([])
	const [isLoading, setIsLoading] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)
	const [rate, setRate] = useState<RateLimitInfo | null>(null)

	const effectiveQuery = useMemo(() => {
		return buildQuery({ org: ORG ?? '', raw: q })
	}, [q])

	useEffect(() => {
		if (!ORG) {
			setError('VITE_QIITA_ORG_ID が設定されていません')
			return
		}
		setIsLoading(true)
		setError(null)
		fetchQiitaItems({
			query: effectiveQuery,
			page,
			perPage
		}).then(res => {
			setItems(res.items)
			setRate(res.rate)
		}).catch(err => {
			setError(err instanceof Error ? err.message : String(err))
		}).finally(() => setIsLoading(false))
	}, [effectiveQuery, page, perPage])

	const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
		e.preventDefault()
		setPage(1)
	}

	return (
		<div className="container">
			<header className="header">
				<div className="title">Qiita Organization Browser <span className="org">{ORG ?? ''}</span></div>
				{rate && <span className="badge">Rate {rate.remaining}/{rate.limit} reset {new Date(rate.reset * 1000).toLocaleTimeString()}</span>}
			</header>

			<form className="searchBar" onSubmit={onSubmit}>
				<input
					className="input"
					placeholder="キーワード、tag:react、user:alice など（orgは自動付与）"
					value={q}
					onChange={(e) => setQ(e.target.value)}
				/>
				<button className="button" disabled={isLoading} type="submit">検索</button>
			</form>

			<div style={{ height: 8 }} />

			<section className="panel">
				{error && <div className="error">エラー: {error}</div>}
				{isLoading && <div>読み込み中...</div>}
				{!isLoading && !error && (
					<>
						<div className="meta" style={{ marginBottom: 8, justifyContent: 'space-between' }}>
							<span>1ページあたり {perPage}件</span>
							<label>
								件数:
								<select
									className="input"
									style={{ width: 96, marginLeft: 6, padding: '6px 8px' }}
									value={perPage}
									onChange={(e) => {
										const v = Math.max(1, Math.min(100, Number(e.target.value) || 20))
										setPerPage(v)
										setPage(1)
									}}
								>
									<option value={10}>10</option>
									<option value={20}>20</option>
									<option value={50}>50</option>
									<option value={100}>100</option>
								</select>
							</label>
						</div>
						<div className="list">
							{items.map(it => (
								<article key={it.id} className="item">
									<a className="itemTitle" href={it.url} target="_blank" rel="noreferrer">{it.title}</a>
									<div className="meta">
										<span>by {it.user.id}</span>
										<span>{new Date(it.created_at).toLocaleDateString()}</span>
										<span>LGTM {it.likes_count}</span>
									</div>
									<div className="tags">
										{it.tags.slice(0, 6).map(t => (
											<span key={t.name} className="tag">#{t.name}</span>
										))}
									</div>
									{it.rendered_body && <div className="excerpt" dangerouslySetInnerHTML={{ __html: it.rendered_body.slice(0, 180) + '...' }} />}
								</article>
							))}
						</div>

						<div className="pagination">
							<button className="pager" disabled={page <= 1 || isLoading} onClick={() => setPage(p => Math.max(1, p - 1))}>前へ</button>
							<span className="badge">Page {page}</span>
							<button className="pager" disabled={isLoading || items.length < perPage} onClick={() => setPage(p => p + 1)}>次へ</button>
						</div>
					</>
				)}
			</section>
		</div>
	)
}
