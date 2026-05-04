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
});
