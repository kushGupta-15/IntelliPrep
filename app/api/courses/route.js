import db from "../../../configs/db";
import { desc, eq, and } from "drizzle-orm"; 
import { NextResponse } from "next/server";
import { STUDY_MATERIAL_TABLE } from "../../../configs/schema";
import { getAuthenticatedUser, unauthorizedResponse, forbiddenResponse } from "../../../lib/auth";

export async function POST(req) {
    try {
        const user = await getAuthenticatedUser();
        if (!user || !user.email) {
            return unauthorizedResponse();
        }

        // Server-enforced identity: only fetch courses for the authenticated user
        const result = await db
            .select()
            .from(STUDY_MATERIAL_TABLE)
            .where(eq(STUDY_MATERIAL_TABLE.createdBy, user.email))
            .orderBy(desc(STUDY_MATERIAL_TABLE.id));

        const parsedResult = result.map(course => {
            if (typeof course.courseLayout === 'string') {
                try {
                    course.courseLayout = JSON.parse(course.courseLayout);
                } catch (error) {
                    console.error("Error parsing courseLayout for course:", course.courseId, error);
                }
            }
            return course;
        });

        return NextResponse.json({ result: parsedResult });
    } catch (error) {
        console.error("Database Error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        const user = await getAuthenticatedUser();
        if (!user || !user.email) {
            return unauthorizedResponse();
        }

        const { searchParams } = new URL(req.url);
        const courseId = searchParams?.get('courseId');

        if (!courseId) {
            return NextResponse.json({ error: "Missing courseId parameter" }, { status: 400 });
        }

        console.log(`[GET /api/courses] Fetching courseId: ${courseId} for user: ${user.email}`);

        const course = await db
            .select()
            .from(STUDY_MATERIAL_TABLE)
            .where(eq(STUDY_MATERIAL_TABLE.courseId, courseId));

        if (!course[0]) {
            console.warn("[GET /api/courses] Course not found:", courseId);
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        // Enforce ownership: user can only view their own courses
        if (course[0].createdBy !== user.email) {
            console.warn(`⛔ [GET /api/courses] IDOR attempt: ${user.email} tried to access course ${courseId} owned by ${course[0].createdBy}`);
            return forbiddenResponse();
        }

        if (typeof course[0].courseLayout === 'string') {
            try {
                course[0].courseLayout = JSON.parse(course[0].courseLayout);
            } catch (error) {
                console.error("[GET /api/courses] Error parsing courseLayout:", error);
            }
        }

        return NextResponse.json({ result: course[0] });
    } catch (error) {
        console.error("[GET /api/courses] Database Error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
