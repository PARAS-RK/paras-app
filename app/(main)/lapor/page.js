'use client';

import { useState, useRef, useEffect } from 'react';
import { useReportContext } from '@/context/ReportContext';
import Link from 'next/link'; // Mengubah react-router menjadi next/link
import { Send, Paperclip, X, CheckCircle2, FileText, Image as ImageIcon, ArrowRight, MessageCircle, MapPin, Lock } from 'lucide-react'; // Mengubah 'Image' menjadi 'ImageIcon' untuk menghindari konflik
import { cn } from '@/lib/utils';

// Karena ini komponen client, mock data sementara atau ambil dari store/konteks
const displayName = "Ibu Sari Wulandari";
const areaLabel = "Kel. Kebayoran Baru";
const areaFull = "Kel. Kebayoran Baru, Jakarta Selatan";

export default function Lapor() {
    const { addReport } = useReportContext(); // Mengambil fungsi penambahan laporan global
    const [step, setStep] = useState('welcome');
    const [loadingUser, setLoadingUser] = useState(true);
    
    // State profil dinamis dari Supabase
    const [userProfile, setUserProfile] = useState({
        displayName: 'Warga PARAS',
        areaLabel: 'Kelurahan',
        areaFull: 'Kelurahan, Kota',
    });

    const [messages, setMessages] = useState([
        { role: 'bot', text: 'Halo! Selamat datang di PARAS. Saya PARA, asisten digital Anda. 👋\n\nAda yang bisa saya bantu hari ini?' },
    ]);
    const [form, setForm] = useState({ details: '', file: null, location: '' });
    const [errors, setErrors] = useState({});
    const fileRef = useRef(null);

    // Ambil data profil & wilayah pengguna yang sedang login dari Supabase
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const supabase = createClient();
                const { data: { user }, error: authError } = await supabase.auth.getUser();

                if (authError || !user) return;

                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*, regions(*)')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (profileData) {
                    const subdistrict = profileData.regions?.subdistrict || 'Kelurahan';
                    const city = profileData.regions?.city || 'Kota';
                    setUserProfile({
                        displayName: profileData.full_name || user.user_metadata?.full_name || 'Warga PARAS',
                        areaLabel: subdistrict,
                        areaFull: `${subdistrict}, ${city}`,
                    });
                    // Set default lokasi form dari wilayah user
                    setForm((prev) => ({ ...prev, location: `${subdistrict}, ${city}` }));
                }
            } catch (err) {
                console.error('Gagal memuat profil pelapor:', err);
            } finally {
                setLoadingUser(false);
            }
        };

        fetchUserData();
    }, []);

    function addMsg(role, text) {
        setMessages((prev) => [...prev, { role, text }]);
    }

    function handleChoose() {
        addMsg('user', 'Saya ingin membuat laporan');
        setTimeout(() => { 
            addMsg('bot', `Baik! Laporan akan dibuat untuk wilayah Anda, ${userProfile.areaLabel}. Isi formulir di bawah ini, termasuk detail lokasi kejadiannya.`); 
            setStep('form'); 
        }, 400);
    }

    function validate() {
        const e = {};
        if (!form.file) e.file = 'Lampirkan minimal satu bukti foto atau dokumen';
        if (form.location.trim().length < 5) e.location = 'Tuliskan detail lokasi (jalan, RT/RW, atau patokan)';
        if (!form.details.trim() || form.details.length < 20) e.details = 'Uraikan laporan minimal 20 karakter';
        return e;
    }

    function handleSubmit() {
        const e = validate();
        if (Object.keys(e).length) {
            setErrors(e);
            return;
        }

        // Simpan laporan ke ReportContext agar terhitung di halaman Profil
        const newReportItem = {
            id: `#LP-2026-${Math.floor(100 + Math.random() * 900)}`,
            reporter: userProfile.displayName,
            location: `${form.location}, ${userProfile.areaLabel}`,
            details: form.details,
            status: 'pending', // Masuk status "sedang diproses"
            date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        };

        if (addReport) {
            addReport(newReportItem);
        }

        addMsg('user', `Laporan dikirim (📍 ${form.location}, ${userProfile.areaLabel}): "${form.details.slice(0, 60)}..."`);
        setTimeout(() => setStep('submitted'), 600);
    }

    if (loadingUser) {
        return (
            <div className="flex h-[70vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#159038]" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] lg:h-[calc(100vh-72px)] max-w-2xl mx-auto w-full bg-gray-50/50">
            {/* Bot header */}
            <div className="bg-white px-4 py-3 border-b border-border flex items-center gap-3 shadow-sm">
                <div className="w-9 h-9 rounded-full bg-[#E6008A] flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                    <p className="font-black text-foreground text-sm">PARA — Asisten PARAS</p>
                    <p className="text-[10px] text-[#159038] flex items-center gap-1 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#159038] inline-block" /> Online
                    </p>
                </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-background">
                {messages.map((msg, i) => (
                    <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                        {msg.role === 'bot' && (
                            <div className="w-7 h-7 rounded-full bg-[#E6008A] flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                                <MessageCircle className="w-3.5 h-3.5 text-white" />
                            </div>
                        )}
                        <div className={cn(
                            'max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line', 
                            msg.role === 'bot'
                                ? 'bg-white border border-border text-foreground shadow-sm rounded-tl-none'
                                : 'bg-[#159038] text-white rounded-tr-none shadow-sm'
                        )}>
                            {msg.text}
                        </div>
                    </div>
                ))}

                {/* Choose buttons */}
                {step === 'welcome' && (
                    <div className="flex flex-col gap-2 pl-9">
                        <button onClick={handleChoose} className="flex items-center gap-2 bg-[#159038] hover:bg-green-700 transition-colors text-white rounded-2xl rounded-tl-none px-4 py-3 text-sm font-bold w-fit shadow-sm">
                            <FileText className="w-4 h-4" /> Buat Laporan
                        </button>
                    </div>
                )}

                {/* Report Form */}
                {step === 'form' && (
                    <div className="pl-9 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-white rounded-2xl rounded-tl-none border border-border shadow-sm p-5 space-y-4">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b pb-2">Formulir Laporan</p>

                            <div>
                                <label htmlFor="reporter" className="block text-xs font-bold text-foreground mb-1.5">Nama Pelapor</label>
                                <div className="relative">
                                    <input id="reporter" type="text" value={userProfile.displayName} readOnly aria-readonly="true" className="w-full text-sm font-semibold rounded-xl border border-border px-3 py-2.5 pr-9 bg-muted/60 text-muted-foreground cursor-not-allowed outline-none" />
                                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1">Diambil otomatis dari profil Anda.</p>
                            </div>

                            <fieldset>
                                <legend className="block text-xs font-bold text-foreground mb-1.5">Lokasi Kejadian *</legend>
                                <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/60 px-3 py-2.5">
                                    <MapPin className="w-4 h-4 text-[#159038] shrink-0" aria-hidden />
                                    <span className="flex-1 text-sm font-semibold text-foreground">{userProfile.areaFull}</span>
                                    <Lock className="w-4 h-4 text-muted-foreground" aria-hidden />
                                </div>
                                <label htmlFor="loc" className="sr-only">Detail lokasi</label>
                                <input id="loc" type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Mis. Jl. Melati, RT 02 / RW 05, depan musala" className={cn('mt-2 w-full text-sm rounded-xl border px-3 py-2.5 outline-none transition-colors bg-muted/30 focus:bg-white', errors.location ? 'border-red-400' : 'border-border focus:border-[#159038]')} />
                                {errors.location
                                    ? <p className="text-xs text-red-500 mt-1 font-medium">{errors.location}</p>
                                    : <p className="text-[10px] text-muted-foreground mt-1">Sebutkan nama jalan, RT/RW, atau patokan.</p>}
                            </fieldset>

                            <div>
                                <label className="block text-xs font-bold text-foreground mb-1.5">Uraian Laporan *</label>
                                <textarea value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="Ceritakan situasi yang Anda alami atau lihat..." rows={4} className={cn('w-full text-sm rounded-xl border px-3 py-2.5 outline-none transition-colors resize-none bg-muted/30 focus:bg-white', errors.details ? 'border-red-400' : 'border-border focus:border-[#159038]')} />
                                {errors.details && <p className="text-xs text-red-500 mt-1 font-medium">{errors.details}</p>}
                                <p className="text-[10px] text-muted-foreground mt-1 text-right">{form.details.length} karakter</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-foreground mb-1.5">Bukti Foto/Dokumen *</label>
                                <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={(e) => { setForm({ ...form, file: e.target.files?.[0] ?? null }); setErrors((er) => ({ ...er, file: '' })); }} />
                                {form.file ? (
                                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                                        {form.file.type.includes('image') ? <ImageIcon className="w-4 h-4 text-[#159038]" /> : <FileText className="w-4 h-4 text-[#159038]" />}
                                        <span className="text-xs text-[#159038] font-semibold flex-1 truncate">{form.file.name}</span>
                                        <button onClick={() => setForm({ ...form, file: null })} className="text-gray-400 hover:text-red-500 transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <button onClick={() => fileRef.current?.click()} className={cn('flex items-center gap-2 text-sm text-muted-foreground border border-dashed rounded-xl px-4 py-3 w-full transition-colors', errors.file ? 'border-red-400 bg-red-50/50' : 'border-border hover:border-[#159038] hover:text-[#159038] hover:bg-green-50/50')}>
                                        <Paperclip className="w-4 h-4" /> Lampirkan file (JPG, PNG, PDF · maks 10MB)
                                    </button>
                                )}
                                {errors.file && <p className="text-xs text-red-500 mt-1 font-medium">{errors.file}</p>}
                            </div>

                            <button onClick={handleSubmit} className="w-full bg-[#159038] hover:bg-green-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-md">
                                <Send className="w-4 h-4" /> Kirim Laporan
                            </button>
                        </div>
                    </div>
                )}

                {/* Submitted */}
                {step === 'submitted' && (
                    <div className="pl-9 animate-in zoom-in-95 duration-300">
                        <div className="bg-white rounded-2xl rounded-tl-none border border-green-100 shadow-sm p-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4 border border-green-100">
                                <CheckCircle2 className="w-8 h-8 text-[#159038]" />
                            </div>
                            <h3 className="font-black text-foreground text-lg mb-1">Laporan Terkirim!</h3>
                            <p className="text-sm text-muted-foreground mb-2">Nomor laporan: <span className="font-black text-[#E6008A]">#LP-2026-089</span></p>
                            <p className="text-xs text-gray-500 mb-6 leading-relaxed max-w-xs mx-auto">
                                Laporan Anda sedang diproses. Kami akan merespons dalam 1×24 jam melalui sistem PARAS.
                            </p>
                            <Link href="/pantau" className="inline-flex items-center gap-2 bg-[#E6008A] hover:bg-pink-600 text-white rounded-full px-6 py-3 text-sm font-bold transition-all hover:shadow-lg hover:shadow-pink-500/30">
                                Pantau Status Laporan <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Input placeholder saat di welcome */}
            {step === 'welcome' && (
                <div className="bg-white border-t border-border px-4 py-3">
                    <div className="flex items-center gap-2 bg-gray-100/50 border border-border rounded-xl px-3 py-2.5">
                        <input type="text" disabled placeholder="Gunakan tombol di atas untuk merespons..." className="flex-1 text-sm text-gray-400 bg-transparent outline-none cursor-not-allowed" />
                        <Send className="w-4 h-4 text-gray-300" />
                    </div>
                </div>
            )}
        </div>
    );
}