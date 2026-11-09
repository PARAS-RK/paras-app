"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { USERS } from "@/lib/users";
import { initialProfile } from "./profile/constants";
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
  const [profile, setProfile] = useState(initialProfile);
  const [draft, setDraft] = useState(initialProfile);
  const [editing, setEditing] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [successMember, setSuccessMember] = useState(null);
  const [securityModal, setSecurityModal] = useState(null); // null | "password" | "email"
  const [securityNotice, setSecurityNotice] = useState("");

  const candidates = USERS.filter(
    (user) =>
      user.status === "active" &&
      (user.type === "pkk_member" || user.type === "pkk_chair") &&
      user.email !== profile.email
  );

  function cancelEdit() {
    setDraft(profile);
    setEditing(false);
  }

  function saveProfile() {
    setProfile(draft);
    setEditing(false);
  }

  function finishTransfer() {
    try {
      localStorage.removeItem("paras_admin_auth");
    } catch {}
    router.replace("/admin/login");
  }

  function openSecurity(type) {
    setSecurityNotice("");
    setSecurityModal(type);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <h1 className="text-2xl font-black text-slate-900">Profil</h1>
        <p className="mt-1 text-sm text-slate-500">
          Kelola data diri dan kepemimpinan wilayah PKK Anda.
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[340px_1fr]">
        <ProfileSummary profile={profile} photo={photo} onPhotoChange={setPhoto} />

        <div className="space-y-6">
          <ProfileDataCard
            profile={profile}
            draft={draft}
            setDraft={setDraft}
            editing={editing}
            onEdit={() => setEditing(true)}
            onCancel={cancelEdit}
            onSave={saveProfile}
          />
          <SecuritySection
            email={profile.email}
            notice={securityNotice}
            onCloseNotice={() => setSecurityNotice("")}
            onChangePassword={() => openSecurity("password")}
            onChangeEmail={() => openSecurity("email")}
          />
          <TransferSection onOpen={() => setTransferOpen(true)} />
        </div>
      </div>

      <DangerZone />

      {transferOpen && (
        <TransferModal
          members={candidates}
          onClose={() => setTransferOpen(false)}
          onSuccess={(member) => {
            setTransferOpen(false);
            setSuccessMember(member);
          }}
        />
      )}
      {successMember && <SuccessModal member={successMember} onDone={finishTransfer} />}

      {securityModal === "password" && (
        <ChangePasswordModal
          onClose={() => setSecurityModal(null)}
          onSuccess={() => {
            setSecurityModal(null);
            setSecurityNotice("Kata sandi berhasil diperbarui.");
          }}
        />
      )}
      {securityModal === "email" && (
        <ChangeEmailModal
          currentEmail={profile.email}
          onClose={() => setSecurityModal(null)}
          onSuccess={(newEmail) => {
            setProfile({ ...profile, email: newEmail });
            setDraft({ ...draft, email: newEmail });
            setSecurityModal(null);
            setSecurityNotice(
              "Email berhasil diperbarui. Kami juga mengirim pemberitahuan ke email lama Anda."
            );
          }}
        />
      )}
    </div>
  );
}