import  db  from "../../../configs/db";
import { desc, eq } from "drizzle-orm"; 
import { NextResponse } from "next/server";
import { STUDY_MATERIAL_TABLE } from "../../../configs/schema";

export async function POST(req) {
    try {
        const { createdBy } = await req.json();
        
        if (!createdBy) {
            return NextResponse.json({ error: "Missing createdBy field" }, { status: 400 });
        }

        const result = await db
            .select()
            .from(STUDY_MATERIAL_TABLE)
            .where(eq(STUDY_MATERIAL_TABLE.createdBy, createdBy)).orderBy(desc(STUDY_MATERIAL_TABLE.id));

        const parsedResult = result.map(course => {
            if (typeof course.courseLayout === 'string') {
                try {
                    course.courseLayout = JSON.parse(course.courseLayout);
                } catch (error) {
                    console.error("Error parsing courseLayout for course:", course.courseId, error);
                }
            }
            return course;
        });

        return NextResponse.json({ result: parsedResult });
    } catch (error) {
        console.error("Database Error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}

export async function GET(req) {
    const reqURL = req.url;
    const {searchParams} = new URL(reqURL);
    const courseId  = searchParams?.get('courseId');

    const course = await db.select().from(STUDY_MATERIAL_TABLE).where(eq(STUDY_MATERIAL_TABLE?.courseId,courseId));
    
    if (course[0]) {
        if (typeof course[0].courseLayout === 'string') {
            try {
                course[0].courseLayout = JSON.parse(course[0].courseLayout);
            } catch (error) {
                console.error("Error parsing courseLayout:", error);
            }
        }
    }
    
    return NextResponse.json({result : course[0]});
}
