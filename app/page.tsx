'use client'

import { useState } from 'react'

type Market = 'kospi' | 'kosdaq'
type WaveType = 'basic' | 'wave2' | 'wave4' | 'wave5'

type StockEntry = {
  id: number
  stockName: string
  beforePrice: string
  afterPrice: string
  investAmount: string
  market: Market
  waveType: WaveType
}

type WaveBuyEntry = {
  r: number
  w: number
  label: string
}

type WaveConfig = {
  buys: WaveBuyEntry[]
  stopLossR: number | null
  stopLossLabel: string | null
  avgPriceR: number | null
  beforeLabel: string
  afterLabel: string
}

const WAVE_CONFIGS: Record<WaveType, WaveConfig> = {
  basic: {
    buys: [
      { r: 0.382, w: 1 / 3, label: '0.382 되돌림' },
      { r: 0.5,   w: 1 / 3, label: '0.5 되돌림' },
      { r: 0.618, w: 1 / 3, label: '0.618 되돌림' },
    ],
    stopLossR: null,
    stopLossLabel: null,
    avgPriceR: null,
    beforeLabel: '상승전 주가 (원)',
    afterLabel: '상승후 주가 (원)',
  },
  wave2: {
    buys: [
      { r: 0.44, w: 0.2, label: '0.44 되돌림 · 비중 20%' },
      { r: 0.56, w: 0.4, label: '0.56 되돌림 · 비중 40%' },
      { r: 0.68, w: 0.4, label: '0.68 되돌림 · 비중 40%' },
    ],
    stopLossR: 0.786,
    stopLossLabel: '0.786 되돌림',
    avgPriceR: null,
    beforeLabel: '1파 시작점 (최저점)',
    afterLabel: '1파 최고점',
  },
  wave4: {
    buys: [
      { r: 0.44, w: 0.2, label: '0.44 되돌림 · 비중 20%' },
      { r: 0.53, w: 0.4, label: '0.53 되돌림 · 비중 40%' },
      { r: 0.62, w: 0.4, label: '0.62 되돌림 · 비중 40%' },
    ],
    stopLossR: 0.71,
    stopLossLabel: '0.71 되돌림',
    avgPriceR: null,
    beforeLabel: '2파 저점 (3파 시작점)',
    afterLabel: '3파 최고점',
  },
  wave5: {
    buys: [
      { r: 0.618, w: 0.2, label: '0.618 되돌림 · 비중 20%' },
      { r: 0.705, w: 0.4, label: '0.705 되돌림 · 비중 40%' },
      { r: 0.786, w: 0.4, label: '0.786 되돌림 · 비중 40%' },
    ],
    stopLossR: 1.0,
    stopLossLabel: '1파 시작점 이탈',
    avgPriceR: null,
    beforeLabel: '1파 시작점 (최저점)',
    afterLabel: '5파 최고점 (피날레)',
  },
}

const WAVE_TABS: { key: WaveType; label: string }[] = [
  { key: 'basic', label: '기본' },
  { key: 'wave2', label: '2파' },
  { key: 'wave4', label: '4파' },
  { key: 'wave5', label: '5파' },
]

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

type CalcResult = {
  buys: { price: number; amount: number | null }[]
  stopLossPrice: number | null
  avgPrice: number | null
  intermediateAvgPrice: number | null
  finalAvgPrice: number | null
  sell1Price: number | null
  sell2Price: number | null
}

function calcResults(entry: StockEntry): CalcResult | null {
  const before = parseFloat(entry.beforePrice)
  const after = parseFloat(entry.afterPrice)
  if (isNaN(before) || isNaN(after) || after <= before || before <= 0) return null

  const invest = parseFloat(entry.investAmount)
  const hasInvest = !isNaN(invest) && invest > 0

  const cfg = WAVE_CONFIGS[entry.waveType]
  const diff = after - before

  const buyResults = cfg.buys.map((b) => ({
    price: roundToTick(after - diff * b.r, entry.market),
    amount: hasInvest ? Math.round(invest * b.w) : null,
  }))

  let intermediateAvgPrice: number | null = null
  let finalAvgPrice: number | null = null

  if (cfg.buys.length >= 3) {
    const [b0, b1, b2] = cfg.buys
    const [r0, r1, r2] = buyResults
    const totalW12 = b0.w + b1.w
    intermediateAvgPrice = roundToTick(
      (r0.price * b0.w + r1.price * b1.w) / totalW12,
      entry.market
    )
    finalAvgPrice = roundToTick(
      (r0.price * b0.w + r1.price * b1.w + r2.price * b2.w) / (b0.w + b1.w + b2.w),
      entry.market
    )
  }

  let sell1Price: number | null = null
  let sell2Price: number | null = null

  if (entry.waveType === 'wave2' && finalAvgPrice !== null) {
    // 1차 매도: 1파 최고점(after) * 0.99
    sell1Price = roundToTick(after * 0.99, entry.market)
    // 2차 매도: 평단가 + (1파 최고점 - 1파 시작점) * 1.618
    sell2Price = roundToTick(finalAvgPrice + diff * 1.618, entry.market)
  } else if (entry.waveType === 'wave4' && finalAvgPrice !== null) {
    // 1차 매도: 평단가 + (3파 최고점 - 평단가) * 0.382
    sell1Price = roundToTick(finalAvgPrice + (after - finalAvgPrice) * 0.382, entry.market)
    // 2차 매도: 3파 최고점(after) * 0.99
    sell2Price = roundToTick(after * 0.99, entry.market)
  }

  return {
    buys: buyResults,
    stopLossPrice: cfg.stopLossR !== null
      ? roundToTick(after - diff * cfg.stopLossR, entry.market)
      : null,
    avgPrice: cfg.avgPriceR !== null
      ? roundToTick(after - diff * cfg.avgPriceR, entry.market)
      : null,
    intermediateAvgPrice,
    finalAvgPrice,
    sell1Price,
    sell2Price,
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
    { id: 1, stockName: '', beforePrice: '', afterPrice: '', investAmount: '', market: 'kospi', waveType: 'basic' },
  ])

  const updateEntry = (id: number, field: keyof StockEntry, value: string) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
  }

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      { id: Date.now(), stockName: '', beforePrice: '', afterPrice: '', investAmount: '', market: 'kospi', waveType: 'basic' },
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
        waveBtn: 'bg-zinc-700 border-zinc-600 text-zinc-300 hover:bg-zinc-600',
        waveBtnActive: 'bg-indigo-600 border-indigo-500 text-white',
        resultBox1: 'bg-emerald-950 border-emerald-700 text-emerald-400',
        resultBox2: 'bg-yellow-950 border-yellow-700 text-yellow-400',
        resultBox3: 'bg-orange-950 border-orange-700 text-orange-400',
        resultLabel1: 'text-emerald-600',
        resultLabel2: 'text-yellow-600',
        resultLabel3: 'text-orange-600',
        amountBadge: 'text-zinc-400',
        divider: 'border-zinc-700',
        addBtn: 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500',
        removeBtn: 'text-zinc-600 hover:text-red-400',
        toggleBg: 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700',
        badge: 'bg-zinc-700 text-zinc-300',
        empty: 'text-zinc-700',
        stockName: 'text-white',
        sellBox1: 'bg-cyan-950 border-cyan-700 text-cyan-300',
        sellLabel1: 'text-cyan-400',
        sellBox2: 'bg-blue-950 border-blue-700 text-blue-300',
        sellLabel2: 'text-blue-400',
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
        waveBtn: 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-200',
        waveBtnActive: 'bg-indigo-600 border-indigo-600 text-white',
        resultBox1: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        resultBox2: 'bg-yellow-50 border-yellow-200 text-yellow-700',
        resultBox3: 'bg-orange-50 border-orange-200 text-orange-700',
        resultLabel1: 'text-emerald-500',
        resultLabel2: 'text-yellow-500',
        resultLabel3: 'text-orange-500',
        amountBadge: 'text-gray-400',
        divider: 'border-gray-200',
        addBtn: 'bg-white hover:bg-gray-50 text-gray-500 border-gray-300 hover:border-gray-400',
        removeBtn: 'text-gray-400 hover:text-red-400',
        toggleBg: 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50',
        badge: 'bg-gray-100 text-gray-500',
        empty: 'text-gray-300',
        stockName: 'text-gray-900',
        sellBox1: 'bg-cyan-50 border-cyan-200 text-cyan-700',
        sellLabel1: 'text-cyan-600',
        sellBox2: 'bg-blue-50 border-blue-200 text-blue-700',
        sellLabel2: 'text-blue-600',
      }

  const boxStyles = [
    { box: T.resultBox1, label: T.resultLabel1 },
    { box: T.resultBox2, label: T.resultLabel2 },
    { box: T.resultBox3, label: T.resultLabel3 },
  ]

  return (
    <main className={`min-h-screen ${T.page} py-10 px-4 transition-colors duration-300`}>
      <div className="max-w-3xl mx-auto">

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-2xl font-bold ${T.title}`}>임펄스 파동 계산기</h1>
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
            const cfg = WAVE_CONFIGS[entry.waveType]

            return (
              <div
                key={entry.id}
                className={`rounded-2xl border overflow-hidden transition-colors duration-200 ${T.card}`}
              >
                {/* 카드 상단 바 */}
                <div className={`px-4 py-2.5 border-b ${T.headerBar} ${T.divider}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
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

                  {/* 파동 탭 선택 */}
                  <div className="flex gap-1 mt-2">
                    {WAVE_TABS.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => updateEntry(entry.id, 'waveType', tab.key)}
                        className={`px-4 py-1 text-xs font-semibold rounded-lg border transition-all ${
                          entry.waveType === tab.key ? T.waveBtnActive : T.waveBtn
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
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

                    {/* 투자금액 */}
                    <div>
                      <label className={`block text-xs font-medium mb-1.5 ${T.label}`}>투자금액 (원)</label>
                      <input
                        type="number"
                        value={entry.investAmount}
                        onChange={(e) => updateEntry(entry.id, 'investAmount', e.target.value)}
                        placeholder="예: 10000000"
                        className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 transition ${T.input}`}
                      />
                      {entry.investAmount && !isNaN(parseFloat(entry.investAmount)) && parseFloat(entry.investAmount) > 0 && (
                        <p className={`text-xs mt-1 ${T.tickHint}`}>
                          {formatPrice(parseFloat(entry.investAmount))}원
                        </p>
                      )}
                    </div>

                    {/* 저점 주가 */}
                    <div>
                      <label className={`block text-xs font-medium mb-1.5 ${T.label}`}>{cfg.beforeLabel}</label>
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

                    {/* 고점 주가 */}
                    <div>
                      <label className={`block text-xs font-medium mb-1.5 ${T.label}`}>{cfg.afterLabel}</label>
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

                    {/* 종목명 표시 */}
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

                    {entry.waveType === 'basic' ? (
                      /* 기본 탭: 3개 매수 순서대로 */
                      <>
                        {cfg.buys.map((buy, bIdx) => (
                          <div
                            key={bIdx}
                            className={`border rounded-lg px-3 py-2.5 ${boxStyles[Math.min(bIdx, boxStyles.length - 1)].box}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="leading-tight min-w-0">
                                <p className={`text-xs font-bold ${boxStyles[Math.min(bIdx, boxStyles.length - 1)].label}`}>{bIdx + 1}차매수</p>
                                <p className="text-xs opacity-60 break-keep">{buy.label}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-base font-bold tabular-nums block">
                                  {res
                                    ? <>{formatPrice(res.buys[bIdx].price)}<span className="text-xs font-normal ml-0.5">원</span></>
                                    : <span className={T.empty}>-</span>
                                  }
                                </span>
                                {res && res.buys[bIdx].amount !== null && (
                                  <span className={`text-xs font-medium tabular-nums ${T.amountBadge}`}>
                                    {formatPrice(res.buys[bIdx].amount!)}원
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      /* 2파 / 4파: 1차 → 2차 → 평단가(1~2차) → 3차 → 최종평단가 → 손절선 */
                      <>
                        {/* 1차, 2차 매수 */}
                        {cfg.buys.slice(0, 2).map((buy, bIdx) => (
                          <div
                            key={bIdx}
                            className={`border rounded-lg px-3 py-2.5 ${boxStyles[Math.min(bIdx, boxStyles.length - 1)].box}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="leading-tight min-w-0">
                                <p className={`text-xs font-bold ${boxStyles[Math.min(bIdx, boxStyles.length - 1)].label}`}>{bIdx + 1}차매수</p>
                                <p className="text-xs opacity-60 break-keep">{buy.label}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-base font-bold tabular-nums block">
                                  {res
                                    ? <>{formatPrice(res.buys[bIdx].price)}<span className="text-xs font-normal ml-0.5">원</span></>
                                    : <span className={T.empty}>-</span>
                                  }
                                </span>
                                {res && res.buys[bIdx].amount !== null && (
                                  <span className={`text-xs font-medium tabular-nums ${T.amountBadge}`}>
                                    {formatPrice(res.buys[bIdx].amount!)}원
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* 1~2차 평단가 */}
                        <div className={`border rounded-lg px-3 py-2.5 ${dark ? 'bg-sky-950 border-sky-700 text-sky-300' : 'bg-sky-50 border-sky-200 text-sky-700'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="leading-tight min-w-0">
                              <p className={`text-xs font-bold ${dark ? 'text-sky-400' : 'text-sky-500'}`}>평단가 (1~2차)</p>
                              <p className="text-xs opacity-60 break-keep">1·2차 매수 기준</p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-base font-bold tabular-nums block">
                                {res && res.intermediateAvgPrice !== null
                                  ? <>{formatPrice(res.intermediateAvgPrice)}<span className="text-xs font-normal ml-0.5">원</span></>
                                  : <span className={T.empty}>-</span>
                                }
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 3차 매수 */}
                        {cfg.buys.length >= 3 && (
                          <div className={`border rounded-lg px-3 py-2.5 ${boxStyles[2].box}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="leading-tight min-w-0">
                                <p className={`text-xs font-bold ${boxStyles[2].label}`}>3차매수</p>
                                <p className="text-xs opacity-60 break-keep">{cfg.buys[2].label}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-base font-bold tabular-nums block">
                                  {res
                                    ? <>{formatPrice(res.buys[2].price)}<span className="text-xs font-normal ml-0.5">원</span></>
                                    : <span className={T.empty}>-</span>
                                  }
                                </span>
                                {res && res.buys[2].amount !== null && (
                                  <span className={`text-xs font-medium tabular-nums ${T.amountBadge}`}>
                                    {formatPrice(res.buys[2].amount!)}원
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 최종 평단가 */}
                        <div className={`border-2 rounded-lg px-3 py-2.5 ${dark ? 'bg-violet-950 border-violet-500 text-violet-200' : 'bg-violet-50 border-violet-400 text-violet-800'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="leading-tight min-w-0">
                              <p className={`text-xs font-bold ${dark ? 'text-violet-400' : 'text-violet-500'}`}>🎯 최종 평단가</p>
                              <p className="text-xs opacity-60 break-keep">1·2·3차 매수 기준</p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-base font-bold tabular-nums block">
                                {res && res.finalAvgPrice !== null
                                  ? <>{formatPrice(res.finalAvgPrice)}<span className="text-xs font-normal ml-0.5">원</span></>
                                  : <span className={T.empty}>-</span>
                                }
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 목표 매도가 구분선 */}
                        {(entry.waveType === 'wave2' || entry.waveType === 'wave4') && (
                          <div className={`flex items-center gap-2 py-0.5`}>
                            <div className={`flex-1 border-t border-dashed ${dark ? 'border-cyan-800' : 'border-cyan-300'}`} />
                            <span className={`text-xs font-semibold px-1 ${dark ? 'text-cyan-600' : 'text-cyan-500'}`}>목표 매도가 (수익실현)</span>
                            <div className={`flex-1 border-t border-dashed ${dark ? 'border-cyan-800' : 'border-cyan-300'}`} />
                          </div>
                        )}

                        {/* 1차 매도 */}
                        {(entry.waveType === 'wave2' || entry.waveType === 'wave4') && (
                          <div className={`border rounded-lg px-3 py-2.5 ${T.sellBox1}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="leading-tight min-w-0">
                                <p className={`text-xs font-bold ${T.sellLabel1}`}>📈 1차 매도 · 비중 50%</p>
                                <p className="text-xs opacity-60 break-keep">
                                  {entry.waveType === 'wave2'
                                    ? '1차 수익실현 (1파 고점 저항대 1% 하단)'
                                    : '1차 수익실현 (단기 낙폭 0.382 기계적 되돌림)'}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-base font-bold tabular-nums block">
                                  {res && res.sell1Price !== null
                                    ? <>{formatPrice(res.sell1Price)}<span className="text-xs font-normal ml-0.5">원</span></>
                                    : <span className={T.empty}>-</span>
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 2차 매도 */}
                        {(entry.waveType === 'wave2' || entry.waveType === 'wave4') && (
                          <div className={`border rounded-lg px-3 py-2.5 ${T.sellBox2}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="leading-tight min-w-0">
                                <p className={`text-xs font-bold ${T.sellLabel2}`}>🚀 2차 매도 · 전량청산</p>
                                <p className="text-xs opacity-60 break-keep">
                                  {entry.waveType === 'wave2'
                                    ? '최종 전량매도 (피보나치 확장 1.618)'
                                    : '최종 전량매도 (쌍봉 마지노선 1% 하단)'}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-base font-bold tabular-nums block">
                                  {res && res.sell2Price !== null
                                    ? <>{formatPrice(res.sell2Price)}<span className="text-xs font-normal ml-0.5">원</span></>
                                    : <span className={T.empty}>-</span>
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 손절가 박스 */}
                        {cfg.stopLossR !== null && (
                          <div className={`border rounded-lg px-3 py-2.5 ${dark ? 'bg-red-950 border-red-800 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="leading-tight min-w-0">
                                <p className={`text-xs font-bold ${dark ? 'text-red-500' : 'text-red-400'}`}>손절선 · 전량 매도</p>
                                <p className="text-xs opacity-60 break-keep">{cfg.stopLossLabel}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-base font-bold tabular-nums block">
                                  {res && res.stopLossPrice !== null
                                    ? <>{formatPrice(res.stopLossPrice)}<span className="text-xs font-normal ml-0.5">원</span></>
                                    : <span className={T.empty}>-</span>
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}

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
