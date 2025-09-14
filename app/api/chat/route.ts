import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
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
import { LessonMode } from '@/lib/types';

export const maxDuration = 30;
const maxStepCount = 2; // Allow for a 2-step tool chain (giveInfo -> generateQuiz)

export async function POST(req: Request) {
  const {
    messages,
    lessonId,
    mode,
  }: { messages: UIMessage[]; lessonId: string; mode: LessonMode } =
    await req.json();

  const allTools = {
    generateSong: tool({
      description: 'Generates a song using AI',
      inputSchema: z.object({
        prompt: z.string().describe('Describe your song!'),
        tags: z
          .string()
          .optional()
          .describe(
            "Specify genres, instruments, and moods (e.g., 'rock, electric guitar, energetic')"
          ),
      }),
      execute: async ({ prompt, tags }) => {
        const generationResponse = await SunoService.generateSong({
          prompt,
          tags,
          makeInstrumental: false,
        });

        if (!generationResponse.success || !generationResponse.clips) {
          throw new Error(
            generationResponse.error || 'Failed to start generation'
          );
        }
        const clipIds = generationResponse.clips.map(clip => clip.id);

        const clips = await SunoService.pollForStatus(clipIds, 'streaming'); // audio url is available but not complete
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
            eq(checkpoint.complete, false)
          ),
          orderBy: (checkpoint, { asc }) => [asc(checkpoint.order)],
        });

        if (!currentCheckpoint) {
          return {
            info: "It looks like you've completed all objectives for this lesson. Great job!",
            objective: null,
            checkpointId: null,
          };
        }

        const objective = currentCheckpoint.objective;
        const checkpointId = currentCheckpoint.id;

        const currentLesson = await db.query.lesson.findFirst({
          where: eq(lesson.id, lessonId),
        });

        if (!currentLesson || !currentLesson.source) {
          return {
            info: "I couldn't find any notes for this lesson.",
            objective,
            checkpointId,
          };
        }

        const { text: info } = await generateText({
          model: anthropic('claude-3-haiku-20240307'),
          system: `You are an expert educator. Your task is to explain the given objective based *only* on the provided notes. Do not use any external knowledge.`,
          prompt: `Notes:\n"${currentLesson.source}"\n\nExplain the following objective:\n"${objective}"`,
        });

        // Return both the info and the objective for the next tool
        return { info, objective, checkpointId: currentCheckpoint.id };
      },
    }),
    // For non-teach mode so the LLM can still get the user's notes
    fetchNotes: tool({
      description: 'Fetches the notes for the given lesson.',
      inputSchema: z.object({}),
      execute: async () => {
        const lessonData = await db.query.lesson.findFirst({
          where: eq(lesson.id, lessonId),
        });
        if (!lessonData || !lessonData.source) {
          return { error: 'Lesson not found or no notes available.' };
        }
        return { notes: lessonData.source };
    }),
    freeResponse: tool({
      description:
        "Evaluates a user's free response explanation of a concept against the original source material.",
      inputSchema: z.object({
        userExplanation: z.string().describe("The user's explanation."),
        objective: z.string().describe('The learning objective.'),
        context: z.string().describe('The original source material.'),
      }),
      execute: async ({ userExplanation, objective, context }) => {
        const { text: feedback } = await generateText({
          model: anthropic('claude-3-haiku-20240307'),
          system: `You are an expert educator. Your task is to evaluate the user's explanation of an objective based on the provided source material. 
Provide constructive feedback. Identify any inaccuracies or areas for improvement. Keep your feedback concise and encouraging.`,
          prompt: `Objective: "${objective}"\n\nSource Material:\n"${context}"\n\nUser's Explanation:\n"${userExplanation}"`,
        });
        return { feedback };
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
            'The information provided to the user about the objective.'
          ),
        checkpointId: z
          .string()
          .describe('The ID of the checkpoint being quizzed.'),
      }),
      execute: async ({ objective, context, checkpointId }) => {
        const { object: quiz } = await generateObject({
          model: openai('gpt-4o-mini'),
          schema: z.object({
            question: z.string(),
            options: z.array(z.string()).length(4),
            answer: z.string(),
          }),
          prompt: `Based on the following information:\n\n"${context}"\n\nGenerate one multiple-choice question to test understanding of this objective: "${objective}". The correct answer must be one of the options.`,
        });
        return { ...quiz, checkpointId };
      },
    }),
  };

  const tools: any = { 
    generateSong: allTools.generateSong,
  };
  
  // Add giveInfo only for teach mode (it needs checkpoints)
  if (mode === 'teach') {
    tools.giveInfo = allTools.giveInfo;
  } else {
    tools.getNotes = tool({
      description: "Gets the user's uploaded notes",
      inputSchema: z.object({}),
      execute: async () => {
        console.log('📝 GET NOTES TOOL: Getting lesson data for lessonId:', lessonId);
        
        const currentLesson = await db.query.lesson.findFirst({
          where: eq(lesson.id, lessonId),
        });

        if (!currentLesson || !currentLesson.source) {
          return { error: 'No notes found for this lesson.' };
        }
        
        return { notes: currentLesson.source };
      },
    });
  }
  
  if (mode === 'teach') {
    tools.generateQuiz = allTools.generateQuiz;

  }
  
  if (mode === 'flashcard') {
    tools.generateFlashcards = tool({
      description: 'Generates flashcards from the user\'s notes',
      inputSchema: z.object({
        numCards: z.number().optional().describe('Number of flashcards to generate'),
      }),
      execute: async ({ numCards = 12 }) => {
        console.log('🃏 FLASHCARD TOOL: Getting lesson data for lessonId:', lessonId);
        
        // Get the lesson data to access the uploaded file
        const currentLesson = await db.query.lesson.findFirst({
          where: eq(lesson.id, lessonId),
        });
        
        console.log('🃏 FLASHCARD TOOL: Lesson found:', !!currentLesson);
        console.log('🃏 FLASHCARD TOOL: Has source text:', !!currentLesson?.source);
        console.log('🃏 FLASHCARD TOOL: Source length:', currentLesson?.source?.length || 0);
        
        if (!currentLesson || !currentLesson.source) {
          return { error: 'No notes found for this lesson.' };
        }
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/quiz`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: currentLesson.source, numCards }),
        });
        const result = await response.json();
        return result;
      },
    });
  }
  
  if (mode === 'rehearse') {
    tools.compareRehearsal = tool({
      description: 'Compares user\'s recall with the original notes',
      inputSchema: z.object({
        userInput: z.string().describe('What the user wrote from memory'),
      }),
      execute: async ({ userInput }) => {
        console.log('🧠 REHEARSE TOOL: Getting lesson data for lessonId:', lessonId);
        
        // Get the lesson data to access the uploaded file
        const currentLesson = await db.query.lesson.findFirst({
          where: eq(lesson.id, lessonId),
        });
        
        console.log('🧠 REHEARSE TOOL: Lesson found:', !!currentLesson);
        console.log('🧠 REHEARSE TOOL: Has source text:', !!currentLesson?.source);
        console.log('🧠 REHEARSE TOOL: Source length:', currentLesson?.source?.length || 0);
        
        if (!currentLesson || !currentLesson.source) {
          return { error: 'No notes found for this lesson.' };
        }
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/rehearse`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userInput, source: currentLesson.source }),
        });
        const result = await response.json();
        return result;
      },
    });
  }

  // Create system prompt based on mode
  let systemPrompt = `You are Studly, an AI assistant that helps users with their study plans.`;
  if (mode === 'teach') {
    systemPrompt += `
1. When the user asks you for "my notes", or asks for information, use the 'giveInfo' tool to provide it based on their notes.
2. After the 'giveInfo' tool returns the information, you MUST then call the 'generateQuiz' tool to create a comprehension question.`;
  } else if (mode === 'song') {
    systemPrompt += `
You have access to a tool that can generate music based on a given prompt. You also have access to the user's uploaded notes through the 'getNotes' tool. Help users create songs from their study materials.`;
  } else if (mode === 'flashcard') {
    systemPrompt += `
You have access to the user's uploaded notes through the 'getNotes' tool and can generate flashcards using the 'generateFlashcards' tool. When users want flashcards, use the generateFlashcards tool with their notes.`;
  } else if (mode === 'rehearse') {
    systemPrompt += `
You have access to the user's uploaded notes through the 'getNotes' tool and can compare what they recall with their original notes using the 'compareRehearsal' tool. When users write what they remember, use compareRehearsal to provide feedback.`;
  }
  
  if (mode === 'flashcard') {
    tools.generateFlashcards = tool({
      description: 'Generates flashcards from the user\'s notes',
      inputSchema: z.object({
        numCards: z.number().optional().describe('Number of flashcards to generate'),
      }),
      execute: async ({ numCards = 12 }) => {
        console.log('🃏 FLASHCARD TOOL: Getting lesson data for lessonId:', lessonId);
        
        // Get the lesson data to access the uploaded file
        const currentLesson = await db.query.lesson.findFirst({
          where: eq(lesson.id, lessonId),
        });
        
        console.log('🃏 FLASHCARD TOOL: Lesson found:', !!currentLesson);
        console.log('🃏 FLASHCARD TOOL: Has source text:', !!currentLesson?.source);
        console.log('🃏 FLASHCARD TOOL: Source length:', currentLesson?.source?.length || 0);
        
        if (!currentLesson || !currentLesson.source) {
          return { error: 'No notes found for this lesson.' };
        }
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/quiz`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: currentLesson.source, numCards }),
        });
        const result = await response.json();
        return result;
      },
    });
  }
  
  if (mode === 'rehearse') {
    tools.compareRehearsal = tool({
      description: 'Compares user\'s recall with the original notes',
      inputSchema: z.object({
        userInput: z.string().describe('What the user wrote from memory'),
      }),
      execute: async ({ userInput }) => {
        console.log('🧠 REHEARSE TOOL: Getting lesson data for lessonId:', lessonId);
        
        // Get the lesson data to access the uploaded file
        const currentLesson = await db.query.lesson.findFirst({
          where: eq(lesson.id, lessonId),
        });
        
        console.log('🧠 REHEARSE TOOL: Lesson found:', !!currentLesson);
        console.log('🧠 REHEARSE TOOL: Has source text:', !!currentLesson?.source);
        console.log('🧠 REHEARSE TOOL: Source length:', currentLesson?.source?.length || 0);
        
        if (!currentLesson || !currentLesson.source) {
          return { error: 'No notes found for this lesson.' };
        }
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/rehearse`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userInput, source: currentLesson.source }),
        });
        const result = await response.json();
        return result;
      },
    });
  }

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: systemPrompt,
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(maxStepCount),
    tools,
  });

  return result.toUIMessageStreamResponse();
}
