import { Suspense } from 'react';
import AksiDetail from '../AksiDetail';

async function AksiDetailWrapper({ params }) {
  const { id } = await params;
  return <AksiDetail id={id} />;
}

export default function Page({ params }) {
  return (
    <Suspense fallback={null}>
      <AksiDetailWrapper params={params} />
    </Suspense>
  );
}
