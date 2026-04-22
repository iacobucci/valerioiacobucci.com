import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
import { auth } from "@/auth"

const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
  return intlMiddleware(req);
})

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Match all pathnames except for
    // - API routes
    // - Static files (_next/static, _next/image, favicon.ico, etc.)
    // - Metadata files (robots.txt, sitemap.xml, etc.)
    '/((?!api|_next/static|_next/image|favicon.ico|apple-touch-icon.png|robots.txt|sitemap.xml).*)',
    '/', 
    '/(it|en|nl)/:path*'
  ]
};
