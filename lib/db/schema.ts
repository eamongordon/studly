import { pgTable, text, vector, boolean, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export type LessonMode = "song" | "teach" | "flashcard" | "rehearse";

export const lesson = pgTable("lessons", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  embedding: vector("embedding", { dimensions: 1536 }),
  source: text("source"),
  mode: text("mode", { enum: ["song", "teach", "flashcard", "rehearse"] }).notNull().default("song"),
});

export const checkpoint = pgTable("checkpoints", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  lessonId: text("lesson_id")
    .notNull()
    .references(() => lesson.id),
  order: integer("order").notNull(),
  objective: text("objective").notNull(),
  complete: boolean("complete").notNull().default(false),
});

export const lessonRelations = relations(lesson, ({ many }) => ({
  checkpoints: many(checkpoint),
}));

export const checkpointRelations = relations(checkpoint, ({ one }) => ({
  lesson: one(lesson, {
    fields: [checkpoint.lessonId],
    references: [lesson.id],
  }),
}));

