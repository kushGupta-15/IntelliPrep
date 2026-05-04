import { NextResponse } from "next/server";

const PLANS = {
    basic:   { credits: 10, amount: 9900,  label: "Basic"   },  // ₹99
    pro:     { credits: 25, amount: 19900, label: "Pro"     },  // ₹199
    premium: { credits: 50, amount: 34900, label: "Premium" },  // ₹349
};

function getRazorpay() {
    const keyId     = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return null;

    // Lazy import so the module doesn't crash at build time when keys are absent
    const Razorpay = require("razorpay");
    return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export async function POST(req) {
    const razorpay = getRazorpay();

    if (!razorpay) {
        return NextResponse.json(
            { error: "Payments are not configured yet. Please add Razorpay keys to enable this feature." },
            { status: 503 }
        );
    }

    try {
        const { planId, email } = await req.json();

        if (!planId || !PLANS[planId]) {
            return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
        }
        if (!email) {
            return NextResponse.json({ error: "email is required" }, { status: 400 });
        }

        const plan = PLANS[planId];

        const order = await razorpay.orders.create({
            amount:   plan.amount,
            currency: "INR",
            receipt:  `receipt_${Date.now()}`,
            notes:    { email, planId, credits: plan.credits },
        });

        console.log(`[payment] Order created: ${order.id} for ${email}, plan: ${planId}`);

        return NextResponse.json({
            orderId:  order.id,
            amount:   order.amount,
            currency: order.currency,
            credits:  plan.credits,
            label:    plan.label,
            keyId:    process.env.RAZORPAY_KEY_ID,
        });
    } catch (error) {
        console.error("[payment] create-order error:", error);
        return NextResponse.json({ error: "Failed to create order", details: error.message }, { status: 500 });
    }
}
