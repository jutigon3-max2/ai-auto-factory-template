import "./globals.css";

export const metadata = {
  title: "AI Auto Factory",
  description: "복붙으로 완성하는 나만의 무인 자동화 공장",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}