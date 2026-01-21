import { GenerateQuizAiModel, generateStudyTypeContent } from "../configs/AiModel";
import { generateNotesAiModel } from "../configs/AiModel"; // Use OpenAI-based notes generator
import { inngest } from "./client";
import  db  from "../configs/db";
import { CHAPTER_NOTES_TABLE, STUDY_MATERIAL_TABLE, STUDY_TYPE_CONTENT_TABLE, USER_TABLE } from '../configs/schema';
import {eq} from 'drizzle-orm';


export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hello ${event.data.email}!` };
  }
);

export const CreateNewUser = inngest.createFunction(
  { id: "create-user" },
  { event: "user.create" },
  async ({ event, step }) => {
    //get the event data
    const { user } = event.data;
    const result = await step.run(
      "Check user and crate new user if not in DB",
      async () => {
        const result = await db
          .select()
          .from(USER_TABLE)
          .where(eq(USER_TABLE.email, user?.primaryEmailAddress?.emailAddress));

        if (result?.length == 0) {
          const userResponse = await db
            .insert(USER_TABLE)
            .values({
              name: user?.fullName,
              email: user?.primaryEmailAddress?.emailAddress,
            })
            .returning({ id: USER_TABLE.id });
            return userResponse;
        }
          return result;
    
       })

      //send welcome email;

      //send email notification after 3 days of user creation
    ;
    return "Success"; 
  }
);

export const GenerateNotes = inngest.createFunction(
  { id: "generate-course" },
  { event: "notes.generate" },
  async ({ event, step }) => {
    const { course } = event.data;
    console.log("course here", course);

    try {
      await step.run("Generate Chapter Notes", async () => {
        const Chapters = course?.courseLayout?.chapters || [];

        console.log("chapters in the chaptersss", Chapters);

        for (let index = 0; index < Chapters.length; index++) {
          const chapter = Chapters[index];

          const PROMPT = `
You are a skilled academic content generator.

Generate fully-structured **HTML-based exam preparation notes** based on the following chapter.

### INSTRUCTIONS:
You are given:
- A chapter title
- A chapter summary
- A mapping of topic numbers to topic names

Use this exact structure:

1. Start with the chapter title in an <h2> tag.
2. Follow with the summary in a <p> tag.
3. For each topic (loop through the topic mapping):
   - Create a section with an <h3> heading containing the topic number and title (e.g., "3.1 Recognizing Hunger and Fullness Cues")
   - Provide clear, concise notes in bullet format using <ul><li>...</li></ul>
   - Include examples, strategies, and common misconceptions if applicable
   - Emphasize key terms using <strong>
   - DO NOT SKIP ANY TOPIC
   - Do NOT return anything except HTML (no JSON, no markdown, no headers)

Use only these HTML tags: <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <code>, <pre>

### CHAPTER DATA:
${JSON.stringify(chapter)}

Return only HTML content, nothing else.
`;

          const result = await generateNotesAiModel.sendMessage(PROMPT);
          const aiResp = await result.response.text();

          console.log("ai response", aiResp);
          await db.insert(CHAPTER_NOTES_TABLE).values({
            chapterId: index,
            courseId: course?.courseId,
            notes: aiResp,
          });
        }
        return "Completed";
      });
    } catch (error) {
      console.log("error in the notes generation section", error);
    }

    await step.run("Update Course Status to Ready", async () => {
      await db
        .update(STUDY_MATERIAL_TABLE)
        .set({
          status: "Ready",
        })
        .where(eq(STUDY_MATERIAL_TABLE.courseId, course?.courseId));

      return "Success";
    });
  }
);

export const GenerateStudyTypeContent = inngest.createFunction(
    {id : "Generate Study Type Content"},
    {event : "studyType.content"},
    
    async ({event, step})=>{
      const {studyType,prompt,courseId,recordId} = event.data;
      console.log("🚀 [Inngest] GenerateStudyTypeContent function started");
      console.log("📝 Study Type Content", studyType, prompt, courseId, recordId);
      
      const AiResult = await step.run("Generate Study Content using AI",async()=>{
        console.log("🤖 [Inngest] Starting AI generation step");
        try {
          const result = studyType?.toLowerCase().trim() === "flashcard"
            ? await generateStudyTypeContent.sendMessage(prompt)
            : await GenerateQuizAiModel.sendMessage(prompt);

          let aiResponseText = result.response.text();
          
          aiResponseText = aiResponseText
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/```$/i, "")
            .trim();

          console.log("🔍 [Inngest] Raw AI Response:", aiResponseText);
          
          let AIResult;
          try {
            AIResult = JSON.parse(aiResponseText);
            console.log("[Inngest] AI Response parsed successfully");
          } catch (parseError) {
            console.error("[Inngest] JSON Parse Error:", parseError);
            console.log("[Inngest] Failed to parse:", aiResponseText);
            throw new Error(`Failed to parse AI response as JSON: ${parseError.message}`);
          }
          
          if (Array.isArray(AIResult) && AIResult.length === 0) {
            console.log("[Inngest] AI returned empty array, retrying with simpler prompt...");
            const simplePrompt = studyType?.toLowerCase().trim() === "flashcard"
              ? "Generate 5 basic flashcards about general study topics. Return JSON array with front and back properties."
              : "Generate 5 basic quiz questions about general topics. Return JSON object with questions array.";
              
            const retryResult = studyType?.toLowerCase().trim() === "flashcard"
              ? await generateStudyTypeContent.sendMessage(simplePrompt)
              : await GenerateQuizAiModel.sendMessage(simplePrompt);
              
            let retryText = retryResult.response.text()
              .replace(/^```json\s*/i, "")
              .replace(/^```\s*/i, "")
              .replace(/```$/i, "")
              .trim();
              
            AIResult = JSON.parse(retryText);
            console.log("[Inngest] Retry successful");
          }
          
          console.log("[Inngest] Final AI Result length:", Array.isArray(AIResult) ? AIResult.length : Object.keys(AIResult).length);
          return AIResult;
        } catch (error) {
          console.error("[Inngest] Error in AI generation:", error);
          throw error;
        }
      })

      console.log("[Inngest] Study Content AI result", AiResult);

      const DbResult = await step.run("Save result to DB",async()=>{
           console.log("[Inngest] Starting database update step");
           try {
             console.log("[Inngest] Attempting to save to database:");
             console.log("[Inngest] Record ID:", recordId);
             console.log("[Inngest] Content to save:", JSON.stringify(AiResult));
             console.log("[Inngest] Content length:", JSON.stringify(AiResult).length);
             
             const result = await db.update(STUDY_TYPE_CONTENT_TABLE).set({
              content : AiResult, 
              status : "Ready"
             }).where(eq(STUDY_TYPE_CONTENT_TABLE.id,recordId ));

             console.log("[Inngest] Database update result:", result);
             
             // Verify the update worked by fetching the record
             const verifyResult = await db.select().from(STUDY_TYPE_CONTENT_TABLE).where(eq(STUDY_TYPE_CONTENT_TABLE.id, recordId));
             console.log("[Inngest] Verification - Updated record:", verifyResult[0]);
             
             if (verifyResult[0] && verifyResult[0].status === "Ready") {
               console.log(" [Inngest] Database update successful!");
               return "Data Inserted Successfully";
             } else {
               console.error("[Inngest] Database update verification failed");
               throw new Error("Database update verification failed");
             }
           } catch (error) {
             console.error("[Inngest] Database update error:", error);
             throw error;
           }
      })

      console.log("[Inngest] DbResult", DbResult);
      console.log("[Inngest] GenerateStudyTypeContent function completed successfully");
    }

  )
