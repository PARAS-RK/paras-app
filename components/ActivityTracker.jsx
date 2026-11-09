import { useState, useRef } from 'react';
import { CheckSquare, Square, Paperclip, X, Image, FileText, Users, BarChart2, CalendarDays, Target, StickyNote, BookOpen, Send, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useArticleContext } from '../context/ArticleContext';
import { statusLabel, statusPill } from '../lib/articleStore';
import { SubmitDocumentationModal } from './SubmitDocumentationModal';
export function ActivityTracker({ activity, onBack }) {
    const { getByActivity, updateStatus } = useArticleContext();
    const [checklist, setChecklist] = useState(activity.checklist.map((c) => ({ ...c, done: false })));
    const [notes, setNotes] = useState('');
    const [file, setFile] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [revisionNotes, setRevisionNotes] = useState('');
    const [showRevisionEditor, setShowRevisionEditor] = useState(false);
    const fileRef = useRef(null);
    const doneCount = checklist.filter((c) => c.done).length;
    const myProgress = checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : 0;
    const isComplete = myProgress === 100 && file !== null;
    const submission = getByActivity(activity.title);
    function toggle(id) {
        setChecklist((prev) => prev.map((c) => c.id === id ? { ...c, done: !c.done } : c));
    }
    function handleResubmit() {
        if (!submission)
            return;
        updateStatus(submission.id, 'submitted');
        setShowRevisionEditor(false);
        setRevisionNotes('');
    }
    const sections = [
        {
            id: 'howto',
            icon: BookOpen,
            label: 'Cara Melakukan',
            color: 'text-brand',
            bg: 'bg-brand-xlight',
            content: (<ol className="space-y-2">
          {activity.steps.map((step, i) => (<li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
              <span className="w-5 h-5 rounded-full bg-brand-light text-brand font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>))}
        </ol>),
        },
        {
            id: 'checklist',
            icon: CheckSquare,
            label: 'Checklist Saya',
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            content: (<div className="space-y-1.5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted-foreground">{doneCount}/{checklist.length} selesai</span>
            <div className="h-1.5 w-32 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${myProgress}%` }}/>
            </div>
          </div>
          {checklist.map((item) => (<button key={item.id} onClick={() => toggle(item.id)} className={cn('flex items-center gap-2.5 w-full text-left rounded-xl px-3 py-2.5 text-sm transition-colors border', item.done
                        ? 'bg-brand-light border-brand/20 text-brand-dark'
                        : 'bg-white border-border text-foreground hover:bg-muted')}>
              {item.done
                        ? <CheckSquare className="w-4 h-4 text-brand shrink-0"/>
                        : <Square className="w-4 h-4 text-border shrink-0"/>}
              <span className={item.done ? 'line-through opacity-70' : ''}>{item.label}</span>
            </button>))}
        </div>),
        },
        {
            id: 'schedule',
            icon: CalendarDays,
            label: 'Jadwal',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            content: (<div className="space-y-2">
          {activity.schedule.map((s, i) => (<div key={i} className="flex items-start gap-3 bg-white border border-border rounded-xl px-3 py-2.5">
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0"/>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium">{s.date}</p>
                <p className="text-sm text-foreground">{s.task}</p>
              </div>
            </div>))}
        </div>),
        },
        {
            id: 'target',
            icon: Target,
            label: 'Target',
            color: 'text-orange-500',
            bg: 'bg-orange-50',
            content: (<div className="bg-white border border-border rounded-xl px-4 py-3 flex items-center gap-3">
          <Target className="w-6 h-6 text-orange-400 shrink-0"/>
          <p className="text-sm font-semibold text-foreground">{activity.target}</p>
        </div>),
        },
        {
            id: 'notes',
            icon: StickyNote,
            label: 'Catatan Pribadi',
            color: 'text-violet-600',
            bg: 'bg-violet-50',
            content: (<textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tulis catatan kemajuan, refleksi, atau hal yang ingin diingat..." rows={4} className="w-full text-sm rounded-xl border border-border px-3 py-2.5 bg-white outline-none focus:border-violet-400 resize-none text-foreground"/>),
        },
        {
            id: 'upload',
            icon: Paperclip,
            label: 'Unggah Bukti',
            color: 'text-pink',
            bg: 'bg-pink-xlight',
            content: (<div>
          <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)}/>
          {file ? (<div className="flex items-center gap-2 bg-brand-light border border-brand-xlight rounded-xl px-3 py-2.5">
              {file.type.includes('image')
                        ? <Image className="w-4 h-4 text-brand"/>
                        : <FileText className="w-4 h-4 text-brand"/>}
              <span className="text-xs text-brand font-medium flex-1 truncate">{file.name}</span>
              <button onClick={() => setFile(null)}>
                <X className="w-4 h-4 text-muted-foreground hover:text-red-500"/>
              </button>
            </div>) : (<button onClick={() => fileRef.current?.click()} className="flex items-center justify-center gap-2 text-sm text-muted-foreground border border-dashed border-border rounded-xl px-4 py-4 w-full hover:border-brand hover:text-brand transition-colors bg-white">
              <Paperclip className="w-4 h-4"/> Lampirkan foto/dokumen (JPG, PNG, PDF · maks 10MB)
            </button>)}
        </div>),
        },
        {
            id: 'community',
            icon: Users,
            label: 'Progres Komunitas',
            color: 'text-cyan-600',
            bg: 'bg-cyan-50',
            content: (<div className="space-y-3">
          <div className="bg-white border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-cyan-500"/>
                <span className="text-xs font-black text-foreground">Progres Bersama</span>
              </div>
              <span className="text-sm font-black text-cyan-600">{activity.communityProgress}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-brand rounded-full transition-all" style={{ width: `${activity.communityProgress}%` }}/>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{activity.participants} anggota berpartisipasi</p>
          </div>
          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-xs font-black text-foreground mb-1">Progres Saya</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${myProgress}%` }}/>
              </div>
              <span className="text-xs font-black text-brand">{myProgress}%</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{doneCount} dari {checklist.length} checklist selesai</p>
          </div>
        </div>),
        },
    ];
    return (<>
      <div className="flex flex-col">
        {/* Activity header */}
        <div className="bg-brand px-4 lg:px-10 pt-6 pb-8 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5"/>
          <div className="max-w-6xl mx-auto relative z-10">
            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Aktivitas Aktif</p>
            <h1 className="text-xl font-black text-white mb-1">{activity.title}</h1>
            <p className="text-sm text-white/70 leading-relaxed max-w-lg">{activity.description}</p>
          </div>
        </div>

        {/* My progress float card */}
        <div className="mx-4 lg:mx-auto lg:max-w-6xl w-auto lg:w-full lg:px-10 -mt-4 z-10 relative mb-2">
          <div className="bg-white rounded-2xl border border-border shadow-md px-4 py-3 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground font-medium">Progres Saya</span>
                <span className="font-black text-brand">{myProgress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${myProgress}%` }}/>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-black text-foreground">{doneCount}/{checklist.length}</p>
              <p className="text-[10px] text-muted-foreground">checklist</p>
            </div>
          </div>
        </div>

        {/* 7 Tracker sections */}
        <div className="max-w-6xl mx-auto w-full px-4 lg:px-10 py-4">
          <div className="lg:grid lg:grid-cols-2 lg:gap-4 space-y-3 lg:space-y-0">
            {sections.map((s) => (<div key={s.id} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className={cn('px-4 py-3 flex items-center gap-2 border-b border-border', s.bg)}>
                  <s.icon className={cn('w-4 h-4 shrink-0', s.color)}/>
                  <p className={cn('text-xs font-black uppercase tracking-widest', s.color)}>{s.label}</p>
                </div>
                <div className="p-4">{s.content}</div>
              </div>))}
          </div>

          {/* ── Submission section ── */}
          <div className="mt-4 space-y-3">

            {/* Submission status badge */}
            {submission && (<div className={cn('rounded-2xl border px-4 py-3', submission.status === 'revision_requested'
                ? 'bg-orange-50 border-orange-200'
                : submission.status === 'published'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-muted border-border')}>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <FileText className="w-4 h-4 text-muted-foreground"/>
                  <p className="text-xs font-black text-foreground">Dokumentasi Diajukan</p>
                  <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full', statusPill[submission.status])}>
                    {statusLabel[submission.status]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">"{submission.editedTitle}"</p>

                {/* Revision requested */}
                {submission.status === 'revision_requested' && (<div className="mt-3 space-y-2">
                    <div className="bg-orange-100 rounded-xl px-3 py-2.5 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5"/>
                      <div>
                        <p className="text-xs font-black text-orange-800 mb-0.5">Catatan Admin:</p>
                        <p className="text-xs text-orange-700">{submission.adminNotes || "Mohon perbaiki konten sesuai panduan."}</p>
                      </div>
                    </div>
                    {!showRevisionEditor ? (<button onClick={() => setShowRevisionEditor(true)} className="flex items-center gap-2 bg-orange-500 text-white font-black px-4 py-2.5 rounded-xl text-sm hover:bg-orange-600 transition-colors">
                        <RefreshCw className="w-4 h-4"/> Perbarui Pengajuan
                      </button>) : (<div className="space-y-2">
                        <textarea value={revisionNotes} onChange={(e) => setRevisionNotes(e.target.value)} placeholder="Tambahkan keterangan revisi (opsional)..." rows={3} className="w-full text-sm rounded-xl border border-orange-200 px-3 py-2.5 bg-white outline-none focus:border-orange-400 resize-none"/>
                        <div className="flex gap-2">
                          <button onClick={() => setShowRevisionEditor(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted">
                            Batal
                          </button>
                          <button onClick={handleResubmit} className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white font-black text-sm hover:bg-orange-600 transition-colors flex items-center justify-center gap-2">
                            <Send className="w-4 h-4"/> Kirim Ulang
                          </button>
                        </div>
                      </div>)}
                  </div>)}
              </div>)}

            {/* Submit button — only when 100% complete + file uploaded + not yet submitted */}
            {isComplete && !submission && (<div className="bg-gradient-to-r from-brand-xlight to-pink-xlight border border-brand-light rounded-2xl px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center shrink-0">
                    <Send className="w-5 h-5 text-white"/>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-foreground mb-0.5">Aktivitas Selesai! 🎉</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Checklist 100% dan bukti sudah diunggah. Bagikan cerita keberhasilan Anda sebagai artikel publik PARAS.
                    </p>
                    <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-brand text-white font-black px-4 py-2.5 rounded-xl text-sm hover:bg-brand-dark transition-colors shadow-sm">
                      <FileText className="w-4 h-4"/> Ajukan sebagai Dokumentasi/Cerita
                    </button>
                  </div>
                </div>
              </div>)}

            {/* Hint when not yet complete */}
            {!isComplete && !submission && (<div className="bg-muted/60 rounded-2xl border border-border px-4 py-3 flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="w-4 h-4 shrink-0"/>
                Selesaikan semua checklist dan unggah bukti untuk bisa mengajukan sebagai Dokumentasi Aktivitas.
              </div>)}
          </div>
        </div>
      </div>

      {/* Submission modal */}
      {showModal && (<SubmitDocumentationModal activity={activity} notes={notes} photoFileName={file?.name ?? null} myProgress={myProgress} onClose={() => setShowModal(false)} onSubmitted={() => setShowModal(false)}/>)}
    </>);
}
