import { NextResponse } from "next/server";
import db from "../../../../configs/db";
import { USER_TABLE } from "../../../../configs/schema";
import { eq } from "drizzle-orm";

// GET /api/user/credits?email=...
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");

        if (!email) {
            return NextResponse.json({ error: "email is required" }, { status: 400 });
        }

        const user = await db
            .select({ credits: USER_TABLE.credits, isMember: USER_TABLE.isMember })
            .from(USER_TABLE)
            .where(eq(USER_TABLE.email, email));

        if (!user[0]) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ credits: user[0].credits ?? 5, isMember: user[0].isMember });
    } catch (error) {
        console.error("[credits] GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
