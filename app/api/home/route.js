import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. User dari auth.users (sesi cookie)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Profil + wilayah (join lewat profiles.region_id -> regions.region_id)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(
        `
        full_name,
        rt,
        rw,
        regions (
          province,
          city,
          district,
          subdistrict
        )
      `,
      )
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('GET /api/home profile error:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // 3. Nama: prioritas auth.users, fallback profiles.full_name
    const displayName = user.user_metadata?.full_name || user.user_metadata?.name || profile?.full_name || user.email?.split('@')[0] || 'Warga PARAS';

    // 4. Alamat kelurahan dari tabel regions
    const region = profile?.regions ?? null;
    const areaFull = region ? `${profile.rt && profile.rw ? `RT ${profile.rt}/RW ${profile.rw}, ` : ''}Kel. ${region.subdistrict}, ${region.city}` : null;

    return NextResponse.json({
      displayName,
      areaFull,
      region,
      rt: profile?.rt ?? null,
      rw: profile?.rw ?? null,
    });
  } catch (err) {
    console.error('GET /api/home error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
