import { NextResponse } from "next/server";
import { inngest } from "../../../inngest/client";
import db from "../../../configs/db";
import { USER_TABLE } from "../../../configs/schema";
import { eq } from "drizzle-orm";
import { getAuthenticatedUser, unauthorizedResponse } from "../../../lib/auth";

export async function POST(req) {
    const authUser = await getAuthenticatedUser();
    if (!authUser || !authUser.email) {
        return unauthorizedResponse();
    }

    const body = await req.json().catch(() => ({}));
    const user = body.user || {
        primaryEmailAddress: { emailAddress: authUser.email },
        fullName: authUser.name,
    };

    const email = authUser.email; // Server-derived identity

    try {
        const result = await inngest.send({
            name: 'user.create',
            data: {
                user: {
                    ...user,
                    primaryEmailAddress: { emailAddress: email },
                },
            },
        });

        return NextResponse.json({ result: result });
    } catch (error) {
        console.warn("Inngest unavailable, falling back to direct user creation.", error?.message || error);

        try {
            const existingUsers = await db
                .select()
                .from(USER_TABLE)
                .where(eq(USER_TABLE.email, email));

            if (existingUsers.length > 0) {
                return NextResponse.json({
                    result: existingUsers[0],
                });
            }

            const createdUser = await db.insert(USER_TABLE).values({
                name: authUser.name || 'User',
                email,
                credits: 5,
            }).returning({ id: USER_TABLE.id, email: USER_TABLE.email, name: USER_TABLE.name });

            return NextResponse.json({
                result: createdUser[0],
            });
        } catch (dbError) {
            console.error('Fallback direct user creation failed:', dbError);
            return NextResponse.json(
                { error: 'Failed to create user', details: dbError.message },
                { status: 500 }
            );
        }
    }
}