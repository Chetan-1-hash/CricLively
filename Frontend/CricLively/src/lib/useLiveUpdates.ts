import { useEffect, useRef } from "react";
import { WS_URL } from "../API/client";

/**
 * Live updates over a WebSocket.
 *   useLiveUpdates(matchId, reload)  -> reload() runs whenever that match changes
 *   useLiveUpdates("*", reload)      -> reload() runs whenever ANY match changes
 * The server only says "something changed"; reload() fetches the fresh data from the normal API.
 * If the connection drops it reconnects by itself and reloads once, so nothing is missed.
 */
export function useLiveUpdates(target: string, onUpdate: () => void) {
  const latest = useRef(onUpdate);
  useEffect(() => {
    latest.current = onUpdate;
  });

  useEffect(() => {
    if (!target) return;

    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let burstTimer: ReturnType<typeof setTimeout> | undefined;
    let closedByUs = false;
    let attempt = 0;
    let connectedBefore = false;

    const connect = () => {
      socket = new WebSocket(WS_URL);

      socket.onopen = () => {
        socket?.send(`subscribe:${target}`);
        // we may have missed something while the line was down
        if (connectedBefore) latest.current();
        connectedBefore = true;
        attempt = 0;
      };

      socket.onmessage = (event) => {
        if (typeof event.data !== "string" || !event.data.startsWith("update:")) return;
        // several changes in a row (a ball + the totals) -> one reload
        clearTimeout(burstTimer);
        burstTimer = setTimeout(() => latest.current(), 150);
      };

      socket.onclose = () => {
        if (closedByUs) return;
        retryTimer = setTimeout(connect, Math.min(1000 * 2 ** attempt, 15000));
        attempt += 1;
      };

      socket.onerror = () => socket?.close();
    };

    connect();

    return () => {
      closedByUs = true;
      clearTimeout(retryTimer);
      clearTimeout(burstTimer);
      socket?.close();
    };
  }, [target]);
}
