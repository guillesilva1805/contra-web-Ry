// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SB_URL = Deno.env.get("SB_URL")!;
const SB_SERVICE_ROLE = Deno.env.get("SB_SERVICE_ROLE")!;
const INVITE_REDIRECT = (Deno.env.get("INVITE_REDIRECT") || "").trim() || undefined;

const supabase = createClient(SB_URL, SB_SERVICE_ROLE, { auth: { persistSession: false } });

const ok = (body: any, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });

const isEmail = (v: string) => /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/.test(v);
const isDni = (v: string) => /^\d{8,10}$/.test(v);

serve(async (req) => {
  if (req.method === "OPTIONS") return ok({ ok: true });
  if (req.method !== "POST") return ok({ ok: false }, 405);

  let body: any;
  try { body = await req.json(); } catch { return ok({ ok: false }, 400); }

  const code = String(body?.code ?? "").trim();
  const dni = String(body?.dni ?? "").trim();
  const email = String(body?.email ?? "").trim();
  const first_name = String(body?.first_name ?? "");
  const last_name = String(body?.last_name ?? "");

  if (!code || !isDni(dni) || !isEmail(email)) return ok({ ok: false }, 400);

  try {
    const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { code, dni, first_name, last_name },
      redirectTo: INVITE_REDIRECT, // ej: https://reporte-reset.vercel.app
    });

    if (error && !String(error.message).toLowerCase().includes("already")) {
      console.error("invite error:", error);
    }
    return ok({ ok: true });
  } catch (e) {
    console.error(e);
    return ok({ ok: true });
  }
});
