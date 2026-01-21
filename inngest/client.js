import { Inngest } from "inngest";

// Create a client to send and receive events
const INNGEST_EVENT_KEY = process.env.INNGEST_EVENT_KEY;

// Log configuration for debugging
console.log("[Inngest Client] Configuration:", {
  hasEventKey: !!INNGEST_EVENT_KEY,
  nodeEnv: process.env.NODE_ENV
});

if (!INNGEST_EVENT_KEY) {
  console.warn(
    "[Inngest] Missing INNGEST_EVENT_KEY. Create an Inngest app key and set it in .env.local to send events."
  );
}

// Create Inngest client with proper configuration
const inngestConfig = {
  id: "ai-study-gen",
};

// Only add eventKey if it exists
if (INNGEST_EVENT_KEY) {
  inngestConfig.eventKey = INNGEST_EVENT_KEY;
}

export const inngest = new Inngest(inngestConfig);
