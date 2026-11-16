"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { USERS } from "@/lib/users"; // SEMENTARA: kandidat serah terima masih data contoh
import { useAdmin } from "@/context/AdminContext";
import { useProfileForm } from "@/hooks/useProfileForm";
import ProfileSummary from "./profile/ProfileSummary";
import ProfileDataCard from "./profile/ProfileDataCard";
import SecuritySection from "./profile/SecuritySection";
import TransferSection from "./profile/TransferSection";
import TransferModal from "./profile/TransferModal";
import SuccessModal from "./profile/SuccessModal";
import ChangePasswordModal from "./profile/ChangePasswordModal";
import ChangeEmailModal from "./profile/ChangeEmailModal";
import DangerZone from "./profile/DangerZone";

export default function AdminProfile() {
  const router = useRouter();
  const admin = useAdmin();
  const form = useProfileForm();
  const [photo, setPhoto] = useState(null); // pratinjau saja, belum tersimpan
  const [transferOpen, setTransferOpen] = useState(false);
  const [successMember, setSuccessMember] = useState(null);
  const [securityModal, setSecurityModal] = useState(null); // null | "password" | "email"
  const [securityNotice, setSecurityNotice] = useState("");

  const candidates = USERS.filter(
    (user) =>
      user.status === "active" &&
      (user.type === "pkk_member" || user.type === "pkk_chair") &&
      user.email !== admin.email
  );

  /* ---------- Serah terima jabatan ---------- */
  const openTransfer = useCallback(() => setTransferOpen(true), []);
  const closeTransfer = useCallback(() => setTransferOpen(false), []);

  const handleTransferSuccess = useCallback((member) => {
    setTransferOpen(false);
    setSuccessMember(member);
  }, []);

  const finishTransfer = useCallback(() => {
    try {
      localStorage.removeItem("paras_admin_auth");
    } catch {}
    router.replace("/admin/login");
  }, [router]);

  /* ---------- Keamanan akun ---------- */
  const openPasswordModal = useCallback(() => {
    setSecurityNotice("");
    setSecurityModal("password");
  }, []);

  const openEmailModal = useCallback(() => {
    setSecurityNotice("");
    setSecurityModal("email");
  }, []);

  const closeSecurity = useCallback(() => setSecurityModal(null), []);
  const closeNotice = useCallback(() => setSecurityNotice(""), []);

  const handlePasswordSuccess = useCallback(() => {
    setSecurityModal(null);
    setSecurityNotice("Kata sandi berhasil diperbarui.");
  }, []);

  const handleEmailSuccess = useCallback(() => {
    setSecurityModal(null);
    setSecurityNotice(
      "Email berhasil diperbarui. Kami juga mengirim pemberitahuan ke email lama Anda."
    );
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <h1 className="text-2xl font-black text-slate-900">Profil</h1>
        <p className="mt-1 text-sm text-slate-500">
          Kelola data diri dan kepemimpinan wilayah PKK Anda.
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[340px_1fr]">
        <ProfileSummary photo={photo} onPhotoChange={setPhoto} />

        <div className="space-y-6">
          <ProfileDataCard
            profile={form.profile}
            draft={form.draft}
            setDraft={form.setDraft}
            editing={form.editing}
            saving={form.saving}
            error={form.error}
            onEdit={form.startEdit}
            onCancel={form.cancelEdit}
            onSave={form.save}
          />
          <SecuritySection
            email={admin.email}
            notice={securityNotice}
            onCloseNotice={closeNotice}
            onChangePassword={openPasswordModal}
            onChangeEmail={openEmailModal}
          />
          <TransferSection onOpen={openTransfer} />
        </div>
      </div>

      <DangerZone />

      {transferOpen && (
        <TransferModal
          members={candidates}
          onClose={closeTransfer}
          onSuccess={handleTransferSuccess}
        />
      )}
      {successMember && <SuccessModal member={successMember} onDone={finishTransfer} />}

      {securityModal === "password" && (
        <ChangePasswordModal onClose={closeSecurity} onSuccess={handlePasswordSuccess} />
      )}
      {securityModal === "email" && (
        <ChangeEmailModal
          currentEmail={admin.email}
          onClose={closeSecurity}
          onSuccess={handleEmailSuccess}
        />
      )}
    </div>
  );
}