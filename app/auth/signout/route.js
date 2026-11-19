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

  return NextResponse.redirect(new URL(destination, request.url), { status: 303 });
}