import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AdminProvider } from "@/context/AdminContext";
import { ReportProvider } from "@/context/ReportContext";
import AdminShell from "@/components/admin/AdminShell";
import { getAdminSession } from "@/lib/auth/admin";

async function AuthenticatedAdminContent({ children }) {
  await connection();
  const admin = await getAdminSession();

  console.log("ADMIN SESSION:", {
    name: admin?.name,
    userId: admin?.userId,
    unitId: admin?.unitId,
    regionID: admin?.regionID,
  });

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

export default function AdminPanelLayout({ children }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-500">
          Memuat panel admin...
        </div>
      }
    >
      <AuthenticatedAdminContent>{children}</AuthenticatedAdminContent>
    </Suspense>
  );
}