import { NextResponse } from "next/server";
import { generateStudyTypeContent, GenerateQuizAiModel } from "../../../configs/AiModel";
import { STUDY_TYPE_CONTENT_TABLE, STUDY_MATERIAL_TABLE } from "../../../configs/schema";
import db from "../../../configs/db";
import { eq } from "drizzle-orm";
import { getAuthenticatedUser, unauthorizedResponse, forbiddenResponse } from "../../../lib/auth";
import { checkRateLimit, rateLimitResponse } from "../../../lib/rateLimit";

export async function POST(req) {
    try {
        const user = await getAuthenticatedUser();
        if (!user || !user.email) {
            return unauthorizedResponse();
        }

        // Rate limit: max 12 direct generation requests per minute
        const rateLimitResult = checkRateLimit(`direct-gen:${user.email}`, { limit: 12, windowMs: 60000 });
        if (!rateLimitResult.success) {
            return rateLimitResponse(rateLimitResult);
        }

        const { recordId, studyType, prompt } = await req.json();
        
        console.log("[Direct] Starting direct content generation for user:", user.email);

        if (!recordId || !studyType || !prompt) {
            return NextResponse.json({ 
                error: "Missing required parameters: recordId, studyType, prompt" 
            }, { status: 400 });
        }

        // Verify that record exists
        const record = await db
            .select()
            .from(STUDY_TYPE_CONTENT_TABLE)
            .where(eq(STUDY_TYPE_CONTENT_TABLE.id, recordId));

        if (!record[0]) {
            return NextResponse.json({ error: "Record not found" }, { status: 404 });
        }

        // Verify that user owns the parent course and course is not deleted
        const course = await db
            .select({ 
                createdBy: STUDY_MATERIAL_TABLE.createdBy,
                deletedAt: STUDY_MATERIAL_TABLE.deletedAt 
            })
            .from(STUDY_MATERIAL_TABLE)
            .where(eq(STUDY_MATERIAL_TABLE.courseId, record[0].courseId));

        if (!course[0] || course[0].deletedAt) {
            return NextResponse.json({ error: "Course not found or deleted" }, { status: 404 });
        }

        if (course[0].createdBy !== user.email) {
            console.warn(`⛔ [Direct] IDOR attempt: ${user.email} tried to generate content for course owned by ${course[0]?.createdBy}`);
            return forbiddenResponse();
        }

        console.log("[Direct] Calling AI model...");
        const result = studyType?.toLowerCase().trim() === "flashcard"
            ? await generateStudyTypeContent.sendMessage(prompt)
            : await GenerateQuizAiModel.sendMessage(prompt);

        let aiResponseText = await result.response.text();
        
        aiResponseText = aiResponseText
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/```$/i, "")
            .trim();

        let AIResult;
        try {
            AIResult = JSON.parse(aiResponseText);
        } catch (parseError) {
            console.error("[Direct] JSON Parse Error:", parseError);
            throw new Error(`Failed to parse AI response as JSON: ${parseError.message}`);
        }

        const updateResult = await db.update(STUDY_TYPE_CONTENT_TABLE).set({
            content: AIResult,
            status: "Ready"
        }).where(eq(STUDY_TYPE_CONTENT_TABLE.id, recordId));

        const verifyResult = await db.select().from(STUDY_TYPE_CONTENT_TABLE).where(eq(STUDY_TYPE_CONTENT_TABLE.id, recordId));

        if (verifyResult[0] && verifyResult[0].status === "Ready") {
            return NextResponse.json({
                success: true,
                message: "Content generated successfully",
                content: AIResult,
                status: "Ready"
            });
        } else {
            throw new Error("Database update verification failed");
        }

    } catch (error) {
        console.error("[Direct] Error in direct content generation:", error);
        return NextResponse.json({
            success: false,
            error: error.message,
            details: "Direct content generation failed"
        }, { status: 500 });
    }
}