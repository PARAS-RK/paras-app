import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { getUserCounts } from "@/lib/users/queries";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const instant = false;
export const metadata = { title: "Dashboard Admin | PARAS" };

export default async function AdminDashboardPage() {
    const admin = await getAdminSession();
    if (!admin) redirect("/admin/login");

    const counts = await getUserCounts(admin);
    return <AdminDashboard userCounts={counts} />;
}
