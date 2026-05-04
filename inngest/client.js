import { Inngest } from "inngest";

const isDev = process.env.INNGEST_DEV === "1" || process.env.NODE_ENV === "development";

console.log("[Inngest Client] Configuration:", {
  isDev,
  hasEventKey: !!process.env.INNGEST_EVENT_KEY,
  nodeEnv: process.env.NODE_ENV,
});

export const inngest = new Inngest({
  id: "ai-study-gen",
  isDev,
});
