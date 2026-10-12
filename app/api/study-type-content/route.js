import { STUDY_TYPE_CONTENT_TABLE, STUDY_MATERIAL_TABLE } from "../../../configs/schema";
import { inngest } from "../../../inngest/client";
import db from "../../../configs/db";
import { NextResponse } from "next/server";
import { generateStudyTypeContent, GenerateQuizAiModel } from "../../../configs/AiModel";
import { eq } from "drizzle-orm";
import { getAuthenticatedUser, unauthorizedResponse, forbiddenResponse } from "../../../lib/auth";
import { checkRateLimit, rateLimitResponse } from "../../../lib/rateLimit";

export async function POST(req) {
    try {
        const user = await getAuthenticatedUser();
        if (!user || !user.email) {
            return unauthorizedResponse();
        }

        // Rate limit: max 12 requests per 1 minute per user
        const rateLimitResult = checkRateLimit(`study-type-content:${user.email}`, { limit: 12, windowMs: 60000 });
        if (!rateLimitResult.success) {
            return rateLimitResponse(rateLimitResult);
        }

        const { chapters, courseId, type } = await req.json();

        if (!courseId) {
            return NextResponse.json({ error: "courseId is required" }, { status: 400 });
        }
        if (!type) {
            return NextResponse.json({ error: "type is required" }, { status: 400 });
        }

        // Validate study type
        const normalizedType = type.trim();
        if (!["Flashcard", "Quiz", "qa"].includes(normalizedType)) {
            return NextResponse.json({ error: "Invalid study type" }, { status: 400 });
        }

        // Verify course ownership and ensure active
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
            console.warn(`⛔ [study-type-content] IDOR attempt: ${user.email} tried to generate content for course ${courseId} owned by ${course[0].createdBy}`);
            return forbiddenResponse();
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

        // Limit chapters text length to prevent prompt overflow
        chaptersText = chaptersText.slice(0, 4000);

        const PROMPT = normalizedType === "Flashcard" 
            ? `Generate flashcards for the following topics: ${chaptersText}. Create flashcards in JSON format with "front" and "back" properties. Maximum 15 flashcards. Return only a JSON array of flashcard objects.`
            : `Generate a quiz for the following topics: ${chaptersText}. Create multiple choice questions in JSON format with "questionText", "options" array, and "correctAnswer" properties. Maximum 15 questions. Return only a JSON object with a "questions" array.`;

        const result = await db.insert(STUDY_TYPE_CONTENT_TABLE).values({
            courseId: courseId,
            type: normalizedType,
        }).returning({ id: STUDY_TYPE_CONTENT_TABLE.id });

        console.log(`[study-type-content] Inserted record ID ${result[0].id} for course ${courseId}`);

        let contentGenerated = false;
        
        try {
            const inngestResult = await inngest.send({
                name: 'studyType.content',
                data: {
                    studyType: normalizedType,
                    prompt: PROMPT,
                    courseId: courseId,
                    recordId: result[0].id
                }
            });
            console.log("Inngest event sent:", inngestResult);
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (inngestError) {
            console.error("Inngest send error:", inngestError);
        }
        
        const checkResult = await db.select().from(STUDY_TYPE_CONTENT_TABLE).where(eq(STUDY_TYPE_CONTENT_TABLE.id, result[0].id));
        if (checkResult[0] && checkResult[0].status === "Ready") {
            contentGenerated = true;
        }
        
        if (!contentGenerated) {
            try {
                console.log("[study-type-content] Inngest pending, executing direct content generation...");
                
                const aiResult = normalizedType?.toLowerCase() === "flashcard"
                    ? await generateStudyTypeContent.sendMessage(PROMPT)
                    : await GenerateQuizAiModel.sendMessage(PROMPT);

                let aiResponseText = await aiResult.response.text();
                
                aiResponseText = aiResponseText
                    .replace(/^```json\s*/i, "")
                    .replace(/^```\s*/i, "")
                    .replace(/```$/i, "")
                    .trim();

                const parsedResult = JSON.parse(aiResponseText);
                
                await db.update(STUDY_TYPE_CONTENT_TABLE).set({
                    content: parsedResult,
                    status: "Ready"
                }).where(eq(STUDY_TYPE_CONTENT_TABLE.id, result[0].id));

                console.log("[study-type-content] Direct content generation successful");
            } catch (directError) {
                console.error("Direct content generation error:", directError);
            }
        }

        return NextResponse.json({ id: result[0].id });
    } catch (error) {
        console.error("Error in study-type-content route:", error);
        return NextResponse.json({ 
            error: "Internal Server Error", 
            details: error.message 
        }, { status: 500 });
    }
}