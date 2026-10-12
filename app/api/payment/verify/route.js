import { NextResponse } from "next/server";
import Stripe from "stripe";
import db from "../../../../configs/db";
import { USER_TABLE } from "../../../../configs/schema";
import { eq, sql } from "drizzle-orm";
import { getAuthenticatedUser, unauthorizedResponse, forbiddenResponse } from "../../../../lib/auth";

const stripeApiKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeApiKey ? new Stripe(stripeApiKey) : null;

export async function POST(req) {
    if (!stripe) {
        return NextResponse.json(
            { error: "Stripe payments are not configured." },
            { status: 503 }
        );
    }

    try {
        const authUser = await getAuthenticatedUser();
        if (!authUser || !authUser.email) {
            return unauthorizedResponse();
        }

        const { sessionId } = await req.json();

        if (!sessionId) {
            return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        if (session.payment_status !== "paid") {
            return NextResponse.json(
                { error: "Payment not completed", payment_status: session.payment_status },
                { status: 400 }
            );
        }

        const email = session.metadata?.email || session.customer_email;
        const credits = Number(session.metadata?.credits || 0);

        if (!email || !credits) {
            return NextResponse.json({ error: "Missing metadata in session" }, { status: 400 });
        }

        // Verify that the caller is the owner of the payment session
        if (email !== authUser.email) {
            console.warn(`⛔ [stripe-verify] IDOR attempt: ${authUser.email} tried to verify session for ${email}`);
            return forbiddenResponse();
        }

        // Check if this session was already processed to prevent duplicate credits
        if (session.metadata?.processed === "true") {
            const existingUser = await db
                .select({ credits: USER_TABLE.credits })
                .from(USER_TABLE)
                .where(eq(USER_TABLE.email, email));

            return NextResponse.json({
                success: true,
                alreadyProcessed: true,
                credits: existingUser[0]?.credits,
            });
        }

        console.log(`[stripe] ✅ Verified session: ${session.id} for ${email}, adding ${credits} credits`);

        const updated = await db
            .update(USER_TABLE)
            .set({
                credits:  sql`COALESCE(${USER_TABLE.credits}, 0) + ${Number(credits)}`,
                isMember: true,
            })
            .where(eq(USER_TABLE.email, email))
            .returning({ credits: USER_TABLE.credits });

        if (!updated[0]) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        console.log(`[stripe] 💳 New balance for ${email}: ${updated[0].credits}`);

        return NextResponse.json({
            success: true,
            credits: updated[0].credits,
            sessionId: session.id,
        });
    } catch (error) {
        console.error("[stripe] verify error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
