import { API_URL } from "../API/client";

// Counts the requests to our server that are still running, so one small spinner can show
// whenever ANY page waits for data. Imported once, in main.tsx.
let active = 0;
const listeners = new Set<(n: number) => void>();

export function subscribeLoading(fn: (n: number) => void): () => void {
  listeners.add(fn);
  fn(active);
  return () => {
    listeners.delete(fn);
  };
}

function bump(by: number) {
  active = Math.max(active + by, 0);
  listeners.forEach((fn) => fn(active));
}

const w = window as unknown as { __criclivelyFetchPatched?: boolean };
if (!w.__criclivelyFetchPatched) {
  w.__criclivelyFetchPatched = true;
  const original = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const track = url.startsWith(API_URL);
    if (track) bump(1);
    try {
      return await original(input, init);
    } finally {
      if (track) bump(-1);
    }
  };
}
