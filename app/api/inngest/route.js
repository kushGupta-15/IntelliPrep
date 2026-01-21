import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { helloWorld , CreateNewUser ,GenerateNotes,GenerateStudyTypeContent} from "../../../inngest/functions";

const INNGEST_SIGNING_KEY = process.env.INNGEST_SIGNING_KEY;
const INNGEST_EVENT_KEY = process.env.INNGEST_EVENT_KEY;

console.log("[Inngest] Configuration:", {
  hasSigningKey: !!INNGEST_SIGNING_KEY,
  hasEventKey: !!INNGEST_EVENT_KEY,
  nodeEnv: process.env.NODE_ENV
});

const serveConfig = {
  client: inngest,
  functions: [
    helloWorld,
    CreateNewUser,
    GenerateNotes,
    GenerateStudyTypeContent
  ],
};

if (INNGEST_SIGNING_KEY) {
  serveConfig.signingKey = INNGEST_SIGNING_KEY;
  console.log("[Inngest] Using signing key for request verification");
} else {
  console.warn("[Inngest] No signing key provided - requests will not be verified");
}

const handler = serve(serveConfig);

export const GET = async (req) => {
  try {
    return await handler.GET(req);
  } catch (error) {
    console.error("[Inngest] GET error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const POST = async (req) => {
  try {
    return await handler.POST(req);
  } catch (error) {
    console.error("[Inngest] POST error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const PUT = async (req) => {
  try {
    console.log("[Inngest] PUT request received");
    
    const clonedReq = req.clone();
    try {
      const body = await clonedReq.text();
      console.log("[Inngest] PUT request body length:", body.length);
      if (body.length === 0) {
        console.warn("[Inngest] PUT request has empty body");
      }
    } catch (bodyError) {
      console.warn("[Inngest] Could not read PUT request body:", bodyError.message);
    }
    
    return await handler.PUT(req);
  } catch (error) {
    console.error("[Inngest] PUT error:", error);
    
    if (error.message.includes("Unexpected end of JSON input")) {
      console.error("[Inngest] JSON parsing error - likely empty or malformed request body");
      return new Response(JSON.stringify({ 
        error: "Invalid JSON in request body",
        details: "Request body is empty or malformed"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
