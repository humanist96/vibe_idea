import type { Metadata } from "next"

export const metadata: Metadata = {
  title: ">koscom InvestHub - AI 투자정보서비스",
  description:
    "AI가 분석하는 한국/미국 주식 투자 플랫폼. 실시간 AI 종목 분석, 매매 타이밍 코칭, 내부자 거래 추적, 뉴스 임팩트 분석까지.",
}

export default function LandingLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  return (
    <>
      {/* Hide app shell (sidebar, header, bottom tab) on landing page */}
      <style>{`
        [data-sidebar], nav[class*="bottom-tab"], .lg\\:pl-64 > header,
        aside, #sidebar { display: none !important; }
        .lg\\:pl-64 { padding-left: 0 !important; }
        main { padding: 0 !important; max-width: 100% !important; }
        body { background: #0f172a !important; }
      `}</style>
      {children}
    </>
  )
}
