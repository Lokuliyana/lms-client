// src/lib/authState.ts

let isLoginOpen = false;
let listeners: Array<(isOpen: boolean) => void> = [];

function notify() {
  for (const fn of listeners) fn(isLoginOpen);
}

export function openLoginDialog() {
  if (isLoginOpen) return;
  isLoginOpen = true;
  notify();
}

export function closeLoginDialog() {
  if (!isLoginOpen) return;
  isLoginOpen = false;
  notify();
}

export function subscribeToLoginDialog(listener: (isOpen: boolean) => void) {
  listeners.push(listener);
  // send initial value
  listener(isLoginOpen);

  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}
