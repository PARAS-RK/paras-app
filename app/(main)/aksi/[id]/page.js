import { Suspense } from 'react';
import AksiDetail from '../../../../components/AksiDetail';

async function AksiDetailWrapper({ params }) {
  // Pastikan params di-await dengan aman
  const resolvedParams = await params;
  const id = resolvedParams?.id;

  return <AksiDetail id={id} />;
}

export default function Page({ params }) {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Memuat detail aksi...</div>}>
      <AksiDetailWrapper params={params} />
    </Suspense>
  );
}