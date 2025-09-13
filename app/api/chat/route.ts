import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, UIMessage } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai('gpt-4.1'),
    system: 'You are Studly, an AI assistant that helps users with their study plans. Provide clear and friendly answers to their questions.',
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}