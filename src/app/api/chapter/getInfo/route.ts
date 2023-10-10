import { prisma } from "@/lib/db"
import { strict_output } from "@/lib/gpt"
import { getTranscript, searchYoutube } from "@/lib/youtube"
import { NextResponse } from "next/server"
import { z } from "zod"


const bodyParser=z.object({
    chapterId:z.string()
})


export async function POST(req:Response,res:Response){
    try {
        const body=await req.json()
        const {chapterId}=bodyParser.parse(body)
        const chapter=await prisma.chapter.findUnique({
            where:{
                id:chapterId,
            }
        })
        if(!chapter){
            return NextResponse.json({succes:false,error:"chapter not found"},{status:404})
        }
        
        const vedeoId=await searchYoutube(chapter.youtubeSearchQuery);
        const transcript=await getTranscript(vedeoId)

        const {summary}:{summary:string}=await strict_output(
            'You are an AI capable of summarising a youtube transcript',
            "summarise in 250 words or less and do not talk of the sponsors or anything unrelated to the main topic, also do not introduce what the summary is about.\n"+transcript,
            {summary:'summary of the transcript'}
        )

        return NextResponse.json({vedeoId,transcript,summary})
    } catch (error) {
        if(error instanceof z.ZodError){
            return NextResponse.json({
              success:false, error:"Invalid body"
            },{status:400})
        }else{
            NextResponse.json({
                success:false, error:"unkown"
            },{status:500})
        }
    }
}