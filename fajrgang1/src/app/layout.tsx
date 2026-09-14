import type { Metadata } from "next";
import { Noto_Kufi_Arabic } from "next/font/google";
import "./globals.css";

const notoArabic = Noto_Kufi_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "فجر جماعة - تتبع الفجر والأذكار والحفظ",
  description: "منصة لتتبع صلاة الفجر وأذكار الصباح والمساء وحفظ القرآن",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`${notoArabic.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
