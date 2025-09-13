"use server";

import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';

const embeddingModel = openai.embedding('text-embedding-3-small');

export const generateEmbedding = async (
  value: string,
) => {
  const embedding = await embed({
    model: embeddingModel,
    value: value,
  });
  return embedding;
};