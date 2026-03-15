const API = '';

export class LeaderboardView {
  async load(): Promise<void> {
    const res = await fetch(`${API}/api/validations/leaderboard`);
    const { data, lastUpdate } = await res.json();

    const tbody = document.getElementById('leaderboard-body')!;
    tbody.innerHTML = data
      .map((u: any, i: number) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        const roleLabel = u.role === 'admin' ? '<span class="badge-admin">Admin</span>' : '';
        return `
          <tr class="${i < 3 ? 'top-' + (i + 1) : ''}">
            <td class="rank">${medal}</td>
            <td class="username">${u.username} ${roleLabel}</td>
            <td class="score">${u.trustScore} <span class="score-label">puan</span></td>
          </tr>`;
      })
      .join('');

    const ts = document.getElementById('last-update');
    if (ts) ts.textContent = `Son güncelleme: ${new Date(lastUpdate).toLocaleTimeString('tr-TR')}`;
  }
}
