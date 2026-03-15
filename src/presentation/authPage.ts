const API = '';

async function handleLogin(e: Event) {
  e.preventDefault();
  const email = (document.getElementById('login-email') as HTMLInputElement).value;
  const password = (document.getElementById('login-password') as HTMLInputElement).value;

  const res = await fetch(`${API}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();

  if (res.ok) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.user.id);
    localStorage.setItem('username', data.user.username);
    localStorage.setItem('role', data.user.role);
    window.location.href = '/';
  } else {
    showError('login-error', data.error);
  }
}

async function handleRegister(e: Event) {
  e.preventDefault();
  const email = (document.getElementById('reg-email') as HTMLInputElement).value;
  const username = (document.getElementById('reg-username') as HTMLInputElement).value;
  const password = (document.getElementById('reg-password') as HTMLInputElement).value;

  const res = await fetch(`${API}/api/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password }),
  });
  const data = await res.json();

  if (res.ok) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.user.id);
    localStorage.setItem('username', data.user.username);
    localStorage.setItem('role', data.user.role);
    window.location.href = '/';
  } else {
    showError('reg-error', data.error);
  }
}

function showError(id: string, msg: string) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function switchTab(tab: 'login' | 'register') {
  document.querySelectorAll('.auth-panel').forEach(p => (p as HTMLElement).style.display = 'none');
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`panel-${tab}`)!.style.display = 'block';
  document.querySelector(`.auth-tab[data-tab="${tab}"]`)!.classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-form')?.addEventListener('submit', handleLogin);
  document.getElementById('register-form')?.addEventListener('submit', handleRegister);
  document.querySelectorAll('.auth-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = (btn as HTMLElement).dataset.tab as 'login' | 'register';
      switchTab(tab);
    });
  });
});
