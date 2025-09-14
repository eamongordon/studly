import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export const createLessonPlan = async (source: string) => {
  const { object: lessonPlan } = await generateObject({
    model: openai('gpt-4o'),
    system: `You are an expert educator. Create a lesson plan with clear objectives based on the provided text. The lesson plan should be a list of short, actionable objectives.`,
    prompt: `Create a lesson plan for the following text: ${source}`,
    schema: z.object({
      objectives: z.array(z.string()),
    }),
  });
  return lessonPlan;
};
