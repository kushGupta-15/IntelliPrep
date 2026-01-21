const OpenAI = require("openai"); 

const openAiApiKey = process.env.OPENAI_API_KEY; 

if (!openAiApiKey) { 
  throw new Error("Missing OPENAI_API_KEY environment variable for OpenAI.");
}

const openai = new OpenAI({ apiKey: openAiApiKey }); 

class OpenAIChatAdapter { 
  constructor(model) { 
    this.model = model; 
  } 

  async sendMessage(prompt) { 
    const completion = await openai.chat.completions.create({ 
      model: this.model, 
      messages: [
        {
          role: "system",
          content:
            "You are a strict JSON API. You must respond with a single valid JSON object only. Do NOT include ``` fences, markdown, or any extra explanation. If you cannot fulfil the request, return a JSON error object.", 
        }, 
        { role: "user", content: prompt },
      ],
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

const openAiModelId =
  process.env.OPENAI_MODEL_ID || "gpt-4.1-mini"; 

module.exports = {
  courseOutlineAIModel: new OpenAIChatAdapter(openAiModelId), 
};


