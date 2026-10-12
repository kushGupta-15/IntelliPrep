import { NextResponse } from "next/server";
import db from "../../../../configs/db";
import { STUDY_MATERIAL_TABLE, CHAPTER_NOTES_TABLE } from "../../../../configs/schema";
import { eq } from "drizzle-orm";
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

        // Mark as Cancelled — the Inngest / worker checks this before each chapter
        await db
            .update(STUDY_MATERIAL_TABLE)
            .set({ status: "Cancelled" })
            .where(eq(STUDY_MATERIAL_TABLE.courseId, courseId));

        // Delete any partial notes already written
        const deletedNotes = await db
            .delete(CHAPTER_NOTES_TABLE)
            .where(eq(CHAPTER_NOTES_TABLE.courseId, courseId))
            .returning({ id: CHAPTER_NOTES_TABLE.id });

        console.log(`🛑 [cancel] Course ${courseId} cancelled. Removed ${deletedNotes.length} partial notes.`);

        return NextResponse.json({
            success: true,
            message: "Course generation cancelled",
            deletedNotes: deletedNotes.length,
        });
    } catch (error) {
        console.error("❌ [cancel] Error cancelling course:", error);
        return NextResponse.json(
            { error: "Failed to cancel course", details: error.message },
            { status: 500 }
        );
    }
}
