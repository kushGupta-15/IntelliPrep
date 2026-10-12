import { NextResponse } from 'next/server';
import db from '../../../configs/db';
import { CHAPTER_NOTES_TABLE, STUDY_MATERIAL_TABLE, STUDY_TYPE_CONTENT_TABLE } from '../../../configs/schema';
import { eq, and } from "drizzle-orm"; 
import { getAuthenticatedUser, unauthorizedResponse, forbiddenResponse } from '../../../lib/auth';

export async function POST(req) {
    try {
        const user = await getAuthenticatedUser();
        if (!user || !user.email) {
            return unauthorizedResponse();
        }

        const { courseId, studyType } = await req.json();
        
        if (!courseId) {
            return NextResponse.json({ error: "courseId is required" }, { status: 400 });
        }

        // Verify ownership and ensure course is active
        const course = await db
            .select({ 
                id: STUDY_MATERIAL_TABLE.id, 
                createdBy: STUDY_MATERIAL_TABLE.createdBy,
                deletedAt: STUDY_MATERIAL_TABLE.deletedAt 
            })
            .from(STUDY_MATERIAL_TABLE)
            .where(eq(STUDY_MATERIAL_TABLE.courseId, courseId));

        if (!course[0] || course[0].deletedAt) {
            return NextResponse.json({ error: "Course not found or deleted" }, { status: 404 });
        }

        if (course[0].createdBy !== user.email) {
            console.warn(`⛔ [study-type] IDOR attempt: ${user.email} tried to access course ${courseId} owned by ${course[0].createdBy}`);
            return forbiddenResponse();
        }

        if (studyType === 'ALL') {
            const notes = await db.select().from(CHAPTER_NOTES_TABLE).where(eq(CHAPTER_NOTES_TABLE.courseId, courseId));
            
            const contentList = await db.select().from(STUDY_TYPE_CONTENT_TABLE).where(eq(STUDY_TYPE_CONTENT_TABLE?.courseId, courseId));
            const flashCard = contentList?.find((item) => item.type === "Flashcard");
            const quiz = contentList?.find((item) => item.type === "Quiz");
            const qa = contentList?.find((item) => item.type === "qa");

            return NextResponse.json({
              result: {
                notes,
                flashCard: flashCard && flashCard.content
                  ? (typeof flashCard.content === 'string' 
                      ? JSON.parse(flashCard.content) 
                      : flashCard.content)
                  : null,
                quiz: quiz && quiz.content
                  ? (typeof quiz.content === 'string' 
                      ? JSON.parse(quiz.content) 
                      : quiz.content)
                  : null,
                qa: qa && qa.content
                  ? (typeof qa.content === 'string' 
                      ? JSON.parse(qa.content) 
                      : qa.content)
                  : null,
              },
            });
        }
        else if (studyType === "notes") {
            const notes = await db.select().from(CHAPTER_NOTES_TABLE).where(eq(CHAPTER_NOTES_TABLE.courseId, courseId));
            return NextResponse.json(notes);
        }
        else {
            const flashcards = await db
                .select()
                .from(STUDY_TYPE_CONTENT_TABLE)
                .where(and(eq(STUDY_TYPE_CONTENT_TABLE.courseId, courseId), eq(STUDY_TYPE_CONTENT_TABLE.type, studyType)));

            return NextResponse.json(flashcards[0] || null);
        }

    } catch (error) {
        console.error("Error fetching study material:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
