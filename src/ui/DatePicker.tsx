import { useState, useRef, useEffect } from 'react'

interface DatePickerProps {
	value: string
	onChange: (date: string) => void
	label: string
	min?: string
	max?: string
}

export function DatePicker({ value, onChange, label, min, max }: DatePickerProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [currentMonth, setCurrentMonth] = useState(() => {
		if (value) {
			const date = new Date(value + 'T00:00:00')
			return new Date(date.getFullYear(), date.getMonth(), 1)
		}
		return new Date(new Date().getFullYear(), new Date().getMonth(), 1)
	})
	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!isOpen) return

		const handleClickOutside = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setIsOpen(false)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [isOpen])

	const formatDate = (date: Date): string => {
		return date.toISOString().split('T')[0]
	}

	const getDaysInMonth = (date: Date): Date[] => {
		const year = date.getFullYear()
		const month = date.getMonth()
		const firstDay = new Date(year, month, 1)
		const lastDay = new Date(year, month + 1, 0)
		const days: Date[] = []

		// 月の最初の日の曜日を取得（日曜日=0）
		const startDay = firstDay.getDay()

		// 前月の日付を追加
		const prevMonth = new Date(year, month - 1, 0)
		for (let i = startDay - 1; i >= 0; i--) {
			days.push(new Date(year, month - 1, prevMonth.getDate() - i))
		}

		// 今月の日付を追加
		for (let day = 1; day <= lastDay.getDate(); day++) {
			days.push(new Date(year, month, day))
		}

		// 次の月の日付を追加（42日分のグリッドを作るため）
		const remaining = 42 - days.length
		for (let day = 1; day <= remaining; day++) {
			days.push(new Date(year, month + 1, day))
		}

		return days
	}

	const handleDateClick = (date: Date) => {
		const dateStr = formatDate(date)
		if (min && dateStr < min) return
		if (max && dateStr > max) return
		onChange(dateStr)
		setIsOpen(false)
	}

	const prevMonth = () => {
		setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
	}

	const nextMonth = () => {
		setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
	}

	const days = getDaysInMonth(currentMonth)
	const selectedDate = value ? new Date(value + 'T00:00:00') : null
	const today = new Date()
	today.setHours(0, 0, 0, 0)

	const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
	const weekDays = ['日', '月', '火', '水', '木', '金', '土']

	return (
		<div ref={containerRef} style={{ position: 'relative' }}>
			<label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
				<span style={{ fontSize: 13, color: 'var(--muted)' }}>{label}:</span>
				<div style={{ position: 'relative' }}>
					<input
						type="text"
						className="input"
						style={{ width: 150, padding: '6px 8px', cursor: 'pointer' }}
						value={value || ''}
						onClick={() => setIsOpen(!isOpen)}
						readOnly
						placeholder="日付を選択"
					/>
					{isOpen && (
						<div style={{
							position: 'absolute',
							top: '100%',
							left: 0,
							marginTop: 4,
							background: 'var(--panel)',
							border: '1px solid #2a335a',
							borderRadius: 8,
							padding: 12,
							zIndex: 1000,
							boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
							minWidth: 280
						}}>
							<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
								<button
									type="button"
									onClick={prevMonth}
									style={{
										background: 'transparent',
										border: 'none',
										color: 'var(--text)',
										cursor: 'pointer',
										padding: '4px 8px',
										fontSize: 16
									}}
								>
									‹
								</button>
								<span style={{ fontWeight: 600 }}>
									{currentMonth.getFullYear()}年 {monthNames[currentMonth.getMonth()]}
								</span>
								<button
									type="button"
									onClick={nextMonth}
									style={{
										background: 'transparent',
										border: 'none',
										color: 'var(--text)',
										cursor: 'pointer',
										padding: '4px 8px',
										fontSize: 16
									}}
								>
									›
								</button>
							</div>
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
								{weekDays.map(day => (
									<div key={day} style={{
										textAlign: 'center',
										fontSize: 12,
										color: 'var(--muted)',
										padding: '4px 0',
										fontWeight: 600
									}}>
										{day}
									</div>
								))}
							</div>
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
								{days.map((date, idx) => {
									const dateStr = formatDate(date)
									const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
									const isSelected = selectedDate && formatDate(selectedDate) === dateStr
									const isToday = formatDate(today) === dateStr
									const isDisabled = Boolean((min && dateStr < min) || (max && dateStr > max))

									return (
										<button
											key={idx}
											type="button"
											onClick={() => handleDateClick(date)}
											disabled={isDisabled}
											style={{
												background: isSelected
													? 'linear-gradient(135deg, var(--accent), var(--accent-2))'
													: isToday
													? '#1a2344'
													: 'transparent',
												border: isToday && !isSelected ? '1px solid var(--accent)' : '1px solid transparent',
												color: isSelected
													? '#0a0f20'
													: isCurrentMonth
													? 'var(--text)'
													: 'var(--muted)',
												cursor: isDisabled ? 'not-allowed' : 'pointer',
												padding: '8px 4px',
												borderRadius: 4,
												fontSize: 13,
												opacity: isDisabled ? 0.3 : 1,
												transition: 'all 0.2s'
											}}
											onMouseEnter={(e) => {
												if (!isDisabled && !isSelected) {
													e.currentTarget.style.background = '#1a2344'
												}
											}}
											onMouseLeave={(e) => {
												if (!isDisabled && !isSelected) {
													e.currentTarget.style.background = isToday ? '#1a2344' : 'transparent'
												}
											}}
										>
											{date.getDate()}
										</button>
									)
								})}
							</div>
						</div>
					)}
				</div>
			</label>
		</div>
	)
}
