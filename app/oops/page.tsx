// app/oops/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function OopsPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const reason = sp.get('reason');

  const message =
    reason === 'no-file'
      ? 'Please upload your notes before choosing a study method.'
      : reason === 'server'
      ? 'We couldn’t start your study session. Please try again.'
      : 'Something went wrong.';

  // Auto-redirect back to home after 2.5s
  useEffect(() => {
    const t = setTimeout(() => router.replace('/'), 2500);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <main className="min-h-[calc(100dvh-64px)] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center rounded-2xl border bg-card p-8 shadow-sm">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-rose-500" />
        </div>
        <h1 className="text-2xl font-semibold mb-2">Oops!</h1>
        <p className="text-muted-foreground mb-6">{message}</p>
        <Button asChild>
          <Link href="/">Go back to home</Link>
        </Button>
        <div className="mt-2 text-[11px] text-muted-foreground">
          You’ll be redirected automatically…
        </div>
      </div>
    </main>
  );
}
