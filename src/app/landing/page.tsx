"use client"

import Link from "next/link"
import { useEffect, useState, useRef } from "react"
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
  Check,
  Play,
} from "lucide-react"

/* ═══════════════════════════════════════════════
   Utility Components
   ═══════════════════════════════════════════════ */

function AnimatedNumber({ target, suffix = "" }: { readonly target: number; readonly suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
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
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}

function RevealSection({ children, className = "", delay = 0 }: {
  readonly children: React.ReactNode
  readonly className?: string
  readonly delay?: number
}) {
  const { ref, visible } = useScrollReveal()
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   3D Background Elements
   ═══════════════════════════════════════════════ */

function PerspectiveGrid() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{ width: "200%", height: "55%", perspective: "1000px", perspectiveOrigin: "50% 0%" }}
      >
        <div
          style={{
            width: "100%", height: "100%",
            transform: "rotateX(68deg)",
            backgroundImage:
              "linear-gradient(rgba(245,158,11,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.04) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            maskImage: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)",
            WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)",
          }}
        />
      </div>
    </div>
  )
}

function FloatingChart({ className, delay = 0 }: { readonly className: string; readonly delay?: number }) {
  const points = "0,80 30,65 60,70 90,45 120,55 150,30 180,35 210,15 240,25 270,10"
  return (
    <svg
      className={`animate-[float_20s_ease-in-out_infinite] ${className}`}
      style={{ animationDelay: `${delay}s` }}
      viewBox="0 0 270 100" fill="none"
    >
      <defs>
        <linearGradient id={`areaFill${delay}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${points} 270,100 0,100`} fill={`url(#areaFill${delay})`} />
      <polyline points={points} stroke="#f59e0b" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {[[90, 45], [150, 30], [210, 15]].map(([x, y]) => (
        <circle key={`${x}${delay}`} cx={x} cy={y} r="2.5" fill="#f59e0b" opacity="0.6" />
      ))}
    </svg>
  )
}

function NeuralMesh() {
  const nodes = [
    [60, 40], [160, 25], [260, 50], [360, 30],
    [110, 120], [210, 100], [310, 115],
    [60, 200], [160, 185], [260, 210], [360, 190],
  ]
  const edges = [[0,1],[1,2],[2,3],[0,4],[1,4],[1,5],[2,5],[2,6],[3,6],[4,7],[4,8],[5,8],[5,9],[6,9],[6,10],[7,8],[8,9],[9,10]]

  return (
    <svg className="absolute right-[2%] top-[8%] h-[260px] w-[420px] opacity-[0.035] animate-[float_25s_ease-in-out_infinite]" viewBox="0 0 420 250" fill="none">
      {edges.map(([a, b]) => (
        <line key={`${a}-${b}`} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke="#f59e0b" strokeWidth="0.8" />
      ))}
      {nodes.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" />
          <circle cx={x} cy={y} r="1.5" fill="#f59e0b" opacity="0.5" />
        </g>
      ))}
      <circle cx={210} cy={100} r="8" fill="#f59e0b" opacity="0.08">
        <animate attributeName="r" values="6;12;6" dur="4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.08;0.02;0.08" dur="4s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}

function CandlestickSilhouette({ className }: { readonly className: string }) {
  const candles = [
    { x: 20, h: 25, l: 75, o: 35, c: 60, bull: true },
    { x: 48, h: 30, l: 80, o: 65, c: 40, bull: false },
    { x: 76, h: 15, l: 70, o: 25, c: 55, bull: true },
    { x: 104, h: 20, l: 65, o: 50, c: 30, bull: false },
    { x: 132, h: 10, l: 60, o: 20, c: 48, bull: true },
  ]
  return (
    <svg className={className} viewBox="0 0 160 90" fill="none">
      {candles.map((c) => (
        <g key={c.x}>
          <line x1={c.x} y1={c.h} x2={c.x} y2={c.l} stroke={c.bull ? "#f59e0b" : "#60a5fa"} strokeWidth="1" opacity="0.5" />
          <rect x={c.x - 8} y={Math.min(c.o, c.c)} width="16" height={Math.abs(c.o - c.c)} fill={c.bull ? "#f59e0b" : "#60a5fa"} rx="1.5" opacity="0.4" />
        </g>
      ))}
    </svg>
  )
}

/* ═══════════════════════════════════════════════
   Feature Data
   ═══════════════════════════════════════════════ */

const FEATURES = [
  { icon: Brain, title: "AI 종합 스코어", desc: "기술적 분석, 재무 지표, 뉴스 감성, 리스크를 종합하여 1~10점 AI 투자 스코어를 실시간 산출합니다.", accent: "amber" },
  { icon: Target, title: "매매 타이밍 코치", desc: "최적 매수/매도 타이밍, 지지선/저항선, 손절가를 분석하고 분할매수 전략까지 AI가 코칭합니다.", accent: "emerald" },
  { icon: Newspaper, title: "뉴스 임팩트 분석", desc: "수백 건의 뉴스를 AI가 실시간 분석하여 종목별 영향도와 긍정/부정 시그널을 즉시 파악합니다.", accent: "blue" },
  { icon: Users, title: "내부자 거래 추적", desc: "임원/대주주의 매수·매도 패턴을 실시간 모니터링하고 AI가 심리 분석 리포트를 제공합니다.", accent: "violet" },
  { icon: LineChart, title: "모멘텀 브레이크아웃", desc: "거래량 급등, 기술적 돌파 시그널을 포착하여 상승 전환 가능성이 높은 종목을 선별합니다.", accent: "rose" },
  { icon: PieChart, title: "섹터 로테이션", desc: "업종별 자금 흐름과 섹터 모멘텀 변화를 감지하여 유망 섹터 전환 시점을 포착합니다.", accent: "cyan" },
  { icon: Shield, title: "리스크 레이더", desc: "포트폴리오 리스크를 실시간 감시하고, 급락 경고, VIX 분석, 시장 과열 신호를 알립니다.", accent: "orange" },
  { icon: BarChart3, title: "AI 적정주가", desc: "PER, PBR, DCF 등 다중 밸류에이션 모델로 적정주가를 산출하고 괴리율을 분석합니다.", accent: "indigo" },
  { icon: Sparkles, title: "AI 종목 비교", desc: "두 종목을 입력하면 AI가 재무, 기술적 지표, 성장성, 리스크를 종합 비교 분석합니다.", accent: "fuchsia" },
] as const

const ACCENT_STYLES: Record<string, { bg: string; text: string; glow: string }> = {
  amber: { bg: "bg-amber-500/8", text: "text-amber-400", glow: "group-hover:shadow-amber-500/10" },
  emerald: { bg: "bg-emerald-500/8", text: "text-emerald-400", glow: "group-hover:shadow-emerald-500/10" },
  blue: { bg: "bg-blue-500/8", text: "text-blue-400", glow: "group-hover:shadow-blue-500/10" },
  violet: { bg: "bg-violet-500/8", text: "text-violet-400", glow: "group-hover:shadow-violet-500/10" },
  rose: { bg: "bg-rose-500/8", text: "text-rose-400", glow: "group-hover:shadow-rose-500/10" },
  cyan: { bg: "bg-cyan-500/8", text: "text-cyan-400", glow: "group-hover:shadow-cyan-500/10" },
  orange: { bg: "bg-orange-500/8", text: "text-orange-400", glow: "group-hover:shadow-orange-500/10" },
  indigo: { bg: "bg-indigo-500/8", text: "text-indigo-400", glow: "group-hover:shadow-indigo-500/10" },
  fuchsia: { bg: "bg-fuchsia-500/8", text: "text-fuchsia-400", glow: "group-hover:shadow-fuchsia-500/10" },
}

const EXTRA_FEATURES = [
  { icon: TrendingUp, title: "실적 서프라이즈", desc: "컨센서스 대비 어닝 서프라이즈를 추적하고 실적 발표 전 AI 프리뷰를 제공합니다." },
  { icon: Clock, title: "배당 지속가능성", desc: "AI가 배당 이력, 배당성향, FCF를 분석하여 배당 지속가능성 등급을 판정합니다." },
  { icon: Bell, title: "실시간 알림", desc: "내부자 거래, 급등락, 실적 발표 등 맞춤 알림을 실시간으로 받아보세요." },
  { icon: Globe, title: "글로벌 시장", desc: "KOSPI/KOSDAQ은 물론 나스닥, NYSE까지 동일한 AI 분석을 제공합니다." },
  { icon: Zap, title: "AI 어시스턴트", desc: "자연어로 종목을 검색하고, 시장 상황을 물으면 AI가 즉시 답변합니다." },
  { icon: BarChart3, title: "스크리너 & 랭킹", desc: "AI 자연어 스크리너와 다차원 랭킹 시스템으로 유망 종목을 빠르게 발굴합니다." },
]

/* ═══════════════════════════════════════════════
   Page
   ═══════════════════════════════════════════════ */

export default function LandingPage() {
  const [heroReady, setHeroReady] = useState(false)
  useEffect(() => { setHeroReady(true) }, [])

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white selection:bg-amber-500/20 selection:text-amber-200">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) }
          50% { transform: translateY(-12px) }
        }
        @keyframes glow-line {
          0% { background-position: -200% 0 }
          100% { background-position: 200% 0 }
        }
        .glow-line {
          background: linear-gradient(90deg, transparent, rgba(245,158,11,0.3), transparent);
          background-size: 200% 100%;
          animation: glow-line 4s ease-in-out infinite;
        }
        .noise {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
        }
      `}</style>

      {/* Noise texture overlay */}
      <div className="noise pointer-events-none fixed inset-0 z-[1]" />

      {/* ───── Nav ───── */}
      <nav className="fixed top-0 z-50 w-full">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-16 items-center justify-between rounded-b-2xl border-x border-b border-white/[0.04] bg-[#0a0f1e]/70 px-6 backdrop-blur-2xl">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/15">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-[15px] font-bold tracking-tight">
                <span className="text-slate-500">&gt;koscom</span>{" "}
                <span className="text-white/90">Invest</span>
                <span className="text-amber-400">Hub</span>
              </span>
            </div>
            <div className="hidden items-center gap-8 md:flex">
              {[["#features", "Features"], ["#markets", "Markets"], ["#pricing", "Pricing"]].map(([href, label]) => (
                <a key={href} href={href} className="text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-200">
                  {label}
                </a>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Link href="/login" className="hidden rounded-lg px-4 py-2 text-[13px] font-medium text-slate-400 transition-colors hover:text-white sm:block">
                로그인
              </Link>
              <Link
                href="/"
                className="rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2 text-[13px] font-semibold text-white shadow-md shadow-amber-500/15 transition-all hover:shadow-lg hover:shadow-amber-500/25 hover:brightness-110"
              >
                시작하기
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ───── Hero ───── */}
      <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-6 pt-16">
        {/* Ambient light */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[20%] top-[20%] h-[600px] w-[600px] rounded-full bg-amber-500/[0.03] blur-[150px]" />
          <div className="absolute bottom-[15%] right-[15%] h-[500px] w-[500px] rounded-full bg-blue-500/[0.025] blur-[150px]" />
        </div>

        <PerspectiveGrid />
        <NeuralMesh />

        {/* Floating charts */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.04]">
          <FloatingChart className="absolute -right-8 top-[18%] h-[160px] w-[360px]" delay={0} />
          <FloatingChart className="absolute -left-4 bottom-[25%] h-[130px] w-[300px] scale-x-[-1]" delay={4} />
          <CandlestickSilhouette className="absolute right-[12%] bottom-[30%] h-[120px] w-[200px] animate-[float_18s_ease-in-out_2s_infinite]" />
          <CandlestickSilhouette className="absolute left-[8%] top-[25%] h-[100px] w-[170px] animate-[float_22s_ease-in-out_5s_infinite] scale-x-[-1]" />
        </div>

        <div className={`relative z-10 mx-auto max-w-4xl text-center transition-all duration-1000 ease-out ${heroReady ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"}`}>
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-amber-500/15 bg-amber-500/[0.04] px-5 py-2 text-[13px] font-medium tracking-wide text-amber-400/90 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Investment Platform
          </div>

          <h1 className="font-display text-[clamp(2.25rem,5vw,4.5rem)] font-extrabold leading-[1.1] tracking-tight">
            <span className="bg-gradient-to-b from-white via-white/95 to-white/60 bg-clip-text text-transparent">
              투자의 모든 순간,
            </span>
            <br />
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
              AI가 함께합니다
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-400/90 sm:text-lg">
            실시간 종목 분석, 매매 타이밍 코칭, 내부자 거래 추적,
            뉴스 임팩트 분석까지. 데이터가 말하는 투자 인사이트.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3.5 text-[15px] font-semibold text-white shadow-xl shadow-amber-500/15 transition-all hover:shadow-2xl hover:shadow-amber-500/25"
            >
              <span className="relative z-10 flex items-center gap-2">
                무료로 시작하기
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
            <a
              href="#features"
              className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-7 py-3.5 text-[15px] font-medium text-slate-300 backdrop-blur-sm transition-all hover:border-white/10 hover:bg-white/[0.05]"
            >
              <Play className="h-3.5 w-3.5" />
              기능 살펴보기
            </a>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-20 grid max-w-2xl grid-cols-4 gap-6">
            {[
              { value: 2800, suffix: "+", label: "분석 종목" },
              { value: 15, suffix: "개", label: "AI 기능" },
              { value: 24, suffix: "/7", label: "모니터링" },
              { value: 2, suffix: "개국", label: "글로벌" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-display text-2xl font-bold text-white sm:text-3xl">
                  <AnimatedNumber target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <a href="#features" className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2 text-slate-700 transition-colors hover:text-slate-500">
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </a>
      </section>

      {/* ───── Glowing Divider ───── */}
      <div className="relative h-px"><div className="glow-line absolute inset-x-0 mx-auto h-px max-w-3xl" /></div>

      {/* ───── Core Features ───── */}
      <section id="features" className="relative px-6 py-32">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-amber-500/[0.02] blur-[180px]" />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <RevealSection className="mb-20 text-center">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400/70">
              Core AI Features
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              AI가 제공하는 투자 인사이트
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-slate-500">
              수십 가지 지표를 AI가 종합 분석하여, 전문 애널리스트 수준의
              인사이트를 실시간으로 제공합니다.
            </p>
          </RevealSection>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => {
              const style = ACCENT_STYLES[f.accent]
              return (
                <RevealSection key={f.title} delay={i * 60}>
                  <div className={`group relative h-full rounded-2xl border border-white/[0.04] bg-white/[0.015] p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.03] hover:shadow-xl ${style.glow}`}>
                    {/* Top accent line */}
                    <div className={`absolute inset-x-6 top-0 h-px ${style.bg} opacity-0 transition-opacity group-hover:opacity-100`} />
                    <div className={`mb-4 inline-flex rounded-xl p-3 ${style.bg} ${style.text}`}>
                      <f.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mb-2 text-[15px] font-semibold text-white/90">{f.title}</h3>
                    <p className="text-[13px] leading-relaxed text-slate-500">{f.desc}</p>
                  </div>
                </RevealSection>
              )
            })}
          </div>
        </div>
      </section>

      <div className="relative h-px"><div className="glow-line absolute inset-x-0 mx-auto h-px max-w-3xl" /></div>

      {/* ───── Markets ───── */}
      <section id="markets" className="relative px-6 py-32">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute bottom-0 left-[10%] h-[400px] w-[400px] rounded-full bg-blue-500/[0.015] blur-[180px]" />
          {/* Globe wireframe */}
          <svg className="absolute right-[5%] top-[8%] h-[300px] w-[300px] opacity-[0.025]" viewBox="0 0 300 300" fill="none">
            <circle cx="150" cy="150" r="120" stroke="#60a5fa" strokeWidth="0.7" />
            <ellipse cx="150" cy="150" rx="75" ry="120" stroke="#60a5fa" strokeWidth="0.5" />
            <ellipse cx="150" cy="150" rx="35" ry="120" stroke="#60a5fa" strokeWidth="0.3" />
            <line x1="30" y1="100" x2="270" y2="100" stroke="#60a5fa" strokeWidth="0.3" />
            <line x1="30" y1="150" x2="270" y2="150" stroke="#60a5fa" strokeWidth="0.5" />
            <line x1="30" y1="200" x2="270" y2="200" stroke="#60a5fa" strokeWidth="0.3" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-6xl">
          <RevealSection className="mb-20 text-center">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400/70">
              Global Markets
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              한국과 미국, 하나의 플랫폼
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-slate-500">
              KOSPI, KOSDAQ부터 나스닥, NYSE까지 동일한 AI 분석 엔진으로 글로벌 투자를 지원합니다.
            </p>
          </RevealSection>

          <div className="grid gap-5 md:grid-cols-2">
            {[
              {
                flag: "KR", title: "국내 주식", sub: "KOSPI  ·  KOSDAQ",
                color: "from-red-500/[0.06] to-transparent", border: "border-red-500/[0.08] hover:border-red-500/15",
                check: "text-red-400/80",
                items: ["DART 공시 기반 내부자 거래 실시간 추적", "네이버 + 구글 뉴스 AI 감성 분석", "투자자별 매매 동향 (외국인/기관/개인)", "공매도 데이터 분석 및 알림", "컨센서스 대비 실적 서프라이즈", "테마/업종별 로테이션 시그널"],
              },
              {
                flag: "US", title: "해외 주식", sub: "NASDAQ  ·  NYSE",
                color: "from-blue-500/[0.06] to-transparent", border: "border-blue-500/[0.08] hover:border-blue-500/15",
                check: "text-blue-400/80",
                items: ["Finnhub 실시간 시세 및 재무 데이터", "SEC Filing 기반 내부자 거래 모니터링", "어닝 캘린더 및 AI 실적 프리뷰", "섹터 ETF 기반 로테이션 분석", "배당 지속가능성 AI 등급 판정", "유사 종목 DNA 매칭 분석"],
              },
            ].map((market, mi) => (
              <RevealSection key={market.flag} delay={mi * 100}>
                <div className={`h-full rounded-2xl border bg-gradient-to-br p-8 transition-colors ${market.color} ${market.border}`}>
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.04] text-xl font-bold tracking-wider text-slate-400">
                      {market.flag}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white/90">{market.title}</h3>
                      <p className="text-[12px] text-slate-500">{market.sub}</p>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {market.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-[13px] text-slate-400">
                        <Check className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${market.check}`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      <div className="relative h-px"><div className="glow-line absolute inset-x-0 mx-auto h-px max-w-3xl" /></div>

      {/* ───── More Features ───── */}
      <section className="relative px-6 py-32">
        <div className="relative mx-auto max-w-6xl">
          <RevealSection className="mb-20 text-center">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400/70">
              More Features
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              투자에 필요한 모든 것
            </h2>
          </RevealSection>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EXTRA_FEATURES.map((f, i) => (
              <RevealSection key={f.title} delay={i * 60}>
                <div className="flex h-full items-start gap-4 rounded-2xl border border-white/[0.03] bg-white/[0.01] p-6 transition-colors hover:border-white/[0.06] hover:bg-white/[0.02]">
                  <div className="mt-0.5 rounded-lg bg-amber-500/[0.06] p-2.5">
                    <f.icon className="h-4.5 w-4.5 text-amber-400/80" />
                  </div>
                  <div>
                    <h3 className="mb-1 text-[14px] font-semibold text-white/85">{f.title}</h3>
                    <p className="text-[13px] leading-relaxed text-slate-500">{f.desc}</p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      <div className="relative h-px"><div className="glow-line absolute inset-x-0 mx-auto h-px max-w-3xl" /></div>

      {/* ───── How It Works ───── */}
      <section className="relative px-6 py-32">
        <div className="relative mx-auto max-w-4xl">
          <RevealSection className="mb-20 text-center">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400/70">
              How It Works
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              3단계로 시작하는 AI 투자
            </h2>
          </RevealSection>

          <div className="relative grid gap-12 md:grid-cols-3 md:gap-8">
            {/* Connecting line */}
            <div className="pointer-events-none absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent md:block" />

            {[
              { n: "01", title: "종목 검색", desc: "관심 종목을 검색하거나 AI 스크리너로 유망 종목을 발굴하세요.", c: "from-amber-500/80 to-amber-600/80" },
              { n: "02", title: "AI 분석 확인", desc: "AI 스코어, 적정주가, 매매 시그널 등 종합 분석을 한눈에 확인하세요.", c: "from-emerald-500/80 to-emerald-600/80" },
              { n: "03", title: "투자 의사결정", desc: "AI 코칭과 리스크 분석을 참고하여 최적의 투자 타이밍을 잡으세요.", c: "from-blue-500/80 to-blue-600/80" },
            ].map((s, i) => (
              <RevealSection key={s.n} delay={i * 120} className="text-center">
                <div className={`relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${s.c} font-display text-xl font-bold text-white shadow-lg`}>
                  {s.n}
                </div>
                <h3 className="mb-2 text-[15px] font-semibold text-white/90">{s.title}</h3>
                <p className="text-[13px] leading-relaxed text-slate-500">{s.desc}</p>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      <div className="relative h-px"><div className="glow-line absolute inset-x-0 mx-auto h-px max-w-3xl" /></div>

      {/* ───── CTA / Pricing ───── */}
      <section id="pricing" className="relative px-6 py-32">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/[0.02] blur-[200px]" />
        </div>

        <RevealSection className="relative mx-auto max-w-lg text-center">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400/70">
            Get Started
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            지금 바로 경험해보세요
          </h2>
          <p className="mt-4 text-[15px] text-slate-500">
            회원가입만으로 모든 AI 분석 기능을 이용할 수 있습니다.
          </p>

          <div className="relative mt-12 overflow-hidden rounded-2xl border border-amber-500/10 bg-gradient-to-b from-amber-500/[0.03] to-transparent p-8 backdrop-blur-sm">
            {/* Shimmer */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-30">
              <div className="glow-line absolute inset-x-0 top-0 h-px" />
            </div>

            <p className="text-[12px] font-semibold uppercase tracking-wider text-amber-400/70">Full Access</p>
            <div className="mt-2 font-display text-5xl font-extrabold tracking-tight text-white">무료</div>
            <p className="mt-1 text-[13px] text-slate-600">모든 기능 제한 없이</p>

            <ul className="mt-8 space-y-3 text-left">
              {[
                "AI 종합 스코어 & 적정주가 분석",
                "매매 타이밍 코칭 & 리스크 레이더",
                "내부자 거래 실시간 모니터링",
                "뉴스 임팩트 & 감성 분석",
                "한국 + 미국 시장 전체 지원",
                "AI 어시스턴트 자연어 분석",
                "맞춤 관심종목 & 알림 시스템",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-[13px] text-slate-400">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/8">
                    <Check className="h-3 w-3 text-amber-400/80" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href="/"
              className="mt-8 block rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-center text-[15px] font-semibold text-white shadow-lg shadow-amber-500/15 transition-all hover:shadow-xl hover:shadow-amber-500/25 hover:brightness-110"
            >
              무료로 시작하기
            </Link>
          </div>
        </RevealSection>
      </section>

      {/* ───── Footer ───── */}
      <footer className="border-t border-white/[0.03] px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-amber-400 to-amber-600">
                <TrendingUp className="h-3 w-3 text-white" />
              </div>
              <span className="font-display text-[13px] font-bold">
                <span className="text-slate-600">&gt;koscom</span>{" "}
                <span className="text-slate-400">Invest</span>
                <span className="text-amber-500/70">Hub</span>
              </span>
            </div>

            <p className="max-w-md text-center text-[11px] leading-relaxed text-slate-700 md:text-left">
              본 서비스는 투자 참고용 정보를 제공하며, 투자 판단의 최종 책임은 이용자 본인에게 있습니다.
              AI 분석 결과는 시장 상황에 따라 달라질 수 있으며, 과거 데이터 기반 분석이 미래 수익을 보장하지 않습니다.
            </p>

            <span className="text-[11px] text-slate-700">
              &copy; {new Date().getFullYear()} Koscom Corp.
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
