import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AdminProvider } from "@/context/AdminContext";
import { ReportProvider } from "@/context/ReportContext";
import AdminShell from "@/components/admin/AdminShell";
import { getAdminSession } from "@/lib/auth/admin";

// Layout ini membaca sesi (cookies), jadi harus dirender sebagai route dinamis.
export const instant = false;

export default async function AdminPanelLayout({ children }) {
    await connection();

    const admin = await getAdminSession();

    if (!admin) redirect("/admin/login");

    return (
        <AdminProvider admin={admin}>
            <ReportProvider source="admin" regionId={admin.regionId}>
                <AdminShell>
                    {children}
                </AdminShell>
            </ReportProvider>
        </AdminProvider>
    );
}
