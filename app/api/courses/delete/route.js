import { NextResponse } from "next/server";
import db from "../../../../configs/db";
import { STUDY_MATERIAL_TABLE, CHAPTER_NOTES_TABLE, STUDY_TYPE_CONTENT_TABLE } from "../../../../configs/schema";
import { eq } from "drizzle-orm";
import { getAuthenticatedUser, unauthorizedResponse, forbiddenResponse } from "../../../../lib/auth";

export async function DELETE(req) {
    try {
        const user = await getAuthenticatedUser();
        if (!user || !user.email) {
            return unauthorizedResponse();
        }

        const body = await req.json();
        const { courseId, permanent = false, action } = body;
        
        if (!courseId) {
            return NextResponse.json({ error: "courseId is required" }, { status: 400 });
        }

        console.log(`🗑️ [delete] User ${user.email} action "${action || (permanent ? 'permanent-delete' : 'soft-delete')}" on course: ${courseId}`);

        const existingCourse = await db
            .select()
            .from(STUDY_MATERIAL_TABLE)
            .where(eq(STUDY_MATERIAL_TABLE.courseId, courseId));

        if (existingCourse.length === 0) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        // Enforce ownership: only the creator can delete/restore their course
        if (existingCourse[0].createdBy !== user.email) {
            console.warn(`⛔ [delete] IDOR attempt: ${user.email} tried to delete course ${courseId} owned by ${existingCourse[0].createdBy}`);
            return forbiddenResponse();
        }

        // Action: Restore soft-deleted course
        if (action === "restore") {
            const restored = await db
                .update(STUDY_MATERIAL_TABLE)
                .set({ deletedAt: null })
                .where(eq(STUDY_MATERIAL_TABLE.courseId, courseId))
                .returning({ id: STUDY_MATERIAL_TABLE.id, topic: STUDY_MATERIAL_TABLE.topic });

            return NextResponse.json({
                success: true,
                message: "Course restored successfully",
                restoredCourse: restored[0],
            });
        }

        if (existingCourse[0].status === "Generating") {
            return NextResponse.json({ 
                error: "Cannot delete course while it's still generating. Cancel the generation first." 
            }, { status: 400 });
        }

        // Permanent hard delete with atomic transaction across all related tables
        if (permanent) {
            let deletedNotesCount = 0;
            let deletedContentCount = 0;
            let deletedCourseRecord = null;

            await db.transaction(async (tx) => {
                const notes = await tx
                    .delete(CHAPTER_NOTES_TABLE)
                    .where(eq(CHAPTER_NOTES_TABLE.courseId, courseId))
                    .returning({ id: CHAPTER_NOTES_TABLE.id });
                deletedNotesCount = notes.length;

                const content = await tx
                    .delete(STUDY_TYPE_CONTENT_TABLE)
                    .where(eq(STUDY_TYPE_CONTENT_TABLE.courseId, courseId))
                    .returning({ id: STUDY_TYPE_CONTENT_TABLE.id });
                deletedContentCount = content.length;

                const course = await tx
                    .delete(STUDY_MATERIAL_TABLE)
                    .where(eq(STUDY_MATERIAL_TABLE.courseId, courseId))
                    .returning({ 
                        id: STUDY_MATERIAL_TABLE.id,
                        topic: STUDY_MATERIAL_TABLE.topic 
                    });
                deletedCourseRecord = course[0];
            });

            console.log("Permanently deleted course in atomic transaction:", deletedCourseRecord?.id);

            return NextResponse.json({ 
                success: true,
                message: "Course permanently deleted",
                deletedCourse: deletedCourseRecord,
                deletedNotes: deletedNotesCount,
                deletedContent: deletedContentCount,
                permanent: true
            });
        }

        // Default: Soft Delete (reversible, preserves data integrity)
        const softDeleted = await db
            .update(STUDY_MATERIAL_TABLE)
            .set({ deletedAt: new Date() })
            .where(eq(STUDY_MATERIAL_TABLE.courseId, courseId))
            .returning({ 
                id: STUDY_MATERIAL_TABLE.id, 
                topic: STUDY_MATERIAL_TABLE.topic,
                deletedAt: STUDY_MATERIAL_TABLE.deletedAt 
            });

        console.log("Successfully soft-deleted course:", softDeleted[0]?.id);

        return NextResponse.json({ 
            success: true,
            message: "Course moved to trash (soft deleted)",
            deletedCourse: softDeleted[0],
            softDeleted: true
        });

    } catch (error) {
        console.error("Error deleting course:", error);
        return NextResponse.json({ 
            error: "Failed to delete course", 
            details: error.message 
        }, { status: 500 });
    }
}