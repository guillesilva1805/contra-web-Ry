function togglePwd(id, btn){ const i=document.getElementById(id); i.type = (i.type==="password")?"text":"password"; if(btn) btn.textContent = (i.type==="password")?"Mostrar":"Ocultar"; }
    let supabase;
    function initSupabase(){
  try {
    if (!window.supabase) return;
    if (!window.__sbClient) {
      window.__sbClient = window.supabase.createClient(
        "https://uppdkjfjxtjnukftgwhz.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwcGRramZqeHRqbnVrZnRnd2h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MDE3NjMsImV4cCI6MjA2MzI3Nzc2M30._bPFFm4NqghiVPmytaGkiD40QFc1Ct-oIQx1gOK0g74"
      );
    }
  } catch (e) { console.warn("Supabase SDK not ready", e); }
}
function getClient(){ initSupabase(); return window.__sbClient; }

const q = (s) => document.querySelector(s);
    const show = (t, ok=false) => { const m=q('#msg'); m.textContent=t; m.className='msg '+(ok?'ok':'err'); };

    function parseHash() {
      const h = new URLSearchParams(window.location.hash.slice(1));
      const access_token = h.get('access_token');
      const refresh_token = h.get('refresh_token');
      const error = h.get('error');
      const error_description = h.get('error_description');
      return { access_token, refresh_token, error, error_description };
    }

    async function ensureInviteSession() {
      initSupabase();
      const { access_token, refresh_token, error, error_description } = parseHash();
      if (error) { show(error_description || 'Enlace inválido o expirado. Solicita una nueva invitación.'); return false; }
      
      // Fallbacks: try query params when no tokens in hash
      const url = new URL(window.location.href);
      const token_hash = url.searchParams.get('token_hash');
      const linkType = url.searchParams.get('type');
      const authCode = url.searchParams.get('code');
      if (!access_token && token_hash && linkType) {
        try { await (getClient()?.auth.verifyOtp?.({ type: linkType, token_hash })); } catch(_){}
      } else if (!access_token && authCode) {
        try { await (getClient()?.auth.exchangeCodeForSession?.({ code: authCode })); } catch(_){}
      }
      if (access_token && refresh_token) {
        initSupabase(); const { error } = await await getClient().auth.setSession({ access_token, refresh_token });
        if (error) console.warn('setSession error', error);
      }
      initSupabase(); const { data: { session } } = await (supabase? (getClient()?.auth.getSession)():{data:{session:null}});
      if (!session) { show('No hay sesión de invitación activa. Abre el enlace del correo nuevamente.'); return false; }
      return true;
    }

    async function checkInviteUsed(){
      try{ const { data: { user } } = await getClient().auth.getUser();
        const email = user?.email||'';
        if(!email) return;
        const res = await fetch('https://uppdkjfjxtjnukftgwhz.supabase.co/functions/v1/invite?action=check_used&email='+encodeURIComponent(email));
        const j = await res.json();
        if(j?.used){ document.getElementById('hint').textContent='Esta invitación ya fue usada.'; document.getElementById('btn').disabled=true; }
      }catch(_){ }
    }


    window.addEventListener('load', async ()=>{ await ensureInviteSession(); await checkInviteUsed(); });
    document.addEventListener('DOMContentLoaded', () => {
      const t1 = document.getElementById('toggle1');
      const t2 = document.getElementById('toggle2');
      const i1 = document.getElementById('pass1');
      const i2 = document.getElementById('pass2');
      if (t1 && i1) t1.addEventListener('click', () => { i1.type = i1.type === 'password' ? 'text' : 'password'; t1.textContent = i1.type === 'password' ? 'Mostrar' : 'Ocultar'; });
      if (t2 && i2) t2.addEventListener('click', () => { i2.type = i2.type === 'password' ? 'text' : 'password'; t2.textContent = i2.type === 'password' ? 'Mostrar' : 'Ocultar'; });
      const update = () => { const p1 = i1.value.trim(); const p2 = i2.value.trim(); const mismatch = p1 && p2 && p1 !== p2; document.getElementById('hint').textContent = mismatch ? 'Las contraseñas no coinciden.' : ''; document.getElementById('btn').disabled = mismatch; };
      i1.addEventListener('input', update);
      i2.addEventListener('input', update);
    });

    function updateState(){
      const p1 = q('#pass1').value.trim();
      const p2 = q('#pass2').value.trim();
      const btn = q('#btn');
      const mismatch = p1 && p2 && p1 !== p2;
      q('#hint').textContent = mismatch ? 'Las contraseñas no coinciden.' : '';
      btn.disabled = mismatch;
    }
    try {
      q('#pass1').addEventListener('input', updateState);
      q('#pass2').addEventListener('input', updateState);
      q('#toggle1').addEventListener('click', ()=>{ const i=q('#pass1'); i.type=i.type==='password'?'text':'password'; q('#toggle1').textContent=i.type==='password'?'Mostrar':'Ocultar'; });
      q('#toggle2').addEventListener('click', ()=>{ const i=q('#pass2'); i.type=i.type==='password'?'text':'password'; q('#toggle2').textContent=i.type==='password'?'Mostrar':'Ocultar'; });
    } catch(_) {}

    q('#btn').onclick = async () => {
      if (!(await ensureInviteSession())) return;
      const p1 = q('#pass1').value.trim();
      const p2 = q('#pass2').value.trim();
      if (!p1 || !p2 || p1 !== p2) { q('#hint').textContent='Las contraseñas no coinciden.'; return; }
      if (p1.length < 12) { show('Usa al menos 12 caracteres.'); return; }
      const { error } = await getClient().auth.updateUser({ password: p1 });
      if (error) { show('No se pudo guardar: ' + (error.message || 'Intenta otra vez.')); return; }
      try{ const { data:{ user } } = await (getClient()?.auth.getUser?.()||{}); const email=user?.email||''; if(email){ await fetch('https://uppdkjfjxtjnukftgwhz.supabase.co/functions/v1/invite', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'mark_used', email }) }); } }catch(_){ }
      show('Contraseña creada. Ya puedes iniciar sesión en la app.', true);
    };
// toggle delegation
document.addEventListener('click', function(ev){
  const t=ev.target;
  if(!t) return;
  if(t.id==='toggle1'){ togglePwd('pass1', t); }
  else if(t.id==='toggle2'){ togglePwd('pass2', t); }
});

// persist invite hash to avoid external cleaners
(function(){
  try{
    const h = window.location.hash||'';
    if(h && (h.includes('access_token') || h.includes('refresh_token') || h.includes('token_hash') || h.includes('code='))){
      sessionStorage.setItem('last_invite_hash', h);
    }
    window.addEventListener('hashchange', ()=>{
      if(!window.location.hash && sessionStorage.getItem('last_invite_hash')){
        window.location.hash = sessionStorage.getItem('last_invite_hash');
      }
    });
    // extra guard for first 5s
    let t=0; const id=setInterval(()=>{
      t+=500; if(t>5000){clearInterval(id);return;}
      if(!window.location.hash && sessionStorage.getItem('last_invite_hash')){
        window.location.hash = sessionStorage.getItem('last_invite_hash');
      }
    },500);
  }catch(_){}
})();
