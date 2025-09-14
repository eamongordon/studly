import { openai } from '@ai-sdk/openai';
import {
  convertToModelMessages,
  generateObject,
  generateText,
  stepCountIs,
  streamText,
  tool,
  UIMessage,
} from 'ai';
import z from 'zod';
import { SunoService } from '@/lib/suno-service';
import { db } from '@/lib/db';
import { lesson, checkpoint } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const maxDuration = 30;
const maxStepCount = 2; // Allow for a 2-step tool chain (giveInfo -> generateQuiz)

export async function POST(req: Request) {
  const { messages, lessonId }: { messages: UIMessage[]; lessonId: string } =
    await req.json();
  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: `You are Studly, an AI assistant that helps users with their study plans.
1. When the user asks for information, use the 'giveInfo' tool to provide it based on their notes.
2. After the 'giveInfo' tool returns the information, you MUST then call the 'generateQuiz' tool to create a comprehension question.
You also have access to a tool that can generate music based on a given prompt.`,
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(maxStepCount),
    tools: {
      generateSong: tool({
        description: "Generates a song using AI",
        inputSchema: z.object({
          prompt: z.string().describe("Describe your song!"),
          tags: z.string().optional().describe("Specify genres, instruments, and moods (e.g., 'rock, electric guitar, energetic')"),
        }),
        execute: async ({ prompt, tags }) => {
          const generationResponse = await SunoService.generateSong({
            prompt,
            tags,
            makeInstrumental: false,
          });

          if (!generationResponse.success || !generationResponse.clips) {
            throw new Error(generationResponse.error || "Failed to start generation");
          }
          const clipIds = generationResponse.clips.map((clip) => clip.id);

          const clips = await SunoService.pollForStatus(clipIds, "streaming"); // audio url is available but not complete
          return {
            clips,
          };
        },
      }),
      giveInfo: tool({
        description:
          "Gives info on the current learning objective, based on the user's notes.",
        inputSchema: z.object({}),
        execute: async () => {
          if (!lessonId) {
            return { error: 'Lesson ID is missing.' };
          }

          const currentCheckpoint = await db.query.checkpoint.findFirst({
            where: and(
              eq(checkpoint.lessonId, lessonId),
              eq(checkpoint.complete, false),
            ),
            orderBy: (checkpoint, { asc }) => [asc(checkpoint.order)],
          });

          if (!currentCheckpoint) {
            return {
              info: "It looks like you've completed all objectives for this lesson. Great job!",
              objective: null,
            };
          }

          const objective = currentCheckpoint.objective;

          const currentLesson = await db.query.lesson.findFirst({
            where: eq(lesson.id, lessonId),
          });

          if (!currentLesson || !currentLesson.source) {
            return {
              info: "I couldn't find any notes for this lesson.",
              objective,
            };
          }

          const { text: info } = await generateText({
            model: openai('gpt-4o-mini'),
            system: `You are an expert educator. Your task is to explain the given objective based *only* on the provided notes. Do not use any external knowledge.`,
            prompt: `Notes:\n"${currentLesson.source}"\n\nExplain the following objective:\n"${objective}"`,
          });

          // Return both the info and the objective for the next tool
          return { info, objective };
        },
      }),
      generateQuiz: tool({
        description:
          'Generates a multiple-choice quiz question to check for understanding of a given objective and the information provided.',
        inputSchema: z.object({
          objective: z
            .string()
            .describe('The learning objective the quiz is about.'),
          context: z
            .string()
            .describe(
              'The information provided to the user about the objective.',
            ),
        }),
        execute: async ({ objective, context }) => {
          const { object: quiz } = await generateObject({
            model: openai('gpt-4o-mini'),
            schema: z.object({
              question: z.string(),
              options: z.array(z.string()).length(4),
              answer: z.string(),
            }),
            prompt: `Based on the following information:\n\n"${context}"\n\nGenerate one multiple-choice question to test understanding of this objective: "${objective}". The correct answer must be one of the options.`,
          });
          return quiz;
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
