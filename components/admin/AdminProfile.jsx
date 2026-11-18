import ProfileSummary from "./profile/ProfileSummary";
import ProfileDataCard from "./profile/ProfileDataCard";
import SecuritySection from "./profile/SecuritySection";
import TransferSection from "./profile/TransferSection";
import DangerZone from "./profile/DangerZone";

export default function AdminProfile() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <h1 className="text-2xl font-black text-slate-900">Profil</h1>
        <p className="mt-1 text-sm text-slate-500">
          Kelola data diri dan kepemimpinan wilayah PKK Anda.
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[340px_1fr]">
        <ProfileSummary />
        <div className="space-y-6">
          <ProfileDataCard />
          <SecuritySection />
          <TransferSection />
        </div>
      </div>

      <DangerZone />
    </div>
  );
}