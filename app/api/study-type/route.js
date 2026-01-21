import { NextResponse } from 'next/server';
import  db  from '../../../configs/db';
import { CHAPTER_NOTES_TABLE, STUDY_TYPE_CONTENT_TABLE } from '../../../configs/schema';
import {  eq,and } from "drizzle-orm"; 

export async function POST(req) {
    try {
        const { courseId, studyType } = await req.json();
        
        if (!courseId) {
            return NextResponse.json({ error: "courseId is required" }, { status: 400 });
        }

        if (studyType === 'ALL') {
            const notes = await db.select().from(CHAPTER_NOTES_TABLE).where(eq(CHAPTER_NOTES_TABLE.courseId, courseId));
            
            const contentList = await db.select().from(STUDY_TYPE_CONTENT_TABLE).where(eq(STUDY_TYPE_CONTENT_TABLE?.courseId,courseId))
            const flashCard = contentList?.find((item) => item.type === "Flashcard");
            const quiz = contentList?.find((item) => item.type === "Quiz");
            const qa = contentList?.find((item) => item.type === "qa")
            
            console.log("contentListhello",flashCard);
            console.log("quiz",quiz);
            console.log("qa",qa);

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
        else if(studyType==="notes"){
            const notes = await db.select().from(CHAPTER_NOTES_TABLE).where(eq(CHAPTER_NOTES_TABLE.courseId, courseId));
            return NextResponse.json(notes);
        }
        else{
            
            const flashcards = await db.select().from(STUDY_TYPE_CONTENT_TABLE).where(and(eq(STUDY_TYPE_CONTENT_TABLE.courseId, courseId), eq(STUDY_TYPE_CONTENT_TABLE.type, studyType)));

            console.log("flashcards", flashcards);
            console.log("Returning flashcard[0]:", flashcards);

            return NextResponse.json(flashcards[0]);
        }
        // return NextResponse.json({ error: "Invalid studyType" }, { status: 400 });

    } catch (error) {
        console.error("Error fetching study material:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
