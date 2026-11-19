import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_NEXT = ["/login", "/admin/login", "/"];

export async function POST(request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");

  const formData = await request.formData();
  const next = String(formData.get("next") ?? "");
  const destination = ALLOWED_NEXT.includes(next) ? next : "/login";

  // Ambil domain asli dari proxy Railway atau env, fallback ke request.url untuk lokal
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (forwardedHost ? `${forwardedProto}://${forwardedHost}` : request.url);

  return NextResponse.redirect(new URL(destination, baseUrl), { status: 303 });
}