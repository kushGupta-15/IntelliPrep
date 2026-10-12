import { NextResponse } from "next/server";
import Stripe from "stripe";
import db from "../../../../configs/db";
import { USER_TABLE } from "../../../../configs/schema";
import { eq, sql } from "drizzle-orm";

const stripeApiKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeApiKey ? new Stripe(stripeApiKey) : null;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
    if (!stripe || !webhookSecret) {
        return NextResponse.json(
            { error: "Stripe webhook not configured." },
            { status: 503 }
        );
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
        return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
    }

    let event;
    try {
        const rawBody = await req.text();
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
        console.error("[stripe-webhook] Signature verification failed:", err.message);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    console.log(`[stripe-webhook] Received event: ${event.type} (${event.id})`);

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        if (session.payment_status === "paid") {
            const email = session.metadata?.email || session.customer_email;
            const credits = Number(session.metadata?.credits || 0);

            if (email && credits > 0) {
                console.log(`[stripe-webhook] ✅ Crediting ${credits} credits to ${email} for session ${session.id}`);
                await db
                    .update(USER_TABLE)
                    .set({
                        credits:  sql`COALESCE(${USER_TABLE.credits}, 0) + ${Number(credits)}`,
                        isMember: true,
                    })
                    .where(eq(USER_TABLE.email, email));
            }
        }
    }

    return NextResponse.json({ received: true });
}
