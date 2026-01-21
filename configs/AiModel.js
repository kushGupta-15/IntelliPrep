const OpenAI = require("openai");

const openAiApiKey = process.env.OPENAI_API_KEY;

if (!openAiApiKey) {
  throw new Error("Missing OPENAI_API_KEY environment variable for OpenAI.");
}

const openai = new OpenAI({ apiKey: openAiApiKey });

class OpenAIChatAdapter {
  constructor(model, systemPrompt = null) {
    this.model = model;
    this.systemPrompt = systemPrompt;
  }

  async sendMessage(prompt) {
    const messages = [];
    
    if (this.systemPrompt) {
      messages.push({
        role: "system",
        content: this.systemPrompt
      });
    }
    
    messages.push({ role: "user", content: prompt });

    const completion = await openai.chat.completions.create({
      model: this.model,
      messages: messages,
      temperature: 1,
    });

    const text = completion.choices?.[0]?.message?.content || "";

    return {
      response: {
        text: () => text,
      },
    };
  }
}

const openAiModelId = process.env.OPENAI_MODEL_ID || "gpt-4o-mini";

export const courseOutlineAIModel = new OpenAIChatAdapter(
  openAiModelId,
  `You are an expert educational content creator. Generate comprehensive study material outlines in JSON format.

CRITICAL REQUIREMENTS:
- Return ONLY valid JSON, no markdown fences or extra text
- Each chapter MUST have a specific, descriptive title (never generic like "Chapter 1")
- Each chapter MUST have a detailed, informative summary (never "No summary available")
- Include 4-6 chapters maximum
- Each chapter should have 3-5 specific topics

JSON Structure Required:
{
  "course_title": "Specific course title",
  "course_summary": "Detailed course description",
  "emoji": "📚",
  "chapters": [
    {
      "chapter_title": "Specific descriptive title",
      "chapter_summary": "Detailed chapter summary with learning objectives",
      "emoji": "📖",
      "topics": {
        "1": "Specific topic name",
        "2": "Another specific topic"
      }
    }
  ]
}`
);

export const generateStudyTypeContent = new OpenAIChatAdapter(
  openAiModelId,
  "You are a strict JSON API. Generate flashcards in JSON format only. Each flashcard should have 'front' and 'back' properties. Do NOT include ``` fences, markdown, or any extra explanation. Return only valid JSON array of flashcard objects."
);

export const GenerateQuizAiModel = new OpenAIChatAdapter(
  openAiModelId,
  "You are a strict JSON API. Generate quiz questions in JSON format only. Each question should have questionText, options array, and correctAnswer. Do NOT include ``` fences, markdown, or any extra explanation. Return only valid JSON object with questions array."
);

export const generateNotesAiModel = new OpenAIChatAdapter(
  openAiModelId,
  "You generate ONLY HTML exam preparation notes. Return valid HTML only (no markdown, no JSON, no ``` fences). Use proper HTML tags like <h2>, <h3>, <p>, <ul>, <li>, <strong>."
);