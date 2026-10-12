import { NextResponse } from "next/server";
import db from "../../../../configs/db";
import { STUDY_MATERIAL_TABLE, CHAPTER_NOTES_TABLE } from "../../../../configs/schema";
import { eq } from "drizzle-orm";
import { getAuthenticatedUser, unauthorizedResponse, forbiddenResponse } from "../../../../lib/auth";

export async function GET(req) {
    try {
        const user = await getAuthenticatedUser();
        if (!user || !user.email) {
            return unauthorizedResponse();
        }

        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get("courseId");

        if (!courseId) {
            return NextResponse.json({ error: "courseId is required" }, { status: 400 });
        }

        const course = await db
            .select()
            .from(STUDY_MATERIAL_TABLE)
            .where(eq(STUDY_MATERIAL_TABLE.courseId, courseId));

        if (!course[0] || course[0].deletedAt) {
            return NextResponse.json({ error: "Course not found or deleted" }, { status: 404 });
        }

        if (course[0].createdBy !== user.email) {
            return forbiddenResponse();
        }

        let courseLayout = course[0].courseLayout;
        if (typeof courseLayout === "string") {
            try {
                courseLayout = JSON.parse(courseLayout);
            } catch (_) {
                courseLayout = {};
            }
        }

        const chapters = courseLayout?.chapters || [];
        const totalChapters = chapters.length;

        // Fetch completed notes count
        const notes = await db
            .select({ id: CHAPTER_NOTES_TABLE.id })
            .from(CHAPTER_NOTES_TABLE)
            .where(eq(CHAPTER_NOTES_TABLE.courseId, courseId));

        const completedChapters = notes.length;

        let progressPercentage = 0;
        if (course[0].status === "Ready") {
            progressPercentage = 100;
        } else if (course[0].status === "Cancelled") {
            progressPercentage = 0;
        } else if (totalChapters > 0) {
            // First 20% is outline creation, remaining 80% is chapter generation
            progressPercentage = Math.min(95, 20 + Math.round((completedChapters / totalChapters) * 75));
        } else {
            progressPercentage = 15;
        }

        return NextResponse.json({
            status: course[0].status,
            totalChapters,
            completedChapters,
            progressPercentage,
            courseTitle: courseLayout?.course_title || course[0].topic,
        });

    } catch (error) {
        console.error("Error fetching course status:", error);
        return NextResponse.json({ error: "Failed to fetch status", details: error.message }, { status: 500 });
    }
}
