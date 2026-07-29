import { NextResponse } from "next/server";
import { inngest } from "../../../inngest/client";
import db from "../../../configs/db";
import { USER_TABLE } from "../../../configs/schema";
import { eq } from "drizzle-orm";

export async function POST(req) {
    const body = await req.json();
    const { user } = body;

    console.log("user from create-user", user);

    if (!user?.primaryEmailAddress?.emailAddress) {
        return NextResponse.json({ error: "Missing user email address" }, { status: 400 });
    }

    try {
        const result = await inngest.send({
            name: 'user.create',
            data: {
                user: user,
            },
        });

        console.log('result ', result);
        return NextResponse.json({ result: result });
    } catch (error) {
        console.warn("Inngest unavailable, falling back to direct user creation.", error?.message || error);

        try {
            const email = user.primaryEmailAddress.emailAddress;
            const existingUsers = await db
                .select()
                .from(USER_TABLE)
                .where(eq(USER_TABLE.email, email));

            if (existingUsers.length > 0) {
                console.log('User already exists, returning existing record.');
                return NextResponse.json({
                    result: existingUsers[0],
                    warning: 'Inngest unavailable; returned existing user directly.',
                });
            }

            const createdUser = await db.insert(USER_TABLE).values({
                name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
                email,
            }).returning({ id: USER_TABLE.id, email: USER_TABLE.email, name: USER_TABLE.name });

            console.log('Fallback user created directly:', createdUser);
            return NextResponse.json({
                result: createdUser[0],
                warning: 'Inngest unavailable; user created directly.',
            });
        } catch (dbError) {
            console.error('Fallback direct user creation failed:', dbError);
            return NextResponse.json(
                { error: 'Failed to create user while Inngest is unavailable', details: dbError.message },
                { status: 500 }
            );
        }
    }
}