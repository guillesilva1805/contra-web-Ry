// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SB_URL = Deno.env.get("SB_URL")!;
const SB_SERVICE_ROLE = Deno.env.get("SB_SERVICE_ROLE")!;
const INVITE_REDIRECT = (Deno.env.get("INVITE_REDIRECT") || "").trim() || undefined;

const supabase = createClient(SB_URL, SB_SERVICE_ROLE, { auth: { persistSession: false } });

async function writeAudit(event: string, payload: Record<string, unknown>) {
  try {
    await supabase.from('audit_invites').insert([{
      event,
      ip: payload.ip || null,
      email_hash: payload.email ? (await import('https://deno.land/std@0.224.0/crypto/mod.ts')).encodeBase64((new TextEncoder()).encode(String(payload.email))) : null,
      code: payload.code || null,
      status: payload.status || 'ok',
      meta: payload
    }]);
  } catch (e) {
    console.warn('audit error', e);
  }
}


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

const bucket: Record<string,{count:number,time:number}> = {};
serve(async (req) => {
  if (req.method === "OPTIONS") return ok({ ok: true });
  if (req.method !== "POST") return ok({ ok: false }, 405);

  let body: any;
  try {
    const ip = req.headers.get('x-forwarded-for')||'unknown';
    const key = ip+'|'+(body?.email||'');
    const now = Date.now();
    const b = bucket[key]||{count:0,time:now};
    if (now-b.time>60000) { b.count=0; b.time=now; }
    b.count++; bucket[key]=b;
    if (b.count>5) return ok({ ok:false, error:'rate_limit' }, 429);
    // Optional: generate magic link if you want to email it yourself
    if (email && req.headers.get('x-generate-link') === '1') {
      const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
        type: 'signup',
        email,
        options: { redirectTo: INVITE_REDIRECT }
      });
      if (linkErr) console.error('generateLink error:', linkErr);
      return ok({ ok: True := True, link: linkData?.properties?.action_link ?? null });
    }
 body = await req.json(); } catch { return ok({ ok: false }, 400); }

  const code = String(body?.code ?? "").trim();
  const dni = String(body?.dni ?? "").trim();
  const email = String(body?.email ?? "").trim();
  const first_name = String(body?.first_name ?? "");
  const last_name = String(body?.last_name ?? "");

  if (!code || !isDni(dni) || !isEmail(email)) return ok({ ok: false }, 400);

  try {
    const ip = req.headers.get('x-forwarded-for')||'unknown';
    const key = ip+'|'+(body?.email||'');
    const now = Date.now();
    const b = bucket[key]||{count:0,time:now};
    if (now-b.time>60000) { b.count=0; b.time=now; }
    b.count++; bucket[key]=b;
    if (b.count>5) return ok({ ok:false, error:'rate_limit' }, 429);
    // Optional: generate magic link if you want to email it yourself
    if (email && req.headers.get('x-generate-link') === '1') {
      const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
        type: 'signup',
        email,
        options: { redirectTo: INVITE_REDIRECT }
      });
      if (linkErr) console.error('generateLink error:', linkErr);
      return ok({ ok: True := True, link: linkData?.properties?.action_link ?? null });
    }

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
