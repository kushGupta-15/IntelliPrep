import { NextResponse } from "next/server";
import db from "../../../../configs/db";
import { STUDY_MATERIAL_TABLE, CHAPTER_NOTES_TABLE, STUDY_TYPE_CONTENT_TABLE } from "../../../../configs/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get("courseId");

        if (!courseId) {
            return NextResponse.json({ error: "courseId is required" }, { status: 400 });
        }

        const course = await db
            .select({
                courseId: STUDY_MATERIAL_TABLE.courseId,
                courseType: STUDY_MATERIAL_TABLE.courseType,
                topic: STUDY_MATERIAL_TABLE.topic,
                difficulty: STUDY_MATERIAL_TABLE.difficulty,
                courseLayout: STUDY_MATERIAL_TABLE.courseLayout,
                status: STUDY_MATERIAL_TABLE.status,
                createdAt: STUDY_MATERIAL_TABLE.createdAt,
            })
            .from(STUDY_MATERIAL_TABLE)
            .where(
                and(
                    eq(STUDY_MATERIAL_TABLE.courseId, courseId),
                    isNull(STUDY_MATERIAL_TABLE.deletedAt)
                )
            );

        if (!course[0]) {
            return NextResponse.json({ error: "Course not found or has been removed" }, { status: 404 });
        }

        let parsedLayout = course[0].courseLayout;
        if (typeof parsedLayout === "string") {
            try {
                parsedLayout = JSON.parse(parsedLayout);
            } catch (_) {}
        }
        course[0].courseLayout = parsedLayout;

        // Fetch notes
        const notes = await db
            .select({
                chapterId: CHAPTER_NOTES_TABLE.chapterId,
                notes: CHAPTER_NOTES_TABLE.notes,
            })
            .from(CHAPTER_NOTES_TABLE)
            .where(eq(CHAPTER_NOTES_TABLE.courseId, courseId));

        // Fetch flashcards and quiz content
        const studyContent = await db
            .select({
                type: STUDY_TYPE_CONTENT_TABLE.type,
                content: STUDY_TYPE_CONTENT_TABLE.content,
                status: STUDY_TYPE_CONTENT_TABLE.status,
            })
            .from(STUDY_TYPE_CONTENT_TABLE)
            .where(eq(STUDY_TYPE_CONTENT_TABLE.courseId, courseId));

        const flashcardItem = studyContent.find(c => c.type === "Flashcard");
        const quizItem = studyContent.find(c => c.type === "Quiz");

        let flashCards = null;
        if (flashcardItem?.content) {
            flashCards = typeof flashcardItem.content === "string"
                ? JSON.parse(flashcardItem.content)
                : flashcardItem.content;
        }

        let quiz = null;
        if (quizItem?.content) {
            const parsedQuiz = typeof quizItem.content === "string"
                ? JSON.parse(quizItem.content)
                : quizItem.content;
            quiz = parsedQuiz?.questions || (Array.isArray(parsedQuiz) ? parsedQuiz : null);
        }

        return NextResponse.json({
            course: course[0],
            notes,
            flashCards,
            quiz,
        });

    } catch (error) {
        console.error("Error fetching public course:", error);
        return NextResponse.json({ error: "Failed to load public course", details: error.message }, { status: 500 });
    }
}
