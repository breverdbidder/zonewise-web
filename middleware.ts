import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/api/health(.*)',
  '/api/zoning-chat(.*)',
  '/api/zoning-report(.*)',
  '/api/bcpao-lookup(.*)',
  '/api/bcpao-photo(.*)',
  '/api/zoning-report(.*)',
  '/api/auctions(.*)',
  '/',
  '/chat(.*)',
  '/report(.*)',
  '/pricing(.*)',
  '/help(.*)',
  '/docs(.*)',
  '/explorer(.*)',
  '/massing(.*)',
  '/conquest(.*)',
  '/report(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
