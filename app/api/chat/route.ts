import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, stepCountIs, streamText, tool, UIMessage } from 'ai';
import z from 'zod';
import { SunoService } from '@/lib/suno-service';

export const maxDuration = 30;
const maxStepCount = 5;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: 'You are Studly, an AI assistant that helps users with their study plans. Provide clear and friendly answers to their questions. You also have access to a tool that can generate music based on a given prompt.',
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(maxStepCount),
    tools: {
      generateSong: tool({
        description: "Generates a song using AI",
        inputSchema: z.object({
          prompt: z.string(),
          tags: z.string().optional(),
        }),
        execute: async ({ prompt, tags }) => {
          const clips = await SunoService.generateAndWaitForCompletion({
            prompt,
            tags,
            makeInstrumental: false,
          });
          return {
            clips,
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
