import { LeaderboardView } from './LeaderboardView';

declare global {
  interface Window {
    leaderboardView: LeaderboardView;
  }
}

async function init() {
  const view = new LeaderboardView();
  window.leaderboardView = view;
  await view.load();
  setInterval(() => view.load(), 30000);
}

document.addEventListener('DOMContentLoaded', init);
