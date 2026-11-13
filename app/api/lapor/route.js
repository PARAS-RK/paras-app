// import { NextResponse } from 'next/server';
// import { supabaseAdmin } from '@/lib/supabase-server';

// const MAX_SIZE = 10 * 1024 * 1024; // 10MB
// const ALLOWED = ['image/jpeg', 'image/png', 'application/pdf'];

// export async function POST(request) {
//   try {
//     const formData = await request.formData();
//     const details = String(formData.get('details') ?? '').trim();
//     const location = String(formData.get('location') ?? '').trim();
//     const file = formData.get('file');

//     // Validasi ulang di server (jangan percaya validasi client)
//     if (location.length < 5) return NextResponse.json({ error: 'Detail lokasi minimal 5 karakter' }, { status: 400 });
//     if (details.length < 20) return NextResponse.json({ error: 'Uraian minimal 20 karakter' }, { status: 400 });
//     if (!file || typeof file === 'string') return NextResponse.json({ error: 'Bukti wajib dilampirkan' }, { status: 400 });
//     if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: 'Format file tidak didukung' }, { status: 400 });
//     if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Ukuran file maksimal 10MB' }, { status: 400 });

//     // Upload file ke Storage
//     const ext = file.name.split('.').pop();
//     const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
//     const buffer = Buffer.from(await file.arrayBuffer());

//     const { error: uploadError } = await supabaseAdmin.storage.from('bukti-laporan').upload(path, buffer, { contentType: file.type });
//     if (uploadError) throw uploadError;

//     // Insert ke tabel
//     const { data, error } = await supabaseAdmin
//       .from('reports')
//       .insert({
//         reporter_name: 'Ibu Sari Wulandari', // ganti dengan data user login
//         area: 'Kel. Kebayoran Baru, Jakarta Selatan',
//         location_detail: location,
//         details,
//         file_url: path,
//         file_name: file.name,
//       })
//       .select('id')
//       .single();
//     if (error) throw error;

//     const reportNumber = `LP-${new Date().getFullYear()}-${String(data.id).padStart(3, '0')}`;
//     await supabaseAdmin.from('reports').update({ report_number: reportNumber }).eq('id', data.id);

//     return NextResponse.json({ reportNumber }, { status: 201 });
//   } catch (err) {
//     console.error(err);
//     return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
//   }
// }
