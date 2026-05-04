import { Inngest } from "inngest";

// INNGEST_DEV=1 only in local .env — never set this on Vercel
const isDev = process.env.INNGEST_DEV === "1";

export const inngest = new Inngest({
  id: "ai-study-gen",
  isDev,
});
