
const OpenAI = require("openai"); 

const openAiApiKey = process.env.OPENAI_API_KEY;

if (!openAiApiKey) { 
  console.warn("[OpenAiNotesModel] Missing OPENAI_API_KEY — OpenAI notes model will not work. Using Groq as primary.");
} 

const openai = openAiApiKey ? new OpenAI({ apiKey: openAiApiKey }) : null;

class OpenAINotesAdapter { 
  constructor(model) { 
    this.model = model; 
  } 

  async sendMessage(prompt) { 
    if (!openai) {
      throw new Error("[OpenAiNotesModel] OpenAI client not initialized — OPENAI_API_KEY is missing.");
    }
    const completion = await openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content:
            "You generate ONLY HTML exam preparation notes. Return valid HTML only (no markdown, no JSON, no ``` fences).",
        },
        { role: "user", content: prompt }, 
      ],
      temperature: 1, 
    }); 

    const text = completion.choices?.[0]?.message?.content || ""; 

    return {
      response: {
        text: async () => text, 
      },
    }; 
  }
} 

const notesModelId = process.env.OPENAI_NOTES_MODEL_ID || process.env.OPENAI_MODEL_ID || "gpt-4.1-mini"; 

module.exports = {
  generateNotesAiModel: new OpenAINotesAdapter(notesModelId), 
};


