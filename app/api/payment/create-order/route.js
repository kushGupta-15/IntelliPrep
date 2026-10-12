import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getAuthenticatedUser, unauthorizedResponse } from "../../../../lib/auth";

const stripeApiKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeApiKey ? new Stripe(stripeApiKey) : null;

const PLANS = {
    basic:   { credits: 10, amount: 9900,  label: "Basic"   },  // ₹99
    pro:     { credits: 25, amount: 19900, label: "Pro"     },  // ₹199
    premium: { credits: 50, amount: 34900, label: "Premium" },  // ₹349
};

export async function POST(req) {
    if (!stripe) {
        return NextResponse.json(
            { error: "Stripe payments are not configured yet. Please add STRIPE_SECRET_KEY." },
            { status: 503 }
        );
    }

    try {
        const authUser = await getAuthenticatedUser();
        if (!authUser || !authUser.email) {
            return unauthorizedResponse();
        }

        const { planId } = await req.json();

        if (!planId || !PLANS[planId]) {
            return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
        }

        const email = authUser.email; // Server-derived identity
        const plan = PLANS[planId];
        const origin = req.headers.get("origin") || req.headers.get("referer") || "http://localhost:3000";
        const baseUrl = new URL(origin).origin;

        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            customer_email: email,
            line_items: [
                {
                    price_data: {
                        currency: "inr",
                        product_data: {
                            name: `IntelliPrep ${plan.label} Plan`,
                            description: `${plan.credits} Course Generation Credits`,
                        },
                        unit_amount: plan.amount,
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                email,
                planId,
                credits: String(plan.credits),
            },
            success_url: `${baseUrl}/dashboard/upgrade?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/dashboard/upgrade?canceled=true`,
        });

        console.log(`[stripe] Checkout session created: ${session.id} for ${email}, plan: ${planId}`);

        return NextResponse.json({
            sessionId: session.id,
            url:       session.url,
            amount:    plan.amount,
            currency:  "inr",
            credits:   plan.credits,
            label:     plan.label,
        });
    } catch (error) {
        console.error("[stripe] create-order error:", error);
        return NextResponse.json({ error: "Failed to create checkout session", details: error.message }, { status: 500 });
    }
}
