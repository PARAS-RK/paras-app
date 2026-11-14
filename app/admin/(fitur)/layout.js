import { redirect } from "next/navigation";
import { AdminProvider } from "@/context/AdminContext";
import { ReportProvider } from "@/context/ReportContext";
import AdminShell from "@/components/admin/AdminShell";
// import { getAdminSession } from "@/lib/auth/admin";
import AdminNotifications from "@/components/admin/AdminNotifications";

export default async function AdminPanelLayout({ children }) {
  // BYPASS SEMENTARA: Gunakan data dummy agar tidak redirect ke /admin/login
  const admin = {
    name: "Admin Preview",
    email: "preview@paras.com",
    initials: "AP",
    areaLabel: "Kel. Kebayoran Baru",
    areaFull: "Kel. Kebayoran Baru, Jakarta Selatan",
  };

//export default async function AdminPanelLayout({ children }) {
  //const admin = await getAdminSession();
  //if (!admin) redirect("/admin/login");

  return (
    <AdminProvider admin={admin}>
      <ReportProvider source="admin">
        <AdminShell>
          {children}
        </AdminShell>
      </ReportProvider>
    </AdminProvider>
  );
}