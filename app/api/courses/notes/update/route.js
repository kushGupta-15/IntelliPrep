import { NextResponse } from "next/server";
import db from "../../../../../configs/db";
import { STUDY_MATERIAL_TABLE, CHAPTER_NOTES_TABLE } from "../../../../../configs/schema";
import { eq, and } from "drizzle-orm";
import { getAuthenticatedUser, unauthorizedResponse, forbiddenResponse } from "../../../../../lib/auth";

export async function POST(req) {
    try {
        const user = await getAuthenticatedUser();
        if (!user || !user.email) {
            return unauthorizedResponse();
        }

        const body = await req.json();
        const { courseId, chapterId, notes } = body;

        if (!courseId || chapterId === undefined || notes === undefined) {
            return NextResponse.json({ error: "Missing required fields: courseId, chapterId, notes" }, { status: 400 });
        }

        // Verify course ownership and active status
        const course = await db
            .select({ 
                createdBy: STUDY_MATERIAL_TABLE.createdBy,
                deletedAt: STUDY_MATERIAL_TABLE.deletedAt 
            })
            .from(STUDY_MATERIAL_TABLE)
            .where(eq(STUDY_MATERIAL_TABLE.courseId, courseId));

        if (!course[0] || course[0].deletedAt) {
            return NextResponse.json({ error: "Course not found or deleted" }, { status: 404 });
        }

        if (course[0].createdBy !== user.email) {
            return forbiddenResponse();
        }

        const updated = await db
            .update(CHAPTER_NOTES_TABLE)
            .set({ notes })
            .where(
                and(
                    eq(CHAPTER_NOTES_TABLE.courseId, courseId),
                    eq(CHAPTER_NOTES_TABLE.chapterId, Number(chapterId))
                )
            )
            .returning();

        return NextResponse.json({
            success: true,
            message: "Notes updated successfully",
            updated: updated[0]
        });

    } catch (error) {
        console.error("Error updating chapter notes:", error);
        return NextResponse.json({ error: "Failed to update notes", details: error.message }, { status: 500 });
    }
}
