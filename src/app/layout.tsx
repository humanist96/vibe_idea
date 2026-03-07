import type { Metadata } from "next"
import Script from "next/script"
import { Geist, Geist_Mono } from "next/font/google"
import { Urbanist } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/layout/Sidebar"
import { BottomTabBar } from "@/components/layout/BottomTabBar"
import { Header } from "@/components/layout/Header"
import { ToastContainer } from "@/components/ui/ToastContainer"
import { InsiderPollingProvider } from "@/components/layout/InsiderPollingProvider"
import { AuthProvider } from "@/components/providers/AuthProvider"
import { SyncProvider } from "@/components/providers/SyncProvider"

const GA_ID = "G-9WC7DWSWQY"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: ">koscom InvestHub - AI 투자정보서비스",
  description: "코스콤이 만든 AI 기반 한국 주식(KOSPI/KOSDAQ) 투자정보 서비스",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${urbanist.variable} antialiased`}
      >
        <AuthProvider>
          <SyncProvider>
            <ToastContainer />
            <InsiderPollingProvider />
            <Sidebar />
            <BottomTabBar />
            <div className="lg:pl-64">
              <Header />
              <main className="p-4 pb-20 lg:p-6 lg:pb-6">{children}</main>
            </div>
          </SyncProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
