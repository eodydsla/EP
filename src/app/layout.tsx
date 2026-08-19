import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// 굵기는 실제로 쓰는 것만 — 한글 폰트는 굵기 하나당 서브셋 파일이 30개 넘게 생기므로
// 안 쓰는 900을 빼는 것만으로 폰트 트래픽이 4분의 1 줄어든다.
// (font-semibold 600은 500·700 사이에서 브라우저가 알아서 고른다)
const notoSansKr = Noto_Sans_KR({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "환경계획(EP) 통합 모니터링 대시보드",
  description: "계획이행·환경상태·환경체감을 한 곳에서 확인하는 환경계획(EP) 모니터링 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKr.variable} antialiased`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
