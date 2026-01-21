import { courseOutlineAIModel } from "../../../configs/AiModel"; 
import { NextResponse } from "next/server";
import  db  from "../../../configs/db";
import { STUDY_MATERIAL_TABLE } from "../../../configs/schema";
import { inngest } from "../../../inngest/client";

export async function POST(req) {
    try {
        const { courseId, topic, studyType, difficultyLevel, createdBy } = await req.json();
        
        console.log("Received Request:", { courseId, topic, studyType, difficultyLevel, createdBy });

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

        const aiResponse = await courseOutlineAIModel.sendMessage(PROMPT);
        let aiResponseText = aiResponse.response.text();
        
        aiResponseText = aiResponseText
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/```$/i, "")
          .trim();
          
        console.log("Cleaned AI Response:", aiResponseText);
        
        const aiResult = JSON.parse(aiResponseText);

        const dbResult = await db.insert(STUDY_MATERIAL_TABLE).values({
            courseId: courseId,
            courseType: studyType, 
            createdBy: createdBy,
            topic: topic,
            courseLayout: JSON.stringify(aiResult), 
        }).returning({resp : STUDY_MATERIAL_TABLE});

        console.log("ai response", JSON.stringify(aiResult));

        const result = await inngest.send({
            name : "notes.generate",
            data : {
                course : dbResult[0].resp
            }
        }).catch(inngestError => {
            console.error("Inngest send error:", inngestError);
            console.warn("Continuing without Inngest - notes generation may not work properly");
            return null;
        });
        console.log("course", dbResult[0].resp);

        console.log(result);

        console.log("Database Inserted:", dbResult);

        return NextResponse.json({ result: dbResult[0] });
    } catch (error) {
        const msg = error?.message || String(error);
        const isQuota429 =
          msg.includes("429") || msg.includes("Too Many Requests") || error?.status === 429;
        const isModel404 =
          msg.includes("404") || msg.includes("not found") || error?.status === 404;

        console.error("Server Error:", error);

        if (isQuota429) {
          return NextResponse.json(
            {
              error: "AI quota exceeded",
              details: msg,
            },
            {
              status: 429,
              headers: {
                "Retry-After": "60",
              },
            }
          );
        }

        if (isModel404) {
          return NextResponse.json(
            {
              error: "AI model not found",
              details: "The configured AI model ID is invalid. Please check configs/AiModel.js and use a supported model ID for your provider.",
            },
            { status: 500 }
          );
        }

        return NextResponse.json({ error: "Internal Server Error", details: msg }, { status: 500 });
    }
}
