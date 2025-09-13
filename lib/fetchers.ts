import { db } from "./db";
import { checkpoint } from "./db/schema";
import { eq, and } from "drizzle-orm";

export async function getCurrentCheckpoint(lessonId: string) {
    const current = await db.query.checkpoint.findFirst({
        where: and(eq(checkpoint.lessonId, lessonId), eq(checkpoint.complete, false)),
    });
    return current;
}