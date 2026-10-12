import { NextResponse } from "next/server";
import db from "../../../../configs/db";
import { USER_TABLE } from "../../../../configs/schema";
import { eq, sql } from "drizzle-orm";
import { getAuthenticatedUser, unauthorizedResponse, forbiddenResponse } from "../../../../lib/auth";

export async function POST(req) {
    try {
        const authUser = await getAuthenticatedUser();
        if (!authUser || !authUser.email) {
            return unauthorizedResponse();
        }

        const body = await req.json().catch(() => ({}));
        const email = authUser.email; // Derive directly from authenticated session

        if (body.email && body.email !== email) {
            console.warn(`⛔ [credits] Unauthorized credit drain attempt: ${authUser.email} tried to deduct for ${body.email}`);
            return forbiddenResponse();
        }

        // Check current credits first
        const user = await db
            .select({ credits: USER_TABLE.credits })
            .from(USER_TABLE)
            .where(eq(USER_TABLE.email, email));

        if (!user[0]) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const currentCredits = user[0].credits ?? 0;

        if (currentCredits <= 0) {
            return NextResponse.json({ error: "No credits remaining" }, { status: 402 });
        }

        const updated = await db
            .update(USER_TABLE)
            .set({ credits: sql`GREATEST(0, COALESCE(${USER_TABLE.credits}, 0) - 1)` })
            .where(eq(USER_TABLE.email, email))
            .returning({ credits: USER_TABLE.credits });

        console.log(`[credits] Deducted 1 credit from ${email}. Remaining: ${updated[0].credits}`);

        return NextResponse.json({ success: true, credits: updated[0].credits });
    } catch (error) {
        console.error("[credits] deduct error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
