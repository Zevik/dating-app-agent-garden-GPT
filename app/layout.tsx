import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ג׳ארדן דייטינג',
  description: 'אפליקציית היכרות מבוססת שיחה עם סוכנים חכמים'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="bg-[#F9F4F6] text-[#111111] font-sans min-h-screen">
        {children}
      </body>
    </html>
  );
}
