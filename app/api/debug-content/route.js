import { NextResponse } from "next/server";
import { STUDY_TYPE_CONTENT_TABLE } from "../../../configs/schema";
import db from "../../../configs/db";
import { eq } from "drizzle-orm";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get('courseId');

        if (!courseId) {
            return NextResponse.json({ error: "courseId parameter is required" }, { status: 400 });
        }

        console.log("🔍 [Debug] Checking database for courseId:", courseId);

        const results = await db.select().from(STUDY_TYPE_CONTENT_TABLE).where(eq(STUDY_TYPE_CONTENT_TABLE.courseId, courseId));

        console.log("[Debug] Database results:", results);

        const formattedResults = results.map(result => ({
            id: result.id,
            courseId: result.courseId,
            type: result.type,
            status: result.status,
            hasContent: result.content !== null,
            contentType: typeof result.content,
            contentPreview: result.content ? (
                Array.isArray(result.content) 
                    ? `Array with ${result.content.length} items`
                    : typeof result.content === 'object'
                        ? `Object with keys: ${Object.keys(result.content).join(', ')}`
                        : String(result.content).substring(0, 100) + '...'
            ) : 'null'
        }));

        return NextResponse.json({
            courseId,
            totalRecords: results.length,
            records: formattedResults,
            rawData: results 
        });

    } catch (error) {
        console.error("[Debug] Error checking database:", error);
        return NextResponse.json({
            error: error.message,
            details: "Failed to check database content"
        }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const { recordId } = await req.json();

        if (!recordId) {
            return NextResponse.json({ error: "recordId is required" }, { status: 400 });
        }

        console.log("🔍 [Debug] Checking specific record:", recordId);

        const result = await db.select().from(STUDY_TYPE_CONTENT_TABLE).where(eq(STUDY_TYPE_CONTENT_TABLE.id, recordId));

        if (result.length === 0) {
            return NextResponse.json({ error: "Record not found" }, { status: 404 });
        }

        return NextResponse.json({
            record: result[0],
            hasContent: result[0].content !== null,
            contentType: typeof result[0].content,
            contentLength: result[0].content ? JSON.stringify(result[0].content).length : 0
        });

    } catch (error) {
        console.error("[Debug] Error checking record:", error);
        return NextResponse.json({
            error: error.message,
            details: "Failed to check record"
        }, { status: 500 });
    }
}