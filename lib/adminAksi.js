"use client";

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAdmin } from '@/context/AdminContext';
import { useReportContext } from '@/context/ReportContext';

function initialsOf(name) {
    return String(name || 'Warga')
        .replace(/^(Ibu|Bapak|Bu)\s+/, '')
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function proofPhoto(value, supabase) {
    const raw = String(value || '');
    if (!raw) return null;

    if (raw.startsWith('data:') || raw.startsWith('http://') || raw.startsWith('https://')) {
        return raw;
    }

    // Jika penyimpanan dipakai, buat URL sementara dari bucket bukti aksi.
    supabase.storage
        .from('bukti-laporan')
        .createSignedUrl(raw, 60 * 60)
        .then(({ data }) => {
            if (data?.signedUrl) return data.signedUrl;
        });

    return null;
}

function mapRemoteActions({
    actions,
    tasks,
    participants,
    profiles,
    taskProgress,
    proofs,
    supabase,
}) {
    const profileById = new Map(profiles.map((item) => [String(item.user_id), item]));
    const tasksByAction = new Map();

    tasks.forEach((task) => {
        const key = String(task.action_id);
        if (!tasksByAction.has(key)) tasksByAction.set(key, []);
        tasksByAction.get(key).push({
            id: String(task.action_task_id),
            title: task.step_content,
            points: task.points || 10,
            order: task.step_order || 0,
        });
    });

    tasksByAction.forEach((list) => list.sort((a, b) => a.order - b.order));

    const progressByParticipant = new Map();
    taskProgress.forEach((item) => {
        const key = String(item.participation_id);
        if (!progressByParticipant.has(key)) progressByParticipant.set(key, []);
        progressByParticipant.get(key).push(item);
    });

    const participantsByAction = new Map();
    participants.forEach((item) => {
        const key = String(item.action_id);
        if (!participantsByAction.has(key)) participantsByAction.set(key, []);
        participantsByAction.get(key).push(item);
    });

    const proofsByAction = new Map();
    proofs.forEach((item) => {
        const key = String(item.action_id);
        if (!proofsByAction.has(key)) proofsByAction.set(key, []);
        proofsByAction.get(key).push(item);
    });

    return (actions || []).map((action) => {
        const actionId = String(action.action_id);
        const actionTasks = tasksByAction.get(actionId) || [];
        const rawParticipants = participantsByAction.get(actionId) || [];
        const rawProofs = proofsByAction.get(actionId) || [];
        const quota = Math.max(1, Number(action.participant_target) || 40);

        const participantList = rawParticipants.map((participant) => {
            const profile = profileById.get(String(participant.user_id));
            const name = profile?.hide_name
                ? 'Warga Anonim'
                : profile?.full_name || 'Warga Paras';
            const progress = progressByParticipant.get(String(participant.participation_id)) || [];
            const completedIds = new Set(
                progress
                    .filter((item) => item.completed_at)
                    .map((item) => String(item.action_task_id))
            );

            return {
                userId: String(participant.user_id),
                name,
                role: 'Warga Peserta',
                initials: initialsOf(name),
                joinedAt: participant.joined_at,
                completionStatus: participant.completion_action_status,
                checklist: actionTasks.map((task) => ({
                    taskId: task.id,
                    status: completedIds.has(task.id) ? 'selesai' : 'menunggu',
                })),
            };
        });

        const evidences = rawProofs.map((proof) => {
            const participant = rawParticipants.find(
                (item) => String(item.participation_id) === String(proof.participation_id)
            );
            const profile = participant
                ? profileById.get(String(participant.user_id))
                : null;
            const status = proof.verification_status === 'verified'
                ? 'diterima'
                : proof.verification_status === 'rejected'
                    ? 'ditolak'
                    : 'menunggu';

            return {
                id: String(proof.proof_id),
                userId: String(participant?.user_id || ''),
                participantName: profile?.hide_name
                    ? 'Warga Anonim'
                    : profile?.full_name || 'Warga Paras',
                photos: [proofPhoto(proof.photo_path, supabase)].filter(Boolean),
                note: '',
                status,
                rejectionReason: proof.verification_notes || null,
                submittedAt: proof.updated_at,
            };
        });

        return {
            id: actionId,
            sourceReportIds: (action.source_report_ids || []).map(String),
            title: action.action_title,
            objective: action.action_description || '',
            category: action.category || 'Aksi Komunitas',
            registrationRange: action.registration_range || '-',
            status: action.completed_at ? 'selesai' : 'aktif',
            completedAt: action.completed_at,
            startDate: action.action_start_date,
            location: action.location || 'Lokasi belum tersedia',
            participants: participantList.length,
            quota,
            achieved: evidences.filter((item) => item.status === 'diterima').length,
            target: quota,
            unit: 'peserta',
            reportCount: (action.source_report_ids || []).length,
            reportTopic: action.action_title.toLowerCase(),
            schedule: {
                date: action.action_start_date,
                time: action.duration || '-',
                place: action.location || 'Lokasi belum tersedia',
            },
            targetLabel: `${quota} warga berpartisipasi`,
            coordinator: action.action_coordinator || 'Ketua PKK',
            steps: actionTasks.map((task) => task.title),
            safety: [],
            joined: false,
            lastStep: 1,
            safetyRead: false,
            pointsEarned: 0,
            tasks: actionTasks.map(({ id, title, points }) => ({ id, title, points })),
            participantList,
            evidences,
            tasksDoneTotal: evidences.filter((item) => item.status === 'diterima').length,
        };
    });
}

/** Sumber aksi admin: Supabase. */
export function useAdminAksi() {
    const admin = useAdmin();
    const { verifyActionProof, completeCommunityAction } = useReportContext();
    const [remoteActions, setRemoteActions] = useState([]);

    const reload = useCallback(async () => {
        if (!admin.regionId) return;

        const supabase = createClient();

        const { data: actions, error: actionError } = await supabase
            .from('community_actions')
            .select('*')
            .eq('region_id', admin.regionId)
            .order('created_at', { ascending: false });

        if (actionError) {
            console.error('Gagal memuat aksi komunitas:', actionError);
            return;
        }

        const actionIds = (actions || []).map((item) => item.action_id);
        if (!actionIds.length) {
            setRemoteActions([]);
            return;
        }

        const [
            { data: tasks },
            { data: participants },
            { data: proofs },
        ] = await Promise.all([
            supabase.from('action_tasks').select('*').in('action_id', actionIds),
            supabase.from('action_participants').select('*').in('action_id', actionIds),
            supabase.from('action_completion_proofs').select('*').in('action_id', actionIds),
        ]);

        const participationIds = (participants || []).map((item) => item.participation_id);
        const userIds = [...new Set((participants || []).map((item) => item.user_id))];

        const [
            { data: taskProgress },
            { data: profiles },
        ] = await Promise.all([
            participationIds.length
                ? supabase.from('action_task_progress').select('*').in('participation_id', participationIds)
                : Promise.resolve({ data: [] }),
            userIds.length
                ? supabase.from('profiles').select('user_id, full_name, hide_name').in('user_id', userIds)
                : Promise.resolve({ data: [] }),
        ]);

        setRemoteActions(mapRemoteActions({
            actions,
            tasks: tasks || [],
            participants: participants || [],
            profiles: profiles || [],
            taskProgress: taskProgress || [],
            proofs: proofs || [],
            supabase,
        }));
    }, [admin.regionId]);

    useEffect(() => {
        reload();

        let channel;

        try {
            const supabase = createClient();
            channel = supabase
                .channel(`admin-aksi-${admin.regionId}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'action_participants' }, reload)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'action_completion_proofs' }, reload)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'action_task_progress' }, reload)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'community_actions' }, reload)
                .subscribe();
        } catch (error) {
            console.error('Gagal memasang pembaruan aksi realtime:', error);
        }

        return () => {
            if (channel) channel.unsubscribe();
        };
    }, [admin.regionId, reload]);

    const verifyProof = useCallback(async (_actionId, proofId, status, reason) => {
        const ok = await verifyActionProof(proofId, status, reason);
        if (ok) await reload();
        return ok;
    }, [reload, verifyActionProof]);

    const completeAction = useCallback(async (actionId) => {
        const ok = await completeCommunityAction(actionId);
        if (ok) await reload();
        return ok;
    }, [completeCommunityAction, reload]);

    return {
        aksi: remoteActions,
        reload,
        verifyProof,
        completeAction,
    };
}
