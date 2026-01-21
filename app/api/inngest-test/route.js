import { NextResponse } from "next/server";
import { inngest } from "../../../inngest/client";

export async function GET() {
    try {
        const testEvent = await inngest.send({
            name: "test/hello.world",
            data: {
                email: "test@example.com",
                timestamp: new Date().toISOString()
            }
        });

        return NextResponse.json({
            success: true,
            message: "Inngest test event sent successfully",
            eventId: testEvent?.ids?.[0] || "unknown"
        });
    } catch (error) {
        console.error("Inngest test error:", error);
        return NextResponse.json({
            success: false,
            error: error.message,
            details: "Inngest configuration may be incorrect"
        }, { status: 500 });
    }
}

export async function POST() {
    return NextResponse.json({
        message: "Use GET method to test Inngest connectivity"
    }, { status: 405 });
}