// app/api/quiz/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai"; // or your provider

const Card = z.object({
  question: z.string().min(3),
  answer: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const { notes, numCards } = await req.json();

    if (!notes || typeof notes !== "string" || !notes.trim()) {
      return Response.json({ error: "Missing notes" }, { status: 400 });
    }

    const N = Math.max(1, Math.min(100, Number(numCards) || 12));

    // Dynamic schema: exactly N cards
    const Output = z.object({
      cards: z.array(Card).length(N),
    });

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"), // pick your model
      schema: Output,
      system:
        "You create concise, factual flashcards. Respect the requested count exactly.",
      prompt: [
        `Make exactly ${N} high-quality Q/A flashcards from the user's notes.`,
        `Keep each question and answer short (<= 1–2 sentences).`,
        `If the notes are sparse, extrapolate reasonable basics.`,
        `No preambles or explanations; return JSON only.`,
        "",
        "NOTES:",
        notes,
      ].join("\n"),
    });

    return Response.json(object);
  } catch (e: any) {
    console.error(e);
    return Response.json({ error: "Failed to generate cards" }, { status: 500 });
  }
}
