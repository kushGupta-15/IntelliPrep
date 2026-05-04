import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { helloWorld, CreateNewUser, GenerateNotes, GenerateStudyTypeContent } from "../../../inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    helloWorld,
    CreateNewUser,
    GenerateNotes,
    GenerateStudyTypeContent,
  ],
  // In production Inngest uses INNGEST_SIGNING_KEY from env automatically.
  // Explicitly passing it here ensures it's always picked up.
  signingKey: process.env.INNGEST_SIGNING_KEY,
});
