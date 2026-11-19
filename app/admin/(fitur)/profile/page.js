import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { getTransferCandidates } from "@/lib/profile/queries";
import { ProfileProvider } from "@/context/ProfileContext";
import AdminProfile from "@/components/admin/AdminProfile";

export const instant = false;
export const metadata = { title: "Profil Admin | PARAS" };

export default async function AdminProfilePage() {
    const admin = await getAdminSession();
    if (!admin) redirect("/admin/login");

    const candidates = await getTransferCandidates(admin);

    return (
        <ProfileProvider candidates={candidates}>
            <AdminProfile />
        </ProfileProvider>
    );
}
