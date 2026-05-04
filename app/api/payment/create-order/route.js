import { NextResponse } from "next/server";
import Razorpay from "razorpay";

const PLANS = {
    basic:   { credits: 10, amount: 9900,  label: "Basic"   },  // ₹99
    pro:     { credits: 25, amount: 19900, label: "Pro"     },  // ₹199
    premium: { credits: 50, amount: 34900, label: "Premium" },  // ₹349
};

const razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(req) {
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
            amount:   plan.amount,   // in paise
            currency: "INR",
            receipt:  `receipt_${Date.now()}`,
            notes: {
                email,
                planId,
                credits: plan.credits,
            },
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
