import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { adminLogin } from "./actions";

export const instant = false;

export const metadata = { title: "Masuk Admin | PARAS" };

export default async function AdminLoginPage({ searchParams }) {
  const { error } = await searchParams;
  return <AdminLoginForm action={adminLogin} error={error} />;
}