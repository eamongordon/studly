import { db } from "@/lib/db";
import { checkpoint } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function getCurrentCheckpoint(lessonId: string) {
    const current = await db.query.checkpoint.findFirst({
        where: and(eq(checkpoint.lessonId, lessonId), eq(checkpoint.complete, false)),
    });
    return current;
}