import { NextResponse } from "next/server";
import { inngest } from "../../../inngest/client";


export async function POST(req){
    const body = await req.json();
    const {user} = body;

    console.log("user from create-user",user);

    const result = await inngest.send({
        name : 'user.create',
        data : {
            user : user,
        }
    })

    console.log('result ', result);

    return NextResponse.json({result : result});
}