(function(){
  const hashEl = document.getElementById('hash');
  const statusEl = document.getElementById('status');
  const setBtn = document.getElementById('setHash');
  const clrBtn = document.getElementById('clearHash');
  const reloadBtn = document.getElementById('reload');

  function updateHashView() {
    hashEl.textContent = window.location.hash || '(vacío)';
  }

  function logStatus(text, cls){
    statusEl.textContent = text;
    statusEl.className = cls || '';
  }

  setBtn.addEventListener('click', ()=>{
    const fake = '#access_token=fake.at.&refresh_token=fake.rt.&token_type=bearer&type=invite&expires_in=3600';
    window.location.hash = fake;
    sessionStorage.setItem('last_invite_hash', fake);
    logStatus('Hash simulado configurado y persistido en sessionStorage', 'ok');
    updateHashView();
  });

  clrBtn.addEventListener('click', ()=>{
    const before = window.location.hash;
    history.replaceState(null, '', window.location.pathname + window.location.search + '#');
    updateHashView();
    setTimeout(()=>{
      if(window.location.hash && window.location.hash !== '#'){
        logStatus('El guard restauró el hash automáticamente', 'ok');
        updateHashView();
      } else {
        const saved = sessionStorage.getItem('last_invite_hash') || '(nada)';
        logStatus('El guard no restauró aún. last_invite_hash=' + saved, 'warn');
      }
    }, 600);
  });

  reloadBtn.addEventListener('click', ()=>{
    window.location.reload();
  });

  window.addEventListener('hashchange', updateHashView);
  updateHashView();
})();


