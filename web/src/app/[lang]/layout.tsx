import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { locales } from "@/lib/i18n/config";
import { hasLocale, getDictionaryForLocale } from "@/lib/i18n/dictionaries";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ lang: locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};

  const dict = await getDictionaryForLocale(lang);

  return {
    title: dict.meta.title,
    description: dict.meta.description,
    metadataBase: new URL("https://kicknap.com"),
    alternates: {
      canonical: `/${lang}`,
      languages: {
        en: "/en",
        nl: "/nl",
      },
    },
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.ogDescription,
      url: `https://kicknap.com/${lang}`,
      siteName: "kicknap",
      type: "website",
      locale: lang === "nl" ? "nl_NL" : "en_GB",
    },
    icons: {
      icon: [
        { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: "/apple-touch-icon.png",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#1d263b",
  width: "device-width",
  initialScale: 1,
};

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const dict = await getDictionaryForLocale(lang);

  return (
    <html lang={lang} className={`${inter.variable} scroll-smooth`}>
      <body className="min-h-screen font-sans">
        <Header lang={lang} dict={dict} />
        <main className="flex-1">{children}</main>
        <Footer lang={lang} dict={dict} />
      </body>
    </html>
  );
}