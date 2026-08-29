"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const STORAGE_KEY = "kicknap-cart";

interface CartValue {
  items: number[];
  count: number;
  has: (id: number) => boolean;
  toggle: (id: number) => void;
  remove: (id: number) => void;
  clear: () => void;
}

function parse(raw: string): number[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((v): v is number => Number.isInteger(v) && v > 0);
    }
  } catch {
    // ignore malformed storage
  }
  return [];
}

function load(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? parse(raw) : [];
  } catch {
    return [];
  }
}

const listeners = new Set<() => void>();
let cached: number[] | null = null;

function getSnapshot(): number[] {
  if (cached === null) cached = load();
  return cached;
}

function persist(next: number[]): void {
  cached = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable — cart lives in memory only
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function toggle(id: number): void {
  const current = getSnapshot();
  persist(current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
}

function remove(id: number): void {
  persist(getSnapshot().filter((x) => x !== id));
}

function clear(): void {
  persist([]);
}

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, () => []);
  const value = useMemo<CartValue>(
    () => ({
      items,
      count: items.length,
      has: (id) => items.includes(id),
      toggle,
      remove,
      clear,
    }),
    [items]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}