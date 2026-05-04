import { courseOutlineAIModel, generateNotesAiModel } from "../../../configs/AiModel"; 
import { NextResponse } from "next/server";
import db from "../../../configs/db";
import { STUDY_MATERIAL_TABLE, CHAPTER_NOTES_TABLE } from "../../../configs/schema";
import { inngest } from "../../../inngest/client";
import { eq } from "drizzle-orm";

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
                    const waitSeconds = waitMatch ? Math.ceil(parseFloat(waitMatch[1])) + 2 : 15;
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

        // Pause between chapters to stay within Groq's TPM limit
        if (index < chapters.length - 1) {
            console.log(`😴 [direct-notes] Waiting 8s before next chapter...`);
            await new Promise(resolve => setTimeout(resolve, 8000));
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
    try {
        const { courseId, topic, studyType, difficultyLevel, createdBy } = await req.json();
        
        console.log("📥 [generate-course-outline] Received Request:", { courseId, topic, studyType, difficultyLevel, createdBy });

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

        console.log("🤖 [generate-course-outline] Calling Groq AI for course outline...");
        const aiStart = Date.now();
        const aiResponse = await courseOutlineAIModel.sendMessage(PROMPT);
        let aiResponseText = await aiResponse.response.text();
        console.log(`✅ [generate-course-outline] AI responded in ${((Date.now() - aiStart) / 1000).toFixed(2)}s`);
        
        aiResponseText = aiResponseText
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/```$/i, "")
          .trim();
          
        console.log("🔍 [generate-course-outline] Cleaned AI Response (first 300 chars):", aiResponseText.substring(0, 300));
        
        const aiResult = JSON.parse(aiResponseText);
        console.log(`📚 [generate-course-outline] Parsed outline: ${aiResult.chapters?.length} chapters`);

        const dbStart = Date.now();
        const dbResult = await db.insert(STUDY_MATERIAL_TABLE).values({
            courseId: courseId,
            courseType: studyType, 
            createdBy: createdBy,
            topic: topic,
            courseLayout: aiResult,  // store as JSON object, not stringified
        }).returning({ resp: STUDY_MATERIAL_TABLE });
        console.log(`💾 [generate-course-outline] Saved to DB in ${((Date.now() - dbStart) / 1000).toFixed(2)}s`);

        const course = dbResult[0].resp;

        // Ensure courseLayout is a parsed object before passing to Inngest / fallback
        if (typeof course.courseLayout === 'string') {
            try { course.courseLayout = JSON.parse(course.courseLayout); } catch (_) {}
        }

        // Try Inngest first — it runs notes generation as a background job
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

        // Fallback: if Inngest is not available, generate notes directly in this request
        if (!inngestOk) {
            console.warn("⚠️  [generate-course-outline] Inngest unavailable — falling back to direct note generation.");
            console.warn("⚠️  To fix this permanently: run `npx inngest-cli@latest dev` in a separate terminal.");
            // Run in background so we can return the response immediately
            generateNotesDirectly(course).catch(err => {
                console.error("❌ [generate-course-outline] Direct notes generation failed:", err?.message);
            });
        }

        console.log(`🏁 [generate-course-outline] Total route time: ${((Date.now() - routeStart) / 1000).toFixed(2)}s`);
        return NextResponse.json({ result: dbResult[0] });

    } catch (error) {
        const msg = error?.message || String(error);
        const isQuota429 = msg.includes("429") || msg.includes("Too Many Requests") || error?.status === 429;
        const isModel404 = msg.includes("404") || msg.includes("not found") || error?.status === 404;

        console.error(`❌ [generate-course-outline] Server Error after ${((Date.now() - routeStart) / 1000).toFixed(2)}s:`, error);

        if (isQuota429) {
            return NextResponse.json(
                { error: "AI quota exceeded", details: msg },
                { status: 429, headers: { "Retry-After": "60" } }
            );
        }

        if (isModel404) {
            return NextResponse.json(
                { error: "AI model not found", details: "The configured AI model ID is invalid." },
                { status: 500 }
            );
        }

        return NextResponse.json({ error: "Internal Server Error", details: msg }, { status: 500 });
    }
}
