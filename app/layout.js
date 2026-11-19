import { Noto_Sans } from 'next/font/google';
import './globals.css';

const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-noto-sans',
});

export const metadata = {
  title: 'PARAS',
  description: 'Platform komunitas Perempuan dan aksi Iklim',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={notoSans.className}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
