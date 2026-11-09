import Navbar from '@/components/Navbar';
import FloatingLaporButton from '@/components/FloatingLaporButton';
import { ReportProvider } from '@/context/ReportContext';

export default function MainLayout({ children }) {
  return (
    <ReportProvider>
      <Navbar />
      <main className="flex-1">{children}</main>
      <FloatingLaporButton />
    </ReportProvider>
  );
}
