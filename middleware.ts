import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Public routes — no auth required
const isPublicRoute = createRouteMatcher([
  '/',
  '/explore(.*)',
  '/explorer(.*)',
  '/pricing(.*)',
  '/foreclosures(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/login(.*)',
  '/signup(.*)',
  '/forgot-password(.*)',
  '/reset-password(.*)',
  '/terms(.*)',
  '/privacy(.*)',
  '/disclaimer(.*)',
  '/demo.html',
  '/api/explorer/(.*)',
  '/api/beta-signup',
  '/api/health',
  '/api/auctions(.*)',
  '/api/kpis(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
