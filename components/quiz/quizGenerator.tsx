// components/quiz/quizGenerator.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Flashcard } from '@/lib/quiz-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RotateCcw,
  Keyboard,
  Check,
  X,
} from 'lucide-react';

// Accept notes from parent (Chat) so users don't have to paste again
type Props = { notes?: string; lessonId?: string };

// Local base type without id for intermediate steps
type BaseCard = { question: string; answer: string };

// ID helpers
const makeId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function ensureIds(arr: (BaseCard | Flashcard)[]): Flashcard[] {
  return arr.map((c) =>
    (c as Flashcard).id
      ? (c as Flashcard)
      : { id: makeId(), question: c.question, answer: c.answer }
  );
}

export default function QuizGenerator({ notes: propNotes = '', lessonId }: Props) {
  // --- builder state
  const [notes, setNotes] = useState(propNotes);
  const [numCards, setNumCards] = useState(12);
  const [loading, setLoading] = useState(false);

  // --- quiz state
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // stats & bookkeeping
  const [initialCount, setInitialCount] = useState(0); // number of cards at start
  const [stats, setStats] = useState<{ correct: number; wrong: number }>({
    correct: 0,
    wrong: 0,
  });

  // seed notes from props if local notes are empty
  useEffect(() => {
    if (propNotes && (!notes || notes.trim() === '')) setNotes(propNotes);
  }, [propNotes]);

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!cards.length) return;
      if (e.key === ' ') {
        e.preventDefault();
        setFlipped((f) => !f);
      }
      if (e.key === 'ArrowRight')
        setIdx((i) => Math.min(i + 1, Math.max(cards.length - 1, 0)));
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(i - 1, 0));
      if (e.key.toLowerCase() === 'y') grade(true);
      if (e.key.toLowerCase() === 'n') grade(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cards.length]); // rebind when deck size changes

  const current = cards[idx];

  // progress: mastered out of initial
  const progress = useMemo(() => {
    if (!initialCount) return 0;
    return Math.round((stats.correct / initialCount) * 100);
  }, [stats.correct, initialCount]);

  // --- helpers: pad to N if model returns fewer ---
  function derivePairsFromNotes(raw: string): BaseCard[] {
    const out: BaseCard[] = [];
    const lines = raw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    for (const line of lines) {
      // split on -, :, –, — with spaces optional
      const m = line.split(/\s*[-:–—]\s*/, 2);
      if (m.length === 2) {
        const q = m[0].replace(/\?*$/, '?'); // ensure question mark
        const a = m[1];
        if (q && a) out.push({ question: q, answer: a });
      }
    }
    return out;
  }

  function padToN(base: BaseCard[], N: number, rawNotes: string): BaseCard[] {
    if (base.length >= N) return base.slice(0, N);

    const needed = N - base.length;
    const fromNotes = derivePairsFromNotes(rawNotes);

    // de-duplicate naive
    const seen = new Set(base.map((c) => c.question + '||' + c.answer));
    const padded: BaseCard[] = [...base];

    for (const c of fromNotes) {
      const key = c.question + '||' + c.answer;
      if (padded.length >= N) break;
      if (!seen.has(key)) {
        seen.add(key);
        padded.push(c);
      }
    }

    // If still short, lightly paraphrase existing
    let i = 0;
    while (padded.length < N && base.length > 0) {
      const b = base[i % base.length];
      padded.push({
        question: `Another way to ask: ${b.question.replace(/\?+$/, '')}?`,
        answer: b.answer,
      });
      i++;
    }

    return padded.slice(0, N);
  }

  // --- API: generate cards ---
  async function generate() {
    setLoading(true);
    setFlipped(false);
    setIdx(0);
    setStats({ correct: 0, wrong: 0 });

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, numCards }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? 'Failed to generate');

      // Normalize API output to BaseCard[]
      const apiCards: BaseCard[] = ((json.cards as any[]) ?? [])
        .filter(Boolean)
        .map((c) => ({ question: String(c.question), answer: String(c.answer) }));

      // Ensure we have exactly numCards client-side as a safety net
      const baseDeck: BaseCard[] = padToN(apiCards, numCards, notes);

      // 👇 guarantee each card has an id
      const deck: Flashcard[] = ensureIds(baseDeck);

      setCards(deck);
      setInitialCount(deck.length);
      setIdx(0);
      setFlipped(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  // --- grading rules ---
  function grade(correct: boolean) {
    if (!cards.length) return;

    setStats((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      wrong: s.wrong + (correct ? 0 : 1),
    }));
    setFlipped(false);

    setCards((prev) => {
      const cur = prev[idx];
      if (!cur) return prev;

      const next = [...prev];

      if (correct) {
        // remove mastered card
        next.splice(idx, 1);
        // move idx to next valid position
        const nextIdx = Math.min(idx, Math.max(next.length - 1, 0));
        setIdx(nextIdx);
        return next;
      } else {
        // re-queue a fresh copy a few spots later (new id)
        const insertAt = Math.min(prev.length, idx + 3);
        const clone: Flashcard = {
          id: makeId(),
          question: cur.question,
          answer: cur.answer,
        };
        next.splice(insertAt, 0, clone);
        // advance to next item
        setIdx((i) => Math.min(i + 1, Math.max(next.length - 1, 0)));
        return next;
      }
    });
  }

  // --- UI ---
  return (
    <div className="flex flex-col gap-5">
      {/* Builder card */}
      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 opacity-70" />
            <h3 className="text-sm font-semibold">Build your deck</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground"># Cards</span>
            <Input
              type="number"
              className="w-20 h-8 text-sm"
              min={1}
              max={100}
              value={numCards}
              onChange={(e) =>
                setNumCards(Math.max(1, Math.min(100, Number(e.target.value) || 1)))
              }
            />
            <Button size="sm" onClick={generate} disabled={loading || !notes.trim()}>
              {loading ? 'Generating…' : 'Generate'}
            </Button>
          </div>
        </div>

        <div className="p-4">
          <label className="mb-2 block text-xs font-medium text-muted-foreground">
            Notes (already loaded from your upload — edit if needed)
          </label>
          <textarea
            className="min-h-40 w-full rounded-xl border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-rose-300"
            placeholder={`Paste or edit notes here.\nExamples:\nPhotosynthesis – process plants use to convert light to chemical energy\nMitochondria: the powerhouse of the cell\nOr write Q:A pairs on separate lines`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="mt-1 text-[11px] text-muted-foreground">
            Tip: <kbd className="px-1 py-0.5 rounded bg-muted">Enter</kbd> adds lines. Keep it concise for better cards.
          </div>
        </div>
      </div>

      {/* Review card */}
      {cards.length > 0 ? (
        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b text-sm">
            <div className="flex items-center gap-3">
              <span className="font-medium">Review</span>
              <span className="text-muted-foreground">
                {Math.min(idx + 1, initialCount)} / {initialCount}
              </span>
              <span className="text-emerald-600 flex items-center gap-1">
                <Check className="size-4" /> {stats.correct}
              </span>
              <span className="text-rose-600 flex items-center gap-1">
                <X className="size-4" /> {stats.wrong}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Keyboard className="size-4" />
              <span>Space: flip · ←/→: nav · Y/N: grade</span>
              <Button
                size="sm"
                variant="outline"
                className="h-7"
                onClick={() => {
                  setIdx(0);
                  setFlipped(false);
                  setStats({ correct: 0, wrong: 0 });
                }}
                title="Reset session"
              >
                <RotateCcw className="size-4" />
              </Button>
            </div>
          </div>

          {/* Flashcard */}
          <div className="p-5">
            <div
              className={cn(
                'relative mx-auto w-full max-w-3xl cursor-pointer select-none rounded-2xl border bg-background p-8 text-center shadow-sm',
                'transition-transform duration-300 perspective'
              )}
              onClick={() => setFlipped((f) => !f)}
              style={{ perspective: 1000 }}
            >
              <div
                className={cn(
                  'relative transition-transform duration-300 preserve-3d',
                  flipped && 'rotate-y-180'
                )}
                style={{ transformStyle: 'preserve-3d' as any }}
              >
                {/* Front */}
                <div className="backface-hidden" style={{ backfaceVisibility: 'hidden' as any }}>
                  <div className="text-base md:text-xl font-medium leading-relaxed">
                    {current?.question}
                  </div>
                </div>
                {/* Back */}
                <div
                  className="absolute inset-0 rotate-y-180 backface-hidden flex items-center justify-center"
                  style={{ backfaceVisibility: 'hidden' as any }}
                >
                  <div className="text-base md:text-xl font-semibold leading-relaxed">
                    {current?.answer}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-5">
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div className="h-1.5 rounded-full bg-rose-400" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-1 text-right text-[11px] text-muted-foreground">{progress}% mastered</div>
            </div>

            {/* Controls */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIdx((i) => Math.max(i - 1, 0))}>
                  <ChevronLeft className="mr-2 size-4" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIdx((i) => Math.min(i + 1, Math.max(cards.length - 1, 0)))}
                >
                  Next
                  <ChevronRight className="ml-2 size-4" />
                </Button>
                <Button variant="outline" onClick={() => setFlipped((f) => !f)}>
                  Flip
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => grade(false)}>
                  Didn’t know (N)
                </Button>
                <Button onClick={() => grade(true)}>I knew it (Y)</Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Session empty (before generate or after mastering all)
        <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
          {initialCount > 0 ? (
            <div>
              <div className="text-lg font-semibold mb-1">Session complete 🎉</div>
              <div className="mb-3">
                Correct: {stats.correct} · Wrong: {stats.wrong}
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" onClick={() => setInitialCount(0)}>
                  Build another deck
                </Button>
              </div>
            </div>
          ) : (
            <div>
              Paste notes and click <span className="font-medium">Generate</span> to start.
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .perspective {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
}
