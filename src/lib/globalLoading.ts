// src/lib/globalLoading.ts

let activeCount = 0;
let listeners: Array<(count: number) => void> = [];

function notify() {
  for (const fn of listeners) fn(activeCount);
}

export function startGlobalLoading() {
  activeCount += 1;
  notify();
}

export function stopGlobalLoading() {
  activeCount = Math.max(0, activeCount - 1);
  notify();
}

export function subscribe(listener: (count: number) => void) {
  listeners.push(listener);
  // send initial value
  listener(activeCount);

  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}
