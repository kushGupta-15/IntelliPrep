import { NextResponse } from "next/server";
import db from "../../../../configs/db";
import { USER_TABLE } from "../../../../configs/schema";
import { eq } from "drizzle-orm";
import { getAuthenticatedUser, unauthorizedResponse } from "../../../../lib/auth";

// GET /api/user/credits
export async function GET(req) {
    try {
        const authUser = await getAuthenticatedUser();
        if (!authUser || !authUser.email) {
            return unauthorizedResponse();
        }

        const { searchParams } = new URL(req.url);
        const requestedEmail = searchParams.get("email");

        // Enforce that callers can only query their own credits
        const email = authUser.email;
        if (requestedEmail && requestedEmail !== email) {
            console.warn(`[credits] User ${email} attempted to query credits for ${requestedEmail}. Returning self.`);
        }

        let user = await db
            .select({ credits: USER_TABLE.credits, isMember: USER_TABLE.isMember })
            .from(USER_TABLE)
            .where(eq(USER_TABLE.email, email));

        // Auto-provision user in DB if newly signed up
        if (!user[0]) {
            try {
                const newUser = await db
                    .insert(USER_TABLE)
                    .values({
                        name: authUser.name || "User",
                        email: email,
                        credits: 5,
                        isMember: false,
                    })
                    .returning({ credits: USER_TABLE.credits, isMember: USER_TABLE.isMember });
                user = newUser;
            } catch (_) {
                // If race condition created it in parallel
                user = await db
                    .select({ credits: USER_TABLE.credits, isMember: USER_TABLE.isMember })
                    .from(USER_TABLE)
                    .where(eq(USER_TABLE.email, email));
            }
        }

        return NextResponse.json({ 
            credits: user[0]?.credits ?? 5, 
            isMember: Boolean(user[0]?.isMember) 
        });
    } catch (error) {
        console.error("[credits] GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
