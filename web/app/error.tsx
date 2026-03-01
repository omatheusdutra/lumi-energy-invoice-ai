'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { InlineAlert } from '@/components/ui/inline-alert';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void error;
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4">
      <section className="w-full space-y-4 rounded-lg border border-border bg-white p-6 shadow-soft">
        <InlineAlert
          variant="danger"
          title="Algo deu errado no portal"
          description="Recarregue o painel. Se o erro persistir, valide a disponibilidade da API."
        />
        <Button onClick={reset}>Tentar novamente</Button>
      </section>
    </main>
  );
}
