import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Retrieves the currently authenticated user from Clerk server session.
 * Returns { id, email, name } or null if not authenticated.
 */
export async function getAuthenticatedUser() {
  try {
    const user = await currentUser();
    if (!user) {
      return null;
    }

    const email =
      user.emailAddresses?.[0]?.emailAddress ||
      user.primaryEmailAddress?.emailAddress ||
      null;

    return {
      id: user.id,
      email,
      name:
        user.fullName ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        "User",
    };
  } catch (error) {
    console.error("[auth] Failed to retrieve authenticated user:", error?.message || error);
    return null;
  }
}

/**
 * Guard utility for API routes. Returns an unauthorized NextResponse if user is null.
 */
export function unauthorizedResponse(message = "Unauthorized. Please sign in.") {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Guard utility for API routes when user is not authorized to access a specific resource.
 */
export function forbiddenResponse(message = "Forbidden. You do not have permission to access this resource.") {
  return NextResponse.json({ error: message }, { status: 403 });
}
