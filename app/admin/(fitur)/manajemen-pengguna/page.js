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

    const data = await getManagedUsers(admin);

    return (
        <UsersProvider users={data.users} registrations={data.registrations} loadError={data.error}>
            <UserManagement />
        </UsersProvider>
    );
}
