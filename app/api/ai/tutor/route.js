import { NextResponse } from "next/server";
import { geminiTutorAIModel } from "../../../../configs/AiModel";
import { getAuthenticatedUser, unauthorizedResponse } from "../../../../lib/auth";
import { checkRateLimit, rateLimitResponse } from "../../../../lib/rateLimit";

export async function POST(req) {
    try {
        const user = await getAuthenticatedUser();
        if (!user || !user.email) {
            return unauthorizedResponse();
        }

        // Rate limit: max 20 tutor questions per minute
        const rateLimitResult = checkRateLimit(`ai-tutor:${user.email}`, { limit: 20, windowMs: 60000 });
        if (!rateLimitResult.success) {
            return rateLimitResponse(rateLimitResult);
        }

        const body = await req.json();
        const { question, chapterTitle = "Study Chapter", contextNotes = "", chatHistory = [] } = body;

        if (!question || typeof question !== "string" || question.trim().length === 0) {
            return NextResponse.json({ error: "A question is required" }, { status: 400 });
        }

        // Sanitize and trim context to prevent prompt overflow
        const trimmedNotes = (contextNotes || "").replace(/<[^>]*>?/gm, ' ').slice(0, 4000);
        
        // Format history snippet
        const historyText = Array.isArray(chatHistory) && chatHistory.length > 0
            ? chatHistory.slice(-4).map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.text}`).join('\n')
            : "No previous messages.";

        const prompt = `
STUDY MATERIAL CONTEXT:
Chapter: "${chapterTitle}"
Notes Summary:
${trimmedNotes}

PREVIOUS CONVERSATION:
${historyText}

CURRENT STUDENT QUESTION:
"${question.trim()}"

Provide a clear, engaging, and directly helpful answer based on the study material. Use bolding, bullet points, and code formatting where appropriate to make the explanation easy to read.`;

        console.log(`🤖 [ai-tutor] User ${user.email} asked: "${question.slice(0, 60)}..."`);
        const result = await geminiTutorAIModel.sendMessage(prompt);
        const answer = await result.response.text();

        return NextResponse.json({
            success: true,
            answer,
        });

    } catch (error) {
        console.error("Error in AI Tutor route:", error);
        return NextResponse.json({ error: "AI Tutor is temporarily unavailable", details: error.message }, { status: 500 });
    }
}
