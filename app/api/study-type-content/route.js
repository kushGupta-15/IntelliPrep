import { STUDY_TYPE_CONTENT_TABLE } from "../../../configs/schema";
import { inngest } from "../../../inngest/client";
import db from "../../../configs/db";
import { NextResponse } from "next/server";
import { generateStudyTypeContent, GenerateQuizAiModel } from "../../../configs/AiModel";
import { eq } from "drizzle-orm";

export async function POST(req) {
    try {
        const {chapters, courseId, type} = await req.json();
        console.log("Received chapters:", chapters);
        console.log("Chapters type:", typeof chapters);

        if (!courseId) {
            return NextResponse.json({ error: "courseId is required" }, { status: 400 });
        }
        if (!type) {
            return NextResponse.json({ error: "type is required" }, { status: 400 });
        }

        let chaptersText = "";
        
        if (Array.isArray(chapters)) {
            chaptersText = chapters.map(chapter => {
                if (typeof chapter === 'object' && chapter !== null) {
                    const title = chapter.chapter_title || chapter.chapterTitle || 'Untitled Chapter';
                    const summary = chapter.chapter_summary || chapter.chapterSummary || '';
                    const topics = chapter.topics || {};
                    
                    const topicsList = Object.values(topics).join(', ');
                    return `${title}: ${summary}${topicsList ? ` (Topics: ${topicsList})` : ''}`;
                }
                return String(chapter);
            }).filter(Boolean).join("; ");
        } else if (typeof chapters === 'string') {
            chaptersText = chapters.replace(/,+$/, '').replace(/,+/g, ', ');
        } else {
            chaptersText = String(chapters || "General topics");
        }

        chaptersText = chaptersText.replace(/undefined/g, '').replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '');
        
        if (!chaptersText || chaptersText.trim() === '') {
            chaptersText = "General study topics";
        }

        const PROMPT = type === "Flashcard" 
            ? `Generate flashcards for the following topics: ${chaptersText}. Create flashcards in JSON format with "front" and "back" properties. Maximum 15 flashcards. Return only a JSON array of flashcard objects.`
            : `Generate a quiz for the following topics: ${chaptersText}. Create multiple choice questions in JSON format with "questionText", "options" array, and "correctAnswer" properties. Maximum 15 questions. Return only a JSON object with a "questions" array.`;

        console.log("Generated PROMPT:", PROMPT);

        const result = await db.insert(STUDY_TYPE_CONTENT_TABLE).values({
            courseId : courseId,
            type : type,
        }).returning({id : STUDY_TYPE_CONTENT_TABLE.id});

        console.log("Inserted record with ID:", result[0].id);

        let contentGenerated = false;
        
        try {
            const inngestResult = await inngest.send({
                name : 'studyType.content',
                data : {
                    studyType : type,
                    prompt : PROMPT,
                    courseId : courseId,
                    recordId : result[0].id
                }
            });

            console.log("Inngest event sent:", inngestResult);
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (inngestError) {
            console.error("Inngest send error:", inngestError);
        }
        
        const checkResult = await db.select().from(STUDY_TYPE_CONTENT_TABLE).where(eq(STUDY_TYPE_CONTENT_TABLE.id, result[0].id));
        if (checkResult[0] && checkResult[0].status === "Ready") {
            console.log("Inngest processed successfully");
            contentGenerated = true;
        } else {
            console.log("Inngest did not process, falling back to direct generation...");
        }
        
        if (!contentGenerated) {
            try {
                console.log("Starting direct content generation...");
                
                const aiResult = type?.toLowerCase().trim() === "flashcard"
                    ? await generateStudyTypeContent.sendMessage(PROMPT)
                    : await GenerateQuizAiModel.sendMessage(PROMPT);

                let aiResponseText = aiResult.response.text();
                
                aiResponseText = aiResponseText
                    .replace(/^```json\s*/i, "")
                    .replace(/^```\s*/i, "")
                    .replace(/```$/i, "")
                    .trim();

                console.log("🔍 Direct AI Response:", aiResponseText);
                
                const parsedResult = JSON.parse(aiResponseText);
                
                await db.update(STUDY_TYPE_CONTENT_TABLE).set({
                    content: parsedResult,
                    status: "Ready"
                }).where(eq(STUDY_TYPE_CONTENT_TABLE.id, result[0].id));

                console.log("Direct content generation successful");
                contentGenerated = true;
                
            } catch (directError) {
                console.error(" Direct content generation error:", directError);
            }
        }

        return NextResponse.json({id : result[0].id});
    } catch (error) {
        console.error("Error in study-type-content route:", error);
        return NextResponse.json({ 
            error: "Internal Server Error", 
            details: error.message 
        }, { status: 500 });
    }
}