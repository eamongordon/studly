// app/api/quiz/route.ts
import { NextResponse } from 'next/server';
import { QuizRequestSchema } from '@/lib/quiz-schema';

// very lightweight heuristic generators so we don't rely on external APIs
function parseDashPairs(lines: string[]) {
  // e.g., "Term - definition" or "Term: definition"
  const cards: { q: string; a: string }[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const byDash = line.split(/\s+-\s+|:\s+/);
    if (byDash.length >= 2) {
      const q = byDash[0].trim();
      const a = byDash.slice(1).join(' - ').trim();
      if (q && a) cards.push({ q, a });
    }
  }
  return cards;
}

function clozeFromSentences(text: string) {
  // turns "The mitochondrion is the powerhouse of the cell." into:
  // Q: "_____ is the powerhouse of the cell."  A: "The mitochondrion"
  const cards: { q: string; a: string }[] = [];
  const sentences = text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);

  for (const s of sentences) {
    // look for "X is/are ..." or "X are ..."
    const m = s.match(/^(.{3,40}?)\s+(is|are|was|were)\s+(.{6,200})$/i);
    if (m) {
      const subject = m[1].trim();
      const rest = s.slice(subject.length);
      cards.push({
        q: '_____ ' + rest.trim(),
        a: subject,
      });
      continue;
    }
    // or "Term: definition"
    const byColon = s.split(/:\s+/);
    if (byColon.length >= 2) {
      const term = byColon[0].trim();
      const def = byColon.slice(1).join(': ').trim();
      cards.push({ q: `What is "${term}"?`, a: def });
    }
  }
  return cards;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = QuizRequestSchema.parse({
      notes: body?.notes,
      numCards: Number(body?.numCards ?? 12),
    });

    const rawLines = parsed.notes.split('\n');

    // Priority 1: explicit term-definition lines
    let pairs = parseDashPairs(rawLines);

    // Fallback: cloze cards from sentences
    if (pairs.length < parsed.numCards) {
      const cloze = clozeFromSentences(parsed.notes);
      pairs = [...pairs, ...cloze];
    }

    // Final fallback: chunk lines into Q/A
    if (pairs.length === 0) {
      for (let i = 0; i < rawLines.length - 1; i += 2) {
        const q = rawLines[i].trim();
        const a = rawLines[i + 1].trim();
        if (q && a) pairs.push({ q, a });
      }
    }

    if (pairs.length === 0) {
      return NextResponse.json(
        { error: 'Could not extract Q/A from notes. Add lines like "Term - definition" or "Term: definition".' },
        { status: 400 }
      );
    }

    const cards = pairs.slice(0, parsed.numCards).map((p, idx) => ({
      id: `${Date.now()}-${idx}`,
      question: p.q,
      answer: p.a,
    }));

    return NextResponse.json({ cards });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Invalid request' }, { status: 400 });
  }
}
