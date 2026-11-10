import Image from 'next/image';
import Link from 'next/link';
import logo from '../../public/logo_paras_1.png';

export default function LandingNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center px-5 lg:px-8">
        <Link href="/#beranda" className="shrink-0" aria-label="PARAS">
          <Image src={logo} alt="PARAS" priority style={{ width: 'auto' }} className="h-9 object-contain lg:h-10" />
        </Link>
      </div>
    </header>
  );
}
