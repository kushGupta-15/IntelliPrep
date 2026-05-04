import { NextResponse } from "next/server";
import crypto from "crypto";
import db from "../../../../configs/db";
import { USER_TABLE } from "../../../../configs/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(req) {
    if (!process.env.RAZORPAY_KEY_SECRET) {
        return NextResponse.json(
            { error: "Payments are not configured yet." },
            { status: 503 }
        );
    }

    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email, credits } = await req.json();

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !email || !credits) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Verify Razorpay signature
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            console.error("[payment] Signature mismatch for order:", razorpay_order_id);
            return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
        }

        console.log(`[payment] ✅ Verified: ${razorpay_payment_id} for ${email}, adding ${credits} credits`);

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

        console.log(`[payment] 💳 New balance for ${email}: ${updated[0].credits}`);

        return NextResponse.json({
            success:   true,
            credits:   updated[0].credits,
            paymentId: razorpay_payment_id,
        });
    } catch (error) {
        console.error("[payment] verify error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
