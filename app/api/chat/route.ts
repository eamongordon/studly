import { openai } from '@ai-sdk/openai';
import {
  convertToModelMessages,
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
const maxStepCount = 1;

export async function POST(req: Request) {
  const { messages, lessonId }: { messages: UIMessage[]; lessonId: string } =
    await req.json();
  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: 'You are Studly, an AI assistant that helps users with their study plans. Provide clear and friendly answers to their questions. You also have access to a tool that can generate music based on a given prompt, useful for creating songs to help you memorize concepts or ideas for studying.',
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

          // 1. Find the current checkpoint for the lesson.
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
            };
          }

          const objective = currentCheckpoint.objective;

          // 2. Find the lesson by its ID to get the source notes.
          const currentLesson = await db.query.lesson.findFirst({
            where: eq(lesson.id, lessonId),
          });

          if (!currentLesson || !currentLesson.source) {
            return {
              info: "I couldn't find any notes for this lesson.",
            };
          }

          // 3. Use the lesson's source to generate a response for the current objective.
          const { text: info } = await generateText({
            model: openai('gpt-4o-mini'),
            system: `You are an expert educator. Your task is to explain the given objective based *only* on the provided notes. Do not use any external knowledge.`,
            prompt: `Notes:\n"${currentLesson.source}"\n\nExplain the following objective:\n"${objective}"`,
          });
          console.log("TEXT INFO", info)
          return { info };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
