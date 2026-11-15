import { redirect } from "next/navigation";
import { AdminProvider } from "@/context/AdminContext";
import { ReportProvider } from "@/context/ReportContext";
import AdminShell from "@/components/admin/AdminShell";
import { getAdminSession } from "@/lib/auth/admin";
import AdminNotifications from "@/components/admin/AdminNotifications";

export default async function AdminPanelLayout({ children }) {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");

  return (
    <AdminProvider admin={admin}>
      <ReportProvider source="admin" regionId={admin.regionID}>
        <AdminShell>
          {children}
        </AdminShell>
      </ReportProvider>
    </AdminProvider>
  );
}