import { Suspense } from "react";
import ActionManagement from "@/components/admin/ActionManagement";

export default function AdminActionPage() {
    return (
        <Suspense fallback={<div className="mx-auto max-w-7xl p-6 text-sm text-slate-500">Memuat manajemen aksi...</div>}>
            <ActionManagement />
        </Suspense>
    );
}