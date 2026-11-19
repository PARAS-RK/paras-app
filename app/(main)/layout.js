import Navbar from '../../components/Navbar';
import FloatingLaporButton from '../../components/FloatingLaporButton';
import { ReportProvider } from '../../context/ReportContext';
import { WilayahProvider } from '@/context/info/WilayahProvider';
import { BmkgProvider } from '@/context/info/BmkgProvider';

export default function MainLayout({ children }) {
  return (
    <ReportProvider>
      <WilayahProvider>
        <BmkgProvider>
          <Navbar />
          <main className="pb-20 md:pb-0">{children}</main>
          <FloatingLaporButton />
        </BmkgProvider>
      </WilayahProvider>
    </ReportProvider>
  );
}
