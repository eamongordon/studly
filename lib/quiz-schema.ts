// lib/quiz-schema.ts
import { z } from 'zod';

export const QuizRequestSchema = z.object({
  notes: z.string().min(1, 'Notes are required'),
  numCards: z.number().int().min(1).max(100).default(12),
});

export type QuizRequest = z.infer<typeof QuizRequestSchema>;

export const FlashcardSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
});

export type Flashcard = z.infer<typeof FlashcardSchema>;

export const QuizResponseSchema = z.object({
  cards: z.array(FlashcardSchema).min(1),
});

export type QuizResponse = z.infer<typeof QuizResponseSchema>;
