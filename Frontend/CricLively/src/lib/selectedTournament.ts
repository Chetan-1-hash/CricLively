// Remembers which tournament is open, so "/matchesDashboard" still works after
// creating a team or a match, or after a page refresh (the router state is lost then).

const KEY = "criclively.selectedTournament";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function saveSelectedTournament(tournament: any) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(tournament));
  } catch {
    /* storage can be blocked: the page just works without it */
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSelectedTournament(): any | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
