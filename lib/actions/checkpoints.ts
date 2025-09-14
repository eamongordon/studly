'use server';

import { db } from '@/lib/db';
import { checkpoint } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function completeCheckpoint(
  checkpointId: string,
  lessonId: string
) {
  try {
    await db
      .update(checkpoint)
      .set({ complete: true })
      .where(eq(checkpoint.id, checkpointId));

    revalidatePath(`/chat/${lessonId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to complete checkpoint:', error);
    return { success: false, error: 'Failed to update checkpoint.' };
  }
}
