import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, stepCountIs, streamText, tool, UIMessage } from 'ai';
import z from 'zod';
import { SunoService } from '@/lib/suno-service';

export const maxDuration = 30;
const maxStepCount = 1;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: 'You are Studly, an AI assistant that helps users with their study plans. Provide clear and friendly answers to their questions. You also have access to a tool that can generate music based on a given prompt, useful for creating songs to help you memorize concepts or ideas for studying.',
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
          console.log(clips)
          
          return {
            clips,
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
