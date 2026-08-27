import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { locales } from "./config";
import type { Locale } from "./config";

export type Dictionary = typeof import("./dictionaries/en.json");

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("./dictionaries/en.json").then((m) => m.default),
  nl: () => import("./dictionaries/nl.json").then((m) => m.default),
};

export const hasLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

export async function getDictionaryForLocale(locale: string): Promise<Dictionary> {
  if (!hasLocale(locale)) notFound();
  return dictionaries[locale]();
}

export async function getDictionary(): Promise<Dictionary> {
  const locale = await lang();
  return getDictionaryForLocale(locale);
}