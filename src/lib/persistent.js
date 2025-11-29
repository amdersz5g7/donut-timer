import { writable as svelteWritable, readable as svelteReadable, derived as svelteDerived, get as svelteGet } from 'svelte/store';

// Minimal persistent store helpers that mirror the small API used in App.svelte
// - writable(key, initial): returns a Svelte writable that persists JSON to localStorage
// - readable, derived, get: re-exported from 'svelte/store' for compatibility

export function writable(key, initial) {
  // If localStorage isn't available (SSR), fall back to in-memory
  let hasLocal = typeof localStorage !== 'undefined';
  let start;
  try {
    if (hasLocal) {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        start = JSON.parse(raw);
      } else {
        start = initial;
      }
    } else {
      start = initial;
    }
  } catch (e) {
    start = initial;
  }

  const store = svelteWritable(start);

  // subscribe and persist
  store.subscribe((val) => {
    try {
      if (hasLocal) {
        localStorage.setItem(key, JSON.stringify(val));
      }
    } catch (e) {
      // ignore storage errors
    }
  });

  return store;
}

export const readable = svelteReadable;
export const derived = svelteDerived;
export const get = svelteGet;
