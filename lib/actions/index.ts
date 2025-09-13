"use server";

import { generateEmbedding } from './embeddings';
import { processFile } from './process-file';

export const generateEmbeddingsFromFile = async (formData: FormData) => {
  const processedFileResult = await processFile(formData);

  if ('error' in processedFileResult) {
    return processedFileResult;
  }

  if (!processedFileResult.text) {
    return { error: 'Could not extract text from file.' };
  }

  try {
    const embedding = await generateEmbedding(processedFileResult.text);
    return { embedding };
  } catch (error) {
    console.error(error);
    return { error: 'Error generating embeddings' };
  }
};
