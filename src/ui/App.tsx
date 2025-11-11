import React, { useEffect, useMemo, useState } from 'react'
import { fetchQiitaItems, fetchAllItemsInPeriod, QiitaItem, RateLimitInfo, buildQuery } from '@/utils/qiita'
import { DatePicker } from './DatePicker'

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

	// ランキング関連の状態
	const [rankingStartDate, setRankingStartDate] = useState<string>('')
	const [rankingEndDate, setRankingEndDate] = useState<string>('')
	const [rankingItems, setRankingItems] = useState<QiitaItem[]>([])
	const [isLoadingRanking, setIsLoadingRanking] = useState<boolean>(false)
	const [rankingError, setRankingError] = useState<string | null>(null)
	const [showRanking, setShowRanking] = useState<boolean>(false)

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

	// ランキング取得
	const fetchRanking = async () => {
		if (!ORG) {
			setRankingError('VITE_QIITA_ORG_ID が設定されていません')
			return
		}
		if (!rankingStartDate || !rankingEndDate) {
			setRankingError('開始日と終了日を入力してください')
			return
		}
		setIsLoadingRanking(true)
		setRankingError(null)
		try {
			const res = await fetchAllItemsInPeriod({
				org: ORG,
				startDate: rankingStartDate,
				endDate: rankingEndDate
			})
			setRankingItems(res.items)
			setRate(res.rate)
			setShowRanking(true)
		} catch (err) {
			setRankingError(err instanceof Error ? err.message : String(err))
		} finally {
			setIsLoadingRanking(false)
		}
	}

	// いいね数ランキング
	const likesRanking = useMemo(() => {
		return [...rankingItems]
			.sort((a, b) => b.likes_count - a.likes_count)
			.slice(0, 20)
	}, [rankingItems])

	// 投稿数ランキング（ユーザー別）
	const postsRanking = useMemo(() => {
		const userCounts = new Map<string, { count: number; userId: string }>()
		rankingItems.forEach(item => {
			const userId = item.user.id
			const current = userCounts.get(userId) || { count: 0, userId }
			userCounts.set(userId, { count: current.count + 1, userId })
		})
		return Array.from(userCounts.values())
			.sort((a, b) => b.count - a.count)
			.slice(0, 20)
	}, [rankingItems])

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

			{/* ランキングセクション */}
			<section className="panel" style={{ marginBottom: 16 }}>
				<h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 16, fontWeight: 600 }}>期間別ランキング</h2>
				<div style={{ marginBottom: 12 }}>
					<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
						<DatePicker
							value={rankingStartDate}
							onChange={setRankingStartDate}
							label="開始日"
							max={rankingEndDate || undefined}
						/>
						<DatePicker
							value={rankingEndDate}
							onChange={setRankingEndDate}
							label="終了日"
							min={rankingStartDate || undefined}
						/>
						<button
							className="button"
							onClick={fetchRanking}
							disabled={isLoadingRanking}
							type="button"
						>
							{isLoadingRanking ? '取得中...' : 'ランキング取得'}
						</button>
					</div>
					<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
						{[
							{ label: '過去7日', getDates: () => {
								const today = new Date()
								const weekAgo = new Date(today)
								weekAgo.setDate(today.getDate() - 7)
								return { start: weekAgo.toISOString().split('T')[0], end: today.toISOString().split('T')[0] }
							}},
							{ label: '過去30日', getDates: () => {
								const today = new Date()
								const monthAgo = new Date(today)
								monthAgo.setMonth(today.getMonth() - 1)
								return { start: monthAgo.toISOString().split('T')[0], end: today.toISOString().split('T')[0] }
							}},
							{ label: '今月', getDates: () => {
								const today = new Date()
								const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
								return { start: startOfMonth.toISOString().split('T')[0], end: today.toISOString().split('T')[0] }
							}},
							{ label: '先月', getDates: () => {
								const today = new Date()
								const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
								const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
								return { start: lastMonth.toISOString().split('T')[0], end: lastDayOfLastMonth.toISOString().split('T')[0] }
							}},
							{ label: '今年', getDates: () => {
								const today = new Date()
								const startOfYear = new Date(today.getFullYear(), 0, 1)
								return { start: startOfYear.toISOString().split('T')[0], end: today.toISOString().split('T')[0] }
							}}
						].map((preset) => (
							<button
								key={preset.label}
								type="button"
								onClick={() => {
									const dates = preset.getDates()
									setRankingStartDate(dates.start)
									setRankingEndDate(dates.end)
								}}
								style={{
									padding: '4px 10px',
									borderRadius: 6,
									border: '1px solid #2a335a',
									background: '#0e1530',
									color: 'var(--text)',
									cursor: 'pointer',
									fontSize: 12,
									transition: 'all 0.2s'
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = '#1a2344'
									e.currentTarget.style.borderColor = 'var(--accent)'
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = '#0e1530'
									e.currentTarget.style.borderColor = '#2a335a'
								}}
							>
								{preset.label}
							</button>
						))}
					</div>
				</div>
				{rankingError && <div className="error" style={{ marginBottom: 8 }}>エラー: {rankingError}</div>}

				{showRanking && rankingItems.length > 0 && (
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginTop: 16 }}>
						{/* いいね数ランキング */}
						<div>
							<h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--accent)' }}>いいね数ランキング</h3>
							<div className="list">
								{likesRanking.map((item, idx) => (
									<div key={item.id} className="item" style={{ padding: '8px 10px' }}>
										<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
											<span className="badge" style={{ minWidth: 32, textAlign: 'center' }}>{idx + 1}</span>
											<a className="itemTitle" href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: 14, flex: 1 }}>
												{item.title}
											</a>
										</div>
										<div className="meta">
											<span>by {item.user.id}</span>
											<span>{new Date(item.created_at).toLocaleDateString()}</span>
											<span style={{ color: 'var(--accent)', fontWeight: 600 }}>LGTM {item.likes_count}</span>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* 投稿数ランキング */}
						<div>
							<h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--accent-2)' }}>投稿数ランキング（ユーザー別）</h3>
							<div className="list">
								{postsRanking.map((entry, idx) => (
									<div key={entry.userId} className="item" style={{ padding: '8px 10px' }}>
										<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
											<span className="badge" style={{ minWidth: 32, textAlign: 'center' }}>{idx + 1}</span>
											<span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{entry.userId}</span>
											<span style={{ color: 'var(--accent-2)', fontWeight: 600, fontSize: 14 }}>
												{entry.count}件
											</span>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				)}
				{showRanking && rankingItems.length === 0 && !isLoadingRanking && (
					<div style={{ color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>
						該当期間内に記事が見つかりませんでした
					</div>
				)}
			</section>

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
