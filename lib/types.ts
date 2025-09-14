import { lesson } from "./db/schema";

export type LessonMode = 'song' | 'teach' | 'flashcard' | 'rehearse';
export type Lesson = typeof lesson.$inferSelect;
