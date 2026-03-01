import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <Card className="rounded-2xl border border-rose-200/80 bg-white/95 shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-rose-700">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          Falha ao carregar dashboard
        </CardTitle>
        <CardDescription className="text-slate-600">{message}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" variant="danger" onClick={onRetry} className="gap-2">
          <RotateCw className="h-4 w-4" aria-hidden="true" />
          Tentar novamente
        </Button>
      </CardContent>
    </Card>
  );
}
