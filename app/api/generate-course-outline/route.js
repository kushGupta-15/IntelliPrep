import { courseOutlineAIModel, generateNotesAiModel } from "../../../configs/AiModel"; 
import { NextResponse } from "next/server";
import db from "../../../configs/db";
import { STUDY_MATERIAL_TABLE, CHAPTER_NOTES_TABLE, USER_TABLE } from "../../../configs/schema";
import { inngest } from "../../../inngest/client";
import { eq, sql } from "drizzle-orm";
import { getAuthenticatedUser, unauthorizedResponse } from "../../../lib/auth";
import { z } from "zod";

// Input schema validation using Zod
const CreateCourseSchema = z.object({
    courseId: z.string().min(1, "courseId is required").max(100),
    topic: z.string().trim().min(2, "Topic must be at least 2 characters").max(200, "Topic must be 200 characters or less"),
    studyType: z.string().trim().min(1, "Study type is required").max(50),
    difficultyLevel: z.string().trim().min(1, "Difficulty level is required").max(50),
});

// Generates notes for all chapters directly (used as fallback when Inngest is unavailable)
async function generateNotesDirectly(course) {
    const chapters = course?.courseLayout?.chapters || [];
    console.log(`📖 [direct-notes] Generating notes for ${chapters.length} chapters directly...`);

    for (let index = 0; index < chapters.length; index++) {
        const chapter = chapters[index];
        console.log(`⏳ [direct-notes] Chapter ${index + 1}/${chapters.length}: "${chapter?.chapter_title}"`);

        const PROMPT = `
You are a skilled academic content generator.

Generate fully-structured **HTML-based exam preparation notes** based on the following chapter.

### INSTRUCTIONS:
Use this exact structure:
1. Start with the chapter title in an <h2> tag.
2. Follow with the summary in a <p> tag.
3. For each topic: create an <h3> heading, then bullet notes in <ul><li> tags.
   - Emphasize key terms using <strong>
   - DO NOT SKIP ANY TOPIC
   - Return ONLY HTML, no JSON, no markdown

Use only: <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <code>, <pre>

### CHAPTER DATA:
${JSON.stringify(chapter)}

Return only HTML content, nothing else.
`;
        const aiStart = Date.now();
        let aiResp = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const result = await generateNotesAiModel.sendMessage(PROMPT);
                aiResp = await result.response.text();
                break;
            } catch (retryErr) {
                const is429 = retryErr?.status === 429 || retryErr?.message?.includes("429");
                if (is429 && attempt < 3) {
                    const waitMatch = retryErr.message?.match(/try again in ([\d.]+)s/i);
                    const waitSeconds = waitMatch ? Math.ceil(parseFloat(waitMatch[1])) + 2 : 5;
                    console.warn(`⏳ [direct-notes] Rate limited chapter ${index + 1}, attempt ${attempt}/3. Waiting ${waitSeconds}s...`);
                    await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
                } else {
                    throw retryErr;
                }
            }
        }
        console.log(`✅ [direct-notes] Chapter ${index + 1} AI done in ${((Date.now() - aiStart) / 1000).toFixed(2)}s`);

        await db.insert(CHAPTER_NOTES_TABLE).values({
            chapterId: index,
            courseId: course?.courseId,
            notes: aiResp,
        });
        console.log(`💾 [direct-notes] Chapter ${index + 1} saved`);

        // Small pause between chapters
        if (index < chapters.length - 1) {
            console.log(`😴 [direct-notes] Waiting 1s before next chapter...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    await db
        .update(STUDY_MATERIAL_TABLE)
        .set({ status: "Ready" })
        .where(eq(STUDY_MATERIAL_TABLE.courseId, course?.courseId));

    console.log(`🎉 [direct-notes] All chapters done. Course marked Ready.`);
}

export async function POST(req) {
    const routeStart = Date.now();
    let creditDeducted = false;
    let userEmail = null;

    try {
        // 1. Authenticate user server-side
        const authUser = await getAuthenticatedUser();
        if (!authUser || !authUser.email) {
            return unauthorizedResponse();
        }
        userEmail = authUser.email;

        // 2. Validate request payload with Zod
        const rawBody = await req.json();
        const parseResult = CreateCourseSchema.safeParse(rawBody);
        if (!parseResult.success) {
            const firstError = parseResult.error.errors[0]?.message || "Invalid input data";
            return NextResponse.json({ error: firstError, details: parseResult.error.errors }, { status: 400 });
        }

        const { courseId, topic, studyType, difficultyLevel } = parseResult.data;
        console.log("📥 [generate-course-outline] Verified Request:", { courseId, topic, studyType, difficultyLevel, userEmail });

        // 3. Check and deduct credits ATOMICALLY on the server
        let userRecord = await db
            .select({ id: USER_TABLE.id, credits: USER_TABLE.credits })
            .from(USER_TABLE)
            .where(eq(USER_TABLE.email, userEmail));

        if (!userRecord[0]) {
            // Provision user with default 5 credits if not already present
            const created = await db
                .insert(USER_TABLE)
                .values({ name: authUser.name || "User", email: userEmail, credits: 5 })
                .returning({ id: USER_TABLE.id, credits: USER_TABLE.credits });
            userRecord = created;
        }

        const availableCredits = userRecord[0]?.credits ?? 0;
        if (availableCredits <= 0) {
            console.warn(`⛔ [generate-course-outline] User ${userEmail} has insufficient credits (${availableCredits})`);
            return NextResponse.json(
                { error: "Insufficient credits. Please buy more credits to generate a course." },
                { status: 402 }
            );
        }

        // Deduct 1 credit immediately before initiating AI processing
        await db
            .update(USER_TABLE)
            .set({ credits: sql`GREATEST(0, COALESCE(${USER_TABLE.credits}, 0) - 1)` })
            .where(eq(USER_TABLE.email, userEmail));
        creditDeducted = true;
        console.log(`💳 [generate-course-outline] Deducted 1 credit from ${userEmail}. Remaining: ${availableCredits - 1}`);

        // 4. Construct AI prompt
        const PROMPT = `Generate a comprehensive study material for "${topic}" for ${studyType} with difficulty level ${difficultyLevel}.

Return a JSON object with this EXACT structure:
{
  "course_title": "Complete title for the course",
  "course_summary": "Detailed 2-3 sentence summary of what students will learn",
  "emoji": "📚",
  "chapters": [
    {
      "chapter_title": "Specific descriptive chapter title (not just Chapter 1)",
      "chapter_summary": "Detailed 2-3 sentence summary of this chapter's content and learning objectives",
      "emoji": "📖",
      "topics": {
        "1": "First specific topic name",
        "2": "Second specific topic name",
        "3": "Third specific topic name"
      }
    }
  ]
}

Requirements:
- Generate exactly 4-6 chapters maximum
- Each chapter must have a SPECIFIC, DESCRIPTIVE title (not generic like "Chapter 1")
- Each chapter must have a detailed summary explaining what will be covered
- Each chapter should have 3-5 specific topics
- All content should be relevant to "${topic}" and appropriate for ${difficultyLevel} level
- Use appropriate emojis for each chapter

Return ONLY the JSON object, no other text.`;

        console.log("🤖 [generate-course-outline] Calling Gemini AI for course outline...");
        const aiStart = Date.now();
        const aiResponse = await courseOutlineAIModel.sendMessage(PROMPT);
        let aiResponseText = await aiResponse.response.text();
        console.log(`✅ [generate-course-outline] AI responded in ${((Date.now() - aiStart) / 1000).toFixed(2)}s`);
        
        aiResponseText = aiResponseText
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/```$/i, "")
          .trim();
          
        const aiResult = JSON.parse(aiResponseText);
        console.log(`📚 [generate-course-outline] Parsed outline: ${aiResult.chapters?.length} chapters`);

        const dbStart = Date.now();
        const dbResult = await db.insert(STUDY_MATERIAL_TABLE).values({
            courseId: courseId,
            courseType: studyType, 
            createdBy: userEmail, // Enforce authenticated user's email
            topic: topic,
            courseLayout: aiResult,
        }).returning({ resp: STUDY_MATERIAL_TABLE });
        console.log(`💾 [generate-course-outline] Saved to DB in ${((Date.now() - dbStart) / 1000).toFixed(2)}s`);

        const course = dbResult[0].resp;

        if (typeof course.courseLayout === 'string') {
            try { course.courseLayout = JSON.parse(course.courseLayout); } catch (_) {}
        }

        // Try Inngest first for async background notes generation
        console.log("📡 [generate-course-outline] Sending Inngest notes.generate event...");
        const inngestStart = Date.now();
        let inngestOk = false;

        try {
            const inngestResult = await inngest.send({
                name: "notes.generate",
                data: { course },
            });
            if (inngestResult) {
                inngestOk = true;
                console.log(`✅ [generate-course-outline] Inngest event sent in ${((Date.now() - inngestStart) / 1000).toFixed(2)}s`);
            }
        } catch (inngestError) {
            console.error("❌ [generate-course-outline] Inngest send FAILED:", inngestError?.message);
        }

        // Fallback: if Inngest is not running, generate notes directly
        if (!inngestOk) {
            console.warn("⚠️  [generate-course-outline] Inngest unavailable — falling back to direct note generation.");
            generateNotesDirectly(course).catch(err => {
                console.error("❌ [generate-course-outline] Direct notes generation failed:", err?.message);
            });
        }

        console.log(`🏁 [generate-course-outline] Total route time: ${((Date.now() - routeStart) / 1000).toFixed(2)}s`);
        return NextResponse.json({ result: dbResult[0] });

    } catch (error) {
        const msg = error?.message || String(error);
        console.error(`❌ [generate-course-outline] Server Error after ${((Date.now() - routeStart) / 1000).toFixed(2)}s:`, error);

        // Refund the deducted credit if generation failed completely before completion
        if (creditDeducted && userEmail) {
            try {
                await db
                    .update(USER_TABLE)
                    .set({ credits: sql`COALESCE(${USER_TABLE.credits}, 0) + 1` })
                    .where(eq(USER_TABLE.email, userEmail));
                console.log(`↩️ [generate-course-outline] Refunded 1 credit to ${userEmail} due to generation failure.`);
            } catch (refundErr) {
                console.error("❌ [generate-course-outline] Credit refund error:", refundErr?.message);
            }
        }

        const isQuota429 = msg.includes("429") || msg.includes("Too Many Requests") || error?.status === 429;
        if (isQuota429) {
            return NextResponse.json(
                { error: "AI quota exceeded", details: msg },
                { status: 429, headers: { "Retry-After": "60" } }
            );
        }

        return NextResponse.json({ error: "Internal Server Error", details: msg }, { status: 500 });
    }
}
