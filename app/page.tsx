'use client'

import { useState } from 'react'

type Market = 'kospi' | 'kosdaq'

type StockEntry = {
  id: number
  stockName: string
  beforePrice: string
  afterPrice: string
  market: Market
}

type Results = {
  r382: number
  r500: number
  r618: number
}

// ── 호가단위 (KRX 기준) ────────────────────────────────────────────────
function getTickSize(price: number, market: Market): number {
  if (market === 'kospi') {
    if (price < 1_000) return 1
    if (price < 5_000) return 5
    if (price < 10_000) return 10
    if (price < 50_000) return 50
    if (price < 100_000) return 100
    if (price < 500_000) return 500
    return 1_000
  } else {
    // KOSDAQ
    if (price < 1_000) return 1
    if (price < 5_000) return 5
    if (price < 10_000) return 10
    if (price < 50_000) return 50
    return 100
  }
}

function roundToTick(price: number, market: Market): number {
  const tick = getTickSize(price, market)
  return Math.round(price / tick) * tick
}

function calcResults(entry: StockEntry): Results | null {
  const before = parseFloat(entry.beforePrice)
  const after = parseFloat(entry.afterPrice)
  if (isNaN(before) || isNaN(after) || after <= before || before <= 0) return null
  const diff = after - before
  return {
    r382: roundToTick(after - diff * 0.382, entry.market),
    r500: roundToTick(after - diff * 0.5, entry.market),
    r618: roundToTick(after - diff * 0.618, entry.market),
  }
}

function formatPrice(price: number) {
  return price.toLocaleString('ko-KR')
}

function getTickLabel(price: string, market: Market): string {
  const n = parseFloat(price)
  if (isNaN(n) || n <= 0) return ''
  const tick = getTickSize(n, market)
  return `호가단위 ${tick.toLocaleString('ko-KR')}원`
}

export default function Home() {
  const [dark, setDark] = useState(true)
  const [entries, setEntries] = useState<StockEntry[]>([
    { id: 1, stockName: '', beforePrice: '', afterPrice: '', market: 'kospi' },
  ])

  const updateEntry = (id: number, field: keyof StockEntry, value: string) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
  }

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      { id: Date.now(), stockName: '', beforePrice: '', afterPrice: '', market: 'kospi' },
    ])
  }

  const removeEntry = (id: number) => {
    if (entries.length === 1) return
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  // ── 테마 토큰 ──────────────────────────────────────────────────────────
  const T = dark
    ? {
        page: 'bg-black',
        card: 'bg-zinc-900 border-zinc-700',
        cardRight: 'bg-zinc-800 border-zinc-700',
        headerBar: 'bg-zinc-800 border-zinc-700',
        title: 'text-white',
        subtitle: 'text-zinc-400',
        label: 'text-zinc-400',
        tickHint: 'text-zinc-500',
        input: 'bg-zinc-800 border-zinc-600 text-white placeholder-zinc-600 focus:border-blue-500 focus:ring-blue-500',
        marketBtn: 'bg-zinc-700 border-zinc-600 text-zinc-300 hover:bg-zinc-600',
        marketBtnActive: 'bg-blue-600 border-blue-500 text-white',
        resultBox382: 'bg-emerald-950 border-emerald-700 text-emerald-400',
        resultBox500: 'bg-yellow-950 border-yellow-700 text-yellow-400',
        resultBox618: 'bg-orange-950 border-orange-700 text-orange-400',
        resultLabel382: 'text-emerald-600',
        resultLabel500: 'text-yellow-600',
        resultLabel618: 'text-orange-600',
        divider: 'border-zinc-700',
        addBtn: 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500',
        removeBtn: 'text-zinc-600 hover:text-red-400',
        toggleBg: 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700',
        badge: 'bg-zinc-700 text-zinc-300',
        empty: 'text-zinc-700',
        stockName: 'text-white',
      }
    : {
        page: 'bg-gray-50',
        card: 'bg-white border-gray-200 shadow-sm',
        cardRight: 'bg-gray-50 border-gray-200',
        headerBar: 'bg-gray-50 border-gray-200',
        title: 'text-gray-900',
        subtitle: 'text-gray-500',
        label: 'text-gray-500',
        tickHint: 'text-gray-400',
        input: 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500',
        marketBtn: 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-200',
        marketBtnActive: 'bg-blue-600 border-blue-600 text-white',
        resultBox382: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        resultBox500: 'bg-yellow-50 border-yellow-200 text-yellow-700',
        resultBox618: 'bg-orange-50 border-orange-200 text-orange-700',
        resultLabel382: 'text-emerald-500',
        resultLabel500: 'text-yellow-500',
        resultLabel618: 'text-orange-500',
        divider: 'border-gray-200',
        addBtn: 'bg-white hover:bg-gray-50 text-gray-500 border-gray-300 hover:border-gray-400',
        removeBtn: 'text-gray-400 hover:text-red-400',
        toggleBg: 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50',
        badge: 'bg-gray-100 text-gray-500',
        empty: 'text-gray-300',
        stockName: 'text-gray-900',
      }

  return (
    <main className={`min-h-screen ${T.page} py-10 px-4 transition-colors duration-300`}>
      <div className="max-w-3xl mx-auto">

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-2xl font-bold ${T.title}`}>피보나치 되돌림 계산기</h1>
            <p className={`text-sm mt-0.5 ${T.subtitle}`}>
              코스피 · 코스닥 호가단위 자동 반올림
            </p>
          </div>
          <button
            onClick={() => setDark(!dark)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${T.toggleBg}`}
          >
            {dark ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
                라이트 모드
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
                다크 모드
              </>
            )}
          </button>
        </div>

        {/* 컬럼 레이블 */}
        <div className="grid grid-cols-2 gap-3 mb-2 px-1">
          <p className={`text-xs font-semibold tracking-widest uppercase ${T.subtitle}`}>입력</p>
          <p className={`text-xs font-semibold tracking-widest uppercase ${T.subtitle}`}>매수 구간</p>
        </div>

        {/* 카드 목록 */}
        <div className="space-y-4">
          {entries.map((entry, idx) => {
            const res = calcResults(entry)

            return (
              <div
                key={entry.id}
                className={`rounded-2xl border overflow-hidden transition-colors duration-200 ${T.card}`}
              >
                {/* 카드 상단 바 */}
                <div className={`flex items-center justify-between px-4 py-2.5 border-b ${T.headerBar} ${T.divider}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${T.badge}`}>
                      #{idx + 1}
                    </span>
                    {/* 시장 선택 */}
                    <div className="flex rounded-lg overflow-hidden border border-transparent gap-1">
                      {(['kospi', 'kosdaq'] as Market[]).map((m) => (
                        <button
                          key={m}
                          onClick={() => updateEntry(entry.id, 'market', m)}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                            entry.market === m ? T.marketBtnActive : T.marketBtn
                          }`}
                        >
                          {m === 'kospi' ? 'KOSPI' : 'KOSDAQ'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => removeEntry(entry.id)}
                    disabled={entries.length === 1}
                    className={`transition ${T.removeBtn} disabled:opacity-20 disabled:cursor-not-allowed`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* 2열 그리드 */}
                <div className="grid grid-cols-2">

                  {/* ── 왼쪽: 입력 ── */}
                  <div className={`p-4 space-y-3 border-r ${T.divider}`}>

                    {/* 종목명 */}
                    <div>
                      <label className={`block text-xs font-medium mb-1.5 ${T.label}`}>종목명</label>
                      <input
                        type="text"
                        value={entry.stockName}
                        onChange={(e) => updateEntry(entry.id, 'stockName', e.target.value)}
                        placeholder="예: 삼성전자"
                        className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 transition ${T.input}`}
                      />
                    </div>

                    {/* 상승전 주가 */}
                    <div>
                      <label className={`block text-xs font-medium mb-1.5 ${T.label}`}>상승전 주가 (원)</label>
                      <input
                        type="number"
                        value={entry.beforePrice}
                        onChange={(e) => updateEntry(entry.id, 'beforePrice', e.target.value)}
                        placeholder="예: 50000"
                        className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 transition ${T.input}`}
                      />
                      {entry.beforePrice && (
                        <p className={`text-xs mt-1 ${T.tickHint}`}>
                          {getTickLabel(entry.beforePrice, entry.market)}
                        </p>
                      )}
                    </div>

                    {/* 상승후 주가 */}
                    <div>
                      <label className={`block text-xs font-medium mb-1.5 ${T.label}`}>상승후 주가 (원)</label>
                      <input
                        type="number"
                        value={entry.afterPrice}
                        onChange={(e) => updateEntry(entry.id, 'afterPrice', e.target.value)}
                        placeholder="예: 80000"
                        className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 transition ${T.input}`}
                      />
                      {entry.afterPrice && (
                        <p className={`text-xs mt-1 ${T.tickHint}`}>
                          {getTickLabel(entry.afterPrice, entry.market)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ── 오른쪽: 결과 ── */}
                  <div className={`p-4 space-y-3 ${T.cardRight}`}>

                    {/* 종목명 표시 (높이 맞춤) */}
                    <div className="h-[58px] flex flex-col justify-end pb-0.5">
                      {entry.stockName
                        ? <span className={`text-base font-bold ${T.stockName}`}>{entry.stockName}</span>
                        : <span className={`text-xs ${T.empty}`}>종목명을 입력하세요</span>
                      }
                      {res && (
                        <span className={`text-xs mt-0.5 ${T.tickHint}`}>
                          상승폭 {formatPrice(parseFloat(entry.afterPrice) - parseFloat(entry.beforePrice))}원
                        </span>
                      )}
                    </div>

                    {/* 1차매수 0.382 */}
                    <div className={`flex items-center justify-between border rounded-lg px-3 py-2.5 ${T.resultBox382}`}>
                      <div className="leading-tight">
                        <p className={`text-xs font-bold ${T.resultLabel382}`}>1차매수</p>
                        <p className="text-xs opacity-60">0.382 되돌림</p>
                      </div>
                      <span className="text-base font-bold tabular-nums">
                        {res
                          ? <>{formatPrice(res.r382)}<span className="text-xs font-normal ml-0.5">원</span></>
                          : <span className={T.empty}>-</span>
                        }
                      </span>
                    </div>

                    {/* 2차매수 0.5 */}
                    <div className={`flex items-center justify-between border rounded-lg px-3 py-2.5 ${T.resultBox500}`}>
                      <div className="leading-tight">
                        <p className={`text-xs font-bold ${T.resultLabel500}`}>2차매수</p>
                        <p className="text-xs opacity-60">0.5 되돌림</p>
                      </div>
                      <span className="text-base font-bold tabular-nums">
                        {res
                          ? <>{formatPrice(res.r500)}<span className="text-xs font-normal ml-0.5">원</span></>
                          : <span className={T.empty}>-</span>
                        }
                      </span>
                    </div>

                    {/* 3차매수 0.618 */}
                    <div className={`flex items-center justify-between border rounded-lg px-3 py-2.5 ${T.resultBox618}`}>
                      <div className="leading-tight">
                        <p className={`text-xs font-bold ${T.resultLabel618}`}>3차매수</p>
                        <p className="text-xs opacity-60">0.618 되돌림</p>
                      </div>
                      <span className="text-base font-bold tabular-nums">
                        {res
                          ? <>{formatPrice(res.r618)}<span className="text-xs font-normal ml-0.5">원</span></>
                          : <span className={T.empty}>-</span>
                        }
                      </span>
                    </div>

                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* 종목 추가 버튼 */}
        <button
          onClick={addEntry}
          className={`mt-4 w-full border border-dashed rounded-2xl py-4 text-sm font-medium transition-all flex items-center justify-center gap-2 ${T.addBtn}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          종목 추가
        </button>

        {/* 호가단위 안내 */}
        <div className={`mt-6 rounded-xl border p-4 ${T.card}`}>
          <p className={`text-xs font-semibold mb-2 ${T.subtitle}`}>호가단위 기준</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={`text-xs font-bold mb-1 ${T.label}`}>KOSPI</p>
              <table className={`text-xs w-full ${T.subtitle}`}>
                <tbody className="space-y-0.5">
                  {[
                    ['1,000원 미만', '1원'],
                    ['1,000 ~ 5,000원', '5원'],
                    ['5,000 ~ 10,000원', '10원'],
                    ['10,000 ~ 50,000원', '50원'],
                    ['50,000 ~ 100,000원', '100원'],
                    ['100,000 ~ 500,000원', '500원'],
                    ['500,000원 이상', '1,000원'],
                  ].map(([range, tick]) => (
                    <tr key={range}>
                      <td className="pr-3 py-0.5">{range}</td>
                      <td className={`font-semibold ${T.title}`}>{tick}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <p className={`text-xs font-bold mb-1 ${T.label}`}>KOSDAQ</p>
              <table className={`text-xs w-full ${T.subtitle}`}>
                <tbody>
                  {[
                    ['1,000원 미만', '1원'],
                    ['1,000 ~ 5,000원', '5원'],
                    ['5,000 ~ 10,000원', '10원'],
                    ['10,000 ~ 50,000원', '50원'],
                    ['50,000원 이상', '100원'],
                  ].map(([range, tick]) => (
                    <tr key={range}>
                      <td className="pr-3 py-0.5">{range}</td>
                      <td className={`font-semibold ${T.title}`}>{tick}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}
