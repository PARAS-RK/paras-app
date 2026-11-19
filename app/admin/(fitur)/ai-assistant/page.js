import { Suspense } from "react";
import AIAssistant from "@/components/admin/AIAssistant";

export default function AdminAIAssistantPage() {
    return (
        <Suspense fallback={<div className="mx-auto max-w-7xl p-6 text-sm text-slate-500">Memuat Asisten AI...</div>}>
            <AIAssistant />
        </Suspense>
    );
}