import { NextResponse } from "next/server";
import { generateStudyTypeContent, GenerateQuizAiModel } from "../../../configs/AiModel";
import { STUDY_TYPE_CONTENT_TABLE } from "../../../configs/schema";
import db from "../../../configs/db";
import { eq } from "drizzle-orm";

export async function POST(req) {
    try {
        const { recordId, studyType, prompt } = await req.json();
        
        console.log("[Direct] Starting direct content generation");
        console.log("[Direct] Parameters:", { recordId, studyType, prompt });

        if (!recordId || !studyType || !prompt) {
            return NextResponse.json({ 
                error: "Missing required parameters: recordId, studyType, prompt" 
            }, { status: 400 });
        }

        console.log("[Direct] Calling AI model...");
        const result = studyType?.toLowerCase().trim() === "flashcard"
            ? await generateStudyTypeContent.sendMessage(prompt)
            : await GenerateQuizAiModel.sendMessage(prompt);

        let aiResponseText = result.response.text();
        
        aiResponseText = aiResponseText
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/```$/i, "")
            .trim();

        console.log("[Direct] Raw AI Response:", aiResponseText);
        
        let AIResult;
        try {
            AIResult = JSON.parse(aiResponseText);
            console.log("[Direct] AI Response parsed successfully");
        } catch (parseError) {
            console.error("[Direct] JSON Parse Error:", parseError);
            throw new Error(`Failed to parse AI response as JSON: ${parseError.message}`);
        }

        console.log("[Direct] Updating database...");
        const updateResult = await db.update(STUDY_TYPE_CONTENT_TABLE).set({
            content: AIResult,
            status: "Ready"
        }).where(eq(STUDY_TYPE_CONTENT_TABLE.id, recordId));

        console.log("[Direct] Database update result:", updateResult);

        const verifyResult = await db.select().from(STUDY_TYPE_CONTENT_TABLE).where(eq(STUDY_TYPE_CONTENT_TABLE.id, recordId));
        console.log("[Direct] Verification - Updated record:", verifyResult[0]);

        if (verifyResult[0] && verifyResult[0].status === "Ready") {
            console.log("[Direct] Content generation completed successfully!");
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