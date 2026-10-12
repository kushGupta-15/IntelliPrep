import { NextResponse } from "next/server";
import db from "../../../../configs/db";
import { STUDY_MATERIAL_TABLE, CHAPTER_NOTES_TABLE, USER_TABLE } from "../../../../configs/schema";
import { eq, sql } from "drizzle-orm";
import { getAuthenticatedUser, unauthorizedResponse, forbiddenResponse } from "../../../../lib/auth";

export async function POST(req) {
    try {
        const user = await getAuthenticatedUser();
        if (!user || !user.email) {
            return unauthorizedResponse();
        }

        const { courseId } = await req.json();

        if (!courseId) {
            return NextResponse.json({ error: "courseId is required" }, { status: 400 });
        }

        console.log(`🛑 [cancel] User ${user.email} cancelling course generation: ${courseId}`);

        const existing = await db
            .select()
            .from(STUDY_MATERIAL_TABLE)
            .where(eq(STUDY_MATERIAL_TABLE.courseId, courseId));

        if (existing.length === 0) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        // Ownership check
        if (existing[0].createdBy !== user.email) {
            console.warn(`⛔ [cancel] IDOR attempt: ${user.email} tried to cancel course ${courseId} owned by ${existing[0].createdBy}`);
            return forbiddenResponse();
        }

        if (existing[0].status !== "Generating") {
            return NextResponse.json(
                { error: `Course is not generating (current status: ${existing[0].status})` },
                { status: 400 }
            );
        }

        // Atomically update status, purge partial notes, and refund credit in a transaction
        let deletedNotesCount = 0;
        await db.transaction(async (tx) => {
            await tx
                .update(STUDY_MATERIAL_TABLE)
                .set({ status: "Cancelled" })
                .where(eq(STUDY_MATERIAL_TABLE.courseId, courseId));

            const notes = await tx
                .delete(CHAPTER_NOTES_TABLE)
                .where(eq(CHAPTER_NOTES_TABLE.courseId, courseId))
                .returning({ id: CHAPTER_NOTES_TABLE.id });
            deletedNotesCount = notes.length;

            // Refund 1 credit for cancelled incomplete course
            await tx
                .update(USER_TABLE)
                .set({ credits: sql`COALESCE(${USER_TABLE.credits}, 0) + 1` })
                .where(eq(USER_TABLE.email, user.email));
        });

        console.log(`🛑 [cancel] Course ${courseId} cancelled and 1 credit refunded to ${user.email}. Removed ${deletedNotesCount} partial notes.`);

        return NextResponse.json({
            success: true,
            message: "Course generation cancelled and credit refunded",
            courseId,
            refunded: true,
            deletedNotes: deletedNotesCount
        });

    } catch (error) {
        console.error("Error cancelling course:", error);
        return NextResponse.json(
            { error: "Failed to cancel course", details: error.message },
            { status: 500 }
        );
    }
}
