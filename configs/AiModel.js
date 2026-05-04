const groqApiKey = process.env.GROQ_API_KEY;

if (!groqApiKey) {
  throw new Error("Missing GROQ_API_KEY environment variable for Groq.");
}

const groqModelId = process.env.GROQ_MODEL_ID || "llama-3.3-70b-versatile";

async function callGroqApi(systemPrompt, userPrompt) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${groqApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: groqModelId,
      messages: [
        systemPrompt ? { role: "system", content: systemPrompt } : null,
        { role: "user", content: userPrompt },
      ].filter(Boolean),
      temperature: 1,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`Groq API error ${response.status}: ${body}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";

  return text;
}

class GroqChatAdapter {
  constructor(model, systemPrompt = null) {
    this.model = model;
    this.systemPrompt = systemPrompt;
  }

  async sendMessage(prompt) {
    const text = await callGroqApi(this.systemPrompt, prompt);
    return {
      response: {
        text: async () => text,
      },
    };
  }
}

export const courseOutlineAIModel = new GroqChatAdapter(
  groqModelId,
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

export const generateStudyTypeContent = new GroqChatAdapter(
  groqModelId,
  "You are a strict JSON API. Generate flashcards in JSON format only. Each flashcard should have 'front' and 'back' properties. Do NOT include ``` fences, markdown, or any extra explanation. Return only valid JSON array of flashcard objects."
);

export const GenerateQuizAiModel = new GroqChatAdapter(
  groqModelId,
  "You are a strict JSON API. Generate quiz questions in JSON format only. Each question should have questionText, options array, and correctAnswer. Do NOT include ``` fences, markdown, or any extra explanation. Return only valid JSON object with questions array."
);

export const generateNotesAiModel = new GroqChatAdapter(
  groqModelId,
  "You generate ONLY HTML exam preparation notes. Return valid HTML only (no markdown, no JSON, no ``` fences). Use proper HTML tags like <h2>, <h3>, <p>, <ul>, <li>, <strong>."
);