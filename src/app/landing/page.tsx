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

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
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
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

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

      {/* ───── Core AI Features ───── */}
      <section id="features" className="relative px-6 py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-[600px] w-[600px] rounded-full bg-amber-500/3 blur-[150px]" />
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

      {/* ───── Market Coverage ───── */}
      <section id="markets" className="relative px-6 py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-blue-500/3 blur-[150px]" />
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

      {/* ───── How It Works ───── */}
      <section className="relative px-6 py-24">
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
