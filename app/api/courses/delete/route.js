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

        const { courseId } = await req.json();
        
        if (!courseId) {
            return NextResponse.json({ error: "courseId is required" }, { status: 400 });
        }

        console.log(`🗑️ [delete] User ${user.email} deleting course: ${courseId}`);

        const existingCourse = await db
            .select()
            .from(STUDY_MATERIAL_TABLE)
            .where(eq(STUDY_MATERIAL_TABLE.courseId, courseId));

        if (existingCourse.length === 0) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        // Enforce ownership: only the creator can delete their course
        if (existingCourse[0].createdBy !== user.email) {
            console.warn(`⛔ [delete] IDOR attempt: ${user.email} tried to delete course ${courseId} owned by ${existingCourse[0].createdBy}`);
            return forbiddenResponse();
        }

        if (existingCourse[0].status === "Generating") {
            return NextResponse.json({ 
                error: "Cannot delete course while it's still generating. Cancel the generation first." 
            }, { status: 400 });
        }        

        const deletedNotes = await db
            .delete(CHAPTER_NOTES_TABLE)
            .where(eq(CHAPTER_NOTES_TABLE.courseId, courseId))
            .returning({ id: CHAPTER_NOTES_TABLE.id });

        const deletedContent = await db
            .delete(STUDY_TYPE_CONTENT_TABLE)
            .where(eq(STUDY_TYPE_CONTENT_TABLE.courseId, courseId))
            .returning({ id: STUDY_TYPE_CONTENT_TABLE.id });

        const deletedCourse = await db
            .delete(STUDY_MATERIAL_TABLE)
            .where(eq(STUDY_MATERIAL_TABLE.courseId, courseId))
            .returning({ 
                id: STUDY_MATERIAL_TABLE.id,
                topic: STUDY_MATERIAL_TABLE.topic 
            });

        console.log("Successfully deleted course:", deletedCourse[0]?.id);

        return NextResponse.json({ 
            success: true,
            message: "Course deleted successfully",
            deletedCourse: deletedCourse[0],
            deletedNotes: deletedNotes.length,
            deletedContent: deletedContent.length
        });

    } catch (error) {
        console.error("Error deleting course:", error);
        return NextResponse.json({ 
            error: "Failed to delete course", 
            details: error.message 
        }, { status: 500 });
    }
}