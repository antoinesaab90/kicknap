import { lang } from "next/root-params";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { SavedView, type SavedTexts } from "@/components/cart-view";

export default async function SavedSpacesPage() {
  const currentLang = await lang();
  const dict = await getDictionary();

  const texts: SavedTexts = {
    title: dict.cart.title,
    subtitle: dict.cart.subtitle,
    empty: dict.cart.empty,
    emptyText: dict.cart.emptyText,
    browse: dict.cart.browse,
    remove: dict.cart.remove,
    clearAll: dict.cart.clearAll,
    viewBook: dict.cart.viewBook,
    unavailable: dict.cart.unavailable,
    perHour: dict.space.perHour,
  };

  return <SavedView lang={currentLang} texts={texts} />;
}