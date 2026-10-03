
(function () {
  const BUILT_IN_CLIENT_ID = '75962574117-lnhhhta6n8sg2ocl4gkrh0pcfuu9dbmv.apps.googleusercontent.com';

  const usable = BUILT_IN_CLIENT_ID && !BUILT_IN_CLIENT_ID.startsWith('PASTE-');
  if (usable) {
    
    const original = window.getClientId;
    window.getClientId = function () { return BUILT_IN_CLIENT_ID || original(); };
  }

  function relabel() {
    document.querySelectorAll('button[onclick="startKidSync()"]').forEach(b => {
      b.innerHTML = '<i class="fa-brands fa-google mr-2"></i>Log in with Google';
    });
    const sub = document.getElementById('google-sub-text');
    if (sub && /Tap Sync/i.test(sub.textContent)) sub.textContent = 'Tap Log in to get homework';
    
    if (usable) document.querySelectorAll('#view-classroom-hub details').forEach(d => d.classList.add('hidden'));
  }

  document.addEventListener('DOMContentLoaded', () => setTimeout(relabel, 0));
})();
