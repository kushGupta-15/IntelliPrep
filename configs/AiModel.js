const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey && process.env.NODE_ENV !== "production") {
  console.warn("⚠️ Warning: Missing GEMINI_API_KEY environment variable.");
}

const PRIMARY_MODEL = process.env.GEMINI_MODEL_ID || "gemini-3.5-flash-lite";
const FALLBACK_MODELS = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.5-flash-lite"];

/**
 * Call Gemini API directly via Google Generative Language v1beta endpoint
 */
async function callGeminiApi(systemPrompt, userPrompt, modelName = PRIMARY_MODEL) {
  const apiKey = process.env.GEMINI_API_KEY || geminiApiKey;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable for Gemini.");
  }

  const isJsonExpected = systemPrompt && systemPrompt.toLowerCase().includes("json");

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      ...(isJsonExpected ? { responseMimeType: "application/json" } : {}),
    },
  };

  if (systemPrompt) {
    payload.system_instruction = {
      parts: [{ text: systemPrompt }],
    };
  }

  const modelsToTry = [modelName, ...FALLBACK_MODELS.filter((m) => m !== modelName)];
  let lastError = null;

  for (const currentModel of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const body = await response.text();
          const isRetryable = response.status === 429 || response.status === 503 || response.status === 500;
          const err = new Error(`Gemini API error (${currentModel}) ${response.status}: ${body}`);
          err.status = response.status;
          lastError = err;

          if (isRetryable && attempt < 2) {
            console.warn(`⏳ [Gemini] Model ${currentModel} returned ${response.status}, retrying in 2s...`);
            await new Promise((r) => setTimeout(r, 2000));
            continue;
          }
          // Try next model
          break;
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text || "";
        return text;
      } catch (err) {
        lastError = err;
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
    }
  }

  throw lastError || new Error("Failed to generate content with Gemini API.");
}

class GeminiChatAdapter {
  constructor(model, systemPrompt = null) {
    this.model = model;
    this.systemPrompt = systemPrompt;
  }

  async sendMessage(prompt) {
    const rawText = await callGeminiApi(this.systemPrompt, prompt, this.model);
    return {
      response: {
        text: async () => rawText,
      },
    };
  }
}

export const courseOutlineAIModel = new GeminiChatAdapter(
  PRIMARY_MODEL,
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

export const generateStudyTypeContent = new GeminiChatAdapter(
  PRIMARY_MODEL,
  "You are a strict JSON API. Generate flashcards in JSON format only. Each flashcard should have 'front' and 'back' properties. Do NOT include ``` fences, markdown, or any extra explanation. Return only valid JSON array of flashcard objects."
);

export const GenerateQuizAiModel = new GeminiChatAdapter(
  PRIMARY_MODEL,
  "You are a strict JSON API. Generate quiz questions in JSON format only. Each question should have questionText, options array, and correctAnswer. Do NOT include ``` fences, markdown, or any extra explanation. Return only valid JSON object with questions array."
);

export const generateNotesAiModel = new GeminiChatAdapter(
  PRIMARY_MODEL,
  "You generate ONLY HTML exam preparation notes. Return valid HTML only (no markdown, no JSON, no ``` fences). Use proper HTML tags like <h2>, <h3>, <p>, <ul>, <li>, <strong>."
);