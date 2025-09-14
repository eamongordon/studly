// components/quiz/quizGenerator.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Flashcard } from '@/lib/quiz-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function QuizGenerator() {
  const [notes, setNotes] = useState('');
  const [numCards, setNumCards] = useState(12);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ correct: number; wrong: number }>({ correct: 0, wrong: 0 });

  const current = cards[idx];

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

  const progress = useMemo(() => (cards.length ? ((idx + 1) / cards.length) * 100 : 0), [idx, cards.length]);

  return (
    <div className="flex flex-col gap-4">
      {/* Builder */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-7xl w-full">
  <textarea
    className="min-h-40 w-full rounded-xl border bg-background p-3 text-sm outline-none md:col-span-2"
    placeholder={`Paste notes here.\nExamples:\nPhotosynthesis - process plants use to convert light energy into chemical energy\nMitochondria: the powerhouse of the cell\nOr write pairs on separate lines:`}
    value={notes}
    onChange={e => setNotes(e.target.value)}
  />
  <div className="flex md:flex-row gap-6 right-0">
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground"># Cards</span>
      <Input
        type="number"
        className="w-24"
        min={1}
        max={100}
        value={numCards}
        onChange={e => setNumCards(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
      />
    </div>
    <Button  onClick={generate} disabled={loading || !notes.trim()}>
      {loading ? 'Generating…' : 'Generate Flashcards'}
    </Button>
  </div>
</div>

      {/* Review */}
      {cards.length > 0 && (
        <div className="mt-2">
          <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
            <span>{idx + 1} / {cards.length}</span>
            <span>✔ {stats.correct} · ✖ {stats.wrong}</span>
          </div>

          <div
            className={cn(
              'relative w-full select-none cursor-pointer rounded-2xl border p-6 md:p-10 text-center transition-transform',
              'bg-card shadow-sm hover:shadow',
            )}
            onClick={() => setFlipped(f => !f)}
          >
            <div className={cn('text-base md:text-xl font-medium', flipped && 'opacity-0')}>
              {current?.question}
            </div>
            <div className={cn('absolute inset-0 flex items-center justify-center p-6 md:p-10', !flipped && 'opacity-0')}>
              <div className="text-base md:text-xl font-semibold">{current?.answer}</div>
            </div>
          </div>

          <div className="mt-3 h-1 w-full rounded-full bg-muted">
            <div className="h-1 rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIdx(i => Math.max(i - 1, 0))}>Prev</Button>
              <Button variant="outline" onClick={() => setIdx(i => Math.min(i + 1, cards.length - 1))}>Next</Button>
              <Button variant="outline" onClick={() => setFlipped(f => !f)}>Flip</Button>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => grade(false)}>Didn’t know (N)</Button>
              <Button onClick={() => grade(true)}>I knew it (Y)</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
