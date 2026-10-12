import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { checkRateLimit, rateLimitResponse, getClientIdentifier } from "./lib/rateLimit";

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/create(.*)', '/courses(.*)']);
const isApiRoute = createRouteMatcher(['/api(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // Layer-1 DoS and scraping protection for API endpoints (100 req / min per IP)
  if (isApiRoute(req)) {
    // Webhooks are signature-verified and should never be rate-limited
    if (!req.nextUrl.pathname.startsWith('/api/payment/webhook') && !req.nextUrl.pathname.startsWith('/api/inngest')) {
      const clientId = getClientIdentifier(req);
      const limitResult = checkRateLimit(`global-api:${clientId}`, { limit: 100, windowMs: 60000 });
      if (!limitResult.success) {
        return rateLimitResponse(limitResult);
      }
    }
  }

  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};