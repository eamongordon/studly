// components/quiz/quizGenerator.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Flashcard } from '@/lib/quiz-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Sparkles, RotateCcw, Keyboard, Check, X } from 'lucide-react';

// Props are optional so this stays compatible everywhere
type Props = { notes?: string; lessonId?: string };

export default function QuizGenerator({ notes: propNotes = '', lessonId }: Props) {
  // --- builder state
  const [notes, setNotes] = useState(propNotes);
  const [numCards, setNumCards] = useState(12);
  const [loading, setLoading] = useState(false);

  // --- quiz state
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState<{ correct: number; wrong: number }>({ correct: 0, wrong: 0 });
  const current = cards[idx];

  // seed notes from props if empty
  useEffect(() => {
    if (propNotes && (!notes || notes.trim() === '')) setNotes(propNotes);
  }, [propNotes]);

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!cards.length) return;
      if (e.key === ' ') { e.preventDefault(); setFlipped(f => !f); }
      if (e.key === 'ArrowRight') setIdx(i => Math.min(i + 1, cards.length - 1));
      if (e.key === 'ArrowLeft') setIdx(i => Math.max(i - 1, 0));
      if (e.key.toLowerCase() === 'y') grade(true);
      if (e.key.toLowerCase() === 'n') grade(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cards.length]);

  const progress = useMemo(
    () => (cards.length ? Math.round(((idx + 1) / cards.length) * 100) : 0),
    [idx, cards.length]
  );

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
      setCards(json.cards as Flashcard[]);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  function grade(correct: boolean) {
    setStats(s => ({ correct: s.correct + (correct ? 1 : 0), wrong: s.wrong + (correct ? 0 : 1) }));
    setFlipped(false);
    setIdx(i => Math.min(i + 1, cards.length - 1));
  }

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
              onChange={e =>
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
            Notes (paste or edit)
          </label>
          <textarea
            className="min-h-40 w-full rounded-xl border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-rose-300"
            placeholder={`Paste notes here.\nExamples:\nPhotosynthesis – process plants use to convert light to chemical energy\nMitochondria: the powerhouse of the cell\nOr write Q:A pairs on separate lines`}
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          <div className="mt-1 text-[11px] text-muted-foreground">
            Tip: Press <kbd className="px-1 py-0.5 rounded bg-muted">Enter</kbd> to add lines; keep it concise for better cards.
          </div>
        </div>
      </div>

      {/* Review card */}
      {cards.length > 0 && (
        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b text-sm">
            <div className="flex items-center gap-3">
              <span className="font-medium">Review</span>
              <span className="text-muted-foreground">{idx + 1} / {cards.length}</span>
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
              onClick={() => setFlipped(f => !f)}
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
                <div
                  className="backface-hidden"
                  style={{ backfaceVisibility: 'hidden' as any }}
                >
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
                <div
                  className="h-1.5 rounded-full bg-rose-400"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-1 text-right text-[11px] text-muted-foreground">{progress}%</div>
            </div>

            {/* Controls */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIdx(i => Math.max(i - 1, 0))}>
                  <ChevronLeft className="mr-2 size-4" />
                  Prev
                </Button>
                <Button variant="outline" onClick={() => setIdx(i => Math.min(i + 1, cards.length - 1))}>
                  Next
                  <ChevronRight className="ml-2 size-4" />
                </Button>
                <Button variant="outline" onClick={() => setFlipped(f => !f)}>
                  Flip
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => grade(false)}>
                  Didn’t know (N)
                </Button>
                <Button onClick={() => grade(true)}>
                  I knew it (Y)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .perspective { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .backface-hidden { backface-visibility: hidden; }
      `}</style>
    </div>
  );
}
