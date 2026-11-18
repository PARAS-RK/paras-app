import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { getManagedUsers } from "@/lib/users/queries";
import { UsersProvider } from "@/context/UsersContext";
import UserManagement from "@/components/admin/UserManagement";

export const instant = false;

export const metadata = { title: "Manajemen Pengguna | PARAS" };

export default async function UserManagementPage() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");

  const { users, registrations, error } = await getManagedUsers(admin);

  return (
    <UsersProvider users={users} registrations={registrations} loadError={error}>
      <UserManagement />
    </UsersProvider>
  );
}