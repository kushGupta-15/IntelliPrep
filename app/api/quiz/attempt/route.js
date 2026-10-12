import { NextResponse } from "next/server";
import db from "../../../../configs/db";
import { QUIZ_ATTEMPTS_TABLE, STUDY_MATERIAL_TABLE } from "../../../../configs/schema";
import { eq, and, desc } from "drizzle-orm";
import { getAuthenticatedUser, unauthorizedResponse, forbiddenResponse } from "../../../../lib/auth";

export async function POST(req) {
    try {
        const user = await getAuthenticatedUser();
        if (!user || !user.email) {
            return unauthorizedResponse();
        }

        const body = await req.json();
        const { courseId, score, totalQuestions, answers } = body;

        if (!courseId || typeof score !== "number" || typeof totalQuestions !== "number") {
            return NextResponse.json({ error: "Missing required fields: courseId, score, totalQuestions" }, { status: 400 });
        }

        // Verify parent course ownership and active status
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

        const inserted = await db.insert(QUIZ_ATTEMPTS_TABLE).values({
            courseId,
            userEmail: user.email,
            score,
            totalQuestions,
            answersJSON: answers || {},
        }).returning();

        return NextResponse.json({
            success: true,
            attempt: inserted[0]
        });

    } catch (error) {
        console.error("Error saving quiz attempt:", error);
        return NextResponse.json({ error: "Failed to save quiz attempt", details: error.message }, { status: 500 });
    }
}

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

        // Verify parent course ownership
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

        const attempts = await db
            .select()
            .from(QUIZ_ATTEMPTS_TABLE)
            .where(
                and(
                    eq(QUIZ_ATTEMPTS_TABLE.courseId, courseId),
                    eq(QUIZ_ATTEMPTS_TABLE.userEmail, user.email)
                )
            )
            .orderBy(desc(QUIZ_ATTEMPTS_TABLE.id))
            .limit(10);

        const bestScore = attempts.length > 0
            ? Math.max(...attempts.map(a => a.score))
            : null;

        return NextResponse.json({
            attempts,
            bestScore,
            totalAttempts: attempts.length
        });

    } catch (error) {
        console.error("Error fetching quiz attempts:", error);
        return NextResponse.json({ error: "Failed to fetch quiz attempts", details: error.message }, { status: 500 });
    }
}
