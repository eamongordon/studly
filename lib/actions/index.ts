"use server";

import { eq } from 'drizzle-orm';
import { db } from '../db';
import { lesson } from '../db/schema';
import { generateEmbedding } from '../fetchers/embeddings';
import { processFile } from '../fetchers/process-file';
import { LessonMode } from '../types';

export const createLesson = async (formData: FormData, mode: LessonMode) => {
  const processedFileResult = await processFile(formData);

  if ('error' in processedFileResult) {
    return processedFileResult;
  }

  if (!processedFileResult.text) {
    return { error: 'Could not extract text from file.' };
  }

  try {
    const embeddingResult = await generateEmbedding(processedFileResult.text);

    if ('error' in embeddingResult) {
      return embeddingResult;
    }

    const [newLesson] = await db
      .insert(lesson)
      .values({
        source: processedFileResult.text,
        embedding: embeddingResult.embedding,
        mode: mode,
      })
      .returning({ id: lesson.id });

    return newLesson.id;
  } catch (error) {
    console.error(error);
    throw new Error('Error generating embeddings or saving lesson');
  }
};

export const getLessonData = async (lessonId: string) => {
  const lessonData = await db.query.lesson.findFirst({
    where: eq(lesson.id, lessonId),
  });

  return lessonData;
};
