import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import Hero from "../../components/landing/Hero";
import Features from "../../components/landing/Features";
import About from "../../components/landing/About";
import CTA from "../../components/landing/CTA";
import ChatContainer from "../../components/landing/ChatContainer";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/home");

  return (
    <div className="bg-white">
      <Hero />
      <Features />
      <About />
      <CTA />
      <ChatContainer />
    </div>
  );
}