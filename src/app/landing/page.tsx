"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  TrendingUp,
  Brain,
  Shield,
  BarChart3,
  Globe,
  Zap,
  Target,
  Newspaper,
  Users,
  LineChart,
  ArrowRight,
  ChevronDown,
  Sparkles,
  PieChart,
  Clock,
  Bell,
} from "lucide-react"

/* ───── Animated Counter ───── */
function AnimatedNumber({ target, suffix = "" }: { readonly target: number; readonly suffix?: string }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const duration = 2000
    const steps = 60
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [target])

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

/* ───── Feature Card ───── */
function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
}: {
  readonly icon: React.ElementType
  readonly title: string
  readonly description: string
  readonly color: string
}) {
  return (
    <div className="group relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-300 hover:border-amber-500/30 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-amber-500/5">
      <div
        className={`mb-4 inline-flex rounded-xl p-3 ${color}`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-400">{description}</p>
    </div>
  )
}

/* ───── Main Features Data ───── */
const CORE_FEATURES = [
  {
    icon: Brain,
    title: "AI 종합 스코어",
    description:
      "기술적 분석, 재무 지표, 뉴스 감성, 리스크까지 종합하여 1~10점 AI 투자 스코어를 실시간 산출합니다.",
    color: "bg-amber-500/10 text-amber-400",
  },
  {
    icon: Target,
    title: "매매 타이밍 코치",
    description:
      "AI가 최적 매수/매도 타이밍, 지지선/저항선, 손절가를 분석하고 분할매수 전략까지 코칭합니다.",
    color: "bg-emerald-500/10 text-emerald-400",
  },
  {
    icon: Newspaper,
    title: "뉴스 임팩트 분석",
    description:
      "수백 건의 뉴스를 AI가 실시간 분석하여 종목별 영향도와 긍정/부정 시그널을 즉시 파악합니다.",
    color: "bg-blue-500/10 text-blue-400",
  },
  {
    icon: Users,
    title: "내부자 거래 추적",
    description:
      "임원/대주주의 매수·매도 패턴을 실시간 모니터링하고 AI가 심리 분석 리포트를 제공합니다.",
    color: "bg-purple-500/10 text-purple-400",
  },
  {
    icon: LineChart,
    title: "모멘텀 브레이크아웃",
    description:
      "거래량 급등, 기술적 돌파 시그널을 포착하여 상승 전환 가능성이 높은 종목을 선별합니다.",
    color: "bg-rose-500/10 text-rose-400",
  },
  {
    icon: PieChart,
    title: "섹터 로테이션 분석",
    description:
      "업종별 자금 흐름과 섹터 모멘텀 변화를 감지하여 유망 섹터 전환 시점을 포착합니다.",
    color: "bg-cyan-500/10 text-cyan-400",
  },
  {
    icon: Shield,
    title: "리스크 레이더",
    description:
      "포트폴리오 리스크를 실시간 감시하고, 급락 경고, VIX 분석, 시장 과열 신호를 알립니다.",
    color: "bg-orange-500/10 text-orange-400",
  },
  {
    icon: BarChart3,
    title: "AI 적정주가 산출",
    description:
      "PER, PBR, DCF 등 다중 밸류에이션 모델로 적정주가를 산출하고 현재가 대비 괴리율을 분석합니다.",
    color: "bg-indigo-500/10 text-indigo-400",
  },
  {
    icon: Sparkles,
    title: "AI 종목 비교",
    description:
      "두 종목을 입력하면 AI가 재무, 기술적 지표, 성장성, 리스크를 종합 비교 분석합니다.",
    color: "bg-fuchsia-500/10 text-fuchsia-400",
  },
]

const MARKET_FEATURES = [
  {
    icon: TrendingUp,
    title: "실적 서프라이즈",
    description: "컨센서스 대비 어닝 서프라이즈를 추적하고 실적 발표 전 AI 프리뷰를 제공합니다.",
  },
  {
    icon: Clock,
    title: "배당 지속가능성 분석",
    description: "AI가 배당 이력, 배당성향, FCF를 분석하여 배당 지속가능성 등급을 판정합니다.",
  },
  {
    icon: Bell,
    title: "실시간 알림",
    description: "내부자 거래, 급등락, 실적 발표 등 맞춤 알림을 실시간으로 받아보세요.",
  },
  {
    icon: Globe,
    title: "한국 + 미국 시장",
    description: "KOSPI/KOSDAQ은 물론 나스닥, NYSE까지 동일한 AI 분석을 제공합니다.",
  },
  {
    icon: Zap,
    title: "AI 어시스턴트",
    description: "자연어로 종목을 검색하고, 시장 상황을 물으면 AI가 즉시 답변합니다.",
  },
  {
    icon: BarChart3,
    title: "스크리너 & 랭킹",
    description: "AI 자연어 스크리너와 다차원 랭킹 시스템으로 유망 종목을 빠르게 발굴합니다.",
  },
]

/* ───── 3D Perspective Grid (Hero) ───── */
function PerspectiveGrid() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{
          width: "200%",
          height: "60%",
          perspective: "800px",
          perspectiveOrigin: "50% 0%",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            transform: "rotateX(65deg)",
            backgroundImage:
              "linear-gradient(rgba(245,158,11,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.06) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            maskImage: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 70%)",
            WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 70%)",
          }}
        />
      </div>
    </div>
  )
}

/* ───── Floating Candlestick Chart SVG ───── */
function FloatingCandlesticks() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.07]">
      <svg
        className="absolute -right-20 top-[15%] h-[400px] w-[300px] animate-[float_12s_ease-in-out_infinite]"
        viewBox="0 0 300 400"
        fill="none"
      >
        {/* Candlesticks */}
        {[
          { x: 30, o: 280, c: 180, h: 150, l: 310, bull: true },
          { x: 70, o: 220, c: 260, h: 200, l: 290, bull: false },
          { x: 110, o: 260, c: 150, h: 120, l: 300, bull: true },
          { x: 150, o: 180, c: 220, h: 160, l: 250, bull: false },
          { x: 190, o: 240, c: 130, h: 100, l: 270, bull: true },
          { x: 230, o: 160, c: 200, h: 130, l: 230, bull: false },
          { x: 270, o: 210, c: 110, h: 80, l: 250, bull: true },
        ].map((c) => (
          <g key={c.x}>
            <line x1={c.x} y1={c.h} x2={c.x} y2={c.l} stroke={c.bull ? "#f59e0b" : "#3b82f6"} strokeWidth="1.5" />
            <rect
              x={c.x - 12}
              y={Math.min(c.o, c.c)}
              width="24"
              height={Math.abs(c.o - c.c)}
              fill={c.bull ? "#f59e0b" : "#3b82f6"}
              rx="2"
            />
          </g>
        ))}
      </svg>

      <svg
        className="absolute -left-16 bottom-[20%] h-[350px] w-[260px] animate-[float_15s_ease-in-out_2s_infinite]"
        viewBox="0 0 260 350"
        fill="none"
      >
        {[
          { x: 20, o: 250, c: 170, h: 140, l: 280, bull: true },
          { x: 55, o: 190, c: 230, h: 170, l: 260, bull: false },
          { x: 90, o: 230, c: 140, h: 110, l: 260, bull: true },
          { x: 125, o: 170, c: 210, h: 150, l: 240, bull: false },
          { x: 160, o: 220, c: 120, h: 90, l: 250, bull: true },
          { x: 195, o: 150, c: 190, h: 120, l: 220, bull: false },
          { x: 230, o: 200, c: 100, h: 70, l: 230, bull: true },
        ].map((c) => (
          <g key={c.x}>
            <line x1={c.x} y1={c.h} x2={c.x} y2={c.l} stroke={c.bull ? "#f59e0b" : "#3b82f6"} strokeWidth="1.5" />
            <rect
              x={c.x - 10}
              y={Math.min(c.o, c.c)}
              width="20"
              height={Math.abs(c.o - c.c)}
              fill={c.bull ? "#f59e0b" : "#3b82f6"}
              rx="2"
            />
          </g>
        ))}
      </svg>
    </div>
  )
}

/* ───── Neural Network Nodes ───── */
function NeuralNetwork() {
  const nodes = [
    { cx: 80, cy: 100 }, { cx: 200, cy: 60 }, { cx: 320, cy: 110 },
    { cx: 140, cy: 200 }, { cx: 260, cy: 180 }, { cx: 380, cy: 200 },
    { cx: 100, cy: 310 }, { cx: 220, cy: 290 }, { cx: 340, cy: 320 },
    { cx: 460, cy: 140 }, { cx: 440, cy: 280 },
  ]
  const edges = [
    [0, 1], [0, 3], [1, 2], [1, 4], [2, 4], [2, 5],
    [3, 6], [3, 7], [4, 7], [4, 8], [5, 8], [5, 10],
    [6, 7], [7, 8], [2, 9], [9, 10], [8, 10],
  ]

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.05]">
      <svg
        className="absolute left-[5%] top-[10%] h-[400px] w-[500px] animate-[float_20s_ease-in-out_infinite]"
        viewBox="0 0 500 400"
        fill="none"
      >
        {edges.map(([a, b]) => (
          <line
            key={`${a}-${b}`}
            x1={nodes[a].cx} y1={nodes[a].cy}
            x2={nodes[b].cx} y2={nodes[b].cy}
            stroke="#f59e0b"
            strokeWidth="1"
          />
        ))}
        {nodes.map((n, i) => (
          <circle
            key={i}
            cx={n.cx} cy={n.cy} r="6"
            fill="#0f172a"
            stroke="#f59e0b"
            strokeWidth="1.5"
          />
        ))}
        {/* Pulsing center node */}
        <circle cx={260} cy={180} r="10" fill="#f59e0b" opacity="0.3">
          <animate attributeName="r" values="8;14;8" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.1;0.3" dur="3s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  )
}

/* ───── Floating Price Ticker Line ───── */
function FloatingPriceLine() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.06]">
      <svg
        className="absolute right-[5%] top-[30%] h-[200px] w-[600px] animate-[float_18s_ease-in-out_3s_infinite]"
        viewBox="0 0 600 200"
        fill="none"
      >
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0" />
            <stop offset="20%" stopColor="#f59e0b" stopOpacity="1" />
            <stop offset="80%" stopColor="#3b82f6" stopOpacity="1" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0 140 Q50 130 80 120 T160 90 T240 100 T320 60 T400 80 T480 40 T560 50 L600 45"
          stroke="url(#lineGrad)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M0 140 Q50 130 80 120 T160 90 T240 100 T320 60 T400 80 T480 40 T560 50 L600 45 L600 200 L0 200 Z"
          fill="url(#areaGrad)"
        />
        {/* Data points */}
        {[
          [80, 120], [160, 90], [240, 100], [320, 60], [400, 80], [480, 40], [560, 50],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="#f59e0b" opacity="0.5" />
        ))}
      </svg>
    </div>
  )
}

/* ───── Section Divider with subtle chart ───── */
function SectionDivider() {
  return (
    <div className="pointer-events-none relative h-px w-full">
      <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-4xl bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
    </div>
  )
}

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Global CSS for float animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-15px) rotate(0.5deg); }
          66% { transform: translateY(8px) rotate(-0.3deg); }
        }
      `}</style>

      {/* ───── Navigation ───── */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#0f172a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-lg font-bold">
              <span className="text-slate-400">&gt;koscom</span>{" "}
              <span className="text-white">Invest</span>
              <span className="text-amber-400">Hub</span>
            </span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-slate-400 transition-colors hover:text-white">
              주요 기능
            </a>
            <a href="#markets" className="text-sm text-slate-400 transition-colors hover:text-white">
              시장 분석
            </a>
            <a href="#pricing" className="text-sm text-slate-400 transition-colors hover:text-white">
              서비스 안내
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
            >
              로그인
            </Link>
            <Link
              href="/"
              className="rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:shadow-amber-500/30 hover:brightness-110"
            >
              시작하기
            </Link>
          </div>
        </div>
      </nav>

      {/* ───── Hero Section ───── */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-20">
        {/* Background Effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-amber-500/5 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-[120px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#0f172a_70%)]" />
        </div>

        {/* 3D Perspective Grid Floor */}
        <PerspectiveGrid />

        {/* Floating Candlestick Charts */}
        <FloatingCandlesticks />

        {/* Neural Network Background */}
        <NeuralNetwork />

        {/* Floating Price Line */}
        <FloatingPriceLine />

        <div
          className={`relative mx-auto max-w-5xl text-center transition-all duration-1000 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-1.5 text-sm text-amber-400">
            <Sparkles className="h-4 w-4" />
            AI 기반 투자정보 플랫폼
          </div>

          <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
              투자의 모든 순간,
            </span>
            <br />
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
              AI가 함께합니다
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400 sm:text-xl">
            실시간 AI 종목 분석, 매매 타이밍 코칭, 내부자 거래 추적,
            <br className="hidden sm:block" />
            뉴스 임팩트 분석까지. 데이터가 말하는 투자 인사이트를 경험하세요.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/"
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-amber-500/20 transition-all hover:shadow-2xl hover:shadow-amber-500/30 hover:brightness-110"
            >
              무료로 시작하기
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#features"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-base font-medium text-slate-300 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
            >
              기능 살펴보기
            </a>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: 2800, suffix: "+", label: "분석 종목 수" },
              { value: 15, suffix: "개", label: "AI 분석 기능" },
              { value: 24, suffix: "/7", label: "실시간 모니터링" },
              { value: 2, suffix: "개국", label: "글로벌 시장" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-3xl font-bold text-white md:text-4xl">
                  {isVisible && <AnimatedNumber target={stat.value} suffix={stat.suffix} />}
                </div>
                <div className="mt-1 text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <a
          href="#features"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-slate-600"
        >
          <ChevronDown className="h-6 w-6" />
        </a>
      </section>

      <SectionDivider />

      {/* ───── Core AI Features ───── */}
      <section id="features" className="relative px-6 py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-[600px] w-[600px] rounded-full bg-amber-500/3 blur-[150px]" />
        </div>

        {/* Subtle neural dots background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.03]">
          <svg className="absolute left-0 top-0 h-full w-full" viewBox="0 0 1200 800" fill="none">
            {Array.from({ length: 40 }).map((_, i) => (
              <circle
                key={i}
                cx={((i * 137) % 1200)}
                cy={((i * 97) % 800)}
                r="2"
                fill="#f59e0b"
              />
            ))}
          </svg>
        </div>

        <div className="relative mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <div className="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-400">
              Core AI Features
            </div>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              AI가 제공하는 투자 인사이트
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              수십 가지 지표와 데이터를 AI가 종합 분석하여, 전문 애널리스트 수준의
              인사이트를 실시간으로 제공합니다.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CORE_FEATURES.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ───── Market Coverage ───── */}
      <section id="markets" className="relative px-6 py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-blue-500/3 blur-[150px]" />
        </div>

        {/* Globe wireframe hint */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.03]">
          <svg
            className="absolute right-[10%] top-[5%] h-[350px] w-[350px]"
            viewBox="0 0 350 350"
            fill="none"
          >
            <circle cx="175" cy="175" r="140" stroke="#3b82f6" strokeWidth="0.8" />
            <ellipse cx="175" cy="175" rx="90" ry="140" stroke="#3b82f6" strokeWidth="0.6" />
            <ellipse cx="175" cy="175" rx="45" ry="140" stroke="#3b82f6" strokeWidth="0.4" />
            <line x1="35" y1="120" x2="315" y2="120" stroke="#3b82f6" strokeWidth="0.4" />
            <line x1="35" y1="175" x2="315" y2="175" stroke="#3b82f6" strokeWidth="0.6" />
            <line x1="35" y1="230" x2="315" y2="230" stroke="#3b82f6" strokeWidth="0.4" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <div className="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-400">
              Market Coverage
            </div>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              한국과 미국, 하나의 플랫폼에서
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              KOSPI, KOSDAQ부터 나스닥, NYSE까지 동일한 AI 분석 엔진으로
              글로벌 투자를 지원합니다.
            </p>
          </div>

          {/* Two market cards */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-red-500/10 bg-gradient-to-br from-red-500/5 to-transparent p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
                  <span className="text-2xl">🇰🇷</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">국내 주식</h3>
                  <p className="text-sm text-slate-400">KOSPI &middot; KOSDAQ</p>
                </div>
              </div>
              <ul className="space-y-3 text-sm text-slate-300">
                {[
                  "DART 공시 기반 내부자 거래 실시간 추적",
                  "네이버 + 구글 뉴스 AI 감성 분석",
                  "투자자별 매매 동향 (외국인/기관/개인)",
                  "공매도 데이터 분석 및 알림",
                  "컨센서스 대비 실적 서프라이즈 추적",
                  "테마/업종별 로테이션 시그널",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 text-red-400">&#x2713;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-blue-500/10 bg-gradient-to-br from-blue-500/5 to-transparent p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                  <span className="text-2xl">🇺🇸</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">해외 주식</h3>
                  <p className="text-sm text-slate-400">NASDAQ &middot; NYSE</p>
                </div>
              </div>
              <ul className="space-y-3 text-sm text-slate-300">
                {[
                  "Finnhub 실시간 시세 및 재무 데이터",
                  "SEC Filing 기반 내부자 거래 모니터링",
                  "어닝 캘린더 및 AI 실적 프리뷰",
                  "섹터 ETF 기반 로테이션 분석",
                  "배당 지속가능성 AI 등급 판정",
                  "유사 종목 DNA 매칭 분석",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 text-blue-400">&#x2713;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ───── Additional Features Grid ───── */}
      <section className="relative px-6 py-24">
        <div className="relative mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <div className="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-400">
              More Features
            </div>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              투자에 필요한 모든 것
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {MARKET_FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-colors hover:border-white/10"
              >
                <div className="rounded-lg bg-white/5 p-2.5">
                  <feature.icon className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="mb-1 text-base font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ───── How It Works ───── */}
      <section className="relative px-6 py-24">
        {/* Subtle bar chart background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.025]">
          <svg className="absolute left-[8%] bottom-[10%] h-[200px] w-[300px]" viewBox="0 0 300 200" fill="none">
            {[30, 70, 110, 150, 190, 230, 270].map((x, i) => {
              const h = [80, 120, 60, 140, 100, 160, 90][i]
              return (
                <rect key={x} x={x - 12} y={200 - h} width="24" height={h} fill="#f59e0b" rx="3" />
              )
            })}
            <line x1="0" y1="199" x2="300" y2="199" stroke="#f59e0b" strokeWidth="1" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <div className="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-400">
              How It Works
            </div>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              3단계로 시작하는 AI 투자
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "종목 검색",
                desc: "관심 종목을 검색하거나 AI 스크리너로 유망 종목을 발굴하세요.",
                color: "from-amber-500 to-amber-600",
              },
              {
                step: "02",
                title: "AI 분석 확인",
                desc: "AI 스코어, 적정주가, 매매 시그널 등 종합 분석을 한눈에 확인하세요.",
                color: "from-emerald-500 to-emerald-600",
              },
              {
                step: "03",
                title: "투자 의사결정",
                desc: "AI 코칭과 리스크 분석을 참고하여 최적의 투자 타이밍을 잡으세요.",
                color: "from-blue-500 to-blue-600",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div
                  className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-2xl font-bold text-white shadow-lg`}
                >
                  {item.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Service Info / Pricing placeholder ───── */}
      <section id="pricing" className="relative px-6 py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/3 blur-[200px]" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-400">
            Get Started
          </div>
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
            지금 바로 경험해보세요
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            회원가입만 하면 모든 AI 분석 기능을 바로 이용할 수 있습니다.
            <br />
            데이터가 말하는 투자, 지금 시작하세요.
          </p>

          <div className="mx-auto mt-10 max-w-md rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent p-8">
            <div className="mb-1 text-sm font-medium text-amber-400">Full Access</div>
            <div className="mb-6 font-display text-4xl font-extrabold text-white">
              무료
            </div>
            <ul className="mb-8 space-y-3 text-left text-sm text-slate-300">
              {[
                "AI 종합 스코어 & 적정주가 분석",
                "매매 타이밍 코칭 & 리스크 레이더",
                "내부자 거래 실시간 모니터링",
                "뉴스 임팩트 & 감성 분석",
                "한국 + 미국 시장 전체 지원",
                "AI 어시스턴트 자연어 분석",
                "맞춤 관심종목 & 알림 시스템",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/10 text-xs text-amber-400">
                    &#x2713;
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/"
              className="block rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-center text-base font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:shadow-xl hover:shadow-amber-500/30 hover:brightness-110"
            >
              무료로 시작하기
            </Link>
          </div>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="border-t border-white/5 px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600">
                <TrendingUp className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-display text-sm font-bold">
                <span className="text-slate-500">&gt;koscom</span>{" "}
                <span className="text-slate-300">Invest</span>
                <span className="text-amber-400">Hub</span>
              </span>
            </div>

            <p className="max-w-lg text-center text-xs leading-relaxed text-slate-600 md:text-left">
              본 서비스는 투자 참고용 정보를 제공하며, 투자 판단의 최종 책임은 이용자 본인에게
              있습니다. AI 분석 결과는 시장 상황에 따라 달라질 수 있으며, 과거 데이터 기반
              분석이 미래 수익을 보장하지 않습니다.
            </p>

            <div className="text-xs text-slate-600">
              &copy; {new Date().getFullYear()} Koscom Corp. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
