import { useSyncExternalStore } from "react";

/* Whether the browser thinks it has a network. `navigator.onLine` is only
 * half a promise - true can still mean a captive portal or a dead cell link -
 * but false is reliable, and false is the case worth telling someone about:
 * what they do next won't be saved. A sleeping backend is a different thing
 * (online, just slow), and the requests themselves report that. */

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}
