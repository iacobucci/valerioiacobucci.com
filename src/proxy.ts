import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
import { auth } from "@/auth"
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Handle /blog/<lang>/... (e.g. /blog/it/cocktails/vodka-sour -> /it/blog/cocktails/vodka-sour)
  const blogLangMatch = pathname.match(/^\/blog\/(en|it|nl)(\/.*)?$/);
  if (blogLangMatch) {
    const lang = blogLangMatch[1];
    const rest = blogLangMatch[2] || '';
    const redirectUrl = req.nextUrl.clone();
    if (lang === routing.defaultLocale) {
      redirectUrl.pathname = `/blog${rest}`;
    } else {
      redirectUrl.pathname = `/${lang}/blog${rest}`;
    }
    return NextResponse.redirect(redirectUrl);
  }

  // Handle category direct URLs (e.g. /cocktails/vodka-sour -> /blog/cocktails/vodka-sour, /it/cocktails/... -> /it/blog/cocktails/...)
  const categoryMatch = pathname.match(/^(\/(?:en|it|nl))?\/(cocktails|recipes|3d-prints)(\/.*)?$/);
  if (categoryMatch) {
    const langPrefix = categoryMatch[1] || '';
    const category = categoryMatch[2];
    const rest = categoryMatch[3] || '';
    const redirectUrl = req.nextUrl.clone();
    if (langPrefix === `/${routing.defaultLocale}` || !langPrefix) {
      redirectUrl.pathname = `/blog/${category}${rest}`;
    } else {
      redirectUrl.pathname = `${langPrefix}/blog/${category}${rest}`;
    }
    return NextResponse.redirect(redirectUrl);
  }

  // Eseguiamo prima la localizzazione. 
  // Questo gestisce i redirect come / -> /en o /it
  const response = intlMiddleware(req);

  // Poi eseguiamo auth per popolare la sessione nel request header 
  // (necessario per i Server Component) senza forzare redirect
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (auth(async () => {
    return response;
  }) as any)(req, {});
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - API routes
    // - Static files
    '/((?!api|apps|public|_next/static|_next/image|favicon.ico|apple-touch-icon.png|robots.txt|sitemap.xml|.*\\..*).*)',
    '/', 
    '/feed.xml',
    '/(it|en|nl)/:path*'
  ]
};
