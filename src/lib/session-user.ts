"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";

export type SessionUser = {
  id: string;
  name: string;
  initials: string;
  color: string;
};

const KEY = "nara_session_user";
let memory: SessionUser | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function read(): SessionUser | null {
  if (memory) return memory;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionUser;
    if (!parsed?.id || !parsed.name) return null;
    memory = parsed;
    return memory;
  } catch {
    return null;
  }
}

export function persistSessionUser(user: SessionUser) {
  memory = user;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(user));
  } catch {
    // private mode / quota
  }
  emit();
}

export function useSessionUser() {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => {
        listeners.delete(onChange);
      };
    },
    read,
    () => null,
  );
}

export function usePersistSessionUser(user: SessionUser) {
  useLayoutEffect(() => {
    persistSessionUser(user);
  }, [user]);
}
