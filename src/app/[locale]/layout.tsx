import 'reflect-metadata';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { cookies } from 'next/headers';
import { COMMIT_HASH } from '@/lib/env';
import { Providers } from '@/components/Providers';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const cookieStore = await cookies();
  const themeValue = cookieStore.get('theme')?.value;
  const theme = themeValue === 'dark' ? 'dark' : 'light';
  const isDark = theme === 'dark';

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
 
  // Enable static rendering
  setRequestLocale(locale);
 
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();
 
  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable} h-full antialiased ${isDark ? 'dark' : ''}`} suppressHydrationWarning>
      <head>
        {!themeValue && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    var theme = 'light';
                    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                      theme = 'dark';
                      document.documentElement.classList.add('dark');
                    }
                    // Persist the choice immediately so it's not "dynamic" on next load
                    document.cookie = "theme=" + theme + "; path=/; max-age=31536000; SameSite=Lax";
                    localStorage.setItem('theme', theme);
                  } catch (e) {}
                })();
              `,
            }}
          />
        )}
      </head>
      <body className="min-h-full flex flex-col bg-bg-light dark:bg-bg-dark">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <Navbar initialTheme={themeValue as 'light' | 'dark' | undefined} />
            <div className="flex-1">
              {children}
            </div>
            <Footer commitHash={COMMIT_HASH} />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
