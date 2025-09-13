'use client'

import QuizGenerator from '@/components/quiz/quizGenerator'
import { X } from 'lucide-react'

export default function ActiveRecallModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl bg-background p-4 md:p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Active Recall Flashcards"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          aria-label="Close flashcards"
          className="absolute right-3 top-3 inline-flex items-center justify-center rounded-lg p-2 hover:bg-muted"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>
        <QuizGenerator />
      </div>
    </div>
  )
}
