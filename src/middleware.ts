import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
 
export default createMiddleware(routing);
 
export const config = {
  // Match all pathnames except for
  // - API routes
  // - Static files (_next, images, etc.)
  // - Vercel internals (_vercel)
  // - Files with extensions (favicon.ico, etc.)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
