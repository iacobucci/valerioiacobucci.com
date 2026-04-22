import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
import { auth } from "@/auth"
import { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(req: NextRequest) {
  // Eseguiamo prima la localizzazione. 
  // Questo gestisce i redirect come / -> /en o /it
  const response = intlMiddleware(req);

  // Poi eseguiamo auth per popolare la sessione nel request header 
  // (necessario per i Server Component) senza forzare redirect
  return auth(async (authReq) => {
    return response;
  })(req as any, {} as any);
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - API routes
    // - Static files
    '/((?!api|_next/static|_next/image|favicon.ico|apple-touch-icon.png|robots.txt|sitemap.xml|.*\\..*).*)',
    '/', 
    '/(it|en|nl)/:path*'
  ]
};
